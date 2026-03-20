# Chat Streaming UI Overhaul

## Overview

This document details the improvements made to the streaming chat UI in `app/chat/page.tsx` and `app/globals.css`. The overhaul addresses three compounding performance problems that caused the AI response to feel janky — text popping in unevenly, markdown flickering during the stream, and wasted render work on every incoming token.

---

## Problems with the Original Implementation

### 1. `setMessages` Called on Every Token

The original `ws.onmessage` handler called `setMessages()` on every single token that arrived over the WebSocket:

```ts
// Before
streamBuffer += token;
const buffered = streamBuffer;
setMessages((prev) => { ... }); // fired on every token
```

GPT-4o streams at roughly 30–80 tokens per second. This meant React was re-rendering the entire message list up to 80 times per second — far exceeding the 60fps refresh rate of a monitor. The excess renders produced no visible improvement for the user; they were pure wasted work.

### 2. ReactMarkdown Re-parsing an Incomplete String

Every token update immediately passed the growing string into `<ReactMarkdown>` for parsing. During streaming, the markdown is always in an incomplete state — a `**bold**` marker might have its opening `**` but not its closing one yet, a list item might be mid-sentence.

The parser produced different DOM output for the same eventual string depending on how far along it was. This caused visible flickering — bold text appearing and disappearing, bullet points jumping in and out — because the DOM structure was changing on every single render.

### 3. No Cleanup on Unexpected Close

If the WebSocket closed mid-stream, the old `streamBuffer` local variable and any in-flight state update had no cancellation path. This risked ghost renders or stale state being committed after the socket was already gone.

---

## The Fix

### Token Batching via `requestAnimationFrame`

Two new refs replace the old local `streamBuffer` variable:

```ts
const tokenBufferRef = useRef<string>("");   // accumulates raw tokens
const rafRef         = useRef<number | null>(null); // tracks pending rAF handle
```

Tokens now accumulate silently in `tokenBufferRef` — a plain ref, not state — so React does not re-render when it updates. A `requestAnimationFrame` is scheduled on the first token of each batch, and only when the browser is ready to paint the next frame does `setMessages()` fire:

```ts
ws.onmessage = (event: MessageEvent) => {
  const token: string = event.data;

  if (token === "[DONE]") {
    // Cancel pending rAF, do one final flush with the complete string
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const finalContent = tokenBufferRef.current;
    tokenBufferRef.current = "";
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.id === "streaming") {
        return [...prev.slice(0, -1), { ...last, id: `ai-${Date.now()}`, content: finalContent }];
      }
      return prev;
    });
    setSending(false);
    return;
  }

  tokenBufferRef.current += token;

  if (rafRef.current === null) {
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const buffered = tokenBufferRef.current;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "ai" && last?.id === "streaming") {
          return [...prev.slice(0, -1), { ...last, content: buffered }];
        }
        return [...prev, { id: "streaming", role: "ai", content: buffered, created_at: new Date().toISOString() }];
      });
    });
  }
};
```

This caps renders at ~60 per second and aligns every state update with an actual browser paint. Each flush delivers several tokens worth of content at once, so text flows in smoothly rather than popping character by character.

**The key insight:** a ref update is free; a state update is expensive. The rAF acts as a natural throttle that respects how browsers work.

### Plain Text During Streaming, Markdown After

The AI bubble render is now split into two explicit branches based on whether the message is still streaming:

```tsx
{msg.id === "streaming" ? (
  // Streaming: raw text + cursor — no markdown parsing
  <span className="text-sm leading-relaxed whitespace-pre-wrap streaming-text">
    {msg.content}
    <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-gray-400 animate-pulse rounded-sm align-middle" />
  </span>
) : (
  // Settled: full markdown render on the complete, well-formed string
  <ReactMarkdown components={{ ... }}>
    {msg.content}
  </ReactMarkdown>
)}
```

While `id === "streaming"`, the content is a plain `<span>` with `whitespace-pre-wrap`. No markdown parsing, no DOM thrash, no flickering. `ReactMarkdown` is only invoked once — after `[DONE]` fires and the string is complete. The user sees the blinking cursor disappear and the text reformat in a single clean swap.

### Cleanup on Close

`ws.onclose` now explicitly cancels any pending animation frame and resets the buffer before calling `setSending(false)`:

```ts
ws.onclose = () => {
  if (rafRef.current !== null) {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }
  tokenBufferRef.current = "";
  setSending(false);
};
```

This ensures no ghost renders occur if the socket closes unexpectedly mid-stream.

### Subtle Fade on Each Batch (globals.css)

A gentle 80ms fade is applied to the streaming span via a CSS animation:

```css
@keyframes word-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.streaming-text {
  animation: word-in 80ms ease-out;
}
```

Because React replaces the streaming element on each rAF flush, the animation fires once per batch — producing a soft fade on each chunk of new text rather than an abrupt appearance.

---

## Render Timeline Comparison

```
BEFORE — one state update per token:

WebSocket:    t1  t2  t3  t4  t5  t6  t7  t8  ...  (~80/sec)
setMessages:   ↑   ↑   ↑   ↑   ↑   ↑   ↑   ↑       (~80 renders/sec)
ReactMarkdown: re-parses incomplete string every time


AFTER — rAF-batched updates:

WebSocket:    t1  t2  t3  t4 | t5  t6  t7  t8 | t9  t10  ...
                              ↑                ↑
                         rAF flush        rAF flush       (~60/sec)
setMessages:                  ↑                ↑          (~60 renders/sec)
ReactMarkdown: called once only, after [DONE], on complete string
```

---

## Files Changed

| File | Change |
|---|---|
| `app/chat/page.tsx` | Added `tokenBufferRef` + `rafRef`; replaced `ws.onmessage` with rAF-batched handler; updated `ws.onclose` with cleanup; split AI bubble render into streaming vs settled branches |
| `app/globals.css` | Added `@keyframes word-in` and `.streaming-text` utility class |

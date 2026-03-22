"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import ReactMarkdown from "react-markdown";
import { TextShimmerLoader } from "@/components/ui/loader";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ChatMessage {
  id:         string;
  role:       "human" | "ai";
  content:    string;
  created_at: string;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const API_URL    = process.env.NEXT_PUBLIC_API_URL ?? "";
const WS_BASE    = API_URL.replace(/^http/, "ws");
const TITLE_SLICE = 50;   // chars before " ..."

function authHeaders(session: Session) {
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

// ─────────────────────────────────────────────
// Chat page
// ─────────────────────────────────────────────

function ChatPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const sessionId    = searchParams.get("session");

  const [session,        setSession]        = useState<Session | null>(null);
  const [messages,       setMessages]       = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [input,          setInput]          = useState("");
  const [sending,        setSending]        = useState(false);

  const wsRef              = useRef<WebSocket | null>(null);
  const bottomRef          = useRef<HTMLDivElement>(null);
  const tokenBufferRef     = useRef<string>("");
  const rafRef             = useRef<number | null>(null);
  const pendingFirstMsgRef = useRef<string | null>(null);  // queued before WS opens

  // ── Auto-scroll ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Auth check ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      setSession(session);
    });
  }, [router]);

  // ── Cleanup WebSocket on unmount ──
  useEffect(() => {
    return () => { wsRef.current?.close(); };
  }, []);

  // ─────────────────────────────────────────────
  // Open session when URL param changes
  // ─────────────────────────────────────────────

  const openSession = useCallback(async (sid: string, s: Session) => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setMessages([]);
    setLoadingHistory(true);

    try {
      const res = await fetch(
        `${API_URL}/chat/sessions/${sid}/messages`,
        { headers: authHeaders(s) }
      );
      if (!res.ok) throw new Error();
      setMessages(await res.json());
    } catch {
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }

    const ws = new WebSocket(`${WS_BASE}/ws/chat/${sid}?token=${s.access_token}`);

    // If a first message was queued (session created on send), fire it now
    ws.onopen = () => {
      const pending = pendingFirstMsgRef.current;
      if (pending) {
        pendingFirstMsgRef.current = null;
        setMessages([{
          id:         `local-${Date.now()}`,
          role:       "human",
          content:    pending,
          created_at: new Date().toISOString(),
        }]);
        setSending(true);
        ws.send(pending);
      }
    };

    ws.onmessage = (event: MessageEvent) => {
      const token: string = event.data;

      if (token === "[DONE]") {
        if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
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

    ws.onclose = () => {
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      tokenBufferRef.current = "";
      setSending(false);
    };

    wsRef.current = ws;
  }, []);

  // ── React to sessionId changes ──
  // Open the session when one is present; reset to fresh state when there's none
  // (e.g. user navigates to /chat via "Chat" link or "New Chat" button).
  useEffect(() => {
    if (session && sessionId) {
      openSession(sessionId, session);
    } else if (!sessionId) {
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      setMessages([]);
      setSending(false);
    }
  }, [sessionId, session, openSession]);

  // ─────────────────────────────────────────────
  // Send message
  // ─────────────────────────────────────────────

  async function handleSend() {
    const text = input.trim();
    if (!text || !session || sending) return;

    // ── No session yet: create one using the first message as the title ──
    if (!sessionId) {
      const title = text.length > TITLE_SLICE
        ? text.slice(0, TITLE_SLICE) + " ..."
        : text;
      try {
        const res = await fetch(`${API_URL}/chat/sessions`, {
          method:  "POST",
          headers: authHeaders(session),
          body:    JSON.stringify({ first_message: title }),
        });
        if (!res.ok) throw new Error();
        const newSess = await res.json();
        // Store message so ws.onopen can send it once the socket connects
        pendingFirstMsgRef.current = text;
        setInput("");
        // Tell the sidebar a new session exists
        window.dispatchEvent(new CustomEvent("chat-session-created"));
        // Navigate → triggers openSession → WS opens → ws.onopen fires
        router.push(`/chat?session=${newSess.id}`);
      } catch {}
      return;
    }

    // ── Existing session: send normally ──
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "human", content: text, created_at: new Date().toISOString() },
    ]);
    setSending(true);
    setInput("");
    wsRef.current.send(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // ─────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex flex-col"
      style={{
        backgroundImage:      "url('/images/login-hero.svg')",
        backgroundSize:       "cover",
        backgroundPosition:   "center",
        backgroundRepeat:     "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* ── Message area — always rendered ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

          {/* Fresh chat state — no session yet */}
          {!sessionId && (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-400 text-sm">Ask anything about Boston neighborhoods.</p>
            </div>
          )}

          {loadingHistory && (
            <p className="text-sm text-gray-400 text-center animate-pulse">
              Loading conversation…
            </p>
          )}

          {!loadingHistory && sessionId && messages.length === 0 && (
            <p className="text-sm text-gray-400 text-center">
              Send a message to start the conversation.
            </p>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "human" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "human"
                    ? "bg-[#016B51] text-white rounded-br-sm"
                    : "bg-white/20 border border-[#016B51]/20 backdrop-blur-md text-gray-800 rounded-bl-sm"
                }`}
              >
                {msg.role === "human" ? (
                  msg.content
                ) : msg.id === "streaming" ? (
                  <span className="text-sm leading-relaxed whitespace-pre-wrap streaming-text">
                    {msg.content}
                    <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-gray-400 animate-pulse rounded-sm align-middle" />
                  </span>
                ) : (
                  <ReactMarkdown
                    components={{
                      p:      ({ children }) => <p className="text-sm leading-relaxed">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      ul:     ({ children }) => <ul className="list-disc list-outside ml-4 space-y-0.5 text-sm">{children}</ul>,
                      ol:     ({ children }) => <ol className="list-decimal list-outside ml-4 space-y-0.5 text-sm">{children}</ol>,
                      li:     ({ children }) => <li className="leading-relaxed">{children}</li>,
                      h1:     ({ children }) => <h1 className="text-base font-semibold mt-3 mb-1">{children}</h1>,
                      h2:     ({ children }) => <h2 className="text-sm font-semibold mt-3 mb-1">{children}</h2>,
                      h3:     ({ children }) => <h3 className="text-sm font-medium mt-2 mb-1">{children}</h3>,
                      code:   ({ children }) => <code className="bg-gray-100 text-gray-800 rounded px-1 py-0.5 text-xs font-mono">{children}</code>,
                    }}
                  >{msg.content}</ReactMarkdown>
                )}
              </div>
            </div>
          ))}

          {sending && !messages.some((m) => m.id === "streaming") && (
            <div className="flex justify-start">
              <div className="max-w-xl rounded-2xl px-4 py-3 bg-white/20 border border-[#016B51]/20 backdrop-blur-md rounded-bl-sm">
                <TextShimmerLoader text="Thinking..." />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input bar — always visible ── */}
        <div className="flex-shrink-0 border-t border-[#016B51]/20 bg-verdict/40 backdrop-blur-xl px-6 py-4">
          <div className="flex items-end gap-3">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              placeholder="Ask about Boston neighborhoods…"
              className="flex-1 resize-none rounded-xl border border-[#016B51]/20 bg-white/10 px-4 py-2.5 text-sm/6 text-gray-900 placeholder:text-gray-400 shadow-sm backdrop-blur-sm focus:outline-2 focus:-outline-offset-2 focus:outline-white/25 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="inline-flex items-center rounded-lg border border-[#016B51]/40 bg-white/10 px-4 py-2.5 text-sm/6 font-semibold text-gray-900 backdrop-blur-sm hover:bg-white/20 disabled:opacity-50 transition-colors"
            >
              {sending ? "…" : "Send"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Press Enter to send · Shift+Enter for a new line
          </p>
        </div>

      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    }>
      <ChatPageInner />
    </Suspense>
  );
}

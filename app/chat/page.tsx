"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ChatSession {
  id:         string;
  title:      string;
  created_at: string;
}

interface ChatMessage {
  id:         string;
  role:       "human" | "ai";
  content:    string;
  created_at: string;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Derive WebSocket base URL from the HTTP API URL
// e.g. http://localhost:8000 → ws://localhost:8000
const WS_BASE = API_URL.replace(/^http/, "ws");

function authHeaders(session: Session) {
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

// ─────────────────────────────────────────────
// Chat page
// ─────────────────────────────────────────────

export default function ChatPage() {
  const router = useRouter();
  const [session, setSession]           = useState<Session | null>(null);

  // Sessions sidebar
  const [sessions, setSessions]         = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Messages in active session
  const [messages, setMessages]         = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Input + sending state
  const [input, setInput]               = useState("");
  const [sending, setSending]           = useState(false);

  // WebSocket ref — persists across renders without causing re-renders
  const wsRef     = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Auto-scroll to bottom when messages change ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Auth check ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      setSession(session);
      fetchSessions(session);
    });
  }, [router]);

  // ── Cleanup WebSocket on unmount ──
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  // ─────────────────────────────────────────────
  // Fetch all sessions for the sidebar
  // ─────────────────────────────────────────────

  async function fetchSessions(s: Session) {
    setLoadingSessions(true);
    try {
      const res = await fetch(`${API_URL}/chat/sessions`, { headers: authHeaders(s) });
      if (!res.ok) throw new Error();
      const data: ChatSession[] = await res.json();
      setSessions(data);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }

  // ─────────────────────────────────────────────
  // Load history for a session and open WebSocket
  // ─────────────────────────────────────────────

  const openSession = useCallback(async (sessionId: string, s: Session) => {
    // Close any existing WebSocket first
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setActiveSessionId(sessionId);
    setMessages([]);
    setLoadingHistory(true);

    // Load message history
    try {
      const res = await fetch(
        `${API_URL}/chat/sessions/${sessionId}/messages`,
        { headers: authHeaders(s) }
      );
      if (!res.ok) throw new Error();
      const history: ChatMessage[] = await res.json();
      setMessages(history);
    } catch {
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }

    // Open WebSocket for this session
    const ws = new WebSocket(
      `${WS_BASE}/ws/chat/${sessionId}?token=${s.access_token}`
    );

    // Buffer to accumulate the streaming AI response
    let streamBuffer = "";

    ws.onmessage = (event: MessageEvent) => {
      const token: string = event.data;

      if (token === "[DONE]") {
        // Streaming finished — replace the temporary 'streaming' id
        // with a stable unique one so the next turn can reuse 'streaming'.
        setMessages((prev) => prev.map((m) =>
          m.id === "streaming" ? { ...m, id: `ai-${Date.now()}` } : m
        ));
        streamBuffer = "";
        setSending(false);
        return;
      }

      streamBuffer += token;
      const buffered = streamBuffer;

      // Update the last message (AI bubble) in place as tokens arrive
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "ai" && last.id === "streaming") {
          return [
            ...prev.slice(0, -1),
            { ...last, content: buffered },
          ];
        }
        // First token — add a new streaming AI bubble
        return [
          ...prev,
          {
            id:         "streaming",
            role:       "ai",
            content:    buffered,
            created_at: new Date().toISOString(),
          },
        ];
      });
    };

    ws.onclose = () => {
      setSending(false);
    };

    wsRef.current = ws;
  }, []);

  // ─────────────────────────────────────────────
  // Create a new session and open it
  // ─────────────────────────────────────────────

  async function handleNewChat() {
    if (!session) return;
    const placeholder = "New conversation";

    try {
      const res = await fetch(`${API_URL}/chat/sessions`, {
        method:  "POST",
        headers: authHeaders(session),
        body:    JSON.stringify({ first_message: placeholder }),
      });
      if (!res.ok) throw new Error();
      const newSession: ChatSession = await res.json();

      setSessions((prev) => [newSession, ...prev]);
      await openSession(newSession.id, session);
    } catch { /* silently ignore */ }
  }

  // ─────────────────────────────────────────────
  // Send a message over the WebSocket
  // ─────────────────────────────────────────────

  function handleSend() {
    const text = input.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Optimistically add the human message to the UI
    setMessages((prev) => [
      ...prev,
      {
        id:         `local-${Date.now()}`,
        role:       "human",
        content:    text,
        created_at: new Date().toISOString(),
      },
    ]);

    setSending(true);
    setInput("");
    wsRef.current.send(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleSignOut() {
    wsRef.current?.close();
    await supabase.auth.signOut();
    router.replace("/login");
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

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold text-gray-900">Neighborhood Analysis</span>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Analysis
              </Link>
              <Link
                href="/chat"
                className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-0.5"
              >
                Chat
              </Link>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Body — sidebar + main */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">

          {/* New Chat button */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={handleNewChat}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + New Chat
            </button>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingSessions ? (
              <p className="text-xs text-gray-400 px-2 py-4 text-center">Loading…</p>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-gray-400 px-2 py-4 text-center">
                No conversations yet.
              </p>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => openSession(s.id, session)}
                  className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                    activeSessionId === s.id
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <p className="truncate">{s.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ── Main chat area ── */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Empty state */}
          {!activeSessionId && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-gray-500 text-sm">
                  Select a conversation or start a new one.
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          {activeSessionId && (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

                {loadingHistory && (
                  <p className="text-sm text-gray-400 text-center animate-pulse">
                    Loading conversation…
                  </p>
                )}

                {!loadingHistory && messages.length === 0 && (
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
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                      {msg.id === "streaming" && (
                        <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-gray-400 animate-pulse rounded-sm align-middle" />
                      )}
                    </div>
                  </div>
                ))}

                <div ref={bottomRef} />
              </div>

              {/* Input bar */}
              <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4">
                <div className="flex items-end gap-3">
                  <textarea
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                    placeholder="Ask about Boston neighborhoods…"
                    className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {sending ? "…" : "Send"}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Press Enter to send · Shift+Enter for a new line
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

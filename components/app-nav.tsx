"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, MapPin, MessageSquare, PlusCircle } from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ChatSession {
  id:         string;
  title:      string;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// ─────────────────────────────────────────────
// Nav content — shared between desktop and Sheet
// ─────────────────────────────────────────────

function NavContent({
  session,
  pathname,
  chatSessions,
  loadingSessions,
  activeChatSessionId,
  onNewChat,
  onSelectSession,
  onSignOut,
}: {
  session:              Session | null;
  pathname:             string;
  chatSessions:         ChatSession[];
  loadingSessions:      boolean;
  activeChatSessionId:  string | null;
  onNewChat:            () => void;
  onSelectSession:      (id: string) => void;
  onSignOut:            () => void;
}) {
  const isChat     = pathname === "/chat";
  const isDashboard = pathname === "/dashboard";

  return (
    <div className="flex flex-col h-full px-3 py-5 gap-1">

      {/* Brand */}
      <div className="px-3 mb-6">
        <h1 style={{ fontFamily: 'var(--font-nanum-myeongjo)' }} className="text-xl font-bold text-white tracking-tight">
          The Hunt
        </h1>
      </div>

      {/* Analysis link */}
      <Link
        href="/dashboard"
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm/6 font-medium transition-colors ${
          isDashboard
            ? "bg-[#649E97]/20 border border-[#649E97]/30 text-white"
            : "text-white/60 hover:bg-white/10 hover:text-white"
        }`}
      >
        <MapPin className="size-4 shrink-0" />
        Analysis
      </Link>

      {/* Chat link */}
      <Link
        href="/chat"
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm/6 font-medium transition-colors ${
          isChat
            ? "bg-[#649E97]/20 border border-[#649E97]/30 text-white"
            : "text-white/60 hover:bg-white/10 hover:text-white"
        }`}
      >
        <MessageSquare className="size-4 shrink-0" />
        Chat
      </Link>

      {/* Chat sessions — only on /chat */}
      {isChat && (
        <div className="mt-4 flex flex-col gap-1 flex-1 min-h-0">
          <button
            onClick={onNewChat}
            className="flex items-center gap-2 w-full rounded-lg border border-[#649E97]/40 bg-white/10 px-3 py-1.5 text-sm/6 font-medium text-white backdrop-blur-sm hover:bg-white/15 transition-colors"
          >
            <PlusCircle className="size-4 shrink-0" />
            New Chat
          </button>

          <div className="mt-2 flex-1 overflow-y-auto space-y-0.5">
            {loadingSessions ? (
              <p className="text-xs text-white/40 px-3 py-2">Loading…</p>
            ) : chatSessions.length === 0 ? (
              <p className="text-xs text-white/40 px-3 py-2">No conversations yet.</p>
            ) : (
              chatSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  className={`w-full text-left rounded-lg px-3 py-2 transition-colors ${
                    activeChatSessionId === s.id
                      ? "bg-[#649E97]/20 border border-[#649E97]/30"
                      : "hover:bg-white/10"
                  }`}
                >
                  <p className="truncate text-xs font-medium text-white/90">{s.title}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sign out */}
      <div className="mt-auto pt-4 border-t border-white/10">
        <button
          onClick={onSignOut}
          className="text-sm/6 text-white/40 hover:text-white transition-colors px-3"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AppNav
// ─────────────────────────────────────────────

export function AppNav() {
  const router   = useRouter();
  const pathname = usePathname();

  const [session,         setSession]         = useState<Session | null>(null);
  const [chatSessions,    setChatSessions]     = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions]  = useState(false);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const isChat = pathname === "/chat";

  useEffect(() => setMounted(true), []);

  // ── Auth ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  // ── Fetch chat sessions when on /chat ──
  useEffect(() => {
    if (!session || !isChat) return;
    fetchChatSessions(session);
  }, [session, isChat]);

  // ── Re-fetch when chat/page.tsx creates a new session on first send ──
  useEffect(() => {
    function onSessionCreated() {
      if (session) fetchChatSessions(session);
    }
    window.addEventListener("chat-session-created", onSessionCreated);
    return () => window.removeEventListener("chat-session-created", onSessionCreated);
  }, [session]);

  // Don't render nav on login page (must be after all hooks)
  if (pathname === "/login") return null;

  async function fetchChatSessions(s: Session) {
    setLoadingSessions(true);
    try {
      const res = await fetch(`${API_URL}/chat/sessions`, {
        headers: { Authorization: `Bearer ${s.access_token}` },
      });
      if (!res.ok) throw new Error();
      const data: ChatSession[] = await res.json();
      setChatSessions(data);
    } catch {
      setChatSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }

  function handleNewChat() {
    setActiveChatSessionId(null);
    router.push("/chat");
  }

  function handleSelectSession(id: string) {
    setActiveChatSessionId(id);
    router.push(`/chat?session=${id}`);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const navProps = {
    session,
    pathname,
    chatSessions,
    loadingSessions,
    activeChatSessionId,
    onNewChat:       handleNewChat,
    onSelectSession: handleSelectSession,
    onSignOut:       handleSignOut,
  };

  return (
    <>
      {/* ── Desktop sidebar — always visible ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-56 flex-col bg-[#006B4E] border-r border-[#649E97]/30 z-40">
        <NavContent {...navProps} />
      </aside>

      {/* ── Mobile top bar + Sheet ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center px-4 py-3 bg-[#006B4E] border-b border-[#649E97]/30">
        {mounted && (
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-1 rounded-lg text-white hover:bg-white/10 transition-colors" aria-label="Open menu">
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              showCloseButton={true}
              className="w-full bg-[#006B4E] border-r border-[#649E97]/30 p-0"
            >
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <NavContent {...navProps} />
            </SheetContent>
          </Sheet>
        )}
        <span style={{ fontFamily: 'var(--font-nanum-myeongjo)' }} className="ml-3 text-sm font-bold text-white">The Hunt</span>
      </div>
    </>
  );
}

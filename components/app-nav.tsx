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
        <span className="text-sm font-semibold text-gray-900 tracking-tight">
          Neighborhood Analysis
        </span>
      </div>

      {/* Analysis link */}
      <Link
        href="/dashboard"
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm/6 font-medium transition-colors ${
          isDashboard
            ? "bg-[#016B51]/10 border border-[#016B51]/20 text-gray-900"
            : "text-gray-600 hover:bg-white/20 hover:text-gray-900"
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
            ? "bg-[#016B51]/10 border border-[#016B51]/20 text-gray-900"
            : "text-gray-600 hover:bg-white/20 hover:text-gray-900"
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
            className="flex items-center gap-2 w-full rounded-lg border border-[#016B51]/40 bg-white/10 px-3 py-1.5 text-sm/6 font-medium text-gray-900 backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            <PlusCircle className="size-4 shrink-0" />
            New Chat
          </button>

          <div className="mt-2 flex-1 overflow-y-auto space-y-0.5">
            {loadingSessions ? (
              <p className="text-xs text-gray-400 px-3 py-2">Loading…</p>
            ) : chatSessions.length === 0 ? (
              <p className="text-xs text-gray-400 px-3 py-2">No conversations yet.</p>
            ) : (
              chatSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  className={`w-full text-left rounded-lg px-3 py-2 transition-colors ${
                    activeChatSessionId === s.id
                      ? "bg-[#016B51]/10 border border-[#016B51]/20"
                      : "hover:bg-white/20"
                  }`}
                >
                  <p className="truncate text-xs font-medium text-gray-800">{s.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sign out */}
      <div className="mt-auto pt-4 border-t border-[#016B51]/10">
        <button
          onClick={onSignOut}
          className="text-sm/6 text-gray-500 hover:text-gray-900 transition-colors px-3"
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

  const isChat = pathname === "/chat";

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

  async function handleNewChat() {
    if (!session) return;
    try {
      const res = await fetch(`${API_URL}/chat/sessions`, {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ first_message: "New conversation" }),
      });
      if (!res.ok) throw new Error();
      const newSession: ChatSession = await res.json();
      setChatSessions((prev) => [newSession, ...prev]);
      setActiveChatSessionId(newSession.id);
      router.push(`/chat?session=${newSession.id}`);
    } catch {}
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
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-56 flex-col bg-verdict/40 border-r border-[#016B51]/20 backdrop-blur-2xl z-40">
        <NavContent {...navProps} />
      </aside>

      {/* ── Mobile top bar + Sheet ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center px-4 py-3 bg-verdict/40 backdrop-blur-2xl border-b border-[#016B51]/20">
        <Sheet>
          <SheetTrigger asChild>
            <button className="p-1 rounded-lg text-gray-700 hover:bg-white/20 transition-colors" aria-label="Open menu">
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            showCloseButton={true}
            className="w-full bg-verdict/60 backdrop-blur-2xl border-r border-[#016B51]/20 p-0"
          >
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <NavContent {...navProps} />
          </SheetContent>
        </Sheet>
        <span className="ml-3 text-sm font-semibold text-gray-900">Neighborhood Analysis</span>
      </div>
    </>
  );
}

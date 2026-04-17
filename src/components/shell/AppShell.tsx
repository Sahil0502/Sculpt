"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

/* Inner component that can safely call useSearchParams via Suspense */
function NavBar({
  role,
  isBoth,
  userName,
  onMeetingClick,
}: {
  role: string;
  isBoth: boolean;
  userName: string;
  onMeetingClick: () => void;
}) {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState(role);

  // Sync when parent role changes
  useEffect(() => { setActiveRole(role); }, [role]);

  const toggleView = () => {
    const next = activeRole === "manager" ? "employee" : "manager";
    setActiveRole(next);
    try { localStorage.setItem("sculpt-active-role", next); } catch { /* ignore */ }
    const params = new URLSearchParams(window.location.search);
    params.set("role", next);
    router.replace(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3">
      {isBoth && (
        <button
          onClick={toggleView}
          className="flex items-center gap-1.5 rounded-full border border-app-ink/15 bg-white/60 px-3 py-1.5 text-xs font-semibold transition hover:border-app-accent/40"
          title="Switch between manager and employee view"
        >
          <span className={activeRole === "manager" ? "text-app-accent" : "text-app-ink-soft"}>Manager</span>
          <span className="text-app-ink/30">/</span>
          <span className={activeRole === "employee" ? "text-app-accent-2" : "text-app-ink-soft"}>Employee</span>
        </button>
      )}
      <Link href={`/dashboard?role=${activeRole}`}>
        <Button variant="ghost" size="sm">Dashboard</Button>
      </Link>
      <Link href="/schedule">
        <Button variant="ghost" size="sm">Schedule</Button>
      </Link>
      <Button variant="ghost" size="sm" onClick={onMeetingClick}>
        Meeting
      </Button>
      <Link href="/insights/meeting-1">
        <Button variant="ghost" size="sm">Insights</Button>
      </Link>
      <Link href="/growth">
        <Button variant="ghost" size="sm">Growth</Button>
      </Link>
      {userName ? (
        <div className="hidden h-9 w-9 items-center justify-center rounded-full border border-app-ink/10 bg-white/70 text-xs font-semibold text-app-ink sm:flex">
          {userName.charAt(0).toUpperCase()}
        </div>
      ) : null}
      <Link href="/login">
        <Button variant="secondary" size="sm">Log out</Button>
      </Link>
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const [role, setRole] = useState<string>("manager");
  const [isBoth, setIsBoth] = useState(false);
  const [userName, setUserName] = useState("");
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sculpt-role");
      // "both" users default to manager view unless they've toggled
      const activeStored = localStorage.getItem("sculpt-active-role");
      if (stored === "both") {
        setIsBoth(true);
        setRole(activeStored ?? "manager");
      } else if (stored) {
        setRole(stored);
      }
      const user = localStorage.getItem("sculpt-user");
      if (user) {
        const parsed = JSON.parse(user) as { name?: string };
        if (parsed.name) setUserName(parsed.name.split(" ")[0]);
      }
    } catch { /* ignore */ }
  }, []);

  const handleMeetingClick = () => {
    setShowMeetingModal(true);
  };

  const openMeeting = (mode: "online" | "offline") => {
    setShowMeetingModal(false);
    router.push(`/meeting/meeting-1?mode=${mode}`);
  };

  return (
    <div className="min-h-screen grid-fade">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-app-ink-soft">Sculpt</p>
          <h1 className="font-display text-3xl font-semibold">{title}</h1>
          {subtitle ? <p className="text-sm text-app-ink-soft">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={null}>
            <NavBar
              role={role}
              isBoth={isBoth}
              userName={userName}
              onMeetingClick={handleMeetingClick}
            />
          </Suspense>
          {actions}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 pb-16">{children}</main>
      {showMeetingModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-sm rounded-3xl border border-app-ink/10 bg-white/95 p-6 shadow-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-app-ink-soft">Sculpt Meeting</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Choose mode</h2>
            <p className="mt-2 text-sm text-app-ink-soft">
              Online mode uses live video + transcription. Offline mode records audio on one device.
            </p>
            <div className="mt-6 grid gap-3">
              <Button onClick={() => openMeeting("online")}>Online meeting</Button>
              <Button variant="secondary" onClick={() => openMeeting("offline")}>
                Offline recording
              </Button>
              <Button variant="ghost" onClick={() => setShowMeetingModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

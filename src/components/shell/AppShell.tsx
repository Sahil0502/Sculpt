"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    try {
      const stored = localStorage.getItem("careersync-role");
      if (stored) setRole(stored);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="min-h-screen grid-fade">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-app-ink-soft">CareerSync</p>
          <h1 className="font-display text-3xl font-semibold">{title}</h1>
          {subtitle ? <p className="text-sm text-app-ink-soft">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/dashboard?role=${role}`}>
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
          <Link href="/schedule">
            <Button variant="ghost" size="sm">
              Schedule
            </Button>
          </Link>
          <Link href="/growth">
            <Button variant="ghost" size="sm">
              Growth
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="sm">
              Log out
            </Button>
          </Link>
          {actions}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 pb-16">{children}</main>
    </div>
  );
}

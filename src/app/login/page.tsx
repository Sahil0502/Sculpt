"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Role = "manager" | "employee" | "both";

const DEMO_USERS = [
  { name: "Priya Shah", email: "priya@acme.com", role: "manager" as Role, designation: "VP of Product", hint: "Manages Arjun" },
  { name: "Arjun Rao", email: "arjun@acme.com", role: "employee" as Role, designation: "PM Level 1", hint: "Reports to Priya" },
  { name: "Ritu Menon", email: "ritu@acme.com", role: "both" as Role, designation: "Senior PM", hint: "Reports up + manages a team" },
];

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("manager");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fillDemo = (user: typeof DEMO_USERS[0]) => {
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
  };

  const handleLogin = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    setError("");
    setSaving(true);

    const user = { name: name.trim(), email: email.trim(), role };

    // Always save to localStorage first
    try {
      localStorage.setItem("sculpt-role", role);
      localStorage.setItem("sculpt-user", JSON.stringify(user));
    } catch { /* ignore */ }

    // Try to persist to DB (gracefully fails if Supabase not configured)
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
    } catch { /* DB save failed — localStorage is enough for demo */ }

    setSaving(false);
    // "both" defaults to manager view; user can switch in dashboard
    const dashRole = role === "both" ? "manager" : role;
    router.push(`/dashboard?role=${dashRole}`);
  };

  const goOnboarding = () => {
    try {
      localStorage.setItem("sculpt-role", role);
      if (name) {
        const stored = JSON.parse(localStorage.getItem("sculpt-profile") ?? "{}");
        localStorage.setItem("sculpt-profile", JSON.stringify({ ...stored, name, email, role }));
      }
    } catch { /* ignore */ }
    router.push("/onboarding");
  };

  return (
    <div className="min-h-screen grid-fade">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2">
        {/* Left panel */}
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.3em] text-app-ink-soft">Sculpt</p>
          <h1 className="font-display text-5xl font-semibold leading-tight">
            Turn every 1-on-1 into a momentum engine.
          </h1>
          <p className="text-lg text-app-ink-soft">
            AI-supported agendas, live coaching signals, and follow-through tracking — for every layer of your org.
          </p>
          <div className="rounded-3xl border border-app-ink/10 bg-white/70 p-6 space-y-4">
            <p className="font-semibold text-sm">Quick demo — pick a persona</p>
            <div className="space-y-2">
              {DEMO_USERS.map(u => (
                <button
                  key={u.email}
                  onClick={() => fillDemo(u)}
                  className={`w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition hover:border-app-accent/40 hover:bg-app-accent/5 ${
                    email === u.email ? "border-app-accent bg-app-accent/10" : "border-app-ink/10 bg-white/50"
                  }`}
                >
                  <div>
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-xs text-app-ink-soft">{u.designation} · {u.hint}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                    u.role === "manager" ? "bg-app-accent/15 text-app-accent" :
                    u.role === "employee" ? "bg-app-accent-2/15 text-app-accent-2" :
                    "bg-violet-100 text-violet-700"
                  }`}>
                    {u.role === "both" ? "Manager + Employee" : u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Enter your details or pick a demo persona on the left.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="e.g. Arjun Rao"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="name@company.com"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>Your role</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["manager", "employee", "both"] as Role[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`rounded-2xl border px-3 py-2.5 text-xs font-semibold transition ${
                      role === r
                        ? "border-app-accent bg-app-accent text-white"
                        : "border-app-ink/15 bg-white/60 text-app-ink hover:border-app-accent/40"
                    }`}
                  >
                    {r === "both" ? "Both" : r.charAt(0).toUpperCase() + r.slice(1)}
                    {r === "both" && (
                      <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                        I manage & report
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {role === "both" && (
                <p className="text-xs text-app-ink-soft bg-violet-50 rounded-xl px-3 py-2 border border-violet-100">
                  You&apos;ll see the <strong>manager</strong> dashboard by default with a toggle to switch to your employee view.
                </p>
              )}
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <Button className="w-full" onClick={handleLogin} disabled={saving}>
              {saving ? "Signing in…" : "Continue"}
            </Button>

            <button
              type="button"
              onClick={goOnboarding}
              className="block w-full text-center text-xs text-app-ink-soft hover:text-app-ink transition"
            >
              New here? Complete onboarding →
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

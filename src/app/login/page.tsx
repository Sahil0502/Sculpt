"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"manager" | "employee">("manager");

  const handleLogin = () => {
    try {
      localStorage.setItem("careersync-role", role);
    } catch {
      // ignore if localStorage unavailable
    }
    router.push(`/dashboard?role=${role}`);
  };

  return (
    <div className="min-h-screen grid-fade">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.3em] text-app-ink-soft">CareerSync</p>
          <h1 className="font-display text-5xl font-semibold leading-tight">
            Turn every 1-on-1 into a momentum engine.
          </h1>
          <p className="text-lg text-app-ink-soft">
            AI-supported agendas, live coaching signals, and follow-through tracking for managers
            and employees.
          </p>
          <div className="grid gap-3 rounded-3xl border border-app-ink/10 bg-white/70 p-6">
            <p className="font-semibold">What you get today</p>
            <ul className="space-y-2 text-sm text-app-ink-soft">
              <li>Live transcript + pitch sensing</li>
              <li>Auto-generated meeting insights</li>
              <li>Blind spot radar and action tracking</li>
            </ul>
          </div>
        </div>
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Choose your role to open the right dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={role === "manager" ? "primary" : "secondary"}
                onClick={() => setRole("manager")}
              >
                Manager
              </Button>
              <Button
                variant={role === "employee" ? "primary" : "secondary"}
                onClick={() => setRole("employee")}
              >
                Employee
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="name@company.com" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="********" />
            </div>
            <Button className="w-full" onClick={handleLogin}>
              Continue
            </Button>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem("careersync-role", role);
                } catch {
                  // ignore
                }
                router.push("/onboarding");
              }}
              className="block w-full text-center text-xs text-app-ink-soft"
            >
              New here? Complete onboarding
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

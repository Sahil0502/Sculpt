"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileState = {
  name: string;
  designation: string;
  functionName: string;
  seniority: string;
};

const defaultState: ProfileState = {
  name: "",
  designation: "",
  functionName: "",
  seniority: "",
};

export function ProfileForm() {
  const [form, setForm] = useState<ProfileState>(defaultState);
  const [status, setStatus] = useState("Idle");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("sculpt-profile");
      if (stored) {
        setForm(JSON.parse(stored) as ProfileState);
      }
    } catch {
      setForm(defaultState);
    }
  }, []);

  const update = (key: keyof ProfileState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus("Saving...");

    try {
      window.localStorage.setItem("sculpt-profile", JSON.stringify(form));
      setStatus("Saved locally. Connect Supabase to persist.");
    } catch {
      setStatus("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-app-ink/10 bg-white/70 p-6">
      <h3 className="font-display text-lg font-semibold">Profile Details</h3>
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" placeholder="Priya Shah" value={form.name} onChange={update("name")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="designation">Designation</Label>
        <Input
          id="designation"
          placeholder="Director of Product"
          value={form.designation}
          onChange={update("designation")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="function">Function</Label>
        <Input
          id="function"
          placeholder="Product Management"
          value={form.functionName}
          onChange={update("functionName")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="seniority">Seniority Level</Label>
        <Input
          id="seniority"
          placeholder="2"
          value={form.seniority}
          onChange={update("seniority")}
        />
      </div>
      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Profile"}
      </Button>
      <p className="text-xs text-app-ink-soft">{status}</p>
    </div>
  );
}

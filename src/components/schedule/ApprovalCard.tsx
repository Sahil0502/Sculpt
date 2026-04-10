import { Button } from "@/components/ui/button";

export function ApprovalCard() {
  return (
    <div className="rounded-3xl border border-app-ink/10 bg-white/70 p-6">
      <h3 className="font-display text-lg font-semibold">Pending Approval</h3>
      <p className="mt-2 text-sm text-app-ink-soft">
        Arjun requested Apr 12, 10:00 AM - Offline
      </p>
      <div className="mt-4 flex gap-2">
        <Button size="sm">Approve</Button>
        <Button size="sm" variant="secondary">
          Suggest New Time
        </Button>
      </div>
    </div>
  );
}

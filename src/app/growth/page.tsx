import { GrowthRadar } from "@/components/dashboard/GrowthRadar";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GrowthPage() {
  return (
    <AppShell title="Growth View" subtitle="Track progress across competencies over time.">
      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Competency radar</CardTitle>
          </CardHeader>
          <CardContent>
            <GrowthRadar />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Action timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-app-ink-soft">
            <div className="rounded-2xl border border-app-ink/10 bg-white/70 p-4">
              Apr 08 - Closed discovery feedback loop with design.
            </div>
            <div className="rounded-2xl border border-app-ink/10 bg-white/70 p-4">
              Apr 10 - Drafted GTM milestone plan.
            </div>
            <div className="rounded-2xl border border-app-ink/10 bg-white/70 p-4">
              Apr 12 - Scheduled leadership sync for Q2 objectives.
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

import { InsightsDisplay } from "@/components/insights/InsightsDisplay";
import { AppShell } from "@/components/shell/AppShell";

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell title="Meeting Insights" subtitle="AI-generated analysis from your 1-on-1 session.">
      <InsightsDisplay meetingId={id} />
    </AppShell>
  );
}

import { AgendaPanel } from "@/components/meeting/AgendaPanel";
import { MeetingRoomClient } from "@/components/meeting/MeetingRoomClient";
import { OfflineRecorder } from "@/components/meeting/OfflineRecorder";
import { AppShell } from "@/components/shell/AppShell";

export default async function MeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const meetingId = id || "demo";
  const resolved = (await searchParams) || {};
  const mode = resolved.mode === "offline" ? "offline" : "online";

  return (
    <AppShell title={`Meeting ${meetingId}`} subtitle={`Mode: ${mode}`}>
      {mode === "online" ? (
        <MeetingRoomClient meetingId={meetingId} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <OfflineRecorder meetingId={meetingId} />
          </div>
          <div className="space-y-6">
            <AgendaPanel meetingId={meetingId} />
          </div>
        </div>
      )}
    </AppShell>
  );
}

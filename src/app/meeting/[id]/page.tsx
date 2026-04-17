import { MeetingRoomClient } from "@/components/meeting/MeetingRoomClient";
import { OfflineRoom } from "@/components/meeting/OfflineRoom";

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
  const isOffline = resolved.mode === "offline";

  return isOffline ? (
    <OfflineRoom meetingId={meetingId} />
  ) : (
    <MeetingRoomClient meetingId={meetingId} />
  );
}

import { ActionTracker } from "@/components/dashboard/ActionTracker";
import { GrowthRadar } from "@/components/dashboard/GrowthRadar";
import { MeetingCard } from "@/components/dashboard/MeetingCard";
import { TeamOverview } from "@/components/dashboard/TeamOverview";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const meetings = [
  {
    id: "meeting-1",
    date: "Apr 10 - 4:00 PM",
    status: "Approved",
    mode: "online",
    summary: "Aligned on Q2 discovery risks and sprint delivery.",
  },
  {
    id: "meeting-2",
    date: "Apr 17 - 4:00 PM",
    status: "Pending",
    mode: "offline",
  },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ role?: string }>;
}) {
  const resolved = (await searchParams) || {};
  const role = resolved.role === "employee" ? "employee" : "manager";

  return (
    <AppShell
      title={role === "manager" ? "Manager Command" : "Employee Snapshot"}
      subtitle="Track momentum across upcoming 1-on-1s and growth goals."
    >
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming meetings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {meetings.map((meeting) => (
              <MeetingCard key={meeting.id} {...meeting} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{role === "manager" ? "Team overview" : "My growth"}</CardTitle>
          </CardHeader>
          <CardContent>
            {role === "manager" ? <TeamOverview /> : <GrowthRadar />}
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Action tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionTracker />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Growth radar</CardTitle>
          </CardHeader>
          <CardContent>
            <GrowthRadar />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

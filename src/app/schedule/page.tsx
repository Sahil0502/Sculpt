import { ApprovalCard } from "@/components/schedule/ApprovalCard";
import { Calendar } from "@/components/schedule/Calendar";
import { TimeSlotPicker } from "@/components/schedule/TimeSlotPicker";
import { AppShell } from "@/components/shell/AppShell";

export default function SchedulePage() {
  return (
    <AppShell title="Schedule" subtitle="Coordinate time slots and approvals.">
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Calendar />
        <div className="space-y-6">
          <TimeSlotPicker />
          <ApprovalCard />
        </div>
      </div>
    </AppShell>
  );
}

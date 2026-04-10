import { Badge } from "@/components/ui/badge";

const items = [
  {
    id: "1",
    description: "Ship PRD draft with GTM milestones",
    owner: "Employee",
    status: "In progress",
  },
  {
    id: "2",
    description: "Confirm staffing for discovery workstream",
    owner: "Manager",
    status: "Pending",
  },
];

export function ActionItemsList() {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-2xl border border-app-ink/10 bg-white/70 p-4"
        >
          <div>
            <p className="font-semibold">{item.description}</p>
            <p className="text-xs text-app-ink-soft">{item.owner}</p>
          </div>
          <Badge>{item.status}</Badge>
        </div>
      ))}
    </div>
  );
}

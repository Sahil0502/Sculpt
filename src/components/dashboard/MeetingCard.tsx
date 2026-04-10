import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function MeetingCard({
  id,
  date,
  status,
  mode,
  summary,
}: {
  id: string;
  date: string;
  status: string;
  mode: string;
  summary?: string;
}) {
  return (
    <div className="rounded-2xl border border-app-ink/10 bg-white/70 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{date}</p>
          <p className="text-xs text-app-ink-soft">{mode} session</p>
        </div>
        <Badge>{status}</Badge>
      </div>
      {summary ? <p className="mt-3 text-sm text-app-ink-soft">{summary}</p> : null}
      <div className="mt-4 flex gap-2">
        <Link href={`/meeting/${id}?mode=${mode}`}>
          <Button size="sm" variant="secondary">
            Open
          </Button>
        </Link>
        <Link href={`/insights/${id}`}>
          <Button size="sm" variant="ghost">
            Insights
          </Button>
        </Link>
      </div>
    </div>
  );
}

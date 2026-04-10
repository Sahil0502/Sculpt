import type { ActionItem, MeetingSummary, UserProfile } from "../lib/types";

export const seedUsers: UserProfile[] = [
  {
    id: "user-manager-1",
    email: "priya@careersync.dev",
    name: "Priya Shah",
    role: "manager",
    designation: "Director of Product",
  },
  {
    id: "user-employee-1",
    email: "arjun@careersync.dev",
    name: "Arjun Rao",
    role: "employee",
    designation: "Product Manager",
    managerId: "user-manager-1",
  },
];

export const seedMeetings: MeetingSummary[] = [
  {
    id: "meeting-1",
    managerId: "user-manager-1",
    employeeId: "user-employee-1",
    scheduledAt: "2026-04-10T16:00:00.000Z",
    status: "approved",
    mode: "online",
    summary: "Aligned on Q2 discovery goals and sprint delivery risks.",
  },
  {
    id: "meeting-2",
    managerId: "user-manager-1",
    employeeId: "user-employee-1",
    scheduledAt: "2026-04-17T16:00:00.000Z",
    status: "pending",
    mode: "offline",
  },
];

export const seedActionItems: ActionItem[] = [
  {
    id: "action-1",
    meetingId: "meeting-1",
    assignee: "employee",
    description: "Ship updated PRD draft with GTM milestones",
    status: "in_progress",
    dueDate: "2026-04-14",
  },
  {
    id: "action-2",
    meetingId: "meeting-1",
    assignee: "manager",
    description: "Review staffing needs for discovery workstream",
    status: "pending",
    dueDate: "2026-04-15",
  }
];

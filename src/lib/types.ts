export type UserRole = "manager" | "employee";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  designation?: string;
  function?: string;
  seniorityLevel?: number;
  managerId?: string | null;
  avatarUrl?: string | null;
}

export interface PitchSummary {
  averagePitch: number;
  stressIndex: number;
  engagementIndex: number;
}

export interface TranscriptEntry {
  speaker: UserRole | "unknown";
  text: string;
  timestamp: string;
}

export interface MeetingSummary {
  id: string;
  managerId: string;
  employeeId: string;
  scheduledAt: string;
  status: "pending" | "approved" | "in_progress" | "completed" | "cancelled";
  mode: "online" | "offline";
  summary?: string;
}

export interface ActionItem {
  id: string;
  meetingId: string;
  assignee: UserRole;
  description: string;
  status: "pending" | "in_progress" | "completed";
  dueDate?: string;
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserProfile;
        Insert: Partial<UserProfile>;
        Update: Partial<UserProfile>;
      };
      meetings: {
        Row: MeetingSummary;
        Insert: Partial<MeetingSummary>;
        Update: Partial<MeetingSummary>;
      };
      action_items: {
        Row: ActionItem;
        Insert: Partial<ActionItem>;
        Update: Partial<ActionItem>;
      };
    };
  };
};

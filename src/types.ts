export type Priority = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNASSIGNED';
export type Status = 'PENDING' | 'COMPLETED';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  deadline: string;
  status: Status;
  tags: string[];
}

export type EventStatus = 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED' | 'COMPLETED';

export interface Event {
  id: string;
  title: string;
  datetime: string;
  duration: string;
  location: string;
  notes: string;
  attendees: string[];
  status?: EventStatus;
}

export interface Note {
  id: string;
  content: string;
  type: string;
  timestamp: string;
  tags: string[];
}

export interface Reminder {
  id: string;
  message: string;
  triggerTime: string; // Can be ISO datetime or "HH:mm" for recurring
  recurring: boolean;
  active?: boolean;
  voiceAlarm?: boolean;
  days?: number[]; // 0 = Sunday, 1 = Monday, etc.
}

export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommandLogEntry {
  id: string;
  timestamp: string;
  command: string;
  actionTaken: string;
}

export interface MDProfile {
  name: string;
  companyName: string;
  salutation: string;
  geminiApiKey: string;
}

export interface NIAAction {
  type: string;
  data: any;
}

export interface NIAResponse {
  intent: string;
  voiceResponse: string;
  action?: NIAAction;
  followUp?: boolean;
}

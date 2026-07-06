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
  triggerTime: string;
  recurring: boolean;
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

export interface ARIAAction {
  type: string;
  data: any;
}

export interface ARIAResponse {
  intent: string;
  voiceResponse: string;
  action?: ARIAAction;
  followUp?: boolean;
}

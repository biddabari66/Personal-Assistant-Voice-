import { useState, useEffect } from 'react';
import { Task, Event, Note, Reminder, MDProfile, Document, CommandLogEntry } from '../types';

export function useData(userId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [commandLog, setCommandLog] = useState<CommandLogEntry[]>([]);
  const [profile, setProfile] = useState<MDProfile>({
    name: 'Sir',
    companyName: '',
    salutation: 'Sir',
    geminiApiKey: ''
  });

  const [dbConnected, setDbConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Try to load from DB first
    fetch(`/api/db/sync?userId=${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('DB not connected');
        return res.json();
      })
      .then(data => {
        setDbConnected(true);
        if (data.tasks) setTasks(data.tasks);
        if (data.events) setEvents(data.events);
        if (data.notes) setNotes(data.notes);
        if (data.documents) setDocuments(data.documents);
        if (data.knowledge) setKnowledge(data.knowledge);
        if (data.commandLog) setCommandLog(data.commandLog);
        if (data.profile) setProfile(data.profile);
      })
      .catch(() => {
        // Fallback to local storage
        const loadedTasks = localStorage.getItem(`nia_tasks_${userId}`);
        if (loadedTasks) setTasks(JSON.parse(loadedTasks));

        const loadedEvents = localStorage.getItem(`nia_events_${userId}`);
        if (loadedEvents) setEvents(JSON.parse(loadedEvents));

        const loadedNotes = localStorage.getItem(`nia_notes_${userId}`);
        if (loadedNotes) setNotes(JSON.parse(loadedNotes));

        const loadedReminders = localStorage.getItem(`nia_reminders_${userId}`);
        if (loadedReminders) setReminders(JSON.parse(loadedReminders));

        const loadedDocs = localStorage.getItem(`nia_documents_${userId}`);
        if (loadedDocs) setDocuments(JSON.parse(loadedDocs));

        const loadedKnowledge = localStorage.getItem(`nia_knowledge_${userId}`);
        if (loadedKnowledge) setKnowledge(JSON.parse(loadedKnowledge));

        const loadedCommandLog = localStorage.getItem(`nia_command_log_${userId}`);
        if (loadedCommandLog) setCommandLog(JSON.parse(loadedCommandLog));

        const loadedProfile = localStorage.getItem(`nia_profile_${userId}`);
        if (loadedProfile) setProfile(JSON.parse(loadedProfile));
      });
  }, [userId]);

  const syncToDb = (table: string, data: any) => {
    if (!dbConnected || !userId) return;
    fetch(`/api/db/sync/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, data })
    }).catch(e => console.error('Failed to sync to DB:', e));
  };

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    if(userId) localStorage.setItem(`nia_tasks_${userId}`, JSON.stringify(newTasks));
    syncToDb('tasks', newTasks);
  };

  const saveEvents = (newEvents: Event[]) => {
    setEvents(newEvents);
    if(userId) localStorage.setItem(`nia_events_${userId}`, JSON.stringify(newEvents));
    syncToDb('events', newEvents);
  };

  const saveNotes = (newNotes: Note[]) => {
    setNotes(newNotes);
    if(userId) localStorage.setItem(`nia_notes_${userId}`, JSON.stringify(newNotes));
    syncToDb('notes', newNotes);
  };

  const saveReminders = (newReminders: Reminder[]) => {
    setReminders(newReminders);
    if(userId) localStorage.setItem(`nia_reminders_${userId}`, JSON.stringify(newReminders));
  };

  const saveDocuments = (newDocs: Document[]) => {
    setDocuments(newDocs);
    if(userId) localStorage.setItem(`nia_documents_${userId}`, JSON.stringify(newDocs));
    syncToDb('documents', newDocs);
  };

  const saveKnowledge = (newKnowledge: any[]) => {
    setKnowledge(newKnowledge);
    if(userId) localStorage.setItem(`nia_knowledge_${userId}`, JSON.stringify(newKnowledge));
    syncToDb('knowledge', newKnowledge);
  };

  const saveCommandLog = (newLog: CommandLogEntry[]) => {
    setCommandLog(newLog);
    if(userId) localStorage.setItem(`nia_command_log_${userId}`, JSON.stringify(newLog));
    syncToDb('commandLog', newLog);
  };

  const saveProfile = (newProfile: MDProfile) => {
    setProfile(newProfile);
    if(userId) localStorage.setItem(`nia_profile_${userId}`, JSON.stringify(newProfile));
    syncToDb('profile', newProfile);
  };

  return {
    tasks, saveTasks,
    events, saveEvents,
    notes, saveNotes,
    reminders, saveReminders,
    documents, saveDocuments,
    knowledge, saveKnowledge,
    commandLog, saveCommandLog,
    profile, saveProfile
  };
}

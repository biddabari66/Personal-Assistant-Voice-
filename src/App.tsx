import { useState, useEffect } from 'react';
import { Mic, Calendar, CheckSquare, FileText, Sun, Settings as SettingsIcon, Type, Brain, Terminal, Bell } from 'lucide-react';
import { useData } from './hooks/useData';
import VoiceHub from './components/VoiceHub';
import Schedule from './components/Schedule';
import Tasks from './components/Tasks';
import Notes from './components/Notes';
import DailyBrief from './components/DailyBrief';
import SettingsPanel from './components/SettingsPanel';
import Typist from './components/Typist';
import Memory from './components/Memory';
import CommandLog from './components/CommandLog';
import Auth from './components/Auth';

export default function App() {
  const [activeTab, setActiveTab] = useState('VOICE_HUB');
  const [session, setSession] = useState<any>(null);
  const data = useData(session?.user?.id || null);
  const [isReady, setIsReady] = useState(false);
  const [upcomingMeeting, setUpcomingMeeting] = useState<any>(null);

  // Ask for notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (data.profile) {
      setIsReady(true);
    }
  }, [data.profile]);

  useEffect(() => {
    // Background priority assignment process
    const processPriorities = async () => {
      const unassignedTasks = data.tasks.filter(t => t.priority === 'UNASSIGNED' && t.status === 'PENDING');
      if (unassignedTasks.length === 0 || !data.profile.geminiApiKey) return;

      try {
        const response = await fetch('/api/priority', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            tasks: unassignedTasks.map(t => ({ id: t.id, title: t.title })),
            apiKey: data.profile.geminiApiKey
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.priorities && result.priorities.length > 0) {
            let updatedTasks = [...data.tasks];
            let hasChanges = false;
            
            result.priorities.forEach((update: any) => {
              const idx = updatedTasks.findIndex(t => t.id === update.id);
              if (idx !== -1 && update.priority && ['HIGH', 'MEDIUM', 'LOW'].includes(update.priority.toUpperCase())) {
                updatedTasks[idx] = { ...updatedTasks[idx], priority: update.priority.toUpperCase() as any };
                hasChanges = true;
              }
            });

            if (hasChanges) {
              data.saveTasks(updatedTasks);
            }
          }
        }
      } catch (e) {
        console.error("Failed to process priorities in background:", e);
      }
    };

    const timer = setTimeout(processPriorities, 3000); // 3 seconds delay before processing
    return () => clearTimeout(timer);
  }, [data.tasks, data.profile.geminiApiKey]);

  // Hook for upcoming meeting notifications
  useEffect(() => {
    const checkMeetings = () => {
      if (!data.events) return;
      const now = new Date();
      let foundMeeting = null;
      
      for (const event of data.events) {
        if (!event.datetime) continue;
        const eventTime = new Date(event.datetime);
        const timeDiffMs = eventTime.getTime() - now.getTime();
        const minutesDiff = timeDiffMs / 1000 / 60;
        
        // Between 0 and 10 minutes from now
        if (minutesDiff > 0 && minutesDiff <= 10) {
          foundMeeting = event;
          break;
        }
      }
      setUpcomingMeeting(foundMeeting);
    };

    checkMeetings();
    const interval = setInterval(checkMeetings, 30000); // check every 30 seconds
    return () => clearInterval(interval);
  }, [data.events]);

  useEffect(() => {
    if (upcomingMeeting && 'Notification' in window && Notification.permission === 'granted') {
      // Create a notification if it's newly set
      try {
        new Notification(`Upcoming Meeting: ${upcomingMeeting.title}`, {
          body: `Starts in less than 10 minutes at ${new Date(upcomingMeeting.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          icon: '/favicon.ico'
        });
      } catch (e) {
        console.error("Failed to show notification:", e);
      }
    }
  }, [upcomingMeeting?.id]);

  if (!session) {
    return <Auth onAuthChange={setSession} />;
  }

  if (!isReady) return null;

  const tabs = [
    { id: 'VOICE_HUB', icon: Mic, label: 'Hub' },
    { id: 'SCHEDULE', icon: Calendar, label: 'Schedule' },
    { id: 'TASKS', icon: CheckSquare, label: 'Tasks' },
    { id: 'TYPIST', icon: Type, label: 'Docs' },
    { id: 'NOTES', icon: FileText, label: 'Notes' },
    { id: 'MEMORY', icon: Brain, label: 'Memory' },
    { id: 'COMMAND_LOG', icon: Terminal, label: 'Cmd Log' },
    { id: 'DAILY_BRIEF', icon: Sun, label: 'Brief' },
    { id: 'SETTINGS', icon: SettingsIcon, label: 'Settings' }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className={`flex justify-between items-center p-4 border-b shrink-0 transition-colors duration-500 ${upcomingMeeting ? 'bg-amber-50 border-amber-200' : 'border-slate-200 bg-slate-50'}`}>
        <div className="flex items-center space-x-3">
          {activeTab !== 'VOICE_HUB' && (
            <button 
              onClick={() => setActiveTab('VOICE_HUB')}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <div className={`w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm ring-2 ${upcomingMeeting ? 'ring-amber-500 animate-pulse' : 'ring-executive-gold/30'}`}>
            {data.profile.name ? data.profile.name.charAt(0) : 'A'}
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold leading-tight text-slate-900">
              {getGreeting()}, Sir
            </h1>
            <p className={`text-xs font-medium flex items-center ${upcomingMeeting ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
              {upcomingMeeting && <Bell size={10} className="mr-1 animate-bounce" />}
              {upcomingMeeting ? `Upcoming: ${upcomingMeeting.title} starting soon` : 'Assistant Ria is ready'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => {
              const newLang = localStorage.getItem('language') === 'bn' ? 'en' : 'bn';
              localStorage.setItem('language', newLang);
              window.dispatchEvent(new Event('languagechange'));
              // For a simple reload to apply the language everywhere:
              window.location.reload();
            }}
            className="flex items-center space-x-1 px-3 py-1 rounded-full border border-slate-200 bg-white text-xs font-semibold hover:bg-slate-50 shadow-sm transition-colors"
          >
            <span>{localStorage.getItem('language') === 'bn' ? '🇧🇩 BN' : '🇺🇸 EN'}</span>
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            <p className="text-xs text-executive-gold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative p-4">
        <div className={activeTab === 'VOICE_HUB' ? 'block h-full' : 'hidden h-full'}>
          <VoiceHub data={data} />
        </div>
        {activeTab === 'SCHEDULE' && <Schedule events={data.events} saveEvents={data.saveEvents} />}
        {activeTab === 'TASKS' && <Tasks tasks={data.tasks} saveTasks={data.saveTasks} notes={data.notes} saveNotes={data.saveNotes} />}
        {activeTab === 'TYPIST' && <Typist documents={data.documents} saveDocuments={data.saveDocuments} notes={data.notes} saveNotes={data.saveNotes} />}
        {activeTab === 'NOTES' && <Notes notes={data.notes} saveNotes={data.saveNotes} />}
        {activeTab === 'MEMORY' && <Memory knowledge={data.knowledge} profile={data.profile} />}
        {activeTab === 'COMMAND_LOG' && <CommandLog log={data.commandLog} />}
        {activeTab === 'DAILY_BRIEF' && <DailyBrief data={data} />}
        {activeTab === 'SETTINGS' && <SettingsPanel profile={data.profile} saveProfile={data.saveProfile} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex justify-around items-center p-2 border-t border-slate-200 bg-slate-50 shrink-0 pb-safe overflow-x-auto gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[60px] p-2 rounded-xl transition-all ${
                isActive ? 'text-slate-900 bg-executive-gold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Mic, Calendar, CheckSquare, FileText, Sun, Settings as SettingsIcon, Type, Brain, Terminal, Bell, Clock, BellRing } from 'lucide-react';
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
import Timebox from './components/Timebox';
import Alarms from './components/Alarms';

export default function App() {
  const [activeTab, setActiveTab] = useState('VOICE_HUB');
  const [session, setSession] = useState<any>(null);
  const data = useData(session?.user?.id || null);
  const [isReady, setIsReady] = useState(false);
  const [upcomingMeeting, setUpcomingMeeting] = useState<any>(null);
  const [activeAlarm, setActiveAlarm] = useState<{ id: string, text: string } | null>(null);

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

  const playedAlarms = useRef<Set<string>>(new Set());

  // Hook for upcoming meeting notifications
  useEffect(() => {
    const checkReminders = () => {
      // 1. Check Meetings
      if (data.events) {
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
            
            // Voice Alarm for important meetings within 2 minutes
            if (minutesDiff <= 2 && !playedAlarms.current.has(event.id)) {
              playedAlarms.current.add(event.id);
              playVoiceAlarm(event.id, `Reminder: ${event.title} is starting in ${Math.ceil(minutesDiff)} minutes.`);
            }
            break;
          }
        }
        setUpcomingMeeting(foundMeeting);
      }

      // 2. Check High Priority Tasks
      if (data.tasks) {
        const todayStr = new Date().toISOString().split('T')[0];
        const highPriorityTasks = data.tasks.filter(t => t.priority === 'HIGH' && t.status === 'PENDING' && (t.deadline === todayStr || t.deadline < todayStr));
        
        for (const task of highPriorityTasks) {
          // Remind once per session for high priority tasks due today/overdue
          if (!playedAlarms.current.has(task.id)) {
            playedAlarms.current.add(task.id);
            playVoiceAlarm(task.id, `Urgent task reminder: ${task.title}.`);
            break; // Only play one at a time to avoid overlapping
          }
        }
      }

      // 3. Check Explicit Alarms
      if (data.reminders) {
        const now = new Date();
        const currentHM = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const currentDay = now.getDay();
        
        for (const alarm of data.reminders) {
          if (alarm.active !== false && alarm.triggerTime === currentHM) {
            if (alarm.recurring && alarm.days && alarm.days.length > 0 && !alarm.days.includes(currentDay)) {
              continue;
            }
            const alarmKey = `${alarm.id}-${currentHM}`;
            if (!playedAlarms.current.has(alarmKey)) {
              playedAlarms.current.add(alarmKey);
              if (alarm.voiceAlarm) {
                playVoiceAlarm(alarmKey, `Alarm: ${alarm.message}`);
              } else if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Reminder', { body: alarm.message });
              }
            }
          }
        }
      }
    };

    const playVoiceAlarm = (id: string, text: string) => {
      setActiveAlarm({ id, text });
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 1.5);
        }
        
                if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          (window as any)._alarmUtterance = utterance;
          utterance.pitch = 0.9;
          utterance.rate = 1.0;
          setTimeout(() => window.speechSynthesis.speak(utterance), 1000);
        }
      } catch (err) {
        console.error("Voice alarm failed", err);
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [data.events, data.tasks]);

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
    { id: 'TIMEBOX', icon: Clock, label: 'Timebox' },
    { id: 'TASKS', icon: CheckSquare, label: 'Tasks' },
    { id: 'ALARMS', icon: BellRing, label: 'Alarms' },
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
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-slate-50 text-slate-800 font-sans selection:bg-executive-gold/30">
      {/* Header */}
      <header className={`flex justify-between items-center px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] border-b shrink-0 transition-all duration-500 ${upcomingMeeting ? 'bg-amber-900/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center space-x-4">
          {activeTab !== 'VOICE_HUB' && (
            <button 
              onClick={() => setActiveTab('VOICE_HUB')}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-executive-gold to-executive-gold-dim text-slate-900 flex items-center justify-center shadow-lg shadow-executive-gold/20 ${upcomingMeeting ? 'ring-2 ring-amber-500 animate-pulse' : ''}`}>
            <span className="font-serif font-bold text-2xl">{data.profile.name ? data.profile.name.charAt(0) : 'N'}</span>
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold leading-tight text-slate-900 tracking-wide">
              {getGreeting()}, Sir
            </h1>
            <p className={`text-xs font-medium flex items-center mt-0.5 tracking-wider uppercase ${upcomingMeeting ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
              {upcomingMeeting && <Bell size={10} className="mr-1.5 animate-bounce" />}
              {upcomingMeeting ? `Upcoming: ${upcomingMeeting.title} starting soon` : 'Assistant Nia is active'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-5">
          <button 
            onClick={() => {
              const newLang = localStorage.getItem('language') === 'bn' ? 'en' : 'bn';
              localStorage.setItem('language', newLang);
              window.dispatchEvent(new Event('languagechange'));
              window.location.reload();
            }}
            className="flex items-center space-x-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold tracking-wider hover:bg-slate-100 shadow-sm transition-colors uppercase"
          >
            <span>{localStorage.getItem('language') === 'bn' ? '🇧🇩 BN' : '🇺🇸 EN'}</span>
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold tracking-wide text-slate-600">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            <p className="text-xs font-mono text-executive-gold font-bold mt-0.5">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative p-6 custom-scrollbar bg-slate-50">
        <div className={activeTab === 'VOICE_HUB' ? 'block h-full' : 'hidden h-full'}>
          <VoiceHub data={data} />
        </div>
        {activeTab === 'SCHEDULE' && <Schedule events={data.events} saveEvents={data.saveEvents} />}
        {activeTab === 'TIMEBOX' && <Timebox tasks={data.tasks} events={data.events} saveTasks={data.saveTasks} />}
        {activeTab === 'TASKS' && <Tasks tasks={data.tasks} saveTasks={data.saveTasks} notes={data.notes} saveNotes={data.saveNotes} />}
        {activeTab === 'ALARMS' && <Alarms reminders={data.reminders} saveReminders={data.saveReminders} />}
        {activeTab === 'TYPIST' && <Typist documents={data.documents} saveDocuments={data.saveDocuments} notes={data.notes} saveNotes={data.saveNotes} />}
        {activeTab === 'NOTES' && <Notes notes={data.notes} saveNotes={data.saveNotes} />}
        {activeTab === 'MEMORY' && <Memory knowledge={data.knowledge} profile={data.profile} />}
        {activeTab === 'COMMAND_LOG' && <CommandLog log={data.commandLog} />}
        {activeTab === 'DAILY_BRIEF' && <DailyBrief data={data} />}
        {activeTab === 'SETTINGS' && <SettingsPanel profile={data.profile} saveProfile={data.saveProfile} />}
      </main>


      {activeAlarm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 to-amber-500 animate-pulse"></div>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
              <BellRing size={40} className="animate-bounce" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2">Executive Alert</h3>
            <p className="text-slate-600 mb-8 font-medium">{activeAlarm.text}</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setActiveAlarm(null);
                }} 
                className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Acknowledge & Dismiss
              </button>
              <button 
                onClick={() => {
                  window.speechSynthesis.cancel();
                  // For a real snooze, we could add 5 mins to the reminder or task, but for now we just dismiss and un-mark it as played if needed
                  playedAlarms.current.delete(activeAlarm.id);
                  // Snooze logic: we can just delay the played alarm so it rings again in 5 minutes
                  setTimeout(() => {
                     playedAlarms.current.delete(activeAlarm.id);
                  }, 5 * 60 * 1000); // 5 mins
                  setActiveAlarm(null);
                }} 
                className="w-full py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Snooze for 5 Minutes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="flex justify-around items-center px-1 sm:px-3 pt-2 sm:pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-slate-200 bg-white shrink-0 overflow-x-auto gap-1 sm:gap-2 custom-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[50px] sm:min-w-[70px] p-2 sm:p-2.5 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'text-executive-navy bg-executive-gold shadow-[0_0_15px_rgba(197,160,89,0.3)] transform -translate-y-1' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} className="sm:w-[22px] sm:h-[22px]" />
              <span className={`text-[8px] sm:text-[10px] mt-1 sm:mt-1.5 uppercase tracking-widest sm:tracking-wider ${isActive ? 'font-bold' : 'font-semibold'}`}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

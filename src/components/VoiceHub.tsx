import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Loader2, Volume2, Square, Plus, Radio, AlertTriangle } from 'lucide-react';
import { useLiveApi } from '../hooks/useLiveApi';

export default function VoiceHub({ data }: { data: any }) {
  const [recentActions, setRecentActions] = useState<{id: string, text: string}[]>([]);
  const [actionToast, setActionToast] = useState<string | null>(null);
  
  const handleAction = useCallback((action: any) => {
    executeAction(action);
  }, [data]);
  
  const { isConnected, isConnecting, isError, transcript, niaTranscript, connect, disconnect, sendContextUpdate } = useLiveApi(handleAction);

  const toggleConnection = () => {
    if (isConnected || isConnecting) {
      disconnect();
      setActionToast(null);
    } else {
      setRecentActions([]); // Clear on new connection
      const totalTasks = data.tasks.length;
      const completedTasks = data.tasks.filter((t: any) => t.status === 'COMPLETED').length;
      const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

      connect(data.profile.geminiApiKey, {
        tasks: data.tasks,
        taskCompletionRatio: `${completedTasks}/${totalTasks} (${progress}%)`,
        events: data.events,
        knowledge: data.knowledge,
        currentTime: new Date().toLocaleString('en-US', { timeZoneName: 'short' }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }
  };

  const currentTranscriptRef = useRef(transcript);
  useEffect(() => {
    currentTranscriptRef.current = transcript;
  }, [transcript]);

  // Send context updates to the live session when data changes
  useEffect(() => {
    if (isConnected) {
      const totalTasks = data.tasks.length;
      const completedTasks = data.tasks.filter((t: any) => t.status === 'COMPLETED').length;
      const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
      
      sendContextUpdate({
        tasks: data.tasks,
        taskCompletionRatio: `${completedTasks}/${totalTasks} (${progress}%)`,
        events: data.events,
        currentTime: new Date().toLocaleString('en-US', { timeZoneName: 'short' }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }
  }, [data.tasks, data.events, isConnected, sendContextUpdate]);

  const addActionLog = (text: string) => {
    setRecentActions(prev => [...prev, { id: crypto.randomUUID(), text }]);
    setActionToast(text);
    setTimeout(() => {
      setActionToast(prev => prev === text ? null : prev);
    }, 4000);
    // Also save to global command log
    data.saveCommandLog([...data.commandLog, {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      command: currentTranscriptRef.current || 'Voice Command',
      actionTaken: text
    }]);
  };

  const executeAction = (action: any) => {
    const { type, payload } = action;
    const now = new Date().toISOString();

    if (type === 'ADD_TASK') {
      const taskTitle = payload.title || payload.content || 'New Task';
      data.saveTasks([...data.tasks, {
        id: crypto.randomUUID(),
        title: taskTitle,
        priority: payload.priority || 'UNASSIGNED',
        deadline: payload.deadline || now.split('T')[0],
        status: 'PENDING',
        tags: payload.tags || []
      }]);
      addActionLog(`Added task: ${taskTitle}`);
    } else if (type === 'EDIT_TASK') {
      let taskTitle = payload.title || "Task";
      data.saveTasks(data.tasks.map((t: any) => {
        if (t.id === payload.id || t.title.toLowerCase().includes(taskTitle.toLowerCase())) {
          return { ...t, ...payload };
        }
        return t;
      }));
      addActionLog(`Updated task: ${taskTitle}`);
    } else if (type === 'ADD_NOTE') {
      const noteContent = payload.content || payload.title || 'Empty Note';
      data.saveNotes([...data.notes, {
        id: crypto.randomUUID(),
        content: noteContent,
        type: payload.type || 'idea',
        timestamp: now,
        tags: payload.tags || []
      }]);
      addActionLog(`Saved note: ${noteContent.substring(0, 30)}...`);
    } else if (type === 'EDIT_NOTE') {
      let searchContent = payload.content || payload.title || "Note";
      data.saveNotes(data.notes.map((n: any) => {
        if (n.id === payload.id || n.content.toLowerCase().includes(searchContent.toLowerCase())) {
          return { ...n, ...payload };
        }
        return n;
      }));
      addActionLog(`Updated note: ${searchContent}`);
    } else if (type === 'ADD_EVENT') {
      data.saveEvents([...data.events, {
        id: crypto.randomUUID(),
        title: payload.title,
        datetime: payload.datetime || now,
        duration: payload.duration || '1h',
        location: payload.location || '',
        notes: payload.notes || '',
        attendees: payload.attendees || [],
        status: payload.status || 'CONFIRMED'
      }]);
      addActionLog(`Scheduled event: ${payload.title}`);
    } else if (type === 'EDIT_EVENT') {
      let eventTitle = payload.title || "Event";
      data.saveEvents(data.events.map((e: any) => {
        if (e.id === payload.id || e.title.toLowerCase().includes(eventTitle.toLowerCase())) {
          return { ...e, ...payload };
        }
        return e;
      }));
      addActionLog(`Updated event: ${eventTitle}`);
    } else if (type === 'ADD_DOCUMENT') {
      data.saveDocuments([...data.documents, {
        id: crypto.randomUUID(),
        title: payload.title || 'New Document',
        content: payload.content,
        createdAt: now,
        updatedAt: now
      }]);
      addActionLog(`Created document: ${payload.title || 'New Document'}`);
    } else if (type === 'ADD_KNOWLEDGE') {
      data.saveKnowledge([...(data.knowledge || []), {
        id: crypto.randomUUID(),
        fact: payload.fact,
        timestamp: now
      }]);
      addActionLog(`Remembered fact: ${payload.fact}`);
    }
  };

  return (
    <div className={`flex flex-col lg:flex-row gap-8 ${isConnected || transcript ? 'items-start' : 'items-center justify-center min-h-[70vh]'}`}>
      
      {/* Left / Center Column: Orb and Transcript */}
      <div className={`flex flex-col items-center justify-center space-y-12 transition-all duration-500 w-full ${isConnected || transcript ? 'lg:w-1/2 mt-12' : 'max-w-2xl mx-auto'}`}>
        
        {/* Main Microphone Button */}
        <div className="relative">
          {/* Ripple effect when listening */}
          {(isConnected || isConnecting) && (
            <div className="absolute inset-0 bg-executive-accent/30 rounded-full animate-ping scale-[1.75] mix-blend-screen duration-1000"></div>
          )}
          
          <button
            onClick={toggleConnection}
            className={`relative z-10 w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl backdrop-blur-md
              ${isConnected 
                ? 'bg-gradient-to-br from-executive-accent to-blue-600 text-slate-900 scale-110 shadow-[0_0_60px_rgba(56,189,248,0.4)]' 
                : isConnecting
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-slate-900 scale-105 shadow-[0_0_40px_rgba(56,189,248,0.2)]'
                : 'bg-white border border-slate-200 text-executive-gold hover:bg-slate-100 hover:shadow-[0_0_40px_rgba(197,160,89,0.15)]'
              }`}
            disabled={isConnecting}
          >
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
            {isConnecting ? (
              <Loader2 size={56} className="animate-spin relative z-10" />
            ) : isConnected ? (
              <Radio size={56} className="animate-pulse relative z-10" />
            ) : (
              <Mic size={56} className="relative z-10" />
            )}
          </button>
        </div>

        {/* Status Text */}
        <div className="h-12 flex flex-col items-center justify-center">
          <p className="text-xl font-medium tracking-wide text-slate-600">
             {isConnecting ? "Establishing connection to Nia..." :
             isConnected ? "Nia is listening. Speak naturally..." : 
             "Tap to initialize Nia"}
          </p>
          {isError && (
             <div className="bg-red-500/10 text-red-400 text-sm mt-4 p-3 rounded-xl border border-red-500/20 max-w-md text-center flex items-start shadow-sm">
               <AlertTriangle size={16} className="mt-0.5 mr-2 shrink-0" />
               <p>{isError}</p>
             </div>
          )}
        </div>

        {/* Live Transcript Box */}
        {(isConnected || transcript || niaTranscript) && (
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-[2rem] p-8 shadow-2xl backdrop-blur-md flex flex-col space-y-6">
            {/* User Transcript */}
            <div className="flex-1 flex flex-col overflow-y-auto min-h-[80px] pb-6 border-b border-slate-200 last:border-0 custom-scrollbar pr-2">
               <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">You</div>
               <p className="text-2xl font-serif tracking-tight leading-relaxed text-slate-700 flex flex-wrap items-end gap-x-2 gap-y-2">
                 {!transcript ? (
                   <span className="italic text-slate-500 font-sans text-lg">Awaiting input...</span>
                 ) : (
                   transcript.split(' ').map((word, i, arr) => {
                     const distance = arr.length - 1 - i;
                     let scaleClass = 'scale-100 opacity-60';
                     if (distance === 0) scaleClass = 'scale-110 font-bold text-slate-900 drop-shadow-md';
                     else if (distance === 1) scaleClass = 'scale-105 font-medium text-slate-800';
                     else if (distance === 2) scaleClass = 'scale-100 text-slate-700';
                     return (
                       <span key={i} className={`transition-all duration-300 origin-bottom-left inline-block ${scaleClass}`}>
                         {word}
                       </span>
                     );
                   })
                 )}
               </p>
            </div>
            
            {/* Nia Transcript */}
            {(niaTranscript) && (
              <div className="flex-1 flex flex-col overflow-y-auto min-h-[80px] pt-2 custom-scrollbar pr-2">
                 <div className="text-[10px] font-bold text-executive-gold uppercase tracking-[0.2em] mb-3">Nia</div>
                 <p className="text-2xl font-serif tracking-tight leading-relaxed text-slate-900">
                   {niaTranscript}
                 </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Assistant Overview (Only visible when connected) */}
      {(isConnected || transcript) && (
        <div className="w-full lg:w-1/2 flex flex-col space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 overflow-y-visible pr-4 pb-12">
          
          {/* Assistant's Recent Actions */}
          <div className="bg-white rounded-[2rem] p-8 border-l-4 border-executive-gold shadow-lg backdrop-blur-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-executive-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-executive-gold/20 p-2.5 rounded-full shrink-0 shadow-[0_0_15px_rgba(197,160,89,0.2)]">
                  <Volume2 size={24} className="text-executive-gold" />
                </div>
                <p className="text-sm font-bold text-executive-gold tracking-widest uppercase">System Actions</p>
              </div>
              {recentActions.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Awaiting instructions.</p>
              ) : (
                <div className="flex flex-col space-y-3 w-full">
                  {recentActions.map(action => (
                    <p key={action.id} className="text-slate-600 text-sm leading-relaxed bg-white p-4 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-bottom-2 shadow-sm font-medium">
                      {action.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mini Tasks Overview */}
          <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-lg backdrop-blur-md">
             <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-5">Pending Tasks</h4>
             <div className="space-y-3">
               {data.tasks.filter((t: any) => t.status === 'PENDING').slice(0, 5).map((t: any) => (
                 <div key={t.id} className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center hover:bg-black/40 transition-colors">
                    <span className="font-semibold truncate pr-3">{t.title}</span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-widest border ${
                      t.priority === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      t.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      t.priority === 'LOW' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      'bg-white text-slate-500 border-slate-200'
                    }`}>{t.priority}</span>
                 </div>
               ))}
               {data.tasks.filter((t: any) => t.status === 'PENDING').length === 0 && (
                 <p className="text-sm text-slate-500 italic">No pending tasks.</p>
               )}
             </div>
          </div>
             
          {/* Mini Schedule Overview */}
          <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-lg backdrop-blur-md">
             <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-5">Upcoming Meetings</h4>
             <div className="space-y-3">
               {data.events.filter((e: any) => new Date(e.datetime) >= new Date()).sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()).slice(0, 5).map((e: any) => (
                 <div key={e.id} className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 hover:bg-black/40 transition-colors">
                    <div className="font-semibold text-slate-900 tracking-wide">{e.title}</div>
                    <div className="text-[11px] text-executive-gold font-mono mt-1.5 font-bold tracking-wider uppercase">{new Date(e.datetime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                 </div>
               ))}
               {data.events.filter((e: any) => new Date(e.datetime) >= new Date()).length === 0 && (
                 <p className="text-sm text-slate-500 italic">No upcoming meetings.</p>
               )}
             </div>
          </div>
          
        </div>
      )}
      {actionToast && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 text-emerald-400 px-6 py-3 rounded-full shadow-lg shadow-emerald-900/20 flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="font-bold tracking-wide text-sm">{actionToast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Loader2, Volume2, Square, Plus, Radio, AlertTriangle } from 'lucide-react';
import { useLiveApi } from '../hooks/useLiveApi';

export default function VoiceHub({ data }: { data: any }) {
  const [recentActions, setRecentActions] = useState<{id: string, text: string}[]>([]);
  
  const handleAction = useCallback((action: any) => {
    executeAction(action);
  }, [data]);
  
  const { isConnected, isConnecting, isError, transcript, riaTranscript, connect, disconnect, sendContextUpdate } = useLiveApi(handleAction);

  const toggleConnection = () => {
    if (isConnected || isConnecting) {
      disconnect();
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
      data.saveTasks([...data.tasks, {
        id: crypto.randomUUID(),
        title: payload.title,
        priority: payload.priority || 'UNASSIGNED',
        deadline: payload.deadline || now.split('T')[0],
        status: 'PENDING',
        tags: payload.tags || []
      }]);
      addActionLog(`Added task: ${payload.title}`);
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
      data.saveNotes([...data.notes, {
        id: crypto.randomUUID(),
        content: payload.content || payload.title,
        type: payload.type || 'idea',
        timestamp: now,
        tags: payload.tags || []
      }]);
      addActionLog(`Saved note: ${payload.content || payload.title}`);
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
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping scale-150"></div>
          )}
          
          <button
            onClick={toggleConnection}
            className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_40px_rgba(201,168,76,0.15)]
              ${isConnected 
                ? 'bg-blue-600 text-white scale-110 shadow-[0_0_60px_rgba(37,99,235,0.4)]' 
                : isConnecting
                ? 'bg-blue-400 text-white scale-105 shadow-[0_0_40px_rgba(37,99,235,0.2)]'
                : 'bg-white border-2 border-executive-gold text-executive-gold hover:bg-slate-100'
              }`}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 size={48} className="animate-spin" />
            ) : isConnected ? (
              <Radio size={48} className="animate-pulse" />
            ) : (
              <Mic size={48} />
            )}
          </button>
        </div>

        {/* Status Text */}
        <div className="h-12 flex flex-col items-center justify-center">
          <p className="text-xl font-light text-slate-600">
             {isConnecting ? "Connecting to Ria..." :
             isConnected ? "Ria is listening. Speak naturally..." : 
             "Tap to connect to Ria"}
          </p>
          {isError && (
             <div className="bg-red-50 text-red-600 text-sm mt-4 p-3 rounded-lg border border-red-100 max-w-md text-center flex items-start">
               <AlertTriangle size={16} className="mt-0.5 mr-2 shrink-0" />
               <p>{isError}</p>
             </div>
          )}
        </div>

        {/* Live Transcript Box */}
        {(isConnected || transcript || riaTranscript) && (
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col space-y-4 max-h-[350px] overflow-hidden">
            {/* User Transcript */}
            <div className="flex-1 flex flex-col overflow-y-auto min-h-[60px] pb-2 border-b border-slate-100 last:border-0">
               <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">You</div>
               <p className="text-lg leading-relaxed text-slate-700 flex flex-wrap items-end gap-x-1.5 gap-y-2">
                 {!transcript ? (
                   <span className="italic text-slate-400">Listening...</span>
                 ) : (
                   transcript.split(' ').map((word, i, arr) => {
                     const distance = arr.length - 1 - i;
                     let scaleClass = 'scale-100 opacity-80';
                     if (distance === 0) scaleClass = 'scale-110 font-semibold text-blue-700';
                     else if (distance === 1) scaleClass = 'scale-105 font-medium text-blue-600';
                     else if (distance === 2) scaleClass = 'scale-100 text-blue-500';
                     return (
                       <span key={i} className={`transition-all duration-300 origin-bottom-left inline-block ${scaleClass}`}>
                         {word}
                       </span>
                     );
                   })
                 )}
               </p>
            </div>
            
            {/* Ria Transcript */}
            {(riaTranscript) && (
              <div className="flex-1 flex flex-col overflow-y-auto min-h-[60px] pt-2">
                 <div className="text-xs font-bold text-executive-gold uppercase tracking-widest mb-2">Ria</div>
                 <p className="text-lg leading-relaxed text-slate-800">
                   {riaTranscript}
                 </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Assistant Overview (Only visible when connected) */}
      {(isConnected || transcript) && (
        <div className="w-full lg:w-1/2 flex flex-col space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 max-h-[80vh] overflow-y-auto pr-4 pb-12">
          
          {/* Assistant's Recent Actions */}
          <div className="bg-white rounded-2xl p-6 border-l-4 border-executive-gold shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-executive-gold/20 p-2 rounded-full shrink-0">
                <Volume2 size={20} className="text-executive-gold" />
              </div>
              <p className="text-sm font-semibold text-executive-gold">System Actions</p>
            </div>
            {recentActions.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No actions taken yet in this session.</p>
            ) : (
              <div className="flex flex-col space-y-3 w-full">
                {recentActions.map(action => (
                  <p key={action.id} className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                    {action.text}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Mini Tasks Overview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Pending Tasks</h4>
             <div className="space-y-3">
               {data.tasks.filter((t: any) => t.status === 'PENDING').slice(0, 5).map((t: any) => (
                 <div key={t.id} className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                    <span className="font-medium truncate pr-2">{t.title}</span>
                    <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${
                      t.priority === 'HIGH' ? 'bg-red-100 text-red-600' :
                      t.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-600' :
                      t.priority === 'LOW' ? 'bg-green-100 text-green-600' :
                      'bg-slate-200 text-slate-600'
                    }`}>{t.priority}</span>
                 </div>
               ))}
               {data.tasks.filter((t: any) => t.status === 'PENDING').length === 0 && (
                 <p className="text-sm text-slate-400 italic">No pending tasks.</p>
               )}
             </div>
          </div>
             
          {/* Mini Schedule Overview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Upcoming Meetings</h4>
             <div className="space-y-3">
               {data.events.filter((e: any) => new Date(e.datetime) >= new Date()).sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()).slice(0, 5).map((e: any) => (
                 <div key={e.id} className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="font-semibold text-slate-800">{e.title}</div>
                    <div className="text-xs text-slate-500 mt-1">{new Date(e.datetime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                 </div>
               ))}
               {data.events.filter((e: any) => new Date(e.datetime) >= new Date()).length === 0 && (
                 <p className="text-sm text-slate-400 italic">No upcoming meetings.</p>
               )}
             </div>
          </div>
          
        </div>
      )}
    </div>
  );
}

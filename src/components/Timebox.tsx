import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, AlertCircle, Edit2, Check, X } from 'lucide-react';
import { Task, Event } from '../types';

interface TimeboxProps {
  tasks: Task[];
  events: Event[];
  saveTasks: (tasks: Task[]) => void;
}

interface Block {
  id: string;
  startTime: Date;
  endTime: Date;
  title: string;
  type: 'TASK' | 'EVENT' | 'BREAK' | 'FREE';
  refId?: string; // ID of the task or event
  completed: boolean;
}

export default function Timebox({ tasks, events, saveTasks }: TimeboxProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  
  const handleEditClick = (b: Block) => {
    setEditingBlockId(b.id);
    setEditTitle(b.title);
    
    const sH = b.startTime.getHours().toString().padStart(2, '0');
    const sM = b.startTime.getMinutes().toString().padStart(2, '0');
    setEditStartTime(`${sH}:${sM}`);
    
    const eH = b.endTime.getHours().toString().padStart(2, '0');
    const eM = b.endTime.getMinutes().toString().padStart(2, '0');
    setEditEndTime(`${eH}:${eM}`);
  };

  const saveBlockEdit = (id: string) => {
    setBlocks(blocks.map(b => {
      if (b.id === id) {
        const newStart = new Date(b.startTime);
        const [sh, sm] = editStartTime.split(':');
        newStart.setHours(parseInt(sh, 10), parseInt(sm, 10), 0);
        
        const newEnd = new Date(b.endTime);
        const [eh, em] = editEndTime.split(':');
        newEnd.setHours(parseInt(eh, 10), parseInt(em, 10), 0);
        
        return { ...b, title: editTitle, startTime: newStart, endTime: newEnd };
      }
      return b;
    }));
    setEditingBlockId(null);
  };


  useEffect(() => {
    generateTimeblocks();
  }, [tasks, events]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft <= 0 && timerActive) {
      setTimerActive(false);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("Time's up!", { body: `Timebox complete for: ${activeBlock?.title}` });
      }
      handleBlockComplete();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const handleBlockComplete = async () => {
    if (!activeBlock) return;

    // If it's a task, mark it as completed
    if (activeBlock.type === 'TASK' && activeBlock.refId) {
      const updatedTasks = tasks.map(t => 
        t.id === activeBlock.refId ? { ...t, status: 'COMPLETED' as const } : t
      );
      saveTasks(updatedTasks);
    }

    // Show celebration
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      setActiveBlock(null);
      generateTimeblocks(); // Regenerate to adjust for completed tasks
    }, 3000);
  };

  const generateTimeblocks = () => {
    // A simplified algorithm to generate Musk-style 15-minute timeblocks for the rest of the day
    const now = new Date();
    // Start from the nearest upcoming 15 minute interval
    const startOfDay = new Date(now);
    startOfDay.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);

    const generatedBlocks: Block[] = [];
    let currentTime = new Date(startOfDay);
    
    // Get high priority pending tasks
    const pendingTasks = tasks.filter(t => t.status === 'PENDING').sort((a, b) => {
      const pValues = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, 'UNASSIGNED': 0 };
      return pValues[b.priority] - pValues[a.priority];
    });

    let taskIndex = 0;

    // Generate blocks for the next 4 hours (16 blocks of 15 mins)
    for (let i = 0; i < 16; i++) {
      const blockEnd = new Date(currentTime.getTime() + 15 * 60000);
      
      // Check if there is an overlapping event
      const overlappingEvent = events.find(e => {
        if (!e.datetime || e.status === 'CANCELLED') return false;
        const eStart = new Date(e.datetime);
        const eEnd = new Date(eStart.getTime() + (parseInt(e.duration) || 60) * 60000);
        return currentTime < eEnd && blockEnd > eStart;
      });

      if (overlappingEvent) {
        generatedBlocks.push({
          id: `block-${i}`,
          startTime: new Date(currentTime),
          endTime: new Date(blockEnd),
          title: overlappingEvent.title,
          type: 'EVENT',
          refId: overlappingEvent.id,
          completed: false
        });
      } else if (taskIndex < pendingTasks.length) {
        const task = pendingTasks[taskIndex];
        generatedBlocks.push({
          id: `block-${i}`,
          startTime: new Date(currentTime),
          endTime: new Date(blockEnd),
          title: task.title,
          type: 'TASK',
          refId: task.id,
          completed: false
        });
        // Rotate tasks or move to next
        if (i % 2 !== 0) {
          taskIndex++; // Spend roughly 30 mins per task max
        }
      } else {
        generatedBlocks.push({
          id: `block-${i}`,
          startTime: new Date(currentTime),
          endTime: new Date(blockEnd),
          title: 'Strategic Free Time',
          type: 'FREE',
          completed: false
        });
      }

      currentTime = new Date(blockEnd);
    }

    setBlocks(generatedBlocks);
  };

  const startBlock = (block: Block) => {
    setActiveBlock(block);
    // calculate time left in seconds based on 15 min block, or just set it to 15 * 60
    setTimeLeft(15 * 60);
    setTimerActive(true);
  };

  const stopTimer = () => {
    setTimerActive(false);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimeLeft(15 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatClockTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col space-y-6 min-h-full pb-10">
      <div className="flex justify-between items-center bg-white backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-lg">
        <div>
          <h2 className="text-3xl font-serif tracking-tight font-bold text-slate-900 tracking-wide">Executive Timebox</h2>
          <p className="text-sm text-slate-500 mt-1 uppercase tracking-wider font-semibold">Ruthless prioritization in 15-minute increments</p>
        </div>
        <div className="flex gap-3">
           <button onClick={generateTimeblocks} className="px-5 py-2.5 bg-slate-50 hover:bg-slate-200 text-slate-900 text-xs tracking-wider uppercase font-bold rounded-xl transition-colors border border-slate-100">
             Recalculate Schedule
           </button>
        </div>
      </div>

      {activeBlock && (
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-[2rem] p-6 sm:p-10 text-center shadow-2xl border border-slate-200 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-executive-gold/20 via-transparent to-transparent opacity-30 mix-blend-screen transition-opacity duration-1000 group-hover:opacity-50"></div>
          
          <div className="relative z-10">
            <div className="inline-block px-3 sm:px-4 py-1.5 rounded-full bg-white border border-slate-200 mb-4 sm:mb-6">
              <h3 className="text-executive-gold font-bold tracking-[0.2em] uppercase text-[10px] sm:text-xs">Current Focus</h3>
            </div>
            
            <p className="text-2xl sm:text-4xl text-slate-900 font-serif tracking-tight font-bold mb-4 sm:mb-8 leading-tight max-w-2xl mx-auto line-clamp-2">{activeBlock.title}</p>
            
            <div className="text-[5rem] sm:text-[8rem] md:text-[12rem] lg:text-[16rem] leading-none font-mono text-slate-900 mb-6 sm:mb-10 font-light tracking-tighter tabular-nums drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]">
              {formatTime(timeLeft)}
            </div>
            
            <div className="flex justify-center items-center gap-3 sm:gap-6">
              <button onClick={resetTimer} className="w-12 h-12 sm:w-16 sm:h-16 bg-white hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all transform hover:scale-105 shrink-0" title="Reset">
                <Square size={20} className="sm:w-6 sm:h-6" />
              </button>
              
              {timerActive ? (
                <button onClick={stopTimer} className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-50 hover:bg-slate-200 rounded-[1.25rem] sm:rounded-3xl flex items-center justify-center text-slate-900 transition-all transform hover:scale-105 backdrop-blur-sm shadow-xl shrink-0" title="Pause">
                  <Pause size={28} className="sm:w-9 sm:h-9" />
                </button>
              ) : (
                <button onClick={() => setTimerActive(true)} className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-executive-gold to-executive-gold-dim hover:from-amber-400 hover:to-executive-gold rounded-[1.25rem] sm:rounded-3xl flex items-center justify-center text-executive-navy transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(197,160,89,0.3)] shrink-0" title="Play">
                  <Play size={32} className="ml-1 sm:ml-2 sm:w-10 sm:h-10" />
                </button>
              )}

              <button onClick={handleBlockComplete} className="h-12 sm:h-16 px-4 sm:px-8 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-2xl flex items-center justify-center text-slate-900 font-bold tracking-widest text-[10px] sm:text-sm transition-all transform hover:scale-105 shadow-lg flex-1 sm:flex-none max-w-[140px] sm:max-w-none" title="Complete">
                COMPLETE
              </button>
            </div>
          </div>
        </div>
      )}

      {showCelebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-executive-navy/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-50 rounded-[2rem] p-16 text-center shadow-2xl border border-slate-200 max-w-md w-full mx-4 transform scale-100 animate-in zoom-in-90 duration-500">
            <div className="w-28 h-28 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/30">
               <span className="text-6xl animate-bounce">🎉</span>
            </div>
            <h2 className="text-4xl font-serif tracking-tight font-bold text-slate-900 mb-4">Masterful.</h2>
            <p className="text-slate-500 text-lg">Time successfully captured. <br/>Recalculating strategy for maximum efficiency...</p>
          </div>
        </div>
      )}

      <div className="flex-1 pr-2 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">

          {blocks.map((block) => (
            <div 
              key={block.id} 
              className={`flex flex-col bg-white rounded-3xl border overflow-hidden transition-all duration-300 hover:bg-slate-100 ${activeBlock?.id === block.id ? 'border-executive-gold shadow-[0_0_20px_rgba(197,160,89,0.2)] transform scale-[1.03] ring-1 ring-executive-gold' : 'border-slate-200 hover:border-slate-300'}`}
            >
              {editingBlockId === block.id ? (
                <div className="p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                     <input type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-mono w-full" />
                     <span>-</span>
                     <input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-mono w-full" />
                  </div>
                  <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-2 text-sm" />
                  <div className="flex justify-end space-x-2 pt-2">
                    <button onClick={() => setEditingBlockId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded bg-slate-100"><X size={16}/></button>
                    <button onClick={() => saveBlockEdit(block.id)} className="p-1.5 text-white bg-slate-900 rounded hover:bg-slate-800"><Check size={16}/></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`w-full flex justify-between items-center py-4 px-6 border-b border-slate-100 ${block.type === 'EVENT' ? 'bg-amber-900/20' : block.type === 'FREE' ? 'bg-transparent text-slate-500' : 'bg-white'}`}>
                    <div className="flex items-center space-x-3">
                      <Clock size={16} className={block.type === 'EVENT' ? 'text-amber-400' : block.type === 'TASK' ? 'text-blue-400' : 'text-slate-500'} />
                      <span className="text-sm font-mono font-bold text-slate-900">{formatClockTime(block.startTime)}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                       <span className="text-xs font-mono text-slate-500">{formatClockTime(block.endTime)}</span>
                       <button onClick={() => handleEditClick(block)} className="text-slate-400 hover:text-executive-gold transition-colors"><Edit2 size={14}/></button>
                    </div>
                  </div>
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg mb-4 inline-block border ${
                        block.type === 'EVENT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        block.type === 'TASK' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-white text-slate-500 border-slate-200'
                      }`}>
                        {block.type}
                      </span>
                      <p className={`text-xl font-medium tracking-wide mb-4 ${block.type === 'FREE' ? 'text-slate-500 italic' : 'text-slate-700'}`}>{block.title}</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                      {block.type !== 'FREE' && activeBlock?.id !== block.id && (
                        <button 
                          onClick={() => startBlock(block)}
                          className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-executive-gold hover:text-executive-navy hover:border-executive-gold transition-all transform hover:scale-110 shadow-sm"
                        >
                          <Play size={22} className="ml-1" />
                        </button>
                      )}
                      {activeBlock?.id === block.id && (
                        <div className="flex items-center text-executive-gold font-bold text-sm tracking-widest uppercase bg-executive-gold/10 px-5 py-3 rounded-xl border border-executive-gold/20">
                          <div className="w-2 h-2 rounded-full bg-executive-gold animate-ping mr-3"></div>
                          Active
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}

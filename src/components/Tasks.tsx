import { useState, useEffect, useRef } from 'react';
import { Task } from '../types';
import { CheckCircle2, Circle, Clock, Edit2, Trash2, X, Check, Brain, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function Tasks({ tasks, saveTasks, notes = [], saveNotes }: { tasks: Task[], saveTasks: (t: Task[]) => void, notes?: any[], saveNotes?: (n: any[]) => void }) {
  const [filter, setFilter] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'PAST' | 'COMPLETED'>('TODAY');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [analysisState, setAnalysisState] = useState<Record<string, { loading: boolean, data?: string, error?: string }>>({});
  
  // Selection saving logic
  const [selection, setSelection] = useState<{ text: string, x: number, y: number, show: boolean }>({ text: '', x: 0, y: 0, show: false });
  const analysisContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      const activeSelection = window.getSelection();
      if (!activeSelection || activeSelection.isCollapsed) {
        setSelection(s => ({ ...s, show: false }));
        return;
      }
      
      const text = activeSelection.toString().trim();
      if (!text) {
        setSelection(s => ({ ...s, show: false }));
        return;
      }

      // Check if selection is within our task list
      let node = activeSelection.anchorNode;
      let isInsideAnalysis = false;
      while (node && node.nodeName !== 'BODY') {
        if (node.parentElement?.closest('.markdown-body')) {
          isInsideAnalysis = true;
          break;
        }
        node = node.parentElement;
      }

      if (isInsideAnalysis) {
        const range = activeSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelection({
          text,
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
          show: true
        });
      } else {
        setSelection(s => ({ ...s, show: false }));
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const handleSaveNote = () => {
    if (!selection.text) return;
    
    const newNote = {
      id: crypto.randomUUID(),
      content: selection.text,
      type: 'idea',
      timestamp: new Date().toISOString(),
      tags: ['analysis-highlight']
    };
    
    if (saveNotes) {
      saveNotes([...notes, newNote]);
    }
    
    setSelection(s => ({ ...s, show: false }));
    window.getSelection()?.removeAllRanges();
    alert('Saved to Notes!');
  };

  const saveFullAnalysisAsNote = (analysisText: string, taskTitle: string) => {
    if (!analysisText) return;
    
    const newNote = {
      id: crypto.randomUUID(),
      content: `### Analysis for: ${taskTitle}\n\n${analysisText}`,
      type: 'idea',
      timestamp: new Date().toISOString(),
      tags: ['full-analysis', 'ai-generated']
    };
    
    if (saveNotes) {
      saveNotes([...notes, newNote]);
    }
    
    alert('Full analysis saved to Notes!');
  };

  const handleAnalyzeTask = async (task: Task) => {
    setAnalysisState(prev => ({ ...prev, [task.id]: { loading: true } }));
    try {
      const lang = localStorage.getItem('language') || 'en';
      const res = await fetch('/api/analyze-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: task.title,
          context: task,
          apiKey: localStorage.getItem('GEMINI_API_KEY') || '',
          lang
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysisState(prev => ({ ...prev, [task.id]: { loading: false, data: data.analysis } }));
    } catch (error: any) {
      setAnalysisState(prev => ({ ...prev, [task.id]: { loading: false, error: error.message } }));
    }
  };

  const toggleTask = (id: string) => {
    saveTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t));
  };

  const cyclePriority = (id: string, currentPriority: string) => {
    const sequence: any = { 'UNASSIGNED': 'LOW', 'LOW': 'MEDIUM', 'MEDIUM': 'HIGH', 'HIGH': 'UNASSIGNED' };
    const next = sequence[currentPriority] || 'LOW';
    saveTasks(tasks.map(t => t.id === id ? { ...t, priority: next } : t));
  };

  const deleteTask = (id: string) => {
    saveTasks(tasks.filter(t => t.id !== id));
  };

  const handleSaveEdit = () => {
    if (editingTask) {
      if (!tasks.find(t => t.id === editingTask.id)) {
        saveTasks([...tasks, editingTask]);
      } else {
        saveTasks(tasks.map(t => t.id === editingTask.id ? editingTask : t));
      }
      setEditingTask(null);
    }
  };

  const handleCreateTask = () => {
    setEditingTask({
      id: crypto.randomUUID(),
      title: '',
      status: 'PENDING',
      deadline: new Date().toISOString().split('T')[0],
      priority: 'UNASSIGNED',
      tags: []
    });
  };

  const getFilteredTasks = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

    return tasks.filter(t => {
      if (filter === 'ALL') return true;
      if (filter === 'COMPLETED') return t.status === 'COMPLETED';
      if (filter === 'TODAY') return t.deadline === todayStr || (!t.deadline && t.status === 'PENDING');
      if (filter === 'TOMORROW') return t.deadline === tomorrowStr && t.status === 'PENDING';
      if (filter === 'PAST') return t.deadline < todayStr && t.status === 'PENDING';
      return true;
    }).sort((a, b) => {
      if (a.status !== b.status) return a.status === 'PENDING' ? -1 : 1;
      const priorities = { HIGH: 3, MEDIUM: 2, LOW: 1, UNASSIGNED: 0 };
      return priorities[b.priority] - priorities[a.priority];
    });
  };

  const filteredTasks = getFilteredTasks();
  
  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const overdueCount = tasks.filter(t => t.deadline < todayStr && t.status === 'PENDING').length;
  const dueTomorrowCount = tasks.filter(t => t.deadline === tomorrowStr && t.status === 'PENDING').length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20 relative" ref={analysisContainerRef}>
      {selection.show && (
        <div 
          className="fixed z-[100] animate-in fade-in zoom-in-95 duration-200 shadow-2xl"
          style={{ 
            left: `${selection.x}px`, 
            top: `${selection.y}px`, 
            transform: 'translate(-50%, -100%)' 
          }}
        >
          <button 
            onClick={handleSaveNote}
            className="flex items-center space-x-2 bg-gradient-to-r from-executive-gold to-executive-gold-dim text-executive-navy px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide hover:from-amber-400 hover:to-executive-gold transition-all shadow-lg whitespace-nowrap"
          >
            <Save size={16} />
            <span>Save Highlight</span>
          </button>
        </div>
      )}

      {/* Visual Summary Header */}
      <div className="bg-white backdrop-blur-md p-5 sm:p-8 rounded-[2rem] shadow-lg border border-slate-200 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-executive-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10">
          <h2 className="text-xl sm:text-2xl font-serif tracking-tight font-bold text-slate-900 mb-6">Status Overview</h2>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-4xl sm:text-5xl font-mono font-light text-executive-gold">{completionPercentage}%</div>
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest sm:tracking-[0.2em] font-bold mt-1">Completion</p>
            </div>
            <div className="text-right">
              <div className="text-3xl sm:text-4xl font-mono font-light text-slate-600">{totalTasks}</div>
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest sm:tracking-[0.2em] font-bold mt-1">Total Tasks</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 mb-8 border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-executive-gold-dim to-executive-gold h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${completionPercentage}%` }}></div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div className="bg-red-500/10 p-2 sm:p-4 rounded-2xl border border-red-500/20">
              <div className="text-xl sm:text-2xl font-mono text-red-400">{overdueCount}</div>
              <div className="text-[9px] sm:text-[10px] text-red-500/80 uppercase tracking-widest sm:tracking-[0.1em] font-bold mt-1">Overdue</div>
            </div>
            <div className="bg-amber-500/10 p-2 sm:p-4 rounded-2xl border border-amber-500/20">
              <div className="text-xl sm:text-2xl font-mono text-amber-400">{dueTomorrowCount}</div>
              <div className="text-[9px] sm:text-[10px] text-amber-500/80 uppercase tracking-widest sm:tracking-[0.1em] font-bold mt-1">Tomorrow</div>
            </div>
            <div className="bg-emerald-500/10 p-2 sm:p-4 rounded-2xl border border-emerald-500/20">
              <div className="text-xl sm:text-2xl font-mono text-emerald-400">{completedTasks}</div>
              <div className="text-[9px] sm:text-[10px] text-emerald-500/80 uppercase tracking-widest sm:tracking-[0.1em] font-bold mt-1">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-2 custom-scrollbar">
          {['TODAY', 'TOMORROW', 'PAST', 'COMPLETED', 'ALL'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider whitespace-nowrap transition-all border ${
                filter === f 
                  ? 'bg-executive-gold/20 text-executive-gold border-executive-gold/30 shadow-[0_0_15px_rgba(197,160,89,0.15)]' 
                  : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-100 hover:text-slate-900'
              } uppercase`}
            >
              {f === 'TODAY' && 'Today'}
              {f === 'TOMORROW' && 'Tomorrow'}
              {f === 'PAST' && 'Overdue'}
              {f === 'COMPLETED' && 'Completed'}
              {f === 'ALL' && 'All Tasks'}
            </button>
          ))}
        </div>
        <button
          onClick={handleCreateTask}
          className="shrink-0 flex items-center justify-center space-x-2 bg-executive-gold hover:bg-amber-400 text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm ml-4"
        >
          <Edit2 size={16} />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-white border-slate-200 rounded-[2rem] border border-dashed">
            <CheckCircle2 size={56} className="mx-auto text-executive-gold/20 mb-5" />
            <p className="text-slate-600 font-serif tracking-tight text-xl">No tasks pending.</p>
            <p className="text-sm text-slate-500 mt-2 font-medium tracking-wide">Command Nia to orchestrate a new directive.</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.id} 
              className={`flex items-start p-6 rounded-2xl transition-all duration-300 border ${
                task.status === 'COMPLETED' 
                  ? 'bg-slate-50 border-slate-100 opacity-50' 
                  : 'bg-white border-slate-200 hover:border-executive-gold/30 hover:bg-slate-100 shadow-lg'
              }`}
            >
              <button 
                onClick={() => toggleTask(task.id)}
                className={`mt-0.5 mr-5 shrink-0 transition-transform hover:scale-110 ${task.status === 'COMPLETED' ? 'text-emerald-500' : 'text-executive-gold/70 hover:text-executive-gold'}`}
              >
                {task.status === 'COMPLETED' ? <CheckCircle2 size={28} /> : <Circle size={28} />}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`text-xl font-medium tracking-wide ${task.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-slate-700'}`}>
                  {task.title}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                  <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-100" onClick={(e) => e.stopPropagation()}>
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => saveTasks(tasks.map(t => t.id === task.id ? { ...t, priority: p } : t))}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold tracking-[0.1em] transition-colors ${
                          task.priority === p 
                            ? p === 'HIGH' ? 'bg-red-500/20 text-red-400 shadow-sm border-red-500/30 border' 
                            : p === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 shadow-sm border-amber-500/30 border'
                            : 'bg-emerald-500/20 text-emerald-400 shadow-sm border-emerald-500/30 border'
                            : 'text-slate-500 hover:text-slate-300 border border-transparent'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  
                  {task.deadline && (() => {
                    const isOverdue = task.status === 'PENDING' && task.deadline < todayStr;
                    const isDueToday = task.status === 'PENDING' && task.deadline === todayStr;
                    const isDueTomorrow = task.status === 'PENDING' && task.deadline === tomorrowStr;
                    
                    return (
                      <span className={`flex items-center font-medium px-3 py-1.5 rounded-lg border text-[11px] tracking-wide ${
                        isOverdue ? 'text-red-400 bg-red-900/20 border-red-500/30' :
                        isDueToday ? 'text-amber-400 bg-amber-900/20 border-amber-500/30' :
                        isDueTomorrow ? 'text-blue-400 bg-blue-900/20 border-blue-500/30' :
                        'text-slate-500 bg-white border-slate-200'
                      }`}>
                        <Clock size={12} className="mr-1.5" />
                        {isOverdue ? `Overdue (${task.deadline})` : 
                         isDueToday ? `Due Today` :
                         isDueTomorrow ? `Due Tomorrow` : 
                         task.deadline}
                      </span>
                    );
                  })()}
                  
                  {task.tags?.map(tag => (
                    <span key={tag} className="text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[11px] tracking-wider uppercase font-bold">
                      #{tag}
                    </span>
                  ))}
                </div>
                
                {/* Intelligent Analysis Rendering */}
                {analysisState[task.id] && (
                  <div className="mt-5 p-5 bg-slate-50 rounded-2xl border border-executive-gold/20 text-sm relative group">
                    {analysisState[task.id].loading ? (
                      <div className="flex items-center text-executive-gold animate-pulse font-bold tracking-wide">
                        <Brain size={18} className="mr-3" /> Processing...
                      </div>
                    ) : analysisState[task.id].error ? (
                      <div className="text-red-400 text-xs bg-red-500/10 p-3 rounded-lg">Error: {analysisState[task.id].error}</div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-bold text-executive-gold uppercase tracking-[0.2em]">Nia Analysis</span>
                          <button 
                            onClick={() => saveFullAnalysisAsNote(analysisState[task.id].data || '', task.title)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1.5 text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg shadow-sm tracking-wider uppercase"
                            title="Save Full Analysis to Notes"
                          >
                            <Save size={12} />
                            <span>Save to Notes</span>
                          </button>
                        </div>
                        <div className="markdown-body prose prose-sm prose-invert max-w-none text-slate-600">
                          <ReactMarkdown>{analysisState[task.id].data || ''}</ReactMarkdown>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 ml-5 self-start shrink-0">
                <button 
                  onClick={() => handleAnalyzeTask(task)}
                  disabled={analysisState[task.id]?.loading}
                  className={`transition-all p-2.5 rounded-xl border ${analysisState[task.id]?.loading ? 'text-executive-gold/50 bg-white border-slate-100 cursor-not-allowed' : 'text-slate-500 border-slate-100 hover:text-executive-gold hover:border-executive-gold/30 hover:bg-executive-gold/10'} shadow-sm`}
                  title="Intelligent Analysis"
                >
                  <Brain size={18} />
                </button>
                <button 
                  onClick={() => setEditingTask(task)}
                  className="transition-all p-2.5 rounded-xl border border-slate-100 text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100 shadow-sm"
                  title="Edit Task"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="transition-all p-2.5 rounded-xl border border-slate-100 text-slate-500 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 shadow-sm"
                  title="Delete Task"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-executive-navy/80 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in p-4">
          <div className="bg-slate-50 border border-slate-200 w-full max-w-lg rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-serif tracking-tight font-bold text-slate-900">Edit Directive</h3>
              <button onClick={() => setEditingTask(null)} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 block">Title</label>
                <input 
                  type="text" 
                  value={editingTask.title} 
                  onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-5 py-4 focus:outline-none focus:border-executive-gold focus:ring-1 focus:ring-executive-gold transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 block">Deadline (YYYY-MM-DD)</label>
                <input 
                  type="text" 
                  value={editingTask.deadline || ''} 
                  onChange={e => setEditingTask({...editingTask, deadline: e.target.value})}
                  placeholder="e.g. 2026-07-01"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-600 rounded-xl px-5 py-4 focus:outline-none focus:border-executive-gold focus:ring-1 focus:ring-executive-gold transition-all font-mono"
                />
              </div>
              
              <div className="pt-4">
                <button 
                  onClick={handleSaveEdit}
                  className="w-full bg-gradient-to-r from-executive-gold to-executive-gold-dim hover:from-amber-400 hover:to-executive-gold text-executive-navy rounded-xl py-4 font-bold tracking-wide text-lg flex items-center justify-center transition-all shadow-lg hover:shadow-executive-gold/20 transform hover:scale-[1.02]"
                >
                  <Check size={20} className="mr-2" /> Save Directive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

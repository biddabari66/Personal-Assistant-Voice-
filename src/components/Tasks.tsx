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
      saveTasks(tasks.map(t => t.id === editingTask.id ? editingTask : t));
      setEditingTask(null);
    }
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
          className="fixed z-50 animate-in fade-in zoom-in-95 duration-200 shadow-xl"
          style={{ 
            left: `${selection.x}px`, 
            top: `${selection.y}px`, 
            transform: 'translate(-50%, -100%)' 
          }}
        >
          <button 
            onClick={handleSaveNote}
            className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg whitespace-nowrap"
          >
            <Save size={16} />
            <span>Save Highlight as Note</span>
          </button>
        </div>
      )}

      {/* Visual Summary Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Status Overview</h2>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-3xl font-bold text-executive-gold">{completionPercentage}%</div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Completion</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-slate-700">{totalTasks}</div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Tasks</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 mb-6">
          <div className="bg-executive-gold h-3 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-red-50 p-3 rounded-2xl">
            <div className="text-lg font-bold text-red-600">{overdueCount}</div>
            <div className="text-[10px] text-red-500 uppercase tracking-wider font-semibold">Overdue</div>
          </div>
          <div className="bg-amber-50 p-3 rounded-2xl">
            <div className="text-lg font-bold text-amber-600">{dueTomorrowCount}</div>
            <div className="text-[10px] text-amber-500 uppercase tracking-wider font-semibold">Tomorrow</div>
          </div>
          <div className="bg-green-50 p-3 rounded-2xl">
            <div className="text-lg font-bold text-green-600">{completedTasks}</div>
            <div className="text-[10px] text-green-500 uppercase tracking-wider font-semibold">Completed</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {['TODAY', 'TOMORROW', 'PAST', 'COMPLETED', 'ALL'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f 
                ? 'bg-executive-gold text-slate-900' 
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f === 'TODAY' && 'Today'}
            {f === 'TOMORROW' && 'Tomorrow'}
            {f === 'PAST' && 'Overdue'}
            {f === 'COMPLETED' && 'Completed'}
            {f === 'ALL' && 'All Tasks'}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border-slate-200 rounded-2xl border border-slate-200 border-dashed">
            <CheckCircle2 size={48} className="mx-auto text-executive-gold/30 mb-4" />
            <p className="text-slate-500">No tasks in this view.</p>
            <p className="text-sm text-slate-400 mt-1">Tap the Hub mic to add one.</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.id} 
              className={`flex items-start p-4 rounded-2xl transition-all ${
                task.status === 'COMPLETED' 
                  ? 'bg-slate-50 border-slate-200 opacity-60' 
                  : 'bg-white border border-slate-200 hover:border-executive-gold/50'
              }`}
            >
              <button 
                onClick={() => toggleTask(task.id)}
                className="mt-1 mr-4 text-executive-gold shrink-0 transition-transform hover:scale-110"
              >
                {task.status === 'COMPLETED' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`text-lg ${task.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                  {task.title}
                </p>
                <div className="flex items-center space-x-3 mt-2 text-xs">
                  <div className="flex bg-slate-100 rounded-lg p-0.5" onClick={(e) => e.stopPropagation()}>
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => saveTasks(tasks.map(t => t.id === task.id ? { ...t, priority: p } : t))}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-wider transition-colors ${
                          task.priority === p 
                            ? p === 'HIGH' ? 'bg-red-100 text-red-600 shadow-sm' 
                            : p === 'MEDIUM' ? 'bg-amber-100 text-amber-600 shadow-sm'
                            : 'bg-green-100 text-green-600 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
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
                      <span className={`flex items-center font-medium ${
                        isOverdue ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded' :
                        isDueToday ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded' :
                        isDueTomorrow ? 'text-blue-600 bg-blue-50 px-2 py-0.5 rounded' :
                        'text-slate-500'
                      }`}>
                        <Clock size={12} className="mr-1" />
                        {isOverdue ? `Overdue (${task.deadline})` : 
                         isDueToday ? `Due Today` :
                         isDueTomorrow ? `Due Tomorrow` : 
                         task.deadline}
                      </span>
                    );
                  })()}
                  
                  {task.tags?.map(tag => (
                    <span key={tag} className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
                
                {/* Intelligent Analysis Rendering */}
                {analysisState[task.id] && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-executive-gold/20 text-sm relative group">
                    {analysisState[task.id].loading ? (
                      <div className="flex items-center text-executive-gold animate-pulse font-medium">
                        <Brain size={16} className="mr-2" /> Thinking...
                      </div>
                    ) : analysisState[task.id].error ? (
                      <div className="text-red-500 text-xs">Error: {analysisState[task.id].error}</div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-executive-gold uppercase tracking-wider">AI Analysis</span>
                          <button 
                            onClick={() => saveFullAnalysisAsNote(analysisState[task.id].data || '', task.title)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-sm"
                            title="Save Full Analysis to Notes"
                          >
                            <Save size={12} />
                            <span>Save to Notes</span>
                          </button>
                        </div>
                        <div className="markdown-body prose prose-sm max-w-none text-slate-700">
                          <ReactMarkdown>{analysisState[task.id].data || ''}</ReactMarkdown>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 ml-4 self-start">
                <button 
                  onClick={() => handleAnalyzeTask(task)}
                  disabled={analysisState[task.id]?.loading}
                  className={`transition-colors p-2 rounded-full ${analysisState[task.id]?.loading ? 'text-executive-gold/50 bg-slate-50 cursor-not-allowed' : 'text-slate-400 hover:text-executive-gold hover:bg-slate-50'}`}
                  title="Intelligent Analysis"
                >
                  <Brain size={16} />
                </button>
                <button 
                  onClick={() => setEditingTask(task)}
                  className="text-slate-400 hover:text-executive-gold transition-colors p-2 rounded-full hover:bg-slate-50"
                  title="Edit Task"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-slate-50"
                  title="Delete Task"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Edit Task</h3>
              <button onClick={() => setEditingTask(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Title</label>
                <input 
                  type="text" 
                  value={editingTask.title} 
                  onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-executive-gold/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Deadline (YYYY-MM-DD)</label>
                <input 
                  type="text" 
                  value={editingTask.deadline || ''} 
                  onChange={e => setEditingTask({...editingTask, deadline: e.target.value})}
                  placeholder="e.g. 2026-07-01"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-executive-gold/50"
                />
              </div>
              <div className="pt-4">
                <button 
                  onClick={handleSaveEdit}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-4 font-semibold text-lg flex items-center justify-center transition-colors"
                >
                  <Check size={20} className="mr-2" /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

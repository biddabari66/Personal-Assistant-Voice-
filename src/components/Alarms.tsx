import { useState } from 'react';
import { Reminder } from '../types';
import { Bell, BellRing, Plus, Trash2, Edit2, Check, X, Mic, Volume2 } from 'lucide-react';

export default function Alarms({ reminders, saveReminders }: { reminders: Reminder[], saveReminders: (r: Reminder[]) => void }) {
  const [editingAlarm, setEditingAlarm] = useState<Reminder | null>(null);

  const handleCreate = () => {
    setEditingAlarm({
      id: crypto.randomUUID(),
      message: 'New Voice Alarm',
      triggerTime: '08:00',
      recurring: false,
      active: true,
      voiceAlarm: true,
      days: []
    });
  };

  const handleSave = () => {
    if (editingAlarm) {
      if (!reminders.find(r => r.id === editingAlarm.id)) {
        saveReminders([...reminders, editingAlarm]);
      } else {
        saveReminders(reminders.map(r => r.id === editingAlarm.id ? editingAlarm : r));
      }
      setEditingAlarm(null);
    }
  };

  const toggleActive = (id: string) => {
    saveReminders(reminders.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const handleDelete = (id: string) => {
    saveReminders(reminders.filter(r => r.id !== id));
  };

  const toggleDay = (day: number) => {
    if (!editingAlarm) return;
    const days = editingAlarm.days || [];
    const newDays = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
    setEditingAlarm({ ...editingAlarm, days: newDays });
  };

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-10 max-w-3xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Voice Alarms & Reminders</h2>
          <p className="text-slate-500 text-sm">Automated background alarms with intelligent voice readouts</p>
        </div>
        <button
          onClick={handleCreate}
          className="shrink-0 flex items-center justify-center space-x-2 bg-executive-gold hover:bg-amber-400 text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm ml-4"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Alarm</span>
        </button>
      </div>

      <div className="space-y-4">
        {reminders.length === 0 ? (
          <div className="text-center py-16 bg-white border-slate-200 rounded-2xl border border-dashed shadow-sm">
            <BellRing size={48} className="mx-auto text-executive-gold/30 mb-4" />
            <p className="text-lg text-slate-600 font-medium">No active alarms</p>
            <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
              Create an intelligent voice alarm that reads out reminders automatically.
            </p>
          </div>
        ) : (
          reminders.map(alarm => (
            <div key={alarm.id} className={`flex items-center justify-between p-5 sm:p-6 rounded-2xl border ${alarm.active !== false ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'} transition-all group`}>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className={`text-3xl sm:text-4xl font-mono font-light tracking-tight ${alarm.active !== false ? 'text-slate-900' : 'text-slate-500'}`}>
                    {alarm.triggerTime}
                  </div>
                  <div className="flex justify-center space-x-1 mt-2">
                    {alarm.recurring && alarm.days ? (
                      daysOfWeek.map((day, idx) => (
                        <span key={idx} className={`text-[9px] sm:text-[10px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-bold ${alarm.days?.includes(idx) ? 'bg-executive-gold text-white' : 'text-slate-400'}`}>
                          {day}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">One-Time</span>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className={`text-lg font-medium ${alarm.active !== false ? 'text-slate-900' : 'text-slate-500'}`}>{alarm.message}</h3>
                  <div className="flex items-center mt-1 space-x-3">
                    {alarm.voiceAlarm && (
                      <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                        <Volume2 size={12} className="mr-1" /> Voice Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                <button
                  onClick={() => toggleActive(alarm.id)}
                  className={`w-12 h-6 sm:w-14 sm:h-7 rounded-full relative transition-colors ${alarm.active !== false ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-transform ${alarm.active !== false ? 'translate-x-6 sm:translate-x-7' : 'translate-x-0'}`}></div>
                </button>
                <div className="flex sm:opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                  <button onClick={() => setEditingAlarm(alarm)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(alarm.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {editingAlarm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-serif tracking-tight font-bold text-slate-900">Configure Alarm</h3>
              <button onClick={() => setEditingAlarm(null)} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 block">Time (HH:MM)</label>
                <input 
                  type="time" 
                  value={editingAlarm.triggerTime} 
                  onChange={e => setEditingAlarm({...editingAlarm, triggerTime: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-5 py-4 focus:outline-none focus:border-executive-gold focus:ring-1 focus:ring-executive-gold transition-all text-2xl font-mono text-center"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 block">Readout Message</label>
                <textarea 
                  value={editingAlarm.message} 
                  onChange={e => setEditingAlarm({...editingAlarm, message: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-5 py-4 focus:outline-none focus:border-executive-gold focus:ring-1 focus:ring-executive-gold transition-all resize-none min-h-[100px]"
                  placeholder="What should the assistant say?"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${editingAlarm.voiceAlarm ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                    <Mic size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Voice Intelligent Alarm</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Assistant reads message aloud</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingAlarm({...editingAlarm, voiceAlarm: !editingAlarm.voiceAlarm})}
                  className={`w-12 h-6 rounded-full relative transition-colors ${editingAlarm.voiceAlarm ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${editingAlarm.voiceAlarm ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Repeat</label>
                  <button
                    onClick={() => setEditingAlarm({...editingAlarm, recurring: !editingAlarm.recurring})}
                    className={`text-xs font-bold px-3 py-1 rounded-full ${editingAlarm.recurring ? 'bg-executive-gold/20 text-executive-gold' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {editingAlarm.recurring ? 'ON' : 'OFF'}
                  </button>
                </div>
                
                {editingAlarm.recurring && (
                  <div className="flex justify-between mt-2">
                    {daysOfWeek.map((day, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleDay(idx)}
                        className={`w-10 h-10 rounded-full font-bold text-sm transition-colors ${editingAlarm.days?.includes(idx) ? 'bg-executive-gold text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleSave}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-4 font-bold tracking-wide text-lg flex items-center justify-center transition-all shadow-lg transform hover:scale-[1.02]"
                >
                  <Check size={20} className="mr-2" /> Save Alarm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

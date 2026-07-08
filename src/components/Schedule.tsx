import { useState } from 'react';
import { Event, EventStatus } from '../types';
import { Clock, MapPin, Edit2, X, Check, Copy, CheckCircle2 } from 'lucide-react';

export default function Schedule({ events, saveEvents }: { events: Event[], saveEvents?: (e: Event[]) => void }) {
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const now = new Date();
  
  const upcomingEvents = events.filter(e => new Date(e.datetime) >= now)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    
  const pastEvents = events.filter(e => new Date(e.datetime) < now)
    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()); // descending for past
  
  const groupEvents = (evts: Event[]) => {
    const grouped: Record<string, Event[]> = {};
    evts.forEach(e => {
      const date = new Date(e.datetime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(e);
    });
    return grouped;
  };

  const groupedUpcoming = groupEvents(upcomingEvents);
  const groupedPast = groupEvents(pastEvents);

  const handleSaveEdit = () => {
    if (editingEvent && saveEvents) {
      if (!events.find(e => e.id === editingEvent.id)) {
        saveEvents([...events, editingEvent]);
      } else {
        saveEvents(events.map(e => e.id === editingEvent.id ? editingEvent : e));
      }
      setEditingEvent(null);
    }
  };

  const handleCreateEvent = () => {
    setEditingEvent({
      id: crypto.randomUUID(),
      title: '',
      datetime: new Date().toISOString(),
      duration: '1 hour',
      attendees: [],
      status: 'CONFIRMED',
      location: '',
      notes: ''
    });
  };

  const handleCopy = (event: Event) => {
    const details = `Meeting: ${event.title}\nTime: ${new Date(event.datetime).toLocaleString()}\nDuration: ${event.duration}\nLocation: ${event.location || 'TBD'}\nAttendees: ${event.attendees.join(', ')}`;
    navigator.clipboard.writeText(details);
    setCopiedId(event.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    if (saveEvents) {
      saveEvents(events.filter(e => e.id !== id));
      setEditingEvent(null);
    }
  };

  const handleToggleComplete = (event: Event) => {
    if (saveEvents) {
      saveEvents(events.map(e => e.id === event.id ? { ...event, status: event.status === 'COMPLETED' ? 'CONFIRMED' : 'COMPLETED' } : e));
    }
  };

  const renderEventGroup = (grouped: Record<string, Event[]>) => {
    return Object.entries(grouped).map(([date, dayEvents]) => (
      <div key={date} className="space-y-4">
        <h3 className="text-executive-gold text-sm font-semibold uppercase tracking-wider sticky top-0 bg-slate-50 py-2">{date}</h3>
        <div className="space-y-3">
          {dayEvents.map(event => {
            const dateObj = new Date(event.datetime);
            const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            const status = event.status || 'CONFIRMED';
            
            return (
              <div key={event.id} className={`flex rounded-2xl overflow-hidden border ${status === 'COMPLETED' ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-100 hover:border-executive-gold/30'} transition-all`}>
                <div className="w-24 bg-slate-100 p-4 flex flex-col items-center justify-center border-r border-slate-200 text-center">
                  <span className="text-lg font-bold text-slate-900">{timeStr}</span>
                  <span className="text-xs text-slate-500 mt-1">{event.duration}</span>
                </div>
                <div className="p-4 flex-1 flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className={`text-lg font-medium ${status === 'COMPLETED' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{event.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        status === 'COMPLETED' ? 'bg-slate-200 text-slate-600' :
                        status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                        status === 'TENTATIVE' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {status}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center text-sm text-slate-500 mt-2">
                        <MapPin size={14} className="mr-1 text-executive-gold" />
                        {event.location}
                      </div>
                    )}
                    {event.attendees && event.attendees.length > 0 && (
                      <div className="mt-3 flex -space-x-2">
                        {event.attendees.map((attendee, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center text-xs font-bold" title={attendee}>
                            {attendee.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-1">
                    {saveEvents && (
                      <button 
                        onClick={() => handleToggleComplete(event)}
                        className={`text-slate-500 hover:text-green-600 transition-colors p-2 rounded-full hover:bg-slate-50 ${status === 'COMPLETED' && 'text-green-500'}`}
                        title={status === 'COMPLETED' ? "Reopen Meeting" : "Mark as Completed"}
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleCopy(event)}
                      className="text-slate-500 hover:text-executive-gold transition-colors p-2 rounded-full hover:bg-slate-50"
                      title="Copy Details"
                    >
                      {copiedId === event.id ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                    {saveEvents && (
                      <button 
                        onClick={() => setEditingEvent(event)}
                        className="text-slate-500 hover:text-executive-gold transition-colors p-2 rounded-full hover:bg-slate-50"
                        title="Edit Meeting"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-10 max-w-3xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Schedule</h2>
          <p className="text-slate-500 text-sm">Your upcoming commitments and past meetings</p>
        </div>
        <button
          onClick={handleCreateEvent}
          className="shrink-0 flex items-center justify-center space-x-2 bg-executive-gold hover:bg-amber-400 text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm ml-4"
        >
          <Edit2 size={16} />
          <span className="hidden sm:inline">New Meeting</span>
        </button>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2">Upcoming Meetings</h2>
        {Object.keys(groupedUpcoming).length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border-slate-200 rounded-2xl border border-slate-200 border-dashed">
            <Clock size={48} className="mx-auto text-executive-gold/30 mb-4" />
            <p className="text-slate-500">No upcoming meetings scheduled.</p>
          </div>
        ) : (
          renderEventGroup(groupedUpcoming)
        )}
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2">Past Meetings</h2>
        {Object.keys(groupedPast).length === 0 ? (
          <p className="text-slate-500 italic text-center py-4">No past meetings recorded.</p>
        ) : (
          renderEventGroup(groupedPast)
        )}
      </div>

      {/* Edit Modal */}
      {editingEvent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Edit Meeting</h3>
              <button onClick={() => setEditingEvent(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Title</label>
                <input 
                  type="text" 
                  value={editingEvent.title} 
                  onChange={e => setEditingEvent({...editingEvent, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-executive-gold/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={editingEvent.datetime.slice(0, 16)} 
                  onChange={e => setEditingEvent({...editingEvent, datetime: new Date(e.target.value).toISOString()})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-executive-gold/50"
                />
              </div>
              <div className="pt-4 flex space-x-3">
                <button 
                  onClick={handleSaveEdit}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-4 font-semibold text-lg flex items-center justify-center transition-colors"
                >
                  <Check size={20} className="mr-2" /> Save
                </button>
                <button
                  onClick={() => handleDelete(editingEvent.id)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 rounded-xl px-6 font-semibold flex items-center justify-center transition-colors border border-red-200"
                  title="Delete Meeting"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

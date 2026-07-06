import { useState } from 'react';
import { Note } from '../types';
import { Tag, Plus, X, Send, Trash2, Edit2, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';

export default function Notes({ notes, saveNotes }: { notes: Note[], saveNotes?: (notes: Note[]) => void }) {
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [captureText, setCaptureText] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  const sortedNotes = [...notes].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleCapture = () => {
    if (!captureText.trim() || !saveNotes) return;
    
    const newNote: Note = {
      id: uuidv4(),
      content: captureText,
      type: 'MANUAL',
      timestamp: new Date().toISOString(),
      tags: []
    };
    
    saveNotes([...notes, newNote]);
    setCaptureText('');
    setShowQuickCapture(false);
  };

  const handleSaveEdit = () => {
    if (editingNote && saveNotes) {
      saveNotes(notes.map(n => n.id === editingNote.id ? editingNote : n));
      setEditingNote(null);
    }
  };

  const handleDelete = (id: string) => {
    if (saveNotes) {
      saveNotes(notes.filter(n => n.id !== id));
      if (editingNote?.id === id) setEditingNote(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20 relative min-h-[80vh]">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Quick Notes</h2>
        <p className="text-slate-500 text-sm">Voice captured thoughts and decisions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedNotes.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-slate-50 border-slate-200 rounded-2xl border border-slate-200 border-dashed">
            <p className="text-slate-500">No notes yet. Ask the assistant to "note this" to capture an idea.</p>
          </div>
        ) : (
          sortedNotes.map(note => (
            <div key={note.id} className={`bg-white shadow-sm p-5 rounded-2xl border border-slate-200 hover:border-executive-gold/30 transition-colors group relative ${note.tags?.includes('full-analysis') ? 'md:col-span-2' : ''}`}>
              <div className="markdown-body prose prose-sm max-w-none text-slate-700 leading-relaxed overflow-hidden">
                <ReactMarkdown>{note.content}</ReactMarkdown>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {new Date(note.timestamp).toLocaleDateString()}
                </span>
                
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-slate-50 rounded text-executive-gold uppercase font-semibold">
                    {note.type}
                  </span>
                  {note.tags?.map(tag => (
                    <span key={tag} className="flex items-center text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      <Tag size={10} className="mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {saveNotes && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 bg-white/80 backdrop-blur px-2 py-1 rounded-lg">
                  <button 
                    onClick={() => setEditingNote(note)}
                    className="p-2 text-slate-400 hover:text-executive-gold bg-white rounded-full shadow-sm border border-slate-100"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(note.id)}
                    className="p-2 text-slate-400 hover:text-red-500 bg-white rounded-full shadow-sm border border-slate-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {saveNotes && (
        <button 
          onClick={() => setShowQuickCapture(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-800 transition-colors z-40"
        >
          <Plus size={24} />
        </button>
      )}

      {showQuickCapture && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Quick Capture</h3>
              <button onClick={() => setShowQuickCapture(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <textarea
              autoFocus
              value={captureText}
              onChange={(e) => setCaptureText(e.target.value)}
              placeholder="Jot down a quick thought..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-executive-gold/50 resize-none text-slate-800"
            />
            
            <div className="mt-4 flex justify-end">
              <button 
                onClick={handleCapture}
                disabled={!captureText.trim()}
                className="bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-300 disabled:text-slate-500 rounded-xl px-6 py-3 font-semibold flex items-center transition-colors"
              >
                Save <Send size={16} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Edit Note</h3>
              <button onClick={() => setEditingNote(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <textarea
              autoFocus
              value={editingNote.content}
              onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-executive-gold/50 resize-none text-slate-800"
            />
            
            <div className="mt-4 flex justify-end space-x-3">
              <button 
                onClick={handleSaveEdit}
                disabled={!editingNote.content.trim()}
                className="bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-300 disabled:text-slate-500 rounded-xl px-6 py-3 font-semibold flex items-center transition-colors"
              >
                Save Changes <Check size={16} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

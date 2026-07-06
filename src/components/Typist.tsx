import { useState, useRef, useEffect } from 'react';
import { Document, Note } from '../types';
import { FileText, Save, Plus, Keyboard, Mic, Download, Cloud, ArrowLeft, Edit3, Eye } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { googleSignIn, getAccessToken, initAuth } from '../lib/auth';

export default function Typist({ documents, saveDocuments, notes = [], saveNotes }: { documents: Document[], saveDocuments: (d: Document[]) => void, notes?: Note[], saveNotes?: (n: Note[]) => void }) {
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);
  const [isTypingMode, setIsTypingMode] = useState(false);
  const [viewMode, setViewMode] = useState<'VIEW' | 'EDIT'>('VIEW');
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const { isListening, transcript, startListening, stopListening } = useSpeech();
  
  // Selection saving logic
  const [selection, setSelection] = useState<{ text: string, x: number, y: number, show: boolean }>({ text: '', x: 0, y: 0, show: false });
  const viewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      if (viewMode !== 'VIEW') return;
      
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

      let node = activeSelection.anchorNode;
      let isInsideDoc = false;
      while (node && node.nodeName !== 'BODY') {
        if (node === viewContainerRef.current || viewContainerRef.current?.contains(node)) {
          isInsideDoc = true;
          break;
        }
        node = node.parentElement;
      }

      if (isInsideDoc) {
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
  }, [viewMode]);

  const handleSaveNote = () => {
    if (!selection.text || !activeDoc) return;
    
    const newNote: Note = {
      id: crypto.randomUUID(),
      content: `### High Thinking Note\n\n> ${selection.text}\n\n*Source: ${activeDoc.title}*`,
      type: 'idea',
      timestamp: new Date().toISOString(),
      tags: ['high-thinking', 'document-highlight']
    };
    
    if (saveNotes) {
      saveNotes([...notes, newNote]);
    }
    
    setSelection(s => ({ ...s, show: false }));
    window.getSelection()?.removeAllRanges();
    alert('Saved to High Thinking Notes!');
  };
  
  useEffect(() => {
    const unsubscribe = initAuth();
    return () => unsubscribe();
  }, []);

  // Create a new document
  const createNewDoc = () => {
    const newDoc: Document = {
      id: crypto.randomUUID(),
      title: `Draft - ${new Date().toLocaleDateString()}`,
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setActiveDoc(newDoc);
    setIsTypingMode(true);
    setViewMode('EDIT');
  };

  // Open existing
  const openDoc = (doc: Document) => {
    setActiveDoc(doc);
    setIsTypingMode(true);
    setViewMode('VIEW');
  };

  const activeDocRef = useRef(activeDoc);
  const docsRef = useRef(documents);
  const saveDocsRef = useRef(saveDocuments);

  useEffect(() => { activeDocRef.current = activeDoc; }, [activeDoc]);
  useEffect(() => { docsRef.current = documents; }, [documents]);
  useEffect(() => { saveDocsRef.current = saveDocuments; }, [saveDocuments]);

  // Handle saving the current document back to the list
  const handleSave = (docToSave = activeDocRef.current) => {
    if (!docToSave) return;
    
    let updatedDocs;
    const currentDocs = docsRef.current;
    const exists = currentDocs.find(d => d.id === docToSave.id);
    
    if (exists) {
      updatedDocs = currentDocs.map(d => d.id === docToSave.id ? { ...docToSave, updatedAt: new Date().toISOString() } : d);
    } else {
      updatedDocs = [docToSave, ...currentDocs];
    }
    
    saveDocsRef.current(updatedDocs);
  };

  const handleClose = () => {
    handleSave(activeDoc);
    setIsTypingMode(false);
    setActiveDoc(null);
  };

  const downloadDocx = () => {
    if (!activeDoc) return;
    // Creates a simple html file with a .doc extension which opens in Word
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + `<h1>${activeDoc.title}</h1><p>${activeDoc.content.replace(/\n/g, '<br>')}</p>` + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${activeDoc.title || 'document'}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const syncToGoogleDocs = async () => {
    if (!activeDoc) return;
    setSyncStatus('SYNCING');
    try {
      let token = await getAccessToken();
      if (!token) {
        const authResult = await googleSignIn();
        if (!authResult) throw new Error('Auth failed');
        token = authResult.accessToken;
      }

      const metadata = {
        name: activeDoc.title || 'Untitled Document',
        mimeType: 'application/vnd.google-apps.document'
      };

      const htmlContent = `<html><body>${activeDoc.content.replace(/\n/g, '<br>')}</body></html>`;
      
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([htmlContent], { type: 'text/html' }));

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      });

      if (!response.ok) {
        throw new Error('Failed to create document');
      }
      
      setSyncStatus('SUCCESS');
      setTimeout(() => setSyncStatus('IDLE'), 3000);
    } catch (error) {
      console.error("Sync error:", error);
      setSyncStatus('ERROR');
      setTimeout(() => setSyncStatus('IDLE'), 3000);
    }
  };

  // Append dictated transcript when speech recognition pauses
  useEffect(() => {
    if (!isListening && transcript && activeDoc) {
      setActiveDoc(prev => {
        if (!prev) return prev;
        const newContent = prev.content ? `${prev.content} ${transcript}` : transcript;
        return { ...prev, content: newContent };
      });
    }
  }, [isListening, transcript]);

  // Save changes automatically after 30 seconds of inactivity
  useEffect(() => {
    if (activeDoc) {
      const timer = setTimeout(() => {
        handleSave(activeDoc);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [activeDoc?.content, activeDoc?.title]);

  // Save on component unmount
  useEffect(() => {
    return () => {
      if (activeDocRef.current) {
        handleSave(activeDocRef.current);
      }
    };
  }, []);

  if (isTypingMode && activeDoc) {
    return (
      <div className="flex flex-col h-full max-w-5xl mx-auto pb-10">
        {/* Editor Header */}
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center flex-1 pr-4">
            <button 
              onClick={handleClose}
              className="mr-4 p-2 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
              title="Back to Documents"
            >
              <ArrowLeft size={20} />
            </button>
            {viewMode === 'EDIT' ? (
              <input 
                type="text" 
                value={activeDoc.title}
                onChange={(e) => setActiveDoc({...activeDoc, title: e.target.value})}
                className="bg-transparent text-xl font-semibold focus:outline-none border-b border-transparent focus:border-executive-gold px-1 w-full"
                placeholder="Document Title"
              />
            ) : (
              <h2 className="text-xl font-semibold text-slate-900 truncate" title={activeDoc.title}>{activeDoc.title}</h2>
            )}
          </div>
          
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setViewMode(viewMode === 'VIEW' ? 'EDIT' : 'VIEW')}
              className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors mr-2"
            >
              {viewMode === 'VIEW' ? <><Edit3 size={16} className="mr-2" /> Edit</> : <><Eye size={16} className="mr-2" /> View</>}
            </button>
            <button 
              onClick={syncToGoogleDocs}
              disabled={syncStatus === 'SYNCING'}
              className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <Cloud size={16} className="mr-2" />
              {syncStatus === 'IDLE' && 'Sync to Docs'}
              {syncStatus === 'SYNCING' && 'Syncing...'}
              {syncStatus === 'SUCCESS' && 'Synced!'}
              {syncStatus === 'ERROR' && 'Sync Failed'}
            </button>
            <button 
              onClick={downloadDocx}
              className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              <Download size={16} className="mr-2" />
              Download
            </button>
            <button 
              onClick={isListening ? stopListening : startListening}
              className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isListening ? 'bg-red-500 text-white' : 'bg-white text-executive-gold hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Mic size={16} className="mr-2" />
              {isListening ? 'Dictating...' : 'Dictate'}
            </button>
          </div>
        </div>

        {/* Live dictation indicator */}
        {isListening && (
          <div className="mb-4 p-3 bg-slate-100 rounded-xl border border-red-200 text-slate-600 italic flex items-center">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-3"></div>
            {transcript || "Listening to your dictation..."}
          </div>
        )}

        {/* Content Area */}
        {viewMode === 'VIEW' ? (
          <div className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-10 overflow-y-auto shadow-sm min-h-[500px] relative" ref={viewContainerRef}>
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
                  className="flex items-center space-x-2 bg-executive-gold text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-yellow-600 transition-colors shadow-lg whitespace-nowrap"
                >
                  <Save size={16} />
                  <span>Save as High Thinking Note</span>
                </button>
              </div>
            )}
            <h1 className="text-3xl font-bold mb-8 text-slate-900 border-b border-slate-100 pb-4">{activeDoc.title}</h1>
            <div 
              className="prose prose-slate max-w-none prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg"
              dangerouslySetInnerHTML={{ __html: activeDoc.content || '<p class="text-slate-400 italic">Empty document</p>' }}
            />
          </div>
        ) : (
          <textarea
            value={activeDoc.content}
            onChange={(e) => setActiveDoc({...activeDoc, content: e.target.value})}
            placeholder="Start typing, format in HTML, or click 'Dictate' to let the assistant transcribe your speech..."
            className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-6 focus:outline-none focus:border-executive-gold/50 text-slate-900 leading-relaxed resize-none font-mono text-sm min-h-[500px] shadow-sm"
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Documents & Dictation</h2>
          <p className="text-slate-500 text-sm">Long-form notes and drafted letters</p>
        </div>
        <button 
          onClick={createNewDoc}
          className="bg-executive-gold text-slate-900 p-3 rounded-full hover:bg-executive-gold/90 shadow-lg"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-slate-50 border-slate-200 rounded-3xl border border-slate-200 border-dashed">
            <Keyboard size={48} className="mx-auto text-executive-gold/30 mb-4" />
            <p className="text-lg text-slate-600 font-medium">No documents yet</p>
            <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
              Use the assistant as your personal typist. Create a new document to dictate letters, memos, or long ideas.
            </p>
          </div>
        ) : (
          documents.map(doc => (
            <div 
              key={doc.id}
              onClick={() => openDoc(doc)}
              className="bg-white shadow-sm border border-slate-200 p-5 rounded-2xl hover:border-executive-gold/50 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <FileText className="text-executive-gold opacity-80 group-hover:opacity-100 transition-opacity" size={24} />
                <span className="text-xs text-slate-400">{new Date(doc.updatedAt).toLocaleDateString()}</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">{doc.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                {doc.content || "Empty document"}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

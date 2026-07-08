import { CommandLogEntry } from '../types';
import { Terminal, Activity } from 'lucide-react';

export default function CommandLog({ log }: { log: CommandLogEntry[] }) {
  // Sort log by newest first
  const sortedLog = [...log].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Command Log</h2>
        <p className="text-slate-500 text-sm">A scrollable history of voice interactions and system actions.</p>
      </div>

      {sortedLog.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 border-slate-200 rounded-2xl border border-slate-200 border-dashed">
          <Terminal size={48} className="mx-auto text-executive-gold/30 mb-4" />
          <p className="text-slate-500">No commands recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-y-visible p-4 space-y-4">
            {sortedLog.map((entry) => {
              const timeStr = new Date(entry.timestamp).toLocaleString();
              return (
                <div key={entry.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col space-y-3">
                  <div className="flex items-center text-xs text-slate-500 font-medium">
                    <Activity size={12} className="mr-1 text-slate-500" />
                    {timeStr}
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <div className="bg-slate-100/50 p-3 rounded-lg border border-slate-200">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">You said:</span>
                      <p className="text-slate-800 text-sm italic">"{entry.command}"</p>
                    </div>
                    
                    {entry.actionTaken && (
                      <div className="bg-executive-gold/5 border border-executive-gold/20 p-3 rounded-lg">
                        <span className="text-xs font-bold text-executive-gold uppercase tracking-wider block mb-1">System Action:</span>
                        <p className="text-slate-700 text-sm font-medium">{entry.actionTaken}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

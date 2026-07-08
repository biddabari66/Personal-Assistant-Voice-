const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const snoozeUI = `
      {activeAlarm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 to-amber-500 animate-pulse"></div>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
              <BellRing size={40} className="animate-bounce" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2">Executive Alert</h3>
            <p className="text-slate-600 mb-8 font-medium">{activeAlarm.text}</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setActiveAlarm(null);
                }} 
                className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Acknowledge & Dismiss
              </button>
              <button 
                onClick={() => {
                  window.speechSynthesis.cancel();
                  // For a real snooze, we could add 5 mins to the reminder or task, but for now we just dismiss and un-mark it as played if needed
                  playedAlarms.current.delete(activeAlarm.id);
                  // Snooze logic: we can just delay the played alarm so it rings again in 5 minutes
                  setTimeout(() => {
                     playedAlarms.current.delete(activeAlarm.id);
                  }, 5 * 60 * 1000); // 5 mins
                  setActiveAlarm(null);
                }} 
                className="w-full py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Snooze for 5 Minutes
              </button>
            </div>
          </div>
        </div>
      )}
`;

app = app.replace(
  '      {/* Bottom Navigation */}',
  snoozeUI + '\n      {/* Bottom Navigation */}'
);

fs.writeFileSync('src/App.tsx', app);

import { Sun, Target, Zap, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

export default function DailyBrief({ data }: { data: any }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const lang = localStorage.getItem('language') || 'en';
  
  const t = {
    en: {
      greeting: "Good",
      morning: "Morning",
      afternoon: "Afternoon",
      evening: "Evening",
      subGreeting: "Here is your executive brief for today.",
      progress: "Today's Progress",
      powerThree: "The Power Three",
      engagements: "Today's Engagements",
      completedTasks: "tasks completed out of",
      noPriorities: "No critical priorities set for today.",
      dueToday: "Due today",
      clearCalendar: "Your calendar is clear for today.",
      empty: "Empty",
      completed: "Completed",
      pending: "Pending"
    },
    bn: {
      greeting: "শুভ",
      morning: "সকাল",
      afternoon: "বিকাল",
      evening: "সন্ধ্যা",
      subGreeting: "এখানে আপনার আজকের কার্যবিবরণী।",
      progress: "আজকের অগ্রগতি",
      powerThree: "শীর্ষ তিনটি কাজ",
      engagements: "আজকের মিটিং ও কাজ",
      completedTasks: "টি কাজ সম্পন্ন হয়েছে",
      noPriorities: "আজকের জন্য কোন অগ্রাধিকার সেট করা নেই।",
      dueToday: "আজ জমা দিতে হবে",
      clearCalendar: "আপনার ক্যালেন্ডার আজ সম্পূর্ণ ফাঁকা।",
      empty: "ফাঁকা",
      completed: "সম্পন্ন",
      pending: "অপেক্ষমান"
    }
  }[lang as 'en'|'bn'] || {
      greeting: "Good",
      morning: "Morning",
      afternoon: "Afternoon",
      evening: "Evening",
      subGreeting: "Here is your executive brief for today.",
      progress: "Today's Progress",
      powerThree: "The Power Three",
      engagements: "Today's Engagements",
      completedTasks: "tasks completed out of",
      noPriorities: "No critical priorities set for today.",
      dueToday: "Due today",
      clearCalendar: "Your calendar is clear for today.",
      empty: "Empty",
      completed: "Completed",
      pending: "Pending"
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `${t.greeting} ${t.morning}`;
    if (hour < 18) return `${t.greeting} ${t.afternoon}`;
    return `${t.greeting} ${t.evening}`;
  };

  // Power 3: High priority pending tasks
  const powerThree = data.tasks
    .filter((t: any) => t.status === 'PENDING' && t.priority === 'HIGH')
    .slice(0, 3);

  // Today's events
  const todayEvents = data.events
    .filter((e: any) => e.datetime.startsWith(todayStr))
    .sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  // Task Stats for Chart
  const todayTasks = data.tasks.filter((tk: any) => tk.deadline === todayStr || (!tk.deadline && tk.status === 'PENDING'));
  const completedToday = todayTasks.filter((tk: any) => tk.status === 'COMPLETED').length;
  const pendingToday = todayTasks.length - completedToday;
  
  const hasTasks = todayTasks.length > 0;
  const chartData = hasTasks 
    ? [
        { name: t.completed, value: completedToday },
        { name: t.pending, value: pendingToday }
      ]
    : [{ name: t.empty, value: 1 }];
    
  const COLORS = hasTasks ? ['#2ECC71', '#e2e8f0'] : ['#e2e8f0'];
  const percentage = hasTasks ? Math.round((completedToday / todayTasks.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-24 px-2">
      <div className="text-center py-10 bg-white rounded-3xl shadow-sm border border-slate-200 mt-4">
        <Sun size={64} className="mx-auto text-executive-gold mb-6" />
        <h2 className="text-5xl font-serif font-bold mb-4 text-slate-900">{getGreeting()}, {data.profile.salutation}</h2>
        <p className="text-xl text-slate-700 font-medium">{t.subGreeting}</p>
      </div>

      {/* Power Three moved to top */}
      <div className="bg-white shadow-xl rounded-3xl p-8 border-2 border-executive-gold relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-executive-gold"></div>
        <h3 className="text-slate-900 font-serif font-bold text-2xl flex items-center mb-8 border-b-2 border-slate-100 pb-4">
          <Target className="mr-3 text-executive-gold" size={28} /> {t.powerThree}
        </h3>
        
        {powerThree.length === 0 ? (
          <p className="text-slate-600 text-lg italic bg-slate-50 p-6 rounded-2xl">{t.noPriorities}</p>
        ) : (
          <div className="space-y-6">
          {powerThree.map((task: any, index: number) => (
            <div key={task.id} className="flex items-start bg-gradient-to-r from-slate-50 to-white p-5 rounded-2xl border border-executive-gold/20 shadow-sm relative overflow-hidden transition-all hover:shadow-md hover:border-executive-gold/50">
              <div className="w-12 h-12 rounded-full bg-executive-gold text-white font-extrabold text-xl flex items-center justify-center mr-6 shrink-0 shadow-inner">
                {index + 1}
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 leading-tight mb-2">{task.title}</h4>
                {task.deadline && <p className="text-base text-executive-gold font-bold uppercase tracking-wider text-sm">{t.dueToday}</p>}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Task Completion Chart */}
        <div className="bg-white shadow-md rounded-3xl p-8 border border-slate-200 flex flex-col items-center justify-center">
          <h3 className="text-slate-900 font-serif font-bold text-2xl flex items-center mb-6 self-start border-b-2 border-executive-gold pb-2 w-full">
            <Activity className="mr-3 text-executive-gold" size={28} /> {t.progress}
          </h3>
          <div className="w-56 h-56 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <Label 
                    value={`${percentage}%`} 
                    position="center" 
                    fill="#0f172a" 
                    style={{ fontSize: '32px', fontWeight: 'bold' }}
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-lg font-medium text-slate-700 mt-6 text-center">
            {lang === 'bn' ? `${completedToday}/${todayTasks.length} ${t.completedTasks}` : `${completedToday} ${t.completedTasks} ${todayTasks.length}`}
          </div>
        </div>

        {/* Schedule Overview */}
        <div className="bg-white shadow-md rounded-3xl p-8 border border-slate-200">
          <h3 className="text-slate-900 font-serif font-bold text-2xl flex items-center mb-8 border-b-2 border-executive-gold pb-2 w-full">
            <Zap className="mr-3 text-executive-gold" size={28} /> {t.engagements}
          </h3>
          
          {todayEvents.length === 0 ? (
            <p className="text-slate-600 text-lg italic bg-slate-50 p-6 rounded-2xl">{t.clearCalendar}</p>
          ) : (
            <div className="space-y-6">
              {todayEvents.map((event: any) => (
                <div key={event.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-1">{event.title}</h4>
                    <p className="text-lg text-slate-600 font-medium">{event.duration}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-executive-gold font-extrabold text-2xl bg-slate-900 px-4 py-2 rounded-xl inline-block">
                      {new Date(event.datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

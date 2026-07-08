const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  'playVoiceAlarm(`Reminder: ${event.title} is starting in ${Math.ceil(minutesDiff)} minutes.`);',
  'playVoiceAlarm(event.id, `Reminder: ${event.title} is starting in ${Math.ceil(minutesDiff)} minutes.`);'
);
app = app.replace(
  'playVoiceAlarm(`Urgent task reminder: ${task.title}.`);',
  'playVoiceAlarm(task.id, `Urgent task reminder: ${task.title}.`);'
);
app = app.replace(
  'playVoiceAlarm(`Alarm: ${alarm.message}`);',
  'playVoiceAlarm(alarmKey, `Alarm: ${alarm.message}`);'
);
app = app.replace(
  'const playVoiceAlarm = (text: string) => {',
  'const playVoiceAlarm = (id: string, text: string) => {\n      setActiveAlarm({ id, text });'
);

fs.writeFileSync('src/App.tsx', app);

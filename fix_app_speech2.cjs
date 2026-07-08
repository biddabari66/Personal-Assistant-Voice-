const fs = require('fs');

function replaceInFile(file, oldStr, newStr) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(file, content);
}

replaceInFile('src/App.tsx', `        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          (window as any)._alarmUtterance = utterance;
          utterance.pitch = 0.9;
          utterance.rate = 1.0;
          
          let resumeInterval: any = null;
          utterance.onstart = () => {
            resumeInterval = setInterval(() => {
              if (window.speechSynthesis.speaking) {
                window.speechSynthesis.pause();
                window.speechSynthesis.resume();
              } else {
                clearInterval(resumeInterval);
              }
            }, 10000);
          };
          utterance.onend = () => clearInterval(resumeInterval);
          utterance.onerror = () => clearInterval(resumeInterval);
          
          setTimeout(() => window.speechSynthesis.speak(utterance), 1000);
        }`, `        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          (window as any)._alarmUtterance = utterance;
          utterance.pitch = 0.9;
          utterance.rate = 1.0;
          setTimeout(() => window.speechSynthesis.speak(utterance), 1000);
        }`);

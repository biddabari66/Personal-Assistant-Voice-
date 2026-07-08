const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `        if ('speechSynthesis' in window) {
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
        }`;

code = code.replace(/if \('speechSynthesis' in window\) \{\s*const utterance = new SpeechSynthesisUtterance\(text\);\s*utterance\.pitch = 0\.9;\s*utterance\.rate = 1\.0;\s*setTimeout\(\(\) => window\.speechSynthesis\.speak\(utterance\), 1000\);\s*\}/, replacement);

fs.writeFileSync('src/App.tsx', code);

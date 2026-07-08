const fs = require('fs');
let code = fs.readFileSync('src/hooks/useSpeech.ts', 'utf8');

const replacement = `    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Prevent garbage collection bug in some browsers (e.g., Chrome)
      (window as any)._activeUtterance = utterance;
      
      utterance.rate = 0.95; 
      utterance.pitch = 1;
      
      // Timer to prevent the 15-second cutoff bug in Chrome
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
      
      utterance.onend = () => {
        clearInterval(resumeInterval);
        if (onEnd) onEnd();
      };
      
      utterance.onerror = () => {
        clearInterval(resumeInterval);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      if (onEnd) onEnd();
    }`;

code = code.replace(/if \('speechSynthesis' in window\) \{[\s\S]*?\} else \{\s*if \(onEnd\) onEnd\(\);\s*\}/, replacement);

fs.writeFileSync('src/hooks/useSpeech.ts', code);

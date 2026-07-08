const fs = require('fs');

function replaceInFile(file, oldStr, newStr) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(file, content);
}

replaceInFile('src/hooks/useSpeech.ts', `    if ('speechSynthesis' in window) {
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
    } else {`, `    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Store globally to prevent garbage collection
      (window as any)._activeUtterance = utterance;
      
      utterance.rate = 0.95;
      utterance.pitch = 1;
      
      if (onEnd) {
        utterance.onend = onEnd;
      }
      
      window.speechSynthesis.speak(utterance);
    } else {`);


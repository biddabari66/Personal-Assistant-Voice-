import { useState, useRef, useCallback, useEffect } from 'react';

function pcmToBase64(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const buffer = int16Array.buffer;
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function useLiveApi(onAction: (action: any) => void) {
  const onActionRef = useRef(onAction);
  
  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);

  const [isConnected, setIsConnected] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [niaTranscript, setNiaTranscript] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);
  
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const connect = useCallback(async (apiKey: string, context: any) => {
    if (wsRef.current) return;
    try {
      setIsConnecting(true);
      setIsError(null);
      
      console.log("Requesting microphone access...");
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone API not supported.");
      }

      // Add a 10-second timeout for getUserMedia to prevent indefinite hanging
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        }),
        new Promise<MediaStream>((_, reject) => 
          setTimeout(() => reject(new Error("Microphone access timed out. Please check permissions or open the app in a new tab.")), 10000)
        )
      ]);
      
      console.log("Microphone access granted.");
      streamRef.current = stream;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const lang = localStorage.getItem('language') === 'bn' ? 'bn' : 'en';
      const wsUrl = `${protocol}//${window.location.host}/live?apiKey=${encodeURIComponent(apiKey)}&lang=${lang}`;
      console.log("Connecting to WebSocket:", wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputAudioCtx;
      outputAudioCtxRef.current = outputAudioCtx;

      nextStartTimeRef.current = outputAudioCtx.currentTime;

      const source = inputAudioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      source.connect(processor);
      processor.connect(inputAudioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          let data = e.inputBuffer.getChannelData(0);
          
          
          const base64 = pcmToBase64(data);
          ws.send(JSON.stringify({ audio: base64 }));
        }
      };

      ws.onopen = () => {
        console.log("WebSocket connected.");
        setIsConnected(true);
        setIsConnecting(false);
        ws.send(JSON.stringify({ setup: { context } }));
      };
      
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        
        if (msg.action) {
           onActionRef.current(msg.action);
        }
        
        if (msg.text) {
          setNiaTranscript(prev => {
            const updated = prev + msg.text;
            const words = updated.split(' ');
            if (words.length > 25) {
              return '... ' + words.slice(words.length - 25).join(' ');
            }
            return updated;
          });
        }
        
        if (msg.interrupted) {
           setNiaTranscript(''); // Clear Nia's transcript when interrupted
           activeSourcesRef.current.forEach(source => {
             try { source.stop(); } catch (e) {}
           });
           activeSourcesRef.current.clear();
           nextStartTimeRef.current = outputAudioCtx.currentTime;
        }

        if (msg.audio) {
          const binaryString = window.atob(msg.audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const buffer = bytes.buffer;
          const int16Array = new Int16Array(buffer);
          const float32Array = new Float32Array(int16Array.length);
          for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
          }

          const audioBuffer = outputAudioCtx.createBuffer(1, float32Array.length, 24000);
          audioBuffer.getChannelData(0).set(float32Array);

          const playSource = outputAudioCtx.createBufferSource();
          playSource.buffer = audioBuffer;
          playSource.connect(outputAudioCtx.destination);
          
          playSource.onended = () => {
            activeSourcesRef.current.delete(playSource);
          };
          activeSourcesRef.current.add(playSource);
          
          const scheduleTime = Math.max(nextStartTimeRef.current, outputAudioCtx.currentTime);
          playSource.start(scheduleTime);
          nextStartTimeRef.current = scheduleTime + audioBuffer.duration;
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        setIsError("WebSocket connection failed.");
        setIsConnecting(false);
      };

      ws.onclose = () => {
        console.log("WebSocket closed.");
        disconnect();
      };

      // Set up Speech Recognition for UI transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = true;
        reco.interimResults = true;
        
        let finalTranscript = '';
        
        reco.onresult = (event: any) => {
          let interimTranscript = '';
          let newlySpoken = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
              newlySpoken += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript + ' ';
              newlySpoken += event.results[i][0].transcript;
            }
          }
          
          if (newlySpoken.trim().length > 3) {
            // Client-side force interrupt for immediate responsiveness
            if (activeSourcesRef.current.size > 0) {
              activeSourcesRef.current.forEach(source => {
                try { source.stop(); } catch (e) {}
              });
              activeSourcesRef.current.clear();
              setNiaTranscript('');
              if (outputAudioCtxRef.current) {
                nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
              }
              // Send an explicit interrupt client content message
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ clientContent: { turns: [{ role: 'user', parts: [{ text: newlySpoken.trim() }] }] } }));
              }
            }
          }
          
          const fullTranscript = (finalTranscript + interimTranscript).trim();
          // Keep only the last ~25 words for the UI
          const words = fullTranscript.split(' ');
          if (words.length > 25) {
            setTranscript('... ' + words.slice(words.length - 25).join(' '));
          } else {
            setTranscript(fullTranscript);
          }
        };

        reco.onend = () => {
          if (wsRef.current) {
            try { 
              // Keep final transcript around so it doesn't blank out on restart
              reco.start(); 
            } catch (e) {}
          }
        };
        
        reco.onerror = (e: any) => {
          console.warn("Speech recognition error:", e.error);
        };
        
        reco.start();
        recognitionRef.current = reco;
      }

    } catch (err: any) {
      console.error("Connection error:", err);
      let errMsg = err.message || String(err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || errMsg.toLowerCase().includes('permission denied')) {
        errMsg = "Microphone access is denied. Please click the 'Open App in New Tab' button in the top right to grant permissions.";
      }
      setIsError(errMsg);
      setIsConnecting(false);
      disconnect();
    }
  }, []);

  const disconnect = useCallback(() => {
        setIsConnected(false);
        setIsConnecting(false);
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
        if (processorRef.current) {
          processorRef.current.disconnect();
          processorRef.current = null;
        }
        if (sourceRef.current) {
          sourceRef.current.disconnect();
          sourceRef.current = null;
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        activeSourcesRef.current.forEach(source => {
          try { source.stop(); } catch (e) {}
        });
        activeSourcesRef.current.clear();
        if (inputAudioCtxRef.current) {
          inputAudioCtxRef.current.close();
          inputAudioCtxRef.current = null;
        }
        if (outputAudioCtxRef.current) {
          outputAudioCtxRef.current.close();
          outputAudioCtxRef.current = null;
        }
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
        setTranscript('');
        setNiaTranscript('');
      }, []);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  const sendContextUpdate = useCallback((context: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ updateContext: context }));
    }
  }, []);

  return { isConnected, isConnecting, isError, transcript, niaTranscript, connect, disconnect, sendContextUpdate };
}

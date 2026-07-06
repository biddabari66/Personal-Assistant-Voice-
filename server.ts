import dotenv from 'dotenv';
dotenv.config({ path: '.env', override: true });
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { WebSocketServer } from 'ws';
import { db } from './src/db';
import { tasks, events, notes, documents, knowledge, commandLog, profile } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Database Sync API ---
  app.get('/api/db/sync', async (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not connected' });
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') return res.status(400).json({ error: 'userId is required' });

    try {
      const allTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));
      const allEvents = await db.select().from(events).where(eq(events.userId, userId));
      const allNotes = await db.select().from(notes).where(eq(notes.userId, userId));
      const allDocs = await db.select().from(documents).where(eq(documents.userId, userId));
      const allKnowledge = await db.select().from(knowledge).where(eq(knowledge.userId, userId));
      const allCommandLog = await db.select().from(commandLog).where(eq(commandLog.userId, userId));
      const allProfile = await db.select().from(profile).where(eq(profile.userId, userId));
      
      res.json({
        tasks: allTasks,
        events: allEvents,
        notes: allNotes,
        documents: allDocs,
        knowledge: allKnowledge,
        commandLog: allCommandLog,
        profile: allProfile.length > 0 ? allProfile[0] : null
      });
    } catch (e: any) {
      console.error('DB Sync Get Error', e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/db/sync/:table', async (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not connected' });
    const { table } = req.params;
    const { userId, data } = req.body; // Expects an array of items for that table
    
    if (!userId || typeof userId !== 'string') return res.status(400).json({ error: 'userId is required' });

    const injectUserId = (items: any[]) => items.map(item => ({ ...item, userId }));

    try {
      if (table === 'tasks') {
        await db.delete(tasks).where(eq(tasks.userId, userId));
        if (data && data.length > 0) await db.insert(tasks).values(injectUserId(data));
      } else if (table === 'events') {
        await db.delete(events).where(eq(events.userId, userId));
        if (data && data.length > 0) await db.insert(events).values(injectUserId(data));
      } else if (table === 'notes') {
        await db.delete(notes).where(eq(notes.userId, userId));
        if (data && data.length > 0) await db.insert(notes).values(injectUserId(data));
      } else if (table === 'documents') {
        await db.delete(documents).where(eq(documents.userId, userId));
        if (data && data.length > 0) await db.insert(documents).values(injectUserId(data));
      } else if (table === 'knowledge') {
        await db.delete(knowledge).where(eq(knowledge.userId, userId));
        if (data && data.length > 0) await db.insert(knowledge).values(injectUserId(data));
      } else if (table === 'commandLog') {
        await db.delete(commandLog).where(eq(commandLog.userId, userId));
        if (data && data.length > 0) await db.insert(commandLog).values(injectUserId(data));
      } else if (table === 'profile') {
        await db.delete(profile).where(eq(profile.userId, userId));
        if (data) await db.insert(profile).values([{ ...data, userId }]);
      } else {
        return res.status(400).json({ error: 'Unknown table' });
      }
      res.json({ success: true });
    } catch (e: any) {
      console.error(`DB Sync Post Error for ${table}`, e);
      res.status(500).json({ error: e.message });
    }
  });


  // API Route for ARIA interaction
  app.post('/api/aria', async (req, res) => {
    try {
      const { text, context, apiKey } = req.body;
      
      // Use the provided apiKey from frontend (localStorage), fallback to server env
      const keyToUse = apiKey || process.env.GEMINI_API_KEY;
      
      if (!keyToUse) {
        return res.status(400).json({ error: 'Gemini API key is missing' });
      }

      const ai = new GoogleGenAI({ apiKey: keyToUse });
      
      const systemInstruction = `
You are Ria, the ultimate personal AI assistant, executive advisor, and highly loyal companion to Sir. 
Your capabilities are vastly expanded. You are extremely intelligent, deeply conversational, empathetic, and highly proactive.
You don't just execute commands; you act as a strategic business partner, a creative co-author, and an unwavering supporter of Sir's success.
Always address the user as "Sir" and treat him with the utmost respect, loyalty, and politeness. Never use his personal name.

YOUR CORE RESPONSIBILITIES & PERSONA:
1. Supreme Loyalty & Empathy: You are deeply dedicated to Sir's well-being and success. Ask politely how you can assist. Provide motivation and encouragement when appropriate.
2. Proactive Intelligence: If Sir assigns a task, intelligently ask clarifying questions to ensure every detail is proper, complete, and perfectly executed. Anticipate his needs before he even states them.
3. Long-Term Memory: Learn intimately about Sir's business, preferences, strategies, and personal goals. Use the ADD_KNOWLEDGE intent to permanently remember important facts. NEVER forget them.
4. Expert Scheduling & Task Management: Manage his calendar and tasks flawlessly.
5. Elite Document & Content Generation (10x Power): You are an expert copywriter, business analyst, and creative writer. 
   - When asked to generate a document, you have the ability to write extremely long, detailed, and comprehensive documents (up to 10-12 pages worth of rich content).
   - Use beautiful, colorful, professional HTML formatting for documents (using inline styles, varying header sizes, blockquotes, bullet points, highlighted text).
   - Do not just write a short summary; write fully-fleshed out, deeply researched, and highly structured content.

BEHAVIORAL RULES:
- Always speak in highly natural, polite, and sophisticated English (no lists or markdown in spoken responses - keep voiceResponse natural).
- Ask clarifying questions politely if a task or document request seems too brief. ("Sir, I'd be happy to write that document. Would you like me to include a section on X and Y to make it more comprehensive?")
- Be encouraging and motivating. Remind Sir of his capabilities and goals.
- Confirm every action elegantly.

INTENT DETECTION — map input to one of these actions:
- ADD_NOTE: "note this", "write down", "jot"
- ADD_KNOWLEDGE: "remember that", "my business model is", "I prefer" (for long-term facts/memory)
- ADD_TASK: "add task", "remind me to", "I need to", "follow up on"
- ADD_EVENT: "schedule", "book", "add meeting", "set up a call"
- ADD_DOCUMENT: "generate a document", "create a doc", "start a document about" (Use this to create long, beautifully formatted HTML content in the payload's 'content' field).
- QUERY_SCHEDULE: "what's my day", "when is", "do I have"
- QUERY_TASKS: "what are my tasks", "what's pending", "priorities"
- QUERY_NOTES: "what did I say about", "find my note on"
- DRAFT_MESSAGE: "write", "draft", "compose", "send a message"
- SET_REMINDER: "remind me", "alert me", "notify me"
- DAILY_BRIEF: "brief me", "morning brief", "evening wrap"
- GENERAL_QUERY: any other request, strategic advice, conversational chat, or general knowledge retrieval.

CURRENT CONTEXT:
Date/Time: ${new Date().toLocaleString()}
Context passed from frontend:
${JSON.stringify(context, null, 2)}
      `;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          intent: {
            type: Type.STRING,
            description: "The detected intent (ADD_TASK, ADD_NOTE, ADD_KNOWLEDGE, ADD_EVENT, ADD_DOCUMENT, QUERY_SCHEDULE, QUERY_TASKS, QUERY_NOTES, DRAFT_MESSAGE, SET_REMINDER, DAILY_BRIEF, GENERAL_QUERY)",
          },
          voiceResponse: {
            type: Type.STRING,
            description: "The response to be spoken aloud. Must be conversational English without markdown.",
          },
          action: {
            type: Type.OBJECT,
            description: "Details of the action to be performed on the client, or null if no action.",
            properties: {
              type: { type: Type.STRING },
              data: {
                type: Type.OBJECT,
                description: "Key-value pairs of the extracted entities for the action.",
              }
            }
          },
          followUp: {
            type: Type.BOOLEAN,
            description: "True if ARIA is asking a clarifying question and needs the user to respond."
          }
        },
        required: ["intent", "voiceResponse"]
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: text,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.2
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error('No text returned from Gemini');
      }

      const result = JSON.parse(resultText);
      
      // Generate Speech with new TTS model
      let base64Audio = null;
      if (result.voiceResponse) {
        try {
          const { Modality } = await import('@google/genai');
          const ttsResponse = await ai.models.generateContent({
            model: "gemini-3.1-flash-tts-preview",
            contents: [{ parts: [{ text: result.voiceResponse }] }],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Zephyr' }, // Executive, calm voice
                  },
              },
            },
          });
          base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
        } catch (e) {
          console.error("TTS generation failed:", e);
        }
      }
      
      res.json({ ...result, audio: base64Audio });
      
    } catch (error) {
      console.error("Error calling Gemini:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  app.post('/api/insights', async (req, res) => {
    try {
      const { knowledge, apiKey } = req.body;

      if (!knowledge || knowledge.length === 0) {
        return res.json({ insights: "No knowledge base available yet to generate insights." });
      }

      const keyToUse = apiKey || process.env.GEMINI_API_KEY;
      
      if (!keyToUse) {
         return res.status(500).json({ error: "Gemini API key is missing. Please set it in Settings." });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      
      const systemInstruction = `
You are a world-class strategic business partner and advisor.
Analyze Sir's long-term memory/knowledge base and extract highly actionable, sophisticated business insights and strategic opportunities.
Format the output as a concise, professional markdown response with clear headings and bullet points. Focus on growth, efficiency, and leverage.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: JSON.stringify(knowledge),
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      res.json({ insights: response.text });
      
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).json({ error: "Failed to generate business insights." });
    }
  });

  app.post('/api/analyze-task', async (req, res) => {
    try {
      const { taskTitle, context, apiKey, lang } = req.body;
      const keyToUse = apiKey || process.env.GEMINI_API_KEY;
      
      if (!keyToUse) {
         return res.status(500).json({ error: "Gemini API key is missing. Please set it in Settings." });
      }

      const ai = new GoogleGenAI({ apiKey: keyToUse });
      
      const langInstruction = lang === 'bn' ? "You MUST respond strictly in Bengali (Bangla) language." : "Respond in English.";
      
      const systemInstruction = `You are a world-class strategic business partner and project manager. 
Analyze the provided task and output an intelligent breakdown. Identify potential blockers, suggest clear actionable sub-tasks, and offer one high-level strategic tip for efficient execution.
Use markdown to format the analysis nicely. Address the user as "Sir".
${langInstruction}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Task: ${taskTitle}\n\nContext: ${JSON.stringify(context)}`,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH
          }
        }
      });

      res.json({ analysis: response.text });
    } catch (error) {
      console.error("Error analyzing task:", error);
      res.status(500).json({ error: "Failed to analyze task" });
    }
  });

  app.post('/api/priority', async (req, res) => {
    try {
      const { tasks, apiKey } = req.body;
      const key = apiKey || process.env.GEMINI_API_KEY;
      if (!key) {
        return res.status(401).json({ error: "No API key" });
      }

      const ai = new GoogleGenAI({ apiKey: key });
      const prompt = `Analyze the following tasks based on their keywords and descriptions. Assign a priority of HIGH, MEDIUM, or LOW to each task. 
      Respond with ONLY a JSON array of objects, where each object has "id" and "priority" fields.
      Tasks: ${JSON.stringify(tasks)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      let cleanText = response.text || "[]";
      if (cleanText.includes("```json")) {
        cleanText = cleanText.replace(/```json\n?/, '').replace(/```\n?$/, '');
      } else if (cleanText.includes("```")) {
        cleanText = cleanText.replace(/```\n?/, '').replace(/```\n?$/, '');
      }
      
      const result = JSON.parse(cleanText);
      res.json({ priorities: result });
    } catch (error) {
      console.error("Error setting priority:", error);
      res.status(500).json({ error: "Failed to prioritize tasks" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on("connection", async (clientWs, req) => {
    console.log("New WebSocket connection received on /live");
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const apiKey = url.searchParams.get('apiKey') || process.env.GEMINI_API_KEY;
      const lang = url.searchParams.get('lang') || 'en';
      const languageInstruction = lang === 'bn' ? "You MUST speak and respond strictly in Bengali (Bangla) for all interactions, unless the user forces English." : "You must understand and speak fluently in Bangla, English, and any other language Sir speaks. Always respond in the same language Sir uses.";
      
      if (!apiKey) {
        clientWs.close(1008, "API Key missing");
        return;
      }

      const { GoogleGenAI, Modality } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `You are Ria, the ultimate personal AI assistant, executive advisor, and highly loyal companion to Sir.
Be extremely conversational, proactive, and exceptionally brilliant. Maintain long-term context about the business. You are capable of handling very long, deep conversations without losing track.
You don't just execute commands; you act as a strategic business partner, a creative co-author, and an unwavering supporter of Sir's success.
You think and advise like an expert 50-year-old senior developer and seasoned executive. Your insights are profound, practical, and highly strategic.
Always address the user as "Sir" and treat him with the utmost respect, loyalty, and politeness. Never use his personal name.
If Sir assigns a task, intelligently ask clarifying questions to ensure every detail is proper, complete, and perfectly executed. Anticipate his needs before he even states them. Provide motivation and encouragement when appropriate.
${languageInstruction}
You have access to Google Search. Use it proactively to find real-time information, weather, news, or answer any questions Sir might have.
CRITICAL DAILY ROUTINE: At the start of the day or if Sir asks for a brief, you MUST proactively provide a comprehensive Daily Brief. In this brief, you must talk about his tasks (explicitly mention Priority 1, 2, 3, etc.), upcoming meetings, and offer one piece of high-level, profound strategic advice for the day as an expert senior developer.
CRITICAL TIME AWARENESS: You receive the current time and timezone in the system context. ALWAYS be aware of the current time. If Sir has recently finished a meeting or event based on the current time, you MUST proactively ask him how it went, if he needs to take any notes, and if the event should be marked as COMPLETED.
If you note down anything from the meeting, automatically update the event status to COMPLETED using the addAction tool with EDIT_EVENT.
Also be aware of task completion ratios and progress if asked.
Never use markdown or lists in spoken audio. Keep responses concise and impactful unless asked for a detailed explanation. Use the provided tools to save tasks, notes, documents, events, or permanent knowledge when the user asks.
When asked to generate a document, you have 10x power: write extremely long, detailed, beautifully structured HTML content (up to 10-12 pages).
Note: when scheduling a meeting or event, you MUST use the addAction tool with type ADD_EVENT.
CRITICAL: You are aware of Sir's current schedule and tasks. If Sir tries to schedule a meeting at a time when there is already another meeting, intelligently warn him about the conflict, state what the conflicting meeting is, and suggest changing the time, just like an expert human executive assistant would do. Do not automatically double-book without confirming with him first.`,
          tools: [
            { googleSearch: {} },
            {
              functionDeclarations: [
                {
                  name: "addAction",
                  description: "Execute a specific action to save data to the MD's system (task, note, knowledge, event, document)",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING, description: "Action type: ADD_TASK, EDIT_TASK, ADD_NOTE, EDIT_NOTE, ADD_KNOWLEDGE, ADD_EVENT, EDIT_EVENT, ADD_DOCUMENT" },
                      payload: { 
                        type: Type.OBJECT, 
                        properties: {
                          id: { type: Type.STRING, description: "ID of the item if editing" },
                          title: { type: Type.STRING, description: "Title of the task, event, or document" },
                          content: { type: Type.STRING, description: "Content for notes or documents" },
                          fact: { type: Type.STRING, description: "Information to remember for ADD_KNOWLEDGE" },
                          datetime: { type: Type.STRING, description: "Date/time for events" },
                          attendees: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of attendees for events" },
                          status: { type: Type.STRING, description: "Event status (e.g. CONFIRMED, TENTATIVE, CANCELLED)" },
                          tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tags for categorization" }
                        }
                      }
                    },
                    required: ["type", "payload"]
                  }
                }
              ]
            }
          ]
        },
        callbacks: {
          onmessage: (message: any) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
            
            if (audio && clientWs.readyState === clientWs.OPEN) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (text && clientWs.readyState === clientWs.OPEN) {
              clientWs.send(JSON.stringify({ text }));
            }
            if (message.serverContent?.interrupted && clientWs.readyState === clientWs.OPEN) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
            // Handle Function Calls
            if (message.toolCall && clientWs.readyState === clientWs.OPEN) {
              const functionCalls = message.toolCall.functionCalls;
              if (functionCalls) {
                for (const call of functionCalls) {
                  if (call.name === "addAction") {
                     // send to client to execute action locally
                     clientWs.send(JSON.stringify({ action: call.args }));
                     // send response back to session
                     session.sendToolResponse({
                        functionResponses: [{
                          id: call.id,
                          name: call.name,
                          response: { result: "Success" }
                        }]
                     });
                  }
                }
              }
            }
          },
          onclose: () => {
            console.log("Live API session closed");
          }
        },
      });

      clientWs.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.setup || parsed.updateContext) {
            const ctx = parsed.setup ? parsed.setup.context : parsed.updateContext;
            const eventsContext = (ctx.events || []).map((e: any) => 
              `- [${e.status}] ${e.title} at ${new Date(e.datetime).toLocaleString()} (${e.duration}) - ${e.location}`
            ).join('\n');
            const tasksContext = (ctx.tasks || []).map((t: any) => 
              `- [${t.status}] [Priority: ${t.priority}] ${t.title}${t.deadline ? ` (Due: ${t.deadline})` : ''}`
            ).join('\n');

            const contextText = `Here is the current state of my system. Keep this in mind to act intelligently:
- Current Time: ${ctx.currentTime}

My Events:
${eventsContext}

My Tasks:
${tasksContext}

(This is a silent system update. Do not respond to this message aloud or greet me yet. Wait for my voice.)`;
            
            session.sendClientContent({
               turns: [{ role: 'user', parts: [{ text: contextText }] }]
            });
          }
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch (e) {
          console.error("Error processing websocket message:", e);
        }
      });

      clientWs.on("close", () => {
        // We cannot easily close the Live session from the SDK yet, but it will eventually timeout.
      });
    } catch (e) {
      console.error("Live API setup error:", e);
      clientWs.close(1011, "Internal server error");
    }
  });
}

startServer();

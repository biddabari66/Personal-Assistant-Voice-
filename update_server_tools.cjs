const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// Replace the tools array in the Live API config
code = code.replace(
  `                }
              ]
            }
          ]`,
  `                },
                {
                  name: "fetchWebpage",
                  description: "Fetch and read the text content of any URL on the internet to summarize or analyze it.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      url: { type: "STRING", description: "The URL to fetch (must be a valid URL starting with http)" }
                    },
                    required: ["url"]
                  }
                },
                {
                  name: "manageLocalFiles",
                  description: "Read, write, or list files in the user's connected local PC workspace. If the user asks to read a file, use this tool. (The UI will prompt them to connect a folder if they haven't yet).",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      action: { type: "STRING", description: "Action: LIST, READ, WRITE" },
                      path: { type: "STRING", description: "File or folder path relative to workspace root (e.g. 'src/index.ts' or '')" },
                      content: { type: "STRING", description: "Content to write (for WRITE action only)" }
                    },
                    required: ["action", "path"]
                  }
                }
              ]
            }
          ]`
);

// Replace the tool handling logic
code = code.replace(
  `            // Handle Function Calls
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
            }`,
  `            // Handle Function Calls
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
                  } else if (call.name === "manageLocalFiles") {
                     // Send to client to execute, client will send back a toolResponse
                     clientWs.send(JSON.stringify({ toolCall: { id: call.id, name: call.name, args: call.args } }));
                  } else if (call.name === "fetchWebpage") {
                     // Server side execution
                     fetch(call.args.url)
                       .then(res => res.text())
                       .then(text => {
                          const stripped = text.replace(/<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi, '')
                                               .replace(/<style\\b[^<]*(?:(?!<\\/style>)<[^<]*)*<\\/style>/gi, '')
                                               .replace(/<[^>]+>/g, ' ')
                                               .replace(/\\s+/g, ' ');
                          const snippet = stripped.substring(0, 15000); 
                          session.sendToolResponse({
                            functionResponses: [{
                              id: call.id,
                              name: call.name,
                              response: { content: snippet }
                            }]
                          });
                       })
                       .catch(e => {
                          session.sendToolResponse({
                            functionResponses: [{
                              id: call.id,
                              name: call.name,
                              response: { error: e.message }
                            }]
                          });
                       });
                  }
                }
              }
            }`
);

// Add the listener for toolResponses from the client
code = code.replace(
  `          if (parsed.clientContent) {
            session.sendClientContent(parsed.clientContent);
          }`,
  `          if (parsed.clientContent) {
            session.sendClientContent(parsed.clientContent);
          }
          if (parsed.toolResponse) {
             session.sendToolResponse({
               functionResponses: [parsed.toolResponse]
             });
          }`
);

fs.writeFileSync('server.ts', code);

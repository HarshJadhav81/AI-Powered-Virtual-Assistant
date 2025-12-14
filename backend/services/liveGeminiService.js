import WebSocket from 'ws';

/**
 * liveGeminiService.js
 * Handles interaction with Gemini Multimodal Live API via WebSockets.
 * Used for models that do not support REST (e.g., gemini-2.5-flash-native-audio-dialog).
 */
class LiveGeminiService {
    constructor() {
        this.host = 'generativelanguage.googleapis.com';
        this.endpoint = '/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
    }

    /**
     * Generates a response using the Live API (Bidi Streaming)
     * Emulates a single-turn request/response to fit current architecture.
     */
    async generateResponse(command, modelName, apiKey, systemInstruction) {
        return new Promise((resolve, reject) => {
            const url = `wss://${this.host}${this.endpoint}?key=${apiKey}`;
            let ws;

            try {
                ws = new WebSocket(url);
            } catch (e) {
                return reject(new Error(`Failed to create WebSocket: ${e.message}`));
            }

            let responseText = '';

            // Timeout safety (10s)
            const timeout = setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) ws.close();
                reject(new Error('Live API Timeout'));
            }, 10000);

            ws.on('open', () => {
                console.log(`[LIVE-GEMINI] Connected to ${modelName}`);

                // 1. Send Setup Message
                const setupMsg = {
                    setup: {
                        model: `models/${modelName}`,
                        generationConfig: {
                            responseModalities: ["TEXT"], // We want text back for now to feed TTS
                            speechConfig: {
                                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } // Default if audio is sent
                            }
                        },
                        systemInstructions: {
                            parts: [{ text: systemInstruction }]
                        }
                    }
                };
                ws.send(JSON.stringify(setupMsg));
            });

            ws.on('message', (data) => {
                try {
                    const msg = JSON.parse(data.toString());

                    // 2. Handle Server Content
                    if (msg.serverContent) {

                        // Handle Turn Complete (End of response)
                        if (msg.serverContent.turnComplete) {
                            console.log('[LIVE-GEMINI] Turn Complete');
                            clearTimeout(timeout);
                            ws.close();
                            resolve(responseText);
                            return;
                        }

                        // Accumulate Text
                        if (msg.serverContent.modelTurn && msg.serverContent.modelTurn.parts) {
                            for (const part of msg.serverContent.modelTurn.parts) {
                                if (part.text) {
                                    responseText += part.text;
                                }
                            }
                        }
                    }

                    // 3. Handle Setup Complete -> Send User Input
                    // When setup is done. Bidi often sends setupComplete. 
                    // We can also just send immediately after setup, or on 'open' with delay.

                } catch (e) {
                    console.error('[LIVE-GEMINI] Parse Error:', e);
                }
            });

            // Send User Input (After a brief delay to ensure setup processed or pipelined)
            ws.on('open', () => {
                setTimeout(() => {
                    const clientContent = {
                        clientContent: {
                            turns: [{
                                role: "user",
                                parts: [{ text: command }]
                            }],
                            turnComplete: true // Signal end of user turn
                        }
                    };
                    // Send input
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify(clientContent));
                        console.log('[LIVE-GEMINI] Sent user command');
                    }
                }, 500); // 500ms delay to let setup settle
            });

            ws.on('error', (err) => {
                console.error('[LIVE-GEMINI] WebSocket Error:', err.message);
                clearTimeout(timeout);
                reject(err);
            });

            ws.on('close', (code, reason) => {
                console.log(`[LIVE-GEMINI] Closed: ${code} ${reason}`);
                if (!responseText && code !== 1000) {
                    // If normal closure or 1000, it's fine.
                    if (code === 1005) { // No Status Recvd
                        if (responseText) resolve(responseText); else reject(new Error('Closed without response'));
                    } else {
                        reject(new Error(`WebSocket Closed: ${code} ${reason}`));
                    }
                } else {
                    resolve(responseText);
                }
            });
        });
    }
}

export default new LiveGeminiService();

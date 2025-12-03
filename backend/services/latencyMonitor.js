/**
 * Latency Monitoring Service
 * Tracks and reports end-to-end latencies for voice assistant pipeline
 * Targets: <1s end-to-end, <100ms wake-word, <200ms STT, <250ms NLU, <400ms first response
 */

class LatencyMonitor {
    constructor() {
        this.sessions = new Map(); // sessionId -> latency data
        this.metrics = {
            wakeword: [],
            sttFirstToken: [],
            nlu: [],
            responseGenFirstToken: [],
            ttsStart: [],
            endToEnd: []
        };
        this.maxHistorySize = 100; // Keep last 100 measurements
    }

    /**
     * Start tracking a new voice interaction session
     */
    startSession(sessionId) {
        this.sessions.set(sessionId, {
            sessionId,
            startTime: Date.now(),
            timestamps: {
                sessionStart: Date.now(),
                wakewordDetected: null,
                sttFirstToken: null,
                sttComplete: null,
                nluComplete: null,
                responseGenStart: null,
                responseFirstToken: null,
                ttsStart: null,
                complete: null
            },
            latencies: {},
            transcript: '',
            intent: null,
            confidence: null,
            errors: []
        });

        console.info('[LATENCY-MONITOR]', `Session started: ${sessionId}`);
        return this.sessions.get(sessionId);
    }

    /**
     * Record timestamp for a specific stage
     */
    recordTimestamp(sessionId, stage, metadata = {}) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            console.warn('[LATENCY-MONITOR]', `Session not found: ${sessionId}`);
            return null;
        }

        const now = Date.now();
        session.timestamps[stage] = now;

        // Store metadata
        if (metadata.transcript) session.transcript = metadata.transcript;
        if (metadata.intent) session.intent = metadata.intent;
        if (metadata.confidence !== undefined) session.confidence = metadata.confidence;
        if (metadata.error) session.errors.push(metadata.error);

        // Calculate latency from session start
        const latency = now - session.timestamps.sessionStart;
        console.info('[LATENCY-MONITOR]', `${sessionId} - ${stage}: ${latency}ms`);

        return { stage, latency, timestamp: now };
    }

    /**
     * Complete session and calculate all latencies
     */
    completeSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            console.warn('[LATENCY-MONITOR]', `Session not found: ${sessionId}`);
            return null;
        }

        const ts = session.timestamps;
        const startTime = ts.sessionStart;

        // Calculate latencies
        session.latencies = {
            wakeword: ts.wakewordDetected ? ts.wakewordDetected - startTime : null,
            sttFirstToken: ts.sttFirstToken ? ts.sttFirstToken - startTime : null,
            sttComplete: ts.sttComplete ? ts.sttComplete - startTime : null,
            nlu: ts.nluComplete ? ts.nluComplete - startTime : null,
            responseGenFirstToken: ts.responseFirstToken ? ts.responseFirstToken - startTime : null,
            ttsStart: ts.ttsStart ? ts.ttsStart - startTime : null,
            endToEnd: ts.complete ? ts.complete - startTime : Date.now() - startTime
        };

        // Add to metrics history
        Object.entries(session.latencies).forEach(([key, value]) => {
            if (value !== null && this.metrics[key]) {
                this.metrics[key].push(value);
                // Keep only last N measurements
                if (this.metrics[key].length > this.maxHistorySize) {
                    this.metrics[key].shift();
                }
            }
        });

        console.info('[LATENCY-MONITOR]', `Session completed: ${sessionId}`, session.latencies);

        return session;
    }

    /**
     * Get diagnostic log for a session (SYSTEM PROMPT FORMAT)
     */
    getDiagnosticLog(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        // Ensure session is complete
        if (!session.latencies.endToEnd) {
            this.completeSession(sessionId);
        }

        const finalSession = this.sessions.get(sessionId);

        return {
            transcript: finalSession.transcript || '',
            intent: finalSession.intent || 'unknown',
            slots: {}, // To be filled by intent service
            confidence: finalSession.confidence || 0.0,
            latencies_ms: {
                wakeword: finalSession.latencies.wakeword || 0,
                stt_first_token: finalSession.latencies.sttFirstToken || 0,
                nlu: finalSession.latencies.nlu || 0,
                response_gen_first_token: finalSession.latencies.responseGenFirstToken || 0,
                tts_start: finalSession.latencies.ttsStart || 0,
                end_to_end: finalSession.latencies.endToEnd || 0
            },
            context_used: '', // To be filled by conversation service
            action_executed: finalSession.intent || '',
            errors: finalSession.errors.length > 0 ? finalSession.errors.join('; ') : null,
            needs_clarification: finalSession.confidence < 0.55,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get performance statistics
     */
    getStats() {
        const calculateStats = (arr) => {
            if (arr.length === 0) return { avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };

            const sorted = [...arr].sort((a, b) => a - b);
            const sum = sorted.reduce((a, b) => a + b, 0);

            return {
                avg: Math.round(sum / sorted.length),
                min: sorted[0],
                max: sorted[sorted.length - 1],
                p50: sorted[Math.floor(sorted.length * 0.50)],
                p95: sorted[Math.floor(sorted.length * 0.95)],
                p99: sorted[Math.floor(sorted.length * 0.99)]
            };
        };

        return {
            wakeword: calculateStats(this.metrics.wakeword),
            sttFirstToken: calculateStats(this.metrics.sttFirstToken),
            nlu: calculateStats(this.metrics.nlu),
            responseGenFirstToken: calculateStats(this.metrics.responseGenFirstToken),
            ttsStart: calculateStats(this.metrics.ttsStart),
            endToEnd: calculateStats(this.metrics.endToEnd),
            sampleSize: this.metrics.endToEnd.length
        };
    }

    /**
     * Check if latencies meet targets
     */
    checkTargets(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session || !session.latencies.endToEnd) return null;

        const targets = {
            wakeword: 100,
            sttFirstToken: 200,
            nlu: 250,
            responseGenFirstToken: 400,
            ttsStart: 500,
            endToEnd: 1000
        };

        const results = {};
        Object.entries(targets).forEach(([metric, target]) => {
            const actual = session.latencies[metric];
            if (actual !== null) {
                results[metric] = {
                    target,
                    actual,
                    met: actual <= target,
                    delta: actual - target
                };
            }
        });

        const allMet = Object.values(results).every(r => r.met);

        return {
            sessionId,
            allTargetsMet: allMet,
            results,
            warnings: Object.entries(results)
                .filter(([_, r]) => !r.met)
                .map(([metric, r]) => `${metric}: ${r.actual}ms exceeds ${r.target}ms by ${r.delta}ms`)
        };
    }

    /**
     * Clean up old sessions (keep last 50)
     */
    cleanup() {
        if (this.sessions.size > 50) {
            const sortedSessions = Array.from(this.sessions.entries())
                .sort((a, b) => b[1].timestamps.sessionStart - a[1].timestamps.sessionStart);

            // Keep only last 50
            const toDelete = sortedSessions.slice(50);
            toDelete.forEach(([sessionId]) => {
                this.sessions.delete(sessionId);
            });

            console.info('[LATENCY-MONITOR]', `Cleaned up ${toDelete.length} old sessions`);
        }
    }

    /**
     * Get session data
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    /**
     * Reset all metrics (for testing)
     */
    reset() {
        this.sessions.clear();
        Object.keys(this.metrics).forEach(key => {
            this.metrics[key] = [];
        });
        console.info('[LATENCY-MONITOR]', 'All metrics reset');
    }
}

// Export singleton instance
const latencyMonitor = new LatencyMonitor();
export default latencyMonitor;

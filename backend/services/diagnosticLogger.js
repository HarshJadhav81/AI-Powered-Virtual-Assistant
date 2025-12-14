/**
 * Diagnostic Logger Service
 * Generates structured JSON logs for every voice interaction
 * Complies with SYSTEM PROMPT diagnostic format requirements
 */

import latencyMonitor from './latencyMonitor.js';

class DiagnosticLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000; // Keep last 1000 logs
    }

    /**
     * Log a voice interaction with full diagnostic data
     */
    log(sessionId, data = {}) {
        const latencyData = latencyMonitor.getDiagnosticLog(sessionId);

        const diagnosticLog = {
            sessionId,
            transcript: data.transcript || latencyData?.transcript || '',
            intent: data.intent || latencyData?.intent || 'unknown',
            slots: data.slots || {},
            confidence: data.confidence !== undefined ? data.confidence : (latencyData?.confidence || 0.0),
            latencies_ms: latencyData?.latencies_ms || {
                wakeword: 0,
                stt_first_token: 0,
                nlu: 0,
                response_gen_first_token: 0,
                tts_start: 0,
                end_to_end: 0
            },
            context_used: data.context_used || '',
            action_executed: data.action_executed || data.intent || '',
            errors: data.errors || latencyData?.errors || null,
            needs_clarification: data.needs_clarification !== undefined
                ? data.needs_clarification
                : (data.confidence < 0.55),
            timestamp: new Date().toISOString(),
            metadata: data.metadata || {}
        };

        // Add to logs
        this.logs.push(diagnosticLog);

        // Trim if exceeds max
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Console output with formatting
        console.info('[DIAGNOSTIC-LOG]', JSON.stringify(diagnosticLog, null, 2));

        return diagnosticLog;
    }

    /**
     * Log with latency warnings
     */
    logWithWarnings(sessionId, data = {}) {
        const diagnosticLog = this.log(sessionId, data);
        const targetCheck = latencyMonitor.checkTargets(sessionId);

        if (targetCheck && !targetCheck.allTargetsMet) {
            console.warn('[LATENCY-WARNING]', `Session ${sessionId} exceeded latency targets:`);
            targetCheck.warnings.forEach(warning => {
                console.warn('[LATENCY-WARNING]', `  - ${warning}`);
            });

            // Add warnings to log
            diagnosticLog.latency_warnings = targetCheck.warnings;
            diagnosticLog.targets_met = false;
        } else {
            diagnosticLog.targets_met = true;
        }

        return diagnosticLog;
    }

    /**
     * Get recent logs
     */
    getRecentLogs(limit = 10) {
        return this.logs.slice(-limit).reverse();
    }

    /**
     * Get logs by criteria
     */
    findLogs(criteria = {}) {
        return this.logs.filter(log => {
            if (criteria.intent && log.intent !== criteria.intent) return false;
            if (criteria.minConfidence !== undefined && log.confidence < criteria.minConfidence) return false;
            if (criteria.maxConfidence !== undefined && log.confidence > criteria.maxConfidence) return false;
            if (criteria.hasErrors !== undefined && (log.errors !== null) !== criteria.hasErrors) return false;
            if (criteria.needsClarification !== undefined && log.needs_clarification !== criteria.needsClarification) return false;
            if (criteria.exceedsLatency) {
                const maxLatency = log.latencies_ms.end_to_end;
                if (maxLatency <= criteria.exceedsLatency) return false;
            }
            return true;
        });
    }

    /**
     * Get performance summary
     */
    getSummary() {
        const stats = latencyMonitor.getStats();
        const recentLogs = this.logs.slice(-100);

        const summary = {
            totalInteractions: this.logs.length,
            recentInteractions: recentLogs.length,
            performanceMetrics: stats,
            errorRate: recentLogs.filter(l => l.errors !== null).length / recentLogs.length,
            clarificationRate: recentLogs.filter(l => l.needs_clarification).length / recentLogs.length,
            averageConfidence: recentLogs.reduce((sum, l) => sum + l.confidence, 0) / recentLogs.length,
            topIntents: this.getTopIntents(recentLogs, 5),
            timestamp: new Date().toISOString()
        };

        return summary;
    }

    /**
     * Get top N intents
     */
    getTopIntents(logs, limit = 5) {
        const intentCounts = {};
        logs.forEach(log => {
            intentCounts[log.intent] = (intentCounts[log.intent] || 0) + 1;
        });

        return Object.entries(intentCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([intent, count]) => ({ intent, count, percentage: (count / logs.length * 100).toFixed(1) }));
    }

    /**
     * Export logs as JSON
     */
    exportLogs() {
        return {
            logs: this.logs,
            summary: this.getSummary(),
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Clear all logs
     */
    clear() {
        this.logs = [];
        console.info('[DIAGNOSTIC-LOGGER]', 'All logs cleared');
    }
}

// Export singleton instance
const diagnosticLogger = new DiagnosticLogger();
export default diagnosticLogger;

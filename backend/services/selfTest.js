/**
 * Self-Testing Framework
 * Automated testing of voice assistant capabilities
 * Tests latency, accuracy, and functionality across all features
 */

import fastIntentService from './fastIntentService.js';
import latencyMonitor from './latencyMonitor.js';
import disambiguationService from './disambiguationService.js';
import safetyService from './safetyService.js';
import acknowledgmentService from './acknowledgmentService.js';
import diagnosticLogger from './diagnosticLogger.js';

class SelfTestService {
    constructor() {
        this.testResults = [];
        this.latencyBenchmarks = {
            fastIntent: [],
            partialIntent: [],
            disambiguation: [],
            safety: [],
            acknowledgment: []
        };
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.info('[SELF-TEST] Starting comprehensive test suite...');

        const results = [];

        // Test 1: Fast Intent Detection
        results.push(await this.testFastIntentDetection());

        // Test 2: Incremental NLU
        results.push(await this.testIncrementalNLU());

        // Test 3: Confidence Scoring
        results.push(await this.testConfidenceScoring());

        // Test 4: Disambiguation
        results.push(await this.testDisambiguation());

        // Test 5: Safety Confirmations
        results.push(await this.testSafetyConfirmations());

        // Test 6: Acknowledgments
        results.push(await this.testAcknowledgments());

        // Test 7: Latency Benchmarks
        results.push(await this.testLatencyBenchmarks());

        // Test 8: Diagnostic Logging
        results.push(await this.testDiagnosticLogging());

        // Generate report
        const report = this.generateTestReport(results);

        console.info('[SELF-TEST] Test suite complete');
        return report;
    }

    /**
     * Test 1: Fast Intent Detection
     */
    async testFastIntentDetection() {
        const testCases = [
            { input: "what's the time", expectedIntent: 'get-time', minConfidence: 0.9 },
            { input: "what's the date", expectedIntent: 'get-date', minConfidence: 0.9 },
            { input: "hello", expectedIntent: 'greeting', minConfidence: 0.9 },
            { input: "thank you", expectedIntent: 'thanks', minConfidence: 0.9 },
            { input: "play music", expectedIntent: 'play-music', minConfidence: 0.9 },
            { input: "weather", expectedIntent: 'weather-show', minConfidence: 0.9 }, // FIXED: weather matches weather-show
            { input: "open calculator", expectedIntent: 'calculator-open', minConfidence: 0.9 },
            { input: "2 + 2", expectedIntent: 'general', minConfidence: 0.9 }
        ];

        const results = [];
        let passed = 0;
        let failed = 0;

        for (const testCase of testCases) {
            const start = performance.now();
            const result = fastIntentService.detectIntent(testCase.input);
            const latency = performance.now() - start;

            this.latencyBenchmarks.fastIntent.push(latency);

            const intentMatches = result?.type === testCase.expectedIntent;
            const confidenceOk = result ? result.confidence >= testCase.minConfidence : testCase.minConfidence === 0.0;
            const pass = intentMatches && confidenceOk;

            if (pass) passed++;
            else failed++;

            results.push({
                input: testCase.input,
                expected: testCase.expectedIntent,
                actual: result?.type || 'null',
                confidence: result?.confidence || 0,
                latency: latency.toFixed(2) + 'ms',
                pass
            });
        }

        return {
            testType: 'Fast Intent Detection',
            pass: failed === 0,
            score: passed / testCases.length,
            passed,
            failed,
            total: testCases.length,
            avgLatency: this.calculateAvg(this.latencyBenchmarks.fastIntent),
            maxLatency: Math.max(...this.latencyBenchmarks.fastIntent),
            results,
            recommendations: failed > 0 ? ['Review failed intent patterns'] : []
        };
    }

    /**
     * Test 2: Incremental NLU
     */
    async testIncrementalNLU() {
        const testCases = [
            { partial: "play", expectedIntent: 'play-music', minConfidence: 0.5 },
            { partial: "play music", expectedIntent: 'play-music', minConfidence: 0.7 },
            { partial: "who is", expectedIntent: 'wikipedia-query', minConfidence: 0.7 },
            { partial: "weather", expectedIntent: 'weather-show', minConfidence: 0.8 },
            { partial: "search", expectedIntent: 'google-search', minConfidence: 0.5 }
        ];

        const results = [];
        let passed = 0;

        for (const testCase of testCases) {
            const start = performance.now();
            const result = fastIntentService.detectPartialIntent(testCase.partial);
            const latency = performance.now() - start;

            this.latencyBenchmarks.partialIntent.push(latency);

            const pass = result &&
                result.type === testCase.expectedIntent &&
                result.confidence >= testCase.minConfidence;

            if (pass) passed++;

            results.push({
                partial: testCase.partial,
                expected: testCase.expectedIntent,
                actual: result?.type || 'null',
                confidence: result?.confidence || 0,
                latency: latency.toFixed(2) + 'ms',
                pass
            });
        }

        return {
            testType: 'Incremental NLU',
            pass: passed === testCases.length,
            score: passed / testCases.length,
            passed,
            failed: testCases.length - passed,
            total: testCases.length,
            avgLatency: this.calculateAvg(this.latencyBenchmarks.partialIntent),
            results,
            recommendations: passed < testCases.length ? ['Add more prefix patterns'] : []
        };
    }

    /**
     * Test 3: Confidence Scoring
     */
    async testConfidenceScoring() {
        const testCases = [
            { input: "what's the time", minConfidence: 0.9, maxConfidence: 1.0 },
            { input: "hello", minConfidence: 0.9, maxConfidence: 1.0 },
            { input: "maybe do something", minConfidence: 0.0, maxConfidence: 0.3 } // Should be low/null
        ];

        const results = [];
        let passed = 0;

        for (const testCase of testCases) {
            const result = fastIntentService.detectIntent(testCase.input);
            const confidence = result?.confidence || 0;

            const pass = confidence >= testCase.minConfidence && confidence <= testCase.maxConfidence;
            if (pass) passed++;

            results.push({
                input: testCase.input,
                confidence: confidence.toFixed(2),
                expectedRange: `${testCase.minConfidence}-${testCase.maxConfidence}`,
                pass
            });
        }

        return {
            testType: 'Confidence Scoring',
            pass: passed === testCases.length,
            score: passed / testCases.length,
            passed,
            failed: testCases.length - passed,
            total: testCases.length,
            results
        };
    }

    /**
     * Test 4: Disambiguation
     */
    async testDisambiguation() {
        const results = [];
        let passed = 0;

        // Test low confidence triggers clarification
        const lowConfIntent = { type: 'google-search', confidence: 0.4, userInput: 'search stuff' };
        const needsClarification = disambiguationService.needsClarification(lowConfIntent.confidence);

        results.push({
            test: 'Low confidence triggers clarification',
            confidence: 0.4,
            needsClarification,
            pass: needsClarification === true
        });
        if (needsClarification) passed++;

        // Test clarification question generation
        const clarification = disambiguationService.generateClarificationQuestion({
            type: 'google-search',
            alternativeIntents: ['web-search'],
            userInput: 'search Einstein',
            confidence: 0.45
        });

        const hasQuestion = clarification && clarification.question && clarification.question.length > 0;
        results.push({
            test: 'Generates clarification question',
            question: clarification?.question || 'none',
            pass: hasQuestion
        });
        if (hasQuestion) passed++;

        // Test affirmative/negative detection
        const affirm = disambiguationService.isAffirmative('yes');
        const negate = disambiguationService.isNegative('no');

        results.push({
            test: 'Affirmative detection',
            input: 'yes',
            detected: affirm,
            pass: affirm === true
        });
        if (affirm) passed++;

        results.push({
            test: 'Negative detection',
            input: 'no',
            detected: negate,
            pass: negate === true
        });
        if (negate) passed++;

        return {
            testType: 'Disambiguation',
            pass: passed === 4,
            score: passed / 4,
            passed,
            failed: 4 - passed,
            total: 4,
            results
        };
    }

    /**
     * Test 5: Safety Confirmations
     */
    async testSafetyConfirmations() {
        const results = [];
        let passed = 0;

        // Test sensitive action detection
        const sensitiveIntents = ['payment-phonepe', 'gmail-send', 'whatsapp-send'];
        const nonSensitiveIntents = ['play-music', 'get-time', 'weather-show'];

        for (const intent of sensitiveIntents) {
            const requires = safetyService.requiresConfirmation(intent);
            results.push({
                intent,
                requiresConfirmation: requires,
                pass: requires === true
            });
            if (requires) passed++;
        }

        for (const intent of nonSensitiveIntents) {
            const requires = safetyService.requiresConfirmation(intent);
            results.push({
                intent,
                requiresConfirmation: requires,
                pass: requires === false
            });
            if (!requires) passed++;
        }

        // Test confirmation verification
        const sessionId = 'test_session_' + Date.now();
        safetyService.requestConfirmation(sessionId, { type: 'payment-phonepe', userInput: 'pay 5000' });

        const verified = safetyService.verifyConfirmation(sessionId, 'yes confirm');
        results.push({
            test: 'Confirmation verification',
            response: 'yes confirm',
            confirmed: verified.confirmed,
            pass: verified.confirmed === true
        });
        if (verified.confirmed) passed++;

        return {
            testType: 'Safety Confirmations',
            pass: passed === 7,
            score: passed / 7,
            passed,
            failed: 7 - passed,
            total: 7,
            results
        };
    }

    /**
     * Test 6: Acknowledgments
     */
    async testAcknowledgments() {
        const results = [];
        let passed = 0;

        // Test acknowledgment generation
        const intents = ['play-music', 'weather-show', 'set-alarm', 'default'];

        for (const intent of intents) {
            const ack = acknowledgmentService.getAcknowledgment(intent, 0.9);
            const hasText = ack && ack.text && ack.text.length > 0;

            results.push({
                intent,
                acknowledgment: ack?.text || 'none',
                pass: hasText
            });
            if (hasText) passed++;
        }

        // Test confidence threshold
        const lowConfAck = acknowledgmentService.getAcknowledgment('play-music', 0.5);
        results.push({
            test: 'Low confidence skips acknowledgment',
            confidence: 0.5,
            acknowledgment: lowConfAck?.text || 'null',
            pass: lowConfAck === null
        });
        if (!lowConfAck) passed++;

        return {
            testType: 'Acknowledgments',
            pass: passed === 5,
            score: passed / 5,
            passed,
            failed: 5 - passed,
            total: 5,
            results
        };
    }

    /**
     * Test 7: Latency Benchmarks
     */
    async testLatencyBenchmarks() {
        const targets = {
            fastIntent: 50, // <50ms
            partialIntent: 50,
            endToEnd: 1000 // <1s (simulated)
        };

        const results = [];
        let passed = 0;

        // Fast intent latency
        const avgFastIntent = this.calculateAvg(this.latencyBenchmarks.fastIntent);
        const fastIntentPass = avgFastIntent < targets.fastIntent;
        results.push({
            metric: 'Fast Intent Detection',
            target: `<${targets.fastIntent}ms`,
            actual: avgFastIntent.toFixed(2) + 'ms',
            pass: fastIntentPass
        });
        if (fastIntentPass) passed++;

        // Partial intent latency
        const avgPartialIntent = this.calculateAvg(this.latencyBenchmarks.partialIntent);
        const partialIntentPass = avgPartialIntent < targets.partialIntent;
        results.push({
            metric: 'Partial Intent Detection',
            target: `<${targets.partialIntent}ms`,
            actual: avgPartialIntent.toFixed(2) + 'ms',
            pass: partialIntentPass
        });
        if (partialIntentPass) passed++;

        return {
            testType: 'Latency Benchmarks',
            pass: passed === 2,
            score: passed / 2,
            passed,
            failed: 2 - passed,
            total: 2,
            results,
            recommendations: passed < 2 ? ['Optimize slow services'] : []
        };
    }

    /**
     * Test 8: Diagnostic Logging
     */
    async testDiagnosticLogging() {
        const results = [];
        let passed = 0;

        // Test log creation
        const sessionId = 'test_' + Date.now();
        latencyMonitor.startSession(sessionId);
        latencyMonitor.recordTimestamp(sessionId, 'sttComplete', { transcript: 'test' });
        latencyMonitor.recordTimestamp(sessionId, 'nluComplete', { intent: 'test-intent' });

        const log = diagnosticLogger.log(sessionId, {
            transcript: 'test command',
            intent: 'test-intent',
            confidence: 0.85
        });

        results.push({
            test: 'Log creation',
            hasLog: !!log,
            pass: !!log
        });
        if (log) passed++;

        // Test log structure
        const hasRequiredFields = log &&
            log.transcript &&
            log.intent &&
            log.confidence !== undefined &&
            log.latencies_ms;

        results.push({
            test: 'Log structure complete',
            hasRequiredFields,
            pass: hasRequiredFields
        });
        if (hasRequiredFields) passed++;

        return {
            testType: 'Diagnostic Logging',
            pass: passed === 2,
            score: passed / 2,
            passed,
            failed: 2 - passed,
            total: 2,
            results
        };
    }

    /**
     * Generate test report
     */
    generateTestReport(results) {
        const totalTests = results.reduce((sum, r) => sum + r.total, 0);
        const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
        const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

        const allPassed = results.every(r => r.pass);
        const overallScore = totalPassed / totalTests;

        const recommendations = results
            .filter(r => r.recommendations && r.recommendations.length > 0)
            .flatMap(r => r.recommendations);

        return {
            summary: {
                allTestsPassed: allPassed,
                overallScore: (overallScore * 100).toFixed(1) + '%',
                totalTests,
                totalPassed,
                totalFailed,
                timestamp: new Date().toISOString()
            },
            results,
            recommendations,
            latencyStats: {
                fastIntent: {
                    avg: this.calculateAvg(this.latencyBenchmarks.fastIntent).toFixed(2) + 'ms',
                    max: Math.max(...this.latencyBenchmarks.fastIntent).toFixed(2) + 'ms',
                    samples: this.latencyBenchmarks.fastIntent.length
                },
                partialIntent: {
                    avg: this.calculateAvg(this.latencyBenchmarks.partialIntent).toFixed(2) + 'ms',
                    max: Math.max(...this.latencyBenchmarks.partialIntent).toFixed(2) + 'ms',
                    samples: this.latencyBenchmarks.partialIntent.length
                }
            }
        };
    }

    /**
     * Calculate average
     */
    calculateAvg(arr) {
        if (arr.length === 0) return 0;
        return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    }

    /**
     * Export test results
     */
    exportResults(report) {
        return JSON.stringify(report, null, 2);
    }
}

// Export singleton
const selfTestService = new SelfTestService();
export default selfTestService;

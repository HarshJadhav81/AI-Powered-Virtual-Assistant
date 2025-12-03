#!/usr/bin/env node
/**
 * Test Runner Script
 * Run self-tests from command line
 * Usage: node scripts/test-runner.js
 */

import selfTestService from '../services/selfTest.js';

console.log('========================================');
console.log('🧪 Voice Assistant Self-Test Suite');
console.log('========================================\n');

async function runTests() {
    try {
        const report = await selfTestService.runAllTests();

        console.log('\n========================================');
        console.log('📊 TEST RESULTS');
        console.log('========================================\n');

        console.log(`Overall Score: ${report.summary.overallScore}`);
        console.log(`Total Tests: ${report.summary.totalTests}`);
        console.log(`✅ Passed: ${report.summary.totalPassed}`);
        console.log(`❌ Failed: ${report.summary.totalFailed}`);
        console.log(`All Tests Passed: ${report.summary.allTestsPassed ? '✅ YES' : '❌ NO'}\n`);

        console.log('Test Breakdown:');
        console.log('---');

        report.results.forEach(result => {
            const icon = result.pass ? '✅' : '❌';
            console.log(`${icon} ${result.testType}: ${result.passed}/${result.total} (${(result.score * 100).toFixed(1)}%)`);
        });

        console.log('\n========================================');
        console.log('⚡ LATENCY STATISTICS');
        console.log('========================================\n');

        console.log(`Fast Intent Detection: ${report.latencyStats.fastIntent.avg} (max: ${report.latencyStats.fastIntent.max})`);
        console.log(`Partial Intent Detection: ${report.latencyStats.partialIntent.avg} (max: ${report.latencyStats.partialIntent.max})`);

        if (report.recommendations.length > 0) {
            console.log('\n========================================');
            console.log('💡 RECOMMENDATIONS');
            console.log('========================================\n');

            report.recommendations.forEach((rec, i) => {
                console.log(`${i + 1}. ${rec}`);
            });
        }

        console.log('\n========================================');
        console.log(report.summary.allTestsPassed ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED');
        console.log('========================================\n');

        // Export full report
        const exportedReport = selfTestService.exportResults(report);
        console.log('Full report (JSON):');
        console.log(exportedReport);

        // Exit with appropriate code
        process.exit(report.summary.allTestsPassed ? 0 : 1);

    } catch (error) {
        console.error('\n❌ Error running tests:', error);
        process.exit(1);
    }
}

runTests();

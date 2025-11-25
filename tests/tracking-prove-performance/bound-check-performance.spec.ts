import { initializeWasm, BoundCheckSnarkSetup } from '../../src';
import { PerformanceTracker } from './performance-tracker';
import { checkLegoProvingKey } from '../utils';

describe('Bound Check Proof Performance', () => {
    let tracker: PerformanceTracker;

    beforeAll(async () => {
        await initializeWasm();
        tracker = new PerformanceTracker({
            verbose: true,
            warmupIterations: 2,
            iterations: 10
        });
    });

    afterAll(() => {
        tracker.printStats();

        // Save HTML dashboard
        const dashboardPath = `${__dirname}/performance-dashboard.html`;
        tracker.saveDashboard(dashboardPath);

        console.log('\n=== Detailed Metrics (JSON) ===');
        console.log(tracker.exportToJSON());
    });

    it('should track BoundCheckSnarkSetup performance', async () => {
        const stats = await tracker.benchmark(
            'BoundCheckSnarkSetup',
            async () => {
                const pk = BoundCheckSnarkSetup();
                checkLegoProvingKey(pk);
                return pk;
            },
            10
        );

        console.log('\n=== BoundCheckSnarkSetup Stats ===');
        console.log(`Average time: ${stats.avgTimeMs.toFixed(2)}ms`);
        console.log(`Min time: ${stats.minTimeMs.toFixed(2)}ms`);
        console.log(`Max time: ${stats.maxTimeMs.toFixed(2)}ms`);
        console.log(`Average memory: ${stats.avgMemoryMB.toFixed(2)}MB`);
        console.log(`Peak memory: ${stats.peakMemoryMB.toFixed(2)}MB`);

        // Assertions
        expect(stats.count).toBe(10);
        expect(stats.avgTimeMs).toBeGreaterThan(0);
        expect(stats.minTimeMs).toBeLessThanOrEqual(stats.avgTimeMs);
        expect(stats.maxTimeMs).toBeGreaterThanOrEqual(stats.avgTimeMs);
    }, 120000);

    it('should track single operation with detailed metrics', async () => {
        const { result, metrics } = await tracker.track(
            'Single BoundCheckSnarkSetup',
            async () => {
                return BoundCheckSnarkSetup();
            }
        );

        console.log('\n=== Single Operation Metrics ===');
        console.log(`Time: ${metrics.timeMs.toFixed(2)}ms`);
        console.log(`Memory used: ${metrics.memoryMB.toFixed(2)}MB`);
        console.log(`Peak memory: ${metrics.peakMemoryMB.toFixed(2)}MB`);
        console.log(`Timestamp: ${metrics.timestamp.toISOString()}`);

        expect(result).toBeDefined();
        expect(metrics.timeMs).toBeGreaterThan(0);
        checkLegoProvingKey(result);
    }, 90000);

    it('should compare performance across different iterations', async () => {
        const iterations = [5, 10, 20];
        const results: any[] = [];

        for (const iter of iterations) {
            const stats = await tracker.benchmark(
                `BoundCheckSnarkSetup-${iter}iter`,
                async () => BoundCheckSnarkSetup(),
                iter
            );
            results.push({ iterations: iter, stats });
        }

        console.log('\n=== Iteration Comparison ===');
        for (const { iterations: iter, stats } of results) {
            console.log(`\n${iter} iterations:`);
            console.log(`  Avg time: ${stats.avgTimeMs.toFixed(2)}ms`);
            console.log(`  Avg memory: ${stats.avgMemoryMB.toFixed(2)}MB`);
        }

        expect(results.length).toBe(3);
    }, 300000);
});

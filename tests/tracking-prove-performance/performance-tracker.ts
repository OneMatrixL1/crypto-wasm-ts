import { PerformanceResult, MemoryUsage } from './types';

/**
 * Performance tracking utility for measuring execution time and memory usage
 */
export class PerformanceTracker {
    private name: string;
    private startTime: bigint | null = null;
    private endTime: bigint | null = null;
    private startMemory: MemoryUsage | null = null;
    private endMemory: MemoryUsage | null = null;

    constructor(name: string) {
        this.name = name;
    }

    /**
     * Start tracking performance
     * Forces garbage collection if available (run with --expose-gc flag)
     */
    start(): void {
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }

        this.startMemory = this.captureMemory();
        this.startTime = process.hrtime.bigint();
    }

    /**
     * Stop tracking performance
     */
    stop(): void {
        this.endTime = process.hrtime.bigint();
        this.endMemory = this.captureMemory();
    }

    /**
     * Capture current memory usage
     */
    private captureMemory(): MemoryUsage {
        const mem = process.memoryUsage();
        return {
            rss: mem.rss,
            heapTotal: mem.heapTotal,
            heapUsed: mem.heapUsed,
            external: mem.external,
        };
    }

    /**
     * Get performance results
     */
    getResults(): PerformanceResult {
        if (!this.startTime || !this.endTime || !this.startMemory || !this.endMemory) {
            throw new Error('Performance tracking not completed. Call start() and stop() first.');
        }

        const durationMs = Number(this.endTime - this.startTime) / 1_000_000;

        return {
            name: this.name,
            timestamp: new Date().toISOString(),
            duration: {
                ms: parseFloat(durationMs.toFixed(2)),
                seconds: parseFloat((durationMs / 1000).toFixed(3)),
            },
            memory: {
                start: this.startMemory,
                end: this.endMemory,
                delta: {
                    rss: this.endMemory.rss - this.startMemory.rss,
                    heapTotal: this.endMemory.heapTotal - this.startMemory.heapTotal,
                    heapUsed: this.endMemory.heapUsed - this.startMemory.heapUsed,
                    external: this.endMemory.external - this.startMemory.external,
                },
            },
        };
    }

    /**
     * Format bytes to MB
     */
    private formatMemory(bytes: number): string {
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    }

    /**
     * Print results to console and return the results object
     */
    printResults(): PerformanceResult {
        const results = this.getResults();

        console.log(`\n${'='.repeat(80)}`);
        console.log(`Performance Report: ${results.name}`);
        console.log('='.repeat(80));
        console.log(`⏱️  Duration: ${results.duration.ms} ms (${results.duration.seconds}s)`);
        console.log(`\n📊 Memory Usage:`);
        console.log(`   Start:`);
        console.log(`     - RSS:        ${this.formatMemory(results.memory.start.rss)}`);
        console.log(`     - Heap Total: ${this.formatMemory(results.memory.start.heapTotal)}`);
        console.log(`     - Heap Used:  ${this.formatMemory(results.memory.start.heapUsed)}`);
        console.log(`     - External:   ${this.formatMemory(results.memory.start.external)}`);
        console.log(`   End:`);
        console.log(`     - RSS:        ${this.formatMemory(results.memory.end.rss)}`);
        console.log(`     - Heap Total: ${this.formatMemory(results.memory.end.heapTotal)}`);
        console.log(`     - Heap Used:  ${this.formatMemory(results.memory.end.heapUsed)}`);
        console.log(`     - External:   ${this.formatMemory(results.memory.end.external)}`);
        console.log(`   Delta (Change):`);
        console.log(`     - RSS:        ${this.formatMemory(results.memory.delta.rss)}`);
        console.log(`     - Heap Total: ${this.formatMemory(results.memory.delta.heapTotal)}`);
        console.log(`     - Heap Used:  ${this.formatMemory(results.memory.delta.heapUsed)}`);
        console.log(`     - External:   ${this.formatMemory(results.memory.delta.external)}`);
        console.log('='.repeat(80) + '\n');

        return results;
    }
}

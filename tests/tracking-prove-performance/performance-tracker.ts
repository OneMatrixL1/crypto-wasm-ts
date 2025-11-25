import { PerformanceMetrics, PerformanceStats, PerformanceConfig } from './types';

/**
 * Performance tracker for measuring time and memory usage
 */
export class PerformanceTracker {
    private metrics: PerformanceMetrics[] = [];
    private config: PerformanceConfig;

    constructor(config: PerformanceConfig = {}) {
        this.config = {
            verbose: false,
            warmupIterations: 0,
            iterations: 1,
            ...config
        };
    }

    /**
     * Get current memory usage in MB
     */
    private getMemoryUsage(): { used: number; total: number } {
        const usage = process.memoryUsage();
        return {
            used: usage.heapUsed / 1024 / 1024,
            total: usage.heapTotal / 1024 / 1024
        };
    }

    /**
     * Track an async operation
     */
    async track<T>(
        operation: string,
        fn: () => Promise<T>
    ): Promise<{ result: T; metrics: PerformanceMetrics }> {
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }

        const startMemory = this.getMemoryUsage();
        const startTime = performance.now();

        // Execute the operation
        const result = await fn();

        const endTime = performance.now();
        const endMemory = this.getMemoryUsage();

        const metrics: PerformanceMetrics = {
            operation,
            timeMs: endTime - startTime,
            memoryMB: endMemory.used - startMemory.used,
            peakMemoryMB: endMemory.total,
            timestamp: new Date()
        };

        this.metrics.push(metrics);

        if (this.config.verbose) {
            console.log(`[${operation}] Time: ${metrics.timeMs.toFixed(2)}ms, Memory: ${metrics.memoryMB.toFixed(2)}MB`);
        }

        return { result, metrics };
    }

    /**
     * Track a synchronous operation
     */
    trackSync<T>(
        operation: string,
        fn: () => T
    ): { result: T; metrics: PerformanceMetrics } {
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }

        const startMemory = this.getMemoryUsage();
        const startTime = performance.now();

        // Execute the operation
        const result = fn();

        const endTime = performance.now();
        const endMemory = this.getMemoryUsage();

        const metrics: PerformanceMetrics = {
            operation,
            timeMs: endTime - startTime,
            memoryMB: endMemory.used - startMemory.used,
            peakMemoryMB: endMemory.total,
            timestamp: new Date()
        };

        this.metrics.push(metrics);

        if (this.config.verbose) {
            console.log(`[${operation}] Time: ${metrics.timeMs.toFixed(2)}ms, Memory: ${metrics.memoryMB.toFixed(2)}MB`);
        }

        return { result, metrics };
    }

    /**
     * Run multiple iterations and collect statistics
     */
    async benchmark<T>(
        operation: string,
        fn: () => Promise<T>,
        iterations?: number
    ): Promise<PerformanceStats> {
        const iterCount = iterations || this.config.iterations || 1;
        const warmup = this.config.warmupIterations || 0;

        // Warmup iterations
        for (let i = 0; i < warmup; i++) {
            await fn();
        }

        // Actual benchmark iterations
        const results: PerformanceMetrics[] = [];
        for (let i = 0; i < iterCount; i++) {
            const { metrics } = await this.track(operation, fn);
            results.push(metrics);
        }

        return this.calculateStats(operation, results);
    }

    /**
     * Run multiple synchronous iterations and collect statistics
     */
    benchmarkSync<T>(
        operation: string,
        fn: () => T,
        iterations?: number
    ): PerformanceStats {
        const iterCount = iterations || this.config.iterations || 1;
        const warmup = this.config.warmupIterations || 0;

        // Warmup iterations
        for (let i = 0; i < warmup; i++) {
            fn();
        }

        // Actual benchmark iterations
        const results: PerformanceMetrics[] = [];
        for (let i = 0; i < iterCount; i++) {
            const { metrics } = this.trackSync(operation, fn);
            results.push(metrics);
        }

        return this.calculateStats(operation, results);
    }

    /**
     * Calculate statistics from metrics
     */
    private calculateStats(operation: string, metrics: PerformanceMetrics[]): PerformanceStats {
        const times = metrics.map(m => m.timeMs);
        const memories = metrics.map(m => m.memoryMB);
        const peaks = metrics.map(m => m.peakMemoryMB);

        return {
            operation,
            count: metrics.length,
            avgTimeMs: times.reduce((a, b) => a + b, 0) / times.length,
            minTimeMs: Math.min(...times),
            maxTimeMs: Math.max(...times),
            avgMemoryMB: memories.reduce((a, b) => a + b, 0) / memories.length,
            peakMemoryMB: Math.max(...peaks)
        };
    }

    /**
     * Get all collected metrics
     */
    getMetrics(): PerformanceMetrics[] {
        return this.metrics;
    }

    /**
     * Get statistics grouped by operation
     */
    getStatsByOperation(): Map<string, PerformanceStats> {
        const grouped = new Map<string, PerformanceMetrics[]>();

        for (const metric of this.metrics) {
            if (!grouped.has(metric.operation)) {
                grouped.set(metric.operation, []);
            }
            grouped.get(metric.operation)!.push(metric);
        }

        const stats = new Map<string, PerformanceStats>();
        for (const [operation, metrics] of grouped) {
            stats.set(operation, this.calculateStats(operation, metrics));
        }

        return stats;
    }

    /**
     * Print formatted statistics
     */
    printStats(): void {
        const stats = this.getStatsByOperation();

        console.log('\n=== Performance Statistics ===\n');
        for (const [operation, stat] of stats) {
            console.log(`Operation: ${operation}`);
            console.log(`  Iterations: ${stat.count}`);
            console.log(`  Time (avg): ${stat.avgTimeMs.toFixed(2)}ms`);
            console.log(`  Time (min): ${stat.minTimeMs.toFixed(2)}ms`);
            console.log(`  Time (max): ${stat.maxTimeMs.toFixed(2)}ms`);
            console.log(`  Memory (avg): ${stat.avgMemoryMB.toFixed(2)}MB`);
            console.log(`  Memory (peak): ${stat.peakMemoryMB.toFixed(2)}MB`);
            console.log('');
        }
    }

    /**
     * Export metrics to JSON
     */
    exportToJSON(): string {
        return JSON.stringify({
            config: this.config,
            metrics: this.metrics,
            stats: Array.from(this.getStatsByOperation().values())
        }, null, 2);
    }

    /**
     * Clear all metrics
     */
    clear(): void {
        this.metrics = [];
    }

    /**
     * Save performance dashboard to HTML file
     */
    saveDashboard(outputPath: string): void {
        const { DashboardGenerator } = require('./dashboard-generator');
        DashboardGenerator.saveDashboard(this.metrics, this.getStatsByOperation(), outputPath);
    }
}

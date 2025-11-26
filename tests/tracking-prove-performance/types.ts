/**
 * Type definitions for performance tracking
 */

export interface MemoryUsage {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
}

export interface MemoryDelta {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
}

export interface DurationMetrics {
    ms: number;
    seconds: number;
}

export interface PerformanceResult {
    name: string;
    timestamp: string;
    duration: DurationMetrics;
    memory: {
        start: MemoryUsage;
        end: MemoryUsage;
        delta: MemoryDelta;
    };
}

export interface BenchmarkMetadata {
    testDate: string;
    nodeVersion: string;
    platform: string;
    arch: string;
    totalTests: number;
}

export interface BenchmarkSummary {
    totalDuration: number;
    averageDuration: number;
    totalMemoryDelta: number;
    averageMemoryDelta: number;
}

export interface BenchmarkExport {
    metadata: BenchmarkMetadata;
    results: PerformanceResult[];
    summary: BenchmarkSummary;
}

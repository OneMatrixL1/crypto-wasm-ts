/**
 * Performance metrics for tracking proof operations
 */
export interface PerformanceMetrics {
    /** Operation name */
    operation: string;
    /** Time taken in milliseconds */
    timeMs: number;
    /** Memory used in MB */
    memoryMB: number;
    /** Peak memory in MB */
    peakMemoryMB: number;
    /** Timestamp when operation started */
    timestamp: Date;
}

/**
 * Aggregated performance statistics
 */
export interface PerformanceStats {
    operation: string;
    count: number;
    avgTimeMs: number;
    minTimeMs: number;
    maxTimeMs: number;
    avgMemoryMB: number;
    peakMemoryMB: number;
}

/**
 * Configuration for performance tracking
 */
export interface PerformanceConfig {
    /** Enable detailed logging */
    verbose?: boolean;
    /** Number of warmup iterations before tracking */
    warmupIterations?: number;
    /** Number of iterations to track */
    iterations?: number;
}

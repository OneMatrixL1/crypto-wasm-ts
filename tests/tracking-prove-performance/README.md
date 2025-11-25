# Performance Tracking for Proof Operations

This folder contains performance tracking utilities and tests for measuring proof generation and verification performance with a beautiful web-based dashboard UI.

## Structure

```
tracking-prove-performance/
├── types.ts                          # Type definitions for metrics
├── performance-tracker.ts            # Performance tracking utility
├── dashboard-generator.ts            # HTML dashboard generator
├── bound-check-performance.spec.ts   # Bound check proof performance tests
├── performance-dashboard.html        # Generated dashboard (after running tests)
└── README.md                         # This file
```

## Features

### 📊 Interactive Dashboard UI

After running tests, an interactive HTML dashboard is automatically generated with:

- **📈 Charts**: Time comparison, memory usage, and distribution charts using Chart.js
- **📋 Tables**: Detailed metrics with color-coded performance indicators
- **💳 Stat Cards**: Quick overview of total operations, average time, and memory usage
- **🎨 Beautiful Design**: Modern gradient UI with smooth animations

**Dashboard Preview:**
- Time comparison bar charts (avg, min, max)
- Memory usage visualization
- Time distribution line charts
- Detailed metrics table with timestamps
- Responsive design for all screen sizes

### PerformanceTracker

A comprehensive utility for tracking:
- **Time**: Execution time in milliseconds
- **Memory**: Heap memory usage in MB
- **Peak Memory**: Maximum memory usage during operation

### Capabilities

1. **Single Operation Tracking**
   ```typescript
   const { result, metrics } = await tracker.track('operation-name', async () => {
       // Your operation here
   });
   ```

2. **Benchmarking (Multiple Iterations)**
   ```typescript
   const stats = await tracker.benchmark('operation-name', async () => {
       // Your operation here
   }, 10); // 10 iterations
   ```

3. **Warmup Support**
   ```typescript
   const tracker = new PerformanceTracker({
       warmupIterations: 2,  // Run 2 warmup iterations
       iterations: 10,       // Default iterations for benchmark
       verbose: true         // Print detailed logs
   });
   ```

4. **Statistics**
   - Average, min, max time
   - Average and peak memory usage
   - Grouped by operation name

## Usage

### Running Tests

```bash
# Run all performance tests
npm test tracking-prove-performance

# Run specific test file
npm test tracking-prove-performance/bound-check-performance.spec.ts

# Run with garbage collection enabled (recommended for accurate memory tracking)
node --expose-gc node_modules/.bin/jest tracking-prove-performance
```

### Example Output

```
=== Performance Statistics ===

Operation: BoundCheckSnarkSetup
  Iterations: 10
  Time (avg): 1234.56ms
  Time (min): 1200.00ms
  Time (max): 1300.00ms
  Memory (avg): 45.23MB
  Memory (peak): 120.50MB
```

### Custom Performance Test

```typescript
import { PerformanceTracker } from './performance-tracker';

describe('My Performance Test', () => {
    let tracker: PerformanceTracker;

    beforeAll(() => {
        tracker = new PerformanceTracker({
            verbose: true,
            warmupIterations: 2,
            iterations: 10
        });
    });

    afterAll(() => {
        tracker.printStats();
    });

    it('should track my operation', async () => {
        const stats = await tracker.benchmark(
            'MyOperation',
            async () => {
                // Your operation here
                return result;
            },
            10
        );

        expect(stats.avgTimeMs).toBeLessThan(1000); // Assert performance
    });
});
```

## Metrics Exported

All metrics can be exported to JSON:

```typescript
const json = tracker.exportToJSON();
// Save to file or send to monitoring system
```

JSON format:
```json
{
  "config": {
    "verbose": true,
    "warmupIterations": 2,
    "iterations": 10
  },
  "metrics": [
    {
      "operation": "BoundCheckSnarkSetup",
      "timeMs": 1234.56,
      "memoryMB": 45.23,
      "peakMemoryMB": 120.50,
      "timestamp": "2025-11-25T10:00:00.000Z"
    }
  ],
  "stats": [
    {
      "operation": "BoundCheckSnarkSetup",
      "count": 10,
      "avgTimeMs": 1234.56,
      "minTimeMs": 1200.00,
      "maxTimeMs": 1300.00,
      "avgMemoryMB": 45.23,
      "peakMemoryMB": 120.50
    }
  ]
}
```

## Best Practices

1. **Enable Garbage Collection**: Run tests with `--expose-gc` flag for accurate memory measurements
2. **Use Warmup Iterations**: First few iterations may be slower due to JIT compilation
3. **Consistent Environment**: Run performance tests in a consistent environment
4. **Multiple Iterations**: Use at least 10 iterations for reliable statistics
5. **Monitor Trends**: Track metrics over time to detect performance regressions

## Notes

- Memory measurements are based on Node.js `process.memoryUsage()`
- Time measurements use `performance.now()` for high precision
- Garbage collection is triggered before each measurement (if available)
- Peak memory represents the total heap size, not just the delta

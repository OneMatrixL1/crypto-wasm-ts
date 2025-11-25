import * as fs from 'fs';
import * as path from 'path';
import { PerformanceMetrics, PerformanceStats } from './types';

/**
 * Generate HTML dashboard from performance metrics
 */
export class DashboardGenerator {
    /**
     * Generate HTML dashboard
     */
    static generateHTML(
        metrics: PerformanceMetrics[],
        stats: Map<string, PerformanceStats>
    ): string {
        const statsArray = Array.from(stats.values());

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Tracking Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        header {
            background: white;
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        h1 {
            color: #2d3748;
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .subtitle {
            color: #718096;
            font-size: 1.1rem;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: white;
            border-radius: 16px;
            padding: 25px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
        }

        .stat-label {
            color: #718096;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }

        .stat-value {
            color: #2d3748;
            font-size: 2rem;
            font-weight: bold;
        }

        .stat-unit {
            color: #a0aec0;
            font-size: 1rem;
            font-weight: normal;
        }

        .chart-container {
            background: white;
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .chart-title {
            color: #2d3748;
            font-size: 1.5rem;
            margin-bottom: 20px;
            font-weight: 600;
        }

        canvas {
            max-height: 400px;
        }

        table {
            width: 100%;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        th, td {
            padding: 16px;
            text-align: left;
        }

        th {
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 0.5px;
        }

        tbody tr {
            border-bottom: 1px solid #e2e8f0;
            transition: background-color 0.2s ease;
        }

        tbody tr:hover {
            background-color: #f7fafc;
        }

        tbody tr:last-child {
            border-bottom: none;
        }

        .metric-good {
            color: #48bb78;
            font-weight: 600;
        }

        .metric-warning {
            color: #ed8936;
            font-weight: 600;
        }

        .metric-bad {
            color: #f56565;
            font-weight: 600;
        }

        .timestamp {
            color: #a0aec0;
            font-size: 0.9rem;
        }

        footer {
            text-align: center;
            color: white;
            margin-top: 40px;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>⚡ Performance Tracking Dashboard</h1>
            <p class="subtitle">Proof Generation & Verification Metrics</p>
        </header>

        <div class="stats-grid">
            ${this.generateStatCards(statsArray)}
        </div>

        <div class="chart-container">
            <h2 class="chart-title">📊 Execution Time Comparison</h2>
            <canvas id="timeChart"></canvas>
        </div>

        <div class="chart-container">
            <h2 class="chart-title">💾 Memory Usage Comparison</h2>
            <canvas id="memoryChart"></canvas>
        </div>

        <div class="chart-container">
            <h2 class="chart-title">📈 Time Distribution</h2>
            <canvas id="timeDistributionChart"></canvas>
        </div>

        <div class="chart-container">
            <h2 class="chart-title">📋 Detailed Metrics</h2>
            ${this.generateMetricsTable(metrics)}
        </div>

        <footer>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </footer>
    </div>

    <script>
        const statsData = ${JSON.stringify(statsArray)};
        const metricsData = ${JSON.stringify(metrics)};

        // Time Comparison Chart
        new Chart(document.getElementById('timeChart'), {
            type: 'bar',
            data: {
                labels: statsData.map(s => s.operation),
                datasets: [{
                    label: 'Average Time (ms)',
                    data: statsData.map(s => s.avgTimeMs),
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2
                }, {
                    label: 'Min Time (ms)',
                    data: statsData.map(s => s.minTimeMs),
                    backgroundColor: 'rgba(72, 187, 120, 0.8)',
                    borderColor: 'rgba(72, 187, 120, 1)',
                    borderWidth: 2
                }, {
                    label: 'Max Time (ms)',
                    data: statsData.map(s => s.maxTimeMs),
                    backgroundColor: 'rgba(245, 101, 101, 0.8)',
                    borderColor: 'rgba(245, 101, 101, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Time (ms)'
                        }
                    }
                }
            }
        });

        // Memory Comparison Chart
        new Chart(document.getElementById('memoryChart'), {
            type: 'bar',
            data: {
                labels: statsData.map(s => s.operation),
                datasets: [{
                    label: 'Average Memory (MB)',
                    data: statsData.map(s => s.avgMemoryMB),
                    backgroundColor: 'rgba(118, 75, 162, 0.8)',
                    borderColor: 'rgba(118, 75, 162, 1)',
                    borderWidth: 2
                }, {
                    label: 'Peak Memory (MB)',
                    data: statsData.map(s => s.peakMemoryMB),
                    backgroundColor: 'rgba(237, 137, 54, 0.8)',
                    borderColor: 'rgba(237, 137, 54, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Memory (MB)'
                        }
                    }
                }
            }
        });

        // Time Distribution Chart
        new Chart(document.getElementById('timeDistributionChart'), {
            type: 'line',
            data: {
                labels: metricsData.map((_, i) => \`Run \${i + 1}\`),
                datasets: statsData.map((stat, idx) => ({
                    label: stat.operation,
                    data: metricsData
                        .filter(m => m.operation === stat.operation)
                        .map(m => m.timeMs),
                    borderColor: \`hsl(\${idx * 60}, 70%, 50%)\`,
                    backgroundColor: \`hsla(\${idx * 60}, 70%, 50%, 0.1)\`,
                    tension: 0.4,
                    fill: true
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Time (ms)'
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;
    }

    /**
     * Generate stat cards HTML
     */
    private static generateStatCards(stats: PerformanceStats[]): string {
        if (stats.length === 0) {
            return '<div class="stat-card"><p>No statistics available</p></div>';
        }

        const totalOps = stats.reduce((sum, s) => sum + s.count, 0);
        const avgTime = stats.reduce((sum, s) => sum + s.avgTimeMs, 0) / stats.length;
        const avgMemory = stats.reduce((sum, s) => sum + s.avgMemoryMB, 0) / stats.length;
        const peakMemory = Math.max(...stats.map(s => s.peakMemoryMB));

        return `
            <div class="stat-card">
                <div class="stat-label">Total Operations</div>
                <div class="stat-value">${totalOps}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Average Time</div>
                <div class="stat-value">${avgTime.toFixed(2)} <span class="stat-unit">ms</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Average Memory</div>
                <div class="stat-value">${avgMemory.toFixed(2)} <span class="stat-unit">MB</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Peak Memory</div>
                <div class="stat-value">${peakMemory.toFixed(2)} <span class="stat-unit">MB</span></div>
            </div>
        `;
    }

    /**
     * Generate metrics table HTML
     */
    private static generateMetricsTable(metrics: PerformanceMetrics[]): string {
        const rows = metrics.map(m => `
            <tr>
                <td>${m.operation}</td>
                <td class="${this.getTimeClass(m.timeMs)}">${m.timeMs.toFixed(2)} ms</td>
                <td>${m.memoryMB.toFixed(2)} MB</td>
                <td>${m.peakMemoryMB.toFixed(2)} MB</td>
                <td class="timestamp">${new Date(m.timestamp).toLocaleString()}</td>
            </tr>
        `).join('');

        return `
            <table>
                <thead>
                    <tr>
                        <th>Operation</th>
                        <th>Time</th>
                        <th>Memory Used</th>
                        <th>Peak Memory</th>
                        <th>Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    /**
     * Get CSS class based on time value
     */
    private static getTimeClass(timeMs: number): string {
        if (timeMs < 100) return 'metric-good';
        if (timeMs < 1000) return 'metric-warning';
        return 'metric-bad';
    }

    /**
     * Save dashboard to file
     */
    static saveDashboard(
        metrics: PerformanceMetrics[],
        stats: Map<string, PerformanceStats>,
        outputPath: string
    ): void {
        const html = this.generateHTML(metrics, stats);
        const dir = path.dirname(outputPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, html, 'utf-8');
        console.log(`\n✅ Dashboard saved to: ${outputPath}`);
    }
}

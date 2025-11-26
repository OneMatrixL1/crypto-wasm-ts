#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find the most recent bound-check performance results file
function findLatestResultsFile() {
    const resultsDir = path.join(__dirname, '../../performance-results');

    if (!fs.existsSync(resultsDir)) {
        console.error('❌ No performance results found. Please run tests first.');
        process.exit(1);
    }

    const files = fs
        .readdirSync(resultsDir)
        .filter((f) => f.startsWith('prove-performance-') && f.endsWith('.json'))
        .map((f) => ({
            name: f,
            path: path.join(resultsDir, f),
            mtime: fs.statSync(path.join(resultsDir, f)).mtime,
        }))
        .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) {
        console.error('❌ No prove performance results found. Please run tests first.');
        process.exit(1);
    }

    return files[0].path;
}

// Generate HTML dashboard
function generateDashboard(resultsFile) {
    const data = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bound Check Range Proof Performance Dashboard</title>
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
            max-width: 1600px;
            margin: 0 auto;
        }

        .header {
            background: white;
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }

        h1 {
            color: #667eea;
            font-size: 2.5em;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .subtitle {
            color: #666;
            font-size: 1.1em;
            margin-top: 10px;
        }

        .metadata {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }

        .metadata-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }

        .metadata-label {
            font-size: 0.85em;
            color: #666;
            margin-bottom: 5px;
        }

        .metadata-value {
            font-size: 1.1em;
            font-weight: 600;
            color: #333;
        }

        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }

        .card-title {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .card-value {
            font-size: 2.5em;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .card-subtitle {
            font-size: 0.85em;
            color: #999;
            margin-top: 5px;
        }

        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .chart-container {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }

        .chart-container.full-width {
            grid-column: 1 / -1;
        }

        .chart-title {
            font-size: 1.3em;
            font-weight: 600;
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f0f0;
        }

        .results-table {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            position: sticky;
            top: 0;
        }

        td {
            padding: 12px 15px;
            border-bottom: 1px solid #f0f0f0;
        }

        tr:hover {
            background: #f8f9fa;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }

        .badge-fast {
            background: #d4edda;
            color: #155724;
        }

        .badge-medium {
            background: #fff3cd;
            color: #856404;
        }

        .badge-slow {
            background: #f8d7da;
            color: #721c24;
        }

        .protocol-tag {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 0.75em;
            font-weight: 600;
            margin-right: 8px;
        }

        .protocol-lego {
            background: #e3f2fd;
            color: #1976d2;
        }

        .protocol-bpp {
            background: #f3e5f5;
            color: #7b1fa2;
        }

        .protocol-smc {
            background: #e8f5e9;
            color: #388e3c;
        }

        .protocol-smckv {
            background: #fff3e0;
            color: #f57c00;
        }

        .footer {
            text-align: center;
            color: white;
            margin-top: 30px;
            padding: 20px;
            opacity: 0.9;
        }

        @media (max-width: 768px) {
            .charts-grid {
                grid-template-columns: 1fr;
            }
            
            h1 {
                font-size: 1.8em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>
                <span>⚡</span>
                Bound Check Range Proof Performance Dashboard
            </h1>
            <div class="subtitle">
                Comprehensive performance benchmarks for four bound-check protocols
            </div>
            <div class="metadata">
                <div class="metadata-item">
                    <div class="metadata-label">Test Date</div>
                    <div class="metadata-value">${new Date(data.metadata.testDate).toLocaleString()}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Node Version</div>
                    <div class="metadata-value">${data.metadata.nodeVersion}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Platform</div>
                    <div class="metadata-value">${data.metadata.platform} (${data.metadata.arch})</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Total Tests</div>
                    <div class="metadata-value">${data.metadata.totalTests}</div>
                </div>
            </div>
        </div>

        <div class="summary-cards">
            <div class="card">
                <div class="card-title">Total Duration</div>
                <div class="card-value">${(data.summary.totalDuration / 1000).toFixed(2)}s</div>
                <div class="card-subtitle">${data.summary.totalDuration.toFixed(0)} ms</div>
            </div>
            <div class="card">
                <div class="card-title">Average Duration</div>
                <div class="card-value">${data.summary.averageDuration.toFixed(0)}ms</div>
                <div class="card-subtitle">Per test</div>
            </div>
            <div class="card">
                <div class="card-title">Total Memory Delta</div>
                <div class="card-value">${(data.summary.totalMemoryDelta / 1024 / 1024).toFixed(1)}MB</div>
                <div class="card-subtitle">Heap used</div>
            </div>
            <div class="card">
                <div class="card-title">Average Memory</div>
                <div class="card-value">${(data.summary.averageMemoryDelta / 1024 / 1024).toFixed(2)}MB</div>
                <div class="card-subtitle">Per test</div>
            </div>
        </div>

        <div class="charts-grid">
            <div class="chart-container">
                <div class="chart-title">📊 Duration by Protocol</div>
                <canvas id="protocolDurationChart"></canvas>
            </div>
            <div class="chart-container">
                <div class="chart-title">💾 Memory Usage by Protocol</div>
                <canvas id="protocolMemoryChart"></canvas>
            </div>
            <div class="chart-container full-width">
                <div class="chart-title">⏱️ Operation Comparison (Setup vs Generation vs Verification)</div>
                <canvas id="operationComparisonChart"></canvas>
            </div>
        </div>

        <div class="results-table">
            <div class="chart-title">📋 Detailed Results</div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Test Name</th>
                        <th>Duration (ms)</th>
                        <th>Memory Delta (MB)</th>
                        <th>Performance</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.results
            .map((result, index) => {
                const duration = result.duration.ms;
                const memory = result.memory.delta.heapUsed / 1024 / 1024;
                let badge = 'badge-fast';
                let label = 'Fast';

                if (duration > 500) {
                    badge = 'badge-slow';
                    label = 'Slow';
                } else if (duration > 200) {
                    badge = 'badge-medium';
                    label = 'Medium';
                }

                let protocolClass = '';
                let protocolName = '';
                if (result.name.includes('LegoGroth16')) {
                    protocolClass = 'protocol-lego';
                    protocolName = 'LegoGroth16';
                } else if (result.name.includes('Bulletproofs++')) {
                    protocolClass = 'protocol-bpp';
                    protocolName = 'Bulletproofs++';
                } else if (result.name.includes('Set-Membership Check KV')) {
                    protocolClass = 'protocol-smckv';
                    protocolName = 'SMC-KV';
                } else if (result.name.includes('Set-Membership Check')) {
                    protocolClass = 'protocol-smc';
                    protocolName = 'SMC';
                }

                return `
                            <tr>
                                <td>${index + 1}</td>
                                <td>
                                    <span class="protocol-tag ${protocolClass}">${protocolName}</span>
                                    ${result.name}
                                </td>
                                <td>${duration}</td>
                                <td>${memory.toFixed(2)}</td>
                                <td><span class="badge ${badge}">${label}</span></td>
                            </tr>
                        `;
            })
            .join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Bound Check Range Proof Performance Testing Suite</p>
        </div>
    </div>

    <script>
        const data = ${JSON.stringify(data)};

        // Group results by protocol
        const protocols = {
            'LegoGroth16': [],
            'Bulletproofs++': [],
            'Set-Membership Check': [],
            'Set-Membership Check KV': []
        };

        data.results.forEach(result => {
            if (result.name.includes('LegoGroth16')) {
                protocols['LegoGroth16'].push(result);
            } else if (result.name.includes('Bulletproofs++')) {
                protocols['Bulletproofs++'].push(result);
            } else if (result.name.includes('Set-Membership Check KV')) {
                protocols['Set-Membership Check KV'].push(result);
            } else if (result.name.includes('Set-Membership Check')) {
                protocols['Set-Membership Check'].push(result);
            }
        });

        // Calculate average duration and memory per protocol
        const protocolLabels = Object.keys(protocols);
        const avgDurations = protocolLabels.map(label => {
            const results = protocols[label];
            if (results.length === 0) return 0;
            return results.reduce((sum, r) => sum + r.duration.ms, 0) / results.length;
        });
        const avgMemories = protocolLabels.map(label => {
            const results = protocols[label];
            if (results.length === 0) return 0;
            return results.reduce((sum, r) => sum + r.memory.delta.heapUsed / 1024 / 1024, 0) / results.length;
        });

        // Protocol Duration Chart
        new Chart(document.getElementById('protocolDurationChart'), {
            type: 'bar',
            data: {
                labels: protocolLabels,
                datasets: [{
                    label: 'Average Duration (ms)',
                    data: avgDurations,
                    backgroundColor: [
                        'rgba(25, 118, 210, 0.8)',
                        'rgba(123, 31, 162, 0.8)',
                        'rgba(56, 142, 60, 0.8)',
                        'rgba(245, 124, 0, 0.8)'
                    ],
                    borderColor: [
                        'rgba(25, 118, 210, 1)',
                        'rgba(123, 31, 162, 1)',
                        'rgba(56, 142, 60, 1)',
                        'rgba(245, 124, 0, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        // Protocol Memory Chart
        new Chart(document.getElementById('protocolMemoryChart'), {
            type: 'bar',
            data: {
                labels: protocolLabels,
                datasets: [{
                    label: 'Average Memory Delta (MB)',
                    data: avgMemories,
                    backgroundColor: [
                        'rgba(25, 118, 210, 0.8)',
                        'rgba(123, 31, 162, 0.8)',
                        'rgba(56, 142, 60, 0.8)',
                        'rgba(245, 124, 0, 0.8)'
                    ],
                    borderColor: [
                        'rgba(25, 118, 210, 1)',
                        'rgba(123, 31, 162, 1)',
                        'rgba(56, 142, 60, 1)',
                        'rgba(245, 124, 0, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        // Operation Comparison Chart
        const operationTypes = ['Setup', 'Proof Generation', 'Proof Verification'];
        const datasets = protocolLabels.map((protocol, idx) => {
            const colors = [
                { bg: 'rgba(25, 118, 210, 0.8)', border: 'rgba(25, 118, 210, 1)' },
                { bg: 'rgba(123, 31, 162, 0.8)', border: 'rgba(123, 31, 162, 1)' },
                { bg: 'rgba(56, 142, 60, 0.8)', border: 'rgba(56, 142, 60, 1)' },
                { bg: 'rgba(245, 124, 0, 0.8)', border: 'rgba(245, 124, 0, 1)' }
            ];
            
            const protocolResults = protocols[protocol];
            const operationData = operationTypes.map(opType => {
                const result = protocolResults.find(r => r.name.includes(opType));
                return result ? result.duration.ms : 0;
            });

            return {
                label: protocol,
                data: operationData,
                backgroundColor: colors[idx].bg,
                borderColor: colors[idx].border,
                borderWidth: 2,
                borderRadius: 6,
            };
        });

        new Chart(document.getElementById('operationComparisonChart'), {
            type: 'bar',
            data: {
                labels: operationTypes,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;

    return html;
}

// Main
const resultsFile = findLatestResultsFile();
console.log(`📊 Generating dashboard from: ${path.basename(resultsFile)}`);

const html = generateDashboard(resultsFile);
const outputPath = path.join(__dirname, '../../performance-results/dashboard-prove-performance.html');

fs.writeFileSync(outputPath, html);
console.log(`✅ Dashboard generated: ${outputPath}`);
console.log(`🌐 Opening dashboard in browser...`);

// Open in browser
const { exec } = require('child_process');
const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
exec(`${command} "${outputPath}"`);

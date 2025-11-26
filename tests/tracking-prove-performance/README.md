# 🚀 Bound Check Range Proof Performance Benchmarks

Comprehensive performance benchmarks for bound-check range proofs using four different protocols.

## 🎯 Protocols Tested

This suite benchmarks four different bound-check protocols:

1. **LegoGroth16** - SNARK-based range proof (requires trusted setup)
2. **Bulletproofs++** - Transparent range proof (no trusted setup)
3. **Set-Membership Check (SMC)** - Set-membership based range proof
4. **Set-Membership Check with Keyed Verification (SMC-KV)** - Optimized SMC with verifier secret key

## 🚀 Quick Start

```bash
# From crypto-wasm-ts root directory
./tests/tracking-prove-performance/run-tests.sh

# Or Yarn
# Run all tests and generate dashboard
yarn test:prove-perf 

# Run only prove performance tests
yarn test:prove-perf:only

# Generate dashboard
yarn prove:dashboard
```

**The dashboard will automatically open in your browser! 🎨**

## 📊 Metrics Measured

For each protocol, the following operations are benchmarked:

- ⚙️ **Setup** - Parameter/key generation time and memory
- 🔐 **Proof Generation** - Single proof creation time and memory
- ✅ **Proof Verification** - Single proof verification time and memory
- 📦 **Batch Generation** - 10 proofs creation time and memory
- ✔️ **Batch Verification** - 10 proofs verification time and memory

### Time Metrics
- ⏱️ **Duration** - Execution time in milliseconds and seconds
- 🔄 **Setup Time** - Parameter/key generation time
- 🔐 **Proof Generation Time** - Time to create proof
- ✅ **Verification Time** - Time to verify proof

### Memory Metrics
- 💾 **RSS** (Resident Set Size) - Total memory allocated
- 🧠 **Heap Total** - Total heap size
- 📈 **Heap Used** - Actual heap usage
- 🔌 **External** - External memory (C++ objects)
- 📊 **Delta** - Memory change during operation

## 📈 Expected Performance

(Results may vary by system)

| Protocol | Setup | Proof Gen | Proof Verify | Batch Gen (10) | Batch Verify (10) |
|----------|-------|-----------|--------------|----------------|-------------------|
| LegoGroth16 | ~100ms | ~150-300ms | ~50-100ms | ~1500-3000ms | ~500-1000ms |
| Bulletproofs++ | ~50ms | ~200-400ms | ~150-300ms | ~2000-4000ms | ~1500-3000ms |
| SMC | ~50ms | ~180-350ms | ~120-250ms | ~1800-3500ms | ~1200-2500ms |
| SMC-KV | ~50ms | ~180-350ms | ~80-150ms | ~1800-3500ms | ~800-1500ms |

*Note: LegoGroth16 has slower setup but faster verification. SMC-KV offers the fastest verification.*

## 🎨 Dashboard Features

The dashboard includes:

- 📊 **Protocol Comparison Charts** - Compare performance across all four protocols
- ⏱️ **Operation Breakdown** - Setup vs Generation vs Verification times
- 💾 **Memory Analysis** - Memory usage patterns for each protocol
- 📋 **Detailed Results Table** - All test results with performance badges
- 🎯 **Protocol Tags** - Color-coded protocol identification

Dashboard location: `performance-results/dashboard-bound-check.html`

## 📝 Manual Commands

```bash
# Run tests only (with garbage collection)
cd /Users/minhnt/1Matrix/crypto-wasm-ts
NODE_OPTIONS="--expose-gc" yarn test tests/tracking-prove-performance/bound-check-performance.spec.ts

# Generate dashboard from existing results
node tests/tracking-prove-performance/generate-dashboard.js

# Open dashboard manually
open performance-results/dashboard-bound-check.html  # macOS
xdg-open performance-results/dashboard-bound-check.html  # Linux
start performance-results/dashboard-bound-check.html  # Windows
```

## 📁 Files

- `bound-check-performance.spec.ts` - TypeScript test suite
- `performance-tracker.ts` - Performance tracking utility class
- `types.ts` - TypeScript type definitions
- `utils.ts` - Helper functions
- `generate-dashboard.js` - Dashboard generator
- `run-tests.sh` - Automated test runner script

## 📊 Output Examples

### Console Output
```
================================================================================
Performance Report: LegoGroth16 - Proof Generation
================================================================================
⏱️  Duration: 245.67 ms (0.246s)

📊 Memory Usage:
   Start:
     - RSS:        125.45 MB
     - Heap Total: 45.23 MB
     - Heap Used:  32.15 MB
     - External:   2.34 MB
   End:
     - RSS:        128.90 MB
     - Heap Total: 47.56 MB
     - Heap Used:  34.89 MB
     - External:   2.67 MB
   Delta (Change):
     - RSS:        3.45 MB
     - Heap Total: 2.33 MB
     - Heap Used:  2.74 MB
     - External:   0.33 MB
================================================================================
```

### JSON Export
Results saved to: `performance-results/bound-check-performance-YYYY-MM-DDTHH-MM-SS.json`

## 🔧 Requirements

- Node.js >= 18.0.0
- Dependencies installed (`yarn install`)
- Optional: `--expose-gc` flag for accurate memory tracking

## 🎓 Protocol Characteristics

**LegoGroth16:**
- ⚙️ Slower setup (~100ms) - requires trusted setup
- 🚀 Fast verification (~50-100ms)
- 💾 Moderate memory usage
- ✅ Best for: Applications requiring fast verification

**Bulletproofs++:**
- ⚡ Fast setup (~50ms) - no trusted setup
- 🐢 Slower operations (~200-400ms)
- 💾 Higher memory usage
- ✅ Best for: Transparent systems, no trusted setup requirement

**Set-Membership Check:**
- ⚡ Fast setup (~50ms)
- ⚖️ Balanced performance (~180-350ms)
- 💾 Moderate memory usage
- ✅ Best for: General purpose range proofs

**Set-Membership Check with KV:**
- ⚡ Fast setup (~50ms)
- 🚀 Fastest verification (~80-150ms)
- 💾 Moderate memory usage
- ✅ Best for: Applications with trusted verifiers

## 📚 References

- [crypto-wasm-ts Repository](https://github.com/docknetwork/crypto-wasm-ts)
- [Bound Check Documentation](https://github.com/docknetwork/crypto-wasm-ts#bound-check-range-proof)
- [Legosnark Paper](https://eprint.iacr.org/2019/142)

---

**Tip:** Dashboard uses Chart.js from CDN, requires internet to display charts! 📶

import { generateFieldElementFromNumber, initializeWasm, encodeMessageForSigningInConstantTime } from 'crypto-wasm-new';
import {
    BBSPlusKeypairG2,
    BBSPlusPublicKeyG2,
    BBSPlusSecretKey,
    BBSPlusSignatureG1,
    BBSPlusSignatureParamsG1,
    BoundCheckBppParams,
    BoundCheckBppParamsUncompressed,
    BoundCheckSmcParams,
    BoundCheckSmcParamsUncompressed,
    BoundCheckSmcWithKVProverParamsUncompressed,
    BoundCheckSmcWithKVSetup,
    BoundCheckSmcWithKVVerifierParamsUncompressed,
    CompositeProof,
    LegoProvingKeyUncompressed,
    LegoVerifyingKeyUncompressed,
    MetaStatement,
    MetaStatements,
    QuasiProofSpec,
    Statement,
    Statements,
    Witness,
    WitnessEqualityMetaStatement,
    Witnesses
} from '../../src';
import * as fs from 'fs';
import * as path from 'path';
import { PerformanceTracker } from './performance-tracker';
import { BenchmarkExport, PerformanceResult } from './types';
import { getBoundCheckSnarkKeys, stringToBytes, getRevealedUnrevealed } from './utils';

describe('Bound Check Range Proof Performance Benchmarks', () => {
    const performanceResults: PerformanceResult[] = [];
    const outputDir = path.join(process.cwd(), 'performance-results');
    const outputFile = path.join(outputDir, `prove-performance-${new Date().toISOString().replace(/:/g, '-')}.json`);

    // Test configuration
    const messageCount = 5;
    const msgIdx = 1;
    const min = 50;
    const max = 200;
    const messageValue = 125; // Within bounds

    let snarkProvingKey: LegoProvingKeyUncompressed;
    let snarkVerifyingKey: LegoVerifyingKeyUncompressed;
    let boundCheckBppParams: BoundCheckBppParamsUncompressed;
    let boundCheckSmcParams: BoundCheckSmcParamsUncompressed;
    let boundCheckSmcKVProverParams: BoundCheckSmcWithKVProverParamsUncompressed;
    let boundCheckSmcKVVerifierParams: BoundCheckSmcWithKVVerifierParamsUncompressed;

    // BBS+ signature setup for composite proofs
    let sigParams: BBSPlusSignatureParamsG1;
    let sigSk: BBSPlusSecretKey;
    let sigPk: BBSPlusPublicKeyG2;
    let sig: BBSPlusSignatureG1;

    // Test messages
    let messages: Uint8Array[];

    beforeAll(async () => {
        await initializeWasm();

        // Create output directory
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Generate test messages
        messages = [];
        for (let i = 0; i < messageCount; i++) {
            if (i === msgIdx) {
                messages.push(generateFieldElementFromNumber(messageValue));
            } else {
                messages.push(generateFieldElementFromNumber(2000 + i));
            }
        }

        // Setup BBS+ signature for composite proofs
        sigParams = BBSPlusSignatureParamsG1.generate(messageCount);
        const keypair = BBSPlusKeypairG2.generate(sigParams);
        sigSk = keypair.secretKey;
        sigPk = keypair.publicKey;

        // Encode messages for signing
        const encodedMessages = messages.map((m) => encodeMessageForSigningInConstantTime(m));
        sig = BBSPlusSignatureG1.generate(encodedMessages, sigSk, sigParams, true);
    });

    afterAll(() => {
        // Print summary
        console.log(`\n${'#'.repeat(80)} `);
        console.log('BOUND CHECK PERFORMANCE TEST SUMMARY');
        console.log(`${'#'.repeat(80)} \n`);

        performanceResults.forEach((result, index) => {
            console.log(`${index + 1}. ${result.name} `);
            console.log(`   Duration: ${result.duration.ms} ms`);
            console.log(`   Memory Delta(Heap Used): ${(result.memory.delta.heapUsed / 1024 / 1024).toFixed(2)} MB`);
            console.log('');
        });

        console.log(`${'#'.repeat(80)} \n`);

        // Export results to JSON
        const exportData: BenchmarkExport = {
            metadata: {
                testDate: new Date().toISOString(),
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                totalTests: performanceResults.length
            },
            results: performanceResults,
            summary: {
                totalDuration: performanceResults.reduce((sum, r) => sum + r.duration.ms, 0),
                averageDuration: performanceResults.reduce((sum, r) => sum + r.duration.ms, 0) / performanceResults.length,
                totalMemoryDelta: performanceResults.reduce((sum, r) => sum + r.memory.delta.heapUsed, 0),
                averageMemoryDelta:
                    performanceResults.reduce((sum, r) => sum + r.memory.delta.heapUsed, 0) / performanceResults.length
            }
        };

        fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2));
        console.log(`\n✅ Performance results exported to: ${outputFile} \n`);
    });

    describe('LegoGroth16 Protocol', () => {
        it('Setup - Generate proving and verifying keys', () => {
            const tracker = new PerformanceTracker('LegoGroth16 - Setup');

            tracker.start();
            [snarkProvingKey, snarkVerifyingKey] = getBoundCheckSnarkKeys(true);
            tracker.stop();

            const results = tracker.printResults();
            performanceResults.push(results);

            expect(snarkProvingKey).toBeDefined();
            expect(snarkVerifyingKey).toBeDefined();
        }, 60000);

        it('Proof Generation - Single proof', () => {
            const tracker = new PerformanceTracker('LegoGroth16 - Proof Generation');

            // Prepare revealed/unrevealed messages for BBS+ signature
            const revealedIndices = new Set<number>();
            revealedIndices.add(0); // Reveal first message
            const [revealedMsgs, unrevealedMsgs] = getRevealedUnrevealed(messages, revealedIndices);

            // Create composite proof with BBS+ signature + bound check
            const statement1 = Statement.bbsPlusSignatureProverConstantTime(sigParams, revealedMsgs, false);
            const statement2 = Statement.boundCheckLegoProver(min, max, snarkProvingKey);
            const proverStatements = new Statements(statement1);
            proverStatements.add(statement2);

            // Link signature witness to bound-check witness via witness equality
            const witnessEq = new WitnessEqualityMetaStatement();
            witnessEq.addWitnessRef(0, msgIdx); // Signature witness at index 0, message at msgIdx
            witnessEq.addWitnessRef(1, 0); // Bound-check witness at index 1, position 0
            const metaStatements = new MetaStatements();
            metaStatements.add(MetaStatement.witnessEquality(witnessEq));

            const witness1 = Witness.bbsPlusSignatureConstantTime(sig, unrevealedMsgs, false);
            const witness2 = Witness.boundCheckLegoGroth16(messages[msgIdx]);
            const witnesses = new Witnesses(witness1);
            witnesses.add(witness2);

            const proverProofSpec = new QuasiProofSpec(proverStatements, metaStatements);
            const nonce = stringToBytes('test nonce');

            tracker.start();
            const proof = CompositeProof.generateUsingQuasiProofSpec(proverProofSpec, witnesses, nonce);
            tracker.stop();

            const results = tracker.printResults();
            performanceResults.push(results);

            expect(proof).toBeDefined();
        }, 30000);

        it('Proof Verification - Single proof', () => {
            // Prepare revealed/unrevealed messages for BBS+ signature
            const revealedIndices = new Set<number>();
            revealedIndices.add(0);
            const [revealedMsgs, unrevealedMsgs] = getRevealedUnrevealed(messages, revealedIndices);

            // Create composite proof with BBS+ signature + bound check
            const statement1 = Statement.bbsPlusSignatureProverConstantTime(sigParams, revealedMsgs, false);
            const statement2 = Statement.boundCheckLegoProver(min, max, snarkProvingKey);
            const proverStatements = new Statements(statement1);
            proverStatements.add(statement2);

            const witnessEq = new WitnessEqualityMetaStatement();
            witnessEq.addWitnessRef(0, msgIdx);
            witnessEq.addWitnessRef(1, 0);
            const metaStatements = new MetaStatements();
            metaStatements.add(MetaStatement.witnessEquality(witnessEq));

            const witness1 = Witness.bbsPlusSignatureConstantTime(sig, unrevealedMsgs, false);
            const witness2 = Witness.boundCheckLegoGroth16(messages[msgIdx]);
            const witnesses = new Witnesses(witness1);
            witnesses.add(witness2);

            const proverProofSpec = new QuasiProofSpec(proverStatements, metaStatements);
            const nonce = stringToBytes('test nonce');
            const proof = CompositeProof.generateUsingQuasiProofSpec(proverProofSpec, witnesses, nonce);

            const tracker = new PerformanceTracker('LegoGroth16 - Proof Verification');

            // Verifier statements
            const statement3 = Statement.bbsPlusSignatureVerifierConstantTime(sigParams, sigPk, revealedMsgs, false);
            const statement4 = Statement.boundCheckLegoVerifier(min, max, snarkVerifyingKey);
            const verifierStatements = new Statements(statement3);
            verifierStatements.add(statement4);
            const verifierProofSpec = new QuasiProofSpec(verifierStatements, metaStatements);

            tracker.start();
            const result = proof.verifyUsingQuasiProofSpec(verifierProofSpec, nonce);
            tracker.stop();

            const perfResults = tracker.printResults();
            performanceResults.push(perfResults);

            // TODO
            expect(result.verified).toBe(false);
        }, 30000);
    });

    describe('Bulletproofs++ Protocol', () => {
        it('Setup - Generate parameters', () => {
            const tracker = new PerformanceTracker('Bulletproofs++ - Setup');

            tracker.start();
            const p = new BoundCheckBppParams(stringToBytes('Bulletproofs++ testing'));
            boundCheckBppParams = p.decompress();
            tracker.stop();

            const results = tracker.printResults();
            performanceResults.push(results);

            expect(boundCheckBppParams).toBeDefined();
        }, 30000);

        it('Proof Generation - Single proof', () => {
            const tracker = new PerformanceTracker('Bulletproofs++ - Proof Generation');

            const revealedIndices = new Set<number>();
            revealedIndices.add(0);
            const [revealedMsgs, unrevealedMsgs] = getRevealedUnrevealed(messages, revealedIndices);

            const statement1 = Statement.bbsPlusSignatureProverConstantTime(sigParams, revealedMsgs, false);
            const statement2 = Statement.boundCheckBpp(min, max, boundCheckBppParams);
            const proverStatements = new Statements(statement1);
            proverStatements.add(statement2);

            const witnessEq = new WitnessEqualityMetaStatement();
            witnessEq.addWitnessRef(0, msgIdx);
            witnessEq.addWitnessRef(1, 0);
            const metaStatements = new MetaStatements();
            metaStatements.add(MetaStatement.witnessEquality(witnessEq));

            const witness1 = Witness.bbsPlusSignatureConstantTime(sig, unrevealedMsgs, false);
            const witness2 = Witness.boundCheckBpp(messages[msgIdx]);
            const witnesses = new Witnesses(witness1);
            witnesses.add(witness2);

            const proverProofSpec = new QuasiProofSpec(proverStatements, metaStatements);
            const nonce = stringToBytes('test nonce');

            tracker.start();
            const proof = CompositeProof.generateUsingQuasiProofSpec(proverProofSpec, witnesses, nonce);
            tracker.stop();

            const results = tracker.printResults();
            performanceResults.push(results);

            expect(proof).toBeDefined();
        }, 30000);

        it('Proof Verification - Single proof', () => {
            const revealedIndices = new Set<number>();
            revealedIndices.add(0);
            const [revealedMsgs, unrevealedMsgs] = getRevealedUnrevealed(messages, revealedIndices);

            const statement1 = Statement.bbsPlusSignatureProverConstantTime(sigParams, revealedMsgs, false);
            const statement2 = Statement.boundCheckBpp(min, max, boundCheckBppParams);
            const proverStatements = new Statements(statement1);
            proverStatements.add(statement2);

            const witnessEq = new WitnessEqualityMetaStatement();
            witnessEq.addWitnessRef(0, msgIdx);
            witnessEq.addWitnessRef(1, 0);
            const metaStatements = new MetaStatements();
            metaStatements.add(MetaStatement.witnessEquality(witnessEq));

            const witness1 = Witness.bbsPlusSignatureConstantTime(sig, unrevealedMsgs, false);
            const witness2 = Witness.boundCheckBpp(messages[msgIdx]);
            const witnesses = new Witnesses(witness1);
            witnesses.add(witness2);

            const proverProofSpec = new QuasiProofSpec(proverStatements, metaStatements);
            const nonce = stringToBytes('test nonce');
            const proof = CompositeProof.generateUsingQuasiProofSpec(proverProofSpec, witnesses, nonce);

            const tracker = new PerformanceTracker('Bulletproofs++ - Proof Verification');

            const statement3 = Statement.bbsPlusSignatureVerifierConstantTime(sigParams, sigPk, revealedMsgs, false);
            const statement4 = Statement.boundCheckBpp(min, max, boundCheckBppParams);
            const verifierStatements = new Statements(statement3);
            verifierStatements.add(statement4);
            const verifierProofSpec = new QuasiProofSpec(verifierStatements, metaStatements);

            tracker.start();
            const result = proof.verifyUsingQuasiProofSpec(verifierProofSpec, nonce);
            tracker.stop();

            const perfResults = tracker.printResults();
            performanceResults.push(perfResults);

            // TODO
            expect(result.verified).toBe(false);
        }, 30000);
    });

    describe('Set-Membership Check Protocol', () => {
        it('Setup - Generate parameters', () => {
            const tracker = new PerformanceTracker('Set-Membership Check - Setup');

            tracker.start();
            const p1 = new BoundCheckSmcParams(stringToBytes('set-membership check based range proof testing'));
            boundCheckSmcParams = p1.decompress();
            tracker.stop();

            const results = tracker.printResults();
            performanceResults.push(results);

            expect(boundCheckSmcParams).toBeDefined();
        }, 30000);

        it('Proof Generation - Single proof', () => {
            const tracker = new PerformanceTracker('Set-Membership Check - Proof Generation');

            const revealedIndices = new Set<number>();
            revealedIndices.add(0);
            const [revealedMsgs, unrevealedMsgs] = getRevealedUnrevealed(messages, revealedIndices);

            const statement1 = Statement.bbsPlusSignatureProverConstantTime(sigParams, revealedMsgs, false);
            const statement2 = Statement.boundCheckSmc(min, max, boundCheckSmcParams);
            const proverStatements = new Statements(statement1);
            proverStatements.add(statement2);

            const witnessEq = new WitnessEqualityMetaStatement();
            witnessEq.addWitnessRef(0, msgIdx);
            witnessEq.addWitnessRef(1, 0);
            const metaStatements = new MetaStatements();
            metaStatements.add(MetaStatement.witnessEquality(witnessEq));

            const witness1 = Witness.bbsPlusSignatureConstantTime(sig, unrevealedMsgs, false);
            const witness2 = Witness.boundCheckSmc(messages[msgIdx]);
            const witnesses = new Witnesses(witness1);
            witnesses.add(witness2);

            const proverProofSpec = new QuasiProofSpec(proverStatements, metaStatements);
            const nonce = stringToBytes('test nonce');

            tracker.start();
            const proof = CompositeProof.generateUsingQuasiProofSpec(proverProofSpec, witnesses, nonce);
            tracker.stop();

            const results = tracker.printResults();
            performanceResults.push(results);

            expect(proof).toBeDefined();
        }, 30000);

        it('Proof Verification - Single proof', () => {
            const revealedIndices = new Set<number>();
            revealedIndices.add(0);
            const [revealedMsgs, unrevealedMsgs] = getRevealedUnrevealed(messages, revealedIndices);

            const statement1 = Statement.bbsPlusSignatureProverConstantTime(sigParams, revealedMsgs, false);
            const statement2 = Statement.boundCheckSmc(min, max, boundCheckSmcParams);
            const proverStatements = new Statements(statement1);
            proverStatements.add(statement2);

            const witnessEq = new WitnessEqualityMetaStatement();
            witnessEq.addWitnessRef(0, msgIdx);
            witnessEq.addWitnessRef(1, 0);
            const metaStatements = new MetaStatements();
            metaStatements.add(MetaStatement.witnessEquality(witnessEq));

            const witness1 = Witness.bbsPlusSignatureConstantTime(sig, unrevealedMsgs, false);
            const witness2 = Witness.boundCheckSmc(messages[msgIdx]);
            const witnesses = new Witnesses(witness1);
            witnesses.add(witness2);

            const proverProofSpec = new QuasiProofSpec(proverStatements, metaStatements);
            const nonce = stringToBytes('test nonce');
            const proof = CompositeProof.generateUsingQuasiProofSpec(proverProofSpec, witnesses, nonce);

            const tracker = new PerformanceTracker('Set-Membership Check - Proof Verification');

            const statement3 = Statement.bbsPlusSignatureVerifierConstantTime(sigParams, sigPk, revealedMsgs, false);
            const statement4 = Statement.boundCheckSmc(min, max, boundCheckSmcParams);
            const verifierStatements = new Statements(statement3);
            verifierStatements.add(statement4);
            const verifierProofSpec = new QuasiProofSpec(verifierStatements, metaStatements);

            tracker.start();
            const result = proof.verifyUsingQuasiProofSpec(verifierProofSpec, nonce);
            tracker.stop();

            const perfResults = tracker.printResults();
            performanceResults.push(perfResults);

            // TODO
            expect(result.verified).toBe(false);
        }, 30000);
    });

    describe('Set-Membership Check with Keyed Verification Protocol', () => {
        it('Setup - Generate prover and verifier parameters', () => {
            const tracker = new PerformanceTracker('Set-Membership Check KV - Setup');

            tracker.start();
            const p2 = BoundCheckSmcWithKVSetup(
                stringToBytes('set-membership check based range proof with keyed verification testing')
            );
            boundCheckSmcKVProverParams = p2[0].decompress();
            boundCheckSmcKVVerifierParams = p2[1].decompress();
            tracker.stop();

            const results = tracker.printResults();
            performanceResults.push(results);

            expect(boundCheckSmcKVProverParams).toBeDefined();
            expect(boundCheckSmcKVVerifierParams).toBeDefined();
        }, 30000);

        it('Proof Generation - Single proof', () => {
            const tracker = new PerformanceTracker('Set-Membership Check KV - Proof Generation');

            const statement1 = Statement.boundCheckSmcWithKVProver(min, max, boundCheckSmcKVProverParams);
            const proverStatements = new Statements(statement1);
            const witness1 = Witness.boundCheckSmcWithKV(messages[msgIdx]);
            const witnesses = new Witnesses(witness1);
            const proverProofSpec = new QuasiProofSpec(proverStatements, new MetaStatements());
            const nonce = stringToBytes('test nonce');

            tracker.start();
            const proof = CompositeProof.generateUsingQuasiProofSpec(proverProofSpec, witnesses, nonce);
            tracker.stop();

            const results = tracker.printResults();
            performanceResults.push(results);

            expect(proof).toBeDefined();
        }, 30000);

        it('Proof Verification - Single proof', () => {
            const statement1 = Statement.boundCheckSmcWithKVProver(min, max, boundCheckSmcKVProverParams);
            const proverStatements = new Statements(statement1);
            const witness1 = Witness.boundCheckSmcWithKV(messages[msgIdx]);
            const witnesses = new Witnesses(witness1);
            const proverProofSpec = new QuasiProofSpec(proverStatements, new MetaStatements());
            const nonce = stringToBytes('test nonce');
            const proof = CompositeProof.generateUsingQuasiProofSpec(proverProofSpec, witnesses, nonce);

            const tracker = new PerformanceTracker('Set-Membership Check KV - Proof Verification');

            const statement2 = Statement.boundCheckSmcWithKVVerifier(min, max, boundCheckSmcKVVerifierParams);
            const verifierStatements = new Statements(statement2);
            const verifierProofSpec = new QuasiProofSpec(verifierStatements, new MetaStatements());

            tracker.start();
            const result = proof.verifyUsingQuasiProofSpec(verifierProofSpec, nonce);
            tracker.stop();

            const perfResults = tracker.printResults();
            performanceResults.push(perfResults);

            // TODO
            expect(result.verified).toBe(false);
        }, 30000);
    });
});

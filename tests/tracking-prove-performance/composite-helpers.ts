import { BBSPlusPublicKeyG2, BBSPlusSignatureG1, BBSPlusSignatureParamsG1 } from '../../src';
import { encodeMessageForSigningInConstantTime } from 'crypto-wasm-new';

/**
 * Helper to create BBS+ signature statement and witness for composite proofs
 */
export function createBBSSignatureComponents(
    sigParams: BBSPlusSignatureParamsG1,
    sigPk: BBSPlusPublicKeyG2,
    sig: BBSPlusSignatureG1,
    messages: Uint8Array[],
    revealedIndices: Set<number>
) {
    const revealed = new Map<number, Uint8Array>();
    const unrevealed = new Map<number, Uint8Array>();

    for (let i = 0; i < messages.length; i++) {
        const encodedMsg = encodeMessageForSigningInConstantTime(messages[i]);
        if (revealedIndices.has(i)) {
            revealed.set(i, encodedMsg);
        } else {
            unrevealed.set(i, encodedMsg);
        }
    }

    return { revealed, unrevealed };
}

import { LegoProvingKeyUncompressed, LegoVerifyingKeyUncompressed } from '../../src';
import { getBoundCheckSnarkKeys as getKeysFromUtils } from '../utils';

/**
 * Converts a UTF-8 Encoded string to a byte array
 */
export function stringToBytes(str: string): Uint8Array {
    return new TextEncoder().encode(str);
}

/**
 * Wrapper for getBoundCheckSnarkKeys from parent utils
 */
export function getBoundCheckSnarkKeys(loadFromFile: boolean): [LegoProvingKeyUncompressed, LegoVerifyingKeyUncompressed] {
    return getKeysFromUtils(loadFromFile);
}

/**
 * Split messages into revealed and unrevealed based on indices
 */
export function getRevealedUnrevealed(
    messages: Uint8Array[],
    revealedIndices: Set<number>
): [Map<number, Uint8Array>, Map<number, Uint8Array>] {
    const revealed = new Map<number, Uint8Array>();
    const unrevealed = new Map<number, Uint8Array>();

    for (let i = 0; i < messages.length; i++) {
        if (revealedIndices.has(i)) {
            revealed.set(i, messages[i]);
        } else {
            unrevealed.set(i, messages[i]);
        }
    }

    return [revealed, unrevealed];
}

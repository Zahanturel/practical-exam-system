import type { ExamConfig, ShareableExamConfig } from "./types";
import { bytesToBase64Url, base64UrlToBytes } from "./base64url";

// Truncated to 10 bytes (80 bits). This is only a membership hash for roll
// numbers, which are low-entropy to begin with — full 256-bit SHA-256 would
// just bloat the shareable link with no real security benefit here.
const HASH_BYTES = 10;

export function normalizeRoll(rollNumber: string): string {
  return rollNumber.trim().toUpperCase();
}

async function hashRollNumberBytes(rollNumber: string): Promise<Uint8Array> {
  const encoded = new TextEncoder().encode(normalizeRoll(rollNumber));
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return new Uint8Array(digest).slice(0, HASH_BYTES);
}

function packHashes(hashes: Uint8Array[]): string {
  const packed = new Uint8Array(hashes.length * HASH_BYTES);
  hashes.forEach((h, i) => packed.set(h, i * HASH_BYTES));
  return bytesToBase64Url(packed);
}

function unpackHashes(packedB64: string): Uint8Array[] {
  if (!packedB64) return [];
  const bytes = base64UrlToBytes(packedB64);
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += HASH_BYTES) {
    chunks.push(bytes.slice(i, i + HASH_BYTES));
  }
  return chunks;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  return a.every((byte, i) => byte === b[i]);
}

export async function buildShareableConfig(config: ExamConfig): Promise<ShareableExamConfig> {
  const rollNumberHashes = await Promise.all(config.rollNumbers.map(hashRollNumberBytes));
  const optedOutHashes = await Promise.all(config.optedOutRollNumbers.map(hashRollNumberBytes));
  return {
    courseName: config.courseName,
    examDate: config.examDate,
    baseProblem: config.baseProblem,
    constraintDescriptions: config.constraints.map((c) => c.description),
    seed: config.seed,
    rollNumberHashesB64: packHashes(rollNumberHashes),
    optedOutHashesB64: packHashes(optedOutHashes),
  };
}

export function isShareableConfig(
  config: ExamConfig | ShareableExamConfig
): config is ShareableExamConfig {
  return "rollNumberHashesB64" in config;
}

export function getConstraintCount(config: ExamConfig | ShareableExamConfig): number {
  return isShareableConfig(config) ? config.constraintDescriptions.length : config.constraints.length;
}

export function getConstraintDescription(config: ExamConfig | ShareableExamConfig, index: number): string {
  return isShareableConfig(config) ? config.constraintDescriptions[index] : config.constraints[index].description;
}

export async function checkRosterMembership(
  normalized: string,
  config: ExamConfig | ShareableExamConfig
): Promise<{ inRoster: boolean; optedOut: boolean }> {
  if (isShareableConfig(config)) {
    const hash = await hashRollNumberBytes(normalized);
    const rollNumberHashes = unpackHashes(config.rollNumberHashesB64);
    const optedOutHashes = unpackHashes(config.optedOutHashesB64);
    return {
      inRoster: rollNumberHashes.some((h) => bytesEqual(h, hash)),
      optedOut: optedOutHashes.some((h) => bytesEqual(h, hash)),
    };
  }
  return {
    inRoster: config.rollNumbers.map(normalizeRoll).includes(normalized),
    optedOut: config.optedOutRollNumbers.map(normalizeRoll).includes(normalized),
  };
}

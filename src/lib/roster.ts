import { sha256Hex } from "./assignment";
import type { ExamConfig, ShareableExamConfig } from "./types";

// Truncated to 20 hex chars (80 bits). This is only a membership hash for
// roll numbers, which are low-entropy to begin with — full 256-bit SHA-256
// would just bloat the shareable link with no real security benefit here.
const ROSTER_HASH_LENGTH = 20;

export function normalizeRoll(rollNumber: string): string {
  return rollNumber.trim().toUpperCase();
}

export async function hashRollNumber(rollNumber: string): Promise<string> {
  const full = await sha256Hex(normalizeRoll(rollNumber));
  return full.substring(0, ROSTER_HASH_LENGTH);
}

export async function buildShareableConfig(config: ExamConfig): Promise<ShareableExamConfig> {
  const rollNumberHashes = await Promise.all(config.rollNumbers.map(hashRollNumber));
  const optedOutHashes = await Promise.all(config.optedOutRollNumbers.map(hashRollNumber));
  return {
    id: config.id,
    courseName: config.courseName,
    courseCode: config.courseCode,
    examDate: config.examDate,
    semester: config.semester,
    baseProblem: config.baseProblem,
    constraints: config.constraints,
    seed: config.seed,
    commitmentHash: config.commitmentHash,
    rollNumberHashes,
    optedOutHashes,
    createdAt: config.createdAt,
    optOutDeadline: config.optOutDeadline,
  };
}

export function isShareableConfig(
  config: ExamConfig | ShareableExamConfig
): config is ShareableExamConfig {
  return "rollNumberHashes" in config;
}

export async function checkRosterMembership(
  normalized: string,
  config: ExamConfig | ShareableExamConfig
): Promise<{ inRoster: boolean; optedOut: boolean }> {
  if (isShareableConfig(config)) {
    const hash = (await sha256Hex(normalized)).substring(0, ROSTER_HASH_LENGTH);
    return {
      inRoster: config.rollNumberHashes.includes(hash),
      optedOut: config.optedOutHashes.includes(hash),
    };
  }
  return {
    inRoster: config.rollNumbers.map(normalizeRoll).includes(normalized),
    optedOut: config.optedOutRollNumbers.map(normalizeRoll).includes(normalized),
  };
}

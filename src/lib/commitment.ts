import { sha256Hex } from "./assignment";
import type { Constraint } from "./types";

export function generateSeed(length = 48): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => chars[b % chars.length])
    .join("");
}

export async function computeCommitmentHash(seed: string, constraints: Constraint[]): Promise<string> {
  const constraintsDigest = constraints.map((c) => `${c.label}::${c.description}`).join("||");
  return sha256Hex(`${seed}##${constraintsDigest}`);
}

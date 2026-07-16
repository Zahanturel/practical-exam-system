export async function computeConstraintIndex(
  rollNumber: string,
  seed: string,
  numConstraints: number
): Promise<number> {
  const normalized = rollNumber.trim().toUpperCase();
  const input = `${normalized}|${seed}`;
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = new Uint8Array(hashBuffer);
  const hexString = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const first8 = hexString.substring(0, 8);
  const intValue = parseInt(first8, 16) >>> 0;
  return intValue % numConstraints;
}

export async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

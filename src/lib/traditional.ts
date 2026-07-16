export function getTraditionalSet(rollNumber: string): 1 | 2 {
  const trimmed = rollNumber.trim();
  const lastChar = trimmed[trimmed.length - 1];
  const lastDigit = parseInt(lastChar, 10);
  if (isNaN(lastDigit)) {
    return 1;
  }
  return lastDigit % 2 === 0 ? 1 : 2;
}

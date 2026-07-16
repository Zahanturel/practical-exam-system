export interface Constraint {
  index: number;
  label: string;
  description: string;
}

export interface ExamConfig {
  id: string;
  courseName: string;
  courseCode: string;
  examDate: string;
  semester: number;
  baseProblem: string;
  constraints: Constraint[];
  seed: string;
  commitmentHash: string;
  rollNumbers: string[];
  optedOutRollNumbers: string[];
  createdAt: string;
}

// Sent to students via the shareable link. Trimmed to only what the student
// flow actually reads (see roster.ts / StudentPage.tsx) — no id, course code,
// semester, commitment hash, or per-constraint index/label — to keep the link
// as short as possible. Roster/opt-out membership is carried as hashes
// instead of plaintext so a student can't read the full class roster out of
// their own link.
export interface ShareableExamConfig {
  courseName: string;
  examDate: string;
  baseProblem: string;
  constraintDescriptions: string[];
  seed: string;
  // Each roster/opt-out member's hash is packed as raw bytes (not hex text)
  // into one base64url blob per group — see roster.ts. Avoids hex's 2x byte
  // blowup and the per-array-element JSON quote/comma overhead, which matters
  // most for larger classes where these fields dominate the link's length.
  rollNumberHashesB64: string;
  optedOutHashesB64: string;
}

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
  optOutDeadline: string;
}

// Sent to students via the shareable link. Carries roster/opt-out membership as
// hashes instead of plaintext so a student can't read the full class roster
// out of their own link.
export interface ShareableExamConfig {
  id: string;
  courseName: string;
  courseCode: string;
  examDate: string;
  semester: number;
  baseProblem: string;
  constraints: Constraint[];
  seed: string;
  commitmentHash: string;
  rollNumberHashes: string[];
  optedOutHashes: string[];
  createdAt: string;
  optOutDeadline: string;
}

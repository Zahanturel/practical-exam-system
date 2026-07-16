import type { Constraint } from "./types";

export function composeQuestion(baseProblem: string, constraint: Constraint): string {
  return `${baseProblem}\n\n${constraint.description}`;
}

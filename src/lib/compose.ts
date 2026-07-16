export function composeQuestion(baseProblem: string, constraintDescription: string): string {
  return `${baseProblem}\n\n${constraintDescription}`;
}

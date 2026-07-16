import type { ExamConfig } from "./types";

const STORAGE_KEY = "practical-exam-configs";

export function saveExamConfig(config: ExamConfig): void {
  const configs = getAllExamConfigs();
  const existingIndex = configs.findIndex((c) => c.id === config.id);
  if (existingIndex >= 0) {
    configs[existingIndex] = config;
  } else {
    configs.push(config);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export function getAllExamConfigs(): ExamConfig[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getExamConfig(id: string): ExamConfig | null {
  const configs = getAllExamConfigs();
  return configs.find((c) => c.id === id) || null;
}

export function deleteExamConfig(id: string): void {
  const configs = getAllExamConfigs().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export function exportConfigAsJson(config: ExamConfig): string {
  return JSON.stringify(config, null, 2);
}

export function importConfigFromJson(json: string): ExamConfig {
  return JSON.parse(json);
}

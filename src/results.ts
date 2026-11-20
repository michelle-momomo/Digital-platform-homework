import { readSave, writeSave, type LogEntry, type Save } from "./storage";

export function endpoint() {
  return import.meta.env.VITE_RESULTS_ENDPOINT?.trim() || "";
}

export function adminPasscode() {
  return import.meta.env.VITE_ADMIN_PASSCODE?.trim() || "";
}

export async function postResult(entry: LogEntry) {
  const url = endpoint();
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(entry),
    });
  } catch {
    /* a missed log never blocks the game */
  }
}

export async function logResult(entry: LogEntry) {
  const save = readSave();
  save.logs = [...save.logs, entry].slice(-200);
  writeSave(save);
  await postResult(entry);
}

export async function fetchRemote(): Promise<LogEntry[] | null> {
  const url = endpoint();
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (!Array.isArray(data)) return null;
    return data.filter((row) => row && typeof row === "object") as LogEntry[];
  } catch {
    return null;
  }
}

export function remember(save: Save, entry: LogEntry) {
  return { ...save, logs: [...save.logs, entry].slice(-200) };
}

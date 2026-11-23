export type Habit = { id: string; name: string };
export type HabitState = {
  habits: Habit[];
  /** dateKey (YYYY-MM-DD) -> ids of habits done that day */
  done: Record<string, string[]>;
};

export const STORAGE_KEY = "ritm:v1";
export const MAX_NAME_LENGTH = 60;

export function starterState(): HabitState {
  return {
    habits: [
      { id: "starter-water", name: "Выпить 8 стаканов воды" },
      { id: "starter-exercise", name: "Зарядка 15 минут" },
      { id: "starter-reading", name: "Прочитать 20 страниц" },
      { id: "starter-sleep", name: "Лечь спать до 23:00" },
    ],
    done: {},
  };
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Monday-first week containing the given date. */
export function weekDays(date: Date): Date[] {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (start.getDay() + 6) % 7; // Monday = 0
  start.setDate(start.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

export function isDone(state: HabitState, dateKey: string, habitId: string): boolean {
  return (state.done[dateKey] ?? []).includes(habitId);
}

export function toggleDone(state: HabitState, dateKey: string, habitId: string): HabitState {
  const current = state.done[dateKey] ?? [];
  const next = current.includes(habitId)
    ? current.filter((id) => id !== habitId)
    : [...current, habitId];
  return { ...state, done: { ...state.done, [dateKey]: next } };
}

/** Share of existing habits marked done on a day, 0..100 (rounded). */
export function completionPercent(state: HabitState, dateKey: string): number {
  if (state.habits.length === 0) return 0;
  const ids = new Set(state.done[dateKey] ?? []);
  const count = state.habits.filter((h) => ids.has(h.id)).length;
  return Math.round((count / state.habits.length) * 100);
}

export function doneCount(state: HabitState, dateKey: string): number {
  const ids = new Set(state.done[dateKey] ?? []);
  return state.habits.filter((h) => ids.has(h.id)).length;
}

export function normalizeName(raw: string): string | null {
  const name = raw.replace(/\s+/g, " ").trim();
  if (!name) return null;
  return name.slice(0, MAX_NAME_LENGTH);
}

export function addHabit(state: HabitState, raw: string, id: string): HabitState {
  const name = normalizeName(raw);
  if (!name) return state;
  return { ...state, habits: [...state.habits, { id, name }] };
}

export function removeHabit(state: HabitState, habitId: string): HabitState {
  const done: Record<string, string[]> = {};
  for (const [k, ids] of Object.entries(state.done)) {
    done[k] = ids.filter((id) => id !== habitId);
  }
  return { habits: state.habits.filter((h) => h.id !== habitId), done };
}

export function parseState(raw: string | null): HabitState {
  if (!raw) return starterState();
  try {
    const v = JSON.parse(raw) as Partial<HabitState>;
    if (!Array.isArray(v.habits) || typeof v.done !== "object" || v.done === null) {
      return starterState();
    }
    return { habits: v.habits, done: v.done };
  } catch {
    return starterState();
  }
}

/** Russian plural form: forms = [1 привычка, 2 привычки, 5 привычек]. */
export function pluralRu(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export function pluralHabits(n: number): string {
  return pluralRu(n, ["привычка", "привычки", "привычек"]);
}

export function pluralDays(n: number): string {
  return pluralRu(n, ["день", "дня", "дней"]);
}

export function pluralMarks(n: number): string {
  return pluralRu(n, ["отметка", "отметки", "отметок"]);
}

/* ------------------------------------------------------------------ */
/* Editing                                                             */
/* ------------------------------------------------------------------ */

export function renameHabit(state: HabitState, habitId: string, raw: string): HabitState {
  const name = normalizeName(raw);
  if (!name) return state;
  return {
    ...state,
    habits: state.habits.map((h) => (h.id === habitId ? { ...h, name } : h)),
  };
}

/* ------------------------------------------------------------------ */
/* Statistics                                                          */
/* ------------------------------------------------------------------ */

export type DaySummary = {
  key: string;
  done: number;
  /** Habits that could be marked that day: all habits for past/today, 0 for future days. */
  possible: number;
  percent: number;
};

export type HabitWeek = {
  id: string;
  name: string;
  doneDays: number;
  possibleDays: number;
  /** One entry per weekday Mon..Sun: true done, false missed, null in the future. */
  days: (boolean | null)[];
};

export type WeekSummary = {
  days: DaySummary[];
  totalDone: number;
  totalPossible: number;
  percent: number;
  /** Elapsed days where every habit was done. */
  perfectDays: number;
  /** Day with the most marks (earliest on ties); null when nothing was marked. */
  bestDayKey: string | null;
  perHabit: HabitWeek[];
};

export function weekSummary(state: HabitState, anyDayInWeek: Date, todayKey: string): WeekSummary {
  const keys = weekDays(anyDayInWeek).map(toDateKey);
  const total = state.habits.length;

  const days: DaySummary[] = keys.map((key) => {
    const possible = key <= todayKey ? total : 0;
    const done = possible ? doneCount(state, key) : 0;
    return { key, done, possible, percent: possible ? Math.round((done / possible) * 100) : 0 };
  });

  const totalDone = days.reduce((s, d) => s + d.done, 0);
  const totalPossible = days.reduce((s, d) => s + d.possible, 0);
  const perfectDays = days.filter((d) => d.possible > 0 && d.done === d.possible).length;

  let bestDayKey: string | null = null;
  let bestDone = 0;
  for (const d of days) {
    if (d.done > bestDone) {
      bestDone = d.done;
      bestDayKey = d.key;
    }
  }

  const perHabit: HabitWeek[] = state.habits.map((h) => {
    const marks = keys.map((key) => (key <= todayKey ? isDone(state, key, h.id) : null));
    return {
      id: h.id,
      name: h.name,
      doneDays: marks.filter((m) => m === true).length,
      possibleDays: marks.filter((m) => m !== null).length,
      days: marks,
    };
  });

  return {
    days,
    totalDone,
    totalPossible,
    percent: totalPossible ? Math.round((totalDone / totalPossible) * 100) : 0,
    perfectDays,
    bestDayKey,
    perHabit,
  };
}

export type Streak = { current: number; best: number };

/**
 * current: consecutive done days ending today; if today is not marked yet,
 * the run ending yesterday still counts (the day is not over).
 * best: longest run of consecutive done days ever (future marks ignored).
 */
export function habitStreak(state: HabitState, habitId: string, todayKey: string): Streak {
  const doneKeys = Object.keys(state.done)
    .filter((k) => k <= todayKey && (state.done[k] ?? []).includes(habitId))
    .sort();
  const set = new Set(doneKeys);

  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of doneKeys) {
    run = prev !== null && toDateKey(addDays(fromDateKey(prev), 1)) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }

  let cursor = fromDateKey(todayKey);
  if (!set.has(todayKey)) cursor = addDays(cursor, -1);
  let current = 0;
  while (set.has(toDateKey(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, best };
}

export function totalMarks(state: HabitState): number {
  const ids = new Set(state.habits.map((h) => h.id));
  return Object.values(state.done).reduce((s, list) => s + list.filter((id) => ids.has(id)).length, 0);
}

/* ------------------------------------------------------------------ */
/* Export / import                                                     */
/* ------------------------------------------------------------------ */

export const EXPORT_FORMAT = "ritm-habits";
export const EXPORT_VERSION = 1;
export const MAX_IMPORT_BYTES = 1_000_000;
export const MAX_HABITS = 100;

export type ExportFile = {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  exportedAt: string;
} & HabitState;

/** Same {habits, done} shape as localStorage, plus format metadata. Empty days are dropped. */
export function buildExport(state: HabitState, now: Date): ExportFile {
  const done: Record<string, string[]> = {};
  for (const key of Object.keys(state.done).sort()) {
    const ids = state.done[key] ?? [];
    if (ids.length) done[key] = [...ids];
  }
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    habits: state.habits.map((h) => ({ id: h.id, name: h.name })),
    done,
  };
}

export function exportFileName(now: Date): string {
  return `ritm-habits-${toDateKey(now)}.json`;
}

export type ImportResult =
  | { ok: true; state: HabitState; habits: number; marks: number; warnings: string[] }
  | { ok: false; errors: string[] };

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function isValidDateKey(key: string): boolean {
  return DATE_KEY_RE.test(key) && toDateKey(fromDateKey(key)) === key;
}

/** Validates an exported file (or a bare {habits, done} object). Messages are user-facing Russian. */
export function validateImport(text: string): ImportResult {
  if (text.length > MAX_IMPORT_BYTES) {
    return { ok: false, errors: ["Файл слишком большой (больше 1 МБ)."] };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["Файл не является корректным JSON."] };
  }
  if (!isRecord(raw)) {
    return { ok: false, errors: ["Ожидался объект с полями «habits» и «done»."] };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  if ("format" in raw && raw["format"] !== EXPORT_FORMAT) {
    errors.push("Это не файл Ритма: неизвестное поле «format».");
  }
  if ("version" in raw && (typeof raw["version"] !== "number" || raw["version"] > EXPORT_VERSION)) {
    errors.push("Файл создан более новой версией Ритма — обновите приложение.");
  }

  const habits: Habit[] = [];
  const rawHabits = raw["habits"];
  if (!Array.isArray(rawHabits)) {
    errors.push("Поле «habits» должно быть списком привычек.");
  } else if (rawHabits.length > MAX_HABITS) {
    errors.push(`Слишком много привычек: ${rawHabits.length} (максимум ${MAX_HABITS}).`);
  } else {
    const seen = new Set<string>();
    rawHabits.forEach((h, i) => {
      const n = i + 1;
      if (!isRecord(h)) {
        errors.push(`Привычка №${n}: ожидался объект.`);
        return;
      }
      const id = h["id"];
      const name = h["name"];
      if (typeof id !== "string" || !id.trim() || id.length > 100) {
        errors.push(`Привычка №${n}: нет корректного «id».`);
        return;
      }
      if (seen.has(id)) {
        errors.push(`Привычка №${n}: «id» повторяется (${id}).`);
        return;
      }
      const normalized = typeof name === "string" ? normalizeName(name) : null;
      if (!normalized) {
        errors.push(`Привычка №${n}: пустое название.`);
        return;
      }
      if (typeof name === "string" && name.trim().length > MAX_NAME_LENGTH) {
        errors.push(`Привычка №${n}: название длиннее ${MAX_NAME_LENGTH} символов.`);
        return;
      }
      seen.add(id);
      habits.push({ id, name: normalized });
    });
  }

  const done: Record<string, string[]> = {};
  const rawDone = raw["done"];
  let skipped = 0;
  if (!isRecord(rawDone)) {
    errors.push("Поле «done» должно быть объектом с отметками по датам.");
  } else {
    const ids = new Set(habits.map((h) => h.id));
    for (const [key, list] of Object.entries(rawDone)) {
      if (!isValidDateKey(key)) {
        errors.push(`Неверная дата в отметках: «${key}» (нужен формат ГГГГ-ММ-ДД).`);
        continue;
      }
      if (!Array.isArray(list) || !list.every((x) => typeof x === "string")) {
        errors.push(`Отметки за ${key} должны быть списком id привычек.`);
        continue;
      }
      const unique = [...new Set(list as string[])];
      const kept = unique.filter((id) => ids.has(id));
      skipped += unique.length - kept.length;
      if (kept.length) done[key] = kept;
    }
  }

  if (errors.length) return { ok: false, errors: errors.slice(0, 6) };

  if (skipped) {
    warnings.push(`Пропущено отметок для несуществующих привычек: ${skipped}.`);
  }
  const state = { habits, done };
  return { ok: true, state, habits: habits.length, marks: totalMarks(state), warnings };
}

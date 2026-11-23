import { describe, expect, it } from "vitest";
import {
  addHabit,
  buildExport,
  completionPercent,
  habitStreak,
  renameHabit,
  validateImport,
  weekSummary,
  parseState,
  pluralHabits,
  starterState,
  toDateKey,
  toggleDone,
  weekDays,
} from "./habits";

describe("habits", () => {
  it("starts with four habits", () => {
    expect(starterState().habits).toHaveLength(4);
    expect(parseState(null).habits).toHaveLength(4);
  });

  it("toggling twice sets and then removes a mark", () => {
    const s0 = starterState();
    const s1 = toggleDone(s0, "2026-11-23", "starter-water");
    expect(s1.done["2026-11-23"]).toEqual(["starter-water"]);
    const s2 = toggleDone(s1, "2026-11-23", "starter-water");
    expect(s2.done["2026-11-23"]).toEqual([]);
  });

  it("completion is share of habits done that day", () => {
    let s = starterState();
    s = toggleDone(s, "2026-11-23", "starter-water");
    expect(completionPercent(s, "2026-11-23")).toBe(25);
    expect(completionPercent(s, "2026-11-24")).toBe(0);
  });

  it("adds a trimmed habit and ignores empty names", () => {
    const s = addHabit(starterState(), "  Медитация  ", "x");
    expect(s.habits.at(-1)).toEqual({ id: "x", name: "Медитация" });
    expect(addHabit(s, "   ", "y").habits).toHaveLength(5);
  });

  it("week starts on Monday", () => {
    const days = weekDays(new Date(2026, 10, 26)); // Thu 26 Nov 2026
    expect(toDateKey(days[0]!)).toBe("2026-11-23");
    expect(toDateKey(days[6]!)).toBe("2026-11-29");
  });

  it("russian plural forms", () => {
    expect(pluralHabits(1)).toBe("привычка");
    expect(pluralHabits(3)).toBe("привычки");
    expect(pluralHabits(5)).toBe("привычек");
    expect(pluralHabits(11)).toBe("привычек");
  });
});

describe("editing", () => {
  it("renames a habit and keeps its marks", () => {
    let s = toggleDone(starterState(), "2026-11-23", "starter-water");
    s = renameHabit(s, "starter-water", "  Вода 2 литра ");
    expect(s.habits[0]).toEqual({ id: "starter-water", name: "Вода 2 литра" });
    expect(s.done["2026-11-23"]).toEqual(["starter-water"]);
  });

  it("ignores an empty new name", () => {
    const s = renameHabit(starterState(), "starter-water", "   ");
    expect(s.habits[0]?.name).toBe("Выпить 8 стаканов воды");
  });
});

describe("week summary", () => {
  it("counts only elapsed days as possible", () => {
    let s = starterState();
    s = toggleDone(s, "2026-11-23", "starter-water");
    s = toggleDone(s, "2026-11-24", "starter-water");
    s = toggleDone(s, "2026-11-24", "starter-sleep");
    // Wednesday 25 Nov is "today": Mon, Tue, Wed elapsed -> 3 days x 4 habits
    const w = weekSummary(s, new Date(2026, 10, 25), "2026-11-25");
    expect(w.totalPossible).toBe(12);
    expect(w.totalDone).toBe(3);
    expect(w.percent).toBe(25);
    expect(w.bestDayKey).toBe("2026-11-24");
    expect(w.perHabit[0]?.doneDays).toBe(2);
    expect(w.perHabit[0]?.possibleDays).toBe(3);
    expect(w.perHabit[0]?.days.slice(3)).toEqual([null, null, null, null]);
  });

  it("counts perfect days when every habit is done", () => {
    let s = starterState();
    for (const h of s.habits) s = toggleDone(s, "2026-11-23", h.id);
    const w = weekSummary(s, new Date(2026, 10, 23), "2026-11-29");
    expect(w.perfectDays).toBe(1);
  });
});

describe("streaks", () => {
  const mark = (keys: string[]) =>
    keys.reduce((s, k) => toggleDone(s, k, "starter-water"), starterState());

  it("current streak ends today", () => {
    const s = mark(["2026-11-21", "2026-11-22", "2026-11-23"]);
    expect(habitStreak(s, "starter-water", "2026-11-23")).toEqual({ current: 3, best: 3 });
  });

  it("an unmarked today keeps yesterday's streak alive", () => {
    const s = mark(["2026-11-21", "2026-11-22"]);
    expect(habitStreak(s, "starter-water", "2026-11-23").current).toBe(2);
  });

  it("a missed day resets the current streak but keeps the best", () => {
    const s = mark(["2026-11-10", "2026-11-11", "2026-11-12", "2026-11-12", "2026-11-20"]);
    // 12th toggled twice -> unmarked, so best run is 10-11
    expect(habitStreak(s, "starter-water", "2026-11-23")).toEqual({ current: 0, best: 2 });
  });

  it("runs across a month boundary", () => {
    const s = mark(["2026-10-31", "2026-11-01"]);
    expect(habitStreak(s, "starter-water", "2026-11-01").current).toBe(2);
  });
});

describe("export / import", () => {
  it("round-trips the stored format", () => {
    const s = toggleDone(starterState(), "2026-11-23", "starter-water");
    const file = JSON.stringify(buildExport(s, new Date(2026, 10, 23)));
    const r = validateImport(file);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.habits).toEqual(s.habits);
      expect(r.state.done).toEqual({ "2026-11-23": ["starter-water"] });
      expect(r.marks).toBe(1);
    }
  });

  it("accepts the bare localStorage shape", () => {
    expect(validateImport(JSON.stringify(starterState())).ok).toBe(true);
  });

  it("rejects broken JSON", () => {
    expect(validateImport("{not json").ok).toBe(false);
  });

  it("rejects a foreign format, bad dates and duplicate ids", () => {
    expect(validateImport(JSON.stringify({ format: "other", habits: [], done: {} })).ok).toBe(false);
    expect(
      validateImport(JSON.stringify({ habits: [{ id: "a", name: "A" }], done: { "2026-02-30": ["a"] } })).ok,
    ).toBe(false);
    expect(
      validateImport(
        JSON.stringify({ habits: [{ id: "a", name: "A" }, { id: "a", name: "B" }], done: {} }),
      ).ok,
    ).toBe(false);
  });

  it("rejects empty names and names longer than 60 characters", () => {
    const empty = { habits: [{ id: "a", name: "  " }], done: {} };
    const long = { habits: [{ id: "a", name: "я".repeat(61) }], done: {} };
    expect(validateImport(JSON.stringify(empty)).ok).toBe(false);
    expect(validateImport(JSON.stringify(long)).ok).toBe(false);
  });

  it("drops marks for unknown habits with a warning", () => {
    const r = validateImport(
      JSON.stringify({ habits: [{ id: "a", name: "A" }], done: { "2026-11-23": ["a", "ghost"] } }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.done["2026-11-23"]).toEqual(["a"]);
      expect(r.warnings).toHaveLength(1);
    }
  });
});

import { useCallback, useEffect, useState } from "react";
import {
  STORAGE_KEY,
  addHabit as addHabitPure,
  parseState,
  removeHabit as removeHabitPure,
  toggleDone as togglePure,
  type HabitState,
} from "@/lib/habits";

/** Habit state persisted in localStorage. `ready` is false until storage has been read. */
export function useHabits() {
  const [state, setState] = useState<HabitState | null>(null);

  useEffect(() => {
    setState(parseState(window.localStorage.getItem(STORAGE_KEY)));
  }, []);

  useEffect(() => {
    if (state) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const toggle = useCallback((dateKey: string, habitId: string) => {
    setState((s) => (s ? togglePure(s, dateKey, habitId) : s));
  }, []);

  const add = useCallback((name: string) => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `h-${Date.now()}`;
    setState((s) => (s ? addHabitPure(s, name, id) : s));
  }, []);

  const remove = useCallback((habitId: string) => {
    setState((s) => (s ? removeHabitPure(s, habitId) : s));
  }, []);

  return { state, toggle, add, remove };
}

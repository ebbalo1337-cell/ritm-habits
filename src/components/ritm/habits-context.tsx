import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  STORAGE_KEY,
  addHabit as addHabitPure,
  parseState,
  removeHabit as removeHabitPure,
  renameHabit as renameHabitPure,
  toDateKey,
  toggleDone as togglePure,
  type HabitState,
} from "@/lib/habits";

type HabitsApi = {
  /** null until localStorage has been read on the client. */
  state: HabitState | null;
  todayKey: string | null;
  toggle: (dateKey: string, habitId: string) => void;
  add: (name: string) => void;
  rename: (habitId: string, name: string) => void;
  remove: (habitId: string) => void;
  replaceAll: (next: HabitState) => void;
};

const HabitsContext = createContext<HabitsApi | null>(null);

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `h-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HabitState | null>(null);
  const [todayKey, setTodayKey] = useState<string | null>(null);

  useEffect(() => {
    setState(parseState(window.localStorage.getItem(STORAGE_KEY)));
    setTodayKey(toDateKey(new Date()));

    const refreshDay = () => setTodayKey(toDateKey(new Date()));
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(parseState(e.newValue));
    };
    document.addEventListener("visibilitychange", refreshDay);
    window.addEventListener("focus", refreshDay);
    window.addEventListener("storage", onStorage);
    return () => {
      document.removeEventListener("visibilitychange", refreshDay);
      window.removeEventListener("focus", refreshDay);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (state) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const toggle = useCallback((dateKey: string, habitId: string) => {
    setState((s) => (s ? togglePure(s, dateKey, habitId) : s));
  }, []);
  const add = useCallback((name: string) => {
    const id = newId();
    setState((s) => (s ? addHabitPure(s, name, id) : s));
  }, []);
  const rename = useCallback((habitId: string, name: string) => {
    setState((s) => (s ? renameHabitPure(s, habitId, name) : s));
  }, []);
  const remove = useCallback((habitId: string) => {
    setState((s) => (s ? removeHabitPure(s, habitId) : s));
  }, []);
  const replaceAll = useCallback((next: HabitState) => setState(next), []);

  const api = useMemo(
    () => ({ state, todayKey, toggle, add, rename, remove, replaceAll }),
    [state, todayKey, toggle, add, rename, remove, replaceAll],
  );
  return <HabitsContext.Provider value={api}>{children}</HabitsContext.Provider>;
}

export function useHabits(): HabitsApi {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error("useHabits must be used inside <HabitsProvider>");
  return ctx;
}

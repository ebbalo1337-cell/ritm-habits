import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  completionPercent,
  doneCount,
  fromDateKey,
  isDone,
  pluralHabits,
  toDateKey,
  weekDays,
} from "@/lib/habits";
import { useHabits } from "./habits-context";
import { ProgressRing } from "./ProgressRing";
import { WeekStrip } from "./WeekStrip";
import { HabitList } from "./HabitList";
import { AddHabitForm } from "./AddHabitForm";

function message(percent: number, total: number): string {
  if (total === 0) return "Добавьте привычку, чтобы начать";
  if (percent === 100) return "Всё выполнено. Отличный день!";
  if (percent >= 50) return "Больше половины позади";
  if (percent > 0) return "Хорошее начало";
  return "Начните с самого простого";
}

export function ScreenSkeleton() {
  return <div className="mx-auto mt-16 size-60 animate-pulse rounded-full bg-track" role="status" aria-label="Загрузка" />;
}

export function TodayScreen() {
  const { state, todayKey, toggle, add, rename, remove } = useHabits();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    if (todayKey) setSelectedKey((k) => (k && k <= todayKey ? k : todayKey));
  }, [todayKey]);

  const week = useMemo(() => (selectedKey ? weekDays(fromDateKey(selectedKey)) : []), [selectedKey]);

  if (!state || !todayKey || !selectedKey) return <ScreenSkeleton />;

  const selectedDate = fromDateKey(selectedKey);
  const percent = completionPercent(state, selectedKey);
  const done = doneCount(state, selectedKey);
  const total = state.habits.length;
  const isToday = selectedKey === todayKey;
  const first = week[0]!;
  const last = week[6]!;

  const days = week.map((d) => {
    const key = toDateKey(d);
    return { key, date: d, percent: completionPercent(state, key), isFuture: key > todayKey, isToday: key === todayKey };
  });

  const fmt = (d: Date) => d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

  function shiftWeek(n: number) {
    const target = toDateKey(addDays(selectedDate, n * 7));
    setSelectedKey(target > todayKey! ? todayKey : target);
  }

  return (
    <div className="grid gap-6 pb-16 pt-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-10 lg:pt-10">
      <h1 className="sr-only">Привычки на день</h1>
      <div className="space-y-6 lg:sticky lg:top-8 lg:self-start">
        <section aria-label="Прогресс дня" className="relative rounded-[2rem] bg-card px-6 py-8 text-center shadow-soft">
          <p className="mb-6 text-sm font-medium text-muted-foreground first-letter:uppercase">
            {isToday ? "Сегодня, " : ""}
            {selectedDate.toLocaleDateString("ru-RU", { weekday: isToday ? undefined : "long", day: "numeric", month: "long" })}
          </p>
          <ProgressRing percent={percent} done={done} total={total} />
          <p className="mt-6 font-display text-lg font-medium text-foreground">{message(percent, total)}</p>
          {!isToday && (
            <button
              type="button"
              onClick={() => setSelectedKey(todayKey)}
              className="mt-4 inline-flex h-11 items-center rounded-full bg-secondary px-5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Вернуться к сегодня
            </button>
          )}
        </section>
        <WeekStrip
          days={days}
          selectedKey={selectedKey}
          rangeLabel={`${fmt(first)} — ${fmt(last)}`}
          canGoNext={toDateKey(addDays(last, 1)) <= todayKey}
          onSelect={setSelectedKey}
          onPrevWeek={() => shiftWeek(-1)}
          onNextWeek={() => shiftWeek(1)}
        />
      </div>

      <section className="space-y-4" aria-labelledby="habits-title">
        <div className="flex items-baseline justify-between">
          <h2 id="habits-title" className="font-display text-xl font-medium text-foreground">
            Привычки
          </h2>
          <span className="text-sm text-muted-foreground">
            {total} {pluralHabits(total)}
          </span>
        </div>
        <HabitList
          habits={state.habits}
          isDone={(id) => isDone(state, selectedKey, id)}
          onToggle={(id) => toggle(selectedKey, id)}
          onRename={rename}
          onRemove={remove}
        />
        <AddHabitForm onAdd={add} />
      </section>
    </div>
  );
}

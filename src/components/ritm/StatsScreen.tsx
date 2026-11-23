import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Trophy } from "lucide-react";
import {
  addDays,
  fromDateKey,
  habitStreak,
  pluralDays,
  pluralMarks,
  toDateKey,
  totalMarks,
  weekDays,
  weekSummary,
} from "@/lib/habits";
import { cn } from "@/lib/utils";
import { useHabits } from "./habits-context";
import { DataCard } from "./DataCard";
import { ScreenSkeleton } from "./TodayScreen";

const DAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-soft">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">{value}</dd>
      {hint && <dd className="mt-1 text-sm text-muted-foreground">{hint}</dd>}
    </div>
  );
}

export function StatsScreen() {
  const { state, todayKey } = useHabits();
  const [anchorKey, setAnchorKey] = useState<string | null>(null);

  useEffect(() => {
    if (todayKey) setAnchorKey((k) => k ?? todayKey);
  }, [todayKey]);

  if (!state || !todayKey || !anchorKey) return <ScreenSkeleton />;

  const anchor = fromDateKey(anchorKey);
  const week = weekDays(anchor);
  const first = week[0]!;
  const last = week[6]!;
  const summary = weekSummary(state, anchor, todayKey);
  const isCurrentWeek = toDateKey(first) <= todayKey && todayKey <= toDateKey(last);
  const canGoNext = toDateKey(addDays(last, 1)) <= todayKey;
  const fmt = (d: Date) => d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  const allMarks = totalMarks(state);

  const bestDayLabel = summary.bestDayKey
    ? fromDateKey(summary.bestDayKey).toLocaleDateString("ru-RU", { weekday: "long" })
    : "—";
  const bestDay = summary.days.find((d) => d.key === summary.bestDayKey);

  const streaks = state.habits
    .map((h) => ({ habit: h, streak: habitStreak(state, h.id, todayKey) }));

  return (
    <div className="space-y-6 pb-16 pt-6 lg:pt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground sm:text-3xl">Статистика</h1>
          <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
            {isCurrentWeek ? "Эта неделя: " : "Неделя: "}
            {fmt(first)} — {fmt(last)}
          </p>
        </div>
        <div className="flex gap-1 rounded-full bg-card p-1 shadow-soft">
          <button
            type="button"
            onClick={() => setAnchorKey(toDateKey(addDays(anchor, -7)))}
            aria-label="Предыдущая неделя"
            className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          {!isCurrentWeek && (
            <button
              type="button"
              onClick={() => setAnchorKey(todayKey)}
              className="h-11 rounded-full px-4 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Эта неделя
            </button>
          )}
          <button
            type="button"
            onClick={() => setAnchorKey(toDateKey(addDays(anchor, 7)))}
            disabled={!canGoNext}
            aria-label="Следующая неделя"
            className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <section aria-label="Итоги недели">
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            label="Выполнено за неделю"
            value={`${summary.percent}%`}
            hint={`${summary.totalDone} из ${summary.totalPossible} ${pluralMarks(summary.totalPossible)}`}
          />
          <Stat
            label="Идеальных дней"
            value={String(summary.perfectDays)}
            hint="все привычки выполнены"
          />
          <Stat
            label="Лучший день"
            value={bestDayLabel}
            hint={bestDay ? `${bestDay.done} из ${bestDay.possible}` : "пока нет отметок"}
          />
          <Stat label="Всего отметок" value={String(allMarks)} hint="за всё время" />
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section aria-labelledby="days-title" className="rounded-3xl bg-card p-5 shadow-soft sm:p-6">
          <h2 id="days-title" className="font-display text-lg font-medium text-foreground">
            По дням
          </h2>
          <ol className="mt-5 grid h-48 grid-cols-7 items-end gap-2">
            {summary.days.map((d, i) => {
              const future = d.possible === 0;
              const date = fromDateKey(d.key);
              return (
                <li key={d.key} className="flex h-full flex-col items-center justify-end gap-2">
                  <span className="text-xs font-medium text-muted-foreground" aria-hidden>
                    {future ? "" : `${d.percent}%`}
                  </span>
                  <div className="relative w-full flex-1 overflow-hidden rounded-xl bg-track" aria-hidden>
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-xl bg-gradient-primary ring-progress transition-all"
                      style={{ height: `${d.percent}%` }}
                    />
                  </div>
                  <span
                    className={cn("text-xs", d.key === todayKey ? "font-semibold text-primary" : "text-muted-foreground")}
                    aria-hidden
                  >
                    {DAY_SHORT[i]}
                  </span>
                  <span className="sr-only">
                    {date.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}:{" "}
                    {future ? "ещё не наступил" : `выполнено ${d.done} из ${d.possible}, ${d.percent}%`}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="streaks-title" className="rounded-3xl bg-card p-5 shadow-soft sm:p-6">
          <h2 id="streaks-title" className="font-display text-lg font-medium text-foreground">
            Привычки и серии
          </h2>
          {state.habits.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Пока нет привычек.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {summary.perHabit.map((h) => {
                const s = streaks.find((x) => x.habit.id === h.id)!.streak;
                return (
                  <li key={h.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <p className="min-w-0 break-words font-medium text-foreground">{h.name}</p>
                      <p className="shrink-0 text-sm text-muted-foreground">
                        {h.doneDays} из {h.possibleDays} {pluralDays(h.possibleDays)}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <ol className="flex gap-1.5" aria-label="Отметки по дням недели">
                        {h.days.map((m, i) => (
                          <li
                            key={i}
                            title={DAY_SHORT[i]}
                            className={cn(
                              "grid size-7 place-items-center rounded-full text-[10px] font-medium",
                              m === true && "bg-primary text-primary-foreground",
                              m === false && "bg-track text-muted-foreground",
                              m === null && "border border-dashed border-border text-muted-foreground/60",
                            )}
                          >
                            <span aria-hidden>{DAY_SHORT[i]}</span>
                            <span className="sr-only">
                              {DAY_SHORT[i]}: {m === true ? "выполнено" : m === false ? "пропущено" : "впереди"}
                            </span>
                          </li>
                        ))}
                      </ol>
                      <div className="flex gap-2 text-sm">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-3 py-1",
                            s.current > 0 ? "bg-primary-soft text-secondary-foreground" : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Flame className="size-3.5" aria-hidden />
                          <span className="sr-only">Текущая серия:</span>
                          {s.current} {pluralDays(s.current)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-muted-foreground">
                          <Trophy className="size-3.5" aria-hidden />
                          <span className="sr-only">Рекорд:</span>
                          {s.best}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            <Flame className="inline size-3" aria-hidden /> — текущая серия подряд (сегодня ещё можно продолжить),{" "}
            <Trophy className="inline size-3" aria-hidden /> — лучшая серия.
          </p>
        </section>
      </div>

      <DataCard />
    </div>
  );
}

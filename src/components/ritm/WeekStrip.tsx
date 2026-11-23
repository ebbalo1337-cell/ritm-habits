import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

type Day = { key: string; date: Date; percent: number; isFuture: boolean; isToday: boolean };

type Props = {
  days: Day[];
  selectedKey: string;
  rangeLabel: string;
  canGoNext: boolean;
  onSelect: (key: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
};

export function WeekStrip({ days, selectedKey, rangeLabel, canGoNext, onSelect, onPrevWeek, onNextWeek }: Props) {
  return (
    <section aria-label="Дни недели" className="rounded-3xl bg-card p-4 shadow-soft sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevWeek}
          aria-label="Предыдущая неделя"
          className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <span className="text-sm font-medium text-muted-foreground">{rangeLabel}</span>
        <button
          type="button"
          onClick={onNextWeek}
          disabled={!canGoNext}
          aria-label="Следующая неделя"
          className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((d, i) => {
          const selected = d.key === selectedKey;
          return (
            <button
              key={d.key}
              type="button"
              disabled={d.isFuture}
              onClick={() => onSelect(d.key)}
              aria-pressed={selected}
              aria-label={`${d.date.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}${d.isToday ? ", сегодня" : ""}, выполнено ${d.percent}%`}
              className={cn(
                "flex min-h-16 flex-col items-center gap-1 rounded-2xl py-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-35",
                selected
                  ? "bg-gradient-primary text-primary-foreground shadow-ring"
                  : "hover:bg-accent text-foreground",
              )}
            >
              <span className={cn("text-[11px] uppercase tracking-wide", selected ? "opacity-85" : "text-muted-foreground")}>
                {DAY_SHORT[i]}
              </span>
              <span className="font-display text-base font-medium sm:text-lg">{d.date.getDate()}</span>
              <span
                className={cn(
                  "h-1 w-6 overflow-hidden rounded-full",
                  selected ? "bg-primary-foreground/30" : "bg-track",
                )}
              >
                <span
                  className={cn("block h-full rounded-full transition-all", selected ? "bg-primary-foreground" : "bg-primary")}
                  style={{ width: `${d.percent}%` }}
                />
              </span>
              {d.isToday && !selected && <span aria-hidden className="size-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

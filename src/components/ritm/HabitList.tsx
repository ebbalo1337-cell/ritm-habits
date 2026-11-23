import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import type { Habit } from "@/lib/habits";
import { cn } from "@/lib/utils";
import { EditHabitDialog } from "./EditHabitDialog";

type Props = {
  habits: Habit[];
  isDone: (id: string) => boolean;
  onToggle: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
};

export function HabitList({ habits, isDone, onToggle, onRename, onRemove }: Props) {
  const [editing, setEditing] = useState<Habit | null>(null);

  if (habits.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
        Пока нет привычек. Добавьте первую ниже.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-2.5" aria-label="Привычки">
        {habits.map((h) => {
          const done = isDone(h.id);
          return (
            <li key={h.id} className="flex items-center gap-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={done}
                onClick={() => onToggle(h.id)}
                className={cn(
                  "flex min-h-16 min-w-0 flex-1 items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  done
                    ? "border-transparent bg-primary-soft"
                    : "border-border bg-card shadow-soft hover:border-primary/40",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full border-2 transition-colors",
                    done ? "border-primary bg-primary text-primary-foreground" : "border-input",
                  )}
                >
                  {done && <Check className="size-4 animate-check-pop" strokeWidth={3} />}
                </span>
                <span
                  className={cn(
                    "break-words text-base font-medium transition-colors",
                    done ? "text-secondary-foreground/70 line-through decoration-primary/50" : "text-foreground",
                  )}
                >
                  {h.name}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setEditing(h)}
                aria-label={`Изменить «${h.name}»`}
                className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Pencil className="size-4" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      <EditHabitDialog habit={editing} onClose={() => setEditing(null)} onRename={onRename} onRemove={onRemove} />
    </>
  );
}

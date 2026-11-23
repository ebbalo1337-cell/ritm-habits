import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { MAX_NAME_LENGTH, normalizeName } from "@/lib/habits";

export function AddHabitForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [value, setValue] = useState("");
  const valid = normalizeName(value) !== null;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    onAdd(value);
    setValue("");
  }

  return (
    <form onSubmit={submit} className="flex gap-2 rounded-2xl bg-card p-2 shadow-soft focus-within:ring-2 focus-within:ring-ring">
      <label htmlFor="new-habit" className="sr-only">
        Новая привычка
      </label>
      <input
        id="new-habit"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={MAX_NAME_LENGTH}
        placeholder="Новая привычка…"
        className="min-w-0 flex-1 rounded-xl bg-transparent px-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <button
        type="submit"
        disabled={!valid}
        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-primary px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        <Plus className="size-4" aria-hidden />
        <span>Добавить</span>
      </button>
    </form>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MAX_NAME_LENGTH, normalizeName, type Habit } from "@/lib/habits";

type Props = {
  habit: Habit | null;
  onClose: () => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
};

export function EditHabitDialog({ habit, onClose, onRename, onRemove }: Props) {
  const [value, setValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (habit) {
      setValue(habit.name);
      setConfirmDelete(false);
    }
  }, [habit]);

  const valid = normalizeName(value) !== null;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!habit || !valid) return;
    onRename(habit.id, value);
    onClose();
  }

  return (
    <Dialog open={habit !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-medium">Изменить привычку</DialogTitle>
          <DialogDescription>Отметки сохранятся — меняется только название.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-habit-name" className="text-sm font-medium text-foreground">
              Название
            </label>
            <input
              id="edit-habit-name"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={MAX_NAME_LENGTH}
              aria-invalid={!valid}
              aria-describedby="edit-habit-hint"
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p id="edit-habit-hint" className="text-xs text-muted-foreground">
              {valid ? `${value.trim().length} / ${MAX_NAME_LENGTH}` : "Название не может быть пустым"}
            </p>
          </div>

          {confirmDelete ? (
            <div role="alert" className="space-y-3 rounded-2xl bg-destructive/10 p-4">
              <p className="text-sm text-foreground">
                Удалить «{habit?.name}»? Все её отметки тоже удалятся. Это нельзя отменить.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (habit) onRemove(habit.id);
                    onClose();
                  }}
                >
                  Да, удалить
                </Button>
                <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
                  Оставить
                </Button>
              </div>
            </div>
          ) : (
            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 aria-hidden />
                Удалить
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button type="button" variant="outline" onClick={onClose}>
                  Отмена
                </Button>
                <Button type="submit" disabled={!valid}>
                  Сохранить
                </Button>
              </div>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

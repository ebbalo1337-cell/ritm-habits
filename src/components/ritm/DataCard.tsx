import { useRef, useState, type ChangeEvent } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MAX_IMPORT_BYTES,
  buildExport,
  exportFileName,
  pluralHabits,
  pluralMarks,
  totalMarks,
  validateImport,
  type ImportResult,
} from "@/lib/habits";
import { deliverFile } from "@/lib/download";
import { useHabits } from "./habits-context";

type Pending = Extract<ImportResult, { ok: true }>;

export function DataCard() {
  const { state, replaceAll } = useHabits();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  if (!state) return null;
  const currentMarks = totalMarks(state);

  function exportData() {
    if (!state) return;
    const now = new Date();
    const blob = new Blob([JSON.stringify(buildExport(state, now), null, 2)], {
      type: "application/json;charset=utf-8",
    });
    void deliverFile(blob, exportFileName(now));
    toast.success("Резервная копия сохранена");
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErrors([]);
    if (file.size > MAX_IMPORT_BYTES) {
      setErrors(["Файл слишком большой (больше 1 МБ)."]);
      return;
    }
    const result = validateImport(await file.text());
    if (result.ok) setPending(result);
    else setErrors(result.errors);
  }

  function confirmImport() {
    if (!pending) return;
    replaceAll(pending.state);
    toast.success(`Импортировано: ${pending.habits} ${pluralHabits(pending.habits)}, ${pending.marks} ${pluralMarks(pending.marks)}`);
    setPending(null);
  }

  return (
    <section aria-labelledby="data-title" className="rounded-3xl bg-card p-5 shadow-soft sm:p-6">
      <h2 id="data-title" className="font-display text-lg font-medium text-foreground">
        Резервная копия
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Данные хранятся только в этом браузере. Сохраните файл, чтобы перенести их на другое устройство.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button onClick={exportData}>
          <Download aria-hidden />
          Экспорт JSON
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload aria-hidden />
          Импорт JSON
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-label="Файл для импорта"
          onChange={onFile}
        />
      </div>

      {errors.length > 0 && (
        <div role="alert" className="mt-4 rounded-2xl bg-destructive/10 p-4 text-sm text-foreground">
          <p className="font-medium text-destructive">Файл не подходит — данные не изменены.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl font-medium">Заменить данные?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  В файле: <strong className="text-foreground">{pending?.habits} {pluralHabits(pending?.habits ?? 0)}</strong> и{" "}
                  <strong className="text-foreground">{pending?.marks} {pluralMarks(pending?.marks ?? 0)}</strong>.
                </p>
                <p>
                  Текущие данные ({state.habits.length} {pluralHabits(state.habits.length)}, {currentMarks}{" "}
                  {pluralMarks(currentMarks)}) будут полностью заменены. Если они нужны, сначала сделайте экспорт.
                </p>
                {pending?.warnings.map((w) => (
                  <p key={w} className="text-foreground">
                    {w}
                  </p>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Заменить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

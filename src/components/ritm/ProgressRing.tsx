type Props = { percent: number; done: number; total: number };

export function ProgressRing({ percent, done, total }: Props) {
  const size = 240;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[15rem] rounded-full shadow-ring"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent}%, выполнено ${done} из ${total}`}
      aria-label="Доля выполненных привычек"
    >
      <svg aria-hidden viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ritm-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--primary-glow)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="var(--card)" stroke="var(--track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ritm-ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="ring-progress"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-6xl font-semibold tracking-tight text-foreground" data-testid="percent">
          {percent}
          <span className="text-3xl text-muted-foreground">%</span>
        </span>
        <span className="mt-1 text-sm text-muted-foreground" aria-live="polite">
          {done} из {total}
        </span>
      </div>
    </div>
  );
}

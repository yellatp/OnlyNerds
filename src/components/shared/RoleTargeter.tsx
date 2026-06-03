import { TARGET_LEVELS } from '../../lib/dorkUtils';

type Accent = 'emerald' | 'amber' | 'violet';

const ACCENT: Record<Accent, {
  box: string;
  dot: string;
  title: string;
  inputFocus: string;
  pillActive: string;
  pillInactive: string;
  hint: string;
}> = {
  emerald: {
    box: 'rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4',
    dot: 'h-1.5 w-1.5 rounded-full bg-emerald-400',
    title: 'text-xs font-semibold uppercase tracking-widest text-emerald-500',
    inputFocus: 'w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-emerald-700',
    pillActive: 'border-emerald-600 bg-emerald-900 text-emerald-200',
    pillInactive: 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200',
    hint: 'mt-2 text-[10px] text-emerald-600',
  },
  amber: {
    box: 'rounded-xl border border-amber-900/40 bg-amber-950/20 p-4',
    dot: 'h-1.5 w-1.5 rounded-full bg-amber-400',
    title: 'text-xs font-semibold uppercase tracking-widest text-amber-500',
    inputFocus: 'w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-amber-700',
    pillActive: 'border-amber-600 bg-amber-900 text-amber-200',
    pillInactive: 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200',
    hint: 'mt-2 text-[10px] text-amber-600',
  },
  violet: {
    box: 'rounded-xl border border-violet-900/40 bg-violet-950/20 p-4',
    dot: 'h-1.5 w-1.5 rounded-full bg-violet-400',
    title: 'text-xs font-semibold uppercase tracking-widest text-violet-400',
    inputFocus: 'w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-violet-700',
    pillActive: 'border-violet-600 bg-violet-900 text-violet-200',
    pillInactive: 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200',
    hint: 'mt-2 text-[10px] text-violet-500',
  },
};

interface Props {
  targetRole: string;
  targetLevel: string;
  setTargetRole: (role: string) => void;
  setTargetLevel: (level: string) => void;
  colorClass: Accent;
}

export default function RoleTargeter({
  targetRole, targetLevel, setTargetRole, setTargetLevel, colorClass,
}: Props) {
  const c = ACCENT[colorClass];
  return (
    <div className={c.box}>
      <div className="mb-3 flex items-center gap-2">
        <span className={c.dot} />
        <p className={c.title}>Target a Role (optional)</p>
        {(targetRole || targetLevel) && (
          <button
            type="button"
            onClick={() => { setTargetRole(''); setTargetLevel(''); }}
            className="ml-auto text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            Clear targeting
          </button>
        )}
      </div>
      <div className="mb-3">
        <input
          type="text"
          placeholder="SWE, SDE, SRE, Data Engineer, Data Analyst, ML Engineer..."
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          className={c.inputFocus}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TARGET_LEVELS.map((l) => (
          <button
            key={l.label}
            type="button"
            onClick={() => setTargetLevel(targetLevel === l.label ? '' : l.label)}
            className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
              targetLevel === l.label ? c.pillActive : c.pillInactive
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
      {targetRole && (
        <p className={c.hint}>
          Company links will open a Google dork scoped to "{targetRole}"{targetLevel ? ` at ${targetLevel} level` : ''}.
        </p>
      )}
    </div>
  );
}

import { cn } from '@/lib/utils';
import type { Branch } from './constants';
import { BRANCH_STYLE } from './constants';

interface BranchNodeProps {
  branch: Branch;
  align: 'left' | 'right';
}

export function BranchNode({ branch, align }: BranchNodeProps) {
  const s = BRANCH_STYLE[branch.id];
  const isRight = align === 'right';

  return (
    <div
      className={`rounded-xl border ${s.border} ${s.bg} px-4 py-3 w-[188px]`}
    >
      <p
        className={`text-[8px] font-bold uppercase tracking-widest ${s.label} mb-2 ${isRight ? 'text-right' : ''}`}
      >
        {branch.label}
      </p>
      <ul className={`space-y-1 ${isRight ? 'flex flex-col items-end' : ''}`}>
        {branch.items.map((item, i) => (
          <li
            key={i}
            className={cn(
              'flex items-start gap-1.5 text-[10px] leading-snug text-foreground/70',
              isRight && 'flex-row-reverse'
            )}
          >
            <span
              className={`mt-[5px] h-[3px] w-[3px] shrink-0 rounded-full ${s.dot}`}
            />
            <span className="leading-[1.4]">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

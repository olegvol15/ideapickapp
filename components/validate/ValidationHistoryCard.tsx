'use client';

import { useRouter } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ValidationContextMenu } from './ValidationContextMenu';
import { useEditableValidation } from '@/hooks/use-editable-validation';
import { relativeDate } from '@/lib/validate/format';
import { isPainEvidenceResult } from '@/lib/validate/legacy';
import {
  evidenceTypeCounts,
  matchedQuoteCount,
} from '@/lib/evidence/quote-pool';
import { scoreColor } from './PainScoreBlock';

interface ValidationHistoryCardProps {
  id: string;
  description: string;
  productType: string | null;
  result: unknown;
  createdAt: string | number;
  onDelete: () => void;
  onRename: (description: string) => void;
}

export function ValidationHistoryCard({
  id,
  description,
  productType,
  result,
  createdAt,
  onDelete,
  onRename,
}: ValidationHistoryCardProps) {
  const router = useRouter();

  const {
    menuOpen,
    menuPos,
    mounted,
    editing,
    editValue,
    setEditValue,
    buttonRef,
    menuRef,
    inputRef,
    openMenu,
    startEdit,
    cancelMenu,
    commitRename,
    handleKeyDown,
  } = useEditableValidation(description, onRename);

  return (
    <div
      className="group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-border/80 hover:bg-card/90"
      onClick={() => !editing && router.push(`/validate/${id}`)}
    >
      {/* Evidence badges */}
      <div className="flex items-center gap-2">
        {isPainEvidenceResult(result) ? (
          <>
            {result.score != null && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums',
                  scoreColor(result.score)
                )}
              >
                {result.score}/100
              </span>
            )}
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-primary">
              {matchedQuoteCount(result)} matched
            </span>
            {evidenceTypeCounts(result).related > 0 && (
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                {evidenceTypeCounts(result).related} related
              </span>
            )}
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {result.totalQuotes} reviewed
            </span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {result.themes.length} theme
              {result.themes.length !== 1 ? 's' : ''}
            </span>
          </>
        ) : (
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground/60">
            legacy report
          </span>
        )}
      </div>

      {/* Description / editable title */}
      {editing ? (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="h-auto w-full border-0 bg-transparent p-0 text-sm font-medium text-foreground shadow-none focus-visible:ring-0 rounded-none"
        />
      ) : (
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground/90">
          {description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/50">
        {productType && (
          <span className="rounded bg-white/5 px-1.5 py-0.5">
            {productType}
          </span>
        )}
        <span className="ml-auto">{relativeDate(createdAt)}</span>
      </div>

      {/* Menu button */}
      {!editing && (
        <Button
          ref={buttonRef}
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            openMenu(e);
          }}
          className={cn(
            'absolute right-3 top-3 h-6 w-6',
            menuOpen
              ? 'text-foreground'
              : 'text-transparent group-hover:text-muted-foreground/50 hover:!text-foreground'
          )}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      )}

      {mounted && menuPos && (
        <ValidationContextMenu
          isOpen={menuOpen}
          position={menuPos}
          menuRef={menuRef}
          isEditing={editing}
          onRenameStart={startEdit}
          onDelete={() => {
            cancelMenu();
            onDelete();
          }}
        />
      )}
    </div>
  );
}

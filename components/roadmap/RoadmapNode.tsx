'use client';

import { motion } from 'framer-motion';
import { Loader2, Plus, Twitter, MessageSquare } from 'lucide-react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRoadmapStore } from '@/stores/roadmap.store';
import type { RoadmapNodeType, RoadmapNodeStatus } from '@/types/roadmap.types';

export const NODE_W = 244;
export const NODE_H = 96;

export interface NodeData {
  label: string;
  nodeType: RoadmapNodeType;
  description?: string;
  status?: RoadmapNodeStatus;
  expanded: boolean;
  expanding: boolean;
  canExpand: boolean;
  actionType?: 'tweet' | 'reddit' | null;
  onExpand: () => void;
  onSelect: () => void;
  onGenerateContent?: () => void;
  [key: string]: unknown;
}

const NODE_WRAP: Record<RoadmapNodeType, string> = {
  root: 'bg-primary/[0.10] border-2 border-primary/35',
  branch: 'bg-card border border-border',
  leaf: 'bg-background/60 border border-border/60',
};

const ACCENT_COLOR: Record<RoadmapNodeType, string> = {
  root: 'bg-primary',
  branch: 'bg-amber-500',
  leaf: 'bg-emerald-500',
};

const TYPE_BADGE_CLASS: Record<RoadmapNodeType, string> = {
  root: 'border-primary/30 text-primary',
  branch: 'border-amber-500/30 text-amber-600 dark:text-amber-400',
  leaf: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
};

const STATUS_DOT_CLASS: Record<RoadmapNodeStatus, string> = {
  todo: 'bg-muted-foreground/35',
  'in-progress': 'bg-amber-500',
  done: 'bg-emerald-500',
};

export function RoadmapNode({ id, data }: NodeProps) {
  const d = data as NodeData;
  const isSelected = useRoadmapStore((s) => s.selectedNodeId === id);

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-2xl shadow-lg transition-all hover:shadow-xl cursor-pointer',
        NODE_WRAP[d.nodeType],
        d.expanding && 'opacity-50',
        isSelected && 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background'
      )}
      style={{ width: NODE_W, minHeight: NODE_H }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: d.expanding ? 0.5 : 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onClick={() => d.onSelect()}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div className={cn('absolute inset-y-0 left-0 w-[3px]', ACCENT_COLOR[d.nodeType])} />

      {d.status && (
        <div
          className={cn(
            'absolute right-3 top-3 h-2 w-2 rounded-full',
            STATUS_DOT_CLASS[d.status]
          )}
        />
      )}

      <div className="px-4 py-3.5 pl-5">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn('h-4 px-1.5 text-[9px] uppercase tracking-widest', TYPE_BADGE_CLASS[d.nodeType])}
          >
            {d.nodeType}
          </Badge>
        </div>

        <p
          className={cn(
            'leading-snug text-foreground',
            d.nodeType === 'root' && 'text-[14px] font-bold',
            d.nodeType === 'branch' && 'text-[13px] font-semibold',
            d.nodeType === 'leaf' && 'text-[12px] font-medium text-foreground/85'
          )}
        >
          {d.label}
        </p>

        {d.description && (
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/60 line-clamp-2">
            {d.description}
          </p>
        )}
      </div>

      {d.canExpand && !d.expanded && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!d.expanding) d.onExpand();
          }}
          disabled={d.expanding}
          className={cn(
            'absolute -right-3.5 top-1/2 z-20 -translate-y-1/2',
            'flex h-7 w-7 items-center justify-center rounded-full',
            'border border-border/60 bg-card text-muted-foreground shadow-md',
            'transition-all duration-150',
            'hover:border-primary/50 hover:text-primary hover:scale-110 active:scale-95',
            d.expanding && 'pointer-events-none'
          )}
        >
          {d.expanding ? (
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
        </button>
      )}

      {d.actionType && d.onGenerateContent && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            d.onGenerateContent!();
          }}
          title={d.actionType === 'tweet' ? 'Generate tweet' : 'Generate Reddit post'}
          className={cn(
            'absolute bottom-2 right-2 z-20',
            'flex h-5 w-5 items-center justify-center rounded-full',
            'border shadow-sm transition-all duration-150 hover:scale-110 active:scale-95',
            d.actionType === 'tweet'
              ? 'border-sky-400/30 bg-sky-400/10 text-sky-400 hover:bg-sky-400/20'
              : 'border-orange-400/30 bg-orange-400/10 text-orange-400 hover:bg-orange-400/20'
          )}
        >
          {d.actionType === 'tweet' ? (
            <Twitter className="h-2.5 w-2.5" />
          ) : (
            <MessageSquare className="h-2.5 w-2.5" />
          )}
        </button>
      )}
    </motion.div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useRoadmapStore } from '@/stores/roadmap.store';
import type { RoadmapNodeStatus, RoadmapNodeType } from '@/types/roadmap.types';
import { Twitter, MessageSquare, Pencil, Trash2 } from 'lucide-react';

interface NodeDetailSheetProps {
  onStatusChange: (nodeId: string, status: RoadmapNodeStatus) => void;
  onDelete: (nodeId: string) => void;
  onUpdate: (nodeId: string, patch: { label: string; description: string }) => void;
}

const TYPE_BADGE_CLASS: Record<RoadmapNodeType, string> = {
  root: 'border-primary/30 text-primary',
  branch: 'border-amber-500/30 text-amber-600 dark:text-amber-400',
  leaf: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
};

const STATUS_DOT_CLASS: Record<RoadmapNodeStatus, string> = {
  'todo': 'bg-muted-foreground/40',
  'in-progress': 'bg-amber-500',
  'done': 'bg-emerald-500',
};

const STATUS_LABEL: Record<RoadmapNodeStatus, string> = {
  'todo': 'To do',
  'in-progress': 'In progress',
  'done': 'Done',
};

export function NodeDetailSheet({ onStatusChange, onDelete, onUpdate }: NodeDetailSheetProps) {
  const { selectedNodeId, rmNodes, setSelectedNode } = useRoadmapStore();

  const node = rmNodes.find((n) => n.id === selectedNodeId) ?? null;
  const parent = node?.parent ? rmNodes.find((n) => n.id === node.parent) : null;
  const hasChildren = node ? rmNodes.some((n) => n.parent === node.id) : false;

  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setEditing(false);
    setConfirmDelete(false);
  }, [selectedNodeId]);

  function enterEdit() {
    if (!node) return;
    setEditLabel(node.label);
    setEditDesc(node.description ?? '');
    setEditing(true);
  }

  function saveEdit() {
    if (!node || !editLabel.trim()) return;
    onUpdate(node.id, { label: editLabel.trim(), description: editDesc.trim() });
    setEditing(false);
  }

  return (
    <Sheet open={!!selectedNodeId} onOpenChange={(open) => !open && setSelectedNode(null)}>
      <SheetContent>
        {node && (
          <div className="flex h-full flex-col overflow-y-auto">
            <SheetHeader>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn('text-[10px] uppercase tracking-widest', TYPE_BADGE_CLASS[node.type])}
                >
                  {node.type}
                </Badge>
                {node.actionType && (
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border',
                      node.actionType === 'tweet'
                        ? 'border-sky-400/30 bg-sky-400/10 text-sky-400'
                        : 'border-orange-400/30 bg-orange-400/10 text-orange-400'
                    )}
                  >
                    {node.actionType === 'tweet' ? (
                      <Twitter className="h-2.5 w-2.5" />
                    ) : (
                      <MessageSquare className="h-2.5 w-2.5" />
                    )}
                  </span>
                )}
                {!editing && (
                  <button
                    onClick={enterEdit}
                    className="ml-auto text-muted-foreground/50 transition-colors hover:text-foreground"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {!editing && <SheetTitle>{node.label}</SheetTitle>}
            </SheetHeader>

            {editing && (
              <div className="mb-4 flex flex-col gap-2">
                <Input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="text-sm font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                />
                <Textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Describe this step…"
                  className="h-28 resize-none text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit} disabled={!editLabel.trim()}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {!editing && (
              <>
                <Separator className="mb-4" />

                {node.description ? (
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    {node.description}
                  </p>
                ) : (
                  <p className="mb-4 text-sm italic text-muted-foreground/40">No description.</p>
                )}

                <Separator className="mb-4" />

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      Status
                    </p>
                    <Select
                      value={node.status ?? 'todo'}
                      onValueChange={(val) => onStatusChange(node.id, val as RoadmapNodeStatus)}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full',
                              STATUS_DOT_CLASS[node.status ?? 'todo']
                            )}
                          />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {(['todo', 'in-progress', 'done'] as RoadmapNodeStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>
                            <div className="flex items-center gap-2">
                              <span className={cn('h-2 w-2 rounded-full', STATUS_DOT_CLASS[s])} />
                              {STATUS_LABEL[s]}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {parent && (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        Parent step
                      </p>
                      <p className="text-sm text-foreground/80">{parent.label}</p>
                    </div>
                  )}
                </div>

                {node.type !== 'root' && (
                  <div className="mt-auto pt-8">
                    {!confirmDelete ? (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40 transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete step
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-[11px] text-muted-foreground/70">
                          Delete{hasChildren ? ' step and children' : ' this step'}?
                        </p>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          onClick={() => onDelete(node.id)}
                        >
                          Delete
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setConfirmDelete(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useRoadmapStore } from '@/stores/roadmap.store';
import type { RoadmapNode, RoadmapNodeType } from '@/types/roadmap.types';

interface CreateNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (node: RoadmapNode) => void;
}

export function CreateNodeDialog({ open, onOpenChange, onSubmit }: CreateNodeDialogProps) {
  const rmNodes = useRoadmapStore((s) => s.rmNodes);

  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [nodeType, setNodeType] = useState<'branch' | 'leaf'>('branch');
  const [parentId, setParentId] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    onSubmit({
      id: crypto.randomUUID(),
      label: label.trim(),
      description: description.trim() || undefined,
      type: nodeType,
      parent: parentId || undefined,
      status: 'todo',
    });
    setLabel('');
    setDescription('');
    setNodeType('branch');
    setParentId('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Step</DialogTitle>
          <DialogDescription>Add a custom step to your roadmap</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Label <span className="text-destructive">*</span>
            </label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Set up CI/CD pipeline"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this step involve?"
              className="h-20 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Type
              </label>
              <Select value={nodeType} onValueChange={(v) => setNodeType(v as 'branch' | 'leaf')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="branch">Branch</SelectItem>
                  <SelectItem value="leaf">Leaf</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Parent
              </label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {rmNodes.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!label.trim()}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

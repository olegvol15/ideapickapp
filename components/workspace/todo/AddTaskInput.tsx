'use client';

import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddTaskInputProps {
  id?:   string;
  onAdd: (title: string) => void;
}

export function AddTaskInput({ id, onAdd }: AddTaskInputProps) {
  const [open, setOpen]   = useState(false);
  const [value, setValue] = useState('');
  const inputRef          = useRef<HTMLInputElement>(null);

  function expand() {
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function submit() {
    const trimmed = value.trim();
    if (trimmed) onAdd(trimmed);
    setValue('');
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        id={id}
        onClick={expand}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs',
          'text-muted-foreground/35 transition-colors',
          'hover:bg-muted/40 hover:text-muted-foreground/70'
        )}
      >
        <Plus className="h-3.5 w-3.5" />
        Add task
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-card px-3 py-2 ring-2 ring-primary/10">
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter')  submit();
          if (e.key === 'Escape') { setValue(''); setOpen(false); }
        }}
        onBlur={submit}
        placeholder="Task name…"
        className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
      />
    </div>
  );
}

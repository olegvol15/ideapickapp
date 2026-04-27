'use client';

import { useState, useRef, useEffect } from 'react';

export function useEditableValidation(
  description: string,
  onSave: (name: string) => void
) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(description);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);
  useEffect(() => {
    setEditValue(description);
  }, [description]);

  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      )
        setMenuOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  function openMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setMenuPos({ top: rect.bottom + 4, left: rect.right - 132 });
    setMenuOpen((o) => !o);
  }

  function commitRename() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== description) onSave(trimmed);
    else setEditValue(description);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') {
      setEditValue(description);
      setEditing(false);
    }
  }

  return {
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
    startEdit: () => {
      setMenuOpen(false);
      setEditing(true);
    },
    cancelMenu: () => setMenuOpen(false),
    commitRename,
    handleKeyDown,
  };
}

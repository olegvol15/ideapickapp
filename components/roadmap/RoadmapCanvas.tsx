'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeProps,
  type Connection,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { motion } from 'framer-motion';
import { Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import '@xyflow/react/dist/style.css';

import { cn } from '@/lib/utils';
import type { Idea } from '@/types';
import type { RoadmapNode, RoadmapNodeType } from '@/types/roadmap.types';
import {
  saveRoadmapState,
  loadRoadmapState,
  PLANS_EVENT,
  type RoadmapState,
} from '@/services/storage.service';
import {
  upsertRoadmapToDB,
  loadRoadmapFromDB,
  type LoadedRoadmap,
} from '@/services/db.service';
import { useAuth } from '@/context/auth';

// ─── Layout constants ─────────────────────────────────────────────────────────

const NODE_W        = 244;
const NODE_H        = 88;
const CHILD_OFFSET  = 260;  // horizontal gap between parent right edge and children
const CHILD_STEP    = 112;  // vertical spacing between sibling children

// ─── Initial dagre layout (branches only) ────────────────────────────────────

function dagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 260, marginx: 80, marginy: 80 });
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const { x, y } = g.node(n.id);
    return { ...n, position: { x: x - NODE_W / 2, y: y - NODE_H / 2 } };
  });
}

// ─── Edge factory ─────────────────────────────────────────────────────────────

function mkEdge(source: string, target: string): Edge {
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    type: 'smoothstep',
    style: { stroke: 'rgba(96,165,250,0.45)', strokeWidth: 2.5 },
  };
}

// ─── Node data type ───────────────────────────────────────────────────────────

interface NodeData {
  label: string;
  nodeType: RoadmapNodeType;
  description?: string;
  expanded: boolean;
  expanding: boolean;
  canExpand: boolean;
  onExpand: () => void;
  [key: string]: unknown;
}

// ─── Node visual styles ───────────────────────────────────────────────────────

const NODE_WRAP: Record<RoadmapNodeType, string> = {
  root:   'bg-primary/[0.18] border-2 border-primary/55 shadow-primary/10',
  branch: 'bg-card border border-border/80 hover:border-border',
  leaf:   'bg-background/50 border border-border/50 hover:border-border/70',
};

// ─── Custom node component ────────────────────────────────────────────────────

function RoadmapNodeCmp({ data }: NodeProps) {
  const d = data as NodeData;

  return (
    <motion.div
      className={cn('relative rounded-2xl px-5 py-[18px] shadow-xl', NODE_WRAP[d.nodeType])}
      style={{ width: NODE_W, minHeight: NODE_H }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: d.expanding ? 0.5 : 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Handle type="target" position={Position.Left}  style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <p className={cn(
        'leading-snug text-foreground',
        d.nodeType === 'root'   && 'text-[15px] font-bold',
        d.nodeType === 'branch' && 'text-[13px] font-semibold',
        d.nodeType === 'leaf'   && 'text-[12px] font-medium text-foreground/85',
      )}>
        {d.label}
      </p>

      {d.description && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/60 line-clamp-2">
          {d.description}
        </p>
      )}

      {d.canExpand && !d.expanded && (
        <button
          onClick={(e) => { e.stopPropagation(); if (!d.expanding) d.onExpand(); }}
          disabled={d.expanding}
          className={cn(
            'absolute -right-4 top-1/2 -translate-y-1/2 z-20',
            'flex h-7 w-7 items-center justify-center rounded-full',
            'border border-border/60 bg-card text-muted-foreground shadow-lg',
            'transition-all duration-150',
            'hover:border-primary/60 hover:text-primary hover:scale-110 active:scale-95',
            d.expanding && 'pointer-events-none',
          )}
        >
          {d.expanding
            ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            : <Plus     className="h-3.5 w-3.5" />
          }
        </button>
      )}
    </motion.div>
  );
}

const NODE_TYPES = { roadmapNode: RoadmapNodeCmp };

// ─── Canvas ───────────────────────────────────────────────────────────────────

export function RoadmapCanvas({
  idea,
  ideaId,
  initialLoading = true,
}: {
  idea: Idea;
  ideaId: string;
  initialLoading?: boolean;
}) {
  const router  = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Stable ref for expandNode — lets us build initial nodes before expandNode is defined
  const expandNodeRef = useRef<(nodeId: string, nodeLabel: string) => void>(() => {});

  // Sync-read sessionStorage once on mount — skips spinner when cache is warm
  const cachedState = useMemo(() => loadRoadmapState(ideaId), [ideaId]);

  const cachedFlowNodes: Node[] = useMemo(() => cachedState
    ? cachedState.rmNodes.map((rn) => ({
        id:   rn.id,
        type: 'roadmapNode',
        position: cachedState.positions[rn.id] ?? { x: 0, y: 0 },
        data: {
          label:       rn.label,
          nodeType:    rn.type,
          description: rn.description,
          expanded:    cachedState.expandedIds.includes(rn.id),
          expanding:   false,
          canExpand:   rn.type !== 'root',
          onExpand:    () => expandNodeRef.current(rn.id, rn.label),
        } satisfies NodeData,
      }))
    : [], [cachedState]);

  const cachedFlowEdges: Edge[] = useMemo(() => cachedState
    ? cachedState.rmNodes.filter((rn) => rn.parent).map((rn) => mkEdge(rn.parent!, rn.id))
    : [], [cachedState]);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>(cachedFlowNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>(cachedFlowEdges);
  const [loading, setLoading] = useState(cachedState ? false : initialLoading);
  const [error,   setError]   = useState<string | null>(null);

  // Always-fresh refs — avoids stale closures inside node.data callbacks
  const rfNodesRef   = useRef<Node[]>(cachedFlowNodes);
  const rmNodesRef   = useRef<RoadmapNode[]>(cachedState?.rmNodes ?? []);
  const expandedRef  = useRef<Set<string>>(new Set(cachedState?.expandedIds ?? []));
  const busyRef      = useRef<string | null>(null);  // nodeId currently expanding
  const dbSyncedRef  = useRef(false);                // prevent repeat upserts per mount

  // ── State helpers ──────────────────────────────────────────────────────────

  /** Patch a single node's data; keeps rfNodesRef in sync. */
  const patchNode = useCallback((id: string, patch: Partial<NodeData>) => {
    setRfNodes((prev) => {
      const next = prev.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
      );
      rfNodesRef.current = next;
      return next;
    });
  }, [setRfNodes]);

  /** Append new nodes + edges without touching existing positions. */
  const appendToGraph = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setRfNodes((prev) => {
      const next = [...prev, ...newNodes];
      rfNodesRef.current = next;
      return next;
    });
    setRfEdges((prev) => [...prev, ...newEdges]);
  }, [setRfNodes, setRfEdges]);

  /** Snapshot current state to sessionStorage and (if logged in) to DB. */
  const persistState = useCallback(() => {
    const positions: RoadmapState['positions'] = {};
    for (const n of rfNodesRef.current) positions[n.id] = n.position;
    const state: RoadmapState = {
      rmNodes:     rmNodesRef.current,
      positions,
      expandedIds: [...expandedRef.current],
    };
    saveRoadmapState(ideaId, state);
    if (user) {
      upsertRoadmapToDB({ userId: user.id, slug: ideaId, idea, state, bumpTimestamp: true })
        .then(() => window.dispatchEvent(new Event(PLANS_EVENT)));
    }
  }, [ideaId, idea, user]);

  // ── Expand a node ──────────────────────────────────────────────────────────

  const expandNode = useCallback(async (nodeId: string, nodeLabel: string) => {
    if (expandedRef.current.has(nodeId) || busyRef.current !== null) return;

    busyRef.current = nodeId;
    patchNode(nodeId, { expanding: true });

    // Build breadcrumb path for context
    const path: string[] = [nodeLabel];
    let cur = rmNodesRef.current.find((n) => n.id === nodeId);
    while (cur?.parent) {
      cur = rmNodesRef.current.find((n) => n.id === cur!.parent);
      if (cur) path.unshift(cur.label);
    }

    try {
      const res = await fetch('/api/roadmap/expand', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaTitle:  idea.title,
          ideaPitch:  idea.pitch,
          nodeId,
          nodeLabel,
          parentPath: path,
        }),
      });
      if (!res.ok) throw new Error('expand failed');

      const { nodes: newRm }: { nodes: RoadmapNode[] } = await res.json();
      rmNodesRef.current = [...rmNodesRef.current, ...newRm];
      expandedRef.current.add(nodeId);

      // Position children to the right of the parent, centered vertically
      const parent    = rfNodesRef.current.find((n) => n.id === nodeId)!;
      const total     = newRm.length;
      const totalSpan = (total - 1) * CHILD_STEP;

      const newFlowNodes: Node[] = newRm.map((rn, i) => ({
        id:   rn.id,
        type: 'roadmapNode',
        position: {
          x: parent.position.x + NODE_W + CHILD_OFFSET,
          y: parent.position.y + i * CHILD_STEP - totalSpan / 2,
        },
        data: {
          label:       rn.label,
          nodeType:    rn.type,
          description: rn.description,
          expanded:    false,
          expanding:   false,
          canExpand:   rn.type !== 'root',
          onExpand:    () => expandNode(rn.id, rn.label),
        } satisfies NodeData,
      }));

      const newEdges = newRm.map((rn) => mkEdge(rn.parent!, rn.id));

      // Mark parent as expanded (remove "+"), then add children
      patchNode(nodeId, { expanded: true, expanding: false });
      appendToGraph(newFlowNodes, newEdges);
      persistState();

    } catch {
      patchNode(nodeId, { expanding: false });
    } finally {
      busyRef.current = null;
    }
  }, [idea.title, idea.pitch, patchNode, appendToGraph, persistState]);

  // ── Keep expandNodeRef current ─────────────────────────────────────────────

  useEffect(() => { expandNodeRef.current = expandNode; }, [expandNode]);

  // ── Initial load — restore from DB or generate fresh ──────────────────────
  // (sessionStorage restore is handled synchronously at render time above)

  useEffect(() => {
    (async () => {
      try {
        if (cachedState) return; // already initialized from sessionStorage

        // Not in sessionStorage — try DB (logged-in users)
        const dbRow: LoadedRoadmap | null = user
          ? await loadRoadmapFromDB({ userId: user.id, slug: ideaId })
          : null;
        const saved = dbRow?.state ?? null;
        if (dbRow?.state) saveRoadmapState(ideaId, dbRow.state); // warm sessionStorage
        if (saved) {
          rmNodesRef.current = saved.rmNodes;
          expandedRef.current = new Set(saved.expandedIds);

          const flowNodes: Node[] = saved.rmNodes.map((rn) => ({
            id:   rn.id,
            type: 'roadmapNode',
            position: saved.positions[rn.id] ?? { x: 0, y: 0 },
            data: {
              label:       rn.label,
              nodeType:    rn.type,
              description: rn.description,
              expanded:    saved.expandedIds.includes(rn.id),
              expanding:   false,
              canExpand:   rn.type !== 'root',
              onExpand:    () => expandNodeRef.current(rn.id, rn.label),
            } satisfies NodeData,
          }));

          const flowEdges: Edge[] = saved.rmNodes
            .filter((rn) => rn.parent)
            .map((rn) => mkEdge(rn.parent!, rn.id));

          rfNodesRef.current = flowNodes;
          setRfNodes(flowNodes);
          setRfEdges(flowEdges);
          setLoading(false);
          return;
        }

        // No cache — generate from API
        const res = await fetch('/api/roadmap', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ idea }),
        });
        if (!res.ok) throw new Error('Failed to generate roadmap');

        const { nodes }: { nodes: RoadmapNode[] } = await res.json();
        rmNodesRef.current = nodes;

        const flowNodes: Node[] = nodes.map((rn) => ({
          id:   rn.id,
          type: 'roadmapNode',
          position: { x: 0, y: 0 },
          data: {
            label:     rn.label,
            nodeType:  rn.type,
            expanded:  false,
            expanding: false,
            canExpand: rn.type !== 'root',
            onExpand:  () => expandNodeRef.current(rn.id, rn.label),
          } satisfies NodeData,
        }));

        const flowEdges: Edge[] = nodes
          .filter((rn) => rn.parent)
          .map((rn) => mkEdge(rn.parent!, rn.id));

        const laid = dagreLayout(flowNodes, flowEdges);
        rfNodesRef.current = laid;
        setRfNodes(laid);
        setRfEdges(flowEdges);
        // persistState reads rfNodesRef which is now set, so call it directly
        const initialState: RoadmapState = {
          rmNodes:     nodes,
          positions:   Object.fromEntries(laid.map((n) => [n.id, n.position])),
          expandedIds: [],
        };
        saveRoadmapState(ideaId, initialState);
        if (user) {
          upsertRoadmapToDB({ userId: user.id, slug: ideaId, idea, state: initialState, bumpTimestamp: true })
            .then(() => window.dispatchEvent(new Event(PLANS_EVENT)));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    })();
  }, [idea, ideaId, user, cachedState, setRfNodes, setRfEdges]);

  // ── Sync to DB once user is known and graph is ready ─────────────────────
  // Handles the race where generation finishes before auth resolves.

  useEffect(() => {
    if (!user || authLoading || loading || rmNodesRef.current.length === 0) return;
    if (dbSyncedRef.current) return;
    if (cachedState) return; // revisit — DB already has this state, no upsert needed
    dbSyncedRef.current = true;
    const positions: RoadmapState['positions'] = {};
    for (const n of rfNodesRef.current) positions[n.id] = n.position;
    upsertRoadmapToDB({
      userId:         user.id,
      slug:           ideaId,
      idea,
      state:          { rmNodes: rmNodesRef.current, positions, expandedIds: [...expandedRef.current] },
      bumpTimestamp:  false,
    }).then(() => window.dispatchEvent(new Event(PLANS_EVENT)));
  }, [user, authLoading, ideaId, idea, loading]);

  const onConnect = useCallback(
    (params: Connection) => setRfEdges((eds) => addEdge(params, eds)),
    [setRfEdges],
  );

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm">Generating your roadmap…</p>
    </div>
  );

  if (error) return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <p className="text-sm text-muted-foreground">{error}</p>
      <button onClick={() => router.back()} className="text-xs text-primary hover:underline">
        ← Go back
      </button>
    </div>
  );

  // ── Canvas ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255,255,255,0.05)"
        />
        <Controls
          showInteractive={false}
          className="[&>button]:border-border [&>button]:bg-card [&>button]:text-foreground [&>button:hover]:bg-muted"
        />
      </ReactFlow>
    </div>
  );
}

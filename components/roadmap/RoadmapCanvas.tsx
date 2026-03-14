'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
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
  listPlans,
  type RoadmapState,
} from '@/services/storage.service';
import { useRoadmapStore } from '@/stores/roadmap.store';
import { useGetRoadmap, useUpsertRoadmap } from '@/hooks/use-roadmaps';

// ─── Layout constants ─────────────────────────────────────────────────────────

const NODE_W = 244;
const NODE_H = 88;
const CHILD_OFFSET = 260;
const CHILD_STEP = 112;

// ─── Initial dagre layout ─────────────────────────────────────────────────────

function dagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'LR',
    nodesep: 80,
    ranksep: 260,
    marginx: 80,
    marginy: 80,
  });
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
  root: 'bg-primary/[0.18] border-2 border-primary/55 shadow-primary/10',
  branch: 'bg-card border border-border/80 hover:border-border',
  leaf: 'bg-background/50 border border-border/50 hover:border-border/70',
};

// ─── Custom node component ────────────────────────────────────────────────────

function RoadmapNodeCmp({ data }: NodeProps) {
  const d = data as NodeData;

  return (
    <motion.div
      className={cn(
        'relative rounded-2xl px-5 py-[18px] shadow-xl',
        NODE_WRAP[d.nodeType]
      )}
      style={{ width: NODE_W, minHeight: NODE_H }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: d.expanding ? 0.5 : 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <p
        className={cn(
          'leading-snug text-foreground',
          d.nodeType === 'root' && 'text-[15px] font-bold',
          d.nodeType === 'branch' && 'text-[13px] font-semibold',
          d.nodeType === 'leaf' && 'text-[12px] font-medium text-foreground/85'
        )}
      >
        {d.label}
      </p>

      {d.description && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/60 line-clamp-2">
          {d.description}
        </p>
      )}

      {d.canExpand && !d.expanded && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!d.expanding) d.onExpand();
          }}
          disabled={d.expanding}
          className={cn(
            'absolute -right-4 top-1/2 -translate-y-1/2 z-20',
            'flex h-7 w-7 items-center justify-center rounded-full',
            'border border-border/60 bg-card text-muted-foreground shadow-lg',
            'transition-all duration-150',
            'hover:border-primary/60 hover:text-primary hover:scale-110 active:scale-95',
            d.expanding && 'pointer-events-none'
          )}
        >
          {d.expanding ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
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
  userId,
  authLoading = false,
}: {
  idea: Idea;
  ideaId: string;
  initialLoading?: boolean;
  userId: string | undefined;
  authLoading?: boolean;
}) {
  const router = useRouter();
  const store = useRoadmapStore();

  const upsertRoadmap = useUpsertRoadmap(userId);

  const expandNodeRef = useRef<(nodeId: string, nodeLabel: string) => void>(
    () => {}
  );

  const cachedState = useMemo(() => loadRoadmapState(ideaId), [ideaId]);

  const [loading, setLoading] = useState(cachedState ? false : initialLoading);
  const [error, setError] = useState<string | null>(null);

  const freshGenerationRef = useRef(false);
  const dbSyncedRef = useRef(false);

  // DB query — only when no session cache is present
  const { data: dbRoadmap, isFetched: dbFetched } = useGetRoadmap(
    ideaId,
    userId,
    {
      enabled: !cachedState,
    }
  );

  // ── Node / edge builders ───────────────────────────────────────────────────

  function buildFlowNodes(
    rmNodes: RoadmapNode[],
    positions: Record<string, { x: number; y: number }>,
    expandedIds: string[]
  ): Node[] {
    return rmNodes.map((rn) => ({
      id: rn.id,
      type: 'roadmapNode',
      position: positions[rn.id] ?? { x: 0, y: 0 },
      data: {
        label: rn.label,
        nodeType: rn.type,
        description: rn.description,
        expanded: expandedIds.includes(rn.id),
        expanding: false,
        canExpand: rn.type !== 'root',
        onExpand: () => expandNodeRef.current(rn.id, rn.label),
      } satisfies NodeData,
    }));
  }

  function buildFlowEdges(rmNodes: RoadmapNode[]): Edge[] {
    return rmNodes
      .filter((rn) => rn.parent)
      .map((rn) => mkEdge(rn.parent!, rn.id));
  }

  // ── Persist to sessionStorage + DB ────────────────────────────────────────

  const persistState = useCallback(() => {
    const { rfNodes, rmNodes, expandedIds } = useRoadmapStore.getState();
    const positions: RoadmapState['positions'] = {};
    for (const n of rfNodes) positions[n.id] = n.position;
    const state: RoadmapState = { rmNodes, positions, expandedIds };

    saveRoadmapState(ideaId, state);
    upsertRoadmap.mutate({ slug: ideaId, idea, state, bumpTimestamp: true });
    useRoadmapStore.getState().setLocalPlans(listPlans());
  }, [ideaId, idea, upsertRoadmap]);

  // ── Expand a node ──────────────────────────────────────────────────────────

  const expandNode = useCallback(
    async (nodeId: string, nodeLabel: string) => {
      const { expandedIds, busyNodeId, rmNodes, rfNodes } =
        useRoadmapStore.getState();
      if (expandedIds.includes(nodeId) || busyNodeId !== null) return;

      store.setBusy(nodeId);
      store.patchNode(nodeId, { expanding: true });

      const path: string[] = [nodeLabel];
      let cur = rmNodes.find((n) => n.id === nodeId);
      while (cur?.parent) {
        cur = rmNodes.find((n) => n.id === cur!.parent);
        if (cur) path.unshift(cur.label);
      }

      try {
        const res = await fetch('/api/roadmap/expand', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ideaTitle: idea.title,
            ideaPitch: idea.pitch,
            nodeId,
            nodeLabel,
            parentPath: path,
          }),
        });
        if (!res.ok) throw new Error('expand failed');

        const { nodes: newRm }: { nodes: RoadmapNode[] } = await res.json();

        const parent = rfNodes.find((n) => n.id === nodeId)!;
        const total = newRm.length;
        const totalSpan = (total - 1) * CHILD_STEP;

        const newFlowNodes: Node[] = newRm.map((rn, i) => ({
          id: rn.id,
          type: 'roadmapNode',
          position: {
            x: parent.position.x + NODE_W + CHILD_OFFSET,
            y: parent.position.y + i * CHILD_STEP - totalSpan / 2,
          },
          data: {
            label: rn.label,
            nodeType: rn.type,
            description: rn.description,
            expanded: false,
            expanding: false,
            canExpand: rn.type !== 'root',
            onExpand: () => expandNodeRef.current(rn.id, rn.label),
          } satisfies NodeData,
        }));

        store.appendToGraph(
          newFlowNodes,
          newRm.map((rn) => mkEdge(rn.parent!, rn.id)),
          newRm,
          nodeId
        );
        persistState();
      } catch {
        store.patchNode(nodeId, { expanding: false });
      } finally {
        store.setBusy(null);
      }
    },
    [idea.title, idea.pitch, store, persistState]
  );

  useEffect(() => {
    expandNodeRef.current = expandNode;
  }, [expandNode]);

  // ── Init from session cache ────────────────────────────────────────────────

  useEffect(() => {
    if (!cachedState) return;
    const flowNodes = buildFlowNodes(
      cachedState.rmNodes,
      cachedState.positions,
      cachedState.expandedIds
    );
    store.initCanvas({
      ideaId,
      nodes: flowNodes,
      edges: buildFlowEdges(cachedState.rmNodes),
      rmNodes: cachedState.rmNodes,
      expandedIds: cachedState.expandedIds,
    });
    store.setLocalPlans(listPlans());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load from DB or generate fresh ────────────────────────────────────────

  useEffect(() => {
    if (cachedState || freshGenerationRef.current) return;
    if (userId && !dbFetched) return; // wait for DB query

    if (dbRoadmap) {
      const { state } = dbRoadmap;
      saveRoadmapState(ideaId, state);
      store.initCanvas({
        ideaId,
        nodes: buildFlowNodes(
          state.rmNodes,
          state.positions,
          state.expandedIds
        ),
        edges: buildFlowEdges(state.rmNodes),
        rmNodes: state.rmNodes,
        expandedIds: state.expandedIds,
      });
      setLoading(false);
      return;
    }

    freshGenerationRef.current = true;
    (async () => {
      try {
        const res = await fetch('/api/roadmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea }),
        });
        if (!res.ok) throw new Error('Failed to generate roadmap');

        const { nodes }: { nodes: RoadmapNode[] } = await res.json();

        const flowNodes: Node[] = nodes.map((rn) => ({
          id: rn.id,
          type: 'roadmapNode',
          position: { x: 0, y: 0 },
          data: {
            label: rn.label,
            nodeType: rn.type,
            expanded: false,
            expanding: false,
            canExpand: rn.type !== 'root',
            onExpand: () => expandNodeRef.current(rn.id, rn.label),
          } satisfies NodeData,
        }));

        const flowEdges = buildFlowEdges(nodes);
        const laid = dagreLayout(flowNodes, flowEdges);
        const initialState: RoadmapState = {
          rmNodes: nodes,
          positions: Object.fromEntries(laid.map((n) => [n.id, n.position])),
          expandedIds: [],
        };

        saveRoadmapState(ideaId, initialState);
        store.initCanvas({
          ideaId,
          nodes: laid,
          edges: flowEdges,
          rmNodes: nodes,
          expandedIds: [],
        });
        store.setLocalPlans(listPlans());
        upsertRoadmap.mutate({
          slug: ideaId,
          idea,
          state: initialState,
          bumpTimestamp: true,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cachedState, userId, dbFetched, dbRoadmap]);

  // ── DB sync after auth resolves (race condition) ───────────────────────────

  useEffect(() => {
    const { rmNodes, rfNodes, expandedIds } = useRoadmapStore.getState();
    if (!userId || authLoading || loading || rmNodes.length === 0) return;
    if (dbSyncedRef.current || cachedState) return;
    dbSyncedRef.current = true;
    const positions: RoadmapState['positions'] = {};
    for (const n of rfNodes) positions[n.id] = n.position;
    upsertRoadmap.mutate({
      slug: ideaId,
      idea,
      state: { rmNodes, positions, expandedIds },
      bumpTimestamp: false,
    });
  }, [userId, authLoading, loading, ideaId, idea, cachedState, upsertRoadmap]);

  // ── Reset store on unmount ─────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      useRoadmapStore.getState().reset();
    };
  }, [ideaId]);

  const onConnect = useCallback(
    (params: Connection) =>
      useRoadmapStore.setState((state) => ({
        rfEdges: addEdge(params, state.rfEdges),
      })),
    []
  );

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Generating your roadmap…</p>
      </div>
    );

  if (error)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => router.back()}
          className="text-xs text-primary hover:underline"
        >
          ← Go back
        </button>
      </div>
    );

  // ── Canvas ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={store.rfNodes}
        edges={store.rfEdges}
        onNodesChange={store.onNodesChange}
        onEdgesChange={store.onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={() => persistState()}
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

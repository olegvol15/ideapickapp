'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
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
import { Loader2, Plus, Twitter, MessageSquare, SquarePlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import '@xyflow/react/dist/style.css';

import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { typedApi } from '@/lib/api/client';
import type { Idea } from '@/types';
import type { RoadmapNode, RoadmapNodeType, RoadmapNodeStatus } from '@/types/roadmap.types';
import type { ContentType } from '@/types/workspace.types';
import {
  saveRoadmapState,
  loadRoadmapState,
  listPlans,
  type RoadmapState,
} from '@/services/storage.service';
import { useRoadmapStore } from '@/stores/roadmap.store';
import { useGetRoadmap, useUpsertRoadmap } from '@/hooks/use-roadmaps';
import { NodeDetailSheet } from './NodeDetailSheet';
import { CreateNodeDialog } from './CreateNodeDialog';

// ─── Layout constants ─────────────────────────────────────────────────────────

const NODE_W = 244;
const NODE_H = 96;
const CHILD_OFFSET = 260;
const CHILD_STEP = 112;

// ─── Initial dagre layout ─────────────────────────────────────────────────────

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
    style: { stroke: 'rgba(96,165,250,0.35)', strokeWidth: 2 },
  };
}

// ─── Node data type ───────────────────────────────────────────────────────────

interface NodeData {
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

// ─── Node visual styles ───────────────────────────────────────────────────────

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
  'todo': 'bg-muted-foreground/35',
  'in-progress': 'bg-amber-500',
  'done': 'bg-emerald-500',
};

// ─── Custom node component ────────────────────────────────────────────────────

function RoadmapNodeCmp({ id, data }: NodeProps) {
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

      {/* Left accent stripe */}
      <div className={cn('absolute inset-y-0 left-0 w-[3px]', ACCENT_COLOR[d.nodeType])} />

      {/* Status dot */}
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

      {/* Expand button */}
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

      {/* Social action button */}
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

const NODE_TYPES = { roadmapNode: RoadmapNodeCmp };

// ─── Canvas ───────────────────────────────────────────────────────────────────

export function RoadmapCanvas({
  idea,
  ideaId,
  initialLoading = true,
  userId,
  authLoading = false,
  onGenerateContent,
}: {
  idea: Idea;
  ideaId: string;
  initialLoading?: boolean;
  userId: string | undefined;
  authLoading?: boolean;
  onGenerateContent?: (label: string, description: string, actionType: ContentType) => void;
}) {
  const router = useRouter();
  const store = useRoadmapStore();

  const upsertRoadmap = useUpsertRoadmap(userId);

  const expandNodeRef = useRef<(nodeId: string, nodeLabel: string) => void>(() => {});
  const setSelectedNodeRef = useRef<(id: string) => void>(() => {});

  const cachedState = useMemo(() => loadRoadmapState(ideaId), [ideaId]);

  const [loading, setLoading] = useState(cachedState ? false : initialLoading);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const freshGenerationRef = useRef(false);
  const dbSyncedRef = useRef(false);

  const { data: dbRoadmap, isFetched: dbFetched } = useGetRoadmap(ideaId, userId, {
    enabled: !cachedState && !authLoading,
  });

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
        status: rn.status,
        expanded: expandedIds.includes(rn.id),
        expanding: false,
        canExpand: rn.type === 'branch',
        actionType: rn.actionType,
        onExpand: () => expandNodeRef.current(rn.id, rn.label),
        onSelect: () => setSelectedNodeRef.current(rn.id),
        onGenerateContent:
          rn.actionType && onGenerateContent
            ? () => onGenerateContent(rn.label, rn.description ?? '', rn.actionType as ContentType)
            : undefined,
      } satisfies NodeData,
    }));
  }

  function buildFlowEdges(rmNodes: RoadmapNode[]): Edge[] {
    return rmNodes.filter((rn) => rn.parent).map((rn) => mkEdge(rn.parent!, rn.id));
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
      const { expandedIds, busyNodeId, rmNodes, rfNodes } = useRoadmapStore.getState();
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
        const { nodes: newRm } = await typedApi.post<{ nodes: RoadmapNode[] }>(
          '/api/roadmap/expand',
          { ideaTitle: idea.title, ideaPitch: idea.pitch, nodeId, nodeLabel, parentPath: path }
        );

        const parent = rfNodes.find((n) => n.id === nodeId);
        if (!parent) {
          store.patchNode(nodeId, { expanding: false });
          return;
        }
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
            status: rn.status,
            expanded: false,
            expanding: false,
            canExpand: rn.type === 'branch',
            actionType: rn.actionType,
            onExpand: () => expandNodeRef.current(rn.id, rn.label),
            onSelect: () => setSelectedNodeRef.current(rn.id),
            onGenerateContent:
              rn.actionType && onGenerateContent
                ? () => onGenerateContent(rn.label, rn.description ?? '', rn.actionType as ContentType)
                : undefined,
          } satisfies NodeData,
        }));

        store.appendToGraph(newFlowNodes, newRm.map((rn) => mkEdge(rn.parent!, rn.id)), newRm, nodeId);
        persistState();
      } catch {
        toast.error('Failed to expand this step. Please try again.');
        store.patchNode(nodeId, { expanding: false });
      } finally {
        store.setBusy(null);
      }
    },
    [idea.title, idea.pitch, store, persistState, onGenerateContent]
  );

  useEffect(() => {
    expandNodeRef.current = expandNode;
  }, [expandNode]);

  useEffect(() => {
    setSelectedNodeRef.current = store.setSelectedNode;
  }, [store.setSelectedNode]);

  // ── Handle node update (label / description) ──────────────────────────────

  const handleUpdateNode = useCallback(
    (nodeId: string, patch: { label: string; description: string }) => {
      store.patchNode(nodeId, patch);
      useRoadmapStore.setState((s) => ({
        rmNodes: s.rmNodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)),
      }));
      persistState();
    },
    [store, persistState]
  );

  // ── Handle node delete ─────────────────────────────────────────────────────

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      store.deleteNode(nodeId);
      persistState();
    },
    [store, persistState]
  );

  // ── Handle status change from detail sheet ─────────────────────────────────

  const handleStatusChange = useCallback(
    (nodeId: string, status: RoadmapNodeStatus) => {
      store.patchNode(nodeId, { status });
      useRoadmapStore.setState((s) => ({
        rmNodes: s.rmNodes.map((n) => (n.id === nodeId ? { ...n, status } : n)),
      }));
      persistState();
    },
    [store, persistState]
  );

  // ── Handle manual node creation ────────────────────────────────────────────

  const handleAddNode = useCallback(
    (rmNode: RoadmapNode) => {
      const { rfNodes } = useRoadmapStore.getState();
      const parentRfNode = rmNode.parent ? rfNodes.find((n) => n.id === rmNode.parent) : undefined;

      const maxX = rfNodes.length > 0 ? Math.max(...rfNodes.map((n) => n.position.x)) : 0;
      const position = parentRfNode
        ? { x: parentRfNode.position.x + NODE_W + CHILD_OFFSET, y: parentRfNode.position.y }
        : { x: maxX + NODE_W + 60, y: 200 };

      const rfNode: Node = {
        id: rmNode.id,
        type: 'roadmapNode',
        position,
        data: {
          label: rmNode.label,
          nodeType: rmNode.type,
          description: rmNode.description,
          status: rmNode.status,
          expanded: false,
          expanding: false,
          canExpand: rmNode.type !== 'root',
          actionType: rmNode.actionType,
          onExpand: () => expandNodeRef.current(rmNode.id, rmNode.label),
          onSelect: () => setSelectedNodeRef.current(rmNode.id),
          onGenerateContent: undefined,
        } satisfies NodeData,
      };

      const rfEdge = rmNode.parent ? mkEdge(rmNode.parent, rmNode.id) : null;
      store.addNode(rfNode, rfEdge, rmNode);
      persistState();
    },
    [store, persistState]
  );

  // ── Init from session cache ────────────────────────────────────────────────

  useEffect(() => {
    if (!cachedState) return;
    const flowNodes = buildFlowNodes(cachedState.rmNodes, cachedState.positions, cachedState.expandedIds);
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
    if (authLoading) return;
    if (userId && !dbFetched) return;

    if (dbRoadmap) {
      const { state } = dbRoadmap;
      saveRoadmapState(ideaId, state);
      store.initCanvas({
        ideaId,
        nodes: buildFlowNodes(state.rmNodes, state.positions, state.expandedIds),
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
        const { nodes } = await typedApi.post<{ nodes: RoadmapNode[] }>('/api/roadmap', { idea });

        const flowNodes: Node[] = nodes.map((rn) => ({
          id: rn.id,
          type: 'roadmapNode',
          position: { x: 0, y: 0 },
          data: {
            label: rn.label,
            nodeType: rn.type,
            description: rn.description,
            status: rn.status,
            expanded: false,
            expanding: false,
            canExpand: rn.type === 'branch',
            actionType: rn.actionType,
            onExpand: () => expandNodeRef.current(rn.id, rn.label),
            onSelect: () => setSelectedNodeRef.current(rn.id),
            onGenerateContent:
              rn.actionType && onGenerateContent
                ? () => onGenerateContent(rn.label, rn.description ?? '', rn.actionType as ContentType)
                : undefined,
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
        store.initCanvas({ ideaId, nodes: laid, edges: flowEdges, rmNodes: nodes, expandedIds: [] });
        store.setLocalPlans(listPlans());
        upsertRoadmap.mutate({ slug: ideaId, idea, state: initialState, bumpTimestamp: true });
      } catch {
        setError('Failed to generate roadmap.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cachedState, userId, dbFetched, dbRoadmap, authLoading]);

  // ── DB sync after auth resolves ────────────────────────────────────────────

  useEffect(() => {
    const { rmNodes, rfNodes, expandedIds } = useRoadmapStore.getState();
    if (!userId || authLoading || loading || rmNodes.length === 0) return;
    if (dbSyncedRef.current || cachedState) return;
    dbSyncedRef.current = true;
    const positions: RoadmapState['positions'] = {};
    for (const n of rfNodes) positions[n.id] = n.position;
    upsertRoadmap.mutate({ slug: ideaId, idea, state: { rmNodes, positions, expandedIds }, bumpTimestamp: false });
  }, [userId, authLoading, loading, ideaId, idea, cachedState, upsertRoadmap]);

  // ── Reset store on unmount ─────────────────────────────────────────────────

  useEffect(() => {
    return () => { useRoadmapStore.getState().reset(); };
  }, [ideaId]);

  const onConnect = useCallback(
    (params: Connection) =>
      useRoadmapStore.setState((state) => ({ rfEdges: addEdge(params, state.rfEdges) })),
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
        <Button variant="link" size="sm" onClick={() => router.back()}>
          ← Go back
        </Button>
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
        onNodeClick={(_e, node) => store.setSelectedNode(node.id)}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.04)" />
        <Controls
          showInteractive={false}
          className="[&>button]:border-border [&>button]:bg-card [&>button]:text-foreground [&>button:hover]:bg-muted"
        />
        <Panel position="top-right" className="m-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCreateDialogOpen(true)}
            className="gap-1.5 bg-card/80 backdrop-blur-sm shadow-sm"
          >
            <SquarePlus className="h-3.5 w-3.5" />
            New Step
          </Button>
        </Panel>
      </ReactFlow>

      <NodeDetailSheet
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteNode}
        onUpdate={handleUpdateNode}
      />
      <CreateNodeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleAddNode}
      />
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { Loader2, Plus, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import '@xyflow/react/dist/style.css';

import { cn } from '@/lib/utils';
import type { Idea } from '@/types';
import type { RoadmapNode, RoadmapNodeType } from '@/types/roadmap.types';

// ─── Layout ───────────────────────────────────────────────────────────────────

const NODE_WIDTH  = 200;
const NODE_HEIGHT = 64;

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 56, ranksep: 160, marginx: 40, marginy: 40 });

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  return nodes.map((n) => {
    const { x, y } = g.node(n.id);
    return { ...n, position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 } };
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roadmapNodesToFlow(
  roadmapNodes: RoadmapNode[],
  expandedIds: Set<string>,
  expandingId: string | null,
  onExpand: (id: string, label: string, type: RoadmapNodeType) => void
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = roadmapNodes.map((rn) => ({
    id: rn.id,
    type: 'roadmapNode',
    position: { x: 0, y: 0 },
    data: {
      label: rn.label,
      nodeType: rn.type,
      description: rn.description,
      isExpanded: expandedIds.has(rn.id),
      isExpanding: expandingId === rn.id,
      canExpand: rn.type !== 'root',
      onExpand: () => onExpand(rn.id, rn.label, rn.type),
    },
  }));

  const edges: Edge[] = roadmapNodes
    .filter((rn) => rn.parent)
    .map((rn) => ({
      id: `e-${rn.parent}-${rn.id}`,
      source: rn.parent!,
      target: rn.id,
      type: 'smoothstep',
      style: { stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1.5 },
    }));

  return { nodes, edges };
}

// ─── Custom Node ──────────────────────────────────────────────────────────────

const NODE_STYLES: Record<RoadmapNodeType, string> = {
  root:   'bg-primary/20 border-primary/50 text-foreground font-bold text-base min-w-[180px]',
  branch: 'bg-card border-border/60 text-foreground font-semibold',
  leaf:   'bg-background/60 border-border/40 text-foreground/80 text-sm',
};

interface RoadmapNodeData {
  label: string;
  nodeType: RoadmapNodeType;
  description?: string;
  isExpanded: boolean;
  isExpanding: boolean;
  canExpand: boolean;
  onExpand: () => void;
  [key: string]: unknown;
}

function RoadmapNodeComponent({ data }: NodeProps) {
  const d = data as RoadmapNodeData;
  const nodeType = d.nodeType;
  return (
    <div
      className={cn(
        'relative rounded-xl border px-4 py-2.5 shadow-md transition-shadow hover:shadow-lg',
        NODE_STYLES[nodeType]
      )}
      style={{ minWidth: NODE_WIDTH, maxWidth: NODE_WIDTH }}
    >
      <Handle type="target" position={Position.Left}  style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <p className="leading-snug">{d.label}</p>
      {d.description && (
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground line-clamp-2">
          {d.description}
        </p>
      )}

      {/* Expand button */}
      {d.canExpand && !d.isExpanded && (
        <button
          onClick={(e) => { e.stopPropagation(); d.onExpand(); }}
          className={cn(
            'absolute -right-3 -bottom-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow transition-colors hover:border-primary/50 hover:text-primary',
            d.isExpanding && 'pointer-events-none'
          )}
        >
          {d.isExpanding ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  );
}

const NODE_TYPES = { roadmapNode: RoadmapNodeComponent };

// ─── Main Canvas ──────────────────────────────────────────────────────────────

interface Props { idea: Idea }

export function RoadmapCanvas({ idea }: Props) {
  const router = useRouter();
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [roadmapNodes, setRoadmapNodes] = useState<RoadmapNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync roadmap nodes → React Flow nodes+edges with layout
  const syncFlow = useCallback(
    (nodes: RoadmapNode[], expanded: Set<string>, expanding: string | null) => {
      const handleExpand = (id: string, label: string, type: RoadmapNodeType) => {
        expandNode(id, label, type, nodes);
      };
      const { nodes: rfN, edges: rfE } = roadmapNodesToFlow(nodes, expanded, expanding, handleExpand);
      const laid = applyDagreLayout(rfN, rfE);
      setRfNodes(laid);
      setRfEdges(rfE);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Generate initial roadmap
  useEffect(() => {
    async function generate() {
      try {
        const res = await fetch('/api/roadmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea }),
        });
        if (!res.ok) throw new Error('Failed to generate roadmap');
        const { nodes } = await res.json();
        setRoadmapNodes(nodes);
        syncFlow(nodes, new Set(), null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    generate();
  }, [idea, syncFlow]);

  async function expandNode(
    nodeId: string,
    nodeLabel: string,
    nodeType: RoadmapNodeType,
    currentNodes: RoadmapNode[]
  ) {
    if (expandedIds.has(nodeId)) return;

    setExpandingId(nodeId);

    // Build path for context
    const pathLabels: string[] = [nodeLabel];
    let cur = currentNodes.find((n) => n.id === nodeId);
    while (cur?.parent) {
      cur = currentNodes.find((n) => n.id === cur!.parent);
      if (cur) pathLabels.unshift(cur.label);
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
          parentPath: pathLabels,
        }),
      });
      if (!res.ok) throw new Error('Expand failed');
      const { nodes: newNodes } = await res.json() as { nodes: RoadmapNode[] };

      const merged = [...currentNodes, ...newNodes];
      const nextExpanded = new Set([...expandedIds, nodeId]);

      setRoadmapNodes(merged);
      setExpandedIds(nextExpanded);
      setExpandingId(null);
      syncFlow(merged, nextExpanded, null);
    } catch {
      setExpandingId(null);
    }
  }

  const onConnect = useCallback(
    (params: Connection) => setRfEdges((eds) => addEdge(params, eds)),
    [setRfEdges]
  );

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Generating your roadmap…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">{error}</p>
        <button onClick={() => router.back()} className="text-xs text-primary hover:underline">
          ← Go back
        </button>
      </div>
    );
  }

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
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.05)" />
        <Controls
          showInteractive={false}
          className="[&>button]:border-border [&>button]:bg-card [&>button]:text-foreground [&>button:hover]:bg-muted"
        />
      </ReactFlow>
    </div>
  );
}

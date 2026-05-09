'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  addEdge,
  BackgroundVariant,
  type Node,
  type Connection,
} from '@xyflow/react';
import { Loader2, SquarePlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import '@xyflow/react/dist/style.css';

import { toast } from 'sonner';
import { typedApi } from '@/lib/api/client';
import type { Idea } from '@/types';
import type { RoadmapNode, RoadmapNodeStatus } from '@/types/roadmap.types';
import type { ContentType } from '@/types/workspace.types';
import {
  saveRoadmapState,
  loadRoadmapState,
  listPlans,
  type RoadmapState,
} from '@/services/storage.service';
import { useRoadmapStore } from '@/stores/roadmap.store';
import { useGetRoadmap, useUpsertRoadmap } from '@/hooks/use-roadmaps';
import { RoadmapNode as RoadmapNodeCmp, NODE_W } from './RoadmapNode';
import {
  CHILD_OFFSET,
  CHILD_STEP,
  dagreLayout,
  mkEdge,
  buildFlowEdges,
  buildFlowNodes,
  buildNodeData,
  type NodeCallbacks,
} from './roadmap-layout';
import { NodeDetailSheet } from './NodeDetailSheet';
import { CreateNodeDialog } from './CreateNodeDialog';

const NODE_TYPES = { roadmapNode: RoadmapNodeCmp };

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
  const selectNodeRef = useRef<(id: string) => void>(() => {});

  const callbacks: NodeCallbacks = { expandNodeRef, selectNodeRef, onGenerateContent };

  const cachedState = useMemo(() => loadRoadmapState(ideaId), [ideaId]);

  const [loading, setLoading] = useState(cachedState ? false : initialLoading);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const freshGenerationRef = useRef(false);
  const dbSyncedRef = useRef(false);

  const { data: dbRoadmap, isFetched: dbFetched } = useGetRoadmap(ideaId, userId, {
    enabled: !cachedState && !authLoading,
  });

  const persistState = useCallback(() => {
    const { rfNodes, rmNodes, expandedIds } = useRoadmapStore.getState();
    const positions: RoadmapState['positions'] = {};
    for (const n of rfNodes) positions[n.id] = n.position;
    const state: RoadmapState = { rmNodes, positions, expandedIds };
    saveRoadmapState(ideaId, state);
    upsertRoadmap.mutate({ slug: ideaId, idea, state, bumpTimestamp: true });
    useRoadmapStore.getState().setLocalPlans(listPlans());
  }, [ideaId, idea, upsertRoadmap]);

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

        const totalSpan = (newRm.length - 1) * CHILD_STEP;
        const newFlowNodes: Node[] = newRm.map((rn, i) => ({
          id: rn.id,
          type: 'roadmapNode',
          position: {
            x: parent.position.x + NODE_W + CHILD_OFFSET,
            y: parent.position.y + i * CHILD_STEP - totalSpan / 2,
          },
          data: buildNodeData(rn, false, callbacks),
        }));

        store.appendToGraph(
          newFlowNodes,
          newRm.map((rn) => mkEdge(rn.parent!, rn.id)),
          newRm,
          nodeId
        );
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

  useEffect(() => { expandNodeRef.current = expandNode; }, [expandNode]);
  useEffect(() => { selectNodeRef.current = store.setSelectedNode; }, [store.setSelectedNode]);

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

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      store.deleteNode(nodeId);
      persistState();
    },
    [store, persistState]
  );

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

  const handleAddNode = useCallback(
    (rmNode: RoadmapNode) => {
      const { rfNodes } = useRoadmapStore.getState();
      const parentRfNode = rmNode.parent
        ? rfNodes.find((n) => n.id === rmNode.parent)
        : undefined;

      const maxX = rfNodes.length > 0 ? Math.max(...rfNodes.map((n) => n.position.x)) : 0;
      const position = parentRfNode
        ? { x: parentRfNode.position.x + NODE_W + CHILD_OFFSET, y: parentRfNode.position.y }
        : { x: maxX + NODE_W + 60, y: 200 };

      const rfNode: Node = {
        id: rmNode.id,
        type: 'roadmapNode',
        position,
        data: buildNodeData(rmNode, false, callbacks, {
          canExpand: rmNode.type !== 'root',
          onGenerateContent: undefined,
        }),
      };

      const rfEdge = rmNode.parent ? mkEdge(rmNode.parent, rmNode.id) : null;
      store.addNode(rfNode, rfEdge, rmNode);
      persistState();
    },
    [store, persistState, onGenerateContent]
  );

  // Init from session cache
  useEffect(() => {
    if (!cachedState) return;
    store.initCanvas({
      ideaId,
      nodes: buildFlowNodes(cachedState.rmNodes, cachedState.positions, cachedState.expandedIds, callbacks),
      edges: buildFlowEdges(cachedState.rmNodes),
      rmNodes: cachedState.rmNodes,
      expandedIds: cachedState.expandedIds,
    });
    store.setLocalPlans(listPlans());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load from DB or generate fresh
  useEffect(() => {
    if (cachedState || freshGenerationRef.current) return;
    if (authLoading) return;
    if (userId && !dbFetched) return;

    if (dbRoadmap) {
      const { state } = dbRoadmap;
      saveRoadmapState(ideaId, state);
      store.initCanvas({
        ideaId,
        nodes: buildFlowNodes(state.rmNodes, state.positions, state.expandedIds, callbacks),
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

        const flowNodes = nodes.map((rn) => ({
          id: rn.id,
          type: 'roadmapNode' as const,
          position: { x: 0, y: 0 },
          data: buildNodeData(rn, false, callbacks),
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

  // DB sync after auth resolves
  useEffect(() => {
    const { rmNodes, rfNodes, expandedIds } = useRoadmapStore.getState();
    if (!userId || authLoading || loading || rmNodes.length === 0) return;
    if (dbSyncedRef.current || cachedState) return;
    dbSyncedRef.current = true;
    const positions: RoadmapState['positions'] = {};
    for (const n of rfNodes) positions[n.id] = n.position;
    upsertRoadmap.mutate({ slug: ideaId, idea, state: { rmNodes, positions, expandedIds }, bumpTimestamp: false });
  }, [userId, authLoading, loading, ideaId, idea, cachedState, upsertRoadmap]);

  // Reset store on unmount
  useEffect(() => {
    return () => { useRoadmapStore.getState().reset(); };
  }, [ideaId]);

  const onConnect = useCallback(
    (params: Connection) =>
      useRoadmapStore.setState((state) => ({ rfEdges: addEdge(params, state.rfEdges) })),
    []
  );

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

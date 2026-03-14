import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import type { RoadmapNode } from '@/types/roadmap.types';
import type { PlanEntry } from '@/services/storage.service';

interface RoadmapStoreState {
  ideaId: string | null;
  rfNodes: Node[];
  rfEdges: Edge[];
  rmNodes: RoadmapNode[];
  expandedIds: string[];
  busyNodeId: string | null;
  localPlans: PlanEntry[];

  initCanvas: (params: {
    ideaId: string;
    nodes: Node[];
    edges: Edge[];
    rmNodes: RoadmapNode[];
    expandedIds: string[];
  }) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  patchNode: (id: string, patch: Record<string, unknown>) => void;
  appendToGraph: (
    nodes: Node[],
    edges: Edge[],
    newRmNodes: RoadmapNode[],
    expandedId: string
  ) => void;
  setBusy: (id: string | null) => void;
  setLocalPlans: (plans: PlanEntry[]) => void;
  reset: () => void;
}

export const useRoadmapStore = create<RoadmapStoreState>()((set) => ({
  ideaId: null,
  rfNodes: [],
  rfEdges: [],
  rmNodes: [],
  expandedIds: [],
  busyNodeId: null,
  localPlans: [],

  initCanvas: ({ ideaId, nodes, edges, rmNodes, expandedIds }) =>
    set({ ideaId, rfNodes: nodes, rfEdges: edges, rmNodes, expandedIds }),

  onNodesChange: (changes) =>
    set((state) => ({ rfNodes: applyNodeChanges(changes, state.rfNodes) })),

  onEdgesChange: (changes) =>
    set((state) => ({ rfEdges: applyEdgeChanges(changes, state.rfEdges) })),

  patchNode: (id, patch) =>
    set((state) => ({
      rfNodes: state.rfNodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
      ),
    })),

  appendToGraph: (nodes, edges, newRmNodes, expandedId) =>
    set((state) => ({
      rfNodes: [
        ...state.rfNodes.map((n) =>
          n.id === expandedId
            ? { ...n, data: { ...n.data, expanded: true, expanding: false } }
            : n
        ),
        ...nodes,
      ],
      rfEdges: [...state.rfEdges, ...edges],
      rmNodes: [...state.rmNodes, ...newRmNodes],
      expandedIds: [...state.expandedIds, expandedId],
    })),

  setBusy: (id) => set({ busyNodeId: id }),

  setLocalPlans: (plans) => set({ localPlans: plans }),

  reset: () =>
    set({
      ideaId: null,
      rfNodes: [],
      rfEdges: [],
      rmNodes: [],
      expandedIds: [],
      busyNodeId: null,
    }),
}));

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

export interface StoreSnapshot {
  rfNodes: Node[];
  rfEdges: Edge[];
  rmNodes: RoadmapNode[];
  expandedIds: string[];
  collapsedIds: string[];
  savedPositions: Record<string, { x: number; y: number }>;
}

interface RoadmapStoreState {
  ideaId: string | null;
  rfNodes: Node[];
  rfEdges: Edge[];
  rmNodes: RoadmapNode[];
  expandedIds: string[];
  collapsedIds: string[];
  savedPositions: Record<string, { x: number; y: number }>;
  busyNodeId: string | null;
  localPlans: PlanEntry[];
  selectedNodeId: string | null;

  initCanvas: (params: {
    ideaId: string;
    nodes: Node[];
    edges: Edge[];
    rmNodes: RoadmapNode[];
    expandedIds: string[];
    collapsedIds: string[];
    savedPositions: Record<string, { x: number; y: number }>;
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
  setSelectedNode: (id: string | null) => void;
  addNode: (rfNode: Node, rfEdge: Edge | null, rmNode: RoadmapNode) => void;
  deleteNode: (id: string) => void;
  collapseNode: (id: string) => void;
  uncollapseNode: (id: string, newRfNodes: Node[], newRfEdges: Edge[]) => void;
  restoreSubtree: (snapshot: StoreSnapshot) => void;
  reset: () => void;
}

export const useRoadmapStore = create<RoadmapStoreState>()((set) => ({
  ideaId: null,
  rfNodes: [],
  rfEdges: [],
  rmNodes: [],
  expandedIds: [],
  collapsedIds: [],
  savedPositions: {},
  busyNodeId: null,
  localPlans: [],
  selectedNodeId: null,

  initCanvas: ({ ideaId, nodes, edges, rmNodes, expandedIds, collapsedIds, savedPositions }) =>
    set({ ideaId, rfNodes: nodes, rfEdges: edges, rmNodes, expandedIds, collapsedIds, savedPositions }),

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

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  addNode: (rfNode, rfEdge, rmNode) =>
    set((s) => ({
      rfNodes: [...s.rfNodes, rfNode],
      rfEdges: rfEdge ? [...s.rfEdges, rfEdge] : s.rfEdges,
      rmNodes: [...s.rmNodes, rmNode],
    })),

  deleteNode: (id) =>
    set((s) => {
      const toDelete = new Set<string>();
      const queue = [id];
      while (queue.length) {
        const cur = queue.shift()!;
        toDelete.add(cur);
        s.rmNodes.forEach((n) => {
          if (n.parent === cur && !toDelete.has(n.id)) queue.push(n.id);
        });
      }
      const newSavedPositions = { ...s.savedPositions };
      toDelete.forEach((did) => delete newSavedPositions[did]);
      return {
        rfNodes: s.rfNodes.filter((n) => !toDelete.has(n.id)),
        rfEdges: s.rfEdges.filter((e) => !toDelete.has(e.source) && !toDelete.has(e.target)),
        rmNodes: s.rmNodes.filter((n) => !toDelete.has(n.id)),
        expandedIds: s.expandedIds.filter((eid) => !toDelete.has(eid)),
        collapsedIds: s.collapsedIds.filter((cid) => !toDelete.has(cid)),
        savedPositions: newSavedPositions,
        selectedNodeId: toDelete.has(s.selectedNodeId ?? '') ? null : s.selectedNodeId,
      };
    }),

  collapseNode: (id) =>
    set((s) => {
      const toHide = new Set<string>();
      const queue = [id];
      while (queue.length) {
        const cur = queue.shift()!;
        s.rmNodes.forEach((n) => {
          if (n.parent === cur && !toHide.has(n.id)) {
            toHide.add(n.id);
            queue.push(n.id);
          }
        });
      }
      const newSavedPositions = { ...s.savedPositions };
      s.rfNodes.forEach((n) => {
        if (toHide.has(n.id)) newSavedPositions[n.id] = n.position;
      });
      return {
        rfNodes: s.rfNodes
          .filter((n) => !toHide.has(n.id))
          .map((n) => n.id === id ? { ...n, data: { ...n.data, collapsed: true } } : n),
        rfEdges: s.rfEdges.filter((e) => !toHide.has(e.source) && !toHide.has(e.target)),
        collapsedIds: [...s.collapsedIds, id],
        savedPositions: newSavedPositions,
      };
    }),

  uncollapseNode: (id, newRfNodes, newRfEdges) =>
    set((s) => {
      const newSavedPositions = { ...s.savedPositions };
      newRfNodes.forEach((n) => delete newSavedPositions[n.id]);
      return {
        rfNodes: [
          ...s.rfNodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, collapsed: false } } : n
          ),
          ...newRfNodes,
        ],
        rfEdges: [...s.rfEdges, ...newRfEdges],
        collapsedIds: s.collapsedIds.filter((cid) => cid !== id),
        savedPositions: newSavedPositions,
      };
    }),

  restoreSubtree: (snapshot) =>
    set({
      rfNodes: snapshot.rfNodes,
      rfEdges: snapshot.rfEdges,
      rmNodes: snapshot.rmNodes,
      expandedIds: snapshot.expandedIds,
      collapsedIds: snapshot.collapsedIds,
      savedPositions: snapshot.savedPositions,
    }),

  reset: () =>
    set({
      ideaId: null,
      rfNodes: [],
      rfEdges: [],
      rmNodes: [],
      expandedIds: [],
      collapsedIds: [],
      savedPositions: {},
      busyNodeId: null,
      selectedNodeId: null,
    }),
}));

import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';
import type { MutableRefObject } from 'react';
import type { RoadmapNode } from '@/types/roadmap.types';
import type { ContentType } from '@/types/workspace.types';
import type { NodeData } from './RoadmapNode';
import { NODE_W, NODE_H } from './RoadmapNode';

export const CHILD_OFFSET = 260;
export const CHILD_STEP = 112;

export interface NodeCallbacks {
  expandNodeRef: MutableRefObject<(nodeId: string, nodeLabel: string) => void>;
  selectNodeRef: MutableRefObject<(id: string) => void>;
  collapseNodeRef: MutableRefObject<(nodeId: string) => void>;
  onGenerateContent?: (label: string, description: string, actionType: ContentType) => void;
}

export function computeHiddenIds(rmNodes: RoadmapNode[], collapsedIds: string[]): Set<string> {
  const hidden = new Set<string>();
  for (const cid of collapsedIds) {
    const queue = [cid];
    while (queue.length) {
      const cur = queue.shift()!;
      rmNodes.forEach((n) => {
        if (n.parent === cur && !hidden.has(n.id)) {
          hidden.add(n.id);
          queue.push(n.id);
        }
      });
    }
  }
  return hidden;
}

export function dagreLayout(nodes: Node[], edges: Edge[]): Node[] {
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

export function mkEdge(source: string, target: string): Edge {
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    type: 'smoothstep',
    style: { stroke: 'rgba(96,165,250,0.35)', strokeWidth: 2 },
  };
}

export function buildFlowEdges(rmNodes: RoadmapNode[], hiddenIds: Set<string> = new Set()): Edge[] {
  return rmNodes
    .filter((rn) => rn.parent && !hiddenIds.has(rn.id))
    .map((rn) => mkEdge(rn.parent!, rn.id));
}

export function buildNodeData(
  rn: RoadmapNode,
  expanded: boolean,
  callbacks: NodeCallbacks,
  options?: { canExpand?: boolean; onGenerateContent?: () => void; collapsed?: boolean }
): NodeData {
  const { expandNodeRef, selectNodeRef, collapseNodeRef, onGenerateContent } = callbacks;
  return {
    label: rn.label,
    nodeType: rn.type,
    description: rn.description,
    status: rn.status,
    expanded,
    expanding: false,
    collapsed: options?.collapsed ?? false,
    canExpand: options?.canExpand ?? rn.type === 'branch',
    actionType: rn.actionType,
    onExpand: () => expandNodeRef.current(rn.id, rn.label),
    onSelect: () => selectNodeRef.current(rn.id),
    onCollapse: () => collapseNodeRef.current(rn.id),
    onGenerateContent:
      options?.onGenerateContent !== undefined
        ? options.onGenerateContent
        : rn.actionType && onGenerateContent
          ? () => onGenerateContent(rn.label, rn.description ?? '', rn.actionType as ContentType)
          : undefined,
  };
}

export function buildFlowNodes(
  rmNodes: RoadmapNode[],
  positions: Record<string, { x: number; y: number }>,
  expandedIds: string[],
  collapsedIds: string[],
  callbacks: NodeCallbacks
): Node[] {
  const hiddenIds = computeHiddenIds(rmNodes, collapsedIds);
  return rmNodes
    .filter((rn) => !hiddenIds.has(rn.id))
    .map((rn) => ({
      id: rn.id,
      type: 'roadmapNode',
      position: positions[rn.id] ?? { x: 0, y: 0 },
      data: buildNodeData(rn, expandedIds.includes(rn.id), callbacks, {
        collapsed: collapsedIds.includes(rn.id),
      }) satisfies NodeData,
    }));
}

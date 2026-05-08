export type RoadmapNodeType = 'root' | 'branch' | 'leaf';
export type RoadmapNodeStatus = 'todo' | 'in-progress' | 'done';

export interface RoadmapNode {
  id: string;
  label: string;
  type: RoadmapNodeType;
  parent?: string;
  description?: string;
  actionType?: 'tweet' | 'reddit' | null;
  status?: RoadmapNodeStatus;
}

export interface RoadmapGraph {
  nodes: RoadmapNode[];
}

export interface ExpandRequest {
  ideaTitle: string;
  ideaPitch: string;
  nodeId: string;
  nodeLabel: string;
  parentPath: string[];
}

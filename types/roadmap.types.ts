export type RoadmapNodeType = 'root' | 'branch' | 'leaf';

export interface RoadmapNode {
  id: string;
  label: string;
  type: RoadmapNodeType;
  parent?: string;
  description?: string;
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

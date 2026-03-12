import type { Idea } from '@/types';
import type { RoadmapNode } from '@/types/roadmap.types';

export function buildRoadmapMessages(idea: Idea) {
  return [
    {
      role: 'system' as const,
      content: `You are a startup planning expert. Generate a strategic mindmap graph for building a product idea.
Return ONLY valid JSON with this exact structure:
{
  "nodes": [
    { "id": "root", "label": "<idea title>", "type": "root" },
    { "id": "<slug>", "label": "<3-5 word label>", "type": "branch", "parent": "root" },
    { "id": "<slug>", "label": "<3-5 word label>", "type": "leaf", "parent": "<branch-id>", "description": "<1 sentence>" }
  ]
}
Rules:
- IDs must be unique short slug strings (e.g. "mvp-core", "auth-system")
- Generate 5-6 strategic branch nodes off the root
- Generate 2-3 leaf nodes per branch
- Branch labels: short strategic areas (MVP Core, Go-to-Market, Revenue Model, Tech Foundation, Key Risks, First Users)
- Leaf labels: specific actionable items (3-5 words)
- Descriptions: 1 sentence, only on leaf nodes`,
    },
    {
      role: 'user' as const,
      content: `Idea: ${idea.title}
Pitch: ${idea.pitch}
Audience: ${idea.audience}
Problem: ${idea.problem}
Differentiation: ${idea.differentiation}`,
    },
  ];
}

export function buildExpandMessages(
  ideaTitle: string,
  ideaPitch: string,
  nodeId: string,
  nodeLabel: string,
  parentPath: string[]
) {
  const pathStr = parentPath.join(' → ');
  return [
    {
      role: 'system' as const,
      content: `You are a startup planning expert. Expand a specific planning node into deeper, actionable sub-items.
Return ONLY valid JSON:
{
  "nodes": [
    { "id": "<unique-slug>", "label": "<3-5 word label>", "type": "leaf", "parent": "${nodeId}", "description": "<1 sentence>" }
  ]
}
Rules:
- IDs must be globally unique — prefix them with "${nodeId}-"
- Generate 3-5 sub-items that are specific and actionable
- Each description is 1 sentence max`,
    },
    {
      role: 'user' as const,
      content: `Startup: ${ideaTitle}
Pitch: ${ideaPitch}
Expand this node: "${nodeLabel}"
Context path: ${pathStr}`,
    },
  ];
}

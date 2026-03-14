import type { Idea } from '@/types';

export function buildRoadmapMessages(idea: Idea) {
  return [
    {
      role: 'system' as const,
      content: `You are a friendly startup coach helping first-time solo founders plan their journey.
Generate a beginner-friendly startup roadmap as a minimal graph with ONLY high-level steps.

Return ONLY valid JSON:
{
  "nodes": [
    { "id": "root", "label": "<idea name, ≤5 words>", "type": "root" },
    { "id": "<slug>", "label": "<3–5 word action>", "type": "branch", "parent": "root" }
  ]
}

Rules:
- Generate a root node and EXACTLY 5 branch nodes — NO leaf nodes at all
- Branches must cover these 5 founder milestones (use natural wording for the idea):
    1. Validate the Idea
    2. Build a Simple MVP
    3. Get First Users
    4. Improve the Product
    5. Start Earning Money
- Branch labels are short plain-English actions (3–5 words), written for a total beginner
- Do NOT include any leaf nodes, descriptions, or technical details in this initial graph
- The user will click "+" on each branch to reveal detailed steps`,
    },
    {
      role: 'user' as const,
      content: `Idea: ${idea.title}\nPitch: ${idea.pitch}`,
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
      content: `You are a friendly startup coach helping first-time solo founders.
Expand a high-level milestone into 3 simple, beginner-friendly action steps.

Return ONLY valid JSON:
{
  "nodes": [
    { "id": "${nodeId}-1", "label": "<3–5 word action>", "type": "leaf", "parent": "${nodeId}", "description": "<one plain sentence>" },
    { "id": "${nodeId}-2", "label": "<3–5 word action>", "type": "leaf", "parent": "${nodeId}", "description": "<one plain sentence>" },
    { "id": "${nodeId}-3", "label": "<3–5 word action>", "type": "leaf", "parent": "${nodeId}", "description": "<one plain sentence>" }
  ]
}

Rules:
- Generate EXACTLY 3 leaf nodes
- IDs must use the prefix "${nodeId}-" followed by a short unique slug
- Labels: short plain-English actions a non-technical solo founder can actually do
  Examples: "Talk to 10 people", "Post in Reddit communities", "Create a landing page",
  "Add a waitlist form", "Launch on Product Hunt", "Send 5 cold DMs", "Charge your first user"
- Descriptions: one sentence, written for a complete beginner — no jargon
- AVOID anything technical or enterprise: no cloud setup, no system architecture, no compliance`,
    },
    {
      role: 'user' as const,
      content: `Startup: ${ideaTitle}\nPitch: ${ideaPitch}\nExpand: "${nodeLabel}"\nContext: ${pathStr}`,
    },
  ];
}

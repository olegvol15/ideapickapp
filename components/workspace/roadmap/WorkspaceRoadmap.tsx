'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { typedApi } from '@/lib/api/client';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { RoadmapCanvas } from '@/components/roadmap/RoadmapCanvas';
import type { Idea } from '@/types';
import type { ContentType } from '@/types/workspace.types';

interface WorkspaceRoadmapProps {
  idea: Idea;
  ideaId: string;
  userId: string | undefined;
  authLoading: boolean;
}

export function WorkspaceRoadmap({ idea, ideaId, userId, authLoading }: WorkspaceRoadmapProps) {
  const { setActiveTab, setPendingContent } = useWorkspaceStore();

  const handleGenerateContent = useCallback(
    async (label: string, description: string, actionType: ContentType) => {
      try {
        const { content } = await typedApi.post<{ content: string }>('/api/content', {
          type: actionType,
          goal: 'validate',
          idea: {
            title: idea.title,
            pitch: idea.pitch,
            audience: idea.audience,
            problem: idea.problem,
          },
          stepContext: `${label}${description ? `: ${description}` : ''}`,
        });
        setPendingContent({ text: content, type: actionType });
        setActiveTab('content');
      } catch {
        toast.error('Failed to generate content. Please try again.');
      }
    },
    [idea, setPendingContent, setActiveTab]
  );

  return (
    <div className="h-full w-full">
      <RoadmapCanvas
        idea={idea}
        ideaId={ideaId}
        userId={userId}
        authLoading={authLoading}
        initialLoading={true}
        onGenerateContent={handleGenerateContent}
      />
    </div>
  );
}

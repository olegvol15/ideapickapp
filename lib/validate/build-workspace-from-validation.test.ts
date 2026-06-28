import { describe, expect, it } from 'vitest';
import type { ActionPlan } from '@/lib/schemas';
import { buildWorkspaceTasks } from './build-workspace-from-validation';

const plan: ActionPlan = {
  nextMoves: ['Ship a landing page', 'Post in r/guitar'],
  unknowns: ['Will they pay?'],
  experiments: [{ title: 'Smoke test', description: 'Run an ad to a waitlist.' }],
  interviewQuestions: ['How do you learn today?', 'What frustrates you?'],
};

describe('buildWorkspaceTasks', () => {
  it('maps each plan section to tasks with the right priorities', () => {
    const tasks = buildWorkspaceTasks(plan);

    // 2 next moves + 1 experiment + 1 unknown + 1 interview task
    expect(tasks).toHaveLength(5);
    expect(tasks.every((t) => t.status === 'todo')).toBe(true);

    const moves = tasks.filter((t) => t.priority === 'high');
    expect(moves.map((t) => t.title)).toContain('Ship a landing page');
    expect(moves.map((t) => t.title)).toContain('Interview customers');

    expect(tasks.find((t) => t.priority === 'medium')?.title).toBe('Smoke test');
    expect(tasks.find((t) => t.priority === 'low')?.title).toBe(
      'Resolve: Will they pay?'
    );
  });

  it('folds interview questions into one task description', () => {
    const interview = buildWorkspaceTasks(plan).find(
      (t) => t.title === 'Interview customers'
    );
    expect(interview?.description).toContain('How do you learn today?');
    expect(interview?.description).toContain('What frustrates you?');
  });

  it('omits the interview task when there are no questions', () => {
    const tasks = buildWorkspaceTasks({ ...plan, interviewQuestions: [] });
    expect(tasks.some((t) => t.title === 'Interview customers')).toBe(false);
  });
});

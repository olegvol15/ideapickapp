import { beforeEach, describe, expect, it } from 'vitest';
import { useValidateStore } from './validate.store';

describe('validation session state', () => {
  beforeEach(() => {
    useValidateStore.getState().resetSession();
  });

  it('keeps active request metadata while validation phases change', () => {
    const request = {
      description: 'Track water consumption',
      productType: 'Mobile App',
      audience: 'Athletes',
      problem: 'Logging water is easy to forget',
    };

    useValidateStore.getState().setActiveRequest(request);
    useValidateStore.getState().setPhase('researching');

    expect(useValidateStore.getState().activeRequest).toEqual(request);
    expect(useValidateStore.getState().phase).toBe('researching');
  });

  it('clears active request metadata when the session is reset', () => {
    useValidateStore.getState().setActiveRequest({
      description: 'Track water consumption',
      productType: 'Mobile App',
    });
    useValidateStore.getState().setPhase('analyzing');

    useValidateStore.getState().resetSession();

    expect(useValidateStore.getState().activeRequest).toBeNull();
    expect(useValidateStore.getState().phase).toBe('idle');
  });

  it('records a reveal as seen once and ignores duplicates', () => {
    const before = useValidateStore.getState().seenReveals.length;

    useValidateStore.getState().markRevealSeen('report-1');
    useValidateStore.getState().markRevealSeen('report-1');

    const { seenReveals } = useValidateStore.getState();
    expect(seenReveals.filter((id) => id === 'report-1')).toHaveLength(1);
    expect(seenReveals.length).toBe(before + 1);
  });

  it('survives a session reset (durable history)', () => {
    useValidateStore.getState().markRevealSeen('report-2');
    useValidateStore.getState().resetSession();

    expect(useValidateStore.getState().seenReveals).toContain('report-2');
  });
});

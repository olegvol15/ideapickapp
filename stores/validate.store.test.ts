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
});

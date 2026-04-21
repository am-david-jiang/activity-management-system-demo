import { validateStepState } from './orchestrator.agent';

describe('validateStepState', () => {
  it('allows the concept step when requirementsResult exists', () => {
    expect(() =>
      validateStepState('concept', {
        requirementsResult: {
          activity: {
            name: '活动',
            startDate: '2026-01-01',
            endDate: '2026-01-02',
            events: [],
          },
          poster: {
            style: '现代简约',
            theme: '海洋蓝',
            language: '中文',
            color: '#0088FF',
            size: '16:9',
            visualConstraints: [],
          },
        },
      }),
    ).not.toThrow();
  });

  it('rejects the prompt step when conceptDirection is missing', () => {
    expect(() =>
      validateStepState('prompt', {
        requirementsResult: {
          activity: {
            name: '活动',
            startDate: '2026-01-01',
            endDate: '2026-01-02',
            events: [],
          },
          poster: {
            style: '现代简约',
            theme: '海洋蓝',
            language: '中文',
            color: '#0088FF',
            size: '16:9',
            visualConstraints: [],
          },
        },
      }),
    ).toThrow('conceptDirection must be set before reaching prompt');
  });
});

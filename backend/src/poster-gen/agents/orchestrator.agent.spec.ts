import { validateStepState } from './orchestrator.agent';

describe('validateStepState', () => {
  const requirementsResult = {
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
  };

  it('allows the concept step when requirementsResult exists', () => {
    expect(() =>
      validateStepState('concept', {
        requirementsResult,
      }),
    ).not.toThrow();
  });

  it('rejects the prompt step when conceptDirection is missing', () => {
    expect(() =>
      validateStepState('prompt', {
        requirementsResult,
      }),
    ).toThrow(
      'conceptDirection or revisionConceptDirection must be set before reaching prompt',
    );
  });

  it('allows the prompt step when revisionConceptDirection exists', () => {
    expect(() =>
      validateStepState('prompt', {
        requirementsResult,
        revisionConceptDirection: {
          style: '清新文艺',
          color_palette: {
            primary: '#00AA88',
            secondary: '#FFFFFF',
            accent: '#FFD700',
          },
          visual_elements: ['树叶', '光斑'],
          layout_hints: '标题居中，信息靠下',
          title_concept: '春日相聚',
        },
      }),
    ).not.toThrow();
  });

  it('requires previous state for the revision step', () => {
    expect(() =>
      validateStepState('revision', {
        requirementsResult,
        revisionRequirements: '把风格改得更明亮一些，并强化活动主题信息',
      }),
    ).toThrow('previousConceptDirection must be set before reaching revision');
  });
});

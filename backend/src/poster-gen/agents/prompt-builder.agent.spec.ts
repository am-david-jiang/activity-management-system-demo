import { buildPromptBuilderInput } from './prompt-builder.agent';

describe('buildPromptBuilderInput', () => {
  const requirements = {
    activity: {
      name: '春日市集',
      startDate: '2026-03-01',
      endDate: '2026-03-02',
      events: [
        {
          name: '手作摊位',
          description: '展示原创手工艺品',
          datetime: '2026-03-01 10:00',
          location: '中心广场',
        },
      ],
    },
    poster: {
      style: '现代简约',
      theme: '春日清新',
      language: '中文',
      color: '#66CC99',
      size: '9:16',
      visualConstraints: ['不要人像'],
    },
  };

  const direction = {
    style: '自然轻盈',
    color_palette: {
      primary: '#66CC99',
      secondary: '#FFF8E7',
      accent: '#FFC857',
    },
    visual_elements: ['叶片', '手作小物', '柔和光感'],
    layout_hints: '标题在上，活动信息居中偏下',
    title_concept: '春日创意漫游',
  };

  it('includes revision context when provided', () => {
    const input = buildPromptBuilderInput(requirements, direction, {
      revisionRequirements: '整体更明亮，标题更醒目，减少装饰元素',
      previousConceptDirection: direction,
      previousImagePrompt: '上一轮提示词',
    });

    expect(input).toContain('## Revision Context');
    expect(input).toContain('整体更明亮，标题更醒目，减少装饰元素');
    expect(input).toContain('上一轮提示词');
    expect(input).toContain('treat this as an edit request');
    expect(input).toContain('Avoid rewriting the whole poster from scratch');
  });

  it('omits revision context when not provided', () => {
    const input = buildPromptBuilderInput(requirements, direction);

    expect(input).not.toContain('## Revision Context');
  });
});

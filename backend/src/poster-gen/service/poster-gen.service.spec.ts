import { PosterGenService } from './poster-gen.service';
import type { OrchestratorState } from '../agents/orchestrator.agent';
import type { WsMessage } from '../dto/ws-message.dto';

describe('PosterGenService', () => {
  function createService() {
    return new PosterGenService({} as never, {} as never);
  }

  function mockOrchestrator(
    service: PosterGenService,
    params: {
      stream: jest.Mock;
      getState?: jest.Mock;
    },
  ) {
    (service as unknown as { getOrchestrator: () => unknown }).getOrchestrator =
      () => ({
        agent: {
          stream: params.stream,
          getState: params.getState ?? jest.fn(),
        },
      });
  }

  it('returns an error when revising a missing session', async () => {
    const service = createService();

    const messages: WsMessage[] = [];
    for await (const message of service.revisePoster(
      {
        sessionId: 'missing-session',
        revisionRequirements: '把主视觉改得更活泼一点，增加层次感',
      },
      'client-1',
    )) {
      messages.push(message);
    }

    expect(messages).toEqual([
      {
        type: 'error',
        message: '未找到对应会话，请先完成一次海报生成',
      },
    ]);
  });

  it('syncs generated thread state back into the session', async () => {
    const service = createService();
    const stream = jest.fn(async function* () {
      yield {
        completed: {
          structuredResponse: {
            success: true,
            imageUrl: '/tmp/generated-poster.png',
            mimeType: 'image/png',
            filename: 'generated-poster.png',
            error: null,
          },
          messages: [],
        },
      };
    });
    const getState = jest.fn().mockResolvedValue({
      values: {
        currentStep: 'completed',
        requirementsResult: {
          activity: {
            name: '春日市集',
            startDate: '2026-03-01',
            endDate: '2026-03-02',
            events: [],
          },
          poster: {
            style: '现代简约',
            theme: '春日清新',
            language: '中文',
            color: '#66CC99',
            size: '9:16',
            visualConstraints: [],
          },
        },
        conceptDirection: {
          style: '自然轻盈',
          color_palette: {
            primary: '#66CC99',
            secondary: '#FFF8E7',
            accent: '#FFC857',
          },
          visual_elements: ['叶片', '手作元素'],
          layout_hints: '标题在上',
          title_concept: '春日创意漫游',
        },
        imagePrompt: '完整海报提示词',
        finalImage: {
          imageUrl: '/tmp/generated-from-state.png',
          mimeType: 'image/png',
          filename: 'generated-from-state.png',
        },
      },
    });

    mockOrchestrator(service, { stream, getState });

    const messages: WsMessage[] = [];
    for await (const message of service.generatePoster(
      {
        activityId: 1,
        requirements: '生成一张现代简约风格的春日活动海报，突出活动时间和地点',
      },
      'client-1',
      'session-1',
    )) {
      messages.push(message);
    }

    const state = service.getSession('session-1');

    expect(getState).toHaveBeenCalledWith({
      configurable: { thread_id: 'session-1' },
    });
    expect(state?.requirementsResult?.poster.language).toBe('中文');
    expect(state?.conceptDirection?.title_concept).toBe('春日创意漫游');
    expect(state?.imagePrompt).toBe('完整海报提示词');
    expect(state?.finalImage?.filename).toBe('generated-from-state.png');
    expect(messages).toEqual([
      {
        type: 'success',
        sessionId: 'session-1',
        filename: 'generated-from-state.png',
        mimeType: 'image/png',
        message: '海报生成成功',
        buffer: undefined,
      },
    ]);
  });

  it('reuses prior session state when revising a generated poster', async () => {
    const service = createService();
    const stream = jest.fn(async function* () {
      yield {
        completed: {
          structuredResponse: {
            success: true,
            imageUrl: '/tmp/revised-poster.png',
            mimeType: 'image/png',
            filename: 'revised-poster.png',
            error: null,
          },
          messages: [],
        },
      };
    });
    const getState = jest.fn().mockResolvedValue({
      values: {
        currentStep: 'completed',
        revisionConceptDirection: {
          style: '更明亮的春日风格',
          color_palette: {
            primary: '#88D8B0',
            secondary: '#FFF8E7',
            accent: '#FFD166',
          },
          visual_elements: ['光斑', '简化花叶'],
          layout_hints: '标题更大，主体更聚焦',
          title_concept: '春日焕新',
        },
        imagePrompt: '更新后的提示词',
        finalImage: {
          imageUrl: '/tmp/revised-from-state.png',
          mimeType: 'image/png',
          filename: 'revised-from-state.png',
        },
      },
    });

    mockOrchestrator(service, { stream, getState });

    const state: OrchestratorState = {
      sessionId: 'session-1',
      activityId: 1,
      userRequirements: '生成一张现代简约风格的春日活动海报',
      currentStep: 'completed',
      requirementsResult: {
        activity: {
          name: '春日市集',
          startDate: '2026-03-01',
          endDate: '2026-03-02',
          events: [],
        },
        poster: {
          style: '现代简约',
          theme: '春日清新',
          language: '中文',
          color: '#66CC99',
          size: '9:16',
          visualConstraints: [],
        },
      },
      conceptDirection: {
        style: '自然轻盈',
        color_palette: {
          primary: '#66CC99',
          secondary: '#FFF8E7',
          accent: '#FFC857',
        },
        visual_elements: ['叶片', '手作元素'],
        layout_hints: '标题在上',
        title_concept: '春日创意漫游',
      },
      imagePrompt: '上一轮提示词',
      finalImage: {
        imageUrl: '/tmp/original-poster.png',
        mimeType: 'image/png',
        filename: 'original-poster.png',
      },
    };

    (
      service as unknown as {
        sessions: Map<string, OrchestratorState>;
      }
    ).sessions.set(state.sessionId, state);

    const messages: WsMessage[] = [];
    for await (const message of service.revisePoster(
      {
        sessionId: state.sessionId,
        revisionRequirements: '画面更明亮，标题更大，减少装饰元素',
      },
      'client-1',
    )) {
      messages.push(message);
    }

    expect(stream).toHaveBeenCalled();
    expect(stream).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        configurable: { thread_id: 'session-1' },
      }),
    );
    expect(state.currentStep).toBe('completed');
    expect(state.previousImagePrompt).toBe('上一轮提示词');
    expect(state.previousFinalImage?.filename).toBe('original-poster.png');
    expect(state.revisionRequirements).toBe(
      '画面更明亮，标题更大，减少装饰元素',
    );
    expect(state.revisionConceptDirection?.title_concept).toBe('春日焕新');
    expect(state.imagePrompt).toBe('更新后的提示词');
    expect(state.finalImage?.filename).toBe('revised-from-state.png');
    expect(messages).toEqual([
      {
        type: 'success',
        sessionId: 'session-1',
        filename: 'revised-from-state.png',
        mimeType: 'image/png',
        message: '海报生成成功',
        buffer: undefined,
      },
    ]);
  });
});

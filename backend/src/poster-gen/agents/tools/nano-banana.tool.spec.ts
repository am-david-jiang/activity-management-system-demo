import {
  buildImageGenerationInput,
  extractImageFromContentBlocks,
  getImageModelCandidates,
  inferAspectRatio,
  shouldRetryWithoutAspectRatio,
} from './nano-banana.tool';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('inferAspectRatio', () => {
  it('extracts supported ratios from poster size text', () => {
    expect(inferAspectRatio('活动海报 9:16 竖版')).toBe('9:16');
  });

  it('falls back to 16:9 when size is missing or unsupported', () => {
    expect(inferAspectRatio(undefined)).toBe('16:9');
    expect(inferAspectRatio('A4竖版')).toBe('16:9');
    expect(inferAspectRatio('2:1 超宽幅')).toBe('16:9');
  });
});

describe('getImageModelCandidates', () => {
  const originalModel = process.env.GOOGLE_IMAGE_MODEL;

  afterEach(() => {
    if (originalModel === undefined) {
      delete process.env.GOOGLE_IMAGE_MODEL;
    } else {
      process.env.GOOGLE_IMAGE_MODEL = originalModel;
    }
  });

  it('prefers configured image model and keeps supported fallbacks', () => {
    process.env.GOOGLE_IMAGE_MODEL = 'custom-image-model';

    expect(getImageModelCandidates()).toEqual([
      'custom-image-model',
      'gemini-2.5-flash-image',
    ]);
  });

  it('uses supported default image models when no override is set', () => {
    delete process.env.GOOGLE_IMAGE_MODEL;

    expect(getImageModelCandidates()).toEqual(['gemini-2.5-flash-image']);
  });
});

describe('shouldRetryWithoutAspectRatio', () => {
  it('retries when Google returns invalid argument', () => {
    expect(
      shouldRetryWithoutAspectRatio(
        new Error('Request contains an invalid argument'),
      ),
    ).toBe(true);
  });

  it('does not retry for unrelated failures', () => {
    expect(
      shouldRetryWithoutAspectRatio(new Error('Permission denied')),
    ).toBe(false);
  });
});

describe('extractImageFromContentBlocks', () => {
  it('extracts image bytes from Gemini inlineData blocks', () => {
    const result = extractImageFromContentBlocks([
      {
        type: 'inlineData',
        inlineData: {
          mimeType: 'image/png',
          data: Buffer.from('fake-image').toString('base64'),
        },
      },
    ]);

    expect(result?.mimeType).toBe('image/png');
    expect(result?.imageBuffer.toString()).toBe('fake-image');
  });

  it('extracts image bytes from legacy file blocks', () => {
    const result = extractImageFromContentBlocks([
      {
        type: 'file',
        mimeType: 'image/jpeg',
        data: Buffer.from('legacy-image').toString('base64'),
      },
    ]);

    expect(result?.mimeType).toBe('image/jpeg');
    expect(result?.imageBuffer.toString()).toBe('legacy-image');
  });

  it('returns null when Gemini only returns a fileData reference', () => {
    const result = extractImageFromContentBlocks([
      {
        type: 'fileData',
        fileData: {
          mimeType: 'image/png',
          fileUri: 'gs://bucket/image.png',
        },
      },
    ]);

    expect(result).toBeNull();
  });

  it('extracts image bytes from reasoning blocks that wrap a file block', () => {
    const result = extractImageFromContentBlocks([
      {
        type: 'reasoning',
        reasoning: 'internal thought',
        reasoningContentBlock: {
          type: 'file',
          mimeType: 'image/png',
          data: Buffer.from('reasoning-image').toString('base64'),
        },
      },
    ]);

    expect(result?.mimeType).toBe('image/png');
    expect(result?.imageBuffer.toString()).toBe('reasoning-image');
  });
});

describe('buildImageGenerationInput', () => {
  it('returns plain prompt when there is no previous image', () => {
    expect(buildImageGenerationInput('生成新的海报提示词')).toBe(
      '生成新的海报提示词',
    );
  });

  it('builds a multimodal edit request when previous image is available', () => {
    const imagePath = path.join(os.tmpdir(), `nano-banana-test-${Date.now()}.png`);
    fs.writeFileSync(imagePath, Buffer.from('previous-image'));

    try {
      const input = buildImageGenerationInput('把标题改得更醒目', {
        imageUrl: imagePath,
        mimeType: 'image/png',
        filename: 'previous.png',
      });

      expect(Array.isArray(input)).toBe(true);
      const [message] = input as Array<{ content: unknown }>;
      expect(Array.isArray(message.content)).toBe(true);
        expect(message.content).toEqual([
          expect.objectContaining({
            type: 'text',
            text: expect.stringContaining('Edit the provided poster image.'),
          }),
          expect.objectContaining({
            type: 'image_url',
            image_url: {
              url: expect.stringContaining('data:image/png;base64,'),
            },
          }),
        ]);
    } finally {
      fs.unlinkSync(imagePath);
    }
  });

  it('fails fast when revision image file is missing', () => {
    expect(() =>
      buildImageGenerationInput('调整配色', {
        imageUrl: '/tmp/non-existent-poster.png',
        mimeType: 'image/png',
        filename: 'missing.png',
      }),
    ).toThrow('Previous image file not found');
  });
});

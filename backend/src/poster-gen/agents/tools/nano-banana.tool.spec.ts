import { inferAspectRatio } from './nano-banana.tool';

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

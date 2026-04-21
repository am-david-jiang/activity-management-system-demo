import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatGoogle } from '@langchain/google';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'node:crypto';
import { Command } from '@langchain/langgraph';
import { ToolMessage, type ToolRuntime } from 'langchain';

const logger = new Logger('NanoBananaTool');

const SUPPORTED_ASPECT_RATIOS = [
  '1:1',
  '2:3',
  '3:2',
  '3:4',
  '4:3',
  '4:5',
  '5:4',
  '9:16',
  '16:9',
  '21:9',
];

const NanoBananaSchema = z.object({
  prompt: z.string().describe('English text describing the poster image'),
  aspectRatio: z
    .string()
    .describe(
      `Aspect ratio for the image (e.g., "16:9", "1:1", "9:16"). Supported: ${SUPPORTED_ASPECT_RATIOS.join(', ')}`,
    ),
});

type NanoBananaInput = z.infer<typeof NanoBananaSchema>;

type ImageStepState = {
  imagePrompt?: string;
  requirementsResult?: {
    poster?: {
      size?: string;
    };
  };
};

export function inferAspectRatio(size?: string): string {
  if (!size) {
    return '16:9';
  }

  const match = size.match(/\b(\d{1,2}:\d{1,2})\b/);
  if (!match) {
    return '16:9';
  }

  return SUPPORTED_ASPECT_RATIOS.includes(match[1]) ? match[1] : '16:9';
}

export function createNanoBananaTool() {
  return tool(
    async (
      { prompt, aspectRatio }: NanoBananaInput,
      runtime: ToolRuntime<ImageStepState>,
    ): Promise<Command> => {
      try {
        const resolvedPrompt = prompt ?? runtime.state.imagePrompt;
        const resolvedAspectRatio =
          aspectRatio ??
          inferAspectRatio(runtime.state.requirementsResult?.poster?.size);

        logger.log(
          `Invoking generate_image_nano_banana tool with aspectRatio: ${resolvedAspectRatio}`,
        );

        if (!resolvedPrompt) {
          throw new Error('Missing image prompt in tool input or agent state');
        }

        const normalizedAspectRatio = resolvedAspectRatio.toLowerCase();
        if (!SUPPORTED_ASPECT_RATIOS.includes(normalizedAspectRatio)) {
          throw new Error(
            `Unsupported aspect ratio: ${resolvedAspectRatio}. Supported: ${SUPPORTED_ASPECT_RATIOS.join(', ')}`,
          );
        }

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
          throw new Error('GOOGLE_API_KEY environment variable is not set');
        }

        const model = new ChatGoogle({
          model: 'gemini-3.1-flash-image-preview',
          apiKey,
          imageConfig: {
            aspectRatio: normalizedAspectRatio,
          },
          responseModalities: ['IMAGE', 'TEXT'],
        });

        const response = await model.invoke(resolvedPrompt);

        if (!response.contentBlocks) {
          throw new Error(
            'No response contentBlocks from Gemini image generation',
          );
        }

        let imageBuffer: Buffer | null = null;
        let mimeType = 'image/png';

        for (const block of response.contentBlocks) {
          if (block.type === 'file' && block.data) {
            if (block.data instanceof Uint8Array) {
              imageBuffer = Buffer.from(block.data);
            } else if (
              typeof block.data === 'object' &&
              block.data !== null &&
              'byteLength' in block.data
            ) {
              imageBuffer = Buffer.from(block.data as ArrayBuffer);
            } else if (typeof block.data === 'string') {
              const base64Match = block.data.match(
                /^data:image\/\w+;base64,(.+)$/,
              );
              if (base64Match) {
                imageBuffer = Buffer.from(base64Match[1], 'base64');
              } else {
                imageBuffer = Buffer.from(block.data, 'base64');
              }
            }
            mimeType = (block.mimeType || 'image/png').split(';')[0];
            break;
          }
        }

        if (!imageBuffer) {
          throw new Error(
            'No image generated. Gemini did not return an image.',
          );
        }

        const tempDir = path.join(os.tmpdir(), 'poster-gen');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const ext = mimeType === 'image/png' ? 'png' : 'jpg';
        const filename = `nano-banana-${randomUUID()}.${ext}`;
        const filepath = path.join(tempDir, filename);
        fs.writeFileSync(filepath, imageBuffer);

        logger.log(
          `generate_image_nano_banana tool successfully generated image: ${filepath}`,
        );
        return new Command({
          update: {
            messages: [
              new ToolMessage({
                content: '海报图片生成完成，已进入最终响应阶段',
                tool_call_id: runtime.toolCallId,
                name: 'generate_image_nano_banana',
              }),
            ],
            finalImage: { imageUrl: filepath, mimeType, filename },
            currentStep: 'completed',
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error(
          `generate_image_nano_banana tool failed: ${message}`,
          error instanceof Error ? error.stack : undefined,
        );
        return new Command({
          update: {
            messages: [
              new ToolMessage({
                content: `海报图片生成失败：${message}`,
                tool_call_id: runtime.toolCallId,
                name: 'generate_image_nano_banana',
              }),
            ],
            currentStep: 'completed',
            finalError: `generate_image_nano_banana failed: ${message}`,
          },
        });
      }
    },
    {
      name: 'generate_image_nano_banana',
      description:
        'Generate a poster image using Google Gemini (nano-banana) and hand off to the completed step. ' +
        'Uses imagePrompt and poster size from the current agent state unless overrides are provided.',
      schema: NanoBananaSchema,
    },
  );
}

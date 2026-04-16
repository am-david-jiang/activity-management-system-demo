import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatGoogle } from '@langchain/google';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

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

export function createNanoBananaTool() {
  return tool(
    async ({ prompt, aspectRatio }: NanoBananaInput): Promise<string> => {
      try {
        logger.log(
          `Invoking generate_image_nano_banana tool with prompt: ${prompt}, aspectRatio: ${aspectRatio}`,
        );

        const normalizedAspectRatio = aspectRatio.toLowerCase();
        if (!SUPPORTED_ASPECT_RATIOS.includes(normalizedAspectRatio)) {
          throw new Error(
            `Unsupported aspect ratio: ${aspectRatio}. Supported: ${SUPPORTED_ASPECT_RATIOS.join(', ')}`,
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

        const response = await model.invoke(prompt);

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
        const filename = `nano-banana-${uuidv4()}.${ext}`;
        const filepath = path.join(tempDir, filename);
        fs.writeFileSync(filepath, imageBuffer);

        logger.log(
          `generate_image_nano_banana tool successfully generated image: ${filepath}`,
        );
        return JSON.stringify({ imageUrl: filepath, mimeType });
      } catch (error) {
        logger.error(
          `generate_image_nano_banana tool failed: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
        return JSON.stringify({
          error: `generate_image_nano_banana failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    },
    {
      name: 'generate_image_nano_banana',
      description:
        'Generates a poster image using Google Gemini (nano-banana) text-to-image API. ' +
        'Input should be a JSON object with prompt (English text describing the poster) and aspectRatio (e.g., "16:9", "1:1", "9:16").',
      schema: NanoBananaSchema,
    },
  );
}

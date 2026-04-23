import { tool } from '@langchain/core/tools';
import { HumanMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { ChatGoogle } from '@langchain/google/node';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'node:crypto';
import { Command } from '@langchain/langgraph';
import { ToolMessage, type ToolRuntime } from 'langchain';

const logger = new Logger('NanoBananaTool');

const DEFAULT_IMAGE_MODELS = ['gemini-2.5-flash-image'] as const;

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
  previousFinalImage?: {
    imageUrl: string;
    mimeType: string;
    filename: string;
  };
  requirementsResult?: {
    poster?: {
      size?: string;
    };
  };
};

type ImageContentBlock = {
  type?: string;
  mimeType?: string;
  data?: string | ArrayBuffer | Uint8Array;
  fileId?: string;
  inlineData?: {
    mimeType?: string;
    data?: string;
  };
  fileData?: {
    mimeType?: string;
    fileUri?: string;
  };
  reasoningContentBlock?: ImageContentBlock;
};

export function getImageModelCandidates(): string[] {
  const configuredModel = process.env.GOOGLE_IMAGE_MODEL?.trim();
  if (configuredModel) {
    return [
      configuredModel,
      ...DEFAULT_IMAGE_MODELS.filter((model) => model !== configuredModel),
    ];
  }

  return [...DEFAULT_IMAGE_MODELS];
}

export function shouldRetryWithoutAspectRatio(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /invalid argument/i.test(message);
}

export function extractImageFromContentBlocks(
  contentBlocks: ImageContentBlock[],
): { imageBuffer: Buffer; mimeType: string } | null {
  for (const block of contentBlocks) {
    const candidate = isReasoningBlock(block)
      ? block.reasoningContentBlock
      : block;
    const extracted = extractImageFromBlock(candidate);
    if (extracted) {
      return extracted;
    }
  }

  return null;
}

function extractImageFromBlock(
  block: ImageContentBlock | undefined,
): { imageBuffer: Buffer; mimeType: string } | null {
  if (!block) {
    return null;
  }

  if (isInlineDataBlock(block)) {
    if (
      block.inlineData?.mimeType?.startsWith('image/') &&
      block.inlineData.data
    ) {
      return {
        imageBuffer: Buffer.from(block.inlineData.data, 'base64'),
        mimeType: block.inlineData.mimeType,
      };
    }

    return null;
  }

  if (isLegacyFileBlock(block)) {
    const mimeType = block.mimeType ?? 'image/jpeg';
    if (mimeType.startsWith('image/') && block.data) {
      return {
        imageBuffer: coerceBlockDataToBuffer(block.data),
        mimeType,
      };
    }
  }

  return null;
}

function coerceBlockDataToBuffer(
  data: string | ArrayBuffer | Uint8Array,
): Buffer {
  if (typeof data === 'string') {
    return Buffer.from(data, 'base64');
  }

  if (data instanceof Uint8Array) {
    return Buffer.from(data);
  }

  return Buffer.from(data);
}

function isInlineDataBlock(
  block: ImageContentBlock,
): block is ImageContentBlock & {
  inlineData: { mimeType?: string; data?: string };
} {
  return block.type === 'inlineData' && block.inlineData != null;
}

function isFileDataBlock(
  block: ImageContentBlock,
): block is ImageContentBlock & {
  fileData: { mimeType?: string; fileUri?: string };
} {
  return block.type === 'fileData' && block.fileData != null;
}

function isLegacyFileBlock(block: ImageContentBlock): boolean {
  return block.type === 'file' && block.data != null;
}

function isReasoningBlock(
  block: ImageContentBlock,
): block is ImageContentBlock & { reasoningContentBlock?: ImageContentBlock } {
  return block.type === 'reasoning' && block.reasoningContentBlock != null;
}

function summarizeContentBlocks(contentBlocks: ImageContentBlock[]): string {
  return JSON.stringify(
    contentBlocks.map((block) => {
      if (isReasoningBlock(block)) {
        return {
          type: block.type,
          reasoningContentType: block.reasoningContentBlock?.type,
        };
      }

      const normalizedBlock = block as ImageContentBlock;
      return {
        type: normalizedBlock.type,
        mimeType: normalizedBlock.mimeType,
        hasData: normalizedBlock.data != null,
        hasInlineData: isInlineDataBlock(normalizedBlock)
          ? normalizedBlock.inlineData?.data != null
          : undefined,
        hasFileData: isFileDataBlock(normalizedBlock)
          ? normalizedBlock.fileData?.fileUri != null
          : undefined,
        fileId: normalizedBlock.fileId,
      };
    }),
    null,
    2,
  );
}

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

export function buildImageGenerationInput(
  prompt: string,
  previousFinalImage?: {
    imageUrl: string;
    mimeType?: string;
    filename?: string;
  },
): string | HumanMessage[] {
  if (!previousFinalImage?.imageUrl) {
    return prompt;
  }

  if (!fs.existsSync(previousFinalImage.imageUrl)) {
    throw new Error(
      `Previous image file not found: ${previousFinalImage.imageUrl}`,
    );
  }

  const imageBase64Str = fs
    .readFileSync(previousFinalImage.imageUrl)
    .toString('base64');
  const mimeType =
    previousFinalImage.mimeType ||
    inferMimeTypeFromPath(previousFinalImage.imageUrl);
  const imageDataUrl = `data:${mimeType};base64,${imageBase64Str}`;

  return [
    new HumanMessage({
      content: [
        {
          type: 'text',
          text:
            'Edit the provided poster image. Preserve the confirmed composition, subject, and visual identity unless the new prompt explicitly requests a change. Make targeted revisions on top of the existing poster instead of regenerating a completely different image.\n\n' +
            prompt,
        },
        {
          type: 'image_url',
          image_url: {
            url: imageDataUrl,
          },
        },
      ],
    }),
  ];
}

function inferMimeTypeFromPath(filepath: string): string {
  const ext = path.extname(filepath).toLowerCase();
  if (ext === '.png') {
    return 'image/png';
  }
  if (ext === '.webp') {
    return 'image/webp';
  }
  return 'image/jpeg';
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

        const modelCandidates = getImageModelCandidates();
        const modelInput = buildImageGenerationInput(
          resolvedPrompt,
          runtime.state.previousFinalImage,
        );
        let response: Awaited<ReturnType<ChatGoogle['invoke']>> | undefined;
        let lastError: unknown;

        for (const modelName of modelCandidates) {
          const requestConfigs: Array<{
            imageConfig?: { aspectRatio?: string };
          }> = [{ imageConfig: { aspectRatio: normalizedAspectRatio } }];

          for (const requestConfig of requestConfigs) {
            try {
              const model = new ChatGoogle({
                model: modelName,
                apiKey,
                ...requestConfig,
                responseModalities: ['IMAGE', 'TEXT'],
              });

              response = await model.invoke(modelInput);
              logger.log(
                `generate_image_nano_banana succeeded with model ${modelName}${requestConfig.imageConfig?.aspectRatio ? ` and aspect ratio ${requestConfig.imageConfig.aspectRatio}` : ' without aspect ratio'}`,
              );
              break;
            } catch (error) {
              lastError = error;
              const canRetryWithoutAspectRatio =
                requestConfig.imageConfig?.aspectRatio &&
                shouldRetryWithoutAspectRatio(error);

              logger.warn(
                `generate_image_nano_banana request failed for model ${modelName}${requestConfig.imageConfig?.aspectRatio ? ` with aspect ratio ${requestConfig.imageConfig.aspectRatio}` : ''}: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              );

              if (canRetryWithoutAspectRatio) {
                requestConfigs.push({});
              }
            }
          }

          if (response) {
            break;
          }
        }

        if (!response) {
          throw (
            lastError ??
            new Error('Image generation failed before receiving a response')
          );
        }

        const responseBlocks = Array.isArray(response.contentBlocks)
          ? (response.contentBlocks as ImageContentBlock[])
          : Array.isArray(response.content)
            ? (response.content as ImageContentBlock[])
            : [];

        if (responseBlocks.length === 0) {
          throw new Error(
            'No response contentBlocks from Gemini image generation',
          );
        }

        const extractedImage = extractImageFromContentBlocks(responseBlocks);

        if (!extractedImage) {
          logger.warn(
            `Gemini response did not contain extractable image blocks. Blocks: ${summarizeContentBlocks(responseBlocks)}`,
          );
          throw new Error(
            'No image generated. Gemini did not return an image.',
          );
        }

        const { imageBuffer, mimeType } = extractedImage;

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

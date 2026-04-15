import { Tool } from '@langchain/core/tools';

export class MiniMaxTool extends Tool {
  name = 'generate_image';
  description =
    'Generates a poster image using MiniMax text-to-image API. Input should be an English prompt describing the poster design.';

  async _call(input: string): Promise<string> {
    const apiKey = process.env.MINIMAX_API_KEY;
    const apiUrl = `${process.env.MINIMAX_API_BASE_URL ?? 'https://api.minimaxi.com/v1'}/image_generation`;

    if (!apiKey) {
      throw new Error('MINIMAX_API_KEY environment variable is not set');
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'Image-01',
        prompt: input,
        aspect_ratio: '16:9',
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MiniMax API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (result.status_code !== 0) {
      throw new Error(`MiniMax API error: ${result.status_msg}`);
    }

    return JSON.stringify({ image_url: result.data.image_url });
  }
}

export type WsMessageType = 'thinking' | 'generating' | 'success' | 'error';

export interface ThinkingMessage {
  type: 'thinking';
  content: string;
}

export interface GeneratingMessage {
  type: 'generating';
  content: string;
}

export interface SuccessMessage {
  type: 'success';
  imageUrl: string;
  prompt: string;
  message: string;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export type WsMessage =
  | ThinkingMessage
  | GeneratingMessage
  | SuccessMessage
  | ErrorMessage;

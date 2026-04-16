export type WsMessageType =
  | 'thinking'
  | 'generating'
  | 'success'
  | 'error'
  | 'image_binary';

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
  message: string;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export interface ImageBinaryMessage {
  type: 'image_binary';
  buffer: ArrayBuffer;
  filename: string;
  mimeType: string;
}

export type WsMessage =
  | ThinkingMessage
  | GeneratingMessage
  | SuccessMessage
  | ErrorMessage
  | ImageBinaryMessage;

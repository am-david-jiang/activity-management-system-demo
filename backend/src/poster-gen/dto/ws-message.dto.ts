export type WsMessageType =
  | 'thinking'
  | 'tool_call'
  | 'generating'
  | 'success'
  | 'error';

export interface ThinkingMessage {
  type: 'thinking';
  content: string;
}

export interface ToolCallMessage {
  type: 'tool_call';
  toolName: string;
  input?: Record<string, unknown>;
}

export interface GeneratingMessage {
  type: 'generating';
  content: string;
}

export interface SuccessMessage {
  type: 'success';
  filename: string;
  mimeType: string;
  message: string;
  buffer?: ArrayBuffer;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export type WsMessage =
  | ThinkingMessage
  | ToolCallMessage
  | GeneratingMessage
  | SuccessMessage
  | ErrorMessage;

export type WsMessageType = 'thinking' | 'generating' | 'success' | 'error' | 'concept_options' | 'waiting_selection';

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

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
}

export interface ConceptOption {
  direction_id: string;
  style: string;
  color_palette: ColorPalette;
  visual_elements: string[];
  layout_hints: string;
  title_concept: string;
  image_prompt: string;
}

export interface ConceptOptionsMessage {
  type: 'concept_options';
  directions: ConceptOption[];
  sessionId: string;
  message: string;
}

export interface WaitingSelectionMessage {
  type: 'waiting_selection';
  sessionId: string;
  message: string;
}

export type WsMessage =
  | ThinkingMessage
  | GeneratingMessage
  | SuccessMessage
  | ErrorMessage
  | ConceptOptionsMessage
  | WaitingSelectionMessage;

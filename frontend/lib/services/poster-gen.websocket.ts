"use client";

import { io, Socket } from "socket.io-client";

export type WsMessageType = "thinking" | "generating" | "success" | "error" | "concept_options" | "waiting_selection";

export interface ThinkingMessage {
  type: "thinking";
  content: string;
}

export interface GeneratingMessage {
  type: "generating";
  content: string;
}

export interface SuccessMessage {
  type: "success";
  imageUrl: string;
  prompt: string;
  message: string;
}

export interface ErrorMessage {
  type: "error";
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
  type: "concept_options";
  directions: ConceptOption[];
  sessionId: string;
  message: string;
}

export interface WaitingSelectionMessage {
  type: "waiting_selection";
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

export interface GenerateRequest {
  type: "generate";
  activityId: number;
  requirements: string;
}

export interface SelectConceptRequest {
  type: "select_concept";
  sessionId: string;
  directionId: string;
}

export interface EditConceptRequest {
  type: "edit_concept";
  sessionId: string;
  direction: ConceptOption;
}

export interface RequestNewConceptsRequest {
  type: "request_new_concepts";
  sessionId: string;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:8000";

export class PosterGenWebSocket {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Set<(message: WsMessage) => void> = new Set();
  private connectionListeners: Set<(connected: boolean) => void> = new Set();

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socketUrl = token ? `${WS_URL}/poster-gen?token=${token}` : `${WS_URL}/poster-gen`;

      this.socket = io(socketUrl, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.socket.on("connect", () => {
        this.reconnectAttempts = 0;
        this.notifyConnectionListeners(true);
        resolve();
      });

      this.socket.on("connect_error", () => {
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.notifyConnectionListeners(false);
          reject(new Error("Failed to connect to WebSocket server"));
        }
      });

      this.socket.on("disconnect", () => {
        this.notifyConnectionListeners(false);
      });

      // Listen for all message types
      const messageTypes: WsMessageType[] = [
        "thinking",
        "generating",
        "success",
        "error",
        "concept_options",
        "waiting_selection",
      ];
      messageTypes.forEach((type) => {
        this.socket?.on(type, (data: WsMessage) => {
          if (data.type === type) {
            this.notifyListeners(data);
          }
        });
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  generate(activityId: number, requirements: string): void {
    if (!this.socket?.connected) {
      throw new Error("WebSocket is not connected");
    }

    const request: GenerateRequest = {
      type: "generate",
      activityId,
      requirements,
    };

    this.socket.emit("generate", request);
  }

  selectConcept(sessionId: string, directionId: string): void {
    if (!this.socket?.connected) {
      throw new Error("WebSocket is not connected");
    }

    const request: SelectConceptRequest = {
      type: "select_concept",
      sessionId,
      directionId,
    };

    this.socket.emit("select_concept", request);
  }

  editConcept(sessionId: string, direction: ConceptOption): void {
    if (!this.socket?.connected) {
      throw new Error("WebSocket is not connected");
    }

    const request: EditConceptRequest = {
      type: "edit_concept",
      sessionId,
      direction,
    };

    this.socket.emit("edit_concept", request);
  }

  requestNewConcepts(sessionId: string): void {
    if (!this.socket?.connected) {
      throw new Error("WebSocket is not connected");
    }

    const request: RequestNewConceptsRequest = {
      type: "request_new_concepts",
      sessionId,
    };

    this.socket.emit("request_new_concepts", request);
  }

  onMessage(callback: (message: WsMessage) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.add(callback);
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  private notifyListeners(message: WsMessage): void {
    this.listeners.forEach((callback) => callback(message));
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach((callback) => callback(connected));
  }
}

// Singleton instance
let instance: PosterGenWebSocket | null = null;

export function getPosterGenSocket(): PosterGenWebSocket {
  if (!instance) {
    instance = new PosterGenWebSocket();
  }
  return instance;
}

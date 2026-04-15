"use client";

import { useEffect, useRef, useState } from "react";
import type { WsMessage, ConceptOption, ConceptOptionsMessage } from "@/lib/services/poster-gen.websocket";
import { Loader2, ImageIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConceptSelector } from "./ConceptSelector";
import { ConceptEditor } from "./ConceptEditor";

interface ChatDisplayProps {
  messages: WsMessage[];
  isGenerating: boolean;
  onSelectConcept: (sessionId: string, directionId: string) => void;
  onEditConcept: (sessionId: string, direction: ConceptOption) => void;
  onRequestNewConcepts: (sessionId: string) => void;
}

export function ChatDisplay({
  messages,
  isGenerating,
  onSelectConcept,
  onEditConcept,
  onRequestNewConcepts,
}: ChatDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pendingConceptOptions, setPendingConceptOptions] = useState<ConceptOptionsMessage | null>(null);
  const [editingDirection, setEditingDirection] = useState<ConceptOption | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Check for concept_options messages
  useEffect(() => {
    const conceptMsg = messages.find((m) => m.type === "concept_options");
    if (conceptMsg && conceptMsg.type === "concept_options") {
      setPendingConceptOptions(conceptMsg);
    }
  }, [messages]);

  if (messages.length === 0 && !isGenerating && !pendingConceptOptions) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
        <p>选择活动并输入需求，开始生成海报</p>
      </div>
    );
  }

  const handleSelect = (directionId: string) => {
    if (pendingConceptOptions?.sessionId) {
      onSelectConcept(pendingConceptOptions.sessionId, directionId);
      setPendingConceptOptions(null);
    }
  };

  const handleEdit = (direction: ConceptOption) => {
    setEditingDirection(direction);
  };

  const handleEditSave = (direction: ConceptOption) => {
    if (pendingConceptOptions?.sessionId) {
      onEditConcept(pendingConceptOptions.sessionId, direction);
      setPendingConceptOptions(null);
      setEditingDirection(null);
    }
  };

  const handleRequestNew = () => {
    if (pendingConceptOptions?.sessionId) {
      onRequestNewConcepts(pendingConceptOptions.sessionId);
      setPendingConceptOptions(null);
    }
  };

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      <div className="space-y-4">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}

        {/* Concept Selection UI */}
        {pendingConceptOptions && !editingDirection && (
          <ConceptSelector
            directions={pendingConceptOptions.directions}
            sessionId={pendingConceptOptions.sessionId}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onRequestNew={handleRequestNew}
            isLoading={isGenerating}
          />
        )}

        {/* Concept Editor UI */}
        {editingDirection && (
          <ConceptEditor
            direction={editingDirection}
            onSave={handleEditSave}
            onCancel={() => setEditingDirection(null)}
          />
        )}

        {isGenerating && <GeneratingIndicator />}
      </div>
    </ScrollArea>
  );
}

function MessageBubble({ message }: { message: WsMessage }) {
  switch (message.type) {
    case "thinking":
      return (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
          <Loader2 className="h-5 w-5 animate-spin text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">AI 思考中</p>
            <p className="text-muted-foreground text-sm mt-1">
              {message.content}
            </p>
          </div>
        </div>
      );

    case "generating":
      return (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
          <Loader2 className="h-5 w-5 animate-spin text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">生成中</p>
            <p className="text-muted-foreground text-sm mt-1">
              {message.content}
            </p>
          </div>
        </div>
      );

    case "success":
      return (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-sm text-green-800 dark:text-green-200">
              {message.message}
            </p>
            <div className="mt-3 rounded-lg overflow-hidden bg-white dark:bg-black border border-border">
              <img
                src={message.imageUrl}
                alt="生成的海报"
                className="max-w-full h-auto"
                loading="lazy"
              />
            </div>
            <details className="mt-3">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                查看使用的 Prompt
              </summary>
              <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                {message.prompt}
              </p>
            </details>
          </div>
        </div>
      );

    case "error":
      return (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="font-medium text-sm text-destructive">生成失败</p>
            <p className="text-muted-foreground text-sm mt-1">
              {message.message}
            </p>
          </div>
        </div>
      );

    case "concept_options":
    case "waiting_selection":
      // These are handled by ConceptSelector component
      return null;

    default:
      return null;
  }
}

function GeneratingIndicator() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground p-4">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">等待 AI 响应...</span>
    </div>
  );
}

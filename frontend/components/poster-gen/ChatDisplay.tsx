"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type {
  WsMessage,
  SuccessMessage,
  ToolCallMessage,
} from "@/lib/services/poster-gen.websocket";
import {
  Loader2,
  ImageIcon,
  AlertCircle,
  CheckCircle2,
  Download,
  Wrench,
  MessageSquarePlus,
  UserRound,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface ToolCallUiMessage extends ToolCallMessage {
  completed?: boolean;
  statusText?: string;
}

export interface UserRevisionUiMessage {
  type: "user_revision";
  content: string;
}

export type PosterGenUiMessage =
  | Exclude<WsMessage, ToolCallMessage>
  | ToolCallUiMessage
  | UserRevisionUiMessage;

interface ChatDisplayProps {
  messages: PosterGenUiMessage[];
  isGenerating: boolean;
  canRetry: boolean;
  onRetry: () => void;
  showRevisionComposer: boolean;
  revisionValue: string;
  onRevisionChange: (value: string) => void;
  onSubmitRevision: () => void;
}

export function ChatDisplay({
  messages,
  isGenerating,
  canRetry,
  onRetry,
  showRevisionComposer,
  revisionValue,
  onRevisionChange,
  onSubmitRevision,
}: ChatDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollAreaHeight, setScrollAreaHeight] = useState<number | null>(null);
  const revisionLength = revisionValue.length;
  const canSubmitRevision =
    !isGenerating && revisionLength >= 10 && revisionLength <= 500;

  useEffect(() => {
    if (containerRef.current) {
      setScrollAreaHeight(containerRef.current.getBoundingClientRect().height);
    }
  }, []);

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector<HTMLDivElement>(
      "[data-slot='scroll-area-viewport']",
    );
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, isGenerating, showRevisionComposer]);

  if (messages.length === 0 && !isGenerating) {
    return (
      <div
        ref={containerRef}
        className="flex h-full flex-col items-center justify-center text-muted-foreground"
      >
        <ImageIcon className="mb-4 h-12 w-12 opacity-50" />
        <p>选择活动并输入需求，开始生成海报</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 min-h-0">
      <ScrollArea
        className="p-4"
        ref={scrollRef}
        style={
          scrollAreaHeight ? { height: `${scrollAreaHeight}px` } : undefined
        }
      >
        <div className="space-y-2">
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              message={message}
              showRetry={canRetry && index === messages.length - 1}
              onRetry={onRetry}
            />
          ))}

          {isGenerating ? <GeneratingIndicator /> : null}

          {showRevisionComposer && (
            <RevisionComposer
              value={revisionValue}
              onChange={onRevisionChange}
              onSubmit={onSubmitRevision}
              disabled={isGenerating}
              canSubmit={canSubmitRevision}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function MessageBubble({
  message,
  showRetry,
  onRetry,
}: {
  message: PosterGenUiMessage;
  showRetry: boolean;
  onRetry: () => void;
}) {
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

    case "tool_call":
      const isCompleted = Boolean(message.completed);
      return (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
          {isCompleted ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
          ) : (
            <Wrench className="mt-0.5 h-5 w-5 text-blue-600" />
          )}
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {isCompleted ? "工具调用已完成" : "调用工具"}
            </p>
            {isCompleted ? null : (
              <p className="mt-1 text-sm text-muted-foreground">
                {message.toolName}
              </p>
            )}
            {message.statusText ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {message.statusText}
              </p>
            ) : null}
          </div>
        </div>
      );

    case "success":
      return <SuccessMessageBubble message={message} />;

    case "user_revision":
      return (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <UserRound className="mt-0.5 h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                我的修改意见
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {message.content}
              </p>
            </div>
          </div>
        </div>
      );

    case "error":
      return (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-sm text-destructive">生成失败</p>
            <p className="text-muted-foreground text-sm mt-1">
              {message.message}
            </p>
            {showRetry && (
              <Button size="sm" className="mt-3" onClick={onRetry}>
                重新生成
              </Button>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
}

function SuccessMessageBubble({ message }: { message: SuccessMessage }) {
  const handleDownload = () => {
    if (message.blobUrl && message.filename) {
      const link = document.createElement("a");
      link.href = message.blobUrl;
      link.download = message.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium text-sm text-green-800 dark:text-green-200">
          {message.message}
        </p>
        {message.blobUrl && (
          <div className="mt-3 relative rounded-lg overflow-hidden bg-white dark:bg-black border border-border">
            <Image
              src={message.blobUrl}
              alt="生成的海报"
              width={1200}
              height={1600}
              unoptimized
              className="max-w-full h-auto"
            />
            <button
              onClick={handleDownload}
              className="absolute top-2 right-2 flex items-center gap-1.5 rounded-md bg-black/60 px-3 py-1.5 text-sm text-white transition-colors hover:bg-black/80"
            >
              <Download className="h-4 w-4" />
              <span>下载海报</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RevisionComposer({
  value,
  onChange,
  onSubmit,
  disabled,
  canSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  canSubmit: boolean;
}) {
  const characterCount = value.length;
  const isNearLimit = characterCount >= 450;
  const isAtLimit = characterCount >= 500;

  return (
    <div className="rounded-lg border bg-background p-4 space-y-3">
      <div className="flex items-start gap-3">
        <MessageSquarePlus className="mt-0.5 h-5 w-5 text-primary" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">继续修改这张海报</p>
              <p className="text-sm text-muted-foreground mt-1">
                输入修改意见，例如调整主色调、突出时间地点或更换整体风格。
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 text-xs",
                isAtLimit
                  ? "text-destructive font-medium"
                  : isNearLimit
                    ? "text-yellow-600"
                    : "text-muted-foreground",
              )}
            >
              {characterCount}/500
            </span>
          </div>

          <Textarea
            value={value}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                onChange(e.target.value);
              }
            }}
            disabled={disabled}
            placeholder="例如：保留主视觉，但改成更明亮的春日配色，并把活动时间地点做得更突出。"
            className="min-h-[120px] resize-none"
          />

          {characterCount > 0 && characterCount < 10 && (
            <p className="text-xs text-muted-foreground">
              修改意见至少需要 10 个字符
            </p>
          )}

          <div className="flex justify-end">
            <Button onClick={onSubmit} disabled={!canSubmit}>
              提交修改意见
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneratingIndicator() {
  return (
    <div className="flex items-center gap-2 p-4 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">等待 AI 响应...</span>
    </div>
  );
}

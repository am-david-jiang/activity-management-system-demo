"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPosterGenSocket,
  type WsMessage,
} from "@/lib/services/poster-gen.websocket";
import { ActivitySelector } from "@/components/poster-gen/ActivitySelector";
import { RequirementsInput } from "@/components/poster-gen/RequirementsInput";
import { ChatDisplay } from "@/components/poster-gen/ChatDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PosterGenPage() {
  const [activityId, setActivityId] = useState<number | null>(null);
  const [requirements, setRequirements] = useState("");
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const socket = getPosterGenSocket();

  const handleDisconnect = useCallback(() => {
    socket.disconnect();
    setIsConnected(false);
  }, [socket]);

  const handleMessage = useCallback((message: WsMessage) => {
    setMessages((prev) => [...prev, message]);

    if (message.type === "success" || message.type === "error") {
      setIsGenerating(false);
    }
  }, []);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    if (!connected) {
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initSocket = async () => {
      try {
        await socket.connect();
        if (mounted) {
          setIsConnected(true);
        }
      } catch {
        if (mounted) {
          setConnectionError("连接失败，请检查服务器是否运行");
          setIsConnected(false);
        }
      }
    };

    initSocket();

    const unsubMessage = socket.onMessage(handleMessage);
    const unsubConnection = socket.onConnectionChange(handleConnectionChange);

    return () => {
      mounted = false;
      unsubMessage();
      unsubConnection();
      handleDisconnect();
    };
  }, [socket, handleDisconnect, handleMessage, handleConnectionChange]);

  const handleGenerate = () => {
    if (!activityId) {
      toast.error("请选择活动");
      return;
    }
    if (requirements.length < 10) {
      toast.error("需求描述至少需要 10 个字符");
      return;
    }

    setMessages([]);
    setIsGenerating(true);

    try {
      socket.generate(activityId, requirements);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "启动生成失败");
      setIsGenerating(false);
    }
  };

  const canGenerate =
    activityId !== null &&
    requirements.length >= 10 &&
    isConnected &&
    !isGenerating;

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">海报生成</h1>
        <p className="text-muted-foreground mt-1">
          选择活动并描述需求，AI 将为您生成精美的活动海报
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex-1">
            <ActivitySelector
              value={activityId}
              onChange={setActivityId}
              disabled={isGenerating}
            />

            <Separator />

            <RequirementsInput
              value={requirements}
              onChange={setRequirements}
              disabled={isGenerating}
              maxLength={500}
            />

            <Separator />

            {connectionError ? (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{connectionError}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-yellow-500"}`}
                />
                <span className="text-muted-foreground">
                  {isConnected ? "已连接" : "连接中..."}
                </span>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                "生成海报"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col min-h-0">
          <CardHeader>
            <CardTitle className="text-lg">生成结果</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0">
            <ChatDisplay messages={messages} isGenerating={isGenerating} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

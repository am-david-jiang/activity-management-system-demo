"use client";

import { useEffect, useRef } from "react";
import type {
    WsMessage,
    SuccessMessage,
} from "@/lib/services/poster-gen.websocket";
import { Loader2, ImageIcon, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatDisplayProps {
    messages: WsMessage[];
    isGenerating: boolean;
}

export function ChatDisplay({
    messages,
    isGenerating,
}: ChatDisplayProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    if (messages.length === 0 && !isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
                <p>选择活动并输入需求，开始生成海报</p>
            </div>
        );
    }

    return (
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
                {messages.map((message, index) => (
                    <MessageBubble key={index} message={message} />
                ))}

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
            return <SuccessMessageBubble message={message} />;

        case "error":
            return (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                        <p className="font-medium text-sm text-destructive">
                            生成失败
                        </p>
                        <p className="text-muted-foreground text-sm mt-1">
                            {message.message}
                        </p>
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
            const link = document.createElement('a');
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
                        <img
                            src={message.blobUrl}
                            alt="生成的海报"
                            className="max-w-full h-auto"
                            loading="lazy"
                        />
                        <button
                            onClick={handleDownload}
                            className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-sm rounded-md transition-colors"
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

function GeneratingIndicator() {
    return (
        <div className="flex items-center gap-2 text-muted-foreground p-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">等待 AI 响应...</span>
        </div>
    );
}
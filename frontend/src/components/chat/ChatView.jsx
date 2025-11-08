import { useEffect, useMemo, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useAuth } from "@/contexts/AuthContext";
import { useAIStream } from "@/hooks/useAIStream";
import { useLocale } from "@/contexts/LocaleContext";
import { sleep } from "@/lib/utils";

export function ChatView({ onStatusChange, conversationId, initialMessages, onSave }) {
  const { apiFetch, showError } = useAuth();
  const { t } = useLocale();
  const [messages, setMessages] = useState(initialMessages || []);
  const [activeJobId, setActiveJobId] = useState(null);
  const [assistantMessageId, setAssistantMessageId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const containerRef = useRef(null);

  // Load initial messages when conversation changes
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages.map(msg => ({
        ...msg,
        saved: true,
      })));
    } else {
      setMessages([]);
    }
  }, [conversationId, initialMessages]);

  const startAssistantMessage = () => {
    const id = crypto.randomUUID();
    setAssistantMessageId(id);
    setMessages((prev) => [
      ...prev,
      {
        id,
        role: "assistant",
        content: "",
        streaming: true,
      },
    ]);
    return id;
  };

  const updateAssistantContent = (delta) => {
    if (!assistantMessageId) return;
    setMessages((prev) =>
      prev.map((message) =>
        message.id === assistantMessageId
          ? {
            ...message,
            content: `${message.content}${delta}`,
          }
          : message,
      ),
    );
  };

  const finishAssistantMessage = () => {
    if (!assistantMessageId) return;
    setMessages((prev) => {
      const updatedMessages = prev.map((message) =>
        message.id === assistantMessageId
          ? {
            ...message,
            streaming: false,
          }
          : message,
      );
      // Auto-save after assistant message completes
      if (onSave && conversationId) {
        setTimeout(() => onSave(updatedMessages), 1000);
      }
      return updatedMessages;
    });
    setAssistantMessageId(null);
  };

  const { cancel } = useAIStream(activeJobId, {
    onChunk: (chunk) => {
      setIsStreaming(true);
      updateAssistantContent(chunk);
    },
    onDone: () => {
      setIsStreaming(false);
      finishAssistantMessage();
      setActiveJobId(null);
      onStatusChange?.({
        headline: t("ready"),
        subcopy: t("welcomeBack"),
      });
    },
    onError: (error) => {
      console.error(error);
      setIsStreaming(false);
      finishAssistantMessage();
      setActiveJobId(null);
      showError("AI stream error", error.message);
      onStatusChange?.({
        headline: "Connection interrupted",
        subcopy: "Please try asking again.",
      });
    },
  });

  const askQuestion = async (input) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: input,
        createdAt: new Date().toISOString(),
      },
    ]);

    const placeholderId = startAssistantMessage();
    setIsStreaming(true);
    onStatusChange?.({
      headline: t("aiThinking"),
      subcopy: "Synthesising insights from sales & campaign data…",
    });

    try {
      const payload = await apiFetch("/ai/query", {
        method: "POST",
        body: JSON.stringify({
          query: input,
          context: { source: "frontend" },
        }),
      });
      if (!payload?.jobId) {
        throw new Error("Job ID missing from AI response");
      }
      setAssistantMessageId(placeholderId);
      setActiveJobId(payload.jobId);
    } catch (error) {
      cancel?.();
      setIsStreaming(false);
      finishAssistantMessage();
      showError("Unable to reach GrowthMonitor", error.message);
      onStatusChange?.({
        headline: "AI unavailable",
        subcopy: "Please try again in a moment.",
      });
    }
  };

  useEffect(() => {
    const scrollToBottom = async () => {
      await sleep(20);
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    };
    scrollToBottom();
  }, [messages]);

  const emptyState = useMemo(
    () => (
      <div className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-[hsla(var(--border)_/_0.5)] bg-white/60 text-center text-[hsl(var(--muted-foreground))] dark:bg-[hsla(var(--secondary)_/_0.3)]">
        <span className="rounded-full bg-[hsla(var(--primary)_/_0.15)] px-4 py-1 text-xs font-medium text-[hsl(var(--primary))]">
          SME Copilot
        </span>
        <p className="max-w-md text-lg font-medium text-[hsl(var(--foreground))]">
          {t("welcomeHeadline")}
        </p>
        <p className="max-w-lg text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
          {t("emptyState")}
        </p>
      </div>
    ),
    [t],
  );

  return (
    <div className="flex h-full flex-col gap-4">
      <div
        ref={containerRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-3xl bg-white/40 p-6 dark:bg-[hsla(var(--secondary)_/_0.2)]"
      >
        {messages.length === 0
          ? emptyState
          : messages.map((message) => (
            <ChatMessage key={message.id} {...message} isStreaming={message.streaming && isStreaming} />
          ))}
      </div>
      <ChatInput
        disabled={isStreaming}
        isStreaming={isStreaming}
        onSubmit={askQuestion}
      />
    </div>
  );
}

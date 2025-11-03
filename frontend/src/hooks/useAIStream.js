import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

const decoder = new TextDecoder("utf-8");

const extractEvents = (buffer) => {
  const segments = buffer.split("\n\n");
  const incomplete = segments.pop();
  const events = segments
    .map((segment) =>
      segment
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.replace(/^data:\s*/, ""))
        .join("")
        .trim(),
    )
    .filter(Boolean);
  return { events, remainder: incomplete ?? "" };
};

export function useAIStream(jobId, { onChunk, onDone, onError } = {}) {
  const { accessToken } = useAuth();
  const abortRef = useRef(null);

  useEffect(() => {
    if (!jobId || !accessToken) {
      return undefined;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const stream = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL ?? "http://localhost:8080/api"}/ai/stream/${jobId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            signal: controller.signal,
          },
        );

        if (!response.ok || !response.body) {
          throw new Error(`Stream failed with status ${response.status}`);
        }

        const reader = response.body.getReader();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const { events, remainder } = extractEvents(buffer);
          buffer = remainder;
          for (const event of events) {
            try {
              const payload = JSON.parse(event);
              if (payload.done) {
                onDone?.(payload);
              } else if (payload.content) {
                onChunk?.(payload.content);
              }
            } catch (error) {
              console.warn("Failed to parse stream event", error, event);
            }
          }
        }

        if (buffer.trim()) {
          const { events } = extractEvents(`${buffer}\n\n`);
          for (const event of events) {
            try {
              const payload = JSON.parse(event);
              if (payload.done) {
                onDone?.(payload);
              } else if (payload.content) {
                onChunk?.(payload.content);
              }
            } catch (error) {
              console.warn("Failed to parse stream event", error, event);
            }
          }
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("AI stream error", error);
        onError?.(error);
      }
    };

    stream();

    return () => {
      controller.abort();
    };
  }, [jobId, accessToken, onChunk, onDone, onError]);

  return {
    cancel: () => abortRef.current?.abort(),
  };
}

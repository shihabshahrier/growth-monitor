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
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const streamTimeout = 120000; // 2 minutes

  useEffect(() => {
    if (!jobId || !accessToken) {
      return undefined;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    let timeoutId = null;

    const stream = async (retryCount = 0) => {
      try {
        // Set timeout for the entire stream
        timeoutId = setTimeout(() => {
          controller.abort();
          onError?.(new Error("Stream timeout - AI took too long to respond"));
        }, streamTimeout);

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
          // Retry on 5xx errors
          if (response.status >= 500 && retryCount < maxRetries) {
            console.log(`Stream failed with ${response.status}, retrying (${retryCount + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
            return stream(retryCount + 1);
          }
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
        // Clear timeout on successful completion
        if (timeoutId) clearTimeout(timeoutId);
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);

        if (controller.signal.aborted) {
          console.log("Stream aborted by user");
          return;
        }

        // Retry on network errors
        if (error.name === 'TypeError' && retryCount < maxRetries) {
          console.log(`Network error, retrying (${retryCount + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          return stream(retryCount + 1);
        }

        console.error("AI stream error", error);
        onError?.(error);
      }
    };

    stream();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      controller.abort();
    };
  }, [jobId, accessToken, onChunk, onDone, onError]);

  return {
    cancel: () => abortRef.current?.abort(),
  };
}

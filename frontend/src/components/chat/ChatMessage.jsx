import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function ChatMessage({ role, content, isStreaming }) {
  const isUser = role === "user";

  // Debug logging for assistant messages
  if (!isUser && !isStreaming && content) {
    console.log(`🖼️ Rendering assistant message (${content.length} chars):`, content.substring(0, 100) + '...');
  }

  return (
    <div
      className={cn(
        "flex w-full justify-start",
        isUser && "justify-end",
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "max-w-[80%] rounded-3xl px-5 py-3 text-sm shadow",
          isUser
            ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
            : "bg-white/90 text-[hsl(var(--foreground))] dark:bg-[hsla(var(--secondary)_/_0.5)]",
        )}
      >
        <p className="whitespace-pre-line leading-relaxed">{content}</p>
        {isStreaming && (
          <span className="mt-2 inline-flex gap-1">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="h-1.5 w-1.5 rounded-full bg-[hsla(var(--foreground)_/_0.6)] animate-pulse"
                style={{ animationDelay: `${dot * 120}ms` }}
              />
            ))}
          </span>
        )}
      </motion.div>
    </div>
  );
}

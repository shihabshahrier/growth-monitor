import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export function Modal({ open, onClose, title, description, children, footer }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-xl rounded-3xl border border-[hsla(var(--border)_/_0.6)] bg-white/95 p-6 text-[hsl(var(--foreground))] shadow-[0_24px_60px_-40px_rgba(202,138,148,0.7)] dark:bg-[hsla(var(--secondary)_/_0.6)]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold">{title}</h2>
                {description && (
                  <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                    {description}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                ×
              </Button>
            </div>
            <div className="mt-6">{children}</div>
            {footer && <div className={cn("mt-6 flex justify-end gap-3")}>{footer}</div>}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

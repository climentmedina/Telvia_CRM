"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const shortcuts = [
  { keys: ["g", "d"], description: "Go to Dashboard" },
  { keys: ["g", "c"], description: "Go to Companies" },
  { keys: ["g", "a"], description: "Go to Analytics" },
  { keys: ["g", "o"], description: "Go to Outreach" },
  { keys: ["/"], description: "Focus search" },
  { keys: ["j"], description: "Next row" },
  { keys: ["k"], description: "Previous row" },
  { keys: ["Enter"], description: "Open selected" },
  { keys: ["?"], description: "Show shortcuts" },
];

export function KeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "?") {
        e.preventDefault();
        setShowHelp((v) => !v);
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        const search = document.querySelector<HTMLInputElement>("[data-search-input]");
        search?.focus();
        return;
      }

      // Two-key navigation: g + letter
      if (pendingKey === "g") {
        setPendingKey(null);
        switch (e.key) {
          case "d": router.push("/dashboard"); break;
          case "c": router.push("/companies"); break;
          case "a": router.push("/analytics"); break;
          case "o": router.push("/outreach"); break;
        }
        return;
      }

      if (e.key === "g") {
        setPendingKey("g");
        setTimeout(() => setPendingKey(null), 1000);
        return;
      }

      // Table navigation (j/k/Enter) is handled by the table component
      // We dispatch custom events for them
      if (e.key === "j" || e.key === "k" || e.key === "Enter") {
        window.dispatchEvent(new CustomEvent("table-nav", { detail: { key: e.key } }));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, pendingKey]);

  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {shortcuts.map(({ keys, description }) => (
            <div key={description} className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">{description}</span>
              <div className="flex gap-1">
                {keys.map((k) => (
                  <kbd key={k} className="rounded border bg-muted px-2 py-0.5 text-xs font-mono">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

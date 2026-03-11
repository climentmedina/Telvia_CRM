import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number | null): string {
  if (score === null) return "—";
  return score.toFixed(1);
}

export function tierColor(tier: string | null): string {
  switch (tier) {
    case "hot": return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30";
    case "warm": return "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30";
    case "cold": return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";
    case "disqualified": return "bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border-neutral-500/30";
    default: return "bg-neutral-500/10 text-neutral-500 border-neutral-500/20";
  }
}

export function contactStatusColor(status: string | null): string {
  switch (status) {
    case "new": return "bg-sky-500/15 text-sky-700 dark:text-sky-400";
    case "contacted": return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400";
    case "replied": return "bg-green-500/15 text-green-700 dark:text-green-400";
    case "meeting": return "bg-purple-500/15 text-purple-700 dark:text-purple-400";
    case "won": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    case "lost": return "bg-red-500/15 text-red-700 dark:text-red-400";
    default: return "bg-neutral-500/10 text-neutral-500";
  }
}

export function scoreColor(score: number | null): string {
  if (score === null) return "text-neutral-400";
  if (score >= 90) return "text-red-600 dark:text-red-400";
  if (score >= 75) return "text-orange-600 dark:text-orange-400";
  if (score >= 60) return "text-blue-600 dark:text-blue-400";
  return "text-neutral-500";
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + "...";
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-ES").format(n);
}

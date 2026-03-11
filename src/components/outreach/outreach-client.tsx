"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, Inbox, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Company, ContactStatus } from "@/types/database";
import { cn, tierColor, formatScore, scoreColor, formatNumber } from "@/lib/utils";
import { updateContactStatus } from "@/lib/queries";

interface ColumnData {
  data: Company[];
  count: number;
}

interface BoardData {
  columns: Record<string, ColumnData>;
  uncontacted: ColumnData;
}

interface Props {
  board: BoardData;
}

const columnConfig: { key: string; label: string; color: string }[] = [
  { key: "uncontacted", label: "Uncontacted (Hot/Warm)", color: "border-t-yellow-500" },
  { key: "new", label: "New", color: "border-t-sky-500" },
  { key: "contacted", label: "Contacted", color: "border-t-yellow-500" },
  { key: "replied", label: "Replied", color: "border-t-green-500" },
  { key: "meeting", label: "Meeting", color: "border-t-purple-500" },
  { key: "won", label: "Won", color: "border-t-emerald-500" },
  { key: "lost", label: "Lost", color: "border-t-red-500" },
];

export function OutreachClient({ board: initialBoard }: Props) {
  const router = useRouter();
  const [board, setBoard] = useState(initialBoard);
  const [dragItem, setDragItem] = useState<{ id: string; from: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync with server data when props change (e.g., after router.refresh)
  useEffect(() => {
    setBoard(initialBoard);
  }, [initialBoard]);

  const getColumnData = useCallback((key: string): ColumnData => {
    if (key === "uncontacted") return board.uncontacted;
    return board.columns[key] ?? { data: [], count: 0 };
  }, [board]);

  // Optimistic move: update local state immediately, persist in background
  const moveCompany = useCallback(async (companyId: string, fromColumn: string, toColumn: string) => {
    if (fromColumn === toColumn) return;
    if (toColumn === "uncontacted") return;

    // Find the company in the source column
    const sourceCol = fromColumn === "uncontacted" ? board.uncontacted : board.columns[fromColumn];
    const company = sourceCol?.data.find((c) => c.id === companyId);
    if (!company) return;

    // Optimistic update: move card between columns
    setBoard((prev) => {
      const next = {
        columns: { ...prev.columns },
        uncontacted: { ...prev.uncontacted },
      };

      // Remove from source
      if (fromColumn === "uncontacted") {
        next.uncontacted = {
          data: prev.uncontacted.data.filter((c) => c.id !== companyId),
          count: prev.uncontacted.count - 1,
        };
      } else {
        const srcData = (prev.columns[fromColumn]?.data ?? []).filter((c) => c.id !== companyId);
        next.columns[fromColumn] = {
          data: srcData,
          count: (prev.columns[fromColumn]?.count ?? 1) - 1,
        };
      }

      // Add to target
      const movedCompany = { ...company, contact_status: toColumn as ContactStatus };
      const targetData = [...(prev.columns[toColumn]?.data ?? []), movedCompany];
      next.columns[toColumn] = {
        data: targetData,
        count: (prev.columns[toColumn]?.count ?? 0) + 1,
      };

      return next;
    });

    // Persist to server
    const success = await updateContactStatus(companyId, toColumn as ContactStatus);
    if (!success) {
      // Revert on failure — reload from server
      router.refresh();
    }
  }, [board, router]);

  const handleDrop = useCallback(async (targetColumn: string) => {
    if (!dragItem) return;
    await moveCompany(dragItem.id, dragItem.from, targetColumn);
    setDragItem(null);
  }, [dragItem, moveCompany]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [router]);

  const totalInPipeline = Object.values(board.columns).reduce((sum, col) => sum + col.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outreach Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            {formatNumber(board.uncontacted.count)} uncontacted hot/warm leads · {formatNumber(totalInPipeline)} in pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("mr-1 h-3.5 w-3.5", isRefreshing && "animate-spin")} /> Refresh
          </Button>
          <Link href="/companies?tier=hot,warm">
            <Button size="sm" variant="outline">
              <Inbox className="mr-1 h-3.5 w-3.5" /> Browse Hot/Warm
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columnConfig.map(({ key, label, color }) => {
              const col = getColumnData(key);
              return (
                <div
                  key={key}
                  className={cn("flex min-w-[280px] max-w-[320px] flex-shrink-0 flex-col rounded-lg border border-t-4", color)}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("bg-accent/30"); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove("bg-accent/30"); }}
                  onDrop={(e) => { e.currentTarget.classList.remove("bg-accent/30"); handleDrop(key); }}
                >
                  <div className="flex items-center justify-between p-3 border-b">
                    <h3 className="text-sm font-semibold">{label}</h3>
                    <Badge variant="outline" className="text-xs">{col.count}</Badge>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 300px)" }}>
                    {col.data.map((company) => (
                      <KanbanCard
                        key={company.id}
                        company={company}
                        columnKey={key}
                        onDragStart={() => setDragItem({ id: company.id, from: key })}
                        onMove={(id, status) => moveCompany(id, key, status)}
                      />
                    ))}
                    {col.data.length === 0 && (
                      <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                        {key === "uncontacted" ? "All hot/warm leads have been contacted!" : "Drop companies here"}
                      </div>
                    )}
                    {col.count > col.data.length && (
                      <p className="text-center text-xs text-muted-foreground py-2">
                        +{col.count - col.data.length} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <div className="space-y-4">
            {columnConfig.map(({ key, label }) => {
              const col = getColumnData(key);
              if (col.data.length === 0) return null;
              return (
                <Card key={key}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      {label}
                      <Badge variant="outline">{col.count}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y">
                      {col.data.map((company) => (
                        <div key={company.id} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <Link href={`/companies/${company.id}`} className="hover:underline">
                              <span className="font-medium">{company.company_name}</span>
                            </Link>
                            {company.outreach_tier && (
                              <Badge className={tierColor(company.outreach_tier)} variant="outline">
                                {company.outreach_tier}
                              </Badge>
                            )}
                            <span className={cn("text-sm font-semibold", scoreColor(company.priority_score))}>
                              {formatScore(company.priority_score)}
                            </span>
                            <span className="text-xs text-muted-foreground">{company.provincia}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {key === "uncontacted" && (
                              <Button size="sm" variant="outline" onClick={() => moveCompany(company.id, key, "contacted")}>
                                Mark Contacted
                              </Button>
                            )}
                            {company.phone_from_csv && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => navigator.clipboard.writeText(company.phone_from_csv!)}
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KanbanCard({
  company,
  columnKey,
  onDragStart,
  onMove,
}: {
  company: Company;
  columnKey: string;
  onDragStart: () => void;
  onMove: (id: string, status: string) => void;
}) {
  const nextStatus: Record<string, string> = {
    uncontacted: "contacted",
    new: "contacted",
    contacted: "replied",
    replied: "meeting",
    meeting: "won",
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <div className="flex items-start justify-between">
        <Link href={`/companies/${company.id}`} className="min-w-0 flex-1 hover:underline">
          <p className="truncate text-sm font-medium">{company.company_name}</p>
        </Link>
        <span className={cn("ml-2 text-sm font-bold", scoreColor(company.priority_score))}>
          {formatScore(company.priority_score)}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{company.domain}</span>
        {company.outreach_tier && (
          <Badge className={cn(tierColor(company.outreach_tier), "text-[10px]")} variant="outline">
            {company.outreach_tier}
          </Badge>
        )}
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {company.provincia && <span>{company.provincia}</span>}
        {company.sector && <span>· {company.sector}</span>}
      </div>
      <div className="mt-2 flex items-center gap-1">
        {nextStatus[columnKey] && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[11px]"
            onClick={(e) => { e.stopPropagation(); onMove(company.id, nextStatus[columnKey]); }}
          >
            &rarr; {nextStatus[columnKey]}
          </Button>
        )}
        {company.phone_from_csv && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(company.phone_from_csv!); }}
          >
            <Phone className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ExternalLink,
  Phone,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import type { Company, CompanyFilters, PaginationParams, OutreachTier } from "@/types/database";
import { cn, tierColor, formatScore, scoreColor, formatNumber, contactStatusColor } from "@/lib/utils";
import { bulkUpdateContactStatus, updateContactStatus } from "@/lib/queries";

interface Props {
  companies: Company[];
  total: number;
  filters: CompanyFilters;
  pagination: PaginationParams;
  filterOptions: {
    provincias: string[];
    sectors: string[];
    cms_platforms: string[];
  };
}

const tierOptions: OutreachTier[] = ["hot", "warm", "cold", "disqualified"];

export function CompaniesClient({ companies, total, filters, pagination, filterOptions }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeRow, setActiveRow] = useState(0);
  const [searchValue, setSearchValue] = useState(filters.search ?? "");
  const [scoreRange, setScoreRange] = useState<[number, number]>([
    filters.score_min ?? 0,
    filters.score_max ?? 100,
  ]);

  const totalPages = Math.ceil(total / pagination.pageSize);

  // Build URL with new params
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      // Reset to page 1 when filters change (unless page is being set)
      if (!("page" in updates)) {
        params.set("page", "1");
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router]
  );

  // Keyboard navigation for table rows
  useEffect(() => {
    function handleNav(e: Event) {
      const { key } = (e as CustomEvent).detail;
      if (key === "j") setActiveRow((r) => Math.min(r + 1, companies.length - 1));
      if (key === "k") setActiveRow((r) => Math.max(r - 1, 0));
      if (key === "Enter" && companies[activeRow]) {
        router.push(`/companies/${companies[activeRow].id}`);
      }
    }
    window.addEventListener("table-nav", handleNav);
    return () => window.removeEventListener("table-nav", handleNav);
  }, [activeRow, companies, router]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== (filters.search ?? "")) {
        updateParams({ search: searchValue || undefined });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const toggleTier = (tier: OutreachTier) => {
    const current = filters.outreach_tier ?? [];
    const next = current.includes(tier)
      ? current.filter((t) => t !== tier)
      : [...current, tier];
    updateParams({ tier: next.length ? next.join(",") : undefined });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === companies.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(companies.map((c) => c.id)));
    }
  };

  const handleBulkMark = async (status: "contacted" | "new") => {
    await bulkUpdateContactStatus([...selected], status);
    setSelected(new Set());
    router.refresh();
  };

  const exportCSV = () => {
    const rows = companies.filter((c) => selected.size === 0 || selected.has(c.id));
    const headers = ["company_name", "domain", "provincia", "sector", "business_type", "priority_score", "outreach_tier", "phone_from_csv", "cms_platform"];
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => {
          const val = r[h as keyof Company];
          const str = val === null || val === undefined ? "" : String(val);
          return str.includes(",") ? `"${str}"` : str;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `companies_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters = !!(
    filters.outreach_tier?.length ||
    filters.provincia ||
    filters.sector ||
    filters.business_type ||
    filters.company_size_signal ||
    filters.cms_platform ||
    filters.score_min ||
    filters.score_max ||
    filters.has_contact_form ||
    filters.has_phone_number ||
    filters.has_ecommerce ||
    filters.contact_status
  );

  const clearAllFilters = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-sm text-muted-foreground">{formatNumber(total)} results</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{selected.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => handleBulkMark("contacted")}>
                Mark Contacted
              </Button>
              <Button size="sm" variant="outline" onClick={exportCSV}>
                <Download className="mr-1 h-3.5 w-3.5" /> Export
              </Button>
            </>
          )}
          {selected.size === 0 && (
            <Button size="sm" variant="outline" onClick={exportCSV}>
              <Download className="mr-1 h-3.5 w-3.5" /> Export All
            </Button>
          )}
        </div>
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-search-input
            placeholder="Search companies or domains..."
            className="pl-9"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        {/* Tier toggle buttons */}
        <div className="flex items-center gap-1">
          {tierOptions.map((tier) => {
            const isActive = filters.outreach_tier?.includes(tier);
            return (
              <Button
                key={tier}
                size="sm"
                variant={isActive ? "default" : "outline"}
                className={cn("capitalize", isActive && tier === "hot" && "bg-red-600 hover:bg-red-700")}
                onClick={() => toggleTier(tier)}
              >
                {tier}
              </Button>
            );
          })}
        </div>

        <Button
          size="sm"
          variant={showFilters ? "secondary" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="mr-1 h-3.5 w-3.5" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-primary text-primary-foreground px-1.5 text-[10px]">!</span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button size="sm" variant="ghost" onClick={clearAllFilters}>
            <X className="mr-1 h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Provincia</label>
              <Select
                value={filters.provincia ?? "all"}
                onValueChange={(v) => updateParams({ provincia: v === "all" ? undefined : v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Provincias</SelectItem>
                  {filterOptions.provincias.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Sector</label>
              <Select
                value={filters.sector ?? "all"}
                onValueChange={(v) => updateParams({ sector: v === "all" ? undefined : v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {filterOptions.sectors.slice(0, 50).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Business Type</label>
              <Select
                value={filters.business_type ?? "all"}
                onValueChange={(v) => updateParams({ business_type: v === "all" ? undefined : v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="B2B">B2B</SelectItem>
                  <SelectItem value="B2C">B2C</SelectItem>
                  <SelectItem value="B2G">B2G</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Company Size</label>
              <Select
                value={filters.company_size_signal ?? "all"}
                onValueChange={(v) => updateParams({ size: v === "all" ? undefined : v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="micro">Micro</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">CMS</label>
              <Select
                value={filters.cms_platform ?? "all"}
                onValueChange={(v) => updateParams({ cms: v === "all" ? undefined : v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All CMS</SelectItem>
                  {filterOptions.cms_platforms.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Contact Status</label>
              <Select
                value={filters.contact_status ?? "all"}
                onValueChange={(v) => updateParams({ contact_status: v === "all" ? undefined : v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Score Range */}
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Score Range: {scoreRange[0]} – {scoreRange[1]}
              </label>
              <Slider
                value={scoreRange}
                onValueChange={(v) => setScoreRange(v as [number, number])}
                onValueCommit={(v) => {
                  const [min, max] = v as [number, number];
                  updateParams({
                    score_min: min > 0 ? String(min) : undefined,
                    score_max: max < 100 ? String(max) : undefined,
                  });
                }}
                min={0}
                max={100}
                step={5}
              />
            </div>

            {/* Boolean toggles */}
            <div className="col-span-2 flex flex-wrap gap-4 md:col-span-4">
              {([
                ["has_contact_form", "Contact Form"],
                ["has_phone", "Phone"],
                ["has_ecommerce", "E-commerce"],
                ["has_analytics", "Analytics"],
                ["has_ssl", "SSL"],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-xs">
                  <Switch
                    checked={searchParams.get(key) === "true"}
                    onCheckedChange={(checked) =>
                      updateParams({ [key]: checked ? "true" : undefined })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Data Table */}
      <div className={cn("relative overflow-x-auto rounded-lg border", isPending && "opacity-60")}>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="w-10 p-3">
                <button onClick={selectAll} className="flex items-center">
                  <CheckSquare className={cn("h-4 w-4", selected.size === companies.length && selected.size > 0 ? "text-primary" : "text-muted-foreground")} />
                </button>
              </th>
              {[
                ["company_name", "Company"],
                ["provincia", "Location"],
                ["sector", "Sector"],
                ["business_type", "Type"],
                ["cms_platform", "CMS"],
                ["priority_score", "Score"],
                ["outreach_tier", "Tier"],
                ["contact_status", "Status"],
              ].map(([key, label]) => (
                <th
                  key={key}
                  className="cursor-pointer p-3 text-left hover:text-foreground"
                  onClick={() =>
                    updateParams({
                      sortBy: key,
                      sortOrder:
                        pagination.sortBy === key && pagination.sortOrder === "desc"
                          ? "asc"
                          : "desc",
                      page: String(pagination.page),
                    })
                  }
                >
                  {label}
                  {pagination.sortBy === key && (
                    <span className="ml-1">{pagination.sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
              ))}
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company, idx) => (
              <tr
                key={company.id}
                className={cn(
                  "border-b transition-colors hover:bg-accent/50",
                  idx === activeRow && "bg-accent/30",
                  selected.has(company.id) && "bg-primary/5"
                )}
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(company.id)}
                    onChange={() => toggleSelect(company.id)}
                    className="rounded"
                  />
                </td>
                <td className="p-3">
                  <a href={`/companies/${company.id}`} className="hover:underline">
                    <div className="font-medium">{company.company_name}</div>
                    <div className="text-xs text-muted-foreground">{company.domain}</div>
                  </a>
                </td>
                <td className="p-3 text-xs">
                  {company.provincia}
                  {company.localidad && (
                    <span className="text-muted-foreground"> · {company.localidad}</span>
                  )}
                </td>
                <td className="max-w-[150px] truncate p-3 text-xs">{company.sector ?? "—"}</td>
                <td className="p-3 text-xs">{company.business_type ?? "—"}</td>
                <td className="p-3 text-xs">{company.cms_platform ?? "—"}</td>
                <td className="p-3">
                  <span className={cn("text-sm font-semibold", scoreColor(company.priority_score))}>
                    {formatScore(company.priority_score)}
                  </span>
                </td>
                <td className="p-3">
                  {company.outreach_tier && (
                    <Badge className={tierColor(company.outreach_tier)} variant="outline">
                      {company.outreach_tier}
                    </Badge>
                  )}
                </td>
                <td className="p-3">
                  {company.contact_status ? (
                    <Badge className={contactStatusColor(company.contact_status)}>
                      {company.contact_status}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    {company.normalized_url && (
                      <a
                        href={company.normalized_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1 hover:bg-accent"
                        title="Open website"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {company.phone_from_csv && (
                      <button
                        className="rounded p-1 hover:bg-accent"
                        title={`Copy: ${company.phone_from_csv}`}
                        onClick={() => navigator.clipboard.writeText(company.phone_from_csv!)}
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={10} className="p-12 text-center text-muted-foreground">
                  No companies match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page:</span>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(v) => updateParams({ pageSize: v, page: "1" })}
          >
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>
            Page {pagination.page} of {totalPages}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={pagination.page <= 1}
            onClick={() => updateParams({ page: String(pagination.page - 1) })}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pagination.page >= totalPages}
            onClick={() => updateParams({ page: String(pagination.page + 1) })}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

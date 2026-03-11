"use server";

import { createServerClient } from "./supabase";
import type { Company, CompanyFilters, PaginationParams, AnalysisResult, ContactStatus } from "@/types/database";

// Cache whether contact_status column exists to avoid repeated checks
let _hasContactStatus: boolean | null = null;

async function hasContactStatusColumn(): Promise<boolean> {
  if (_hasContactStatus !== null) return _hasContactStatus;
  const supabase = createServerClient();
  const { error } = await supabase
    .from("companies")
    .select("contact_status")
    .limit(1);
  _hasContactStatus = !error;
  return _hasContactStatus;
}

// Cache whether contact_email column exists
let _hasContactEmail: boolean | null = null;

export async function hasContactEmailColumn(): Promise<boolean> {
  if (_hasContactEmail !== null) return _hasContactEmail;
  const supabase = createServerClient();
  const { error } = await supabase
    .from("companies")
    .select("contact_email")
    .limit(1);
  _hasContactEmail = !error;
  return _hasContactEmail;
}

// ─── Column sets (with/without contact_status) ──────────────────
// NOTE: These are defined as separate constant strings (not concatenated)
// because the Supabase client parses select strings at the type level.

const LIST_COLS = "id, company_name, domain, normalized_url, provincia, localidad, cnae_description, phone_from_csv, sector, business_type, company_size_signal, cms_platform, priority_score, outreach_tier, scored_at, has_contact_form, has_phone_number, has_ecommerce, has_analytics, has_ssl, improvement_potential, notable_weaknesses, tier1_status, tier2_status";

const LIST_COLS_WITH_CS = "id, company_name, domain, normalized_url, provincia, localidad, cnae_description, phone_from_csv, sector, business_type, company_size_signal, cms_platform, priority_score, outreach_tier, scored_at, contact_status, has_contact_form, has_phone_number, has_ecommerce, has_analytics, has_ssl, improvement_potential, notable_weaknesses, tier1_status, tier2_status";

const LIST_COLS_WITH_EMAIL = "id, company_name, domain, normalized_url, provincia, localidad, cnae_description, phone_from_csv, contact_email, sector, business_type, company_size_signal, cms_platform, priority_score, outreach_tier, scored_at, has_contact_form, has_phone_number, has_ecommerce, has_analytics, has_ssl, improvement_potential, notable_weaknesses, tier1_status, tier2_status";

const LIST_COLS_WITH_CS_EMAIL = "id, company_name, domain, normalized_url, provincia, localidad, cnae_description, phone_from_csv, contact_email, sector, business_type, company_size_signal, cms_platform, priority_score, outreach_tier, scored_at, contact_status, has_contact_form, has_phone_number, has_ecommerce, has_analytics, has_ssl, improvement_potential, notable_weaknesses, tier1_status, tier2_status";

const CARD_COLS = "id, company_name, domain, priority_score, outreach_tier, sector, provincia, phone_from_csv";

const CARD_COLS_WITH_CS = "id, company_name, domain, priority_score, outreach_tier, sector, provincia, phone_from_csv, contact_status";

const DETAIL_COLS = "id, company_name, domain, normalized_url, raw_url, provincia, localidad, cnae_code, cnae_description, phone_from_csv, sector, business_type, company_size_signal, cms_platform, priority_score, outreach_tier, scored_at, has_contact_form, has_phone_number, has_ecommerce, has_analytics, has_ssl, improvement_potential, notable_weaknesses, tier1_status, tier2_status, tier3_status, is_reachable, http_status, response_time_ms, page_size_kb, detected_language, has_mobile_viewport, has_cta_button, has_social_links, has_chat_widget, geographic_focus, value_prop_clarity, cta_quality, content_quality, trust_signals_count, has_testimonials, has_case_studies, has_pricing, has_blog, has_faq, has_booking_system, target_audience, ingested_at, tier1_completed_at, tier2_completed_at, last_error";

const DETAIL_COLS_WITH_EMAIL = "id, company_name, domain, normalized_url, raw_url, provincia, localidad, cnae_code, cnae_description, phone_from_csv, contact_email, sector, business_type, company_size_signal, cms_platform, priority_score, outreach_tier, scored_at, has_contact_form, has_phone_number, has_ecommerce, has_analytics, has_ssl, improvement_potential, notable_weaknesses, tier1_status, tier2_status, tier3_status, is_reachable, http_status, response_time_ms, page_size_kb, detected_language, has_mobile_viewport, has_cta_button, has_social_links, has_chat_widget, geographic_focus, value_prop_clarity, cta_quality, content_quality, trust_signals_count, has_testimonials, has_case_studies, has_pricing, has_blog, has_faq, has_booking_system, target_audience, ingested_at, tier1_completed_at, tier2_completed_at, last_error";

// ─── Dashboard Queries ───────────────────────────────────────────

export async function getDashboardMetrics() {
  const supabase = createServerClient();

  const [totalRes, tier1Res, tier2Res, hotRes, warmRes, coldRes, disqRes, recentRes] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("tier1_status", "completed"),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("tier2_status", "completed"),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("outreach_tier", "hot"),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("outreach_tier", "warm"),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("outreach_tier", "cold"),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("outreach_tier", "disqualified"),
    supabase
      .from("companies")
      .select("id, company_name, domain, priority_score, outreach_tier, scored_at, provincia, sector")
      .not("priority_score", "is", null)
      .order("scored_at", { ascending: false })
      .limit(10),
  ]);

  return {
    total: totalRes.count ?? 0,
    tier1_completed: tier1Res.count ?? 0,
    tier2_completed: tier2Res.count ?? 0,
    hot: hotRes.count ?? 0,
    warm: warmRes.count ?? 0,
    cold: coldRes.count ?? 0,
    disqualified: disqRes.count ?? 0,
    recent: (recentRes.data ?? []) as Pick<Company, "id" | "company_name" | "domain" | "priority_score" | "outreach_tier" | "scored_at" | "provincia" | "sector">[],
  };
}

export async function getScoreDistribution() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("companies")
    .select("priority_score")
    .not("priority_score", "is", null)
    .order("priority_score", { ascending: true }) as { data: { priority_score: number }[] | null };

  if (!data) return [];

  const buckets: { range: string; count: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const min = i * 10;
    const max = (i + 1) * 10;
    const count = data.filter(
      (r) => r.priority_score >= min && r.priority_score < (i === 9 ? 101 : max)
    ).length;
    buckets.push({ range: `${min}-${max}`, count });
  }
  return buckets;
}

export async function getPipelineProgress() {
  const supabase = createServerClient();

  const [
    t1Pending, t1InProgress, t1Completed, t1Failed,
    t2Pending, t2InProgress, t2Completed, t2Failed, t2NotEligible,
  ] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("tier1_status", "pending"),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("tier1_status", "in_progress"),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("tier1_status", "completed"),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("tier1_status", "failed"),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("tier2_status", "pending"),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("tier2_status", "in_progress"),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("tier2_status", "completed"),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("tier2_status", "failed"),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("tier2_status", "not_eligible"),
  ]);

  return {
    tier1: {
      pending: t1Pending.count ?? 0,
      in_progress: t1InProgress.count ?? 0,
      completed: t1Completed.count ?? 0,
      failed: t1Failed.count ?? 0,
    },
    tier2: {
      pending: t2Pending.count ?? 0,
      in_progress: t2InProgress.count ?? 0,
      completed: t2Completed.count ?? 0,
      failed: t2Failed.count ?? 0,
      not_eligible: t2NotEligible.count ?? 0,
    },
  };
}

// ─── Companies Queries ───────────────────────────────────────────

export async function getCompanies(
  filters: CompanyFilters,
  pagination: PaginationParams
): Promise<{ data: Company[]; total: number }> {
  const supabase = createServerClient();
  const [hasCsCol, hasEmailCol] = await Promise.all([
    hasContactStatusColumn(),
    hasContactEmailColumn(),
  ]);

  const cols: string = hasCsCol && hasEmailCol ? LIST_COLS_WITH_CS_EMAIL
    : hasCsCol ? LIST_COLS_WITH_CS
    : hasEmailCol ? LIST_COLS_WITH_EMAIL
    : LIST_COLS;

  let query = supabase
    .from("companies")
    .select(cols, { count: "exact" });

  // Apply filters
  if (filters.outreach_tier?.length) {
    query = query.in("outreach_tier", filters.outreach_tier);
  }
  if (filters.provincia) {
    query = query.eq("provincia", filters.provincia);
  }
  if (filters.sector) {
    query = query.ilike("sector", `%${filters.sector}%`);
  }
  if (filters.business_type) {
    query = query.eq("business_type", filters.business_type);
  }
  if (filters.company_size_signal) {
    query = query.eq("company_size_signal", filters.company_size_signal);
  }
  if (filters.cms_platform) {
    query = query.eq("cms_platform", filters.cms_platform);
  }
  if (filters.score_min !== undefined) {
    query = query.gte("priority_score", filters.score_min);
  }
  if (filters.score_max !== undefined) {
    query = query.lte("priority_score", filters.score_max);
  }
  if (filters.has_contact_form !== undefined) {
    query = query.eq("has_contact_form", filters.has_contact_form);
  }
  if (filters.has_phone_number !== undefined) {
    query = query.eq("has_phone_number", filters.has_phone_number);
  }
  if (filters.has_ecommerce !== undefined) {
    query = query.eq("has_ecommerce", filters.has_ecommerce);
  }
  if (filters.has_analytics !== undefined) {
    query = query.eq("has_analytics", filters.has_analytics);
  }
  if (filters.has_ssl !== undefined) {
    query = query.eq("has_ssl", filters.has_ssl);
  }
  if (filters.has_email !== undefined && hasEmailCol) {
    if (filters.has_email) {
      query = query.not("contact_email", "is", null).neq("contact_email" as string, "");
    } else {
      query = query.or("contact_email.is.null,contact_email.eq.");
    }
  }
  if (filters.contact_status && hasCsCol) {
    query = query.eq("contact_status", filters.contact_status);
  }
  if (filters.search) {
    query = query.or(
      `company_name.ilike.%${filters.search}%,domain.ilike.%${filters.search}%`
    );
  }

  // Sorting — guard against sorting by contact_status if it doesn't exist
  const sortBy = (!hasCsCol && pagination.sortBy === "contact_status")
    ? "priority_score"
    : pagination.sortBy;
  const ascending = pagination.sortOrder === "asc";
  query = query.order(sortBy, { ascending, nullsFirst: false });

  // Pagination
  const from = (pagination.page - 1) * pagination.pageSize;
  const to = from + pagination.pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("getCompanies error:", error.message, error.code, error.details);
    return { data: [], total: 0 };
  }

  return { data: (data ?? []) as unknown as Company[], total: count ?? 0 };
}

// ─── Company Detail ──────────────────────────────────────────────

export async function getCompanyById(id: string): Promise<Company | null> {
  const supabase = createServerClient();
  const [hasCsCol, hasEmailCol] = await Promise.all([
    hasContactStatusColumn(),
    hasContactEmailColumn(),
  ]);

  // Use * when both optional columns exist, otherwise pick the right set
  const detailCols: string = (hasCsCol && hasEmailCol) ? "*"
    : hasEmailCol ? DETAIL_COLS_WITH_EMAIL
    : DETAIL_COLS;

  const { data, error } = await supabase
    .from("companies")
    .select(detailCols)
    .eq("id", id)
    .single();

  if (error) {
    console.error("getCompanyById error:", error.message);
    return null;
  }
  return data as unknown as Company;
}

export async function getAnalysisForCompany(companyId: string): Promise<AnalysisResult | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("analysis_results")
    .select("*")
    .eq("company_id", companyId)
    .order("analyzed_at", { ascending: false })
    .limit(1)
    .single();

  return (data as AnalysisResult) ?? null;
}

export async function getSimilarCompanies(company: Company): Promise<Company[]> {
  const supabase = createServerClient();
  let query = supabase
    .from("companies")
    .select("id, company_name, domain, priority_score, outreach_tier, sector, provincia")
    .neq("id", company.id)
    .not("priority_score", "is", null)
    .order("priority_score", { ascending: false })
    .limit(5);

  if (company.sector) {
    query = query.ilike("sector", `%${company.sector}%`);
  }
  if (company.provincia) {
    query = query.eq("provincia", company.provincia);
  }

  const { data } = await query;
  return (data ?? []) as Company[];
}

// ─── Actions ─────────────────────────────────────────────────────

export async function updateContactStatus(companyId: string, status: ContactStatus): Promise<boolean> {
  const hasCsCol = await hasContactStatusColumn();
  if (!hasCsCol) {
    console.warn("contact_status column does not exist yet. Run supabase-migration.sql first.");
    return false;
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("companies")
    .update({ contact_status: status })
    .eq("id", companyId);

  if (error) {
    console.error("updateContactStatus error:", error.message);
    return false;
  }
  return true;
}

export async function bulkUpdateContactStatus(companyIds: string[], status: ContactStatus): Promise<boolean> {
  const hasCsCol = await hasContactStatusColumn();
  if (!hasCsCol) return false;

  const supabase = createServerClient();
  const { error } = await supabase
    .from("companies")
    .update({ contact_status: status })
    .in("id", companyIds);

  if (error) {
    console.error("bulkUpdateContactStatus error:", error.message);
    return false;
  }
  return true;
}

// ─── Filter Options ──────────────────────────────────────────────

export async function getFilterOptions() {
  const supabase = createServerClient();

  const [provinciaRes, sectorRes, cmsRes] = await Promise.all([
    supabase.from("companies").select("provincia").not("provincia", "is", null).limit(1000),
    supabase.from("companies").select("sector").not("sector", "is", null).limit(1000),
    supabase.from("companies").select("cms_platform").not("cms_platform", "is", null).limit(1000),
  ]);

  const unique = (arr: { [k: string]: string | null }[], key: string) =>
    [...new Set(arr.map((r) => r[key]).filter(Boolean))].sort() as string[];

  return {
    provincias: unique(provinciaRes.data ?? [], "provincia"),
    sectors: unique(sectorRes.data ?? [], "sector"),
    cms_platforms: unique(cmsRes.data ?? [], "cms_platform"),
  };
}

// ─── Analytics Queries ───────────────────────────────────────────

export async function getAnalyticsData() {
  const supabase = createServerClient();

  const [sectorRes, provinciaRes, cmsRes, weaknessRes, sizeRes] = await Promise.all([
    supabase
      .from("companies")
      .select("sector, priority_score")
      .not("sector", "is", null)
      .not("priority_score", "is", null),
    supabase
      .from("companies")
      .select("provincia, priority_score, outreach_tier")
      .not("provincia", "is", null)
      .not("priority_score", "is", null),
    supabase
      .from("companies")
      .select("cms_platform")
      .not("cms_platform", "is", null),
    supabase
      .from("companies")
      .select("notable_weaknesses")
      .not("notable_weaknesses", "is", null),
    supabase
      .from("companies")
      .select("company_size_signal, priority_score")
      .not("company_size_signal", "is", null)
      .not("priority_score", "is", null),
  ]);

  // Sector aggregation
  const sectorMap = new Map<string, { count: number; totalScore: number }>();
  for (const row of sectorRes.data ?? []) {
    const s = row.sector as string;
    const existing = sectorMap.get(s) ?? { count: 0, totalScore: 0 };
    existing.count++;
    existing.totalScore += row.priority_score as number;
    sectorMap.set(s, existing);
  }
  const topSectors = [...sectorMap.entries()]
    .map(([name, { count, totalScore }]) => ({ name, count, avgScore: Math.round(totalScore / count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Provincia aggregation
  const provMap = new Map<string, { count: number; hot: number; warm: number; cold: number; avgScore: number; totalScore: number }>();
  for (const row of provinciaRes.data ?? []) {
    const p = row.provincia as string;
    const existing = provMap.get(p) ?? { count: 0, hot: 0, warm: 0, cold: 0, avgScore: 0, totalScore: 0 };
    existing.count++;
    existing.totalScore += row.priority_score as number;
    if (row.outreach_tier === "hot") existing.hot++;
    else if (row.outreach_tier === "warm") existing.warm++;
    else if (row.outreach_tier === "cold") existing.cold++;
    provMap.set(p, existing);
  }
  const byProvincia = [...provMap.entries()]
    .map(([name, d]) => ({ name, ...d, avgScore: Math.round(d.totalScore / d.count) }))
    .sort((a, b) => b.count - a.count);

  // CMS distribution
  const cmsMap = new Map<string, number>();
  for (const row of cmsRes.data ?? []) {
    const c = row.cms_platform as string;
    cmsMap.set(c, (cmsMap.get(c) ?? 0) + 1);
  }
  const cmsDist = [...cmsMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Weakness frequency
  const weakMap = new Map<string, number>();
  for (const row of weaknessRes.data ?? []) {
    const weaknesses = row.notable_weaknesses as string[];
    if (Array.isArray(weaknesses)) {
      for (const w of weaknesses) {
        weakMap.set(w, (weakMap.get(w) ?? 0) + 1);
      }
    }
  }
  const topWeaknesses = [...weakMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // Size distribution
  const sizeMap = new Map<string, { count: number; totalScore: number }>();
  for (const row of sizeRes.data ?? []) {
    const s = row.company_size_signal as string;
    const existing = sizeMap.get(s) ?? { count: 0, totalScore: 0 };
    existing.count++;
    existing.totalScore += row.priority_score as number;
    sizeMap.set(s, existing);
  }
  const sizeDist = [...sizeMap.entries()]
    .map(([name, { count, totalScore }]) => ({ name, count, avgScore: Math.round(totalScore / count) }));

  // Email distribution (only if column exists)
  let emailDist: { name: string; count: number }[] = [];
  const hasEmailCol = await hasContactEmailColumn();
  if (hasEmailCol) {
    const [withRes, totalScoredRes] = await Promise.all([
      supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .not("contact_email", "is", null)
        .neq("contact_email" as string, "")
        .not("priority_score", "is", null),
      supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .not("priority_score", "is", null),
    ]);

    const withEmail = withRes.count ?? 0;
    const totalScored = totalScoredRes.count ?? 0;
    emailDist = [
      { name: "With Email", count: withEmail },
      { name: "Without Email", count: totalScored - withEmail },
    ];
  }

  return { topSectors, byProvincia, cmsDist, topWeaknesses, sizeDist, emailDist };
}

// ─── Outreach Queries ────────────────────────────────────────────

export async function getOutreachBoard() {
  const supabase = createServerClient();
  const hasCsCol = await hasContactStatusColumn();

  if (hasCsCol) {
    // Full outreach board with contact_status columns
    const statuses = ["new", "contacted", "replied", "meeting", "won", "lost"];

    const results = await Promise.all(
      statuses.map(async (status) => {
        const { data, count } = await supabase
          .from("companies")
          .select(CARD_COLS_WITH_CS, { count: "exact" })
          .eq("contact_status", status)
          .not("priority_score", "is", null)
          .order("priority_score", { ascending: false })
          .limit(50);

        return { status, data: (data ?? []) as Company[], count: count ?? 0 };
      })
    );

    const { data: uncontacted, count: uncontactedCount } = await supabase
      .from("companies")
      .select(CARD_COLS_WITH_CS, { count: "exact" })
      .in("outreach_tier", ["hot", "warm"])
      .is("contact_status", null)
      .not("priority_score", "is", null)
      .order("priority_score", { ascending: false })
      .limit(50);

    return {
      columns: results.reduce((acc, { status, data, count }) => {
        acc[status] = { data, count };
        return acc;
      }, {} as Record<string, { data: Company[]; count: number }>),
      uncontacted: { data: (uncontacted ?? []) as Company[], count: uncontactedCount ?? 0 },
    };
  }

  // Fallback: no contact_status column — just show hot/warm leads as uncontacted
  const { data: hotWarm, count: hwCount } = await supabase
    .from("companies")
    .select(CARD_COLS, { count: "exact" })
    .in("outreach_tier", ["hot", "warm"])
    .not("priority_score", "is", null)
    .order("priority_score", { ascending: false })
    .limit(50);

  const emptyCol = { data: [] as Company[], count: 0 };
  return {
    columns: {
      new: emptyCol,
      contacted: emptyCol,
      replied: emptyCol,
      meeting: emptyCol,
      won: emptyCol,
      lost: emptyCol,
    },
    uncontacted: { data: (hotWarm ?? []) as Company[], count: hwCount ?? 0 },
  };
}

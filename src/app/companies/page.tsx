import { getCompanies, getFilterOptions } from "@/lib/queries";
import { CompaniesClient } from "@/components/companies/companies-client";
import type { CompanyFilters, PaginationParams, OutreachTier, BusinessType, CompanySize, ContactStatus } from "@/types/database";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CompaniesPage({ searchParams }: Props) {
  const params = await searchParams;

  const filters: CompanyFilters = {};
  if (params.tier) {
    const tiers = (typeof params.tier === "string" ? params.tier.split(",") : params.tier) as OutreachTier[];
    filters.outreach_tier = tiers;
  }
  if (params.provincia) filters.provincia = params.provincia as string;
  if (params.sector) filters.sector = params.sector as string;
  if (params.business_type) filters.business_type = params.business_type as BusinessType;
  if (params.size) filters.company_size_signal = params.size as CompanySize;
  if (params.cms) filters.cms_platform = params.cms as string;
  if (params.score_min) filters.score_min = Number(params.score_min);
  if (params.score_max) filters.score_max = Number(params.score_max);
  if (params.has_contact_form === "true") filters.has_contact_form = true;
  if (params.has_phone === "true") filters.has_phone_number = true;
  if (params.has_ecommerce === "true") filters.has_ecommerce = true;
  if (params.has_analytics === "true") filters.has_analytics = true;
  if (params.has_ssl === "true") filters.has_ssl = true;
  if (params.has_email === "true") filters.has_email = true;
  if (params.contact_status) filters.contact_status = params.contact_status as ContactStatus;
  if (params.search) filters.search = params.search as string;

  const pagination: PaginationParams = {
    page: params.page ? Number(params.page) : 1,
    pageSize: params.pageSize ? Number(params.pageSize) : 25,
    sortBy: (params.sortBy as string) || "priority_score",
    sortOrder: (params.sortOrder as "asc" | "desc") || "desc",
  };

  const [{ data, total }, filterOptions] = await Promise.all([
    getCompanies(filters, pagination),
    getFilterOptions(),
  ]);

  return (
    <CompaniesClient
      companies={data}
      total={total}
      filters={filters}
      pagination={pagination}
      filterOptions={filterOptions}
    />
  );
}

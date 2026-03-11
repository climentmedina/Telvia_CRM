export interface Company {
  id: string;
  company_name: string;
  domain: string;
  raw_url: string | null;
  normalized_url: string | null;

  // CRM data
  provincia: string | null;
  localidad: string | null;
  cnae_code: string | null;
  cnae_description: string | null;
  phone_from_csv: string | null;

  // Pipeline status
  tier1_status: PipelineStatus | null;
  tier2_status: PipelineStatus | "not_eligible" | null;
  tier3_status: PipelineStatus | "not_eligible" | null;

  // Tier 1 signals
  is_reachable: boolean | null;
  http_status: number | null;
  response_time_ms: number | null;
  has_ssl: boolean | null;
  page_size_kb: number | null;
  detected_language: string | null;
  cms_platform: string | null;
  has_analytics: boolean | null;
  has_mobile_viewport: boolean | null;
  has_contact_form: boolean | null;
  has_phone_number: boolean | null;
  has_cta_button: boolean | null;
  has_social_links: boolean | null;
  has_chat_widget: boolean | null;

  // Tier 2 signals
  sector: string | null;
  business_type: string | null;
  company_size_signal: string | null;
  geographic_focus: string | null;
  value_prop_clarity: number | null;
  cta_quality: number | null;
  content_quality: number | null;
  trust_signals_count: number | null;
  has_testimonials: boolean | null;
  has_case_studies: boolean | null;
  has_pricing: boolean | null;
  has_blog: boolean | null;
  has_faq: boolean | null;
  has_booking_system: boolean | null;
  has_ecommerce: boolean | null;
  improvement_potential: number | null;
  notable_weaknesses: string[] | null;
  target_audience: string | null;

  // Scoring
  priority_score: number | null;
  outreach_tier: OutreachTier | null;
  scored_at: string | null;

  // Timestamps
  ingested_at: string | null;
  tier1_completed_at: string | null;
  tier2_completed_at: string | null;
  last_error: string | null;

  // Contact tracking (local CRM layer)
  contact_status: ContactStatus | null;

  // Email address (scraped from website)
  contact_email: string | null;
}

export interface AnalysisResult {
  id: string;
  company_id: string;
  analyzed_at: string | null;
  model_used: string | null;
  roast_text: string | null;
  recommendations: Recommendation[] | null;
  outreach_brief: string | null;
  estimated_value: string | null;
}

export interface Recommendation {
  title: string;
  description: string;
  impact: string;
  effort: string;
}

export type PipelineStatus = "pending" | "in_progress" | "completed" | "failed" | "skipped";
export type OutreachTier = "hot" | "warm" | "cold" | "disqualified";
export type ContactStatus = "new" | "contacted" | "replied" | "meeting" | "won" | "lost";
export type BusinessType = "B2B" | "B2C" | "B2G" | "mixed";
export type CompanySize = "micro" | "small" | "medium" | "large";

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: Partial<Company>;
        Update: Partial<Company>;
      };
      analysis_results: {
        Row: AnalysisResult;
        Insert: Partial<AnalysisResult>;
        Update: Partial<AnalysisResult>;
      };
    };
    Views: {
      pipeline_progress: { Row: Record<string, number> };
      top_prospects: { Row: Company & Partial<AnalysisResult> };
    };
  };
}

// Filter types
export interface CompanyFilters {
  outreach_tier?: OutreachTier[];
  provincia?: string;
  sector?: string;
  business_type?: BusinessType;
  company_size_signal?: CompanySize;
  cms_platform?: string;
  score_min?: number;
  score_max?: number;
  has_contact_form?: boolean;
  has_phone_number?: boolean;
  has_ecommerce?: boolean;
  has_analytics?: boolean;
  has_ssl?: boolean;
  has_email?: boolean;
  contact_status?: ContactStatus;
  search?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

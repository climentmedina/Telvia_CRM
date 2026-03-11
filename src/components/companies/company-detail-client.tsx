"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Phone,
  Mail,
  Globe,
  Shield,
  Smartphone,
  MessageSquare,
  Share2,
  Bot,
  ShoppingCart,
  BookOpen,
  HelpCircle,
  Calendar,
  Award,
  FileText,
  DollarSign,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Company, AnalysisResult, ContactStatus } from "@/types/database";
import { cn, tierColor, formatScore, scoreColor, formatDate, contactStatusColor, formatNumber } from "@/lib/utils";
import { updateContactStatus } from "@/lib/queries";

interface Props {
  company: Company;
  analysis: AnalysisResult | null;
  similar: Company[];
}

const scoreFactors = [
  { key: "improvement_potential", label: "Improvement Potential", weight: 30, max: 5 },
  { key: "cta_quality", label: "CTA Quality (inv)", weight: 15, max: 5, invert: true },
  { key: "value_prop_clarity", label: "Value Prop (inv)", weight: 12, max: 5, invert: true },
  { key: "has_contact_form", label: "Contact Form", weight: 15, type: "bool" },
  { key: "company_size_signal", label: "Company Size", weight: 12, type: "size" },
  { key: "trust_signals_count", label: "Trust Signals (inv)", weight: 8, max: 10, invert: true },
  { key: "is_reachable", label: "Reachable", weight: 5, type: "bool" },
  { key: "has_ssl", label: "SSL", weight: 3, type: "bool" },
];

export function CompanyDetailClient({ company, analysis, similar }: Props) {
  const router = useRouter();
  const [contactStatus, setContactStatus] = useState<ContactStatus | null>(company.contact_status);

  const handleStatusChange = async (status: string) => {
    const s = status as ContactStatus;
    setContactStatus(s);
    await updateContactStatus(company.id, s);
  };

  const signals = [
    { icon: Globe, label: "Reachable", value: company.is_reachable, type: "bool" },
    { icon: Shield, label: "SSL", value: company.has_ssl, type: "bool" },
    { icon: Smartphone, label: "Mobile Viewport", value: company.has_mobile_viewport, type: "bool" },
    { icon: MessageSquare, label: "Contact Form", value: company.has_contact_form, type: "bool" },
    { icon: Phone, label: "Phone on Site", value: company.has_phone_number, type: "bool" },
    { icon: Mail, label: "Email Available", value: !!company.contact_email, type: "bool" },
    { icon: Award, label: "CTA Button", value: company.has_cta_button, type: "bool" },
    { icon: Share2, label: "Social Links", value: company.has_social_links, type: "bool" },
    { icon: Bot, label: "Chat Widget", value: company.has_chat_widget, type: "bool" },
    { icon: BookOpen, label: "Blog", value: company.has_blog, type: "bool" },
    { icon: HelpCircle, label: "FAQ", value: company.has_faq, type: "bool" },
    { icon: Calendar, label: "Booking System", value: company.has_booking_system, type: "bool" },
    { icon: ShoppingCart, label: "E-commerce", value: company.has_ecommerce, type: "bool" },
    { icon: FileText, label: "Case Studies", value: company.has_case_studies, type: "bool" },
    { icon: DollarSign, label: "Pricing Page", value: company.has_pricing, type: "bool" },
    { icon: Award, label: "Testimonials", value: company.has_testimonials, type: "bool" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{company.company_name}</h1>
              {company.outreach_tier && (
                <Badge className={tierColor(company.outreach_tier)} variant="outline">
                  {company.outreach_tier}
                </Badge>
              )}
              {contactStatus && (
                <Badge className={contactStatusColor(contactStatus)}>
                  {contactStatus}
                </Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span>{company.domain}</span>
              {company.provincia && <span>· {company.provincia}</span>}
              {company.localidad && <span>· {company.localidad}</span>}
              {company.sector && <span>· {company.sector}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={contactStatus ?? "none"} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Set status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          {company.normalized_url && (
            <Button asChild variant="outline">
              <a href={company.normalized_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Visit Site
              </a>
            </Button>
          )}
          {company.phone_from_csv && (
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(company.phone_from_csv!)}
            >
              <Phone className="mr-2 h-4 w-4" /> {company.phone_from_csv}
            </Button>
          )}
          {company.contact_email && (
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(company.contact_email!)}
            >
              <Mail className="mr-2 h-4 w-4" /> {company.contact_email}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="signals">Signals</TabsTrigger>
              <TabsTrigger value="score">Score Breakdown</TabsTrigger>
              {analysis && <TabsTrigger value="analysis">Deep Analysis</TabsTrigger>}
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard label="Priority Score" value={formatScore(company.priority_score)} color={scoreColor(company.priority_score)} />
                <StatCard label="Improvement Potential" value={company.improvement_potential ? `${company.improvement_potential}/5` : "—"} />
                <StatCard label="CTA Quality" value={company.cta_quality ? `${company.cta_quality}/5` : "—"} />
                <StatCard label="Content Quality" value={company.content_quality ? `${company.content_quality}/5` : "—"} />
                <StatCard label="Value Proposition" value={company.value_prop_clarity ? `${company.value_prop_clarity}/5` : "—"} />
                <StatCard label="Trust Signals" value={company.trust_signals_count !== null ? String(company.trust_signals_count) : "—"} />
                <StatCard label="Business Type" value={company.business_type ?? "—"} />
                <StatCard label="Company Size" value={company.company_size_signal ?? "—"} />
              </div>

              {/* Weaknesses */}
              {company.notable_weaknesses && company.notable_weaknesses.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Notable Weaknesses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {company.notable_weaknesses.map((w, i) => (
                        <Badge key={i} variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400">
                          {w}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Technical Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Technical Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <Detail label="CMS" value={company.cms_platform} />
                    <Detail label="HTTP Status" value={company.http_status?.toString()} />
                    <Detail label="Response Time" value={company.response_time_ms ? `${company.response_time_ms}ms` : null} />
                    <Detail label="Page Size" value={company.page_size_kb ? `${company.page_size_kb}KB` : null} />
                    <Detail label="Language" value={company.detected_language} />
                    <Detail label="Analytics" value={company.has_analytics ? "Yes" : "No"} />
                    <Detail label="CNAE" value={company.cnae_code} />
                    <Detail label="CNAE Description" value={company.cnae_description} />
                  </div>
                </CardContent>
              </Card>

              {company.target_audience && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Target Audience</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{company.target_audience}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Signals */}
            <TabsContent value="signals">
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {signals.map(({ icon: Icon, label, value }) => (
                      <div
                        key={label}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3",
                          value === true && "border-green-500/30 bg-green-500/5",
                          value === false && "border-red-500/30 bg-red-500/5",
                          value === null && "border-muted"
                        )}
                      >
                        <Icon className={cn(
                          "h-4 w-4",
                          value === true && "text-green-600",
                          value === false && "text-red-500",
                          value === null && "text-muted-foreground"
                        )} />
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">
                            {value === true ? "Yes" : value === false ? "No" : "Unknown"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Score Breakdown */}
            <TabsContent value="score">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold">{formatScore(company.priority_score)}</p>
                    <p className="text-sm text-muted-foreground">out of 100</p>
                  </div>
                  <div className="space-y-3">
                    {scoreFactors.map(({ key, label, weight }) => {
                      const raw = company[key as keyof Company];
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="w-40 text-sm text-muted-foreground">{label}</span>
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full score-bar"
                              style={{ width: `${raw !== null && raw !== undefined ? 60 : 0}%` }}
                            />
                          </div>
                          <span className="w-16 text-right text-xs text-muted-foreground">
                            {weight}% weight
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Deep Analysis (Tier 3) */}
            {analysis && (
              <TabsContent value="analysis" className="space-y-4">
                {analysis.roast_text && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Website Critique</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{analysis.roast_text}</p>
                    </CardContent>
                  </Card>
                )}

                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analysis.recommendations.map((rec, i) => (
                          <div key={i} className="rounded-lg border p-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{rec.title}</h4>
                              <div className="flex gap-2">
                                <Badge variant="outline">Impact: {rec.impact}</Badge>
                                <Badge variant="outline">Effort: {rec.effort}</Badge>
                              </div>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{rec.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {analysis.outreach_brief && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle>Outreach Email Draft</CardTitle>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(analysis.outreach_brief!)}
                        >
                          <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm">
                        {analysis.outreach_brief}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {analysis.estimated_value && (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Estimated Value</p>
                      <p className="text-2xl font-bold">{analysis.estimated_value}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Timestamps */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <TimelineItem label="Ingested" date={company.ingested_at} />
              <TimelineItem label="Tier 1 Completed" date={company.tier1_completed_at} />
              <TimelineItem label="Tier 2 Completed" date={company.tier2_completed_at} />
              <TimelineItem label="Scored" date={company.scored_at} />
              {company.last_error && (
                <div className="rounded border border-red-500/30 bg-red-500/5 p-2 text-xs text-red-600">
                  Error: {company.last_error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Similar Companies */}
          {similar.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Similar Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {similar.map((s) => (
                    <Link
                      key={s.id}
                      href={`/companies/${s.id}`}
                      className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{s.company_name}</p>
                        <p className="text-xs text-muted-foreground">{s.provincia}</p>
                      </div>
                      <span className={cn("text-sm font-semibold", scoreColor(s.priority_score))}>
                        {formatScore(s.priority_score)}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pipeline Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Pipeline Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <StatusBadge label="Tier 1" status={company.tier1_status} />
              <StatusBadge label="Tier 2" status={company.tier2_status} />
              <StatusBadge label="Tier 3" status={company.tier3_status} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-lg font-bold", color)}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value ?? "—"}</p>
    </div>
  );
}

function TimelineItem({ label, date }: { label: string; date: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-xs">{formatDate(date)}</span>
    </div>
  );
}

function StatusBadge({ label, status }: { label: string; status: string | null }) {
  const color = {
    pending: "bg-yellow-500/15 text-yellow-700",
    in_progress: "bg-blue-500/15 text-blue-700",
    completed: "bg-green-500/15 text-green-700",
    failed: "bg-red-500/15 text-red-700",
    skipped: "bg-neutral-500/15 text-neutral-600",
    not_eligible: "bg-neutral-500/15 text-neutral-600",
  }[status ?? ""] ?? "bg-muted text-muted-foreground";

  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <Badge className={color}>{status ?? "—"}</Badge>
    </div>
  );
}

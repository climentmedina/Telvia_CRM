import { notFound } from "next/navigation";
import { getCompanyById, getAnalysisForCompany, getSimilarCompanies } from "@/lib/queries";
import { CompanyDetailClient } from "@/components/companies/company-detail-client";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: Props) {
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  const [analysis, similar] = await Promise.all([
    getAnalysisForCompany(id),
    getSimilarCompanies(company),
  ]);

  return (
    <CompanyDetailClient company={company} analysis={analysis} similar={similar} />
  );
}

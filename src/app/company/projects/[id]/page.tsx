import { ProjectDashboardView } from "@/client/views/company/ProjectDashboardView";

type PageProps = { params: Promise<{ id: string }> };

export default async function CompanyProjectPage({ params }: PageProps) {
  const { id } = await params;
  return <ProjectDashboardView projectId={id} />;
}

import { projectsController } from "@/server/controllers/projectsController";

export async function GET() {
  return projectsController.listSponsorable();
}

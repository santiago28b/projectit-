import { NextResponse } from "next/server";

import { jsonError } from "@/server/controllers/http";
import { getCompanyDashboard } from "@/server/services/companyDashboard";

export async function GET() {
  try {
    const dashboard = await getCompanyDashboard();
    if (!dashboard) {
      return NextResponse.json(
        { error: "Switch to a Company account first" },
        { status: 401 },
      );
    }
    return NextResponse.json(dashboard);
  } catch (err) {
    return jsonError(err);
  }
}

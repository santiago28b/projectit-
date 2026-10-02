import { NextResponse, type NextRequest } from "next/server";

import { jsonError } from "@/server/controllers/http";
import {
  getCurrentUser,
  homeForRole,
  loadCurrentUser,
} from "@/server/lib/currentUser";
import { CURRENT_USER_COOKIE } from "@/shared/constants";

const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

export const sessionController = {
  /** GET /api/session — who the role switcher says is looking. */
  async current() {
    try {
      const current = await getCurrentUser();
      return NextResponse.json({ current });
    } catch (err) {
      return jsonError(err);
    }
  },

  /** POST /api/session { userId } — switch to a seeded account. */
  async switchTo(request: NextRequest) {
    try {
      const body = (await request.json().catch(() => ({}))) as {
        userId?: unknown;
      };
      if (typeof body.userId !== "string" || !body.userId) {
        return NextResponse.json(
          { error: "Missing required field: userId" },
          { status: 400 },
        );
      }

      const current = await loadCurrentUser(body.userId);
      if (!current) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const response = NextResponse.json({
        current,
        home: homeForRole(current.user.role),
      });
      response.cookies.set(CURRENT_USER_COOKIE, current.user.id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: ONE_WEEK_SECONDS,
      });
      return response;
    } catch (err) {
      return jsonError(err);
    }
  },

  /** DELETE /api/session — clear the demo identity (browse as Guest). */
  async clear() {
    try {
      const response = NextResponse.json({ current: null });
      response.cookies.set(CURRENT_USER_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    } catch (err) {
      return jsonError(err);
    }
  },
};

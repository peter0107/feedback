import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { feedback } from "../../../db/schema";
import { teams } from "../../../lib/teams";

export const dynamic = "force-dynamic";

const validTeams = new Set(teams.map((team) => team.slug));

export async function GET(request: Request) {
  const team = new URL(request.url).searchParams.get("team");
  if (!team || !validTeams.has(team)) return Response.json({ error: "팀을 찾을 수 없습니다." }, { status: 400 });
  try {
    const rows = await getDb().select().from(feedback).where(eq(feedback.team, team)).orderBy(desc(feedback.createdAt));
    return Response.json({ feedback: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "의견을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ error: "잘못된 요청입니다." }, { status: 415 });
  if (Number(request.headers.get("content-length") || 0) > 5000) return Response.json({ error: "의견이 너무 깁니다." }, { status: 413 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "잘못된 요청입니다." }, { status: 403 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return Response.json({ error: "잘못된 요청입니다." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  const input = payload as { team?: unknown; body?: unknown; website?: unknown };
  if (input.website) return Response.json({ ok: true });
  if (typeof input.team !== "string" || !validTeams.has(input.team)) return Response.json({ error: "팀을 찾을 수 없습니다." }, { status: 400 });
  if (typeof input.body !== "string" || input.body.trim().length < 2 || input.body.trim().length > 1000) return Response.json({ error: "의견은 2~1,000자로 입력해 주세요." }, { status: 400 });
  try {
    await getDb().insert(feedback).values({ id: crypto.randomUUID(), team: input.team, body: input.body.trim() });
    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "의견을 등록하지 못했습니다." }, { status: 500 });
  }
}

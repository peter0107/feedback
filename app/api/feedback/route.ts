const feedbackServiceOrigin =
  process.env.FEEDBACK_API_ORIGIN ??
  "https://seongchangjae-feedback-2026.u-ncovering2026.chatgpt.site";

function feedbackUrl(request: Request) {
  const incoming = new URL(request.url);
  return new URL(`/api/feedback${incoming.search}`, feedbackServiceOrigin);
}

function proxyResponse(response: Response) {
  const headers = new Headers();
  const contentType = response.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("cache-control", "no-store");
  return new Response(response.body, { status: response.status, headers });
}

export async function GET(request: Request) {
  try {
    return proxyResponse(await fetch(feedbackUrl(request), { cache: "no-store" }));
  } catch {
    return Response.json({ error: "의견을 불러오지 못했습니다." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 415 });
  }

  try {
    const response = await fetch(feedbackUrl(request), {
      method: "POST",
      headers: { "content-type": contentType },
      body: await request.text(),
      cache: "no-store",
    });
    return proxyResponse(response);
  } catch {
    return Response.json({ error: "의견을 등록하지 못했습니다." }, { status: 502 });
  }
}

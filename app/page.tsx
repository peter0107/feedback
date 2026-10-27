"use client";

import { useCallback, useEffect, useState } from "react";
import { teams } from "../lib/teams";

type Feedback = { id: string; body: string; createdAt: string };

function teamFromUrl() {
  if (typeof window === "undefined") return null;
  const slug = new URLSearchParams(window.location.search).get("team");
  return teams.find((team) => team.slug === slug)?.slug ?? null;
}

export default function Home() {
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const team = teams.find((item) => item.slug === selected);

  const load = useCallback(async (slug: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/feedback?team=${encodeURIComponent(slug)}`, { cache: "no-store" });
      if (!response.ok) throw new Error();
      const result = (await response.json()) as { feedback: Feedback[] };
      setFeedback(result.feedback);
    } catch {
      setError("의견을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sync = () => setSelected(teamFromUrl());
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    setError("");
    setSuccess("");
    setBody("");
    if (selected) void load(selected);
    else setFeedback([]);
  }, [selected, load]);

  function choose(slug: string | null) {
    window.history.pushState({}, "", slug ? `/?team=${encodeURIComponent(slug)}` : "/");
    setSelected(slug);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || submitting) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: selected, body, website }),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error || "의견을 등록하지 못했습니다.");
      }
      setBody("");
      setSuccess("의견이 등록되었습니다. 감사합니다!");
      await load(selected);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "의견을 등록하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="shell">
      <main className="content">
        <h1 className="site-title">팀에게 하고싶은 한 마디</h1>
        {team ? (
          <>
            <button className="back" onClick={() => choose(null)}>← 발표팀 목록</button>
            <h2 className="team-title">{team.name}</h2>
            <section aria-label="익명 피드백">
                <form onSubmit={submit}>
                  <label className="sr-only" htmlFor="feedback-body">피드백 내용</label>
                  <textarea id="feedback-body" placeholder="익명으로 피드백을 남겨주세요" value={body} onChange={(event) => setBody(event.target.value)} minLength={2} maxLength={1000} required />
                  <input className="trap" aria-hidden="true" tabIndex={-1} autoComplete="off" name="website" value={website} onChange={(event) => setWebsite(event.target.value)} />
                  <div className="form-bottom"><span>{body.length} / 1,000</span><button className="submit" type="submit" disabled={submitting || body.trim().length < 2}>{submitting ? "등록 중..." : "등록"}</button></div>
                </form>
                {success && <p className="status success" role="status">{success}</p>}
                {error && <p className="status error" role="alert">{error}</p>}
            </section>
            <section className="feedback-area" aria-labelledby="feedback-title">
              <h3 id="feedback-title">피드백 {feedback.length}</h3>
              {loading ? <p className="empty">불러오는 중...</p> : feedback.length === 0 ? <p className="empty">아직 피드백이 없습니다.</p> : (
                <div>{feedback.map((item) => <article className="feedback-item" key={item.id}><p>{item.body}</p></article>)}</div>
              )}
            </section>
          </>
        ) : (
          <section aria-label="발표팀" className="team-list">
            {teams.map((item) => <button className="team-row" key={item.slug} onClick={() => choose(item.slug)}>{item.name}<span aria-hidden="true">→</span></button>)}
          </section>
        )}
      </main>
    </div>
  );
}

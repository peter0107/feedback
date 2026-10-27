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
      <header className="topbar">
        <button className="brand" onClick={() => choose(null)} aria-label="팀 목록으로 돌아가기"><span className="brand-mark">S</span> 성창재 네트워킹</button>
        <span className="top-note">TEAM FEEDBACK · 2026</span>
      </header>
      <main className="content">
        <p className="eyebrow">— &nbsp; 네트워킹 피드백</p>
        {team ? (
          <>
            <button className="back" onClick={() => choose(null)}>← 모든 팀 보기</button>
            <section className="team-heading">
              <div><p className="label">PRESENTING TEAM</p><h1>{team.name}</h1><p className="intro">발표를 듣고 떠오른 생각을 자유롭게 남겨주세요.</p></div>
              <span className="team-number">{String(teams.indexOf(team) + 1).padStart(2, "0")}</span>
            </section>
            <div className="detail-grid">
              <section className="form-area" aria-labelledby="write-title">
                <p className="label">WRITE A NOTE</p><h2 id="write-title">익명 피드백 남기기</h2>
                <p className="muted">좋았던 점, 궁금한 점, 제안하고 싶은 내용을 편하게 적어주세요.</p>
                <form onSubmit={submit}>
                  <label className="sr-only" htmlFor="feedback-body">피드백 내용</label>
                  <textarea id="feedback-body" placeholder="이 팀의 발표에 대한 생각을 남겨주세요..." value={body} onChange={(event) => setBody(event.target.value)} minLength={2} maxLength={1000} required />
                  <input className="trap" aria-hidden="true" tabIndex={-1} autoComplete="off" name="website" value={website} onChange={(event) => setWebsite(event.target.value)} />
                  <div className="form-bottom"><span>{body.length} / 1,000</span><button className="submit" type="submit" disabled={submitting || body.trim().length < 2}>{submitting ? "등록 중..." : "의견 등록 ↗"}</button></div>
                </form>
                <p className="privacy">이름을 받지 않습니다. 등록한 의견은 이 페이지를 방문한 모두에게 공개됩니다.</p>
                {success && <p className="status success" role="status">{success}</p>}
                {error && <p className="status error" role="alert">{error}</p>}
              </section>
              <section className="feedback-area" aria-labelledby="feedback-title">
                <div className="list-heading"><div><p className="label">COMMUNITY NOTES</p><h2 id="feedback-title">모두의 의견</h2></div><span className="count">{feedback.length}</span></div>
                {loading ? <p className="empty">의견을 불러오는 중입니다...</p> : feedback.length === 0 ? <p className="empty">아직 등록된 의견이 없습니다.<br />첫 번째 피드백을 남겨주세요.</p> : (
                  <div>{feedback.map((item) => <article className="feedback-item" key={item.id}><p>{item.body}</p><time dateTime={item.createdAt}>{new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(item.createdAt))}</time></article>)}</div>
                )}
              </section>
            </div>
          </>
        ) : (
          <>
            <section className="hero"><p className="label">SEONGCHANGJAE NETWORKING 2026</p><h1>서로의 아이디어에<br /><em>한마디를 더해주세요.</em></h1><p className="intro">팀을 선택하고 발표에 대한 의견을 익명으로 남겨주세요.<br className="desktop-break" /> 작은 한마디가 다음 아이디어를 만듭니다.</p></section>
            <section aria-labelledby="teams-title"><div className="list-heading"><div><p className="label">PRESENTING TEAMS</p><h2 id="teams-title">발표 팀</h2></div><span className="team-total">현재 {teams.length}팀</span></div>
              <div className="team-grid">{teams.map((item, index) => <button className="team-card" key={item.slug} onClick={() => choose(item.slug)}><span className="card-number">{String(index + 1).padStart(2, "0")}</span><span className="card-name">{item.name}</span><span className="card-arrow" aria-hidden="true">↗</span></button>)}</div>
              <p className="footnote">발표 팀은 추가될 예정입니다.</p>
            </section>
          </>
        )}
      </main>
      <footer className="footer"><span>성창재 네트워킹</span><span>함께 나누는 생각, 함께 자라는 아이디어.</span></footer>
    </div>
  );
}

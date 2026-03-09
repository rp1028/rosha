"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type EvaluationScore = {
  criteriaId: string;
  score: number;
  criteria: { name: string; maxScore: number };
};

type Evaluation = {
  id: string;
  comment: string | null;
  evaluator: { name: string };
  scores: EvaluationScore[];
  application: { session: { title: string } };
  createdAt: string;
};

type Video = {
  id: string;
  youtubeUrl: string;
  title: string | null;
  application: { session: { title: string } };
  createdAt: string;
};

type ApplicationInfo = {
  id: string;
  sessionTitle: string;
  sessionDate: string;
  desiredUniv: string;
  isUnlocked: boolean;
  adminSummary: string | null;
  evaluations: Evaluation[];
  videos: Video[];
};

type UpcomingSession = {
  id: string;
  title: string;
  examDate: string;
  registrationEnd: string;
  registrationStart: string | null;
} | null;

function getYoutubeEmbedUrl(url: string): string | null {
  try {
    const regExp =
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regExp);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  } catch {
    return null;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function StudentDashboard() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationInfo[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [tab, setTab] = useState<"evaluations" | "videos">("evaluations");
  const [loading, setLoading] = useState(true);
  const [upcomingSession, setUpcomingSession] = useState<UpcomingSession>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // 학생의 모든 신청(회차) 목록 가져오기
    fetch("/api/student/applications")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((apps: ApplicationInfo[]) => {
        setApplications(apps);
        if (apps.length > 0) setSelectedAppId(apps[0].id);
      })
      .catch(() => {
        router.push("/student/login");
      })
      .finally(() => setLoading(false));

    // 팝업용 다음 회차 정보 가져오기
    fetch("/api/student/upcoming_session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setUpcomingSession(data);
          setShowPopup(true);
        }
      })
      .catch(() => {});
  }, [router]);

  const selectedApp = applications.find((a) => a.id === selectedAppId);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const getTotalScore = (ev: Evaluation) =>
    ev.scores.reduce((sum, s) => sum + s.score, 0);

  const getMaxTotal = (ev: Evaluation) =>
    ev.scores.reduce((sum, s) => sum + s.criteria.maxScore, 0);

  const isAfterOrOnDate = (dateStr: string) =>
    new Date() >= new Date(dateStr);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">

      {/* ── 다음 회차 신청 팝업 ── */}
      {showPopup && upcomingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium tracking-widest text-neutral-400 uppercase">
                신청 안내
              </span>
              <button
                onClick={() => setShowPopup(false)}
                className="text-neutral-400 hover:text-neutral-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <h2 className="mt-3 text-lg font-semibold text-neutral-900">
              {upcomingSession.title}
            </h2>

            <div className="mt-4 space-y-2 rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              <div className="flex justify-between">
                <span className="text-neutral-500">평가일</span>
                <span className="font-medium">{formatDate(upcomingSession.examDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">신청 마감</span>
                <span className="font-medium text-red-500">
                  {formatDate(upcomingSession.registrationEnd)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <a
                href={`/apply?sessionId=${upcomingSession.id}`}
                className="flex h-11 items-center justify-center rounded-xl bg-neutral-900 text-sm font-medium text-white transition hover:bg-neutral-700"
              >
                {upcomingSession.title} 신청하기
              </a>
              <button
                onClick={() => setShowPopup(false)}
                className="h-9 rounded-xl text-sm text-neutral-400 hover:text-neutral-600"
              >
                나중에 하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <button
          onClick={handleLogout}
          className="text-gray-500 text-sm hover:text-gray-700"
        >
          로그아웃
        </button>
      </div>

      {applications.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          신청한 회차가 없습니다.
        </p>
      ) : (
        <>
          {/* ── 회차 선택 탭 ── */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {applications.map((app) => (
              <button
                key={app.id}
                onClick={() => {
                  setSelectedAppId(app.id);
                  setTab("evaluations");
                }}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  selectedAppId === app.id
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {app.sessionTitle}
                {!app.isUnlocked && isAfterOrOnDate(app.sessionDate) && (
                  <span className="ml-1.5 text-xs opacity-60">🔒</span>
                )}
              </button>
            ))}
          </div>

          {selectedApp && (
            <>
              {/* ── 결과 잠김 상태 ── */}
              {!selectedApp.isUnlocked ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
                  {isAfterOrOnDate(selectedApp.sessionDate) && (
                    <p className="text-3xl mb-3">🔒</p>
                  )}
                  {isAfterOrOnDate(selectedApp.sessionDate) ? (
                    <>
                      <p className="text-base font-medium text-neutral-700">
                        아직 평가 결과가 공개되지 않았습니다.
                      </p>
                      <p className="mt-2 text-sm text-neutral-400">
                        결과가 공개되면 이메일로 안내드릴게요.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-base font-medium text-neutral-700">
                        신청이 정상적으로 완료되었습니다.
                      </p>
                      <p className="mt-2 text-sm text-neutral-400">
                        평가일 이후 결과가 공개되며, 공개 시 이메일로 안내드립니다.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* ── 관리자 종합 코멘트 ── */}
                  {selectedApp.adminSummary && (
                    <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
                      <p className="text-xs font-medium text-blue-500 mb-1">
                        종합 코멘트
                      </p>
                      <p className="text-sm text-neutral-800 whitespace-pre-wrap">
                        {selectedApp.adminSummary}
                      </p>
                    </div>
                  )}

                  {/* ── 탭 ── */}
                  <div className="flex gap-1 mb-6 border-b border-neutral-200">
                    {(["evaluations", "videos"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                          tab === t
                            ? "border-neutral-900 text-neutral-900"
                            : "border-transparent text-neutral-400 hover:text-neutral-600"
                        }`}
                      >
                        {t === "evaluations" ? "평가 결과" : "연주 영상"}
                      </button>
                    ))}
                  </div>

                  {/* ── 평가 결과 탭 ── */}
                  {tab === "evaluations" && (
                    <div className="space-y-4">
                      {selectedApp.evaluations.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                          아직 평가 결과가 없습니다.
                        </p>
                      ) : (
                        selectedApp.evaluations.map((ev) => (
                          <div
                            key={ev.id}
                            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-neutral-700">
                                {ev.evaluator.name} 선생님
                              </span>
                              <span className="text-sm font-semibold text-neutral-900">
                                {getTotalScore(ev)} / {getMaxTotal(ev)}점
                              </span>
                            </div>

                            {ev.scores.length > 0 && (
                              <div className="space-y-2 mb-3">
                                {ev.scores.map((s) => (
                                  <div
                                    key={s.criteriaId}
                                    className="flex items-center gap-3"
                                  >
                                    <span className="w-20 text-xs text-neutral-500 shrink-0">
                                      {s.criteria.name}
                                    </span>
                                    <div className="flex-1 h-1.5 rounded-full bg-neutral-100">
                                      <div
                                        className="h-1.5 rounded-full bg-neutral-900 transition-all"
                                        style={{
                                          width: `${(s.score / s.criteria.maxScore) * 100}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs text-neutral-600 shrink-0">
                                      {s.score}/{s.criteria.maxScore}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {ev.comment && (
                              <p className="text-sm text-neutral-600 bg-neutral-50 rounded-xl px-4 py-3 mt-2">
                                {ev.comment}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* ── 연주 영상 탭 ── */}
                  {tab === "videos" && (
                    <div className="space-y-6">
                      {selectedApp.videos.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                          등록된 영상이 없습니다.
                        </p>
                      ) : (
                        selectedApp.videos.map((v) => {
                          const embedUrl = getYoutubeEmbedUrl(v.youtubeUrl);
                          return (
                            <div key={v.id} className="rounded-2xl border border-neutral-200 overflow-hidden">
                              {embedUrl ? (
                                <div className="aspect-video w-full">
                                  <iframe
                                    src={embedUrl}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              ) : null}
                              <div className="px-4 py-3 flex items-center justify-between bg-white">
                                <span className="text-sm text-neutral-700">
                                  {v.title || "연주 영상"}
                                </span>
                                <a
                                  href={v.youtubeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:underline"
                                >
                                  YouTube에서 보기 ↗
                                </a>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
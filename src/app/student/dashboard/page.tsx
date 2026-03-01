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
  desiredUniv: string;
  evaluations: Evaluation[];
  videos: Video[];
};

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

export default function StudentDashboard() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationInfo[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [tab, setTab] = useState<"evaluations" | "videos">("evaluations");
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">내 평가 결과</h1>
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
          {/* 회차 선택 */}
          {applications.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">회차 선택</label>
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="border rounded-lg px-3 py-2 w-full max-w-md"
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.sessionTitle}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 단일 회차면 제목 표시 */}
          {applications.length === 1 && (
            <p className="text-gray-600 mb-6">{selectedApp?.sessionTitle}</p>
          )}

          {/* 탭 */}
          <div className="flex gap-4 border-b mb-6">
            <button
              onClick={() => setTab("evaluations")}
              className={`pb-2 px-1 text-sm font-medium transition ${
                tab === "evaluations"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-400"
              }`}
            >
              평가 결과
            </button>
            <button
              onClick={() => setTab("videos")}
              className={`pb-2 px-1 text-sm font-medium transition ${
                tab === "videos"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-400"
              }`}
            >
              연주 영상
            </button>
          </div>

          {/* 평가 결과 */}
          {tab === "evaluations" && selectedApp && (
            <div>
              {selectedApp.evaluations.length === 0 ? (
                <p className="text-gray-500 text-center py-12">
                  아직 등록된 평가가 없습니다.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {selectedApp.evaluations.map((ev) => (
                    <div key={ev.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">
                          {ev.evaluator.name} 선생님
                        </span>
                        <span className="text-lg font-bold">
                          {getTotalScore(ev)} / {getMaxTotal(ev)}점
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {ev.scores.map((s) => (
                          <div
                            key={s.criteriaId}
                            className="bg-gray-50 rounded p-2 flex items-center justify-between"
                          >
                            <span className="text-sm text-gray-600">
                              {s.criteria.name}
                            </span>
                            <span className="text-sm font-bold">
                              {s.score}/{s.criteria.maxScore}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className="bg-black rounded-full h-2 transition-all"
                          style={{
                            width: `${
                              getMaxTotal(ev) > 0
                                ? (getTotalScore(ev) / getMaxTotal(ev)) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>

                      {ev.comment && (
                        <div className="border-t pt-3">
                          <p className="text-xs text-gray-400 mb-1">코멘트</p>
                          <p className="text-gray-600 text-sm">{ev.comment}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 연주 영상 */}
          {tab === "videos" && selectedApp && (
            <div>
              {selectedApp.videos.length === 0 ? (
                <p className="text-gray-500 text-center py-12">
                  아직 등록된 영상이 없습니다.
                </p>
              ) : (
                <div className="flex flex-col gap-6">
                  {selectedApp.videos.map((video) => {
                    const embedUrl = getYoutubeEmbedUrl(video.youtubeUrl);
                    return (
                      <div key={video.id} className="border rounded-lg p-4">
                        {video.title && (
                          <h3 className="font-medium mb-3">{video.title}</h3>
                        )}
                        {embedUrl && (
                          <div className="aspect-video mb-3">
                            <iframe
                              src={embedUrl}
                              className="w-full h-full rounded"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                          </div>
                        )}
                        <a
                          href={video.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm hover:underline"
                        >
                          YouTube에서 보기 →
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
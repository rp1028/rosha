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
  createdAt: string;
};

type Video = {
  id: string;
  youtubeUrl: string;
  title: string | null;
  createdAt: string;
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
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [tab, setTab] = useState<"evaluations" | "videos">("evaluations");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/evaluations").then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
      fetch("/api/videos").then((r) => (r.ok ? r.json() : Promise.reject())),
    ])
      .then(([evals, vids]) => {
        setEvaluations(evals);
        setVideos(vids);
      })
      .catch(() => {
        router.push("/student/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

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
      {tab === "evaluations" && (
        <div>
          {evaluations.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              아직 등록된 평가가 없습니다.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {evaluations.map((ev) => (
                <div key={ev.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">
                      {ev.evaluator.name} 선생님
                    </span>
                    <span className="text-lg font-bold">
                      {getTotalScore(ev)} / {getMaxTotal(ev)}점
                    </span>
                  </div>

                  {/* 항목별 점수 */}
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

                  {/* 점수 바 */}
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
      {tab === "videos" && (
        <div>
          {videos.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              아직 등록된 영상이 없습니다.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {videos.map((video) => {
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
    </div>
  );
}

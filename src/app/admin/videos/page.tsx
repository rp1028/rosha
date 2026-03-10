"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Session = {
  id: string;
  title: string;
  _count: { applications: number };
};

type Application = {
  id: string;
  student: { name: string; uniqueCode: string };
};

type Video = {
  id: string;
  youtubeUrl: string;
  title: string | null;
  application: {
    student: { name: string };
    session: { title: string };
  };
};

export default function VideosPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [form, setForm] = useState({
    applicationId: "",
    youtubeUrl: "",
    title: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/sessions")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setSessions)
      .catch(() => router.push("/admin/login"));
  }, [router]);

  useEffect(() => {
    if (!selectedSession) return;
    fetch(`/api/admin/students?sessionId=${selectedSession}`)
      .then((r) => r.json())
      .then(setApplications);
    fetch(`/api/videos?sessionId=${selectedSession}`)
      .then((r) => r.json())
      .then(setVideos);
  }, [selectedSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMessage("영상이 등록되었습니다.");
        setForm({ applicationId: "", youtubeUrl: "", title: "" });
        const updated = await fetch(
          `/api/videos?sessionId=${selectedSession}`
        ).then((r) => r.json());
        setVideos(updated);
      } else {
        const data = await res.json();
        setMessage(data.error || "등록에 실패했습니다.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <section className="mb-6 rounded-xl border border-transparent bg-transparent px-4 py-4 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-100">
          <label className="block text-[12px] font-medium text-neutral-800">
            회차 선택
          </label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="mt-2 h-6 w-full md:max-w-sm rounded-md border border-neutral-300 bg-white px-2 text-[11px] leading-none text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10"
          >
            <option value="">선택해주세요</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </section>

        {selectedSession && (
          <>
            <form
              onSubmit={handleSubmit}
              className="mb-8 rounded-xl border border-transparent bg-transparent px-5 py-5 text-sm shadow-sm transition hover:border-neutral-300 hover:bg-neutral-100"
            >
              <h2 className="text-sm font-medium text-neutral-900">
                영상 등록
              </h2>

              <div className="mt-4 space-y-3">
                <select
                  value={form.applicationId}
                  onChange={(e) =>
                    setForm({ ...form, applicationId: e.target.value })
                  }
                  required
                  className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                >
                  <option value="">학생 선택</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.student.name} ({app.student.uniqueCode})
                    </option>
                  ))}
                </select>

                <input
                  type="url"
                  value={form.youtubeUrl}
                  onChange={(e) =>
                    setForm({ ...form, youtubeUrl: e.target.value })
                  }
                  placeholder="유튜브 URL (https://youtube.com/watch?v=...)"
                  required
                  className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                />

                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  placeholder="영상 제목 (선택사항)"
                  className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                />
              </div>

              {message && (
                <p
                  className={`mt-3 text-xs ${
                    message.includes("실패")
                      ? "text-red-500"
                      : "text-emerald-600"
                  }`}
                >
                  {message}
                </p>
              )}

              <div className="mt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 w-full rounded-xl bg-black text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "등록중..." : "영상 등록"}
                </button>
              </div>
            </form>

            <section>
              <h2 className="mb-3 text-sm font-medium text-neutral-800">
                등록된 영상 ({videos.length}건)
              </h2>
              <div className="flex flex-col gap-2">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="rounded-xl border border-transparent bg-transparent px-4 py-3 text-sm shadow-sm transition hover:border-neutral-300 hover:bg-neutral-100"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-900">
                        {video.application.student.name}
                      </span>
                      <a
                        href={video.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        YouTube →
                      </a>
                    </div>
                    {video.title && (
                      <p className="mt-1 text-xs text-neutral-500">
                        {video.title}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}


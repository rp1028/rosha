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
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/dashboard" className="text-gray-500 text-sm">
          ← 대시보드
        </Link>
        <h1 className="text-2xl font-bold">영상 관리</h1>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">회차 선택</label>
        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          className="border rounded-lg px-3 py-2 w-full max-w-md"
        >
          <option value="">선택해주세요</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      {selectedSession && (
        <>
          <form
            onSubmit={handleSubmit}
            className="border rounded-lg p-4 mb-6 flex flex-col gap-3"
          >
            <h2 className="font-medium">영상 등록</h2>

            <select
              value={form.applicationId}
              onChange={(e) =>
                setForm({ ...form, applicationId: e.target.value })
              }
              required
              className="border rounded-lg px-3 py-2"
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
              className="border rounded-lg px-3 py-2"
            />

            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="영상 제목 (선택사항)"
              className="border rounded-lg px-3 py-2"
            />

            {message && (
              <p
                className={`text-sm ${
                  message.includes("실패") ? "text-red-500" : "text-green-600"
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400"
            >
              {saving ? "등록중..." : "영상 등록"}
            </button>
          </form>

          <h2 className="font-medium mb-3">
            등록된 영상 ({videos.length}건)
          </h2>
          <div className="flex flex-col gap-2">
            {videos.map((video) => (
              <div key={video.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {video.application.student.name}
                  </span>
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-xs hover:underline"
                  >
                    YouTube →
                  </a>
                </div>
                {video.title && (
                  <p className="text-xs text-gray-500">{video.title}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
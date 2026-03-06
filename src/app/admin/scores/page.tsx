"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Session = {
  id: string;
  title: string;
  _count: { applications: number };
};

type Application = {
  id: string;
  student: { name: string; uniqueCode: string };
  desiredUniv: string;
  sheetUrl: string | null;
  sheetTitle: string | null;
};

type SheetState = {
  title: string;
  url: string;
  saving: boolean;
  message: string;
  error: string;
  uploading: boolean;
};

export default function ScoresPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [sheetState, setSheetState] = useState<Record<string, SheetState>>({});

  useEffect(() => {
    fetch("/api/admin/sessions")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setSessions)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedSession) {
      setApplications([]);
      setSheetState({});
      return;
    }
    fetch(`/api/admin/students?sessionId=${selectedSession}`)
      .then((r) => r.json())
      .then((apps: any[]) => {
        const mapped = apps.map((app) => ({
          id: app.id,
          student: { name: app.student.name, uniqueCode: app.student.uniqueCode },
          desiredUniv: app.desiredUniv,
          sheetUrl: app.sheetUrl ?? null,
          sheetTitle: app.sheetTitle ?? null,
        }));
        setApplications(mapped);
        const initial: Record<string, SheetState> = {};
        mapped.forEach((app) => {
          initial[app.id] = {
            title: app.sheetTitle ?? "",
            url: app.sheetUrl ?? "",
            saving: false,
            message: "",
            error: "",
            uploading: false,
          };
        });
        setSheetState(initial);
      });
  }, [selectedSession]);

  const handleChange = (
    id: string,
    field: "title" | "url",
    value: string
  ) => {
    setSheetState((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {
          title: "",
          url: "",
          saving: false,
          message: "",
          error: "",
          uploading: false,
        }),
        [field]: value,
        message: "",
        error: "",
      },
    }));
  };

  const handleFileSelect = async (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSheetState((prev) => ({
      ...prev,
      [id]: { ...prev[id], uploading: true, error: "", message: "" },
    }));
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("applicationId", id);
      const res = await fetch("/api/admin/applications/sheet/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setSheetState((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            uploading: false,
            error: data.error || "업로드에 실패했습니다.",
          },
        }));
        return;
      }
      const titleFromName = file.name.replace(/\.[^.]+$/, "");
      setSheetState((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          url: data.url ?? "",
          title: prev[id]?.title?.trim() ? prev[id].title : titleFromName,
          uploading: false,
          message: "파일이 업로드되었습니다. 저장 버튼을 눌러주세요.",
          error: "",
        },
      }));
    } catch {
      setSheetState((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          uploading: false,
          error: "업로드에 실패했습니다.",
        },
      }));
    }
    e.target.value = "";
  };

  const handleSave = async (id: string) => {
    const state = sheetState[id];
    if (!state) return;

    setSheetState((prev) => ({
      ...prev,
      [id]: { ...prev[id], saving: true, message: "", error: "" },
    }));

    try {
      const res = await fetch("/api/admin/applications/sheet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: id,
          sheetUrl: state.url,
          sheetTitle: state.title,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSheetState((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            saving: false,
            error: data.error || "저장에 실패했습니다.",
          },
        }));
        return;
      }

      setSheetState((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          saving: false,
          message: "저장되었습니다.",
          error: "",
        },
      }));
    } catch {
      setSheetState((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          saving: false,
          error: "저장에 실패했습니다.",
        },
      }));
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/dashboard"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              ← 대시보드
            </Link>
            <span className="text-xs text-neutral-300">•</span>
            <h1 className="text-sm font-semibold text-neutral-800">
              악보 관리
            </h1>
          </div>
        </div>

        <section className="mb-6 rounded-xl border border-neutral-200 bg-white px-4 py-4 shadow-sm">
          <label className="block text-sm font-medium text-neutral-800">
            회차 선택
          </label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="mt-3 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
          >
            <option value="">선택해주세요</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s._count.applications}명)
              </option>
            ))}
          </select>
        </section>

        {selectedSession && applications.length === 0 && (
          <p className="mt-4 text-sm text-neutral-500">신청한 학생이 없습니다.</p>
        )}

        {applications.length > 0 && (
          <section className="mt-2">
            <h2 className="mb-3 text-sm font-medium text-neutral-800">
              학생별 악보 링크
              <span className="ml-2 text-xs font-normal text-neutral-400">
                {applications.length}명
              </span>
            </h2>

            <div className="flex flex-col gap-3">
              {applications.map((app) => {
                const state = sheetState[app.id];
                return (
                  <div
                    key={app.id}
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-sm shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-900">
                            {app.student.name}
                          </span>
                          <span className="font-mono text-[11px] text-neutral-400">
                            {app.student.uniqueCode}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-neutral-400">
                          희망대: {app.desiredUniv}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-700">
                          악보 제목 (선택)
                        </label>
                        <input
                          type="text"
                          value={state?.title ?? ""}
                          onChange={(e) =>
                            handleChange(app.id, "title", e.target.value)
                          }
                          className="mt-1 h-9 w-full rounded-xl border border-neutral-300 bg-white px-3 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-700">
                          악보 링크(URL) 또는 파일 업로드
                        </label>
                        <div className="mt-1 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              id={`sheet-file-${app.id}`}
                              accept="image/*,.pdf,application/pdf"
                              className="hidden"
                              onChange={(e) => handleFileSelect(app.id, e)}
                              disabled={state?.uploading}
                            />
                            <label
                              htmlFor={`sheet-file-${app.id}`}
                              className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-neutral-300 bg-neutral-50 px-3 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {state?.uploading
                                ? "업로드 중..."
                                : "파일 선택 (이미지/PDF)"}
                            </label>
                            <span className="text-[11px] text-neutral-400">
                              최대 10MB
                            </span>
                          </div>
                          <input
                            type="url"
                            placeholder="또는 PDF / 이미지 / 외부 뷰어 URL 입력"
                            value={state?.url ?? ""}
                            onChange={(e) =>
                              handleChange(app.id, "url", e.target.value)
                            }
                            className="h-9 w-full rounded-xl border border-neutral-300 bg-white px-3 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-[11px]">
                        {state?.message && (
                          <span className="text-emerald-600">
                            {state.message}
                          </span>
                        )}
                        {state?.error && (
                          <span className="text-red-500">{state.error}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSave(app.id)}
                        disabled={state?.saving}
                        className="h-8 rounded-xl bg-black px-4 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {state?.saving ? "저장 중..." : "저장"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}


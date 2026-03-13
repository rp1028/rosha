"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  editing?: boolean;
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
    if (!selectedSession) return;

    fetch(`/api/admin/students?sessionId=${selectedSession}`)
      .then((r) => r.json())
      .then((apps: Application[]) => {
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
            editing: false,
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
          editing: false,
        }),
        [field]: value,
        message: "",
        error: "",
        editing: true,
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
      [id]: {
        ...prev[id],
        uploading: true,
        error: "",
        message: "",
        editing: true,
      },
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
          editing: true,
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
      [id]: {
        ...prev[id],
        saving: true,
        message: "",
        error: "",
        editing: true,
      },
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
          editing: false,
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

  const handleEdit = (id: string) => {
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
          editing: false,
        }),
        editing: true,
      },
    }));
  };

  const handleDelete = async (id: string) => {
    const state = sheetState[id];
    if (!state) return;

    setSheetState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        saving: true,
        message: "",
        error: "",
        editing: true,
      },
    }));

    try {
      const res = await fetch("/api/admin/applications/sheet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: id,
          sheetUrl: "",
          sheetTitle: "",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSheetState((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            saving: false,
            error: data.error || "삭제에 실패했습니다.",
          },
        }));
        return;
      }

      setSheetState((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          title: "",
          url: "",
          saving: false,
          message: "파일이 삭제되었습니다.",
          error: "",
          editing: false,
        },
      }));
    } catch {
      setSheetState((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          saving: false,
          error: "삭제에 실패했습니다.",
        },
      }));
    }
  };

  const handleClear = (id: string) => {
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
          editing: false,
        }),
        title: "",
        url: "",
        message: "",
        error: "",
        editing: true,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-4 md:max-w-sm">
          <Select
            value={selectedSession}
            onValueChange={(value) => {
              setSelectedSession(value);
            }}
          >
            <SelectTrigger className="text-[11px]">
              <SelectValue placeholder="회차를 선택해주세요" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title} ({s._count.applications}명)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {applications.map((app) => {
                const state = sheetState[app.id];
                const isSavedView =
                  state?.message === "저장되었습니다." && !state?.editing;
                return (
                  <div
                    key={app.id}
                    className="h-full rounded-xl border border-neutral-200 bg-white px-4 py-4 text-sm shadow-sm"
                  >
                    {!isSavedView && (
                      <>
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
                      </>
                    )}

                    <div className="mt-3 space-y-2">
                      {isSavedView && (
                        <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2">
                          <div className="text-[11px] text-emerald-900">
                            <div className="font-medium">
                              {app.student.name} {app.student.uniqueCode}
                            </div>
                            <div className="mt-0.5 text-[10px] text-emerald-700">
                              희망대: {app.desiredUniv}
                            </div>
                            <div className="mt-1 text-[11px]">
                              파일이 저장되었습니다.
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(app.id)}
                              className="h-8 rounded-full border border-emerald-300 bg-emerald-50 px-3 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(app.id)}
                              disabled={state?.saving}
                              className="h-8 rounded-full border border-red-200 bg-red-50 px-3 text-[11px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px]">
                          {state?.message &&
                            state.message !== "저장되었습니다." && (
                              <span className="text-emerald-600">
                                {state.message}
                              </span>
                            )}
                          {state?.error && (
                            <span className="text-red-500">
                              {state.error}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleClear(app.id)}
                            disabled={state?.saving}
                            className="h-8 rounded-full border border-neutral-300 px-3 text-[11px] font-medium text-neutral-600 bg-white hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            지우기
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSave(app.id)}
                            disabled={state?.saving}
                            className="h-8 rounded-full bg-black px-4 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {state?.saving ? "저장 중..." : "저장"}
                          </button>
                        </div>
                      </div>
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


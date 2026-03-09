"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Session = {
  id: string;
  title: string;
  date: string;
  _count: { applications: number };
};

type Student = {
  id: string;
  name: string;
  phone: string;
  email: string;
  school: string;
  uniqueCode: string;
};

type Criteria = {
  id: string;
  name: string;
  maxScore: number;
};

type EvaluationScore = {
  id: string;
  score: number;
  criteria: Criteria;
};

type Evaluation = {
  id: string;
  scores: EvaluationScore[];
  evaluator: { id: string; name: string };
};

type Application = {
  id: string;
  desiredUniv: string;
  createdAt: string;
  sheetTitle: string | null;
  sheetUrl: string | null;
  student: Student;
  evaluations: Evaluation[];
};

type ViewMode = "SUMMARY" | "STUDENT" | "EVALUATION" | "SHEET";
type EvalFilter = "ALL" | "EVALUATED" | "NOT_EVALUATED";
type SortKey = "CREATED_AT" | "NAME" | "SCHOOL";

export default function AdminApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState(
    searchParams.get("sessionId") || ""
  );
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("SUMMARY");
  const [evalFilter, setEvalFilter] = useState<EvalFilter>("ALL");
  const [schoolFilter, setSchoolFilter] = useState<string>("ALL");
  const [desiredUnivFilter, setDesiredUnivFilter] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("CREATED_AT");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  // 회차 목록 불러오기
  useEffect(() => {
    setSessionsLoading(true);
    fetch("/api/admin/sessions")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Session[]) => {
        setSessions(data);
        if (!selectedSessionId && data.length > 0) {
          setSelectedSessionId(data[0].id);
        }
      })
      .catch(() => router.push("/admin/login"))
      .finally(() => setSessionsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // 회차 선택 시 신청 목록 불러오기
  useEffect(() => {
    if (!selectedSessionId) return;
    setAppsLoading(true);
    fetch(`/api/admin/students?sessionId=${selectedSessionId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Application[]) => setApplications(data))
      .catch(() => setApplications([]))
      .finally(() => setAppsLoading(false));
  }, [selectedSessionId]);

  const schoolOptions = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((a) => {
      if (a.student.school) set.add(a.student.school);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ko-KR"));
  }, [applications]);

  const desiredUnivOptions = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((a) => {
      if (a.desiredUniv) set.add(a.desiredUniv);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ko-KR"));
  }, [applications]);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) || null,
    [sessions, selectedSessionId]
  );

  const filteredApplications = useMemo(() => {
    let list = [...applications];

    // 평가 여부 필터
    if (evalFilter === "EVALUATED") {
      list = list.filter((a) => a.evaluations && a.evaluations.length > 0);
    } else if (evalFilter === "NOT_EVALUATED") {
      list = list.filter((a) => !a.evaluations || a.evaluations.length === 0);
    }

    // 학교 필터
    if (schoolFilter !== "ALL") {
      list = list.filter((a) => a.student.school === schoolFilter);
    }

    // 희망 대학 필터
    if (desiredUnivFilter !== "ALL") {
      list = list.filter((a) => a.desiredUniv === desiredUnivFilter);
    }

    // 검색 (이름/학교/희망대학/이메일/전화/고유번호)
    const keyword = searchKeyword.trim().toLowerCase();
    if (keyword) {
      list = list.filter((a) => {
        const text = [
          a.student.name,
          a.student.school,
          a.desiredUniv,
          a.student.email,
          a.student.phone,
          a.student.uniqueCode,
        ]
          .join(" ")
          .toLowerCase();
        return text.includes(keyword);
      });
    }

    // 정렬
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "CREATED_AT") {
        const at = new Date(a.createdAt).getTime();
        const bt = new Date(b.createdAt).getTime();
        cmp = at - bt;
      } else if (sortKey === "NAME") {
        cmp = a.student.name.localeCompare(b.student.name, "ko-KR");
      } else if (sortKey === "SCHOOL") {
        cmp = a.student.school.localeCompare(b.student.school, "ko-KR");
      }
      return sortOrder === "ASC" ? cmp : -cmp;
    });

    return list;
  }, [
    applications,
    evalFilter,
    schoolFilter,
    desiredUnivFilter,
    searchKeyword,
    sortKey,
    sortOrder,
  ]);

  const stats = useMemo(() => {
    if (filteredApplications.length === 0) {
      return {
        total: 0,
        evaluatedCount: 0,
        evaluatedRate: 0,
        schoolCount: 0,
        desiredUnivCount: 0,
      };
    }

    const total = filteredApplications.length;
    const evaluatedCount = filteredApplications.filter(
      (a) => a.evaluations && a.evaluations.length > 0
    ).length;
    const evaluatedRate = Math.round((evaluatedCount / total) * 100);

    const schools = new Set(filteredApplications.map((a) => a.student.school));
    const desiredUnivs = new Set(
      filteredApplications.map((a) => a.desiredUniv)
    );

    return {
      total,
      evaluatedCount,
      evaluatedRate,
      schoolCount: schools.size,
      desiredUnivCount: desiredUnivs.size,
    };
  }, [filteredApplications]);

  const getAvgTotalScore = (app: Application): number | null => {
    if (!app.evaluations || app.evaluations.length === 0) return null;

    const totals = app.evaluations.map((ev) =>
      (ev.scores || []).reduce((sum, s) => sum + s.score, 0)
    );
    const sum = totals.reduce((a, b) => a + b, 0);
    return Math.round((sum / totals.length) * 10) / 10;
  };

  const getMaxTotalScore = (evaluation: Evaluation): number => {
    return (evaluation.scores || []).reduce(
      (sum, s) => sum + s.criteria.maxScore,
      0
    );
  };

  const getEvaluatorSummary = (app: Application): string => {
    if (!app.evaluations || app.evaluations.length === 0) return "-";
    return app.evaluations
      .map((ev) => {
        const total = (ev.scores || []).reduce(
          (sum, s) => sum + s.score,
          0
        );
        const maxTotal = getMaxTotalScore(ev);
        return `${ev.evaluator.name} ${total}/${maxTotal}`;
      })
      .join(", ");
  };

  const handleExportCsv = () => {
    if (!selectedSession || applications.length === 0) {
      alert("내보낼 신청 데이터가 없습니다.");
      return;
    }

    const headers = [
      "순번",
      "회차명",
      "신청일",
      "학생명",
      "학교",
      "전화번호",
      "이메일",
      "고유번호(아이디)",
      "희망 대학교",
      "평가 건수",
      "평균 총점",
    ];

    const escapeCsv = (value: string | number | null | undefined) => {
      const str = value === null || value === undefined ? "" : String(value);
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const rows = applications.map((app, index) => {
      const avgScore = getAvgTotalScore(app);
      return [
        index + 1,
        selectedSession.title,
        new Date(app.createdAt).toLocaleString("ko-KR"),
        app.student.name,
        app.student.school,
        app.student.phone,
        app.student.email,
        app.student.uniqueCode,
        app.desiredUniv,
        app.evaluations?.length ?? 0,
        avgScore !== null ? avgScore : "",
      ]
        .map(escapeCsv)
        .join(",");
    });

    const csvContent = [headers.map(escapeCsv).join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeTitle = selectedSession.title.replace(/[^a-zA-Z0-9가-힣]+/g, "_");
    a.download = `신청현황_${safeTitle}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportToSheet = async () => {
    if (!selectedSessionId) {
      alert("먼저 회차를 선택해주세요.");
      return;
    }

    try {
      const res = await fetch("/api/admin/export/applications-to-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selectedSessionId }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "구글 시트로 내보내는 데 실패했습니다.");
        return;
      }

      const url =
        data.sheetUrl ||
        "https://docs.google.com/spreadsheets"; // fallback

      if (confirm("구글 스프레드시트로 내보냈습니다. 지금 시트를 열어볼까요?")) {
        window.open(url, "_blank");
      }
    } catch {
      alert("구글 시트로 내보내는 중 오류가 발생했습니다.");
    }
  };

  const viewModeOptions: { id: ViewMode; label: string }[] = [
    { id: "SUMMARY", label: "신청 요약" },
    { id: "STUDENT", label: "학생 정보" },
    { id: "EVALUATION", label: "평가 현황" },
    { id: "SHEET", label: "악보 / 코멘트" },
  ];

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        {/* 상단 내보내기 버튼 */}
        <div className="mb-4 flex items-center justify-end">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportToSheet}
              className="h-9 rounded-xl border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50"
            >
              구글 시트로 내보내기
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-600 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
            >
              엑셀(CSV)로 내보내기
            </button>
          </div>
        </div>

        {/* 보기 유형 선택 */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-xl bg-neutral-100 p-1 text-xs">
            {viewModeOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setViewMode(opt.id)}
                className={`rounded-lg px-3 py-1.5 transition ${
                  viewMode === opt.id
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:bg-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* 간단 검색 */}
          <div className="flex items-center gap-2 text-xs">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="이름, 학교, 희망대학 등 검색"
              className="h-8 w-48 rounded-lg border border-neutral-200 px-2 text-[11px] text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10"
            />
          </div>
        </div>

        {/* 회차 선택 */}
        <section className="mb-6 rounded-xl border border-neutral-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-800">
                회차 선택
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="mt-2 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              >
                <option value="">선택해주세요</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s._count.applications}명)
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-neutral-500 md:text-right">
              {sessionsLoading ? (
                <p>회차 정보를 불러오는 중입니다...</p>
              ) : selectedSession ? (
                <>
                  <p>
                    평가일{" "}
                    {new Date(selectedSession.date).toLocaleDateString("ko-KR")}
                  </p>
                  <p className="mt-0.5">
                    신청 인원 {selectedSession._count.applications}명
                  </p>
                </>
              ) : (
                <p>상단에서 회차를 선택하면 신청 현황이 표시됩니다.</p>
              )}
            </div>
          </div>
        </section>

        {/* 통계 카드 (모든 보기에서 공통, 현재 필터 기준) */}
        <section className="mb-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
            <p className="text-xs text-neutral-400">총 신청 인원</p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900">
              {stats.total}
              <span className="ml-1 text-xs font-normal text-neutral-400">
                명
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
            <p className="text-xs text-neutral-400">평가 완료</p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900">
              {stats.evaluatedCount}
              <span className="ml-1 text-xs font-normal text-neutral-400">
                명 ({stats.evaluatedRate}%)
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
            <p className="text-xs text-neutral-400">학교 수</p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900">
              {stats.schoolCount}
              <span className="ml-1 text-xs font-normal text-neutral-400">
                곳
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
            <p className="text-xs text-neutral-400">희망 대학교 수</p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900">
              {stats.desiredUnivCount}
              <span className="ml-1 text-xs font-normal text-neutral-400">
                곳
              </span>
            </p>
          </div>
        </section>

        {/* 신청 리스트 테이블 */}
        <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-100 px-4 py-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-sm font-medium text-neutral-800">
                {viewMode === "SUMMARY"
                  ? "신청 요약 목록"
                  : viewMode === "STUDENT"
                  ? "학생 정보 목록"
                  : viewMode === "EVALUATION"
                  ? "평가 현황 목록"
                  : "악보 / 코멘트 목록"}
                {filteredApplications.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-neutral-400">
                    {filteredApplications.length}명
                  </span>
                )}
              </h2>

              {/* 필터 / 정렬 컨트롤 */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                <div className="flex items-center gap-1">
                  <span className="text-neutral-400">평가</span>
                  <select
                    value={evalFilter}
                    onChange={(e) =>
                      setEvalFilter(e.target.value as EvalFilter)
                    }
                    className="h-7 rounded-lg border border-neutral-200 bg-white px-2"
                  >
                    <option value="ALL">전체</option>
                    <option value="EVALUATED">평가 완료</option>
                    <option value="NOT_EVALUATED">미평가</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-neutral-400">학교</span>
                  <select
                    value={schoolFilter}
                    onChange={(e) => setSchoolFilter(e.target.value)}
                    className="h-7 rounded-lg border border-neutral-200 bg-white px-2 max-w-[140px]"
                  >
                    <option value="ALL">전체</option>
                    {schoolOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-neutral-400">희망 대학</span>
                  <select
                    value={desiredUnivFilter}
                    onChange={(e) => setDesiredUnivFilter(e.target.value)}
                    className="h-7 rounded-lg border border-neutral-200 bg-white px-2 max-w-[160px]"
                  >
                    <option value="ALL">전체</option>
                    {desiredUnivOptions.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-neutral-400">정렬</span>
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                    className="h-7 rounded-lg border border-neutral-200 bg-white px-2"
                  >
                    <option value="CREATED_AT">신청일</option>
                    <option value="NAME">이름</option>
                    <option value="SCHOOL">학교</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setSortOrder((prev) => (prev === "DESC" ? "ASC" : "DESC"))
                    }
                    className="h-7 rounded-lg border border-neutral-200 bg-white px-2 text-[10px]"
                  >
                    {sortOrder === "DESC" ? "내림차순" : "오름차순"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {appsLoading ? (
            <div className="px-4 py-8 text-center text-sm text-neutral-500">
              신청 데이터를 불러오는 중입니다...
            </div>
          ) : !selectedSessionId ? (
            <div className="px-4 py-8 text-center text-sm text-neutral-500">
              상단에서 회차를 선택해주세요.
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-neutral-500">
              선택한 회차에 대한 신청 데이터가 없습니다.
            </div>
          ) : (
            <div className="max-h-[540px] overflow-auto">
              {viewMode === "SUMMARY" && (
                <table className="min-w-full border-t border-neutral-100 text-xs">
                  <thead className="bg-neutral-50 text-[11px] text-neutral-500">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        #
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        학생
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        학교
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        희망 대학교
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium">
                        평가 건수
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium">
                        평균 총점
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium">
                        신청일
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredApplications.map((app, index) => {
                      const avgScore = getAvgTotalScore(app);
                      return (
                        <tr key={app.id} className="hover:bg-neutral-50/60">
                          <td className="px-3 py-2 align-middle text-neutral-400">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 align-middle text-neutral-800">
                            {app.student.name}
                          </td>
                          <td className="px-3 py-2 align-middle text-neutral-600">
                            {app.student.school}
                          </td>
                          <td className="px-3 py-2 align-middle text-neutral-600">
                            {app.desiredUniv}
                          </td>
                          <td className="px-3 py-2 align-middle text-right text-neutral-700">
                            {app.evaluations?.length ?? 0}
                          </td>
                          <td className="px-3 py-2 align-middle text-right text-neutral-800">
                            {avgScore !== null ? `${avgScore}` : "-"}
                          </td>
                          <td className="px-3 py-2 align-middle text-right text-neutral-500">
                            {new Date(app.createdAt).toLocaleString("ko-KR")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {viewMode === "STUDENT" && (
                <table className="min-w-full border-t border-neutral-100 text-xs">
                  <thead className="bg-neutral-50 text-[11px] text-neutral-500">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        #
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        학생
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        학교
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        희망 대학교
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        이메일
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        전화번호
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        고유번호(아이디)
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium">
                        신청일
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredApplications.map((app, index) => (
                      <tr key={app.id} className="hover:bg-neutral-50/60">
                        <td className="px-3 py-2 align-middle text-neutral-400">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 align-middle text-neutral-800">
                          {app.student.name}
                        </td>
                        <td className="px-3 py-2 align-middle text-neutral-600">
                          {app.student.school}
                        </td>
                        <td className="px-3 py-2 align-middle text-neutral-600">
                          {app.desiredUniv}
                        </td>
                        <td className="px-3 py-2 align-middle text-neutral-600">
                          {app.student.email}
                        </td>
                        <td className="px-3 py-2 align-middle font-mono text-[11px] text-neutral-700">
                          {app.student.phone}
                        </td>
                        <td className="px-3 py-2 align-middle font-mono text-[11px] text-neutral-700">
                          {app.student.uniqueCode}
                        </td>
                        <td className="px-3 py-2 align-middle text-right text-neutral-500">
                          {new Date(app.createdAt).toLocaleString("ko-KR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {viewMode === "EVALUATION" && (
                <table className="min-w-full border-t border-neutral-100 text-xs">
                  <thead className="bg-neutral-50 text-[11px] text-neutral-500">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        #
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        학생
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        학교
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        희망 대학교
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        평가자 / 점수 요약
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium">
                        평가 건수
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium">
                        평균 총점
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredApplications.map((app, index) => {
                      const avgScore = getAvgTotalScore(app);
                      return (
                        <tr key={app.id} className="hover:bg-neutral-50/60">
                          <td className="px-3 py-2 align-middle text-neutral-400">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 align-middle text-neutral-800">
                            {app.student.name}
                          </td>
                          <td className="px-3 py-2 align-middle text-neutral-600">
                            {app.student.school}
                          </td>
                          <td className="px-3 py-2 align-middle text-neutral-600">
                            {app.desiredUniv}
                          </td>
                          <td className="px-3 py-2 align-middle text-neutral-600">
                            {getEvaluatorSummary(app)}
                          </td>
                          <td className="px-3 py-2 align-middle text-right text-neutral-700">
                            {app.evaluations?.length ?? 0}
                          </td>
                          <td className="px-3 py-2 align-middle text-right text-neutral-800">
                            {avgScore !== null ? `${avgScore}` : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {viewMode === "SHEET" && (
                <table className="min-w-full border-t border-neutral-100 text-xs">
                  <thead className="bg-neutral-50 text-[11px] text-neutral-500">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        #
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        학생
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        학교
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        희망 대학교
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        악보 제목
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
                        악보 링크
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium">
                        신청일
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredApplications.map((app, index) => (
                      <tr key={app.id} className="hover:bg-neutral-50/60">
                        <td className="px-3 py-2 align-middle text-neutral-400">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 align-middle text-neutral-800">
                          {app.student.name}
                        </td>
                        <td className="px-3 py-2 align-middle text-neutral-600">
                          {app.student.school}
                        </td>
                        <td className="px-3 py-2 align-middle text-neutral-600">
                          {app.desiredUniv}
                        </td>
                        <td className="px-3 py-2 align-middle text-neutral-700">
                          {app.sheetTitle || "-"}
                        </td>
                        <td className="px-3 py-2 align-middle text-neutral-600">
                          {app.sheetUrl ? (
                            <a
                              href={app.sheetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 underline underline-offset-2"
                            >
                              링크 열기
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2 align-middle text-right text-neutral-500">
                          {new Date(app.createdAt).toLocaleString("ko-KR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


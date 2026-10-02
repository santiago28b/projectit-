"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookmarkCheck,
  BookmarkPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  GitBranch,
  LoaderCircle,
  Save,
  Sparkles,
  Video,
} from "lucide-react";
import { useReviewViewModel } from "@/client/viewmodels/useReviewViewModel";
import { evidenceLevels, safeExternalUrl } from "@/shared/models/review";
import type { EvidenceLevel } from "@/shared/models/domain";

const labels: Record<EvidenceLevel, string> = {
  strong: "Strong",
  partial: "Partial",
  not_shown: "Not shown",
  not_assessed: "Not assessed",
};
const colors: Record<EvidenceLevel, string> = {
  strong: "bg-emerald-50 text-emerald-800 border-emerald-200",
  partial: "bg-amber-50 text-amber-900 border-amber-200",
  not_shown: "bg-rose-50 text-rose-800 border-rose-200",
  not_assessed: "bg-zinc-100 text-zinc-600 border-zinc-200",
};
const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-2 focus:outline-blue-600";
const buttonLayout =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50";
const buttonClass = `${buttonLayout} border-zinc-300 bg-white hover:bg-zinc-50`;

type ViewModel = ReturnType<typeof useReviewViewModel>;

function DeliverableLink({
  url,
  children,
}: {
  url: string | null;
  children: React.ReactNode;
}) {
  const href = safeExternalUrl(url);
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 border-b border-zinc-200 py-3 text-sm font-medium text-blue-700 hover:text-blue-900"
    >
      {children}
      <ExternalLink size={16} className="shrink-0" />
    </a>
  ) : (
    <p className="py-3 text-sm text-zinc-500">{children} unavailable</p>
  );
}

function Walkthrough({ url }: { url: string }) {
  const href = safeExternalUrl(url);
  const parsed = href ? new URL(href) : null;
  let embed: string | undefined;
  if (
    parsed?.hostname === "www.youtube.com" ||
    parsed?.hostname === "youtube.com"
  ) {
    const id = parsed.searchParams.get("v");
    if (id && /^[\w-]{11}$/.test(id))
      embed = `https://www.youtube-nocookie.com/embed/${id}`;
  } else if (
    parsed?.hostname === "youtu.be" &&
    /^[\w-]{11}$/.test(parsed.pathname.slice(1))
  ) {
    embed = `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
  } else if (
    parsed?.hostname === "www.loom.com" &&
    /^\/share\/[a-zA-Z0-9]+$/.test(parsed.pathname)
  ) {
    embed = `https://www.loom.com/embed/${parsed.pathname.split("/")[2]}`;
  }
  const [failed, setFailed] = useState(false);
  return (
    <>
      <div className="aspect-video overflow-hidden rounded-md bg-zinc-950">
        {embed ? (
          <iframe
            src={embed}
            title="Candidate Walkthrough"
            className="h-full w-full"
            allow="fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : href ? (
          <video
            controls
            preload="metadata"
            className="h-full w-full"
            src={href}
            onError={() => setFailed(true)}
            aria-label="Candidate Walkthrough"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-300">
            <Video size={32} />
            <p className="text-sm">No Walkthrough attached to this sample</p>
          </div>
        )}
      </div>
      {failed && (
        <p role="status" className="mt-2 text-sm text-amber-800">
          This video cannot be played here. Open the original Walkthrough below.
        </p>
      )}
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-700"
        >
          Open Walkthrough <ExternalLink size={14} />
        </a>
      )}
    </>
  );
}

function Workspace({ model }: { model: ViewModel }) {
  const data = model.data!;
  const [criterionIndex, setCriterionIndex] = useState(0);
  const [results, setResults] = useState<Record<string, unknown>>(
    data.evaluation?.rubricResults ?? {},
  );
  const [notes, setNotes] = useState(data.evaluation?.notes ?? "");
  const [recommended, setRecommended] = useState(
    data.evaluation?.interviewRecommended ?? false,
  );
  const [dirty, setDirty] = useState(false);
  const criterion = data.rubric[criterionIndex];
  const initials = data.candidateName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <>
      <header className="border-b border-zinc-200 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-blue-100 text-lg font-semibold text-blue-800"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Candidate review
              </p>
              <h1 className="mt-1 break-words text-2xl font-semibold">
                {data.candidateName}
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                {[data.candidate.university, data.candidate.location]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
            </div>
          </div>
          {data.shortlist ? (
            <div className="flex flex-col items-end gap-1">
              <p className="flex items-center gap-1.5 text-sm font-medium text-blue-800">
                <BookmarkCheck size={17} /> Shortlisted
              </p>
              <button
                className="text-sm font-medium text-zinc-600 underline-offset-2 hover:text-red-700 hover:underline disabled:opacity-50"
                onClick={model.removeFromShortlist}
                disabled={model.busy}
              >
                Remove from Shortlist
              </button>
            </div>
          ) : (
            <button
              className={`${buttonLayout} border-blue-700 bg-blue-700 text-white hover:bg-blue-800`}
              onClick={model.shortlist}
              disabled={model.busy}
            >
              <BookmarkPlus size={17} />
              Add to Shortlist
            </button>
          )}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <p className="font-medium">{data.project.title}</p>
          <time
            className="text-zinc-500"
            dateTime={data.submission.submittedAt}
          >
            Submitted{" "}
            {new Intl.DateTimeFormat("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(data.submission.submittedAt))}
          </time>
          <p className="text-zinc-500">
            {data.company.name}{" "}
            {data.project.type === "platform" ? " / Sponsor" : ""}
          </p>
        </div>
      </header>

      <div className="grid gap-8 py-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="walkthrough-title">
            <h2
              id="walkthrough-title"
              className="mb-4 flex items-center gap-2 text-base font-semibold"
            >
              <Video size={18} />
              Walkthrough
            </h2>
            <Walkthrough url={data.submission.videoUrl} />
          </section>
          <section aria-labelledby="deliverables-title">
            <h2 id="deliverables-title" className="text-base font-semibold">
              Deliverables
            </h2>
            <DeliverableLink url={data.submission.repositoryUrl}>
              <span className="inline-flex items-center gap-2">
                <GitBranch size={16} />
                Repository
              </span>
            </DeliverableLink>
            {data.submission.fileUrls.map((url, index) => (
              <DeliverableLink key={`${url}-${index}`} url={url}>
                <span className="inline-flex items-center gap-2">
                  <FileText size={16} />
                  File {index + 1}
                </span>
              </DeliverableLink>
            ))}
          </section>
          <section aria-labelledby="explanation-title">
            <h2 id="explanation-title" className="mb-3 text-base font-semibold">
              Written explanation
            </h2>
            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-zinc-700">
              {data.submission.writtenResponse ||
                "No written explanation provided."}
            </p>
          </section>
          <section
            aria-labelledby="questions-title"
            className="border-t border-zinc-200 pt-6"
          >
            <h2
              id="questions-title"
              className="flex items-center gap-2 text-base font-semibold"
            >
              <Sparkles size={18} className="text-teal-700" />
              Follow-up questions
            </h2>
            <p className="mt-1 text-xs font-medium text-teal-700">
              AI-suggested
            </p>
            <ol className="mt-3 space-y-4">
              {data.followUpQuestions.map((question, index) => (
                <li key={index} className="flex gap-3 text-sm leading-6">
                  <span className="font-mono text-teal-700">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{question}</span>
                </li>
              ))}
            </ol>
            {!data.followUpQuestions.length && (
              <p className="mt-3 text-sm text-zinc-500">
                No follow-up questions available.
              </p>
            )}
          </section>
        </div>

        <div className="min-w-0 space-y-8">
          <section aria-labelledby="evidence-title">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="evidence-title" className="text-base font-semibold">
                Skill Evidence
              </h2>
              <span className="text-xs text-zinc-500">This Submission</span>
            </div>
            <div className="mt-2 divide-y divide-zinc-200">
              {data.evidence.map((entry) => (
                <div key={entry.skill} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{entry.skill}</h3>
                    <span
                      className={`rounded border px-2 py-1 text-xs font-medium ${colors[entry.level]}`}
                    >
                      {labels[entry.level]}
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-xs font-medium ${entry.source === "company" ? "text-blue-700" : "text-teal-700"}`}
                  >
                    {entry.source === "company"
                      ? "Company-reviewed"
                      : "AI-assessed"}
                  </p>
                  {entry.rationale && (
                    <p className="mt-2 break-words text-sm leading-6 text-zinc-600">
                      {entry.rationale}
                    </p>
                  )}
                  <details className="mt-2">
                    <summary className="w-fit cursor-pointer text-xs font-medium text-blue-700">
                      {entry.source === "company"
                        ? "Edit Company review"
                        : "Override Evidence"}
                    </summary>
                    <form
                      className="mt-3 space-y-3"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const form = new FormData(event.currentTarget);
                        void model.override(
                          entry.skill,
                          form.get("level") as EvidenceLevel,
                          String(form.get("rationale") ?? ""),
                        );
                      }}
                    >
                      <label className="block text-xs font-medium">
                        Evidence level
                        <select
                          name="level"
                          defaultValue={entry.level}
                          className={`${inputClass} mt-1`}
                          disabled={model.busy}
                        >
                          {evidenceLevels.map((level) => (
                            <option key={level} value={level}>
                              {labels[level]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-xs font-medium">
                        Review rationale
                        <textarea
                          name="rationale"
                          defaultValue={
                            entry.source === "company" ? entry.rationale : ""
                          }
                          rows={2}
                          className={`${inputClass} mt-1`}
                          disabled={model.busy}
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={model.busy}
                        className={buttonClass}
                      >
                        <Save size={15} />
                        Save Evidence
                      </button>
                    </form>
                  </details>
                </div>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="rubric-title"
            className="border-t border-zinc-200 pt-6"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="rubric-title" className="text-base font-semibold">
                Rubric Evaluation
              </h2>
              <span className="text-xs text-zinc-500">
                {data.rubric.length
                  ? `${criterionIndex + 1} of ${data.rubric.length}`
                  : "No Rubric"}
              </span>
            </div>
            {criterion ? (
              <>
                <div
                  className="mt-4 flex flex-wrap gap-2"
                  aria-label="Rubric categories"
                >
                  {data.rubric.map((item, index) => (
                    <button
                      type="button"
                      key={item.name}
                      aria-current={
                        index === criterionIndex ? "step" : undefined
                      }
                      onClick={() => setCriterionIndex(index)}
                      className={`flex min-h-9 items-center gap-1.5 border-b-2 px-2 text-xs font-medium ${index === criterionIndex ? "border-blue-700 text-blue-700" : "border-transparent text-zinc-500"}`}
                    >
                      {Boolean(results[item.name]) && <Check size={12} />}
                      {item.name}
                    </button>
                  ))}
                </div>
                <h3 className="mt-4 text-sm font-semibold">{criterion.name}</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  {criterion.description}
                </p>
                <label
                  className="mt-4 block text-xs font-medium"
                  htmlFor="rubric-level"
                >
                  Evidence level
                </label>
                <select
                  id="rubric-level"
                  className={`${inputClass} mt-1`}
                  value={
                    typeof results[criterion.name] === "string"
                      ? String(results[criterion.name])
                      : ""
                  }
                  onChange={(event) => {
                    setResults({
                      ...results,
                      [criterion.name]: event.target.value,
                    });
                    setDirty(true);
                  }}
                  disabled={model.busy}
                >
                  <option value="" disabled>
                    Select a level
                  </option>
                  {evidenceLevels.map((level) => (
                    <option key={level} value={level}>
                      {labels[level]}
                    </option>
                  ))}
                </select>
                <div className="mt-3 flex justify-between">
                  <button
                    type="button"
                    className={buttonClass}
                    disabled={criterionIndex === 0}
                    title="Previous Rubric category"
                    aria-label="Previous Rubric category"
                    onClick={() => setCriterionIndex((index) => index - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    className={buttonClass}
                    disabled={criterionIndex === data.rubric.length - 1}
                    title="Next Rubric category"
                    aria-label="Next Rubric category"
                    onClick={() => setCriterionIndex((index) => index + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">
                No Rubric has been added to this Project. You can still save
                review notes.
              </p>
            )}
            <label
              htmlFor="review-notes"
              className="mt-5 block text-sm font-medium"
            >
              Reviewer notes
            </label>
            <textarea
              id="review-notes"
              rows={4}
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                setDirty(true);
              }}
              disabled={model.busy}
              className={`${inputClass} mt-2`}
            />
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={recommended}
                onChange={(event) => {
                  setRecommended(event.target.checked);
                  setDirty(true);
                }}
                disabled={model.busy}
                className="h-4 w-4 accent-blue-700"
              />
              Recommend an interview
            </label>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-zinc-500">
                {dirty
                  ? "Unsaved changes"
                  : data.evaluation
                    ? "Evaluation saved"
                    : `Reviewing as ${data.reviewer.name}`}
              </span>
              <button
                type="button"
                className={`${buttonClass} border-blue-700 text-blue-700`}
                disabled={model.busy}
                onClick={async () => {
                  if (await model.saveEvaluation(results, notes, recommended))
                    setDirty(false);
                }}
              >
                <Save size={16} />
                Save Evaluation
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export function ReviewView({ submissionId }: { submissionId: string }) {
  const model = useReviewViewModel(submissionId);
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-7 font-[family-name:var(--font-geist-sans)] sm:px-8">
      <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/company/review"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Submissions
        </Link>
        <Link href="/company" className="text-sm font-medium text-blue-700">
          Company portal <ArrowRight size={14} className="inline" />
        </Link>
      </nav>
      {model.isSample && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>Sample Submission / local changes only</span>
          <Link href="/company/review" className="font-medium underline">
            Seeded Submissions
          </Link>
        </div>
      )}
      <div aria-live="polite" aria-atomic="true">
        {model.notice && (
          <p className="mb-5 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <Check size={16} />
            {model.notice}
          </p>
        )}
      </div>
      {model.error && (
        <div
          role="alert"
          className="mb-5 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
        >
          <p>{model.error}</p>
          {!model.data && (
            <button className={`${buttonClass} mt-3`} onClick={model.retry}>
              Try again
            </button>
          )}
        </div>
      )}
      {model.busy && (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 text-sm text-blue-700"
        >
          <LoaderCircle size={16} className="animate-spin" />
          Saving...
        </p>
      )}
      {model.data ? (
        <Workspace key={model.data.submission.id} model={model} />
      ) : (
        !model.error && (
          <div
            role="status"
            className="flex min-h-60 items-center justify-center gap-3 text-zinc-500"
          >
            <LoaderCircle size={20} className="animate-spin" />
            Loading Submission...
          </div>
        )
      )}
    </main>
  );
}

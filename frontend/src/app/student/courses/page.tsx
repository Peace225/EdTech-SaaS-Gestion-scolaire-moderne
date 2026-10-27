// src/app/student/courses/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { completeLessonAction, submitAssessmentAction } from "./actions";
import {
  ArrowRight,
  Award,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileQuestion,
  ExternalLink,
  GraduationCap,
  Layers3,
  LockKeyhole,
  RotateCcw,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

type SearchParams = { courseId?: string; notice?: string };

type QuizView = {
  id: string;
  passingScore: number;
  questions: {
    id: string;
    prompt: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
  }[];
};

const levelLabels = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
} as const;

const notices: Record<string, string> = {
  lesson: "Chapitre validé ! Tu peux poursuivre ton parcours.",
  placement: "Test de positionnement enregistré. Ton niveau est maintenant disponible.",
  final: "Évaluation finale enregistrée. Consulte ton résultat ci-dessous.",
  locked: "Cette étape n'est pas encore débloquée. Termine les étapes précédentes.",
  invalid: "Action non valide ou questionnaire incomplet. Réessaie.",
  passed: "Tu as déjà réussi cette évaluation.",
};

function AssessmentForm({
  quiz,
  courseId,
  title,
  description,
  submitLabel,
}: {
  quiz: QuizView;
  courseId: string;
  title: string;
  description: string;
  submitLabel: string;
}) {
  return (
    <form action={submitAssessmentAction} className="space-y-6">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="assessmentId" value={quiz.id} />
      <div>
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>
        <p className="mt-2 text-xs text-cyan-400">{quiz.questions.length} questions · Une seule réponse par question</p>
      </div>
      {quiz.questions.map((question, index) => (
        <fieldset
          key={question.id}
          className="space-y-3 rounded-2xl border border-slate-800 bg-[#0b1626] p-4 sm:p-5"
        >
          <legend className="px-1 text-sm font-semibold leading-relaxed text-white">
            <span className="text-cyan-400">{index + 1}.</span> {question.prompt}
          </legend>
          {([
            ["A", question.optionA],
            ["B", question.optionB],
            ["C", question.optionC],
            ["D", question.optionD],
          ] as const).map(([letter, content]) => (
            <label
              key={letter}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 transition hover:border-cyan-500/50 hover:bg-cyan-500/5 has-[:checked]:border-cyan-500/70 has-[:checked]:bg-cyan-500/10"
            >
              <input
                className="mt-1 h-4 w-4 shrink-0 accent-teal-400"
                type="radio"
                name={`answer_${question.id}`}
                value={letter}
                required
              />
              <span className="leading-relaxed"><strong className="mr-2 text-cyan-300">{letter}.</strong>{content}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <button
        type="submit"
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-teal-400 sm:w-auto"
      >
        <CheckCircle2 size={17} /> {submitLabel}
      </button>
    </form>
  );
}

export default async function StudentCoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Le rôle et le dossier doivent venir de la base, jamais d'un as any de session.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      name: true,
      studentProfile: {
        select: {
          id: true,
          classId: true,
          class: { select: { name: true, level: true, educationType: true } },
        },
      },
    },
  });

  if (!user || user.role !== "STUDENT") redirect("/login");
  const student = user.studentProfile;

  if (!student) {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
        <GraduationCap size={32} className="mx-auto mb-4 text-amber-400" />
        <h1 className="text-xl font-bold text-white">Dossier apprenant non associé</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          L'administration doit rattacher votre compte à une classe ou une promotion avant de publier vos cours.
        </p>
      </section>
    );
  }

  const { courseId, notice } = await searchParams;
  const isProfessional = student.class.educationType === "PROFESSIONAL";

  const courses = await prisma.learningCourse.findMany({
    where: {
      status: "PUBLISHED",
      assignment: { is: { classId: student.classId } },
    },
    orderBy: [{ createdAt: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      assignment: {
        select: {
          subject: true,
          teacher: { select: { name: true } },
        },
      },
      lessons: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          position: true,
          title: true,
          content: true,
          estimatedMinutes: true,
          resourceUrl: true,
          progress: {
            where: { studentId: student.id },
            select: { completedAt: true },
            take: 1,
          },
        },
      },
      assessments: {
        where: { published: true },
        select: {
          id: true,
          kind: true,
          passingScore: true,
          questions: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              prompt: true,
              optionA: true,
              optionB: true,
              optionC: true,
              optionD: true,
            },
          },
          attempts: {
            where: { studentId: student.id },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { percentScore: true, level: true, createdAt: true },
          },
        },
      },
    },
  });

  const selected = courses.find((course) => course.id === courseId) ?? courses[0];
  const totalLessons = courses.reduce((sum, c) => sum + c.lessons.length, 0);
  const completedLessons = courses.reduce(
    (sum, c) => sum + c.lessons.filter((l) => l.progress.length > 0).length,
    0,
  );

  const placement = selected?.assessments.find((a) => a.kind === "PLACEMENT");
  const final = selected?.assessments.find((a) => a.kind === "FINAL");
  const placementAttempt = placement?.attempts[0];
  const finalAttempt = final?.attempts[0];
  const placementAvailable = Boolean(placement && placement.questions.length > 0);
  const finalAvailable = Boolean(final && final.questions.length > 0);
  const needsPlacement = placementAvailable && !placementAttempt;
  const finishedLessons = selected?.lessons.filter((l) => l.progress.length > 0).length ?? 0;
  const allLessonsDone = Boolean(selected && selected.lessons.length > 0 && finishedLessons === selected.lessons.length);
  const finalPassed = Boolean(final && finalAttempt && finalAttempt.percentScore >= final.passingScore);
  const courseCompleted = allLessonsDone && (!finalAvailable || finalPassed);
  const progressionSteps = (selected?.lessons.length ?? 0) + (finalAvailable ? 1 : 0);
  const stepsDone = finishedLessons + (finalAvailable && finalPassed ? 1 : 0);
  const progressPercent = progressionSteps > 0 ? Math.round((stepsDone / progressionSteps) * 100) : 0;

  return (
    <div className="relative mx-auto max-w-7xl space-y-7 pb-16 text-slate-100">
      <div className="pointer-events-none absolute -top-10 right-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute left-0 top-64 h-64 w-64 rounded-full bg-teal-500/5 blur-[100px]" />

      <header className="relative rounded-3xl border border-slate-800 bg-[#111e30]/85 p-6 shadow-xl sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <Sparkles size={14} /> Parcours pédagogique progressif
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {isProfessional ? "Mes cours & modules de formation" : "Mes cours & apprentissages"}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
              {isProfessional ? "Formation" : "Classe"} : <strong className="text-slate-200">{student.class.name}</strong>
              {student.class.level ? ` · ${student.class.level}` : ""}. Apprends à ton rythme, chapitre après chapitre, et évalue ton niveau.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-64">
            <div className="rounded-2xl border border-slate-800 bg-[#0b1626] p-4">
              <Layers3 className="mb-2 text-cyan-400" size={20} />
              <p className="text-2xl font-extrabold text-white">{courses.length}</p>
              <p className="text-xs text-slate-400">{isProfessional ? "Modules publiés" : "Cours publiés"}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#0b1626] p-4">
              <CheckCircle2 className="mb-2 text-teal-400" size={20} />
              <p className="text-2xl font-extrabold text-white">{completedLessons}<span className="text-xs font-normal text-slate-500">/{totalLessons}</span></p>
              <p className="text-xs text-slate-400">Chapitres terminés</p>
            </div>
          </div>
        </div>
      </header>

      {notice && notices[notice] && (
        <p role="status" className="relative rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
          {notices[notice]}
        </p>
      )}

      {courses.length === 0 ? (
        <section className="relative rounded-3xl border border-dashed border-slate-700 bg-[#111e30]/60 px-6 py-14 text-center">
          <BookOpen size={34} className="mx-auto mb-4 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">Aucun cours publié pour ta {isProfessional ? "promotion" : "classe"}</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
            Les cours apparaîtront ici lorsque l'établissement aura créé et publié ses parcours dans les matières ou modules qui te sont affectés.
          </p>
          <Link href="/student/subjects" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300">
            Voir mes {isProfessional ? "modules" : "matières"} <ArrowRight size={15} />
          </Link>
        </section>
      ) : (
        <div className="relative grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="self-start rounded-3xl border border-slate-800 bg-[#111e30]/80 p-4 xl:sticky xl:top-6">
            <p className="mb-3 px-2 text-xs font-bold uppercase tracking-widest text-slate-500">Catalogue de ma classe</p>
            <nav aria-label="Choisir un parcours" className="space-y-2">
              {courses.map((course) => {
                const done = course.lessons.filter((l) => l.progress.length > 0).length;
                const active = selected?.id === course.id;
                return (
                  <Link
                    key={course.id}
                    href={`/student/courses?courseId=${encodeURIComponent(course.id)}`}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-2xl border p-3.5 transition ${active ? "border-cyan-500/40 bg-cyan-500/10" : "border-slate-800 bg-[#0b1626]/80 hover:border-slate-600"}`}
                  >
                    <p className="text-[11px] font-medium text-cyan-400">{course.assignment.subject}</p>
                    <p className="mt-1 text-sm font-bold leading-snug text-white">{course.title}</p>
                    <p className="mt-2 text-[11px] text-slate-400">{done} / {course.lessons.length} chapitres</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700" aria-hidden="true">
                      <div className="h-full rounded-full bg-teal-400" style={{ width: `${course.lessons.length ? Math.round((done / course.lessons.length) * 100) : 0}%` }} />
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {selected && (
            <div className="min-w-0 space-y-6">
              <section className="rounded-3xl border border-slate-800 bg-[#111e30]/90 p-5 sm:p-7">
                <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-400">
                  <BookMarked size={16} /> {selected.assignment.subject}
                  <ChevronRight size={14} /> {isProfessional ? "Formation progressive" : "Parcours progressif"}
                </div>
                <h2 className="mt-3 text-2xl font-extrabold text-white">{selected.title}</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-400">{selected.description}</p>
                <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5"><UserRound size={15} className="text-cyan-400" />{selected.assignment.teacher.name || "Formateur non renseigné"}</span>
                  <span className="inline-flex items-center gap-1.5"><BookOpen size={15} className="text-cyan-400" />{selected.lessons.length} chapitres</span>
                  <span className="inline-flex items-center gap-1.5"><Clock3 size={15} className="text-cyan-400" />{selected.lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0)} min estimées</span>
                </div>
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-300">Ma progression</span>
                    <span className="font-bold text-teal-300">{progressPercent} %</span>
                  </div>
                  <div role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Progression du cours" className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all" style={{ width: `${progressPercent}%` }} />
                  </div>
                  {courseCompleted && <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-teal-400"><Award size={16} /> Parcours terminé</p>}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-800 bg-[#111e30]/85 p-5 sm:p-7">
                <div className="mb-5 flex items-start gap-3">
                  <span className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-2.5 text-indigo-300"><Target size={20} /></span>
                  <div>
                    <h3 className="font-bold text-white">Étape 1 — Évaluation de niveau</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">Un diagnostic de départ pour situer tes connaissances avant les chapitres.</p>
                  </div>
                </div>

                {placementAvailable && placement && (
                  <>
                    {placementAttempt && (
                      <div className="mb-5 rounded-2xl border border-teal-500/20 bg-teal-500/10 p-4">
                        <p className="text-sm font-bold text-teal-300">Test réalisé · {placementAttempt.percentScore} %</p>
                        <p className="mt-1 text-xs text-slate-300">
                          Niveau estimé : <strong className="text-white">{placementAttempt.level ? levelLabels[placementAttempt.level] : "Non déterminé"}</strong>
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-slate-400">Ce résultat sert à te situer, pas à te sanctionner. Il ne remplace pas une évaluation officielle.</p>
                      </div>
                    )}
                    <details open={!placementAttempt} className="group rounded-2xl border border-slate-800 bg-[#0b1626]/60 p-4">
                      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-cyan-300 [&::-webkit-details-marker]:hidden">
                        {placementAttempt ? <RotateCcw size={16} /> : <FileQuestion size={16} />}
                        {placementAttempt ? "Refaire le test de niveau" : "Commencer le test de niveau"}
                      </summary>
                      <div className="mt-6">
                        <AssessmentForm
                          quiz={placement}
                          courseId={selected.id}
                          title="Questionnaire de positionnement"
                          description="Réponds à toutes les questions. Ton niveau sera calculé à partir des réponses enregistrées."
                          submitLabel="Valider mon niveau"
                        />
                      </div>
                    </details>
                  </>
                )}
                {!placementAvailable && (
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-[#0b1626]/70 p-4 text-sm text-slate-400">
                    <CircleHelp size={19} className="shrink-0 text-amber-400" />
                    Aucun test de positionnement n'a encore été configuré pour ce parcours. Tu peux commencer les chapitres directement.
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-white">Étape 2 — Apprentissage progressif</h3>
                    <p className="mt-1 text-xs text-slate-400">Chaque chapitre se débloque lorsque le précédent est validé.</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">{finishedLessons}/{selected.lessons.length}</span>
                </div>
                {selected.lessons.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-[#111e30]/60 p-6 text-sm text-slate-400">Les chapitres de ce cours ne sont pas encore disponibles.</div>
                )}
                {selected.lessons.map((lesson, index) => {
                  const done = lesson.progress.length > 0;
                  const allowed = !needsPlacement && (index === 0 || selected.lessons[index - 1].progress.length > 0);
                  return (
                    <article key={lesson.id} className={`rounded-3xl border p-5 sm:p-6 ${allowed ? "border-slate-700 bg-[#111e30]/90" : "border-slate-800 bg-[#0c1625]/70 opacity-80"}`}>
                      <div className="flex items-start gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${done ? "border-teal-500/30 bg-teal-500/10 text-teal-400" : allowed ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300" : "border-slate-700 bg-slate-800 text-slate-400"}`}>
                          {done ? <CheckCircle2 size={20} /> : allowed ? index + 1 : <LockKeyhole size={18} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-400">Chapitre {index + 1}</p>
                          <h4 className="mt-1 font-bold leading-relaxed text-white">{lesson.title}</h4>
                          <p className="mt-1 text-xs text-slate-500">Durée indicative : {lesson.estimatedMinutes} min</p>
                        </div>
                        {done && <span className="shrink-0 rounded-full bg-teal-500/10 px-2 py-1 text-[11px] font-bold text-teal-400">Validé</span>}
                      </div>
                      {allowed ? (
                        <details open={!done} className="mt-5 rounded-2xl border border-slate-800 bg-[#0b1626]/70 p-4 sm:p-5">
                          <summary className="cursor-pointer text-sm font-semibold text-cyan-300">{done ? "Relire le chapitre" : "Lire mon chapitre"}</summary>
                          <div className="mt-5 whitespace-pre-line break-words text-sm leading-8 text-slate-300">{lesson.content}</div>
                          {lesson.resourceUrl && (
                            lesson.resourceUrl.startsWith("https://") ||
                            (lesson.resourceUrl.startsWith("/") && !lesson.resourceUrl.startsWith("//"))
                          ) && (
                            <a
                              href={lesson.resourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-semibold text-cyan-300 hover:border-cyan-400"
                            >
                              <ExternalLink size={15} /> Ouvrir le support du chapitre
                            </a>
                          )}
                          {!done && (
                            <form action={completeLessonAction} className="mt-6 border-t border-slate-800 pt-5">
                              <input type="hidden" name="courseId" value={selected.id} />
                              <input type="hidden" name="lessonId" value={lesson.id} />
                              <button type="submit" className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-teal-400">
                                <CheckCircle2 size={17} /> J'ai terminé ce chapitre
                              </button>
                            </form>
                          )}
                        </details>
                      ) : (
                        <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                          <LockKeyhole size={14} /> {needsPlacement ? "Réalise d'abord le test de niveau." : "Valide le chapitre précédent pour débloquer celui-ci."}
                        </p>
                      )}
                    </article>
                  );
                })}
              </section>

              <section className="rounded-3xl border border-slate-800 bg-[#111e30]/90 p-5 sm:p-7">
                <div className="mb-5 flex items-start gap-3">
                  <span className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-amber-300"><Award size={20} /></span>
                  <div>
                    <h3 className="font-bold text-white">Étape 3 — Évaluation des acquis</h3>
                    <p className="mt-1 text-xs text-slate-400">Teste tes connaissances à la fin du parcours.</p>
                  </div>
                </div>
                {!finalAvailable || !final ? (
                  <p className="rounded-xl border border-slate-800 bg-[#0b1626] p-4 text-sm text-slate-400">
                    Aucune évaluation finale n'est encore configurée. La progression se termine après la validation de tous les chapitres.
                  </p>
                ) : final && finalPassed ? (
                  <div className="rounded-2xl border border-teal-500/20 bg-teal-500/10 p-5">
                    <p className="inline-flex items-center gap-2 text-sm font-bold text-teal-300"><CheckCircle2 size={18} /> Évaluation réussie</p>
                    <p className="mt-2 text-sm text-slate-200">Dernier score : <strong>{finalAttempt?.percentScore} %</strong> · Seuil de réussite : {final.passingScore} %</p>
                  </div>
                ) : !allLessonsDone ? (
                  <p className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0b1626] p-4 text-sm text-slate-400"><LockKeyhole size={17} /> Termine tous les chapitres pour accéder au quiz final.</p>
                ) : (
                  <div className="space-y-5">
                    {finalAttempt && (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                        Dernier résultat : {finalAttempt.percentScore} %. Le seuil de réussite est de {final.passingScore} %. Tu peux réessayer après révision.
                      </div>
                    )}
                    <AssessmentForm
                      quiz={final}
                      courseId={selected.id}
                      title="Quiz final"
                      description={`Réponds à toutes les questions. Réussite à partir de ${final.passingScore} %.`}
                      submitLabel="Soumettre mon évaluation"
                    />
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

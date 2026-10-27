// src/app/student/schedule/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  GraduationCap,
  MapPin,
  Sparkles,
  UserRound,
  BookOpen,
  CalendarX2,
} from "lucide-react";

export const dynamic = "force-dynamic";

const DAYS = [
  { key: "monday", label: "Lundi", weekend: false },
  { key: "tuesday", label: "Mardi", weekend: false },
  { key: "wednesday", label: "Mercredi", weekend: false },
  { key: "thursday", label: "Jeudi", weekend: false },
  { key: "friday", label: "Vendredi", weekend: false },
  { key: "saturday", label: "Samedi", weekend: true },
  { key: "sunday", label: "Dimanche", weekend: true },
] as const;

type DayKey = (typeof DAYS)[number]["key"];

// Le champ Schedule.dayOfWeek est un String dans le schéma actuel.
// Accepte les libellés français/anglais et les numéros ISO (1 = lundi, 7 = dimanche).
const DAY_ALIASES: Record<string, DayKey> = {
  "1": "monday", lundi: "monday", lun: "monday", monday: "monday", mon: "monday",
  "2": "tuesday", mardi: "tuesday", mar: "tuesday", tuesday: "tuesday", tue: "tuesday", tues: "tuesday",
  "3": "wednesday", mercredi: "wednesday", mer: "wednesday", wednesday: "wednesday", wed: "wednesday",
  "4": "thursday", jeudi: "thursday", jeu: "thursday", thursday: "thursday", thu: "thursday", thur: "thursday",
  "5": "friday", vendredi: "friday", ven: "friday", friday: "friday", fri: "friday",
  "6": "saturday", samedi: "saturday", sam: "saturday", saturday: "saturday", sat: "saturday",
  "0": "sunday", "7": "sunday", dimanche: "sunday", dim: "sunday", sunday: "sunday", sun: "sunday",
};

function resolveDay(value: string): DayKey | null {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");

  return DAY_ALIASES[normalized] ?? null;
}

function toMinutes(value: string): number | null {
  const cleaned = value.trim().toLowerCase().replace(/\s+/g, "");
  const match = /^(\d{1,2})(?::|h)(\d{2})?(?::\d{2})?$/.exec(cleaned);

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function showTime(value: string): string {
  const minutes = toMinutes(value);
  if (minutes === null) return value.trim() || "À préciser";
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function showDuration(totalMinutes: number): string {
  if (!totalMinutes) return "—";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours} h${minutes ? ` ${minutes} min` : ""}` : `${minutes} min`;
}

export default async function StudentSchedulePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Ne jamais utiliser le rôle transmis par le navigateur ni une recherche sans userId.
  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      studentProfile: {
        select: {
          id: true,
          class: {
            select: { id: true, name: true, level: true, educationType: true },
          },
        },
      },
    },
  });

  if (account?.role === "PARENT") redirect("/parent/dashboard");
  if (account?.role !== "STUDENT" || !account.studentProfile) notFound();

  const classroom = account.studentProfile.class;
  const professional = classroom.educationType === "PROFESSIONAL";
  const teacherLabel = professional ? "Formateur" : "Enseignant";

  // Uniquement les séances associées à la classe/promotion de l'étudiant.
  const schedules = await prisma.schedule.findMany({
    where: { classId: classroom.id },
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      subject: true,
      room: true,
      teacher: { select: { name: true } },
    },
  });

  const entries = schedules.map((schedule) => {
    const start = toMinutes(schedule.startTime);
    const end = toMinutes(schedule.endTime);
    return {
      ...schedule,
      day: resolveDay(schedule.dayOfWeek),
      start,
      end,
      validInterval: start !== null && end !== null && end > start,
    };
  });

  const grouped: Record<DayKey, typeof entries> = {
    monday: [], tuesday: [], wednesday: [], thursday: [],
    friday: [], saturday: [], sunday: [],
  };
  const unrecognizedDays: typeof entries = [];

  for (const entry of entries) {
    if (entry.day) grouped[entry.day].push(entry);
    else unrecognizedDays.push(entry);
  }

  for (const day of DAYS) {
    grouped[day.key].sort((a, b) =>
      (a.start ?? Number.MAX_SAFE_INTEGER) - (b.start ?? Number.MAX_SAFE_INTEGER) ||
      a.subject.localeCompare(b.subject, "fr")
    );
  }

  // Signaler les chevauchements au lieu de présenter un planning incohérent.
  const conflictingIds = new Set<string>();
  for (const day of DAYS) {
    const items = grouped[day.key].filter((item) => item.validInterval);
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (items[i].start! < items[j].end! && items[j].start! < items[i].end!) {
          conflictingIds.add(items[i].id);
          conflictingIds.add(items[j].id);
        }
      }
    }
  }

  const invalidTimeCount = entries.filter((entry) => !entry.validInterval).length;
  const activeDays = DAYS.filter((day) => grouped[day.key].length > 0).length;
  const totalMinutes = entries.reduce(
    (sum, entry) => sum + (entry.validInterval ? entry.end! - entry.start! : 0),
    0
  );
  // Les cours du week-end n'apparaissent que s'ils sont réellement programmés.
  const visibleDays = DAYS.filter((day) => !day.weekend || grouped[day.key].length > 0);

  return (
    <main className="relative mx-auto max-w-7xl space-y-7 pb-16 text-white print:max-w-none print:space-y-4 print:bg-white print:text-black">
      <div aria-hidden="true" className="pointer-events-none absolute right-10 top-0 h-72 w-72 rounded-full bg-amber-500/10 blur-[110px] print:hidden" />
      <div aria-hidden="true" className="pointer-events-none absolute left-0 top-56 h-72 w-72 rounded-full bg-sky-500/10 blur-[110px] print:hidden" />

      <header className="relative z-10 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl md:p-8 print:border-0 print:bg-white print:p-0 print:shadow-none">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 print:hidden">
              <Sparkles size={14} /> Emploi du temps hebdomadaire
            </span>
            <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight md:text-3xl print:text-2xl print:text-black">
              <CalendarDays className="shrink-0 text-amber-400 print:text-black" size={29} />
              Mon planning de {professional ? "formation" : "cours"}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-400 print:text-slate-700">
              {professional ? "Promotion" : "Classe"} : <strong className="text-slate-100 print:text-black">{classroom.name}</strong>
              {classroom.level ? ` · ${classroom.level}` : ""}. Retrouvez les horaires,
              {professional ? " modules" : " matières"}, salles et {professional ? "formateurs" : "enseignants"} renseignés par votre établissement.
            </p>
            <p className="text-xs text-slate-500 print:text-slate-600">
              Planning hebdomadaire récurrent : les vacances, jours fériés et modifications exceptionnelles ne figurent pas dans ces créneaux.
            </p>
          </div>
          <div className="print:hidden"><PrintButton /></div>
        </div>
      </header>

      <section aria-label="Statistiques du planning" className="relative z-10 grid grid-cols-1 gap-3 sm:grid-cols-3 print:grid-cols-3">
        {[
          { label: "Séances programmées", value: String(entries.length), Icon: BookOpen, color: "text-amber-400" },
          { label: "Jours avec cours", value: String(activeDays), Icon: CalendarDays, color: "text-sky-400" },
          { label: "Durée renseignée", value: showDuration(totalMinutes), Icon: Clock3, color: "text-emerald-400" },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/65 p-5 print:border-slate-300 print:bg-white print:p-3">
            <div className={`rounded-xl border border-slate-700 bg-slate-950 p-3 ${color} print:hidden`}><Icon size={21} /></div>
            <div>
              <p className="text-xs font-medium text-slate-400 print:text-slate-600">{label}</p>
              <p className="mt-1 text-xl font-extrabold text-white print:text-black">{value}</p>
            </div>
          </div>
        ))}
      </section>

      {(unrecognizedDays.length > 0 || invalidTimeCount > 0 || conflictingIds.size > 0) && (
        <div role="status" className="relative z-10 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100 print:border-amber-700 print:bg-white print:text-black">
          <AlertTriangle size={19} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Des créneaux nécessitent une vérification par l'administration.</p>
            <p className="mt-1 text-xs leading-relaxed opacity-85">
              {[
                unrecognizedDays.length ? `${unrecognizedDays.length} jour(s) non reconnu(s)` : null,
                invalidTimeCount ? `${invalidTimeCount} horaire(s) incomplet(s) ou incohérent(s)` : null,
                conflictingIds.size ? `${conflictingIds.size} séance(s) en chevauchement` : null,
              ].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <section className="relative z-10 rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-16 text-center print:border-slate-400 print:bg-white">
          <CalendarX2 size={44} className="mx-auto mb-4 text-slate-500" />
          <h2 className="text-lg font-bold">Aucun cours programmé pour le moment</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400 print:text-slate-600">
            Votre établissement n'a pas encore renseigné l'emploi du temps de cette {professional ? "promotion" : "classe"}.
          </p>
        </section>
      ) : (
        <section aria-label="Cours par jour" className="relative z-10 grid grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-3 print:grid-cols-2 print:gap-3">
          {visibleDays.map((day) => {
            const items = grouped[day.key];
            return (
              <article key={day.key} className="break-inside-avoid space-y-4 rounded-3xl border border-slate-800 bg-slate-900/65 p-5 shadow-lg md:p-6 print:rounded-xl print:border-slate-300 print:bg-white print:p-4 print:shadow-none">
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 print:border-slate-300">
                  <h2 className="flex items-center gap-2 font-extrabold text-white print:text-black">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    {day.label}
                  </h2>
                  <span className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-400 print:border-slate-300 print:bg-white print:text-slate-600">
                    {items.length} cours
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500 print:border-slate-300">Aucun cours prévu</p>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className={`space-y-2 rounded-2xl border p-4 print:rounded-lg print:border-slate-300 print:p-3 ${conflictingIds.has(item.id) ? "border-amber-500/45 bg-amber-950/20" : "border-slate-800 bg-slate-950/80"}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="inline-flex items-center gap-1.5 font-bold text-amber-300 print:text-black">
                            <Clock3 size={14} /> {showTime(item.startTime)} – {showTime(item.endTime)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-sky-300 print:text-black">
                            <MapPin size={13} /> {item.room?.trim() || "Salle à préciser"}
                          </span>
                        </div>
                        <h3 className="text-sm font-extrabold text-white print:text-black">{item.subject}</h3>
                        <p className="inline-flex items-center gap-2 text-xs text-slate-400 print:text-slate-700">
                          <UserRound size={13} /> {teacherLabel} : {item.teacher.name?.trim() || "Nom non renseigné"}
                        </p>
                        {(!item.validInterval || conflictingIds.has(item.id)) && (
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 print:text-black">
                            <AlertTriangle size={13} /> {item.validInterval ? "Chevauchement à vérifier" : "Horaire à vérifier"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {unrecognizedDays.length > 0 && (
        <section className="relative z-10 space-y-3 rounded-2xl border border-amber-500/30 bg-slate-900/70 p-5 print:bg-white print:text-black">
          <h2 className="flex items-center gap-2 font-bold"><AlertTriangle size={18} /> Séances sans jour reconnu</h2>
          <p className="text-xs text-slate-400 print:text-slate-700">Ces cours sont enregistrés mais le jour indiqué doit être corrigé par l'établissement.</p>
          {unrecognizedDays.map((item) => (
            <p key={item.id} className="rounded-xl border border-slate-800 p-3 text-sm print:border-slate-300">
              <strong>{item.subject}</strong> · Jour saisi : {item.dayOfWeek || "Non renseigné"} · {showTime(item.startTime)} – {showTime(item.endTime)}
            </p>
          ))}
        </section>
      )}

      <footer className="relative z-10 flex items-start gap-2 text-xs leading-relaxed text-slate-500 print:text-slate-700">
        <GraduationCap size={16} className="shrink-0" />
        Planning affiché à partir des créneaux enregistrés pour votre {professional ? "promotion" : "classe"}. Pour toute correction, contactez l'administration de votre établissement.
      </footer>
    </main>
  );
}

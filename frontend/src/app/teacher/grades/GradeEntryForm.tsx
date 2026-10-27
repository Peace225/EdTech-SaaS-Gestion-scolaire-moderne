"use client";

import { useActionState, useState } from "react";
import { Award, BookOpen, CalendarDays, GraduationCap, Send } from "lucide-react";
import { submitGradeAction } from "./actions";

type AssignmentOption = {
  id: string;
  classId: string;
  className: string;
  classLevel: string;
  subject: string;
};

type StudentOption = {
  id: string;
  classId: string;
  name: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-[#08111f] p-3 text-sm text-white outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10 disabled:cursor-not-allowed disabled:opacity-50";

export default function GradeEntryForm({
  assignments,
  students,
}: {
  assignments: AssignmentOption[];
  students: StudentOption[];
}) {
  const [assignmentId, setAssignmentId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [state, formAction, pending] = useActionState(submitGradeAction, {
    status: "idle" as "idle" | "success" | "error",
    message: "",
  });

  const assignment = assignments.find((item) => item.id === assignmentId);
  const eligibleStudents = students.filter(
    (item) => item.classId === assignment?.classId,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-2">
          <span className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <BookOpen size={14} /> Classe et matière
          </span>
          <select
            name="assignmentId"
            required
            value={assignmentId}
            onChange={(event) => {
              setAssignmentId(event.target.value);
              setStudentId("");
            }}
            className={inputClass}
          >
            <option value="" disabled>Choisir une affectation...</option>
            {assignments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.className} ({item.classLevel}) — {item.subject}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <GraduationCap size={14} /> Élève
          </span>
          <select
            name="studentId"
            required
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            disabled={!assignment}
            className={inputClass}
          >
            <option value="" disabled>
              {assignment ? "Choisir un élève..." : "Sélectionner d'abord une classe"}
            </option>
            {eligibleStudents.map((student) => (
              <option key={student.id} value={student.id}>{student.name}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <CalendarDays size={14} /> Période
          </span>
          <select name="term" defaultValue="T1" required className={inputClass}>
            <option value="T1">Trimestre 1</option>
            <option value="T2">Trimestre 2</option>
            <option value="T3">Trimestre 3</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Award size={14} /> Note sur 20
          </span>
          <input
            name="score"
            type="number"
            min="0"
            max="20"
            step="0.25"
            required
            placeholder="Ex. : 14,5"
            className={inputClass}
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold text-slate-300">Coefficient</span>
          <input
            name="coef"
            type="number"
            min="1"
            max="10"
            step="1"
            defaultValue="1"
            required
            className={inputClass}
          />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending || !assignment || !studentId}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 p-3 text-sm font-bold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} /> {pending ? "Enregistrement..." : "Soumettre la note"}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Les notes sont transmises avec le statut « En attente » jusqu'à la validation par l'administration.
      </p>

      {state.message && (
        <p
          role="status"
          aria-live="polite"
          className={`rounded-xl border p-3 text-sm ${
            state.status === "success"
              ? "border-teal-500/30 bg-teal-500/10 text-teal-200"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

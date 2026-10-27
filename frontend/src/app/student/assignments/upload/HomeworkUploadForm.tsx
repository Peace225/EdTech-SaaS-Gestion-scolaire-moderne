// src/app/student/assignments/upload/HomeworkUploadForm.tsx
"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { FileCheck2, FileUp, LoaderCircle, Send, ShieldCheck, X } from "lucide-react";

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ["pdf", "docx", "jpg", "jpeg", "png"];

type Props = {
  homeworkId: string;
  action: (formData: FormData) => Promise<void>;
};

function UploadSubmitButton({ hasValidFile }: { hasValidFile: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={!hasValidFile || pending}
      aria-busy={pending}
      className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 py-3.5 text-sm font-extrabold text-[#06211f] shadow-lg shadow-teal-500/10 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {pending ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
      {pending ? "Envoi sécurisé en cours…" : "Confirmer le dépôt"}
    </button>
  );
}

export function HomeworkUploadForm({ homeworkId, action }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function acceptFile(file: File | null) {
    setError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setSelectedFile(null);
      setError("Format non accepté : PDF, DOCX, JPG ou PNG uniquement.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size === 0 || file.size > MAX_FILE_BYTES) {
      setSelectedFile(null);
      setError("Le document doit peser entre 1 octet et 4 Mo.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
  }

  function clearFile() {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="homeworkId" value={homeworkId} />

      <div
        className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-9 ${dragging ? "border-teal-400 bg-teal-500/10" : "border-slate-700 bg-[#091421] hover:border-teal-500/50"}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files.item(0);
          if (!file || !inputRef.current) return;
          // Placer le fichier déposé dans le véritable input envoyé par le formulaire.
          const transfer = new DataTransfer();
          transfer.items.add(file);
          inputRef.current.files = transfer.files;
          acceptFile(file);
        }}
      >
        <label htmlFor="student-homework-file" className="block cursor-pointer rounded-xl focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-teal-400">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 text-teal-300">
            {selectedFile ? <FileCheck2 size={25} /> : <FileUp size={25} />}
          </span>
          <span className="mt-4 block text-sm font-bold text-white">
            {selectedFile ? "Votre document est prêt" : "Choisir un document ou le glisser ici"}
          </span>
          <span className="mt-2 block text-xs text-slate-400">PDF, DOCX, JPG ou PNG · 4 Mo maximum</span>
          <span className="mt-4 inline-flex rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200">Parcourir mes fichiers</span>
          <input
            id="student-homework-file"
            ref={inputRef}
            type="file"
            name="file"
            accept=".pdf,.docx,.jpg,.jpeg,.png"
            className="sr-only"
            required
            onChange={(event) => acceptFile(event.currentTarget.files?.item(0) ?? null)}
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>
      )}

      {selectedFile && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-teal-500/20 bg-teal-500/5 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <FileCheck2 size={20} className="shrink-0 text-teal-300" />
            <div className="min-w-0">
              <p className="break-all text-sm font-semibold text-white">{selectedFile.name}</p>
              <p className="mt-1 text-xs text-slate-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} Mo</p>
            </div>
          </div>
          <button type="button" aria-label="Retirer le fichier" title="Retirer le fichier" onClick={clearFile} className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition hover:bg-slate-800 hover:text-white">
            <X size={17} />
          </button>
        </div>
      )}

      <div className="flex items-start gap-2 text-xs leading-6 text-slate-400">
        <ShieldCheck size={17} className="mt-1 shrink-0 text-teal-400" />
        <p>Le serveur vérifie votre inscription, la disponibilité du devoir, le format du document et l'absence de remise précédente. Une fois transmis, le fichier ne peut plus être remplacé depuis cette page.</p>
      </div>

      <div className="flex justify-end">
        <UploadSubmitButton hasValidFile={selectedFile !== null} />
      </div>
    </form>
  );
}

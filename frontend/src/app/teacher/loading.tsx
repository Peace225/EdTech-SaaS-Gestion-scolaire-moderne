
export default function TeacherLoading() {
  return (
    <div
      role="status"
      aria-label="Chargement du portail enseignant"
      className="mx-auto w-full max-w-7xl animate-pulse space-y-8 p-6"
    >
      <div className="space-y-3">
        <div className="h-8 w-64 rounded-xl bg-slate-800" />
        <div className="h-4 w-96 max-w-full rounded-lg bg-slate-800/60" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-2xl border border-slate-800 bg-[#111e30]"
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-80 rounded-3xl border border-slate-800 bg-[#111e30] lg:col-span-2" />
        <div className="h-80 rounded-3xl border border-slate-800 bg-[#111e30]" />
      </div>

      <span className="sr-only">
        Chargement des informations pédagogiques...
      </span>
    </div>
  );
}

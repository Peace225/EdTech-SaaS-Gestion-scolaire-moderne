
"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  ShieldCheck,
  LockKeyhole,
  Phone,
  MapPin,
  BookOpen,
  Award,
  Briefcase,
  Save,
  Sparkles,
  GraduationCap,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

type Role = "ADMIN" | "TEACHER" | "PARENT" | "STUDENT";

type ActionState = {
  error: string | null;
};

type Props = {
  action: (
    state: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
};

type FieldProps = {
  name: string;
  label: string;
  icon: LucideIcon;
  placeholder: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
  maxLength?: number;
};

const roleOptions = [
  {
    value: "ADMIN",
    label: "Administrateur",
    icon: ShieldCheck,
    description: "Gestion complète de la plateforme",
  },
  {
    value: "TEACHER",
    label: "Enseignant",
    icon: BookOpen,
    description: "Suivi pédagogique et évaluations",
  },
  {
    value: "PARENT",
    label: "Parent",
    icon: Users,
    description: "Suivi des dossiers de ses enfants",
  },
  {
    value: "STUDENT",
    label: "Élève",
    icon: GraduationCap,
    description: "Accès à l'espace étudiant",
  },
] as const;

// Styles réutilisables
const inputClass = `
  h-12 w-full rounded-xl
  border border-white/[0.09]
  bg-[#0b1727] pl-11 pr-4
  text-sm text-white
  placeholder:text-slate-600
  outline-none transition-all duration-300
  focus:border-teal-400/50
  focus:ring-4 focus:ring-teal-400/10
  disabled:opacity-60
`;

// ===============================
// CHAMP RÉUTILISABLE
// ===============================

function FormField({
  name,
  label,
  icon: Icon,
  placeholder,
  type = "text",
  required = false,
  autoComplete,
  minLength,
  maxLength,
}: FieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="flex items-center gap-2 text-xs font-semibold text-slate-300"
      >
        {label}
        {required && (
          <span className="text-teal-400">*</span>
        )}
      </label>

      <div className="relative group">
        <Icon
          size={17}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-teal-400"
        />

        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          className={inputClass}
        />
      </div>
    </div>
  );
}

// ===============================
// TITRE SECTION
// ===============================

function FormSectionHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-7 flex items-start gap-3 border-b border-white/[0.07] pb-6">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-400/20 bg-teal-400/10 text-xs font-bold text-teal-300">
        {number}
      </span>

      <div>
        <h2 className="text-base font-bold text-white sm:text-lg">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-6 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

// ===============================
// FORMULAIRE PRINCIPAL
// ===============================

export default function NewUserForm({ action }: Props) {
  const [role, setRole] = useState<Role>("PARENT");

  const [state, formAction, pending] = useActionState(
    action,
    { error: null }
  );

  const isTeacher = role === "TEACHER";
  const isParent = role === "PARENT";

  const selectedRole = roleOptions.find(
    (item) => item.value === role
  );

  const SelectedIcon = selectedRole?.icon ?? User;

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#08111f] text-white">

      {/* Fond décoratif */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_5%_0%,rgba(20,184,166,0.08),transparent_40%),radial-gradient(ellipse_at_95%_60%,rgba(59,130,246,0.06),transparent_40%)]" />

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 pb-20 sm:px-6 lg:px-8">

        {/* ===============================
            NAVIGATION
        =============================== */}
        <div className="flex flex-wrap items-center justify-between gap-4">

          <Link
            href="/admin/users"
            className="group inline-flex items-center gap-3 text-sm font-semibold text-slate-400 transition-colors hover:text-teal-300"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#111e30] transition-colors group-hover:border-teal-400/30">
              <ArrowLeft
                size={18}
                className="transition-transform group-hover:-translate-x-1"
              />
            </span>

            Retour aux utilisateurs
          </Link>

          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-2 text-[11px] font-semibold text-emerald-300">
            <ShieldCheck size={14} />
            Administration
          </span>
        </div>

        {/* ===============================
            EN-TÊTE
        =============================== */}
        <section className="relative overflow-hidden rounded-[30px] border border-teal-400/15 bg-gradient-to-br from-[#123d49] via-[#102a3a] to-[#0d1b2c] p-7 sm:p-9">

          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-teal-400/10 blur-[80px]" />

          <div className="relative z-10">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.13em] text-teal-300">
              <Sparkles size={15} />
              Gestion des comptes
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Nouvel{" "}
              <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                utilisateur
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Créez un nouveau compte et attribuez-lui
              les autorisations correspondant à son rôle
              dans votre établissement.
            </p>

          </div>
        </section>

        {/* ===============================
            FORMULAIRE
        =============================== */}
        <form action={formAction} className="space-y-6">

          {/* Message d'erreur */}
          {state.error && (
            <div
              role="alert"
              aria-live="polite"
              className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-200"
            >
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <span>{state.error}</span>
            </div>
          )}

          {/* SECTION 1 */}
          <section className="rounded-[28px] border border-white/[0.08] bg-[#111e30]/90 p-6 shadow-xl sm:p-8">

            <FormSectionHeading
              number="01"
              title="Informations de connexion"
              description="Renseignez les informations d'identification de l'utilisateur."
            />

            <div className="grid gap-6 md:grid-cols-2">

              <FormField
                name="name"
                label="Nom complet"
                icon={User}
                placeholder="Ex : Jean Dupont"
                required
                autoComplete="name"
                maxLength={120}
              />

              <FormField
                name="email"
                label="Adresse e-mail"
                icon={Mail}
                placeholder="nom@etablissement.ci"
                type="email"
                required
                autoComplete="off"
                maxLength={254}
              />

              {/* Choix du rôle */}
              <div className="space-y-2">

                <label
                  htmlFor="role"
                  className="flex items-center gap-2 text-xs font-semibold text-slate-300"
                >
                  Rôle assigné
                  <span className="text-teal-400">*</span>
                </label>

                <div className="relative group">
                  <ShieldCheck
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400"
                  />

                  <select
                    id="role"
                    name="role"
                    required
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as Role)
                    }
                    className={`${inputClass} cursor-pointer appearance-none pr-10`}
                  >
                    {roleOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        className="bg-[#0b1727] text-white"
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <ArrowRight
                    size={15}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-500"
                  />
                </div>
              </div>

              <FormField
                name="password"
                label="Mot de passe provisoire"
                icon={LockKeyhole}
                placeholder="Au moins 12 caractères"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
              />

            </div>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-400/10 bg-amber-400/[0.05] p-4">
              <LockKeyhole
                size={17}
                className="mt-0.5 shrink-0 text-amber-300"
              />

              <p className="text-xs leading-6 text-slate-400">
                Utilisez un mot de passe provisoire unique et
                transmettez-le à l'utilisateur par un canal
                sécurisé. Ne réutilisez pas les identifiants
                des comptes de démonstration.
              </p>
            </div>

          </section>

          {/* SECTION 2 */}
          <section className="rounded-[28px] border border-white/[0.08] bg-[#111e30]/90 p-6 shadow-xl sm:p-8">

            <FormSectionHeading
              number="02"
              title="Informations administratives"
              description="Les champs disponibles s'adaptent automatiquement au rôle sélectionné."
            />

            {/* Rôle sélectionné */}
            <div className="mb-7 flex items-center gap-4 rounded-2xl border border-teal-400/15 bg-teal-400/[0.05] p-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
                <SelectedIcon size={23} />
              </div>

              <div>
                <p className="text-sm font-bold text-white">
                  {selectedRole?.label}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {selectedRole?.description}
                </p>
              </div>

            </div>

            {(isTeacher || isParent) && (
              <div className="grid gap-6 md:grid-cols-2">

                <FormField
                  name="phone"
                  label="Téléphone / WhatsApp"
                  icon={Phone}
                  placeholder="+225 07 XX XX XX XX"
                  type="tel"
                  autoComplete="tel"
                  maxLength={40}
                />

                <FormField
                  name="address"
                  label="Lieu de résidence"
                  icon={MapPin}
                  placeholder="Ex : Cocody, Abidjan"
                  autoComplete="street-address"
                  maxLength={255}
                />

                {/* PARENT */}
                {isParent && (
                  <FormField
                    name="job"
                    label="Profession"
                    icon={Briefcase}
                    placeholder="Ex : Commerçant, Ingénieur..."
                    maxLength={150}
                  />
                )}

                {/* ENSEIGNANT */}
                {isTeacher && (
                  <>
                    <FormField
                      name="specialty"
                      label="Spécialité / Matière"
                      icon={BookOpen}
                      placeholder="Ex : Mathématiques"
                      maxLength={150}
                    />

                    <FormField
                      name="degree"
                      label="Diplôme"
                      icon={Award}
                      placeholder="Ex : Master en Sciences"
                      maxLength={150}
                    />

                    <div className="space-y-2 md:col-span-2">

                      <label
                        htmlFor="pedagogicalInfo"
                        className="text-xs font-semibold text-slate-300"
                      >
                        Informations pédagogiques
                      </label>

                      <textarea
                        id="pedagogicalInfo"
                        name="pedagogicalInfo"
                        rows={4}
                        maxLength={2000}
                        placeholder="Expérience, disponibilités, informations complémentaires..."
                        className="w-full resize-y rounded-xl border border-white/[0.09] bg-[#0b1727] p-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-teal-400/50 focus:ring-4 focus:ring-teal-400/10"
                      />

                    </div>
                  </>
                )}

              </div>
            )}

            {(role === "ADMIN" || role === "STUDENT") && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-5">

                <CheckCircle2
                  size={21}
                  className="mt-0.5 shrink-0 text-emerald-400"
                />

                <div>
                  <p className="text-sm font-bold text-white">
                    Informations de connexion suffisantes
                  </p>

                  <p className="mt-2 text-xs leading-6 text-slate-400">
                    Aucun champ administratif complémentaire
                    n'est nécessaire dans ce formulaire pour
                    le rôle sélectionné.
                  </p>
                </div>

              </div>
            )}

          </section>

          {/* ===============================
              BOUTONS
          =============================== */}
          <div className="flex flex-col-reverse items-stretch justify-end gap-3 pt-4 sm:flex-row sm:items-center">

            <Link
              href="/admin/users"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
            >
              Annuler
            </Link>

            <button
              type="submit"
              disabled={pending}
              className="group inline-flex cursor-pointer items-center justify-center gap-3 rounded-xl bg-teal-400 px-7 py-3.5 text-sm font-bold text-[#092b35] shadow-lg shadow-teal-950/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                  Création en cours...
                </>
              ) : (
                <>
                  <Save size={19} />
                  Créer le compte
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>

          </div>

        </form>

        {/* Footer */}
        <footer className="border-t border-white/[0.07] pt-6 text-center text-xs text-slate-500">
          EdTech SaaS • Gestion sécurisée des utilisateurs
        </footer>

      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";

const NAME_CHANGE_COOLDOWN_DAYS = 30;

type ProfilePageProps = {
  searchParams?: Promise<{
    saved?: string;
    error?: string;
  }>;
};

type ProfileRow = {
  display_name: string | null;
  name_changed_at: string | null;
};

function getNextNameChangeDate(nameChangedAt: string | null) {
  if (!nameChangedAt) return null;

  const changedAt = new Date(nameChangedAt);
  const nextChangeDate = new Date(changedAt);
  nextChangeDate.setDate(nextChangeDate.getDate() + NAME_CHANGE_COOLDOWN_DAYS);

  return nextChangeDate;
}

function canChangeName(nameChangedAt: string | null) {
  const nextChangeDate = getNextNameChangeDate(nameChangedAt);

  if (!nextChangeDate) return true;

  return new Date() >= nextChangeDate;
}

function formatDate(input: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(input);
}

async function saveProfile(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const displayName = String(formData.get("displayName") ?? "")
    .trim()
    .slice(0, 60);

  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, name_changed_at")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileError) {
    redirect("/profile?error=profile-load-failed");
  }

  const currentDisplayName = currentProfile?.display_name?.trim() ?? "";

  if (displayName === currentDisplayName) {
    redirect("/profile?saved=1");
  }

  if (!canChangeName(currentProfile?.name_changed_at ?? null)) {
    redirect("/profile?error=name-change-cooldown");
  }

  const now = new Date().toISOString();

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: displayName || null,
    name_changed_at: now,
    updated_at: now,
  });

  if (error) {
    redirect("/profile?error=save-failed");
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  redirect("/profile?saved=1");
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const supabase = await createClient();
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, name_changed_at")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  const displayName = profile?.display_name?.trim() ?? "";
  const nextChangeDate = getNextNameChangeDate(profile?.name_changed_at ?? null);
  const nameChangeAllowed = canChangeName(profile?.name_changed_at ?? null);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#030706] text-white">
      <section className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,255,160,0.12),transparent_34%),linear-gradient(180deg,#04100c_0%,#030706_52%,#020403_100%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />

        <Container>
          <div className="relative z-10 py-4 sm:py-5">
            <header className="flex min-w-0 items-center justify-between gap-3">
              <Link href="/dashboard" className="flex min-w-0 items-center">
                <Image
                  src="/brand/poolr-logo-dark.png"
                  alt="Poolr"
                  width={340}
                  height={100}
                  priority
                  className="h-11 w-auto max-w-[150px] sm:h-16 sm:max-w-none"
                />
              </Link>

              <Link
                href="/dashboard"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
              >
                Dashboard
              </Link>
            </header>

            <div className="mx-auto mt-5 max-w-2xl">
              <section className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300 sm:text-xs">
                  Profile
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">
                  My profile
                </h1>

                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Change the name that is shown on Poolr. Your email address is
                  linked to your login and cannot be changed here.
                </p>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-zinc-400">
                  You can change your name once every{" "}
                  <span className="font-black text-white">
                    {NAME_CHANGE_COOLDOWN_DAYS} days
                  </span>
                  .
                  {!nameChangeAllowed && nextChangeDate ? (
                    <>
                      {" "}
                      You can change it again from{" "}
                      <span className="font-black text-emerald-200">
                        {formatDate(nextChangeDate)}
                      </span>
                      .
                    </>
                  ) : null}
                </div>

                {resolvedSearchParams.saved ? (
                  <div className="mt-5 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100">
                    Profile saved.
                  </div>
                ) : null}

                {resolvedSearchParams.error === "name-change-cooldown" ? (
                  <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                    You can only change your name once every{" "}
                    {NAME_CHANGE_COOLDOWN_DAYS} days.
                  </div>
                ) : null}

                {resolvedSearchParams.error &&
                resolvedSearchParams.error !== "name-change-cooldown" ? (
                  <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                    Saving your profile failed. Please try again.
                  </div>
                ) : null}

                <form action={saveProfile} className="mt-7 space-y-5">
                  <div>
                    <label
                      htmlFor="displayName"
                      className="mb-2 block text-sm font-black text-white"
                    >
                      Name
                    </label>

                    <input
                      id="displayName"
                      name="displayName"
                      type="text"
                      defaultValue={displayName}
                      maxLength={60}
                      placeholder="Your name"
                      disabled={!nameChangeAllowed}
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/70 disabled:cursor-not-allowed disabled:text-zinc-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-black text-white"
                    >
                      Email
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={user.email ?? ""}
                      readOnly
                      className="w-full cursor-not-allowed rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm font-semibold text-zinc-400 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!nameChangeAllowed}
                    className="w-full rounded-2xl bg-emerald-300 px-5 py-4 text-sm font-black text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {nameChangeAllowed ? "Save profile" : "Name change locked"}
                  </button>
                </form>
              </section>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
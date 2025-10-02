"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

type Sex = "male" | "female" | "other";
type Intensity = "low" | "medium" | "high" | "";
type Goal = "weight_loss" | "cardio" | "strength" | "mobility" | "";

type Profile = {
  displayName?: string;
  birthday?: string; // yyyy-mm-dd (users/{uid}.profile)
  heightCm?: number;
  weightKg?: number;
  sex?: Sex;

  // Onboarding-derived (users/{uid}/private/health_profile)
  goal?: Goal;
  preferredIntensity?: Intensity;
  equipment?: string[];
  notes?: string;            // constraints.notes
  shareWithCoach?: boolean;  // consent.shareWithCoach
};

type FirestoreUserDoc = {
  name?: string;
  profile?: {
    birthday?: string;
    heightCm?: number;
    weightKg?: number;
    sex?: Sex;
  };
};

type HealthProfileDoc = {
  demographics?: {
    birthYear?: number;
    sexAtBirth?: "male" | "female" | "intersex" | "prefer_not_to_say";
    heightCm?: number;
    weightKg?: number;
  };
  fitness?: {
    goal?: Goal;
    preferredIntensity?: Intensity;
    equipment?: string[];
  };
  constraints?: {
    notes?: string;
  };
  consent?: {
    shareWithCoach?: boolean;
  };
};

const EQUIPMENT = ["none", "mat", "dumbbells", "resistance_band", "barbell", "bike", "treadmill"] as const;

export default function ProfileForm() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Helpers to avoid writing undefined
  const maybe = <T,>(cond: boolean, obj: T) => (cond ? obj : {});
  const isNum = (v: unknown): v is number => typeof v === "number" && !Number.isNaN(v);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;

      try {
        // 1) users/{uid}
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const userData = (userSnap.data() ?? {}) as FirestoreUserDoc;

        // 2) users/{uid}/private/health_profile
        const hpRef = doc(db, "users", user.uid, "private", "health_profile");
        const hpSnap = await getDoc(hpRef);
        const hp = (hpSnap.exists() ? hpSnap.data() : {}) as HealthProfileDoc;

        // Prefer HP demographics > users.profile
        const d = hp.demographics ?? {};
        const sexFromHP: Sex | undefined =
          d.sexAtBirth === "male" || d.sexAtBirth === "female"
            ? d.sexAtBirth
            : d.sexAtBirth
            ? "other"
            : undefined;

        const merged: Profile = {
          displayName: userData.name ?? user.displayName ?? "",
          birthday: userData.profile?.birthday ?? "",
          heightCm: d.heightCm ?? userData.profile?.heightCm ?? undefined,
          weightKg: d.weightKg ?? userData.profile?.weightKg ?? undefined,
          sex: sexFromHP ?? userData.profile?.sex ?? "other",

          goal: hp.fitness?.goal ?? "",
          preferredIntensity: hp.fitness?.preferredIntensity ?? "",
          equipment: hp.fitness?.equipment ?? [],
          notes: hp.constraints?.notes ?? "",
          shareWithCoach: hp.consent?.shareWithCoach ?? false,
        };

        if (!cancelled) setProfile(merged);
      } catch (e: unknown) {
        const message =
          typeof e === "object" && e && "message" in e
            ? String((e as { message?: string }).message)
            : "Failed to load profile.";
        if (!cancelled) setErr(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const birthYear = useMemo(() => {
    if (!profile.birthday) return undefined;
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(profile.birthday);
    return ok ? new Date(profile.birthday).getFullYear() : undefined;
  }, [profile.birthday]);

  const toggleEquip = (key: string) => {
    setProfile((p) => {
      const set = new Set(p.equipment ?? []);
      set.has(key) ? set.delete(key) : set.add(key);
      return { ...p, equipment: Array.from(set) };
    });
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      // 1) users/{uid} (your existing place for display/birthday/basic stats)
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: profile.displayName ?? null,
        profile: {
          birthday: profile.birthday || null,
          heightCm: isNum(profile.heightCm) ? profile.heightCm : null,
          weightKg: isNum(profile.weightKg) ? profile.weightKg : null,
          sex: (profile.sex as Sex) ?? "other",
          updatedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      // 2) users/{uid}/private/health_profile (source of truth for onboarding answers)
      const hpRef = doc(db, "users", user.uid, "private", "health_profile");

      // map UX `sex` -> `sexAtBirth`
      const sexAtBirth =
        profile.sex === "male" || profile.sex === "female"
          ? profile.sex
          : "prefer_not_to_say";

      await setDoc(
        hpRef,
        {
          demographics: {
            ...maybe(isNum(profile.heightCm ?? undefined), { heightCm: profile.heightCm }),
            ...maybe(isNum(profile.weightKg ?? undefined), { weightKg: profile.weightKg }),
            ...maybe(typeof birthYear === "number", { birthYear }),
            ...maybe(Boolean(sexAtBirth), { sexAtBirth }),
          },
          fitness: {
            ...maybe(Boolean(profile.goal), { goal: profile.goal }),
            ...maybe(Boolean(profile.preferredIntensity), { preferredIntensity: profile.preferredIntensity }),
            ...maybe(Boolean(profile.equipment && profile.equipment.length), { equipment: profile.equipment }),
          },
          constraints: {
            ...maybe(Boolean(profile.notes), { notes: profile.notes }),
          },
          consent: {
            ...maybe(typeof profile.shareWithCoach === "boolean", { shareWithCoach: !!profile.shareWithCoach }),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMsg("Profile saved.");
      setTimeout(() => setMsg(null), 2400);
    } catch (e: unknown) {
      const message =
        typeof e === "object" && e && "message" in e
          ? String((e as { message?: string }).message)
          : "Failed to save profile.";
      setErr(message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;
  if (loading) return <div className="text-sm text-gray-500">Loading profile…</div>;

  return (
    <div className="rounded-xl border p-4 bg-white">
      <h3 className="text-lg font-semibold mb-3">Profile</h3>

      {msg && <p className="text-green-600 text-sm mb-2">{msg}</p>}
      {err && <p className="text-red-600 text-sm mb-2">{err}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account name */}
        <label className="block">
          <span className="text-sm text-gray-700">Account Name</span>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={profile.displayName ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
          />
        </label>

        {/* Birthday */}
        <label className="block">
          <span className="text-sm text-gray-700">Birthday</span>
          <input
            type="date"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={profile.birthday ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, birthday: e.target.value }))}
          />
        </label>

        {/* Height */}
        <label className="block">
          <span className="text-sm text-gray-700">Height (cm)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={profile.heightCm ?? ""}
            onChange={(e) =>
              setProfile((p) => ({
                ...p,
                heightCm: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
        </label>

        {/* Weight */}
        <label className="block">
          <span className="text-sm text-gray-700">Weight (kg)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={profile.weightKg ?? ""}
            onChange={(e) =>
              setProfile((p) => ({
                ...p,
                weightKg: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
        </label>

        {/* Sex */}
        <label className="block">
          <span className="text-sm text-gray-700">Sex</span>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={profile.sex ?? "other"}
            onChange={(e) => setProfile((p) => ({ ...p, sex: e.target.value as Sex }))}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other / Prefer not to say</option>
          </select>
        </label>
      </div>

      {/* Onboarding answers (editable) */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Goal */}
        <label className="block">
          <span className="text-sm text-gray-700">Goal</span>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={profile.goal ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, goal: e.target.value as Goal }))}
          >
            <option value="">Select goal</option>
            <option value="weight_loss">Weight Loss</option>
            <option value="cardio">Cardio</option>
            <option value="strength">Strength</option>
            <option value="mobility">Mobility</option>
          </select>
        </label>

        {/* Intensity */}
        <label className="block">
          <span className="text-sm text-gray-700">Preferred Intensity</span>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={profile.preferredIntensity ?? ""}
            onChange={(e) =>
              setProfile((p) => ({ ...p, preferredIntensity: e.target.value as Intensity }))
            }
          >
            <option value="">Select intensity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        {/* Share with coach */}
        <label className="block">
          <span className="text-sm text-gray-700">Share with Coach</span>
          <div className="mt-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!profile.shareWithCoach}
                onChange={(e) => setProfile((p) => ({ ...p, shareWithCoach: e.target.checked }))}
              />
              Allow my assigned coach to view my health profile
            </label>
          </div>
        </label>
      </div>

      {/* Equipment pills */}
      <div className="mt-6">
        <span className="text-sm text-gray-700 block mb-2">Equipment</span>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT.map((eq) => {
            const active = (profile.equipment ?? []).includes(eq);
            return (
              <button
                key={eq}
                type="button"
                onClick={() => toggleEquip(eq)}
                className={`px-3 py-1 rounded-full border ${
                  active ? "bg-black text-white" : "bg-white"
                }`}
              >
                {eq.replace(/_/g, " ")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="mt-4">
        <label className="block">
          <span className="text-sm text-gray-700">Notes / Preferences</span>
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2"
            rows={3}
            placeholder="Anything we should know (injuries, constraints, preferences)…"
            value={profile.notes ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, notes: e.target.value }))}
          />
        </label>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="mt-4 rounded-md bg-[#58e221] text-white px-4 py-2 hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

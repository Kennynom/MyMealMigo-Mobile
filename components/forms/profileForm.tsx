"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

type Sex = "male" | "female" | "other";
type Intensity = "low" | "medium" | "high" | "";
type Goal = "weight_loss" | "cardio" | "strength" | "mobility" | "";

type Profile = {
  displayName?: string;
  birthday?: string;
  heightCm?: number;
  weightKg?: number;
  sex?: Sex;
  goal?: Goal;
  preferredIntensity?: Intensity;
  equipment?: string[];
  notes?: string;
  shareWithCoach?: boolean;
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

  const maybe = <T,>(cond: boolean, obj: T) => (cond ? obj : {});
  const isNum = (v: unknown): v is number => typeof v === "number" && !Number.isNaN(v);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const userData = (userSnap.data() ?? {}) as FirestoreUserDoc;

        const hpRef = doc(db, "users", user.uid, "private", "health_profile");
        const hpSnap = await getDoc(hpRef);
        const hp = (hpSnap.exists() ? hpSnap.data() : {}) as HealthProfileDoc;

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

      const hpRef = doc(db, "users", user.uid, "private", "health_profile");

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
  if (loading) return <div className="text-sm text-gray-500 p-6">Loading profile…</div>;

  return (
    <div className="rounded-3xl border-2 border-gray-200 p-8 bg-gradient-to-br from-white to-gray-50 shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <h3 className="text-3xl font-black text-gray-900 tracking-tight">Profile</h3>
        <p className="text-sm text-gray-600 mt-2 font-semibold">Manage your account and fitness preferences</p>
      </div>

      {/* Messages */}
      {msg && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-green-50 border-2 border-green-200 px-4 py-3">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-green-700 text-sm font-bold">{msg}</p>
        </div>
      )}
      {err && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 border-2 border-red-200 px-4 py-3">
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-red-700 text-sm font-bold">{err}</p>
        </div>
      )}

      {/* Basic Info Section */}
      <div className="mb-8">
        <h4 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[#58e221] flex items-center justify-center text-white text-sm">1</span>
          Basic Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-bold text-gray-700 mb-2 block">Account Name</span>
            <input
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold text-gray-900 focus:border-[#58e221] focus:ring-2 focus:ring-[#58e221]/20 transition-all outline-none"
              value={profile.displayName ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
              placeholder="Your name"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-gray-700 mb-2 block">Birthday</span>
            <input
              type="date"
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold text-gray-900 focus:border-[#58e221] focus:ring-2 focus:ring-[#58e221]/20 transition-all outline-none"
              value={profile.birthday ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, birthday: e.target.value }))}
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-gray-700 mb-2 block">Height (cm)</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold text-gray-900 focus:border-[#58e221] focus:ring-2 focus:ring-[#58e221]/20 transition-all outline-none"
              value={profile.heightCm ?? ""}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  heightCm: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              placeholder="170"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-gray-700 mb-2 block">Weight (kg)</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold text-gray-900 focus:border-[#58e221] focus:ring-2 focus:ring-[#58e221]/20 transition-all outline-none"
              value={profile.weightKg ?? ""}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  weightKg: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              placeholder="70"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-gray-700 mb-2 block">Sex</span>
            <select
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold text-gray-900 focus:border-[#58e221] focus:ring-2 focus:ring-[#58e221]/20 transition-all outline-none"
              value={profile.sex ?? "other"}
              onChange={(e) => setProfile((p) => ({ ...p, sex: e.target.value as Sex }))}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other / Prefer not to say</option>
            </select>
          </label>
        </div>
      </div>

      {/* Fitness Preferences Section */}
      <div className="mb-8">
        <h4 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[#58e221] flex items-center justify-center text-white text-sm">2</span>
          Fitness Preferences
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <label className="block">
            <span className="text-sm font-bold text-gray-700 mb-2 block">Goal</span>
            <select
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold text-gray-900 focus:border-[#58e221] focus:ring-2 focus:ring-[#58e221]/20 transition-all outline-none"
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

          <label className="block">
            <span className="text-sm font-bold text-gray-700 mb-2 block">Preferred Intensity</span>
            <select
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold text-gray-900 focus:border-[#58e221] focus:ring-2 focus:ring-[#58e221]/20 transition-all outline-none"
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

          <label className="block">
            <span className="text-sm font-bold text-gray-700 mb-2 block">Share with Coach</span>
            <div className="mt-2">
              <label className="inline-flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!profile.shareWithCoach}
                  onChange={(e) => setProfile((p) => ({ ...p, shareWithCoach: e.target.checked }))}
                  className="w-5 h-5 rounded border-2 border-gray-300 text-[#58e221] focus:ring-2 focus:ring-[#58e221]/20"
                />
                <span className="text-sm font-semibold text-gray-700">Allow coach to view my health profile</span>
              </label>
            </div>
          </label>
        </div>

        {/* Equipment pills */}
        <div>
          <span className="text-sm font-bold text-gray-700 block mb-3">Available Equipment</span>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT.map((eq) => {
              const active = (profile.equipment ?? []).includes(eq);
              return (
                <button
                  key={eq}
                  type="button"
                  onClick={() => toggleEquip(eq)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                    active
                      ? "bg-black text-white shadow-lg scale-105"
                      : "bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {eq.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="mb-8">
        <h4 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[#58e221] flex items-center justify-center text-white text-sm">3</span>
          Additional Notes
        </h4>
        <label className="block">
          <span className="text-sm font-bold text-gray-700 mb-2 block">Notes / Preferences</span>
          <textarea
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold text-gray-900 focus:border-[#58e221] focus:ring-2 focus:ring-[#58e221]/20 transition-all outline-none"
            rows={4}
            placeholder="Anything we should know (injuries, constraints, preferences)…"
            value={profile.notes ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, notes: e.target.value }))}
          />
        </label>
      </div>

      {/* Save Button */}
      <button
        onClick={save}
        disabled={saving}
        className="w-full md:w-auto rounded-xl bg-black text-white px-8 py-4 font-black text-lg hover:bg-gray-900 disabled:opacity-60 transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}
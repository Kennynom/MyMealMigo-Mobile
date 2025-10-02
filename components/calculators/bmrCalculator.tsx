"use client";

import { useEffect, useMemo, useState } from "react";

type Sex = "male" | "female";
type Activity = "sed" | "light" | "mod" | "very" | "extra";

type Props = {
  initialAge?: number | null;
  initialHeightCm?: number | null;
  initialWeightKg?: number | null;
  initialSex?: Sex | "other" | null;
};

export default function BmrCalculator({
  initialAge = null,
  initialHeightCm = null,
  initialWeightKg = null,
  initialSex = null,
}: Props) {
  const [age, setAge] = useState<number | "">("");
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [sex, setSex] = useState<Sex>("male");
  const [activity, setActivity] = useState<Activity>("sed");

  // Prefill each field once when an initial value exists and the input is still empty
  useEffect(() => {
    if (initialAge != null && age === "") setAge(initialAge);
  }, [initialAge, age]);

  useEffect(() => {
    if (initialHeightCm != null && heightCm === "") setHeightCm(initialHeightCm);
  }, [initialHeightCm, heightCm]);

  useEffect(() => {
    if (initialWeightKg != null && weightKg === "") setWeightKg(initialWeightKg);
  }, [initialWeightKg, weightKg]);

  useEffect(() => {
    if ((initialSex === "male" || initialSex === "female") && sex !== initialSex) {
      setSex(initialSex);
    }
  }, [initialSex, sex]);

  const parseNumberInput = (e: React.ChangeEvent<HTMLInputElement>) =>
    e.target.value === "" ? "" : Number.isNaN(e.target.valueAsNumber) ? "" : e.target.valueAsNumber;

  const bmr = useMemo(() => {
    if (age === "" || heightCm === "" || weightKg === "") return null;
    if (age <= 0 || heightCm <= 0 || weightKg <= 0) return null;

    const A = age;
    const H = heightCm;
    const W = weightKg;

    // Mifflin–St Jeor
    const base = 10 * W + 6.25 * H - 5 * A + (sex === "male" ? 5 : -161);
    return Math.round(base);
  }, [age, heightCm, weightKg, sex]);

  const activityFactor = useMemo<number>(() => {
    switch (activity) {
      case "sed": return 1.2;
      case "light": return 1.375;
      case "mod": return 1.55;
      case "very": return 1.725;
      case "extra": return 1.9;
    }
  }, [activity]);

  const tdee = useMemo(() => (bmr ? Math.round(bmr * activityFactor) : null), [bmr, activityFactor]);

  const handleActivityChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setActivity(e.target.value as Activity);

  return (
    <div className="rounded-xl border bg-white p-6">
      <h3 className="mb-3 text-lg font-semibold">BMR &amp; TDEE Calculator</h3>
      <p className ="text-sm text-gray-600">
        <span className ="font-medium">BMR</span> is the calories your body needs at rest (baseline).
        <span className ="font-medium">TDEE</span> = BMR x activity factor - estimates daily calories to maintain weight.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="block">
          <span className="text-sm text-gray-700">Age (years)</span>
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={age}
            onChange={(e) => setAge(parseNumberInput(e))}
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Height (cm)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={heightCm}
            onChange={(e) => setHeightCm(parseNumberInput(e))}
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Weight (kg)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={weightKg}
            onChange={(e) => setWeightKg(parseNumberInput(e))}
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Sex</span>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={sex}
            onChange={(e) => setSex(e.target.value as Sex)}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm text-gray-700">Activity Level (for TDEE)</span>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={activity}
            onChange={handleActivityChange}
          >
            <option value="sed">Sedentary (little/no exercise)</option>
            <option value="light">Light (1–3 days/wk)</option>
            <option value="mod">Moderate (3–5 days/wk)</option>
            <option value="very">Very active (6–7 days/wk)</option>
            <option value="extra">Extra active (hard training)</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-3">
          <div className="text-sm text-gray-500">BMR</div>
          <div className="text-2xl font-bold">{bmr ?? "—"}</div>
          <div className="text-sm text-gray-600">{bmr ? "kcal/day" : ""}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-sm text-gray-500">TDEE (estimate)</div>
          <div className="text-2xl font-bold">{tdee ?? "—"}</div>
          <div className="text-sm text-gray-600">{tdee ? "kcal/day" : ""}</div>
        </div>
      </div>
    </div>
  );
}

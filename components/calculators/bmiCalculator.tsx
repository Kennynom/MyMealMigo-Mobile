"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  initialHeightCm?: number | null;
  initialWeightKg?: number | null;
};

export default function BmiCalculator({ initialHeightCm = null, initialWeightKg = null }: Props) {
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");

  // Prefill once per field when an initial value exists and the input is still empty
  useEffect(() => {
    if (initialHeightCm != null && heightCm === "") setHeightCm(initialHeightCm);
  }, [initialHeightCm, heightCm]);

  useEffect(() => {
    if (initialWeightKg != null && weightKg === "") setWeightKg(initialWeightKg);
  }, [initialWeightKg, weightKg]);

  const bmi = useMemo(() => {
    if (heightCm === "" || weightKg === "" || heightCm <= 0) return null;
    const meters = Number(heightCm) / 100;
    const val = Number(weightKg) / (meters * meters);
    return Number.isFinite(val) ? Math.round(val * 10) / 10 : null; // 1 decimal
  }, [heightCm, weightKg]);

  const bmiCat = useMemo(() => {
    if (bmi == null) return "";
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  }, [bmi]);

  const parseNumberInput = (e: React.ChangeEvent<HTMLInputElement>) =>
    e.target.value === "" ? "" : Number.isNaN(e.target.valueAsNumber) ? "" : e.target.valueAsNumber;

  return (
    <div className="rounded-xl border bg-white p-6">
      <h3 className="mb-3 text-lg font-semibold">BMI Calculator</h3>
      <p className ="text-sm text-gray-600 mb-3">
        BMI estimates body fat from height and weight. It's a screening tool (not a diagnosis) and
        doesn't account for muscle mass. General ranges: 18.5-24.9 normal, 25-29.9 overweight, 30+ obese.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-3">
          <div className="text-sm text-gray-500">BMI</div>
          <div className="text-2xl font-bold">{bmi ?? "—"}</div>
        </div>
        <div className="rounded-lg border p-3 md:col-span-2">
          <div className="text-sm text-gray-500">Category</div>
          <div className="text-base">{bmi != null ? bmiCat : "—"}</div>
        </div>
      </div>
    </div>
  );
}

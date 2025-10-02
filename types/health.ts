export type RiskLevel = "low" | "moderate" | "high";


export type ParqPlus = {
q1_chestPain: boolean;
q2_dizziness: boolean;
q3_boneJointProblem: boolean;
q4_prescriptionMeds: boolean;
q5_heartCondition: boolean;
q6_bloodPressureIssue: boolean;
q7_otherReason: boolean;
notes?: string;
};


export type HealthProfile = {
version: number;
completed: boolean;
riskLevel: RiskLevel;
demographics?: {
birthYear?: number;
sexAtBirth?: "male" | "female" | "intersex" | "prefer_not_to_say";
heightCm?: number;
weightKg?: number;
country?: string;
};
parqPlus: ParqPlus;
conditions: { items: string[]; other?: string };
medications: Array<{
name: string;
purpose?: string;
dose?: string;
frequency?: string;
startedOn?: string; // yyyy-mm-dd
notes?: string;
}>;
allergies: { items: string[]; other?: string };
injuries?: { items: string[]; notes?: string };
constraints?: { hiImpact?: boolean; overheadLifts?: boolean; heat?: boolean; notes?: string };
doctorClearance?: { hasClearance: boolean; clearanceDate?: string; providerName?: string };
emergency?: { name?: string; relationship?: string; phone?: string; countryCode?: string };
consent: { tosAcceptedAt?: any; healthConsentAt?: any; shareWithCoach?: boolean };
fitness?: { goal?: string; experienceLevel?: string; preferredIntensity?: string; equipment?: string[] };
createdAt?: any;
updatedAt?: any;
};


export const defaultHealthProfile: HealthProfile = {
version: 1,
completed: false,
riskLevel: "low",
parqPlus: {
q1_chestPain: false,
q2_dizziness: false,
q3_boneJointProblem: false,
q4_prescriptionMeds: false,
q5_heartCondition: false,
q6_bloodPressureIssue: false,
q7_otherReason: false,
notes: "",
},
conditions: { items: [], other: "" },
medications: [],
allergies: { items: [], other: "" },
injuries: { items: [], notes: "" },
constraints: { hiImpact: true, overheadLifts: true, heat: true, notes: "" },
doctorClearance: { hasClearance: false },
consent: { shareWithCoach: false },
};
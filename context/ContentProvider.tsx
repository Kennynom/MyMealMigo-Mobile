"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot as onDocSnapshot,
  onSnapshot as onColSnapshot,
  DocumentData,
  Timestamp,
} from "firebase/firestore";

/** Types */
type HeroContent = {
  title1: string;
  title2: string;
  description: string;
  imageURL?: string;
  videoURL?: string;
  mediaType: "image" | "video";
  /** Optional: if you store the file path for later deletions */
  storagePath?: string;
};

type Feature = { title: string; description: string; icon: string };
type Step = { title: string; description: string; image?: string; storagePath?: string };
type Plan = {
  name: string;
  description: string;
  price: number;
  features: string[];
  buttonText: string;
  featured?: boolean;
};

type AppRating = {
  id: string;
  name: string;
  text: string;
  rating: number;
  submittedTime: string;
  photoURL?: string;
  isVisible?: boolean;
};

type TestimonialSettings = {
  sortField: "rating" | "submittedTime";
  sortDirection: "asc" | "desc";
  minRating: number;
  showOnlyWithText: boolean;
  maxTestimonials: number;
};

type LandingPageContent = {
  hero: HeroContent;
  features: Feature[];
  howItWorks: Step[];
  pricing: Plan[];
  testimonialSettings?: TestimonialSettings;
};

type ContentContextType = {
  hero: HeroContent;
  features: Feature[];
  howItWorks: Step[];
  pricing: Plan[];
  testimonials: AppRating[];
  isLoading: boolean;
};

/** Helpers */
const toArray = <T,>(v: unknown): T[] => {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object") {
    return Object.values(v as Record<string, unknown>) as T[];
  }
  return [];
};

const DEFAULT: LandingPageContent = {
  hero: { title1: "", title2: "", description: "", imageURL: "", videoURL: "", mediaType: "image" },
  features: [],
  howItWorks: [],
  pricing: [],
  testimonialSettings: {
    sortField: "rating",
    sortDirection: "desc",
    minRating: 0,
    showOnlyWithText: false,
    maxTestimonials: 0,
  },
};

const ContentContext = createContext<ContentContextType | null>(null);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<LandingPageContent>(DEFAULT);
  const [testimonials, setTestimonials] = useState<AppRating[]>([]);
  const [loadedDoc, setLoadedDoc] = useState(false);
  const [loadedRatings, setLoadedRatings] = useState(false);

  useEffect(() => {
    // Live listener to the CMS document
    const unsubDoc = onDocSnapshot(
      doc(db, "landingPageContent", "main"),
      (snap) => {
        if (!snap.exists()) {
          setContent(DEFAULT);
          setLoadedDoc(true);
          return;
        }

        const raw = snap.data() as Partial<LandingPageContent>;
        const normalized: LandingPageContent = {
          hero: {
            ...DEFAULT.hero,
            ...(raw.hero || {}),
            mediaType: (raw.hero?.mediaType as "image" | "video") || "image",
          },
          features: toArray<Feature>(raw.features),
          howItWorks: toArray<Step>(raw.howItWorks),
          pricing: toArray<Plan>(raw.pricing).map((p) => ({
            ...p,
            features: toArray<string>(p?.features),
          })),
          testimonialSettings: raw.testimonialSettings || DEFAULT.testimonialSettings,
        };

        setContent(normalized);
        setLoadedDoc(true);
      },
      () => {
        setContent(DEFAULT);
        setLoadedDoc(true);
      }
    );

    // Live listener to public testimonials
    const unsubCol = onColSnapshot(
      collection(db, "appRating"),
      (qs) => {
        const list: AppRating[] = qs.docs.map((d) => {
          const x = d.data() as DocumentData;

          let submittedISO = new Date().toISOString();
          const st = x?.submittedTime;
          if (st instanceof Timestamp) {
            submittedISO = st.toDate().toISOString();
          } else if (typeof st === "string") {
            submittedISO = st;
          }

          return {
            id: d.id,
            name: typeof x?.name === "string" ? x.name : "",
            text: typeof x?.text === "string" ? x.text : "",
            rating: typeof x?.rating === "number" ? x.rating : 0,
            submittedTime: submittedISO,
            photoURL: typeof x?.photoURL === "string" ? x.photoURL : "",
            isVisible: x?.isVisible !== false, // default true
          };
        });

        setTestimonials(list);
        setLoadedRatings(true);
      },
      () => {
        setTestimonials([]);
        setLoadedRatings(true);
      }
    );

    return () => {
      unsubDoc();
      unsubCol();
    };
  }, []);

  const isLoading = !loadedDoc || !loadedRatings;

  const value = useMemo<ContentContextType>(() => {
    const settings: TestimonialSettings =
      content.testimonialSettings ?? DEFAULT.testimonialSettings!;

    let shown = testimonials
      .filter((t) => t.isVisible !== false)
      .filter((t) => t.rating >= (settings.minRating ?? 0))
      .filter((t) => !settings.showOnlyWithText || (t.text && t.text.trim() !== ""));

    shown = shown.sort((a, b) => {
      if (settings.sortField === "rating") {
        return settings.sortDirection === "asc" ? a.rating - b.rating : b.rating - a.rating;
      }
      const aT = Number.isFinite(new Date(a.submittedTime).getTime())
        ? new Date(a.submittedTime).getTime()
        : 0;
      const bT = Number.isFinite(new Date(b.submittedTime).getTime())
        ? new Date(b.submittedTime).getTime()
        : 0;
      return settings.sortDirection === "asc" ? aT - bT : bT - aT;
    });

    if (settings.maxTestimonials && settings.maxTestimonials > 0) {
      shown = shown.slice(0, settings.maxTestimonials);
    }

    return {
      hero: content.hero,
      features: content.features,
      howItWorks: content.howItWorks,
      pricing: content.pricing,
      testimonials: shown,
      isLoading,
    };
  }, [content, testimonials, isLoading]);


  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within a ContentProvider");
  return ctx;
}

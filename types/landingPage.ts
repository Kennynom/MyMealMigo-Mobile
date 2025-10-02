import { ReactNode } from "react";

export interface HeroProps {
  title1: string;
  title2: string;
  description: string;
  videoURL?: string;
  imageURL?: string;
  mediaType: "image" | "video";
  children?: ReactNode;
}

export interface HeroContent {
  title1: string;
  title2: string;
  description: string;
  imageURL?: string;
  videoURL?: string;
  mediaType: "image" | "video";
  imageStoragePath?: string;
  videoStoragePath?: string;
}

export interface Feature {
  title: string;
  description: string;
  icon: string;
}

export interface Step {
  title: string;
  description: string;
  image: string;
  storagePath?: string;
}

export interface Plan {
  name: string;
  description: string;
  price: number;
  features: string[];
  buttonText: string;
  featured?: boolean;
}

export interface Testimonials {
  name: string;
  text: string;
  rating: number;
  submittedTime: Date | string;
  photoURL?: string;
}

export interface LandingPageContent {
  hero: HeroContent;
  features: Feature[];
  howItWorks: Step[];
  pricing: Plan[];
  appRatings: Testimonials[];
}
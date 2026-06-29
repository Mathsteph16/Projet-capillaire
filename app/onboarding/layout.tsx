import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Questionnaire · Scalpy",
  description: "Quelques questions pour personnaliser ton analyse capillaire.",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

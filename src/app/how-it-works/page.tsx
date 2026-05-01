import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { howItWorksContent } from "@/data/legalPages";

export const metadata: Metadata = {
  title: "Hoe werkt Poolr?",
  description: "Lees hoe je een poule aanmaakt, deelnemers uitnodigt en punten scoort.",
};

export default function HowItWorksPage() {
  return <LegalPage content={howItWorksContent} />;
}
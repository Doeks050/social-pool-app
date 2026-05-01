import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { termsContent } from "@/data/legalPages";

export const metadata: Metadata = {
  title: "Algemene voorwaarden",
  description: "Lees de algemene voorwaarden voor het gebruik van Poolr.",
};

export default function TermsPage() {
  return <LegalPage content={termsContent} />;
}
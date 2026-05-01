import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { disclaimerContent } from "@/data/legalPages";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Lees de disclaimer van Poolr.",
};

export default function DisclaimerPage() {
  return <LegalPage content={disclaimerContent} />;
}
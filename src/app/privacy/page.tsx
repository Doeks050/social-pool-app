import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { privacyContent } from "@/data/legalPages";

export const metadata: Metadata = {
  title: "Privacybeleid",
  description: "Lees hoe Poolr persoonsgegevens verwerkt en beschermt.",
};

export default function PrivacyPage() {
  return <LegalPage content={privacyContent} />;
}
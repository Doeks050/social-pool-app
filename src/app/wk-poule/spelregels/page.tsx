import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { worldCupRulesContent } from "@/data/legalPages";

export const metadata: Metadata = {
  title: "WK-poule spelregels en puntentelling",
  description:
    "Lees de spelregels, deadlines en puntentelling voor de WK-poule op Poolr.",
};

export default function WorldCupRulesPage() {
  return <LegalPage content={worldCupRulesContent} />;
}
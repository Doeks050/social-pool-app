import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import {
  worldCupRulesContent,
  type Language,
  type LegalPageContent,
  type LegalSection,
} from "@/data/legalPages";

export const metadata: Metadata = {
  title: "WK-poule spelregels en puntentelling",
  description:
    "Lees de spelregels, deadlines en puntentelling voor de WK-poule op Poolr.",
};

const rulesWithoutBonus: Record<Language, LegalPageContent> = {
  nl: removeBonusRules(worldCupRulesContent.nl, "nl"),
  en: removeBonusRules(worldCupRulesContent.en, "en"),
};

function removeBonusRules(
  content: LegalPageContent,
  language: Language
): LegalPageContent {
  const sections = content.sections
    .filter((section) => !isBonusSection(section))
    .map((section) => rewriteBonusReferences(section, language))
    .map((section, index) => renumberSection(section, index + 1));

  return {
    ...content,
    sections,
  };
}

function isBonusSection(section: LegalSection) {
  const title = section.title.toLowerCase();

  return title.includes("bonusvragen") || title.includes("bonus questions");
}

function rewriteBonusReferences(
  section: LegalSection,
  language: Language
): LegalSection {
  const normalizedTitle = section.title.toLowerCase();

  if (
    normalizedTitle.includes("doel van de wk-poule") ||
    normalizedTitle.includes("goal of the world cup pool")
  ) {
    return {
      ...section,
      body:
        language === "nl"
          ? "De WK-poule is een sociaal voorspellingenspel. Deelnemers voorspellen wedstrijduitslagen. De deelnemer met de meeste punten eindigt bovenaan de ranglijst."
          : "The World Cup pool is a social prediction game. Participants predict match scores. The participant with the most points ends at the top of the leaderboard.",
    };
  }

  if (
    normalizedTitle.includes("ranglijst") ||
    normalizedTitle.includes("leaderboard")
  ) {
    return {
      ...section,
      body:
        language === "nl"
          ? "De ranglijst wordt opgebouwd op basis van alle behaalde wedstrijdpunten. Zodra nieuwe resultaten worden ingevoerd of verwerkt, kan de ranglijst automatisch wijzigen."
          : "The leaderboard is built from all match points. When new results are entered or processed, the leaderboard may change automatically.",
    };
  }

  if (
    normalizedTitle.includes("gelijke stand") ||
    normalizedTitle.includes("tied standings")
  ) {
    return {
      ...section,
      body:
        language === "nl"
          ? [
              "Bij een gelijke totaalscore kan de poule dezelfde positie tonen voor meerdere deelnemers.",
              "Als een tiebreaker wordt gebruikt, kan de volgorde bijvoorbeeld worden bepaald door het aantal exacte uitslagen of het aantal juiste uitkomsten.",
              "De exacte tiebreaker kan later per poule worden uitgebreid.",
            ]
          : [
              "When participants have the same total score, the pool may show the same position for multiple participants.",
              "If a tiebreaker is used, the order may be based on the number of exact scores or correct outcomes.",
              "The exact tiebreaker may be expanded per pool later.",
            ],
    };
  }

  return section;
}

function renumberSection(section: LegalSection, number: number): LegalSection {
  return {
    ...section,
    title: section.title.replace(/^\d+\./, `${number}.`),
  };
}

export default function WorldCupRulesPage() {
  return <LegalPage content={rulesWithoutBonus} />;
}

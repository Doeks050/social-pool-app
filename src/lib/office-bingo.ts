import type { Language } from "@/lib/i18n";
import {
  getOfficeBingoTemplateLabels,
  type OfficeBingoTemplateKey,
} from "@/lib/office-bingo-templates";

export type OfficeBingoPlan = "free" | "starter" | "plus" | "pro";
export type { OfficeBingoTemplateKey };
export type OfficeBingoWinType = "line" | "full_card";

export type LocalizedText = Record<Language, string>;

export type OfficeBingoPlanLimits = {
  label: LocalizedText;
  priceLabel: LocalizedText;
  description: LocalizedText;
  maxMembers: number;
  maxRounds: number;
  allowedGridSizes: number[];
  activeDays: number;
  canEditItems: boolean;
  canAddCustomItems: boolean;
  hasQrCode: boolean;
  hasLeaderboard: boolean;
  hasCustomColor: boolean;
};

export const OFFICE_BINGO_PLAN_LIMITS: Record<
  OfficeBingoPlan,
  OfficeBingoPlanLimits
> = {
  free: {
    label: {
      en: "Free",
      nl: "Gratis",
    },
    priceLabel: {
      en: "€0",
      nl: "€0",
    },
    description: {
      en: "Try Office Bingo with a small group.",
      nl: "Probeer Office Bingo met een kleine groep.",
    },
    maxMembers: 6,
    maxRounds: 1,
    allowedGridSizes: [3],
    activeDays: 3,
    canEditItems: false,
    canAddCustomItems: false,
    hasQrCode: false,
    hasLeaderboard: false,
    hasCustomColor: false,
  },
  starter: {
    label: {
      en: "Starter",
      nl: "Starter",
    },
    priceLabel: {
      en: "€1.99",
      nl: "€1,99",
    },
    description: {
      en: "For a small team with editable rules and multiple rounds.",
      nl: "Voor een klein team met bewerkbare regels en meerdere rondes.",
    },
    maxMembers: 10,
    maxRounds: 3,
    allowedGridSizes: [3, 4],
    activeDays: 14,
    canEditItems: true,
    canAddCustomItems: true,
    hasQrCode: false,
    hasLeaderboard: true,
    hasCustomColor: false,
  },
  plus: {
    label: {
      en: "Plus",
      nl: "Plus",
    },
    priceLabel: {
      en: "€4.99",
      nl: "€4,99",
    },
    description: {
      en: "For a full office game with larger cards and more players.",
      nl: "Voor een volledige office game met grotere kaarten en meer spelers.",
    },
    maxMembers: 20,
    maxRounds: 5,
    allowedGridSizes: [3, 4, 5],
    activeDays: 30,
    canEditItems: true,
    canAddCustomItems: true,
    hasQrCode: true,
    hasLeaderboard: true,
    hasCustomColor: true,
  },
  pro: {
    label: {
      en: "Pro",
      nl: "Pro",
    },
    priceLabel: {
      en: "Coming later",
      nl: "Komt later",
    },
    description: {
      en: "For larger company events, branding and exports.",
      nl: "Voor grotere bedrijfsevents, branding en exports.",
    },
    maxMembers: 50,
    maxRounds: 10,
    allowedGridSizes: [3, 4, 5],
    activeDays: 90,
    canEditItems: true,
    canAddCustomItems: true,
    hasQrCode: true,
    hasLeaderboard: true,
    hasCustomColor: true,
  },
};

export function getOfficeBingoPlanLimits(plan: OfficeBingoPlan) {
  return OFFICE_BINGO_PLAN_LIMITS[plan];
}

export function getLocalizedText(text: LocalizedText, language: Language) {
  return text[language] ?? text.en;
}

export function getDefaultTargetName(language: Language) {
  return language === "nl" ? "de collega" : "the colleague";
}

export function renderOfficeBingoTemplateLabel(
  label: LocalizedText,
  language: Language,
  targetName: string
) {
  const safeName = targetName.trim() || getDefaultTargetName(language);

  return getLocalizedText(label, language).replaceAll("{name}", safeName);
}

export function getFreeOfficeBingoLabels(
  language: Language,
  targetName: string
) {
  return getOfficeBingoTemplateLabels({
    templateKey: "general_office",
    language,
    targetName,
  });
}

export function isGridSizeAllowedForPlan(
  plan: OfficeBingoPlan,
  gridSize: number
) {
  return OFFICE_BINGO_PLAN_LIMITS[plan].allowedGridSizes.includes(gridSize);
}

export function getOfficeBingoExpiryDate(
  plan: OfficeBingoPlan,
  from = new Date()
) {
  const limits = getOfficeBingoPlanLimits(plan);
  const expiresAt = new Date(from);

  expiresAt.setDate(expiresAt.getDate() + limits.activeDays);

  return expiresAt;
}
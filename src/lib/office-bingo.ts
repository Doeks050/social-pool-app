import type { Language } from "@/lib/i18n";

export type OfficeBingoPlan = "free" | "starter" | "plus" | "pro";
export type OfficeBingoTemplateKey = "colleague_free";
export type OfficeBingoWinType = "line" | "full_card";

export type LocalizedText = Record<Language, string>;

export type OfficeBingoTemplateItem = {
  key: string;
  label: LocalizedText;
};

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

export const OFFICE_BINGO_FREE_TEMPLATE_ITEMS: OfficeBingoTemplateItem[] = [
  {
    key: "arrives_late",
    label: {
      nl: "{name} komt te laat binnen",
      en: "{name} arrives late",
    },
  },
  {
    key: "overslept",
    label: {
      nl: "{name} heeft zich verslapen",
      en: "{name} overslept",
    },
  },
  {
    key: "gets_coffee",
    label: {
      nl: "{name} is koffie halen",
      en: "{name} gets coffee",
    },
  },
  {
    key: "returns_with_coffee",
    label: {
      nl: "{name} komt terug met koffie",
      en: "{name} returns with coffee",
    },
  },
  {
    key: "looks_for_mug",
    label: {
      nl: "{name} zoekt zijn/haar mok",
      en: "{name} looks for their mug",
    },
  },
  {
    key: "asks_for_coffee",
    label: {
      nl: "{name} vraagt of er nog koffie is",
      en: "{name} asks if there is coffee left",
    },
  },
  {
    key: "opens_snack",
    label: {
      nl: "{name} opent een snack",
      en: "{name} opens a snack",
    },
  },
  {
    key: "forgets_lunch",
    label: {
      nl: "{name} vergeet zijn/haar lunch",
      en: "{name} forgets their lunch",
    },
  },
  {
    key: "gets_lunch",
    label: {
      nl: "{name} gaat lunch halen",
      en: "{name} goes to get lunch",
    },
  },
  {
    key: "talks_weekend",
    label: {
      nl: "{name} begint over het weekend",
      en: "{name} starts talking about the weekend",
    },
  },
  {
    key: "talks_vacation",
    label: {
      nl: "{name} begint over vakantie",
      en: "{name} starts talking about vacation",
    },
  },
  {
    key: "talks_weather",
    label: {
      nl: "{name} praat over het weer",
      en: "{name} talks about the weather",
    },
  },
  {
    key: "talks_lunch",
    label: {
      nl: "{name} praat over de lunch",
      en: "{name} talks about lunch",
    },
  },
  {
    key: "bad_joke",
    label: {
      nl: "{name} maakt een flauwe grap",
      en: "{name} makes a bad joke",
    },
  },
  {
    key: "laughs_own_joke",
    label: {
      nl: "{name} lacht om eigen grap",
      en: "{name} laughs at their own joke",
    },
  },
  {
    key: "looks_for_pen",
    label: {
      nl: "{name} zoekt een pen",
      en: "{name} looks for a pen",
    },
  },
  {
    key: "looks_for_charger",
    label: {
      nl: "{name} zoekt een oplader",
      en: "{name} looks for a charger",
    },
  },
  {
    key: "lost_stuff",
    label: {
      nl: "{name} is zijn/haar spullen kwijt",
      en: "{name} loses their things",
    },
  },
  {
    key: "forgets_to_take_something",
    label: {
      nl: "{name} vergeet iets mee te nemen",
      en: "{name} forgets to take something",
    },
  },
  {
    key: "checks_clock",
    label: {
      nl: "{name} kijkt op de klok",
      en: "{name} checks the clock",
    },
  },
  {
    key: "counts_to_lunch",
    label: {
      nl: "{name} telt af tot lunch",
      en: "{name} counts down to lunch",
    },
  },
  {
    key: "counts_to_weekend",
    label: {
      nl: "{name} telt af tot weekend",
      en: "{name} counts down to the weekend",
    },
  },
  {
    key: "not_awake",
    label: {
      nl: "{name} lijkt nog niet helemaal wakker",
      en: "{name} does not look fully awake yet",
    },
  },
  {
    key: "needs_weekend",
    label: {
      nl: "{name} heeft duidelijk weekend nodig",
      en: "{name} clearly needs the weekend",
    },
  },
  {
    key: "pretends_it_was_planned",
    label: {
      nl: "{name} doet alsof dit de bedoeling was",
      en: "{name} pretends this was the plan",
    },
  },
];

export function getOfficeBingoPlanLimits(plan: OfficeBingoPlan) {
  return OFFICE_BINGO_PLAN_LIMITS[plan];
}

export function getLocalizedText(text: LocalizedText, language: Language) {
  return text[language] ?? text.en;
}

export function renderOfficeBingoTemplateLabel(
  label: LocalizedText,
  language: Language,
  targetName: string
) {
  const safeName = targetName.trim() || getDefaultTargetName(language);

  return getLocalizedText(label, language).replaceAll("{name}", safeName);
}

export function getDefaultTargetName(language: Language) {
  return language === "nl" ? "de collega" : "the colleague";
}

export function getFreeOfficeBingoLabels(
  language: Language,
  targetName: string
) {
  return OFFICE_BINGO_FREE_TEMPLATE_ITEMS.map((item) =>
    renderOfficeBingoTemplateLabel(item.label, language, targetName)
  );
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
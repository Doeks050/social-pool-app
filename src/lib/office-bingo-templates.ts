import type { Language } from "@/lib/i18n";

export type OfficeBingoTemplateKey =
  | "general_office"
  | "one_colleague"
  | "workday_chaos"
  | "custom";

export type OfficeBingoTemplateCategory = "free" | "paid" | "custom";

export type LocalizedText = Record<Language, string>;

export type OfficeBingoTemplateItem = {
  key: string;
  label: LocalizedText;
};

export type OfficeBingoTemplate = {
  key: OfficeBingoTemplateKey;
  category: OfficeBingoTemplateCategory;
  name: LocalizedText;
  description: LocalizedText;
  usesTargetName: boolean;
  items: OfficeBingoTemplateItem[];
};

export const OFFICE_BINGO_TEMPLATES: Record<
  OfficeBingoTemplateKey,
  OfficeBingoTemplate
> = {
  general_office: {
    key: "general_office",
    category: "free",
    usesTargetName: false,
    name: {
      en: "General Office Bingo",
      nl: "Algemene Office Bingo",
    },
    description: {
      en: "A safe and general office bingo for quick games.",
      nl: "Een veilige en algemene office bingo voor snelle rondes.",
    },
    items: [
      {
        key: "someone_arrives_late",
        label: {
          en: "Someone arrives late",
          nl: "Iemand komt te laat binnen",
        },
      },
      {
        key: "someone_gets_coffee",
        label: {
          en: "Someone gets coffee",
          nl: "Iemand haalt koffie",
        },
      },
      {
        key: "someone_returns_with_drink",
        label: {
          en: "Someone returns with a drink",
          nl: "Iemand komt terug met drinken",
        },
      },
      {
        key: "someone_forgets_something",
        label: {
          en: "Someone forgets something",
          nl: "Iemand vergeet iets",
        },
      },
      {
        key: "someone_loses_something",
        label: {
          en: "Someone loses something",
          nl: "Iemand is iets kwijt",
        },
      },
      {
        key: "someone_looks_for_something",
        label: {
          en: "Someone looks for something",
          nl: "Iemand zoekt iets",
        },
      },
      {
        key: "someone_makes_bad_joke",
        label: {
          en: "Someone makes a bad joke",
          nl: "Iemand maakt een flauwe grap",
        },
      },
      {
        key: "someone_laughs_own_joke",
        label: {
          en: "Someone laughs at their own joke",
          nl: "Iemand lacht om eigen grap",
        },
      },
      {
        key: "someone_talks_weekend",
        label: {
          en: "Someone talks about the weekend",
          nl: "Iemand praat over het weekend",
        },
      },
      {
        key: "someone_talks_weather",
        label: {
          en: "Someone talks about the weather",
          nl: "Iemand praat over het weer",
        },
      },
      {
        key: "someone_talks_lunch",
        label: {
          en: "Someone talks about lunch",
          nl: "Iemand praat over lunch",
        },
      },
      {
        key: "someone_says_busy_today",
        label: {
          en: "Someone says it is busy today",
          nl: "Iemand zegt dat het druk is vandaag",
        },
      },
      {
        key: "someone_says_will_handle_it",
        label: {
          en: "Someone says they will handle it",
          nl: "Iemand zegt dat hij/zij het oppakt",
        },
      },
      {
        key: "someone_says_comes_good",
        label: {
          en: "Someone says “it will be fine”",
          nl: "Iemand zegt “komt goed”",
        },
      },
      {
        key: "someone_checks_clock",
        label: {
          en: "Someone checks the time",
          nl: "Iemand kijkt op de klok",
        },
      },
      {
        key: "someone_walks_around",
        label: {
          en: "Someone walks around for no clear reason",
          nl: "Iemand loopt rond zonder duidelijke reden",
        },
      },
      {
        key: "someone_asks_practical_question",
        label: {
          en: "Someone asks a practical question",
          nl: "Iemand stelt een praktische vraag",
        },
      },
      {
        key: "someone_mentions_almost_weekend",
        label: {
          en: "Someone says it is almost weekend",
          nl: "Iemand zegt dat het bijna weekend is",
        },
      },
    ],
  },

  one_colleague: {
    key: "one_colleague",
    category: "paid",
    usesTargetName: true,
    name: {
      en: "One Colleague Bingo",
      nl: "Eén Collega Bingo",
    },
    description: {
      en: "A personal but safe bingo about one chosen colleague.",
      nl: "Een persoonlijke maar veilige bingo over één gekozen collega.",
    },
    items: [
      {
        key: "name_arrives_late",
        label: {
          en: "{name} arrives late",
          nl: "{name} komt te laat binnen",
        },
      },
      {
        key: "name_gets_coffee",
        label: {
          en: "{name} gets coffee",
          nl: "{name} haalt koffie",
        },
      },
      {
        key: "name_returns_with_drink",
        label: {
          en: "{name} returns with a drink",
          nl: "{name} komt terug met drinken",
        },
      },
      {
        key: "name_forgets_something",
        label: {
          en: "{name} forgets something",
          nl: "{name} vergeet iets",
        },
      },
      {
        key: "name_looks_for_something",
        label: {
          en: "{name} looks for something",
          nl: "{name} zoekt iets",
        },
      },
      {
        key: "name_makes_bad_joke",
        label: {
          en: "{name} makes a bad joke",
          nl: "{name} maakt een flauwe grap",
        },
      },
      {
        key: "name_laughs_own_joke",
        label: {
          en: "{name} laughs at their own joke",
          nl: "{name} lacht om eigen grap",
        },
      },
      {
        key: "name_talks_food",
        label: {
          en: "{name} talks about food",
          nl: "{name} praat over eten",
        },
      },
      {
        key: "name_talks_weekend",
        label: {
          en: "{name} talks about the weekend",
          nl: "{name} praat over het weekend",
        },
      },
      {
        key: "name_says_comes_good",
        label: {
          en: "{name} says “it will be fine”",
          nl: "{name} zegt “komt goed”",
        },
      },
      {
        key: "name_checks_clock",
        label: {
          en: "{name} checks the time",
          nl: "{name} kijkt op de klok",
        },
      },
      {
        key: "name_asks_practical_question",
        label: {
          en: "{name} asks a practical question",
          nl: "{name} stelt een praktische vraag",
        },
      },
      {
        key: "name_walks_away",
        label: {
          en: "{name} walks away for a moment",
          nl: "{name} loopt even weg",
        },
      },
      {
        key: "name_is_quiet",
        label: {
          en: "{name} is unusually quiet",
          nl: "{name} is opvallend stil",
        },
      },
      {
        key: "name_is_busy",
        label: {
          en: "{name} is suddenly very busy",
          nl: "{name} is ineens heel druk",
        },
      },
      {
        key: "name_makes_known_gesture",
        label: {
          en: "{name} makes a familiar gesture",
          nl: "{name} maakt een bekend gebaar",
        },
      },
      {
        key: "name_says_tired",
        label: {
          en: "{name} says they are tired",
          nl: "{name} zegt dat hij/zij moe is",
        },
      },
      {
        key: "name_pretends_planned",
        label: {
          en: "{name} pretends this was planned",
          nl: "{name} doet alsof dit de bedoeling was",
        },
      },
    ],
  },

  workday_chaos: {
    key: "workday_chaos",
    category: "paid",
    usesTargetName: false,
    name: {
      en: "Workday Chaos Bingo",
      nl: "Werkdag Chaos Bingo",
    },
    description: {
      en: "A general bingo for funny everyday office chaos.",
      nl: "Een algemene bingo voor herkenbare kantoorchaos.",
    },
    items: [
      {
        key: "something_is_missing",
        label: {
          en: "Something is missing",
          nl: "Er is iets kwijt",
        },
      },
      {
        key: "something_is_forgotten",
        label: {
          en: "Something gets forgotten",
          nl: "Er wordt iets vergeten",
        },
      },
      {
        key: "someone_asks_where_something_is",
        label: {
          en: "Someone asks where something is",
          nl: "Iemand vraagt waar iets ligt",
        },
      },
      {
        key: "coffee_run",
        label: {
          en: "There is a coffee run",
          nl: "Er wordt koffie gehaald",
        },
      },
      {
        key: "bad_joke",
        label: {
          en: "Someone makes a bad joke",
          nl: "Iemand maakt een flauwe grap",
        },
      },
      {
        key: "busy_today",
        label: {
          en: "Someone says it is busy today",
          nl: "Iemand zegt dat het druk is vandaag",
        },
      },
      {
        key: "comes_good",
        label: {
          en: "Someone says “it will be fine”",
          nl: "Iemand zegt “komt goed”",
        },
      },
      {
        key: "food_appears",
        label: {
          en: "Food suddenly appears",
          nl: "Er verschijnt ineens eten",
        },
      },
      {
        key: "someone_asks_help",
        label: {
          en: "Someone asks for help",
          nl: "Iemand vraagt om hulp",
        },
      },
      {
        key: "something_gets_cleaned",
        label: {
          en: "Something gets cleaned up",
          nl: "Er wordt iets opgeruimd",
        },
      },
      {
        key: "walking_back_and_forth",
        label: {
          en: "Someone walks back and forth",
          nl: "Iemand loopt heen en weer",
        },
      },
      {
        key: "i_will_fix_it",
        label: {
          en: "Someone says they will fix it",
          nl: "Iemand zegt “ik regel het”",
        },
      },
      {
        key: "almost_weekend",
        label: {
          en: "Someone mentions it is almost weekend",
          nl: "Iemand noemt dat het bijna weekend is",
        },
      },
      {
        key: "audible_sigh",
        label: {
          en: "Someone sighs noticeably",
          nl: "Iemand zucht hoorbaar",
        },
      },
      {
        key: "just_in_time",
        label: {
          en: "Someone arrives just in time",
          nl: "Iemand komt net op tijd binnen",
        },
      },
      {
        key: "joke_no_one_gets",
        label: {
          en: "Someone makes a joke no one understands",
          nl: "Iemand maakt een grap die niemand snapt",
        },
      },
      {
        key: "someone_checks_time",
        label: {
          en: "Someone checks the time",
          nl: "Iemand kijkt op de klok",
        },
      },
      {
        key: "someone_needs_break",
        label: {
          en: "Someone says they need a break",
          nl: "Iemand zegt dat hij/zij pauze nodig heeft",
        },
      },
    ],
  },

  custom: {
    key: "custom",
    category: "custom",
    usesTargetName: false,
    name: {
      en: "Custom Office Bingo",
      nl: "Custom Office Bingo",
    },
    description: {
      en: "Build your own Office Bingo with custom moments.",
      nl: "Maak je eigen Office Bingo met eigen momenten.",
    },
    items: [],
  },
};

export function getOfficeBingoTemplate(key: OfficeBingoTemplateKey) {
  return OFFICE_BINGO_TEMPLATES[key];
}

export function getLocalizedTemplateText(
  text: LocalizedText,
  language: Language
) {
  return text[language] ?? text.en;
}

export function getDefaultOfficeBingoTargetName(language: Language) {
  return language === "nl" ? "de collega" : "the colleague";
}

export function renderOfficeBingoTemplateItemLabel(input: {
  label: LocalizedText;
  language: Language;
  targetName?: string | null;
}) {
  const safeName =
    input.targetName?.trim() || getDefaultOfficeBingoTargetName(input.language);

  return getLocalizedTemplateText(input.label, input.language).replaceAll(
    "{name}",
    safeName
  );
}

export function getOfficeBingoTemplateLabels(input: {
  templateKey: OfficeBingoTemplateKey;
  language: Language;
  targetName?: string | null;
}) {
  const template = getOfficeBingoTemplate(input.templateKey);

  return template.items.map((item) =>
    renderOfficeBingoTemplateItemLabel({
      label: item.label,
      language: input.language,
      targetName: input.targetName,
    })
  );
}
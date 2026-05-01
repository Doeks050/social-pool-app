export type Language = "nl" | "en";

export type LegalSection = {
  title: string;
  body: string | string[];
};

export type LegalPageContent = {
  backLabel: string;
  updatedLabel: string;
  updatedAt: string;
  label: string;
  title: string;
  intro: string;
  sections: LegalSection[];
};

const updatedAt = {
  nl: "1 mei 2026",
  en: "May 1, 2026",
};

export const privacyContent: Record<Language, LegalPageContent> = {
  nl: {
    backLabel: "Terug naar home",
    updatedLabel: "Laatst bijgewerkt",
    updatedAt: updatedAt.nl,
    label: "Poolr",
    title: "Privacybeleid",
    intro:
      "In dit privacybeleid leggen we uit welke persoonsgegevens Poolr verwerkt, waarom we dat doen en welke rechten gebruikers hebben.",
    sections: [
      {
        title: "1. Wie zijn wij?",
        body: "Poolr is een online platform waarmee gebruikers privé-poules en sociale spellen kunnen aanmaken, beheren en spelen. Denk aan WK-poules, Office Bingo, F1-poules en vergelijkbare sociale spelvormen.",
      },
      {
        title: "2. Welke gegevens verwerken wij?",
        body: [
          "Wij kunnen gegevens verwerken zoals e-mailadres, accountgegevens, displaynaam, pooldeelname, voorspellingen, scores, ranglijsten, uitnodigingslinks, instellingen en berichten die via contact of support worden verstuurd.",
          "Daarnaast kunnen technische gegevens worden verwerkt, zoals IP-adres, apparaatinformatie, browsergegevens, sessiegegevens en beveiligingslogs.",
        ],
      },
      {
        title: "3. Waarom verwerken wij gegevens?",
        body: "Wij verwerken gegevens om accounts aan te maken, gebruikers te laten inloggen, poules te beheren, voorspellingen op te slaan, scores te berekenen, ranglijsten te tonen, misbruik te voorkomen, support te leveren en de app veilig en stabiel te laten werken.",
      },
      {
        title: "4. Rechtsgrond",
        body: "Wij verwerken gegevens op basis van uitvoering van de overeenkomst, gerechtvaardigd belang, wettelijke verplichtingen en, waar nodig, toestemming. Voor functionele onderdelen zoals login, poolbeheer en puntentelling is verwerking noodzakelijk om de dienst te kunnen leveren.",
      },
      {
        title: "5. Zichtbaarheid binnen poules",
        body: "Binnen een poule kunnen andere deelnemers bepaalde gegevens zien, zoals je displaynaam, voorspellingen, behaalde punten, positie op de ranglijst en spelacties. Dit is nodig om de pool goed te laten functioneren.",
      },
      {
        title: "6. Delen van gegevens",
        body: "Wij verkopen geen persoonsgegevens. Gegevens kunnen wel worden verwerkt door technische dienstverleners die nodig zijn voor hosting, database, authenticatie, e-mail, betalingen, beveiliging en analyse. Deze partijen mogen gegevens alleen verwerken voor het leveren van hun dienst aan Poolr.",
      },
      {
        title: "7. Bewaartermijn",
        body: "Wij bewaren persoonsgegevens niet langer dan nodig is voor het doel waarvoor ze zijn verzameld. Accountgegevens, pouledata en voorspellingen kunnen worden bewaard zolang een account of poule actief is. Gebruikers kunnen verzoeken om verwijdering van hun account of gegevens.",
      },
      {
        title: "8. Beveiliging",
        body: "Wij nemen passende technische en organisatorische maatregelen om persoonsgegevens te beschermen tegen verlies, misbruik en onbevoegde toegang. Geen enkel online systeem kan echter absolute veiligheid garanderen.",
      },
      {
        title: "9. Cookies en lokale opslag",
        body: "Poolr gebruikt functionele cookies en lokale opslag die nodig zijn voor login, sessiebeheer, taalkeuze en het goed functioneren van de app. Als wij later analytische of marketingcookies gebruiken, wordt dit beleid bijgewerkt en vragen wij waar nodig toestemming.",
      },
      {
        title: "10. Rechten van gebruikers",
        body: "Gebruikers hebben het recht om inzage, correctie, verwijdering, beperking, overdraagbaarheid of bezwaar te vragen met betrekking tot hun persoonsgegevens. Ook kan eerder gegeven toestemming worden ingetrokken wanneer verwerking op toestemming is gebaseerd.",
      },
      {
        title: "11. Minderjarigen",
        body: "Poolr is bedoeld voor gebruikers die zelfstandig online diensten mogen gebruiken volgens de toepasselijke wetgeving. Minderjarigen mogen de app alleen gebruiken met toestemming van een ouder of wettelijke vertegenwoordiger.",
      },
      {
        title: "12. Contact",
        body: "Voor vragen over privacy of het uitoefenen van rechten kun je contact opnemen via playpoolr.app@gmail.com.",
      },
    ],
  },
  en: {
    backLabel: "Back to home",
    updatedLabel: "Last updated",
    updatedAt: updatedAt.en,
    label: "Poolr",
    title: "Privacy Policy",
    intro:
      "This Privacy Policy explains which personal data Poolr processes, why we process it and which rights users have.",
    sections: [
      {
        title: "1. Who are we?",
        body: "Poolr is an online platform that allows users to create, manage and play private pools and social games, including World Cup pools, Office Bingo, F1 pools and similar social game formats.",
      },
      {
        title: "2. Which data do we process?",
        body: [
          "We may process data such as email address, account details, display name, pool participation, predictions, scores, leaderboards, invite links, settings and messages sent through contact or support.",
          "We may also process technical data such as IP address, device information, browser information, session data and security logs.",
        ],
      },
      {
        title: "3. Why do we process data?",
        body: "We process data to create accounts, allow users to log in, manage pools, store predictions, calculate scores, display leaderboards, prevent misuse, provide support and keep the app secure and stable.",
      },
      {
        title: "4. Legal basis",
        body: "We process data based on performance of a contract, legitimate interest, legal obligations and, where required, consent. Processing is necessary for functional parts such as login, pool management and score calculation.",
      },
      {
        title: "5. Visibility within pools",
        body: "Within a pool, other participants may see certain data such as your display name, predictions, points, leaderboard position and game actions. This is necessary for the pool to function properly.",
      },
      {
        title: "6. Sharing data",
        body: "We do not sell personal data. Data may be processed by technical service providers needed for hosting, database, authentication, email, payments, security and analytics. These providers may only process data to provide their service to Poolr.",
      },
      {
        title: "7. Retention",
        body: "We do not keep personal data longer than necessary for the purpose for which it was collected. Account data, pool data and predictions may be kept while an account or pool is active. Users may request deletion of their account or data.",
      },
      {
        title: "8. Security",
        body: "We take appropriate technical and organizational measures to protect personal data against loss, misuse and unauthorized access. However, no online system can guarantee absolute security.",
      },
      {
        title: "9. Cookies and local storage",
        body: "Poolr uses functional cookies and local storage required for login, session management, language preference and proper operation of the app. If we later use analytics or marketing cookies, this policy will be updated and consent will be requested where required.",
      },
      {
        title: "10. User rights",
        body: "Users have the right to request access, correction, deletion, restriction, portability or objection regarding their personal data. Consent may also be withdrawn where processing is based on consent.",
      },
      {
        title: "11. Minors",
        body: "Poolr is intended for users who are allowed to use online services independently under applicable law. Minors may only use the app with permission from a parent or legal guardian.",
      },
      {
        title: "12. Contact",
        body: "For privacy questions or requests, contact us at playpoolr.app@gmail.com.",
      },
    ],
  },
};

export const termsContent: Record<Language, LegalPageContent> = {
  nl: {
    backLabel: "Terug naar home",
    updatedLabel: "Laatst bijgewerkt",
    updatedAt: updatedAt.nl,
    label: "Poolr",
    title: "Algemene voorwaarden",
    intro:
      "Deze voorwaarden gelden voor het gebruik van Poolr. Door een account aan te maken of de app te gebruiken, ga je akkoord met deze voorwaarden.",
    sections: [
      {
        title: "1. Gebruik van Poolr",
        body: "Poolr is een platform voor sociale poules, voorspellingen, bingo-achtige spellen en ranglijsten. De app is bedoeld voor entertainment, sociale competitie en gebruik binnen privé- of groepsverband.",
      },
      {
        title: "2. Account",
        body: "Gebruikers zijn verantwoordelijk voor het juist invullen van hun gegevens en het veilig houden van hun account. Misbruik, fraude, spam, beledigend gedrag of pogingen om de app technisch te verstoren zijn niet toegestaan.",
      },
      {
        title: "3. Poules en deelnemers",
        body: "Een poolbeheerder is verantwoordelijk voor het aanmaken, beheren en uitnodigen van deelnemers binnen een poule. Poolr kan technische functies aanbieden, maar is niet verantwoordelijk voor afspraken die deelnemers onderling maken buiten het platform.",
      },
      {
        title: "4. Voorspellingen en deadlines",
        body: "Voorspellingen, picks of spelacties moeten vóór de aangegeven deadline worden ingevuld. Na sluiting kunnen voorspellingen niet meer worden aangepast, tenzij de app of een beheerfunctie dit expliciet toestaat.",
      },
      {
        title: "5. Punten en ranglijsten",
        body: "Poolr probeert scores en ranglijsten zo correct mogelijk te berekenen. Fouten in data, uitslagen, instellingen of puntentelling kunnen worden gecorrigeerd. Aan tijdelijke ranglijsten of foutieve scores kunnen geen rechten worden ontleend.",
      },
      {
        title: "6. Resultaten en correcties",
        body: "Officiële of handmatig ingevoerde resultaten kunnen worden aangepast wanneer er sprake is van foutieve invoer, technische problemen of correcties in de brondata. Hierdoor kunnen punten en ranglijsten achteraf wijzigen.",
      },
      {
        title: "7. Betaalde functies",
        body: "Poolr kan gratis en betaalde functies aanbieden. Betaalde functies geven toegang tot extra mogelijkheden, zoals grotere poules, meer beheeropties of extra speltypen. Prijzen en voorwaarden worden getoond vóór aankoop.",
      },
      {
        title: "8. Geen gokplatform",
        body: "Poolr is geen gokplatform, bookmaker of kansspelaanbieder. De app is bedoeld voor sociale voorspellingen en entertainment. Poolr faciliteert geen weddenschappen met geldinzet tussen gebruikers.",
      },
      {
        title: "9. Beschikbaarheid",
        body: "Wij doen ons best om Poolr stabiel en beschikbaar te houden, maar garanderen niet dat de app altijd foutloos, veilig of ononderbroken werkt. Onderhoud, storingen of externe diensten kunnen invloed hebben op beschikbaarheid.",
      },
      {
        title: "10. Intellectueel eigendom",
        body: "Alle eigen teksten, ontwerpen, software, logo’s en onderdelen van Poolr blijven eigendom van Poolr of de rechthebbenden. Gebruikers mogen de app niet kopiëren, namaken, reverse-engineeren of commercieel hergebruiken zonder toestemming.",
      },
      {
        title: "11. Beperking van aansprakelijkheid",
        body: "Poolr is niet aansprakelijk voor indirecte schade, gemiste scores, verloren data, misgelopen prijzen, onderlinge afspraken tussen deelnemers of schade door tijdelijk niet beschikbaar zijn van de app, voor zover wettelijk toegestaan.",
      },
      {
        title: "12. Wijzigingen",
        body: "Wij kunnen deze voorwaarden aanpassen wanneer de app, wetgeving of bedrijfsvoering verandert. Bij belangrijke wijzigingen proberen wij gebruikers op een passende manier te informeren.",
      },
      {
        title: "13. Contact",
        body: "Voor vragen over deze voorwaarden kun je contact opnemen via playpoolr.app@gmail.com.",
      },
    ],
  },
  en: {
    backLabel: "Back to home",
    updatedLabel: "Last updated",
    updatedAt: updatedAt.en,
    label: "Poolr",
    title: "Terms and Conditions",
    intro:
      "These terms apply to the use of Poolr. By creating an account or using the app, you agree to these terms.",
    sections: [
      {
        title: "1. Use of Poolr",
        body: "Poolr is a platform for social pools, predictions, bingo-style games and leaderboards. The app is intended for entertainment, social competition and use within private groups.",
      },
      {
        title: "2. Account",
        body: "Users are responsible for entering correct information and keeping their account secure. Misuse, fraud, spam, abusive behavior or attempts to disrupt the app are not allowed.",
      },
      {
        title: "3. Pools and participants",
        body: "A pool manager is responsible for creating, managing and inviting participants to a pool. Poolr may provide technical features, but is not responsible for agreements made between participants outside the platform.",
      },
      {
        title: "4. Predictions and deadlines",
        body: "Predictions, picks or game actions must be submitted before the stated deadline. After closing, predictions cannot be changed unless the app or a management feature explicitly allows it.",
      },
      {
        title: "5. Points and leaderboards",
        body: "Poolr aims to calculate scores and leaderboards as accurately as possible. Errors in data, results, settings or scoring may be corrected. No rights can be derived from temporary leaderboards or incorrect scores.",
      },
      {
        title: "6. Results and corrections",
        body: "Official or manually entered results may be changed in case of incorrect input, technical problems or corrections in source data. Points and leaderboards may change afterwards.",
      },
      {
        title: "7. Paid features",
        body: "Poolr may offer free and paid features. Paid features may provide access to additional options such as larger pools, more management options or extra game types. Prices and conditions are shown before purchase.",
      },
      {
        title: "8. No gambling platform",
        body: "Poolr is not a gambling platform, bookmaker or betting provider. The app is intended for social predictions and entertainment. Poolr does not facilitate wagers with money between users.",
      },
      {
        title: "9. Availability",
        body: "We do our best to keep Poolr stable and available, but we do not guarantee that the app will always be error-free, secure or uninterrupted. Maintenance, outages or external services may affect availability.",
      },
      {
        title: "10. Intellectual property",
        body: "All original texts, designs, software, logos and components of Poolr remain the property of Poolr or the relevant rights holders. Users may not copy, recreate, reverse-engineer or commercially reuse the app without permission.",
      },
      {
        title: "11. Limitation of liability",
        body: "Poolr is not liable for indirect damages, missed scores, lost data, missed prizes, agreements between participants or damage caused by temporary unavailability of the app, to the extent permitted by law.",
      },
      {
        title: "12. Changes",
        body: "We may update these terms when the app, legislation or business operations change. For important changes, we will try to inform users in an appropriate way.",
      },
      {
        title: "13. Contact",
        body: "For questions about these terms, contact us at playpoolr.app@gmail.com.",
      },
    ],
  },
};

export const disclaimerContent: Record<Language, LegalPageContent> = {
  nl: {
    backLabel: "Terug naar home",
    updatedLabel: "Laatst bijgewerkt",
    updatedAt: updatedAt.nl,
    label: "Poolr",
    title: "Disclaimer",
    intro:
      "Poolr is een onafhankelijk platform voor sociale poules en entertainment. Op deze pagina leggen we uit wat gebruikers wel en niet van de app mogen verwachten.",
    sections: [
      {
        title: "1. Onafhankelijk platform",
        body: "Poolr is een onafhankelijk platform en is niet verbonden aan, gesponsord door of officieel goedgekeurd door FIFA, UEFA, Formula 1, FIA, teams, coureurs, bonden, competities of andere rechthebbenden.",
      },
      {
        title: "2. Gebruik van namen",
        body: "Namen van competities, evenementen, landen, teams, wedstrijden, coureurs of andere sportgerelateerde termen kunnen worden gebruikt om het spel begrijpelijk te maken. Deze namen blijven eigendom van hun respectieve rechthebbenden.",
      },
      {
        title: "3. Geen gokplatform",
        body: "Poolr is geen gokplatform, kansspelaanbieder, bookmaker of weddenschapsdienst. De app is bedoeld voor sociale voorspellingen, spelplezier en entertainment. Poolr faciliteert geen geldinzet of weddenschappen tussen gebruikers.",
      },
      {
        title: "4. Geen garantie op foutloze data",
        body: "Wij proberen informatie, wedstrijden, uitslagen, scores en ranglijsten zo correct mogelijk weer te geven. Toch kunnen fouten, vertragingen of onvolledigheden voorkomen. Poolr mag gegevens en puntentellingen corrigeren wanneer dat nodig is.",
      },
      {
        title: "5. Handmatige invoer",
        body: "Sommige resultaten of instellingen kunnen handmatig door een beheerder worden ingevoerd. Poolr is niet verantwoordelijk voor fouten die ontstaan door verkeerde invoer, verkeerde instellingen of afspraken binnen een privé-poule.",
      },
      {
        title: "6. Entertainmentdoeleinden",
        body: "Alle voorspellingen, ranglijsten, scores, badges en spelresultaten binnen Poolr zijn bedoeld voor entertainment. Er kunnen geen rechten worden ontleend aan foutieve of tijdelijke standen.",
      },
      {
        title: "7. Externe links en diensten",
        body: "Poolr kan gebruikmaken van externe diensten voor hosting, authenticatie, betalingen, e-mail of data. Wij zijn niet verantwoordelijk voor de inhoud, beschikbaarheid of werking van externe websites of diensten.",
      },
      {
        title: "8. Contact",
        body: "Heb je vragen over deze disclaimer of zie je iets dat niet klopt? Neem dan contact op via playpoolr.app@gmail.com.",
      },
    ],
  },
  en: {
    backLabel: "Back to home",
    updatedLabel: "Last updated",
    updatedAt: updatedAt.en,
    label: "Poolr",
    title: "Disclaimer",
    intro:
      "Poolr is an independent platform for social pools and entertainment. This page explains what users can and cannot expect from the app.",
    sections: [
      {
        title: "1. Independent platform",
        body: "Poolr is an independent platform and is not affiliated with, sponsored by or officially approved by FIFA, UEFA, Formula 1, FIA, teams, drivers, associations, competitions or other rights holders.",
      },
      {
        title: "2. Use of names",
        body: "Names of competitions, events, countries, teams, matches, drivers or other sports-related terms may be used to make the game understandable. These names remain the property of their respective rights holders.",
      },
      {
        title: "3. No gambling platform",
        body: "Poolr is not a gambling platform, betting provider, bookmaker or wagering service. The app is intended for social predictions, fun and entertainment. Poolr does not facilitate money wagers between users.",
      },
      {
        title: "4. No guarantee of error-free data",
        body: "We try to display information, matches, results, scores and leaderboards as accurately as possible. However, errors, delays or incomplete data may occur. Poolr may correct data and point calculations when needed.",
      },
      {
        title: "5. Manual input",
        body: "Some results or settings may be entered manually by an administrator. Poolr is not responsible for errors caused by incorrect input, incorrect settings or agreements within a private pool.",
      },
      {
        title: "6. Entertainment purposes",
        body: "All predictions, leaderboards, scores, badges and game results within Poolr are intended for entertainment. No rights can be derived from incorrect or temporary standings.",
      },
      {
        title: "7. External links and services",
        body: "Poolr may use external services for hosting, authentication, payments, email or data. We are not responsible for the content, availability or operation of external websites or services.",
      },
      {
        title: "8. Contact",
        body: "Do you have questions about this disclaimer or see something that is incorrect? Contact us at playpoolr.app@gmail.com.",
      },
    ],
  },
};

export const howItWorksContent: Record<Language, LegalPageContent> = {
  nl: {
    backLabel: "Terug naar home",
    updatedLabel: "Laatst bijgewerkt",
    updatedAt: updatedAt.nl,
    label: "Uitleg",
    title: "Hoe werkt Poolr?",
    intro:
      "Poolr maakt het makkelijk om met vrienden, familie, collega’s of groepen een privé-poule te spelen. Maak een poule, nodig deelnemers uit, vul voorspellingen in en strijd om de hoogste plek op de ranglijst.",
    sections: [
      {
        title: "1. Maak een account aan",
        body: "Maak een account aan of log in met je bestaande account. Je account wordt gebruikt om je poules, voorspellingen, scores en instellingen op te slaan.",
      },
      {
        title: "2. Maak of join een poule",
        body: "Je kunt zelf een nieuwe poule aanmaken of deelnemen aan een bestaande poule via een uitnodigingslink. Een poule is privé: alleen mensen met toegang kunnen meedoen.",
      },
      {
        title: "3. Kies het type spel",
        body: "Poolr ondersteunt verschillende speltypes. De eerste focus ligt op WK-poules. Daarna kunnen ook andere speltypes beschikbaar komen, zoals Office Bingo en F1-poules.",
      },
      {
        title: "4. Vul je voorspellingen in",
        body: "Bij een voorspellingenspel vul je jouw picks of uitslagen in vóór de deadline. Zodra een wedstrijd, sessie of ronde sluit, kunnen voorspellingen meestal niet meer worden aangepast.",
      },
      {
        title: "5. Verdien punten",
        body: "Na officiële of handmatig ingevoerde resultaten berekent Poolr de punten. De exacte puntentelling kan per speltype of poule verschillen.",
      },
      {
        title: "6. Bekijk de ranglijst",
        body: "De ranglijst laat zien wie bovenaan staat. Scores kunnen veranderen wanneer nieuwe resultaten worden verwerkt of wanneer een beheerder een correctie uitvoert.",
      },
      {
        title: "7. Rol van de poolbeheerder",
        body: "De poolbeheerder kan deelnemers uitnodigen, instellingen beheren en waar nodig resultaten of correcties invoeren. Bij sommige speltypes heeft alleen een beheerder toegang tot bepaalde functies.",
      },
      {
        title: "8. Fair play",
        body: "Poolr is bedoeld voor sportieve en sociale competitie. Speel eerlijk, respecteer andere deelnemers en gebruik de app niet voor spam, misbruik of ongewenst gedrag.",
      },
    ],
  },
  en: {
    backLabel: "Back to home",
    updatedLabel: "Last updated",
    updatedAt: updatedAt.en,
    label: "Guide",
    title: "How does Poolr work?",
    intro:
      "Poolr makes it easy to play a private pool with friends, family, colleagues or groups. Create a pool, invite participants, enter predictions and compete for the top spot on the leaderboard.",
    sections: [
      {
        title: "1. Create an account",
        body: "Create an account or log in with your existing account. Your account is used to store your pools, predictions, scores and settings.",
      },
      {
        title: "2. Create or join a pool",
        body: "You can create a new pool yourself or join an existing pool through an invite link. A pool is private: only people with access can participate.",
      },
      {
        title: "3. Choose the game type",
        body: "Poolr supports different game types. The first focus is World Cup pools. Other game types such as Office Bingo and F1 pools may become available later.",
      },
      {
        title: "4. Enter your predictions",
        body: "In a prediction game, you enter your picks or scores before the deadline. Once a match, session or round closes, predictions usually cannot be changed.",
      },
      {
        title: "5. Earn points",
        body: "After official or manually entered results are processed, Poolr calculates the points. The exact scoring can differ per game type or pool.",
      },
      {
        title: "6. View the leaderboard",
        body: "The leaderboard shows who is on top. Scores can change when new results are processed or when an administrator makes a correction.",
      },
      {
        title: "7. Role of the pool manager",
        body: "The pool manager can invite participants, manage settings and enter results or corrections where needed. For some game types, only a manager has access to certain features.",
      },
      {
        title: "8. Fair play",
        body: "Poolr is intended for fair and social competition. Play honestly, respect other participants and do not use the app for spam, misuse or unwanted behavior.",
      },
    ],
  },
};

export const contactContent: Record<Language, LegalPageContent> = {
  nl: {
    backLabel: "Terug naar home",
    updatedLabel: "Laatst bijgewerkt",
    updatedAt: updatedAt.nl,
    label: "Support",
    title: "Contact",
    intro:
      "Heb je een vraag, probleem, verzoek of melding? Neem contact op met Poolr. We proberen zo duidelijk en snel mogelijk te helpen.",
    sections: [
      {
        title: "E-mail",
        body: "Je kunt contact opnemen via playpoolr.app@gmail.com.",
      },
      {
        title: "Waarvoor kun je contact opnemen?",
        body: [
          "Vragen over je account, login of toegang tot een poule.",
          "Problemen met voorspellingen, scores, ranglijsten of deadlines.",
          "Verzoeken over privacy, gegevensinzage of verwijdering van gegevens.",
          "Meldingen van fouten, misbruik, ongepaste inhoud of technische problemen.",
        ],
      },
      {
        title: "Vermeld voldoende informatie",
        body: "Vermeld bij voorkeur je e-mailadres, de naam van de poule, het speltype en een duidelijke omschrijving van het probleem. Deel geen wachtwoorden of gevoelige betaalgegevens via e-mail.",
      },
      {
        title: "Zakelijke gegevens",
        body: "Wanneer Poolr officieel commercieel wordt aangeboden, kunnen hier aanvullende bedrijfsgegevens worden toegevoegd, zoals bedrijfsnaam, KvK-nummer, btw-nummer en vestigingsadres.",
      },
    ],
  },
  en: {
    backLabel: "Back to home",
    updatedLabel: "Last updated",
    updatedAt: updatedAt.en,
    label: "Support",
    title: "Contact",
    intro:
      "Do you have a question, problem, request or report? Contact Poolr. We try to help as clearly and quickly as possible.",
    sections: [
      {
        title: "Email",
        body: "You can contact us at playpoolr.app@gmail.com.",
      },
      {
        title: "What can you contact us about?",
        body: [
          "Questions about your account, login or access to a pool.",
          "Problems with predictions, scores, leaderboards or deadlines.",
          "Requests about privacy, data access or deletion of data.",
          "Reports of errors, misuse, inappropriate content or technical issues.",
        ],
      },
      {
        title: "Include enough information",
        body: "Preferably include your email address, the name of the pool, the game type and a clear description of the issue. Do not share passwords or sensitive payment details by email.",
      },
      {
        title: "Business details",
        body: "When Poolr is officially offered commercially, additional business details may be added here, such as company name, chamber of commerce number, VAT number and business address.",
      },
    ],
  },
};

export const worldCupRulesContent: Record<Language, LegalPageContent> = {
  nl: {
    backLabel: "Terug naar home",
    updatedLabel: "Laatst bijgewerkt",
    updatedAt: updatedAt.nl,
    label: "WK-poule",
    title: "Spelregels & puntentelling",
    intro:
      "Op deze pagina lees je hoe de WK-poule werkt, wanneer voorspellingen sluiten en hoe punten worden berekend. De poolbeheerder kan sommige instellingen per poule aanpassen.",
    sections: [
      {
        title: "1. Doel van de WK-poule",
        body: "De WK-poule is een sociaal voorspellingenspel. Deelnemers voorspellen wedstrijduitslagen en kunnen bonusvragen invullen. De deelnemer met de meeste punten eindigt bovenaan de ranglijst.",
      },
      {
        title: "2. Deelnemen aan een poule",
        body: "Je kunt deelnemen aan een WK-poule via een uitnodigingslink of door lid te worden van een poule waar je toegang toe hebt. Je voorspellingen en punten zijn gekoppeld aan je account.",
      },
      {
        title: "3. Voorspellingen invullen",
        body: "Voor iedere wedstrijd vul je een verwachte eindstand in. De voorspelling moet worden ingevuld vóór de deadline van de wedstrijd. Na het sluiten van de deadline kan de voorspelling niet meer worden aangepast.",
      },
      {
        title: "4. Deadline per wedstrijd",
        body: "Een voorspelling sluit automatisch vóór de start van de wedstrijd. In de app wordt per wedstrijd getoond tot wanneer je jouw voorspelling kunt invullen of aanpassen.",
      },
      {
        title: "5. Puntentelling per wedstrijd",
        body: [
          "Exacte uitslag goed: 3 punten. Bijvoorbeeld: jij voorspelt 2-1 en de wedstrijd eindigt in 2-1.",
          "Juiste winnaar of gelijkspel goed: 1 punt. Bijvoorbeeld: jij voorspelt 2-1 en de wedstrijd eindigt in 1-0. Je hebt dan de winnaar goed, maar niet de exacte uitslag.",
          "Fout voorspeld: 0 punten. Bijvoorbeeld: jij voorspelt 2-1, maar de wedstrijd eindigt in 1-2 of gelijk.",
        ],
      },
      {
        title: "6. Gelijkspel voorspellen",
        body: "Bij een gelijkspel geldt dezelfde puntentelling. Voorspel je exact 1-1 en wordt het ook 1-1, dan krijg je 3 punten. Voorspel je 0-0 en wordt het 2-2, dan heb je de juiste uitkomst gelijkspel voorspeld en krijg je 1 punt.",
      },
      {
        title: "7. Geen extra punten voor doelsaldo",
        body: "Er worden geen aparte punten gegeven voor alleen het juiste doelsaldo, alleen het juiste aantal doelpunten van één team of andere gedeeltelijke voorspellingen. Alleen de exacte uitslag of de juiste uitkomst telt.",
      },
      {
        title: "8. Knock-outwedstrijden",
        body: "Bij knock-outwedstrijden moet binnen de poule duidelijk zijn welke uitslag meetelt voor de puntentelling. Standaard telt de uitslag zoals die in Poolr als officiële wedstrijdscore wordt verwerkt. Wanneer een andere instelling wordt gebruikt, zoals uitslag na verlenging of winnaar na strafschoppen, wordt dit in de app aangegeven.",
      },
      {
        title: "9. Bonusvragen",
        body: [
          "Een poule kan bonusvragen bevatten, zoals wereldkampioen, finalist, topscorer of groepswinnaars.",
          "Een goed beantwoorde bonusvraag levert standaard 10 punten op.",
          "Een fout beantwoorde bonusvraag levert 0 punten op.",
          "Bonusvragen sluiten op de aangegeven deadline. Na sluiting kunnen antwoorden niet meer worden aangepast.",
        ],
      },
      {
        title: "10. Ranglijst",
        body: "De ranglijst wordt opgebouwd op basis van alle behaalde wedstrijdpunten en bonuspunten. Zodra nieuwe resultaten worden ingevoerd of verwerkt, kan de ranglijst automatisch wijzigen.",
      },
      {
        title: "11. Gelijke stand in de ranglijst",
        body: [
          "Bij een gelijke totaalscore kan de poule dezelfde positie tonen voor meerdere deelnemers.",
          "Als een tiebreaker wordt gebruikt, kan de volgorde bijvoorbeeld worden bepaald door het aantal exacte uitslagen, het aantal juiste uitkomsten of het aantal goed beantwoorde bonusvragen.",
          "De exacte tiebreaker kan later per poule worden uitgebreid.",
        ],
      },
      {
        title: "12. Resultaten invoeren",
        body: "Wedstrijduitslagen kunnen automatisch of handmatig worden verwerkt. Alleen bevoegde beheerders mogen officiële resultaten invoeren of corrigeren. Na correcties kunnen punten en ranglijsten opnieuw worden berekend.",
      },
      {
        title: "13. Correcties",
        body: "Wanneer een uitslag verkeerd is ingevoerd, een wedstrijd wordt aangepast of een technische fout optreedt, mag Poolr of een bevoegde beheerder de uitslag, score of puntentelling corrigeren. Hierdoor kan de ranglijst achteraf wijzigen.",
      },
      {
        title: "14. Niet ingevulde voorspellingen",
        body: "Niet ingevulde voorspellingen leveren 0 punten op. Zodra de deadline is verstreken, kan een lege voorspelling niet alsnog worden ingevuld, tenzij een beheerder dit in uitzonderlijke gevallen toestaat.",
      },
      {
        title: "15. Fair play",
        body: "De WK-poule is bedoeld voor sportieve en sociale competitie. Misbruik, manipulatie, dubbele accounts, technische omzeiling of ongewenst gedrag kan leiden tot uitsluiting van een poule of blokkering van een account.",
      },
      {
        title: "16. Geen gokspel",
        body: "De WK-poule op Poolr is bedoeld voor entertainment en sociale competitie. Poolr is geen gokplatform, bookmaker of kansspelaanbieder en faciliteert geen weddenschappen met geldinzet.",
      },
      {
        title: "17. Wijzigingen in spelregels",
        body: "Poolr kan spelregels of puntentelling aanpassen wanneer dat nodig is voor duidelijkheid, technische werking of nieuwe functies. Voor lopende poules proberen we wijzigingen zo beperkt en eerlijk mogelijk te houden.",
      },
    ],
  },
  en: {
    backLabel: "Back to home",
    updatedLabel: "Last updated",
    updatedAt: updatedAt.en,
    label: "World Cup pool",
    title: "Rules & scoring",
    intro:
      "This page explains how the World Cup pool works, when predictions close and how points are calculated. The pool manager may adjust some settings per pool.",
    sections: [
      {
        title: "1. Goal of the World Cup pool",
        body: "The World Cup pool is a social prediction game. Participants predict match scores and may answer bonus questions. The participant with the most points ends at the top of the leaderboard.",
      },
      {
        title: "2. Joining a pool",
        body: "You can join a World Cup pool through an invite link or by joining a pool you have access to. Your predictions and points are linked to your account.",
      },
      {
        title: "3. Entering predictions",
        body: "For each match, you enter an expected final score. The prediction must be submitted before the match deadline. After the deadline closes, the prediction can no longer be changed.",
      },
      {
        title: "4. Match deadline",
        body: "A prediction automatically closes before the match starts. The app shows per match until when you can enter or edit your prediction.",
      },
      {
        title: "5. Match scoring",
        body: [
          "Exact score correct: 3 points. Example: you predict 2-1 and the match ends 2-1.",
          "Correct winner or draw: 1 point. Example: you predict 2-1 and the match ends 1-0. You predicted the winner correctly, but not the exact score.",
          "Incorrect prediction: 0 points. Example: you predict 2-1, but the match ends 1-2 or in a draw.",
        ],
      },
      {
        title: "6. Predicting a draw",
        body: "Draws use the same scoring. If you predict exactly 1-1 and the match ends 1-1, you receive 3 points. If you predict 0-0 and the match ends 2-2, you predicted the correct outcome as a draw and receive 1 point.",
      },
      {
        title: "7. No extra points for goal difference",
        body: "There are no separate points for only having the correct goal difference, only one team's number of goals, or other partial predictions. Only the exact score or the correct outcome counts.",
      },
      {
        title: "8. Knockout matches",
        body: "For knockout matches, it must be clear within the pool which score counts for scoring. By default, the score that Poolr processes as the official match score counts. If another setting is used, such as score after extra time or winner after penalties, this will be shown in the app.",
      },
      {
        title: "9. Bonus questions",
        body: [
          "A pool may include bonus questions, such as world champion, finalist, top scorer or group winners.",
          "A correctly answered bonus question is worth 10 points by default.",
          "An incorrect bonus answer is worth 0 points.",
          "Bonus questions close at the stated deadline. After closing, answers can no longer be changed.",
        ],
      },
      {
        title: "10. Leaderboard",
        body: "The leaderboard is built from all match points and bonus points. When new results are entered or processed, the leaderboard may change automatically.",
      },
      {
        title: "11. Tied standings",
        body: [
          "When participants have the same total score, the pool may show the same position for multiple participants.",
          "If a tiebreaker is used, the order may be based on the number of exact scores, correct outcomes or correctly answered bonus questions.",
          "The exact tiebreaker may be expanded per pool later.",
        ],
      },
      {
        title: "12. Entering results",
        body: "Match results may be processed automatically or manually. Only authorized administrators may enter or correct official results. After corrections, points and leaderboards may be recalculated.",
      },
      {
        title: "13. Corrections",
        body: "If a result was entered incorrectly, a match is changed or a technical error occurs, Poolr or an authorized administrator may correct the result, score or point calculation. This may change the leaderboard afterwards.",
      },
      {
        title: "14. Missing predictions",
        body: "Missing predictions receive 0 points. Once the deadline has passed, an empty prediction cannot be submitted afterwards unless an administrator allows this in exceptional cases.",
      },
      {
        title: "15. Fair play",
        body: "The World Cup pool is intended for fair and social competition. Misuse, manipulation, duplicate accounts, technical circumvention or unwanted behavior may lead to removal from a pool or blocking of an account.",
      },
      {
        title: "16. No gambling game",
        body: "The World Cup pool on Poolr is intended for entertainment and social competition. Poolr is not a gambling platform, bookmaker or betting provider and does not facilitate wagers with money.",
      },
      {
        title: "17. Changes to rules",
        body: "Poolr may adjust rules or scoring when needed for clarity, technical operation or new features. For ongoing pools, we try to keep changes as limited and fair as possible.",
      },
    ],
  },
};
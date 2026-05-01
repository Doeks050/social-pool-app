import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Lees de disclaimer van Poolr.",
};

export default function DisclaimerPage() {
  return (
    <LegalPage
      label="Poolr"
      title="Disclaimer"
      intro="Poolr is een onafhankelijk platform voor sociale poules en entertainment. Op deze pagina leggen we uit wat gebruikers wel en niet van de app mogen verwachten."
      sections={[
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
      ]}
    />
  );
}
import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Hoe werkt Poolr?",
  description: "Lees hoe je een poule aanmaakt, deelnemers uitnodigt en punten scoort.",
};

export default function HowItWorksPage() {
  return (
    <LegalPage
      label="Uitleg"
      title="Hoe werkt Poolr?"
      intro="Poolr maakt het makkelijk om met vrienden, familie, collega’s of groepen een privé-poule te spelen. Maak een poule, nodig deelnemers uit, vul voorspellingen in en strijd om de hoogste plek op de ranglijst."
      sections={[
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
      ]}
    />
  );
}
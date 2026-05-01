import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Algemene voorwaarden",
  description: "Lees de algemene voorwaarden voor het gebruik van Poolr.",
};

export default function TermsPage() {
  return (
    <LegalPage
      label="Poolr"
      title="Algemene voorwaarden"
      intro="Deze voorwaarden gelden voor het gebruik van Poolr. Door een account aan te maken of de app te gebruiken, ga je akkoord met deze voorwaarden."
      sections={[
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
      ]}
    />
  );
}
import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "WK-poule spelregels en puntentelling",
  description:
    "Lees de spelregels, deadlines en puntentelling voor de WK-poule op Poolr.",
};

export default function WorldCupRulesPage() {
  return (
    <LegalPage
      label="WK-poule"
      title="Spelregels & puntentelling"
      intro="Op deze pagina lees je hoe de WK-poule werkt, wanneer voorspellingen sluiten en hoe punten worden berekend. De poolbeheerder kan sommige instellingen per poule aanpassen."
      sections={[
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
      ]}
    />
  );
}
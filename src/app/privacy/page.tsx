import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacybeleid",
  description: "Lees hoe Poolr persoonsgegevens verwerkt en beschermt.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      label="Poolr"
      title="Privacybeleid"
      intro="In dit privacybeleid leggen we uit welke persoonsgegevens Poolr verwerkt, waarom we dat doen en welke rechten gebruikers hebben."
      sections={[
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
      ]}
    />
  );
}
import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Contact",
  description: "Neem contact op met Poolr.",
};

export default function ContactPage() {
  return (
    <LegalPage
      label="Support"
      title="Contact"
      intro="Heb je een vraag, probleem, verzoek of melding? Neem contact op met Poolr. We proberen zo duidelijk en snel mogelijk te helpen."
      sections={[
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
      ]}
    />
  );
}
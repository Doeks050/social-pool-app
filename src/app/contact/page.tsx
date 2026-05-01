import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { contactContent } from "@/data/legalPages";

export const metadata: Metadata = {
  title: "Contact",
  description: "Neem contact op met Poolr.",
};

export default function ContactPage() {
  return <LegalPage content={contactContent} />;
}
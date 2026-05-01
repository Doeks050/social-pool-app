import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { billingContent } from "@/data/legalPages";

export const metadata: Metadata = {
  title: "Betalingen & refunds",
  description:
    "Lees hoe betalingen, betaalde functies en refunds binnen Poolr werken.",
};

export default function BillingPage() {
  return <LegalPage content={billingContent} />;
}
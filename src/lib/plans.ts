export type PoolPlanCode = "starter" | "small" | "pro" | "business";

export type PoolPaymentStatus =
  | "pending"
  | "paid"
  | "waived"
  | "failed"
  | "cancelled"
  | "refunded";

export type PoolStatus = "pending_payment" | "active" | "archived";

export type PoolPlan = {
  code: PoolPlanCode;
  name: string;
  description: string;
  priceCents: number;
  currency: "eur";
  maxMembers: number;
  highlighted?: boolean;
};

export const POOL_PLANS: Record<PoolPlanCode, PoolPlan> = {
  starter: {
    code: "starter",
    name: "Starter",
    description: "Voor kleine poules met vrienden, familie of collega’s.",
    priceCents: 199,
    currency: "eur",
    maxMembers: 10,
  },
  small: {
    code: "small",
    name: "Small",
    description: "Voor grotere vriendengroepen of kleine teams.",
    priceCents: 399,
    currency: "eur",
    maxMembers: 20,
    highlighted: true,
  },
  pro: {
    code: "pro",
    name: "Pro",
    description: "Voor grotere kantoor- of communitypoules.",
    priceCents: 799,
    currency: "eur",
    maxMembers: 50,
  },
  business: {
    code: "business",
    name: "Business",
    description: "Voor bedrijven en grote groepen.",
    priceCents: 1499,
    currency: "eur",
    maxMembers: 150,
  },
};

export const POOL_PLAN_ORDER: PoolPlanCode[] = [
  "starter",
  "small",
  "pro",
  "business",
];

export function getPoolPlans(): PoolPlan[] {
  return POOL_PLAN_ORDER.map((code) => POOL_PLANS[code]);
}

export function getPoolPlan(code: string | null | undefined): PoolPlan | null {
  if (!code) return null;

  if (
    code === "starter" ||
    code === "small" ||
    code === "pro" ||
    code === "business"
  ) {
    return POOL_PLANS[code];
  }

  return null;
}

export function formatPlanPrice(priceCents: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(priceCents / 100);
}

export function getPlanPriceLabel(plan: PoolPlan): string {
  return formatPlanPrice(plan.priceCents);
}

export function getPlanMemberLabel(plan: PoolPlan): string {
  return `Tot ${plan.maxMembers} deelnemers`;
}

export function isPaidPoolStatus(
  paymentStatus: string | null | undefined
): boolean {
  return paymentStatus === "paid" || paymentStatus === "waived";
}

export function isUsablePool(input: {
  status?: string | null;
  payment_status?: string | null;
}): boolean {
  return input.status === "active" && isPaidPoolStatus(input.payment_status);
}

export function getUpgradeAmountCents(input: {
  fromPlanCode: string | null | undefined;
  toPlanCode: string | null | undefined;
}): number | null {
  const fromPlan = getPoolPlan(input.fromPlanCode);
  const toPlan = getPoolPlan(input.toPlanCode);

  if (!fromPlan || !toPlan) return null;

  const upgradeAmount = toPlan.priceCents - fromPlan.priceCents;

  if (upgradeAmount <= 0) return null;

  return upgradeAmount;
}

export function canUpgradePlan(input: {
  fromPlanCode: string | null | undefined;
  toPlanCode: string | null | undefined;
}): boolean {
  return getUpgradeAmountCents(input) !== null;
}

export function getDefaultPoolPlan(): PoolPlan {
  return POOL_PLANS.starter;
}

export function getPlanCodeFromFormData(
  value: FormDataEntryValue | null
): PoolPlanCode {
  if (
    value === "starter" ||
    value === "small" ||
    value === "pro" ||
    value === "business"
  ) {
    return value;
  }

  return "starter";
}
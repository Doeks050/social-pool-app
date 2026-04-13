export type PoolType = "world_cup" | "office_bingo" | "f1_pool";

export type PoolTypeOption = {
  value: PoolType;
  label: string;
  shortLabel: string;
  description: string;
  statusText: string;
};

export const POOL_TYPE_OPTIONS: PoolTypeOption[] = [
  {
    value: "world_cup",
    label: "WK Poule",
    shortLabel: "WK",
    description:
      "Voorspel wedstrijden, vul scores in en volg automatisch de ranglijst.",
    statusText: "Wedstrijden, voorspellingen en ranglijst bouwen we hierna op.",
  },
  {
    value: "office_bingo",
    label: "Office Bingo",
    shortLabel: "Bingo",
    description:
      "Maak bingo-pools voor kantoor, events of groepsspellen met kaarten en claims.",
    statusText: "Bingo settings, kaarten en claim flow bouwen we hierna op.",
  },
  {
    value: "f1_pool",
    label: "F1 Poule",
    shortLabel: "F1",
    description:
      "Voorspel raceweekenden, sessies en resultaten met een eigen F1-flow.",
    statusText: "Weekends, sessies en F1-voorspellingen bouwen we hierna op.",
  },
];

export function getPoolTypeMeta(gameType: string): PoolTypeOption {
  return (
    POOL_TYPE_OPTIONS.find((option) => option.value === gameType) ?? {
      value: "world_cup",
      label: gameType,
      shortLabel: gameType,
      description: "Onbekend pooltype.",
      statusText: "Voor dit pooltype is nog geen module gekoppeld.",
    }
  );
}
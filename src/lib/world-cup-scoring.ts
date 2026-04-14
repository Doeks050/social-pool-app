export type ScoreInput = {
  home: number;
  away: number;
};

export type PredictionBreakdown = {
  exactScore: boolean;
  correctOutcome: boolean;
};

function getOutcome(score: ScoreInput): "home" | "away" | "draw" {
  if (score.home > score.away) {
    return "home";
  }

  if (score.home < score.away) {
    return "away";
  }

  return "draw";
}

export function getPredictionBreakdown(
  predicted: ScoreInput,
  actual: ScoreInput
): PredictionBreakdown {
  const exactScore =
    predicted.home === actual.home && predicted.away === actual.away;

  const correctOutcome = getOutcome(predicted) === getOutcome(actual);

  return {
    exactScore,
    correctOutcome,
  };
}

export function getPredictionPoints(
  predicted: ScoreInput,
  actual: ScoreInput
): number {
  const breakdown = getPredictionBreakdown(predicted, actual);

  if (breakdown.exactScore) {
    return 3;
  }

  if (breakdown.correctOutcome) {
    return 1;
  }

  return 0;
}
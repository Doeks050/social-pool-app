export type OfficeBingoCardCell = {
  itemId: string;
  positionIndex: number;
};

export type OfficeBingoGeneratedCard = {
  fingerprint: string;
  cells: OfficeBingoCardCell[];
};

export type OfficeBingoWinCheckResult = {
  hasLine: boolean;
  linePositions: number[];
  hasFullCard: boolean;
};

function shuffleArray<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temporaryValue = shuffled[index];

    shuffled[index] = shuffled[randomIndex];
    shuffled[randomIndex] = temporaryValue;
  }

  return shuffled;
}

export function getNeededCellCount(gridSize: number) {
  return gridSize * gridSize;
}

export function generateOfficeBingoCard(
  itemIds: string[],
  gridSize: number,
  existingFingerprints = new Set<string>()
): OfficeBingoGeneratedCard {
  const neededCellCount = getNeededCellCount(gridSize);

  if (itemIds.length < neededCellCount) {
    throw new Error(
      `Not enough bingo items. Needed ${neededCellCount}, received ${itemIds.length}.`
    );
  }

  for (let attempt = 0; attempt < 250; attempt += 1) {
    const selectedItemIds = shuffleArray(itemIds).slice(0, neededCellCount);
    const positionedItemIds = shuffleArray(selectedItemIds);
    const fingerprint = positionedItemIds.join("|");

    if (existingFingerprints.has(fingerprint)) {
      continue;
    }

    const cells = positionedItemIds.map((itemId, positionIndex) => ({
      itemId,
      positionIndex,
    }));

    return {
      fingerprint,
      cells,
    };
  }

  throw new Error("Could not generate a unique bingo card.");
}

export function getWinningLines(gridSize: number, diagonalEnabled: boolean) {
  const lines: number[][] = [];

  for (let row = 0; row < gridSize; row += 1) {
    const rowPositions: number[] = [];

    for (let column = 0; column < gridSize; column += 1) {
      rowPositions.push(row * gridSize + column);
    }

    lines.push(rowPositions);
  }

  for (let column = 0; column < gridSize; column += 1) {
    const columnPositions: number[] = [];

    for (let row = 0; row < gridSize; row += 1) {
      columnPositions.push(row * gridSize + column);
    }

    lines.push(columnPositions);
  }

  if (diagonalEnabled) {
    const diagonalOne: number[] = [];
    const diagonalTwo: number[] = [];

    for (let index = 0; index < gridSize; index += 1) {
      diagonalOne.push(index * gridSize + index);
      diagonalTwo.push(index * gridSize + (gridSize - 1 - index));
    }

    lines.push(diagonalOne);
    lines.push(diagonalTwo);
  }

  return lines;
}

export function checkOfficeBingoWin({
  gridSize,
  diagonalEnabled,
  cardCells,
  calledItemIds,
}: {
  gridSize: number;
  diagonalEnabled: boolean;
  cardCells: OfficeBingoCardCell[];
  calledItemIds: Set<string>;
}): OfficeBingoWinCheckResult {
  const calledPositions = new Set(
    cardCells
      .filter((cell) => calledItemIds.has(cell.itemId))
      .map((cell) => cell.positionIndex)
  );

  const winningLines = getWinningLines(gridSize, diagonalEnabled);

  const completedLine = winningLines.find((line) =>
    line.every((positionIndex) => calledPositions.has(positionIndex))
  );

  const neededCellCount = getNeededCellCount(gridSize);
  const hasFullCard = cardCells.every((cell) => calledItemIds.has(cell.itemId));

  return {
    hasLine: Boolean(completedLine),
    linePositions: completedLine ?? [],
    hasFullCard: calledPositions.size >= neededCellCount && hasFullCard,
  };
}
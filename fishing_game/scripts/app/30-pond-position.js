// Split from app.js: 30 pond position.
function cardSlotSize(card, storage) {
    const size = EFFECTS.modifyNumberWithCards(
        cardsForTargetModifiers(card),
        "modifyCardSlotSize",
        card.slotSize || 1,
        effectContext({ targetCard: card, targetStorage: storage })
    );

    return Math.max(1, Math.floor(size));
}

function storageUsedSlots(cards, storage, skipIndex = -1) {
    return cards.reduce((used, card, index) => {
        if (index === skipIndex) {
            return used;
        }

        return used + cardSlotSize(card, storage);
    }, 0);
}

function effectiveCapacity(storage) {
    const capacity = EFFECTS.modifyNumberWithCards(
        ownedCards(),
        "modifyPondCapacity",
        unlockedCellCount(storage),
        effectContext({ storage })
    );

    return Math.max(Math.floor(capacity), storageUsedSlots(storageCards(storage), storage));
}

function canStoreCard(cards, capacity, card, storage, skipIndex = -1) {
    return storageUsedSlots(cards, storage, skipIndex) + cardSlotSize(card, storage) <= capacity;
}

function cellPositionStyle(cellIndex) {
    const column = (cellIndex % 3) + 1;
    const row = Math.floor(cellIndex / 3) + 1;
    return { column, row };
}

function pondCellIndex(card) {
    if (!card) {
        return -1;
    }

    if (Number.isFinite(card.cellIndex)) {
        return card.cellIndex;
    }

    return state.pond.findIndex((entry) => entry.uid === card.uid);
}

function pondCellInfo(cellIndex) {
    const row = Math.floor(cellIndex / 3);
    const column = cellIndex % 3;
    const corners = [0, 2, 6, 8];
    const edges = [1, 3, 5, 7];

    return {
        cellIndex,
        row,
        column,
        isCenter: cellIndex === 4,
        isCorner: corners.includes(cellIndex),
        isEdge: edges.includes(cellIndex)
    };
}

function cellDistance(leftCell, rightCell) {
    if (!Number.isFinite(leftCell) || !Number.isFinite(rightCell)) {
        return 0;
    }

    const left = pondCellInfo(leftCell);
    const right = pondCellInfo(rightCell);

    return Math.abs(left.row - right.row) + Math.abs(left.column - right.column);
}

function pondOccupancy(skipUid = null) {
    const occupied = new Map();

    state.pond.forEach((card, index) => {
        if (card.uid === skipUid) {
            return;
        }

        const start = Number.isFinite(card.cellIndex) ? card.cellIndex : index;
        const size = cardSlotSize(card, "pond");

        for (let offset = 0; offset < size; offset += 1) {
            occupied.set(start + offset, {
                card,
                index,
                isStart: offset === 0,
                start
            });
        }
    });

    return occupied;
}

function cardOccupiedCells(card) {
    if (!card) {
        return [];
    }

    const start = Number.isFinite(card.cellIndex)
        ? card.cellIndex
        : state.pond.findIndex((entry) => entry.uid === card.uid);
    const size = Math.max(1, Math.floor(card.slotSize || 1));

    if (start < 0) {
        return [];
    }

    return Array.from({ length: size }, (_, offset) => start + offset)
        .filter((cellIndex) => cellIndex >= 0 && cellIndex < storageGridSize("pond"));
}

function adjacentCellIndexes(card) {
    const selfCells = cardOccupiedCells(card);
    const selfCellSet = new Set(selfCells);
    const neighbors = new Set();

    selfCells.forEach((cellIndex) => {
        const row = Math.floor(cellIndex / 3);
        const column = cellIndex % 3;
        const candidates = [
            { row: row - 1, column },
            { row: row + 1, column },
            { row, column: column - 1 },
            { row, column: column + 1 }
        ];

        candidates.forEach((candidate) => {
            if (
                candidate.row < 0
                || candidate.row >= 3
                || candidate.column < 0
                || candidate.column >= 3
            ) {
                return;
            }

            const targetIndex = candidate.row * 3 + candidate.column;

            if (!selfCellSet.has(targetIndex)) {
                neighbors.add(targetIndex);
            }
        });
    });

    return [...neighbors];
}

function adjacentPondCards(card) {
    const occupied = pondOccupancy(card?.uid);
    const cards = new Map();

    adjacentCellIndexes(card).forEach((cellIndex) => {
        const entry = occupied.get(cellIndex);

        if (entry?.card) {
            cards.set(entry.card.uid, entry.card);
        }
    });

    return [...cards.values()];
}

function pondCardAtCell(cellIndex, skipUid = null) {
    return pondOccupancy(skipUid).get(cellIndex)?.card || null;
}

function pondCardsInCells(cellIndexes) {
    const cards = new Map();
    const occupied = pondOccupancy();

    cellIndexes.forEach((cellIndex) => {
        const card = occupied.get(cellIndex)?.card;

        if (card) {
            cards.set(card.uid, card);
        }
    });

    return [...cards.values()];
}

function pondCardsInSameLine(card, options = {}) {
    const start = pondCellIndex(card);

    if (start < 0) {
        return [];
    }

    const info = pondCellInfo(start);

    return state.pond.filter((target) => {
        if (target.uid === card.uid) {
            return false;
        }

        const targetInfo = pondCellInfo(pondCellIndex(target));
        const sameRow = targetInfo.row === info.row;
        const sameColumn = targetInfo.column === info.column;

        if (options.rowOnly) {
            return sameRow;
        }

        if (options.columnOnly) {
            return sameColumn;
        }

        return sameRow || sameColumn;
    });
}

function pondEmptyCells(skipUid = null) {
    const cells = storageCells("pond");
    const occupied = pondOccupancy(skipUid);

    return cells
        .map((enabled, index) => ({ enabled, index }))
        .filter((cell) => cell.enabled && !occupied.has(cell.index))
        .map((cell) => cell.index);
}

function adjacentEmptyPondCells(card) {
    const cells = storageCells("pond");
    const occupied = pondOccupancy(card?.uid);

    return adjacentCellIndexes(card).filter((cellIndex) => cells[cellIndex] && !occupied.has(cellIndex));
}

function hasAdjacentEmptyPondCell(card) {
    return adjacentEmptyPondCells(card).length > 0;
}

function isPondFull() {
    const occupiedCells = new Set();

    state.pond.forEach((card) => {
        cardOccupiedCells(card).forEach((cellIndex) => occupiedCells.add(cellIndex));
    });

    return storageCells("pond").every((enabled, index) => !enabled || occupiedCells.has(index));
}

function canPlacePondAt(card, cellIndex, replaceUid = null) {
    const cells = storageCells("pond");
    const size = cardSlotSize(card, "pond");
    const startColumn = cellIndex % 3;
    const occupied = pondOccupancy(replaceUid);

    if (startColumn + size > 3) {
        return false;
    }

    for (let offset = 0; offset < size; offset += 1) {
        const targetCell = cellIndex + offset;

        if (targetCell >= storageGridSize("pond") || !cells[targetCell] || occupied.has(targetCell)) {
            return false;
        }
    }

    return true;
}

function markPondCardsMoved(cards) {
    const uids = [...new Set(cards.filter(Boolean).map((card) => card.uid))];

    state.movementHighlightUids = uids;
    window.setTimeout(() => {
        if (uids.some((uid) => state.movementHighlightUids.includes(uid))) {
            state.movementHighlightUids = state.movementHighlightUids.filter((uid) => !uids.includes(uid));
            render();
        }
    }, 360);
}

function movePondCard(card, targetCell, options = {}) {
    if (!card || !Number.isFinite(targetCell)) {
        return false;
    }

    const fromCell = pondCellIndex(card);

    if (fromCell < 0 || fromCell === targetCell || !canPlacePondAt(card, targetCell, card.uid)) {
        return false;
    }

    card.cellIndex = targetCell;
    incrementDailyCounter(card, `moved-${card.uid}`);
    state.pond.sort((left, right) => (pondCellIndex(left) || 0) - (pondCellIndex(right) || 0));
    markPondCardsMoved([card]);

    const moveInfo = {
        movedCard: card,
        card,
        fromCell,
        toCell: targetCell,
        distance: cellDistance(fromCell, targetCell) || 1,
        sourceCard: options.sourceCard || card,
        moveReason: options.reason || "effect",
        isSwap: false
    };

    if (options.log !== false) {
        addLog(`「${card.name}」迁游到第 ${targetCell + 1} 格。`);
    }

    if (options.triggerHooks !== false) {
        runOwnedCardsHook("onCardMoved", moveInfo);
    }

    return true;
}

function swapPondCards(leftCard, rightCard, options = {}) {
    if (!leftCard || !rightCard || leftCard.uid === rightCard.uid) {
        return false;
    }

    if (cardSlotSize(leftCard, "pond") !== 1 || cardSlotSize(rightCard, "pond") !== 1) {
        return false;
    }

    const leftCell = pondCellIndex(leftCard);
    const rightCell = pondCellIndex(rightCard);

    if (leftCell < 0 || rightCell < 0) {
        return false;
    }

    leftCard.cellIndex = rightCell;
    rightCard.cellIndex = leftCell;
    incrementDailyCounter(leftCard, `moved-${leftCard.uid}`);
    incrementDailyCounter(rightCard, `moved-${rightCard.uid}`);
    state.pond.sort((left, right) => (pondCellIndex(left) || 0) - (pondCellIndex(right) || 0));
    markPondCardsMoved([leftCard, rightCard]);

    if (options.log !== false) {
        addLog(`「${leftCard.name}」与「${rightCard.name}」换位。`);
    }

    if (options.triggerHooks !== false) {
        const swapId = options.swapId || `${leftCard.uid}-${rightCard.uid}-${Date.now()}`;
        const common = {
            sourceCard: options.sourceCard || leftCard,
            moveReason: options.reason || "swap",
            isSwap: true,
            swapId
        };
        runOwnedCardsHook("onCardMoved", {
            ...common,
            movedCard: leftCard,
            card: leftCard,
            fromCell: leftCell,
            toCell: rightCell,
            distance: cellDistance(leftCell, rightCell) || 1,
            swappedWith: rightCard
        });
        runOwnedCardsHook("onCardMoved", {
            ...common,
            movedCard: rightCard,
            card: rightCard,
            fromCell: rightCell,
            toCell: leftCell,
            distance: cellDistance(rightCell, leftCell) || 1,
            swappedWith: leftCard
        });
    }

    return true;
}

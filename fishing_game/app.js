const DATA = window.FISHING_GAME_DATA;
const EFFECTS = window.FISHING_CARD_EFFECTS;

const elements = {
    mainMenu: document.getElementById("mainMenu"),
    startGameButton: document.getElementById("startGameButton"),
    tutorialButton: document.getElementById("tutorialButton"),
    modeButtons: [...document.querySelectorAll("[data-mode-id]")],
    characterButtons: [...document.querySelectorAll("[data-character-id]")],
    characterPreviewArt: document.getElementById("characterPreviewArt"),
    characterPreviewName: document.getElementById("characterPreviewName"),
    characterPreviewTitle: document.getElementById("characterPreviewTitle"),
    characterPreviewPassive: document.getElementById("characterPreviewPassive"),
    dayValue: document.getElementById("dayValue"),
    coinValue: document.getElementById("coinValue"),
    pondCount: document.getElementById("pondCount"),
    pondMax: document.getElementById("pondMax"),
    pondValue: document.getElementById("pondValue"),
    checkpointTarget: document.getElementById("checkpointTarget"),
    pondCountSmall: document.getElementById("pondCountSmall"),
    pondMaxSmall: document.getElementById("pondMaxSmall"),
    sceneStatus: document.getElementById("sceneStatus"),
    baitScopeLabel: document.getElementById("baitScopeLabel"),
    baitCount: document.getElementById("baitCount"),
    baitLimit: document.getElementById("baitLimit"),
    baitRack: document.getElementById("baitRack"),
    chargeMeter: document.getElementById("chargeMeter"),
    chargeFill: document.getElementById("chargeFill"),
    chargePerfectZone: document.getElementById("chargePerfectZone"),
    chargeHint: document.getElementById("chargeHint"),
    catchChoiceArea: document.getElementById("catchChoiceArea"),
    lastCatch: document.getElementById("lastCatch"),
    logList: document.getElementById("logList"),
    pixelScene: document.getElementById("pixelScene"),
    pondGrid: document.getElementById("pondGrid"),
    fishButton: document.getElementById("fishButton"),
    advanceTimeButton: document.getElementById("advanceTimeButton"),
    upgradeCoreButton: document.getElementById("upgradeCoreButton"),
    shopPanel: document.querySelector(".shop-panel"),
    decisionModal: document.getElementById("decisionModal"),
    decisionTitle: document.getElementById("decisionTitle"),
    decisionCopy: document.getElementById("decisionCopy"),
    decisionPreview: document.getElementById("decisionPreview"),
    decisionOptions: document.getElementById("decisionOptions")
};

const STORAGE = {
    pond: {
        label: "水族馆",
        cardsKey: "pond",
        cellsKey: "pondCells",
        gridSize: 9,
        initialCells: [0, 1, 3, 4],
        upgradeBaseCost: 25,
        upgradeStep: 15
    }
};

const INITIAL_COINS = 2;
const BASE_DAILY_COINS = 4;
const BASE_FISHING_COST = 3;
const DEFAULT_CHARGE_WINDOW = {
    perfectStartMs: 900,
    perfectEndMs: 1100,
    maxMs: 1300,
    rarityBonus: 0.08
};

function createInitialState(modeId = "standard", gameStarted = false, characterId = "tide") {
    return {
        gameStarted,
        modeId,
        characterId,
        day: 1,
        coins: INITIAL_COINS,
        baitLevel: 1,
        pondCells: createInitialCells(STORAGE.pond),
        pond: [],
        catchChoices: [],
        selectedCatchUid: null,
        catchPickLimit: 1,
        catchPicksRemaining: 0,
        dailyCatchCount: 0,
        pondUpgradeDay: 0,
        activeEvents: [],
        decisionLocked: false,
        dragData: null,
        selectedCard: null,
        lastCheckpointDay: 0,
        combineHighlightUid: null,
        placementHighlightUid: null,
        sellingCardUid: null,
        charge: {
            isCharging: false,
            startedAt: 0,
            elapsedMs: 0,
            rafId: null,
            pointerId: null
        },
        stats: {
            caught: 0,
            combined: 0,
            soldFish: 0,
            baitUsed: 0,
            replaced: 0,
            discarded: 0
        }
    };
}

const state = createInitialState("standard", false);

function createInitialCells(config) {
    return Array.from({ length: config.gridSize }, (_, index) => config.initialCells.includes(index));
}

function createBaitStack(baitId, amount) {
    return Array.from({ length: Math.max(0, amount) }, () => baitId);
}

function currentPeriod() {
    return { id: "day", label: `第 ${state.day} 天` };
}

function currentMode() {
    return DATA.gameModes?.[state.modeId] || DATA.gameModes?.standard || {
        id: "standard",
        name: "标准模式",
        checkpointTargets: [24],
        checkpointTargetStep: 120
    };
}

function activeCharacter() {
    const character = DATA.characters?.[state.characterId] || DATA.characters?.tide;

    if (!character) {
        return null;
    }

    return {
        ...character,
        uid: `character-${character.id}`,
        effects: Array.isArray(character.effects) ? character.effects : []
    };
}

function cardStar(card) {
    return Math.max(1, Math.min(3, Math.floor(card?.star || 1)));
}

function isCardArchetype(card, archetype) {
    return Boolean(card && archetype && card.archetype === archetype);
}

function pondCardsByArchetype(archetype, options = {}) {
    return state.pond.filter((card) => {
        if (!isCardArchetype(card, archetype)) {
            return false;
        }

        if (options.excludeUid && card.uid === options.excludeUid) {
            return false;
        }

        return true;
    });
}

function countPondCardsByArchetype(archetype, options = {}) {
    return pondCardsByArchetype(archetype, options).length;
}

function activeEventSources() {
    if (!DATA.eventSystem?.enabled || !Array.isArray(state.activeEvents)) {
        return [];
    }

    return state.activeEvents
        .map((eventId) => DATA.eventSystem.events?.find((event) => event.id === eventId))
        .filter(Boolean)
        .map((event) => ({
            ...event,
            uid: `event-${event.id}`,
            effects: Array.isArray(event.effects) ? event.effects : []
        }));
}

function storageCards(storage) {
    const config = STORAGE[storage];
    return config ? state[config.cardsKey] : [];
}

function storageCells(storage) {
    const config = STORAGE[storage];
    return config ? state[config.cellsKey] : [];
}

function storageGridSize(storage) {
    return STORAGE[storage]?.gridSize || 0;
}

function unlockedCellCount(storage) {
    return storageCells(storage).filter(Boolean).length;
}

function addLog(message) {
    const item = document.createElement("li");
    item.textContent = message;
    elements.logList.prepend(item);

    while (elements.logList.children.length > 6) {
        elements.logList.removeChild(elements.logList.lastElementChild);
    }
}

function dailyCounter(card, key) {
    if (!card.dailyCounters || card.dailyCounterDay !== state.day) {
        card.dailyCounters = {};
        card.dailyCounterDay = state.day;
    }

    return card.dailyCounters[key] || 0;
}

function incrementDailyCounter(card, key, amount = 1) {
    if (!card.dailyCounters || card.dailyCounterDay !== state.day) {
        card.dailyCounters = {};
        card.dailyCounterDay = state.day;
    }

    card.dailyCounters[key] = (card.dailyCounters[key] || 0) + amount;
    return card.dailyCounters[key];
}

function resetDailyCardState() {
    ownedCards().forEach((card) => {
        card.valueGainedToday = 0;
        card.dailyCounters = {};
        card.dailyCounterDay = state.day;
    });
}

function addValueToCard(card, amount, options = {}) {
    const gain = Math.max(0, Math.floor(amount));

    if (!card || gain <= 0) {
        return 0;
    }

    card.value = (card.value || 0) + gain;
    card.valueGainedToday = (card.valueGainedToday || 0) + gain;

    if (options.message) {
        addLog(options.message);
    }

    if (options.triggerGain !== false) {
        runOwnedCardsHook("onCardValueGain", {
            gainedCard: card,
            amount: gain,
            sourceCard: options.sourceCard || null,
            reason: options.reason || ""
        });
    }

    return gain;
}

function createFishInstance(template, baitId) {
    return {
        ...template,
        tags: Array.isArray(template.tags) ? [...template.tags] : [],
        effects: Array.isArray(template.effects) ? template.effects.map((effect) => ({ ...effect })) : [],
        star: 1,
        value: template.baseValue || 1,
        valueGainedToday: 0,
        dailyCounters: {},
        uid: `${template.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        baitId
    };
}

function ownedCards() {
    return [...state.pond];
}

function effectSources() {
    const character = activeCharacter();
    return [
        ...(character ? [character] : []),
        ...activeEventSources(),
        ...ownedCards()
    ];
}

function runEventSystemHook(hook, extra = {}) {
    if (!DATA.eventSystem?.enabled) {
        return;
    }

    EFFECTS.runCardsHook(activeEventSources(), hook, effectContext(extra));
}

function effectContext(extra = {}) {
    return {
        state,
        data: DATA,
        random: Math.random,
        addLog,
        baitIdForLevel,
        fishCardValue,
        ownedCards,
        activeCharacter,
        cardStar,
        isCardArchetype,
        pondCardsByArchetype,
        countPondCardsByArchetype,
        adjacentPondCards,
        hasAdjacentEmptyPondCell,
        isPondFull,
        dailyCounter,
        incrementDailyCounter,
        addValueToCard,
        ...extra
    };
}

function runCardHook(card, hook, extra = {}) {
    EFFECTS.runCardHook(card, hook, effectContext(extra));
}

function runOwnedCardsHook(hook, extra = {}) {
    EFFECTS.runCardsHook(effectSources(), hook, effectContext(extra));
}

function cardsForTargetModifiers(targetCard) {
    const cards = effectSources();

    if (targetCard && !cards.some((card) => card.uid === targetCard.uid)) {
        cards.push(targetCard);
    }

    return cards;
}

function weightedPick(items) {
    const availableItems = items.filter((item) => Number.isFinite(item.weight) && item.weight > 0);
    const total = availableItems.reduce((sum, item) => sum + item.weight, 0);

    if (total <= 0) {
        return null;
    }

    let roll = Math.random() * total;

    for (const item of availableItems) {
        roll -= item.weight;
        if (roll <= 0) {
            return item;
        }
    }

    return availableItems[availableItems.length - 1];
}

function normalizeRarityWeights(rarityWeights) {
    const weightsByRarity = new Map();

    rarityWeights.forEach((item) => {
        const weight = Number(item.weight);

        if (!item.rarity || !Number.isFinite(weight)) {
            return;
        }

        weightsByRarity.set(
            item.rarity,
            Math.max(0, (weightsByRarity.get(item.rarity) || 0) + weight)
        );
    });

    return [...weightsByRarity.entries()]
        .map(([rarity, weight]) => ({ rarity, weight }))
        .filter((item) => item.weight > 0);
}

function drawFishByBait(baitId) {
    const bait = DATA.baitTypes[baitId] || DATA.baitTypes.basic;
    const rarityWeights = bait.rarityWeights.map((item) => ({ ...item }));
    runOwnedCardsHook("modifyBaitPool", {
        baitId,
        rarityWeights,
        period: currentPeriod(),
        day: state.day,
        dailyCatchCount: state.dailyCatchCount,
        tripCatchCount: state.dailyCatchCount,
        charge: state.currentCatchCharge || null
    });
    applyChargeRarityBonus(rarityWeights, state.currentCatchCharge);
    const availableWeights = normalizeRarityWeights(rarityWeights);
    const fallbackWeights = normalizeRarityWeights(bait.rarityWeights);
    const pickedWeight = weightedPick(availableWeights.length > 0 ? availableWeights : fallbackWeights);
    const rarity = pickedWeight?.rarity || "common";
    const candidates = DATA.fishPool.filter((fish) => fish.rarity === rarity);
    const template = candidates[Math.floor(Math.random() * candidates.length)] || DATA.fishPool[0];

    return createFishInstance(template, baitId);
}

function applyChargeRarityBonus(rarityWeights, charge) {
    if (!charge?.isPerfect || charge.rarityBonus <= 0) {
        return;
    }

    const rarityMultipliers = {
        uncommon: 1 + charge.rarityBonus * 0.5,
        rare: 1 + charge.rarityBonus,
        epic: 1 + charge.rarityBonus * 1.15,
        legendary: 1 + charge.rarityBonus * 1.3,
        mythic: 1 + charge.rarityBonus * 1.45
    };

    rarityWeights.forEach((item) => {
        if (rarityMultipliers[item.rarity]) {
            item.weight *= rarityMultipliers[item.rarity];
        }
    });
}

function baitIdForLevel(level) {
    const order = DATA.baitLevelOrder || ["basic"];
    const index = Math.max(0, Math.min(order.length - 1, level - 1));
    return order[index] || "basic";
}

function drawCatchChoices(baitId, count = 3) {
    return Array.from({ length: count }, () => drawFishByBait(baitId));
}

function fishSellValue(fish) {
    return EFFECTS.modifyNumberWithCards(
        cardsForTargetModifiers(fish),
        "modifySellValue",
        fish.sellValue || 1,
        effectContext({ targetCard: fish })
    );
}

function dailyValueGain(card) {
    const baseGain = (card.dailyGain || 1) * (card.star || 1);
    const gain = EFFECTS.modifyNumberWithCards(
        cardsForTargetModifiers(card),
        "modifyDailyValueGain",
        baseGain,
        effectContext({ targetCard: card })
    );

    return Math.max(0, Math.floor(gain));
}

function fishCardValue(fish) {
    const value = EFFECTS.modifyNumberWithCards(
        cardsForTargetModifiers(fish),
        "modifyCardValue",
        fish.value || 0,
        effectContext({ targetCard: fish })
    );

    return Math.floor(value);
}

function pondTotalValue() {
    return state.pond.reduce((sum, fish) => sum + fishCardValue(fish), 0);
}

function checkpointTargetForDay(day = state.day) {
    const checkpointIndex = Math.max(0, Math.ceil(day / 3) - 1);
    const mode = currentMode();
    const targets = Array.isArray(mode.checkpointTargets) && mode.checkpointTargets.length > 0
        ? mode.checkpointTargets
        : [24];

    if (checkpointIndex < targets.length) {
        return targets[checkpointIndex];
    }

    const step = mode.checkpointTargetStep || targets[targets.length - 1];
    return targets[targets.length - 1] + (checkpointIndex - targets.length + 1) * step;
}

function nextCheckpointTarget() {
    const checkpointDay = Math.ceil(state.day / 3) * 3;
    return checkpointTargetForDay(checkpointDay);
}

function isCheckpointEve(day = state.day) {
    return day % 3 === 2;
}

function bestPondCard() {
    return state.pond.reduce((best, card) => {
        if (!best || fishCardValue(card) > fishCardValue(best)) {
            return card;
        }

        return best;
    }, null);
}

function highestStarPondCard() {
    return state.pond.reduce((best, card) => {
        const cardStar = card.star || 1;
        const bestStar = best?.star || 0;

        if (!best || cardStar > bestStar || (cardStar === bestStar && fishCardValue(card) > fishCardValue(best))) {
            return card;
        }

        return best;
    }, null);
}

function cardContribution(card) {
    return fishCardValue(card) - (card.baseValue || 0);
}

function mostContributingPondCard() {
    return state.pond.reduce((best, card) => {
        if (!best || cardContribution(card) > cardContribution(best)) {
            return card;
        }

        return best;
    }, null);
}

function summaryCardText(card, mode = "value") {
    if (!card) {
        return "暂无";
    }

    if (mode === "star") {
        return `${card.name} ${card.star || 1}★`;
    }

    if (mode === "contribution") {
        return `${card.name} +${Math.max(0, cardContribution(card))}`;
    }

    return `${card.name} ${fishCardValue(card)}`;
}

function checkpointSummaryTemplate(totalValue, target, passed) {
    const bestValueCard = bestPondCard();
    const bestStarCard = highestStarPondCard();
    const bestContributionCard = mostContributingPondCard();
    const gap = totalValue - target;

    return `
        <div class="checkpoint-summary ${passed ? "is-pass" : "is-fail"}">
            <span>水族馆总价值</span>
            <strong>${totalValue}</strong>
            <span>目标 ${target} / ${passed ? `超出 ${gap}` : `缺少 ${Math.abs(gap)}`}</span>
        </div>
        <div class="run-summary">
            <div><span>天数</span><strong>${state.day}</strong></div>
            <div><span>鱼卡</span><strong>${state.pond.length}</strong></div>
            <div><span>捕获</span><strong>${state.stats.caught}</strong></div>
            <div><span>合成</span><strong>${state.stats.combined}</strong></div>
            <div><span>卖鱼</span><strong>${state.stats.soldFish}</strong></div>
            <div><span>钓鱼</span><strong>${state.stats.baitUsed}</strong></div>
            <div><span>金币</span><strong>${state.coins}G</strong></div>
            <div><span>最高价值鱼</span><strong>${summaryCardText(bestValueCard)}</strong></div>
            <div><span>最高星鱼</span><strong>${summaryCardText(bestStarCard, "star")}</strong></div>
            <div><span>最有贡献鱼</span><strong>${summaryCardText(bestContributionCard, "contribution")}</strong></div>
        </div>
    `;
}

function fishingCost() {
    const baitId = baitIdForLevel(state.baitLevel);
    const cost = EFFECTS.modifyNumberWithCards(
        effectSources(),
        "modifyFishingCost",
        BASE_FISHING_COST,
        effectContext({ baitId })
    );

    return Math.max(0, Math.floor(cost));
}

function baseDailyCoinsForDay(day = state.day) {
    return BASE_DAILY_COINS + Math.floor(Math.max(0, day - 1) / 3);
}

function gainBaseDailyCoins() {
    const dailyCoins = baseDailyCoinsForDay();

    if (dailyCoins <= 0) {
        return;
    }

    state.coins += dailyCoins;
    addLog(`每日收入：获得 ${dailyCoins}G。`);
}

function startCurrentDay(options = {}) {
    gainBaseDailyCoins();

    if (options.growCards !== false) {
        growCardValuesForNewDay();
    }

    runOwnedCardsHook("onDayStart");
    runEventSystemHook("onDayStart");
}

function growCardValuesForNewDay() {
    ownedCards().forEach((card) => {
        const gain = dailyValueGain(card);
        addValueToCard(card, gain, { reason: "daily", sourceCard: card });
        runCardHook(card, "onDayValueGain", { card, gain });
    });
}

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

function hasAdjacentEmptyPondCell(card) {
    const cells = storageCells("pond");
    const occupied = pondOccupancy(card?.uid);

    return adjacentCellIndexes(card).some((cellIndex) => cells[cellIndex] && !occupied.has(cellIndex));
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

function setStatus(text) {
    elements.sceneStatus.textContent = text;
}

function restoreTripStatus() {
    setStatus("水族馆整理");
}

function currentPeriodAvailable() {
    return true;
}

function fishRaceLabel(fish) {
    if (!fish) {
        return "";
    }

    if (fish.race) {
        return fish.race;
    }

    if (fish.tribe) {
        return fish.tribe;
    }

    if (fish.archetype) {
        return DATA.archetypeLabels?.[fish.archetype] || fish.archetype;
    }

    return "";
}

function starSpecificEffectText(effectText, star) {
    const text = String(effectText || "").trim();

    if (!text) {
        return "";
    }

    const markers = [...text.matchAll(/(?:^|[。；;\s])([123])\s*星(?:效果)?\s*[:：]\s*/g)];

    if (markers.length === 0) {
        return text;
    }

    const target = String(Math.max(1, Math.min(3, Math.floor(star || 1))));
    const markerIndex = markers.findIndex((marker) => marker[1] === target);

    if (markerIndex < 0) {
        return text;
    }

    const start = markers[markerIndex].index + markers[markerIndex][0].length;
    const end = markers[markerIndex + 1]?.index ?? text.length;

    return text
        .slice(start, end)
        .replace(/^[。；;，,\s]+/, "")
        .trim() || text;
}

function currentEffectText(fish) {
    return starSpecificEffectText(fish?.effectText, cardStar(fish));
}

function cardDetailTemplate(fish) {
    const race = fishRaceLabel(fish);
    const effectText = currentEffectText(fish) || "暂无特殊效果。";
    const raceText = race ? `<p class="fish-detail-race">${race}</p>` : "";

    return `
        <div class="fish-detail">
            ${raceText}
            <p class="fish-detail-effect">${effectText}</p>
        </div>
    `;
}

function cardTemplate(fish, controls = "", expanded = false, options = {}) {
    const rarityColor = fish.rarityColor || DATA.rarityColors?.[fish.rarity] || "#8fb1c9";
    const star = Math.max(1, Math.floor(fish.star || 1));
    const starIcons = "★".repeat(star);
    const starClass = star >= 3 ? " is-rainbow" : "";
    const artClass = fish.art ? " has-art" : "";
    const artStyle = fish.art ? ` --fish-art:url('${fish.art}');` : "";
    const expandedClass = expanded ? " is-expanded" : "";

    return `
        <div class="fish-card${starClass}${artClass}${expandedClass}" style="--fish-color:${fish.color}; --rarity-color:${rarityColor};${artStyle}">
            <div class="fish-card-header">
                <strong class="fish-name">${fish.name}</strong>
                <span class="fish-stars" aria-label="${star}星">${starIcons}</span>
            </div>
            <div class="fish-sprite" aria-hidden="true"></div>
            <strong class="fish-value" aria-label="价值">${fishCardValue(fish)}</strong>
            ${expanded ? cardDetailTemplate(fish) : ""}
            ${options.hideAction ? "" : `<button class="card-action" type="button">出售 ${fishSellValue(fish)}G</button>`}
            ${controls}
        </div>
    `;
}

function emptySlotTemplate(index, locked) {
    if (locked) {
        return "";
    }

    return `
        <div class="slot-empty">
            <span>${index + 1}</span>
        </div>
    `;
}

function renderStorageGrid(grid, storage) {
    if (!grid) {
        return;
    }

    const cards = storageCards(storage);
    const cells = storageCells(storage);
    grid.innerHTML = "";
    grid.dataset.storage = storage;

    const cardByStartCell = new Map();
    const occupied = storage === "pond" ? pondOccupancy() : new Map();

    if (storage === "pond") {
        cards.forEach((fish, index) => {
            const start = Number.isFinite(fish.cellIndex) ? fish.cellIndex : index;
            fish.cellIndex = start;
            cardByStartCell.set(start, { fish, index });
        });
    } else {
        let cursor = 0;

        cards.forEach((fish, index) => {
            while (cursor < storageGridSize(storage) && !cells[cursor]) {
                cursor += 1;
            }
            cardByStartCell.set(cursor, { fish, index });
            cursor += cardSlotSize(fish, storage);
        });
    }

    for (let cellIndex = 0; cellIndex < storageGridSize(storage); cellIndex += 1) {
        const entry = cardByStartCell.get(cellIndex);
        const coveredEntry = occupied.get(cellIndex);
        const slot = document.createElement("article");
        slot.className = `slot ${cells[cellIndex] ? "slot-open" : "slot-locked-shell"}`;
        slot.dataset.storage = storage;
        slot.dataset.cellIndex = String(cellIndex);
        if (storage === "pond") {
            const position = cellPositionStyle(cellIndex);
            slot.style.gridColumn = String(position.column);
            slot.style.gridRow = String(position.row);
        }

        if (entry) {
            const slotSize = Math.min(cardSlotSize(entry.fish, storage), storageGridSize(storage) - cellIndex);
            const isSelected = state.selectedCard
                && state.selectedCard.storage === storage
                && state.selectedCard.uid === entry.fish.uid;
            const isCombined = state.combineHighlightUid === entry.fish.uid;
            const isPlaced = state.placementHighlightUid === entry.fish.uid;
            const isSelling = state.sellingCardUid === entry.fish.uid;
            slot.dataset.cardIndex = String(entry.index);
            slot.draggable = !state.decisionLocked;
            slot.classList.toggle("is-selected", isSelected);
            slot.classList.toggle("is-combined-result", isCombined);
            slot.classList.toggle("is-placed-result", isPlaced);
            slot.classList.toggle("is-selling", isSelling);
            if (storage === "pond") {
                const position = cellPositionStyle(cellIndex);
                slot.style.gridColumn = `${position.column} / span ${slotSize}`;
                slot.style.gridRow = String(position.row);
            } else {
                slot.style.gridColumn = `span ${slotSize}`;
            }
            slot.innerHTML = cardTemplate(entry.fish, "", false, { hideAction: true });
        } else if (coveredEntry && !coveredEntry.isStart) {
            slot.classList.add("slot-covered");
            slot.innerHTML = "";
        } else {
            slot.innerHTML = emptySlotTemplate(cellIndex, !cells[cellIndex]);
        }

        grid.appendChild(slot);
    }
}

function renderBaitRack() {
    elements.baitRack.innerHTML = "";
    const baitId = baitIdForLevel(state.baitLevel);
    const bait = DATA.baitTypes[baitId] || DATA.baitTypes.basic;
    elements.baitRack.classList.remove("is-trip-bait");
    elements.baitRack.classList.add("is-reserve-bait");

    const item = document.createElement("span");
    item.className = `bait-chip bait-${bait.id}`;
    item.style.setProperty("--bait-color", bait.color || "#f4f7fb");
    item.setAttribute("aria-label", bait.name);
    item.textContent = "";
    item.title = bait.name;
    elements.baitRack.appendChild(item);
}

function upgradeCost(storage) {
    const config = STORAGE[storage];
    const unlocked = unlockedCellCount(storage);
    return config.upgradeBaseCost + Math.max(0, unlocked - config.initialCells.length) * config.upgradeStep;
}

function coreUpgradeCost() {
    const baseCost = 5 + state.baitLevel;
    const threeDayDiscount = Math.floor(Math.max(0, state.day - 1) / 3);
    const discountedCost = Math.max(0, baseCost - threeDayDiscount);
    const modifiedCost = EFFECTS.modifyNumberWithCards(
        effectSources(),
        "modifyCoreUpgradeCost",
        discountedCost,
        effectContext({
            baseCost,
            threeDayDiscount,
            baitLevel: state.baitLevel
        })
    );

    return Math.max(0, Math.floor(modifiedCost));
}

function canUsePondUpgradeToday() {
    return state.day % 3 === 0 && state.pondUpgradeDay !== state.day;
}

function pondHasLockedCells() {
    return unlockedCellCount("pond") < storageGridSize("pond");
}

function renderButtons() {
    const coreCost = coreUpgradeCost();
    const fishCost = fishingCost();
    const maxBaitLevel = DATA.baitLevelOrder?.length || 6;
    const disabledBeforeStart = !state.gameStarted;
    const hasPendingCatch = state.catchChoices.length > 0;
    const baitStars = baitStarsText();

    if (hasPendingCatch) {
        elements.fishButton.textContent = "重选鱼获";
        elements.fishButton.disabled = disabledBeforeStart || state.decisionLocked;
    } else {
        elements.fishButton.textContent = `钓鱼 ${fishCost}G`;
        elements.fishButton.disabled = disabledBeforeStart || state.coins < fishCost || state.decisionLocked;
    }

    elements.advanceTimeButton.disabled = disabledBeforeStart || state.decisionLocked || hasPendingCatch;
    elements.upgradeCoreButton.textContent = state.baitLevel >= maxBaitLevel
        ? `饵料已满 ${baitStars}`
        : `升级饵料 ${baitStars} ${coreCost}G`;
    elements.upgradeCoreButton.disabled = disabledBeforeStart
        || state.baitLevel >= maxBaitLevel
        || state.coins < coreCost
        || state.decisionLocked
        || hasPendingCatch;
    elements.advanceTimeButton.textContent = "结束今天";
}

function baitStarsText() {
    const level = Math.max(1, Math.floor(state.baitLevel || 1));
    return "★".repeat(level);
}

function fishingChargeConfig() {
    const chargeWindow = { ...DEFAULT_CHARGE_WINDOW };

    runOwnedCardsHook("modifyFishingChargeWindow", { chargeWindow });

    chargeWindow.perfectStartMs = Math.max(0, Math.floor(chargeWindow.perfectStartMs));
    chargeWindow.perfectEndMs = Math.max(chargeWindow.perfectStartMs + 1, Math.floor(chargeWindow.perfectEndMs));
    chargeWindow.maxMs = Math.max(chargeWindow.perfectEndMs + 1, Math.floor(chargeWindow.maxMs));
    chargeWindow.rarityBonus = Math.max(0, Number(chargeWindow.rarityBonus) || 0);

    return chargeWindow;
}

function chargeResult(elapsedMs = 0) {
    const config = fishingChargeConfig();
    const elapsed = Math.max(0, Math.floor(elapsedMs));

    return {
        elapsedMs: elapsed,
        isPerfect: elapsed >= config.perfectStartMs && elapsed <= config.perfectEndMs,
        rarityBonus: config.rarityBonus,
        config
    };
}

function renderChargeMeter(progress = state.charge?.elapsedMs || 0) {
    if (!elements.chargeMeter || !elements.chargeFill || !elements.chargePerfectZone) {
        return;
    }

    const config = fishingChargeConfig();
    const clampedProgress = Math.max(0, Math.min(1, progress / config.maxMs));
    const perfectLeft = Math.max(0, Math.min(1, config.perfectStartMs / config.maxMs));
    const perfectRight = Math.max(perfectLeft, Math.min(1, config.perfectEndMs / config.maxMs));

    elements.chargeFill.style.transform = `scaleX(${clampedProgress})`;
    elements.chargePerfectZone.style.left = `${perfectLeft * 100}%`;
    elements.chargePerfectZone.style.width = `${(perfectRight - perfectLeft) * 100}%`;

    const result = chargeResult(progress);
    elements.chargeMeter.classList.toggle("is-charging", Boolean(state.charge?.isCharging));
    elements.chargeMeter.classList.toggle("is-perfect", Boolean(state.charge?.isCharging && result.isPerfect));
    elements.chargeHint.textContent = result.isPerfect ? "最佳区间" : "长按钓鱼";
}

function render() {
    const pondCapacity = effectiveCapacity("pond");
    const pondUsedSlots = storageUsedSlots(state.pond, "pond");
    const totalValue = pondTotalValue();

    elements.dayValue.textContent = String(state.day);
    elements.coinValue.textContent = String(state.coins);
    elements.pondCount.textContent = String(pondUsedSlots);
    elements.pondMax.textContent = String(pondCapacity);
    elements.pondValue.textContent = String(totalValue);
    elements.checkpointTarget.textContent = String(nextCheckpointTarget());
    elements.pondCountSmall.textContent = String(pondUsedSlots);
    elements.pondMaxSmall.textContent = String(pondCapacity);
    elements.baitScopeLabel.textContent = "当前饵料";
    elements.baitCount.textContent = `Lv.${state.baitLevel}`;
    elements.baitLimit.textContent = "";
    document.body.classList.remove("is-at-sea");
    document.body.classList.toggle("has-selected-catch", Boolean(state.selectedCatchUid));
    document.body.classList.toggle("is-menu-open", !state.gameStarted);
    elements.mainMenu.hidden = state.gameStarted;

    renderBaitRack();
    renderStorageGrid(elements.pondGrid, "pond");
    renderCatchChoiceArea();
    renderButtons();
    renderChargeMeter();
}

function catchPickLimit(baitId, bait, choices) {
    const modified = EFFECTS.modifyNumberWithCards(
        effectSources(),
        "modifyCatchPickCount",
        1,
        effectContext({ baitId, bait, choices })
    );

    return Math.max(1, Math.min(choices.length, Math.floor(modified)));
}

function clearCatchChoices() {
    state.catchChoices = [];
    state.selectedCatchUid = null;
    state.catchPickLimit = 1;
    state.catchPicksRemaining = 0;
}

function placeFishInPond(fish, cellIndex) {
    const occupied = pondOccupancy();
    const target = occupied.get(cellIndex);
    const replaceUid = target?.card.uid || null;

    if (!canPlacePondAt(fish, cellIndex, replaceUid)) {
        addLog(`第 ${cellIndex + 1} 格空间不足，无法放入「${fish.name}」。`);
        return false;
    }

    if (target) {
        const removed = target.card;
        runCardHook(removed, "onReplaceOut", { card: removed, incomingCard: fish, source: "pond" });
        runCardHook(removed, "onDiscard", { card: removed, reason: "replaceFromPond" });
        state.pond = state.pond.filter((card) => card.uid !== removed.uid);
        state.stats.replaced += 1;
        state.stats.discarded += 1;
        runCardHook(fish, "onReplaceIn", { card: fish, removedCard: removed, source: "pond" });
        addLog(`「${fish.name}」放入第 ${cellIndex + 1} 格，替换了「${removed.name}」。`);
    } else {
        addLog(`「${fish.name}」放入水族馆第 ${cellIndex + 1} 格。`);
    }

    fish.cellIndex = cellIndex;
    state.pond.push(fish);
    state.pond.sort((left, right) => (left.cellIndex || 0) - (right.cellIndex || 0));
    state.stats.caught += 1;
    runOwnedCardsHook("onEnterPond", { card: fish, enteringCard: fish, reason: target ? "replace" : "catch" });
    runCardHook(fish, "onStoredAfterCatch", { caughtFish: fish, targetStorage: "pond" });
    state.placementHighlightUid = fish.uid;
    window.setTimeout(() => {
        if (state.placementHighlightUid === fish.uid) {
            state.placementHighlightUid = null;
            render();
        }
    }, 260);
    resolvePondCombines();
    return true;
}

function finishCatchPick(fish) {
    state.catchChoices = state.catchChoices.filter((choice) => choice.uid !== fish.uid);
    state.catchPicksRemaining -= 1;

    if (state.catchPicksRemaining <= 0) {
        state.catchChoices.forEach((choice) => {
            runCardHook(choice, "onDiscard", { card: choice, reason: "notChosenAfterCatch" });
        });
        clearCatchChoices();
        setStatus("水族馆整理");
        addLog("本次鱼获选择完成，未选择的鱼已放回水里。");
        return;
    }

    state.selectedCatchUid = null;
    setStatus(`继续选择鱼获 ${state.catchPicksRemaining}/${state.catchPickLimit}`);
    window.setTimeout(openCatchChoiceDecision, 0);
}

function renderCatchChoiceArea() {
    if (!elements.catchChoiceArea) {
        return;
    }

    elements.catchChoiceArea.innerHTML = "";

    if (state.catchChoices.length === 0) {
        const empty = document.createElement("div");
        empty.className = "catch-choice-empty";
        empty.innerHTML = "<strong>暂无鱼获</strong><span>支付金币钓鱼后，会在这里出现 3 条鱼。</span>";
        elements.catchChoiceArea.appendChild(empty);
        return;
    }

    state.catchChoices.forEach((fish, index) => {
        const isSelected = state.selectedCatchUid === fish.uid;
        const card = document.createElement("article");
        card.className = `catch-choice-card ${isSelected ? "is-selected" : ""}`;
        card.style.setProperty("--choice-index", String(index));
        card.tabIndex = 0;
        card.innerHTML = cardTemplate(fish, "", false);
        card.addEventListener("click", () => {
            state.selectedCatchUid = isSelected ? null : fish.uid;
            setStatus(state.selectedCatchUid ? "点击水族馆格子" : "选择鱼获");
            render();
        });
        elements.catchChoiceArea.appendChild(card);
    });
}

function chooseCatchFish(fish) {
    state.selectedCatchUid = fish.uid;
    closeDecision();
    setStatus("点击水族馆格子");
    addLog(`已选择「${fish.name}」，点击水族馆格子放入。`);
    render();
}

function openCatchChoiceDecision() {
    if (state.catchChoices.length === 0) {
        return;
    }

    state.decisionLocked = true;
    elements.decisionModal.hidden = false;
    elements.decisionModal.classList.add("catch-choice-modal");
    elements.decisionTitle.textContent = "选择本次鱼获";
    elements.decisionCopy.textContent = `本次可选择 ${state.catchPicksRemaining}/${state.catchPickLimit} 条鱼放入水族馆。`;
    elements.decisionPreview.innerHTML = "";
    elements.decisionOptions.innerHTML = "";
    elements.decisionOptions.classList.add("catch-choice-grid");

    state.catchChoices.forEach((fish, index) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "catch-choice-pick";
        option.style.setProperty("--choice-index", String(index));
        option.innerHTML = cardTemplate(fish, "", true, { hideAction: true });
        option.addEventListener("click", () => chooseCatchFish(fish));
        elements.decisionOptions.appendChild(option);
    });

    render();
}

function catchFish() {
    return catchFishWithCharge(chargeResult(0));
}

function catchFishWithCharge(charge = chargeResult(0)) {
    const fishCost = fishingCost();

    if (state.coins < fishCost || state.decisionLocked || state.catchChoices.length > 0) {
        return;
    }

    const baitId = baitIdForLevel(state.baitLevel);
    const bait = DATA.baitTypes[baitId] || DATA.baitTypes.basic;
    state.coins -= fishCost;
    runEventSystemHook("onCatchStart", { baitId, bait, day: state.day });
    state.currentCatchCharge = charge;
    const choices = drawCatchChoices(baitId);
    runEventSystemHook("onCatchChoice", { baitId, bait, choices, day: state.day, charge });
    state.currentCatchCharge = null;
    state.stats.baitUsed += 1;
    state.dailyCatchCount += 1;
    state.catchChoices = choices;
    state.catchPickLimit = catchPickLimit(baitId, bait, choices);
    state.catchPicksRemaining = state.catchPickLimit;
    state.selectedCatchUid = null;
    elements.lastCatch.textContent = "等待放入";
    elements.pixelScene.classList.add("is-catching");
    setStatus("选择鱼获");
    addLog(`支付 ${fishCost}G 使用${bait.name}钓鱼，钓上 3 条鱼，可选择 ${state.catchPickLimit} 条放入水族馆。`);
    if (charge.isPerfect) {
        addLog(`蓄力命中最佳区间，本次高品质鱼权重小幅提高。`);
    }

    window.setTimeout(() => {
        elements.pixelScene.classList.remove("is-catching");
    }, 700);

    render();
    openCatchChoiceDecision();
}

function handleFishButtonClick() {
    if (state.decisionLocked) {
        return;
    }

    if (state.catchChoices.length > 0) {
        openCatchChoiceDecision();
        return;
    }

    catchFish();
}

let suppressFishClickUntil = 0;

function canStartFishingCharge() {
    return state.gameStarted
        && !state.decisionLocked
        && state.catchChoices.length === 0
        && state.coins >= fishingCost();
}

function startFishingCharge(event) {
    if (event.pointerType === "mouse" && event.button !== 0) {
        return;
    }

    if (!canStartFishingCharge()) {
        return;
    }

    event.preventDefault();
    elements.fishButton.setPointerCapture?.(event.pointerId);
    state.charge.isCharging = true;
    state.charge.startedAt = performance.now();
    state.charge.elapsedMs = 0;
    state.charge.pointerId = event.pointerId;
    elements.fishButton.classList.add("is-charging");
    updateFishingCharge();
}

function updateFishingCharge() {
    if (!state.charge.isCharging) {
        return;
    }

    const config = fishingChargeConfig();
    state.charge.elapsedMs = Math.min(performance.now() - state.charge.startedAt, config.maxMs);
    renderChargeMeter(state.charge.elapsedMs);
    state.charge.rafId = window.requestAnimationFrame(updateFishingCharge);
}

function stopFishingCharge(event, options = {}) {
    if (!state.charge.isCharging) {
        return false;
    }

    if (event && state.charge.pointerId !== null && event.pointerId !== state.charge.pointerId) {
        return false;
    }

    window.cancelAnimationFrame(state.charge.rafId);
    const elapsed = state.charge.elapsedMs || Math.max(0, performance.now() - state.charge.startedAt);
    const result = chargeResult(elapsed);

    state.charge.isCharging = false;
    state.charge.startedAt = 0;
    state.charge.elapsedMs = 0;
    state.charge.rafId = null;
    state.charge.pointerId = null;
    elements.fishButton.classList.remove("is-charging");
    renderChargeMeter(0);

    if (event) {
        suppressFishClickUntil = performance.now() + 350;
        event.preventDefault();
    }

    if (!options.cancel) {
        catchFishWithCharge(result);
    }

    return true;
}

function cancelFishingCharge(event) {
    stopFishingCharge(event, { cancel: true });
}

function handleFishButtonPointerUp(event) {
    if (stopFishingCharge(event)) {
        return;
    }

    if (!state.decisionLocked && state.catchChoices.length > 0) {
        suppressFishClickUntil = performance.now() + 350;
        event.preventDefault();
        openCatchChoiceDecision();
    }
}

function handleFishButtonFallbackClick() {
    if (performance.now() < suppressFishClickUntil) {
        return;
    }

    handleFishButtonClick();
}

function closeDecision() {
    state.decisionLocked = false;
    elements.decisionModal.hidden = true;
    elements.decisionModal.classList.remove("catch-choice-modal");
    elements.decisionModal.classList.remove("card-detail-modal");
    elements.decisionModal.classList.remove("tutorial-modal");
    elements.decisionOptions.innerHTML = "";
    elements.decisionPreview.innerHTML = "";
    elements.decisionOptions.classList.remove("upgrade-cell-grid");
    elements.decisionOptions.classList.remove("catch-choice-grid");
    elements.decisionOptions.classList.remove("catch-replace-grid");
    elements.decisionOptions.classList.remove("card-detail-actions");
    elements.decisionOptions.classList.remove("tutorial-actions");
}

function tutorialTemplate() {
    return `
        <div class="tutorial-guide">
            <section>
                <h3>目标</h3>
                <p>经营你的水族馆，让馆内鱼卡的总价值不断成长。每 3 天结束时会进行一次价值检查，达到目标才能继续本轮。</p>
            </section>
            <section>
                <h3>每日行动</h3>
                <p>每天可以花费金币钓鱼。钓鱼会出现 3 张鱼卡，选择其中 1 张，再点击水族馆格子放入。部分鱼卡效果可以让你一次选择更多鱼。</p>
            </section>
            <section>
                <h3>饵料等级</h3>
                <p>饵料等级用星星表示。星数越高，钓到高品质鱼卡的概率越高。升级饵料需要金币，部分鱼卡会改变钓鱼费用或升级费用。</p>
            </section>
            <section>
                <h3>水族馆格子</h3>
                <p>鱼卡只能放进已解锁的鱼缸格子。每 3 天结算通过后，会获得一次免费扩建水族馆的机会。</p>
            </section>
            <section>
                <h3>价值与出售</h3>
                <p>鱼卡右下角的数字是当前价值。鱼卡在新一天开始时会自然成长，也可能被其他鱼卡效果强化。点击水族馆里的鱼卡，可以查看详情或出售。</p>
            </section>
            <section>
                <h3>合成</h3>
                <p>水族馆内出现 3 张同名同星鱼卡时会自动合成，保留第一张的位置并提升 1 星。更高星级通常意味着更强效果。</p>
            </section>
        </div>
    `;
}

function openTutorialDecision() {
    if (state.decisionLocked) {
        return;
    }

    state.decisionLocked = true;
    elements.decisionModal.hidden = false;
    elements.decisionModal.classList.add("tutorial-modal");
    elements.decisionTitle.textContent = "新手教程";
    elements.decisionCopy.textContent = "先理解每天该做什么，再开始你的水族馆构筑。";
    elements.decisionPreview.innerHTML = tutorialTemplate();
    elements.decisionOptions.innerHTML = "";
    elements.decisionOptions.classList.add("tutorial-actions");

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "decision-option";
    closeButton.innerHTML = "<strong>知道了</strong><span>返回主菜单</span>";
    closeButton.addEventListener("click", closeDecision);
    elements.decisionOptions.appendChild(closeButton);
}

function advanceTime() {
    if (!state.gameStarted || state.decisionLocked || state.catchChoices.length > 0) {
        return;
    }

    if (shouldResolveCheckpoint()) {
        openCheckpointDecision();
        return;
    }

    completeDayAdvance();
}

function shouldResolveCheckpoint() {
    return state.day % 3 === 0 && state.lastCheckpointDay !== state.day;
}

function continueAfterCheckpoint() {
    if (canUsePondUpgradeToday() && pondHasLockedCells()) {
        openPondUpgradeAtDayEnd();
        return;
    }

    completeDayAdvance();
}

function openCheckpointDecision() {
    const totalValue = pondTotalValue();
    const target = checkpointTargetForDay(state.day);
    const passed = totalValue >= target;
    runEventSystemHook("onCheckpoint", { totalValue, target, passed });
    state.decisionLocked = true;
    state.lastCheckpointDay = state.day;
    elements.decisionModal.hidden = false;
    elements.decisionTitle.textContent = passed ? "三日结算达标" : "三日结算失败";
    elements.decisionCopy.textContent = passed
        ? `第 ${state.day} 天结束，水族馆总价值 ${totalValue}/${target}，可以继续航行。`
        : `第 ${state.day} 天结束，水族馆总价值 ${totalValue}/${target}，未达到标准，本轮结束。`;
    elements.decisionPreview.innerHTML = checkpointSummaryTemplate(totalValue, target, passed);
    elements.decisionOptions.innerHTML = "";

    const primaryButton = document.createElement("button");
    primaryButton.type = "button";
    primaryButton.className = passed ? "decision-option" : "decision-option decision-danger";
    primaryButton.innerHTML = passed
        ? "<strong>继续</strong><span>进入结算后的扩建或下一天</span>"
        : "<strong>重新开始</strong><span>使用当前模式重新开始一轮</span>";
    primaryButton.addEventListener("click", () => {
        closeDecision();
        if (passed) {
            continueAfterCheckpoint();
            return;
        }

        resetGame(state.modeId, true);
    });
    elements.decisionOptions.appendChild(primaryButton);

    if (!passed) {
        const menuButton = document.createElement("button");
        menuButton.type = "button";
        menuButton.className = "decision-option";
        menuButton.innerHTML = "<strong>返回主菜单</strong><span>重新选择模式</span>";
        menuButton.addEventListener("click", () => {
            closeDecision();
            resetGame(state.modeId, false);
        });
        elements.decisionOptions.appendChild(menuButton);
    }

    render();
}

function completeDayAdvance() {
    state.day += 1;
    state.dailyCatchCount = 0;
    resetDailyCardState();
    clearCatchChoices();
    startCurrentDay();
    setStatus("新的一天");
    addLog(`第 ${state.day} 天开始，当前钓鱼费用 ${fishingCost()}G。`);
    if (isCheckpointEve()) {
        addLog(`结算提醒：明天结束需要水族馆总价值达到 ${nextCheckpointTarget()}，当前为 ${pondTotalValue()}。`);
    }
    render();
}

function openPondUpgradeAtDayEnd() {
    const cells = storageCells("pond");
    state.decisionLocked = true;
    elements.decisionModal.hidden = false;
    elements.decisionTitle.textContent = "水族馆扩建";
    elements.decisionCopy.textContent = `第 ${state.day} 天结束，免费选择 1 个水族馆格解锁。`;
    elements.decisionPreview.innerHTML = "";
    elements.decisionOptions.innerHTML = "";
    elements.decisionOptions.classList.add("upgrade-cell-grid");

    cells.forEach((enabled, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `upgrade-cell ${enabled ? "is-unlocked" : ""}`;
        button.disabled = enabled;
        button.textContent = enabled ? "已开" : String(index + 1);
        button.addEventListener("click", () => {
            cells[index] = true;
            state.pondUpgradeDay = state.day;
            closeDecision();
            elements.decisionOptions.classList.remove("upgrade-cell-grid");
            addLog(`第 ${state.day} 天结束，水族馆免费扩建第 ${index + 1} 格。`);
            completeDayAdvance();
        });
        elements.decisionOptions.appendChild(button);
    });

    render();
}

function openCoreUpgrade() {
    const cost = coreUpgradeCost();
    const maxBaitLevel = DATA.baitLevelOrder?.length || 6;

    if (
        state.decisionLocked
        || state.coins < cost
        || state.baitLevel >= maxBaitLevel
    ) {
        return;
    }

    state.coins -= cost;
    state.baitLevel = Math.min(maxBaitLevel, state.baitLevel + 1);
    addLog(`饵料升级：之后购买和每日获得的饵料提升到 Lv.${state.baitLevel}。`);
    render();
}

function findPondCombinableGroups() {
    const groups = new Map();

    state.pond.forEach((card, index) => {
        const key = `${card.id}::${card.star || 1}`;
        const group = groups.get(key) || {
            key,
            id: card.id,
            name: card.name,
            star: card.star || 1,
            refs: []
        };
        group.refs.push({ storage: "pond", index, card });
        groups.set(key, group);
    });

    return [...groups.values()].filter((group) => group.refs.length >= 3);
}

function removeCardByUid(uid) {
    for (const storage of ["backpack", "pond"]) {
        const cards = storageCards(storage);
        const index = cards.findIndex((card) => card.uid === uid);

        if (index >= 0) {
            return {
                storage,
                index,
                card: cards.splice(index, 1)[0]
            };
        }
    }

    return null;
}

function createCombinedCard(group) {
    const sourceCards = group.refs.slice(0, 3).map((ref) => ref.card);
    const baseCard = sourceCards[0];

    return {
        ...baseCard,
        effects: Array.isArray(baseCard.effects) ? baseCard.effects.map((effect) => ({ ...effect })) : [],
        uid: `${baseCard.id}-star-${group.star + 1}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        star: group.star + 1,
        value: sourceCards.reduce((sum, card) => sum + (card.value || 0), 0),
        valueGainedToday: 0,
        dailyCounters: {},
        cellIndex: sourceCards[0].cellIndex
    };
}

function combinePondGroup(group) {
    const materialRefs = group.refs.slice(0, 3);
    const firstIndex = materialRefs[0].index;
    const combined = createCombinedCard(group);
    const materialUids = new Set(materialRefs.map((ref) => ref.card.uid));

    state.pond = state.pond.filter((card) => !materialUids.has(card.uid));
    state.pond.splice(Math.min(firstIndex, state.pond.length), 0, combined);
    runOwnedCardsHook("onCombineResult", { combinedCard: combined, materialCards: materialRefs.map((ref) => ref.card) });
    state.stats.combined += 1;
    state.combineHighlightUid = combined.uid;
    setStatus(`${combined.name} 合成 ${combined.star}★`);
    addLog(`合成闪光：三张「${combined.name}」变为 ${combined.star}★，总价值 ${fishCardValue(combined)}，保留在第 ${firstIndex + 1} 位。`);

    window.setTimeout(() => {
        if (state.combineHighlightUid === combined.uid) {
            state.combineHighlightUid = null;
            render();
        }
    }, 1800);
}

function resolvePondCombines() {
    let combined = false;

    while (true) {
        const group = findPondCombinableGroups()[0];

        if (!group) {
            break;
        }

        combinePondGroup(group);
        combined = true;
    }

    if (combined) {
        render();
    }
}

function sellFish(source, index) {
    if (state.decisionLocked || state.sellingCardUid) {
        return;
    }

    const collection = storageCards(source);
    const fish = collection[index];

    if (!fish) {
        return;
    }

    const sale = {
        source,
        index,
        value: fishSellValue(fish),
        cancelled: false
    };
    runOwnedCardsHook("onBeforeSell", { card: fish, sale });

    if (sale.cancelled) {
        addLog(`「${fish.name}」的出售被鱼卡效果阻止。`);
        render();
        return;
    }

    const soldUid = fish.uid;
    state.selectedCard = null;
    state.sellingCardUid = soldUid;
    state.decisionLocked = true;
    elements.shopPanel.classList.add("is-sale-pulse");
    render();

    window.setTimeout(() => {
        const currentCollection = storageCards(source);
        const currentIndex = currentCollection.findIndex((card) => card.uid === soldUid);

        if (currentIndex >= 0) {
            currentCollection.splice(currentIndex, 1);
            state.coins += sale.value;
            state.stats.soldFish += 1;
            runCardHook(fish, "onSell", { card: fish, sale });
            runOwnedCardsHook("onSell", { card: fish, sale });
            addLog(`卖出「${fish.name}」，获得 ${sale.value}G。`);
        }

        state.sellingCardUid = null;
        state.decisionLocked = false;
        elements.shopPanel.classList.remove("is-sale-pulse");
        render();
    }, 180);
}

function openCardDetailDecision(storage, index) {
    const fish = storageCards(storage)[index];

    if (!fish) {
        return;
    }

    state.decisionLocked = true;
    elements.decisionModal.hidden = false;
    elements.decisionModal.classList.add("card-detail-modal");
    elements.decisionTitle.textContent = fish.name;
    elements.decisionCopy.textContent = `${fishCardValue(fish)} 价值 / 出售 ${fishSellValue(fish)}G`;
    elements.decisionPreview.innerHTML = cardTemplate(fish, "", true, { hideAction: true });
    elements.decisionOptions.innerHTML = "";
    elements.decisionOptions.classList.add("card-detail-actions");

    const sellButton = document.createElement("button");
    sellButton.type = "button";
    sellButton.className = "decision-option decision-danger";
    sellButton.innerHTML = `<strong>出售</strong><span>获得 ${fishSellValue(fish)}G，并空出水族馆格子</span>`;
    sellButton.addEventListener("click", () => {
        closeDecision();
        sellFish(storage, index);
    });
    elements.decisionOptions.appendChild(sellButton);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "decision-option";
    closeButton.innerHTML = "<strong>关闭</strong><span>保留这张鱼卡</span>";
    closeButton.addEventListener("click", () => {
        closeDecision();
        render();
    });
    elements.decisionOptions.appendChild(closeButton);

    render();
}

function handleCardClick(event, storage) {
    const action = event.target.closest(".card-action");
    const slot = event.target.closest(".slot");

    if (!slot || state.decisionLocked) {
        return;
    }

    if (storage === "pond" && state.selectedCatchUid) {
        const fish = state.catchChoices.find((choice) => choice.uid === state.selectedCatchUid);
        const cellIndex = Number(slot.dataset.cellIndex);

        if (fish && Number.isFinite(cellIndex) && placeFishInPond(fish, cellIndex)) {
            elements.lastCatch.textContent = fish.name;
            finishCatchPick(fish);
            render();
        }
        return;
    }

    if (!slot.dataset.cardIndex) {
        return;
    }

    const index = Number(slot.dataset.cardIndex);
    const card = storageCards(storage)[index];

    if (!card) {
        return;
    }

    if (action) {
        sellFish(storage, index);
        return;
    }

    openCardDetailDecision(storage, index);
}

function moveCard(source, sourceIndex, target, targetIndex) {
    if (state.decisionLocked) {
        return;
    }

    const fromCards = storageCards(source);
    const toCards = storageCards(target);

    if (source === "pond") {
        addLog("水族馆内鱼卡位置已固定，只能拖到商店卖出。");
        render();
        return;
    }

    const [card] = fromCards.splice(sourceIndex, 1);

    if (!card) {
        render();
        return;
    }

    if (!canStoreCard(toCards, effectiveCapacity(target), card, target)) {
        fromCards.splice(sourceIndex, 0, card);
        addLog(`${STORAGE[target].label}空间不足，无法移动「${card.name}」。`);
        render();
        return;
    }

    let insertAt = targetIndex;

    if (source === target && sourceIndex < targetIndex) {
        insertAt -= 1;
    }

    insertAt = Math.max(0, Math.min(insertAt, toCards.length));
    toCards.splice(insertAt, 0, card);

    if (target === "pond") {
        runOwnedCardsHook("onEnterPond", { card, enteringCard: card, reason: "manualMove" });
        resolvePondCombines();
    }

    addLog(`「${card.name}」已移动到${STORAGE[target].label}。`);
    render();
}

function handleDragStart(event) {
    const slot = event.target.closest(".slot[data-card-index]");

    if (!slot || state.decisionLocked) {
        event.preventDefault();
        return;
    }

    state.dragData = {
        source: slot.dataset.storage,
        index: Number(slot.dataset.cardIndex)
    };
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify(state.dragData));
    slot.classList.add("is-dragging");
}

function handleDragEnd(event) {
    event.target.closest(".slot")?.classList.remove("is-dragging");
    elements.shopPanel.classList.remove("is-drop-target");
    state.dragData = null;
}

function handleStorageDrop(event, target) {
    event.preventDefault();
    const raw = event.dataTransfer.getData("text/plain");
    const dragData = raw ? JSON.parse(raw) : state.dragData;

    if (!dragData) {
        return;
    }

    const slot = event.target.closest(".slot");
    const targetIndex = slot?.dataset.cardIndex
        ? Number(slot.dataset.cardIndex)
        : storageCards(target).length;
    moveCard(dragData.source, dragData.index, target, targetIndex);
}

function handleShopDrop(event) {
    event.preventDefault();
    elements.shopPanel.classList.remove("is-drop-target");
    const raw = event.dataTransfer.getData("text/plain");
    const dragData = raw ? JSON.parse(raw) : state.dragData;

    if (dragData) {
        sellFish(dragData.source, dragData.index);
    }
}

function bindStorageDrag(grid, storage) {
    grid.addEventListener("click", (event) => handleCardClick(event, storage));
    grid.addEventListener("dragstart", handleDragStart);
    grid.addEventListener("dragend", handleDragEnd);
    grid.addEventListener("dragover", (event) => {
        if (state.dragData) {
            event.preventDefault();
        }
    });
    grid.addEventListener("drop", (event) => handleStorageDrop(event, storage));
}

function setSelectedMode(modeId) {
    state.modeId = modeId;
    elements.modeButtons.forEach((button) => {
        button.classList.toggle("is-selected", button.dataset.modeId === modeId);
    });
}

function setSelectedCharacter(characterId) {
    state.characterId = characterId;
    const character = activeCharacter();
    elements.characterButtons.forEach((button) => {
        const buttonCharacter = DATA.characters?.[button.dataset.characterId];
        const avatar = button.querySelector(".character-avatar");
        button.classList.toggle("is-selected", button.dataset.characterId === characterId);

        if (avatar && buttonCharacter?.avatar) {
            avatar.style.setProperty("--character-avatar", `url("${buttonCharacter.avatar}")`);
            avatar.classList.add("has-image");
            avatar.textContent = "";
        } else if (avatar && buttonCharacter) {
            avatar.style.removeProperty("--character-avatar");
            avatar.classList.remove("has-image");
            avatar.textContent = buttonCharacter.shortName || buttonCharacter.name.slice(0, 1);
        }
    });

    if (character?.art) {
        elements.characterPreviewArt.style.setProperty("--character-art", `url("${character.art}")`);
        elements.characterPreviewArt.classList.add("has-image");
        elements.characterPreviewArt.textContent = "";
    } else {
        elements.characterPreviewArt.style.removeProperty("--character-art");
        elements.characterPreviewArt.classList.remove("has-image");
        elements.characterPreviewArt.textContent = character?.shortName || "";
    }

    elements.characterPreviewName.textContent = character?.name || "未知角色";
    elements.characterPreviewTitle.textContent = character?.title || "";
    elements.characterPreviewPassive.textContent = character?.passiveText || "";
}

function resetGame(modeId = "standard", startImmediately = true, characterId = state.characterId || "tide") {
    const nextState = createInitialState(modeId, startImmediately, characterId);

    Object.keys(state).forEach((key) => {
        delete state[key];
    });
    Object.assign(state, nextState);

    elements.logList.innerHTML = "";
    elements.lastCatch.textContent = "暂无鱼卡";
    elements.pixelScene.classList.remove("is-catching", "is-casting");
    setStatus(startImmediately ? "在家准备" : "等待开始");
    setSelectedMode(modeId);
    setSelectedCharacter(characterId);
    render();

    if (startImmediately) {
        addLog(`${currentMode().name}开始：${activeCharacter().name} 开始经营水族馆，每三天检查一次总价值。`);
        startCurrentDay({ growCards: false });
        addLog(`第 ${state.day} 天开始，当前钓鱼费用 ${fishingCost()}G。`);
        render();
    }
}

elements.fishButton.addEventListener("pointerdown", startFishingCharge);
elements.fishButton.addEventListener("pointerup", handleFishButtonPointerUp);
elements.fishButton.addEventListener("pointercancel", cancelFishingCharge);
elements.fishButton.addEventListener("lostpointercapture", cancelFishingCharge);
elements.fishButton.addEventListener("click", handleFishButtonFallbackClick);
elements.advanceTimeButton.addEventListener("click", advanceTime);
elements.upgradeCoreButton.addEventListener("click", openCoreUpgrade);
elements.startGameButton.addEventListener("click", () => resetGame(state.modeId, true, state.characterId));
elements.tutorialButton.addEventListener("click", openTutorialDecision);
elements.modeButtons.forEach((button) => {
    button.addEventListener("click", () => setSelectedMode(button.dataset.modeId));
});
elements.characterButtons.forEach((button) => {
    button.addEventListener("click", () => setSelectedCharacter(button.dataset.characterId));
});
bindStorageDrag(elements.pondGrid, "pond");
elements.shopPanel.addEventListener("dragover", (event) => {
    if (state.dragData && !state.decisionLocked) {
        event.preventDefault();
        elements.shopPanel.classList.add("is-drop-target");
    }
});
elements.shopPanel.addEventListener("dragleave", () => {
    elements.shopPanel.classList.remove("is-drop-target");
});
elements.shopPanel.addEventListener("drop", handleShopDrop);

setSelectedMode(state.modeId);
setSelectedCharacter(state.characterId);
render();
addLog("原型已切换为按天钓鱼：鱼获直接选择水族馆格子放入。");

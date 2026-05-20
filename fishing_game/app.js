const DATA = window.FISHING_GAME_DATA;
const EFFECTS = window.FISHING_CARD_EFFECTS;

const elements = {
    mainMenu: document.getElementById("mainMenu"),
    startGameButton: document.getElementById("startGameButton"),
    modeButtons: [...document.querySelectorAll("[data-mode-id]")],
    characterButtons: [...document.querySelectorAll("[data-character-id]")],
    characterPreviewArt: document.getElementById("characterPreviewArt"),
    characterPreviewName: document.getElementById("characterPreviewName"),
    characterPreviewTitle: document.getElementById("characterPreviewTitle"),
    characterPreviewPassive: document.getElementById("characterPreviewPassive"),
    dayValue: document.getElementById("dayValue"),
    periodValue: document.getElementById("periodValue"),
    coinValue: document.getElementById("coinValue"),
    bagCount: document.getElementById("bagCount"),
    bagMax: document.getElementById("bagMax"),
    bagCountSmall: document.getElementById("bagCountSmall"),
    bagMaxSmall: document.getElementById("bagMaxSmall"),
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
    lastCatch: document.getElementById("lastCatch"),
    logList: document.getElementById("logList"),
    pixelScene: document.getElementById("pixelScene"),
    backpackGrid: document.getElementById("backpackGrid"),
    pondGrid: document.getElementById("pondGrid"),
    startTripButton: document.getElementById("startTripButton"),
    fishButton: document.getElementById("fishButton"),
    returnHomeButton: document.getElementById("returnHomeButton"),
    advanceTimeButton: document.getElementById("advanceTimeButton"),
    buyBaitButton: document.getElementById("buyBaitButton"),
    sellBaitButton: document.getElementById("sellBaitButton"),
    upgradeCoreButton: document.getElementById("upgradeCoreButton"),
    shopPanel: document.querySelector(".shop-panel"),
    decisionModal: document.getElementById("decisionModal"),
    decisionTitle: document.getElementById("decisionTitle"),
    decisionCopy: document.getElementById("decisionCopy"),
    decisionPreview: document.getElementById("decisionPreview"),
    decisionOptions: document.getElementById("decisionOptions")
};

const STORAGE = {
    backpack: {
        label: "背包",
        cardsKey: "backpack",
        cellsKey: "backpackCells",
        gridSize: 6,
        initialCells: [0, 1],
        upgradeBaseCost: 20,
        upgradeStep: 12
    },
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

const BAIT_CAPACITY = 10;
const INITIAL_BAIT_COUNT = 2;

function createInitialState(modeId = "standard", gameStarted = false, characterId = "tide") {
    return {
        gameStarted,
        modeId,
        characterId,
        day: 1,
        periodIndex: 0,
        coins: 0,
        baitLevel: 1,
        backpackCells: createInitialCells(STORAGE.backpack),
        pondCells: createInitialCells(STORAGE.pond),
        backpack: [],
        pond: [],
        reserveBait: createBaitStack("basic", INITIAL_BAIT_COUNT),
        tripBait: [],
        tripCatchCount: 0,
        pendingBaitSaleGold: 0,
        isAtSea: false,
        usedPeriods: {
            morning: false,
            afternoon: false,
            night: false
        },
        nightUnlocked: false,
        pondUpgradeDay: 0,
        pendingTransferIndex: 0,
        activeEvents: [],
        decisionLocked: false,
        dragData: null,
        selectedCard: null,
        lastCheckpointDay: 0,
        combineHighlightUid: null,
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
    return DATA.periods[state.periodIndex];
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
    return state[STORAGE[storage].cardsKey];
}

function storageCells(storage) {
    return state[STORAGE[storage].cellsKey];
}

function storageGridSize(storage) {
    return STORAGE[storage].gridSize;
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

function createFishInstance(template, baitId) {
    return {
        ...template,
        effects: Array.isArray(template.effects) ? template.effects.map((effect) => ({ ...effect })) : [],
        star: 1,
        value: template.baseValue || 1,
        uid: `${template.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        baitId
    };
}

function ownedCards() {
    return [...state.backpack, ...state.pond];
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
        addBaitToTrip,
        addBaitToReserve,
        baitIdForLevel,
        fishCardValue,
        ownedCards,
        activeCharacter,
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
        tripCatchCount: state.tripCatchCount
    });
    const availableWeights = normalizeRarityWeights(rarityWeights);
    const fallbackWeights = normalizeRarityWeights(bait.rarityWeights);
    const pickedWeight = weightedPick(availableWeights.length > 0 ? availableWeights : fallbackWeights);
    const rarity = pickedWeight?.rarity || "common";
    const candidates = DATA.fishPool.filter((fish) => fish.rarity === rarity);
    const template = candidates[Math.floor(Math.random() * candidates.length)] || DATA.fishPool[0];

    return createFishInstance(template, baitId);
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
    const baseGain = card.star || 1;
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
            <div><span>用饵</span><strong>${state.stats.baitUsed}</strong></div>
            <div><span>金币</span><strong>${state.coins}G</strong></div>
            <div><span>最高价值鱼</span><strong>${summaryCardText(bestValueCard)}</strong></div>
            <div><span>最高星鱼</span><strong>${summaryCardText(bestStarCard, "star")}</strong></div>
            <div><span>最有贡献鱼</span><strong>${summaryCardText(bestContributionCard, "contribution")}</strong></div>
        </div>
    `;
}

function baitCapacity() {
    const capacity = EFFECTS.modifyNumberWithCards(
        effectSources(),
        "modifyBaitCapacity",
        BAIT_CAPACITY,
        effectContext()
    );

    return Math.max(0, Math.floor(capacity));
}

function baitPurchaseCost() {
    const baitId = baitIdForLevel(state.baitLevel);
    const cost = EFFECTS.modifyNumberWithCards(
        effectSources(),
        "modifyBaitBuyCost",
        2,
        effectContext({ baitId })
    );

    return Math.max(0, Math.floor(cost));
}

function baitSellValue(baitId = baitIdForLevel(state.baitLevel)) {
    const value = EFFECTS.modifyNumberWithCards(
        effectSources(),
        "modifyBaitSellValue",
        2,
        effectContext({ baitId })
    );

    return Math.max(0, Math.floor(value));
}

function dailyBaitGain() {
    const baseGain = 2 + Math.floor(Math.max(0, state.day - 1) / 3);
    const gain = EFFECTS.modifyNumberWithCards(
        effectSources(),
        "modifyDailyBaitGain",
        baseGain,
        effectContext()
    );

    return Math.max(0, Math.floor(gain));
}

function addBaitToReserve(baitId, amount) {
    const normalizedBaitId = baitId === "fine" ? "blue" : baitId;
    const space = Math.max(0, baitCapacity() - state.reserveBait.length);
    const added = Math.min(space, Math.max(0, amount));

    for (let index = 0; index < added; index += 1) {
        state.reserveBait.push(normalizedBaitId);
    }

    return added;
}

function growCardValuesForNewDay() {
    ownedCards().forEach((card) => {
        const gain = dailyValueGain(card);
        card.value = (card.value || 0) + gain;
        runCardHook(card, "onDayValueGain", { card, gain });
    });
}

function addBaitToTrip(baitId, amount) {
    const normalizedBaitId = baitId === "fine" ? "blue" : baitId;
    for (let index = 0; index < amount; index += 1) {
        state.tripBait.push(normalizedBaitId);
    }
}

function baseTripBaits() {
    return [];
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
    const hook = storage === "backpack" ? "modifyBackpackCapacity" : "modifyPondCapacity";
    const capacity = EFFECTS.modifyNumberWithCards(
        ownedCards(),
        hook,
        unlockedCellCount(storage),
        effectContext({ storage })
    );

    return Math.max(Math.floor(capacity), storageUsedSlots(storageCards(storage), storage));
}

function canStoreCard(cards, capacity, card, storage, skipIndex = -1) {
    return storageUsedSlots(cards, storage, skipIndex) + cardSlotSize(card, storage) <= capacity;
}

function setStatus(text) {
    elements.sceneStatus.textContent = text;
}

function restoreTripStatus() {
    if (state.isAtSea) {
        setStatus(`${currentPeriod().label}出海`);
    }
}

function currentPeriodAvailable() {
    const period = currentPeriod();

    if (period.id === "night" && !state.nightUnlocked) {
        return false;
    }

    return !state.usedPeriods[period.id];
}

function cardDetailTemplate(fish) {
    return `
        <div class="fish-detail">
            <span>效果</span>
            <p>${fish.effectText || "暂无特殊效果。"}</p>
        </div>
    `;
}

function cardTemplate(fish, controls = "", expanded = false) {
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
            <button class="card-action" type="button">出售 ${fishSellValue(fish)}G</button>
            ${controls}
        </div>
    `;
}

function emptySlotTemplate(index, locked) {
    if (locked) {
        return `
            <div class="slot-empty slot-locked">
                <span>LOCK</span>
                <span>${String(index + 1).padStart(2, "0")}</span>
            </div>
        `;
    }

    return `
        <div class="slot-empty">
            <span>EMPTY</span>
            <span>${String(index + 1).padStart(2, "0")}</span>
        </div>
    `;
}

function renderStorageGrid(grid, storage) {
    const cards = storageCards(storage);
    const cells = storageCells(storage);
    grid.innerHTML = "";
    grid.dataset.storage = storage;

    const cardByStartCell = new Map();
    let cursor = 0;

    cards.forEach((fish, index) => {
        while (cursor < storageGridSize(storage) && !cells[cursor]) {
            cursor += 1;
        }
        cardByStartCell.set(cursor, { fish, index });
        cursor += cardSlotSize(fish, storage);
    });

    for (let cellIndex = 0; cellIndex < storageGridSize(storage); cellIndex += 1) {
        const entry = cardByStartCell.get(cellIndex);
        const slot = document.createElement("article");
        slot.className = `slot ${cells[cellIndex] ? "slot-open" : "slot-locked-shell"}`;
        slot.dataset.storage = storage;
        slot.dataset.cellIndex = String(cellIndex);

        if (entry) {
            const slotSize = Math.min(cardSlotSize(entry.fish, storage), storageGridSize(storage) - cellIndex);
            const isSelected = state.selectedCard
                && state.selectedCard.storage === storage
                && state.selectedCard.uid === entry.fish.uid;
            const isCombined = state.combineHighlightUid === entry.fish.uid;
            slot.dataset.cardIndex = String(entry.index);
            slot.draggable = !state.decisionLocked;
            slot.classList.toggle("is-selected", isSelected);
            slot.classList.toggle("is-combined-result", isCombined);
            slot.style.gridColumn = `span ${slotSize}`;
            slot.innerHTML = cardTemplate(entry.fish, "", isSelected);
        } else {
            slot.innerHTML = emptySlotTemplate(cellIndex, !cells[cellIndex]);
        }

        grid.appendChild(slot);
    }
}

function renderBaitRack() {
    elements.baitRack.innerHTML = "";
    const currentBaits = state.isAtSea ? state.tripBait : state.reserveBait;
    elements.baitRack.classList.toggle("is-trip-bait", state.isAtSea);
    elements.baitRack.classList.toggle("is-reserve-bait", !state.isAtSea);

    if (currentBaits.length === 0) {
        const empty = document.createElement("span");
        empty.className = "bait-empty";
        empty.textContent = state.isAtSea ? "饵料已用尽" : `库存 0/${baitCapacity()}`;
        elements.baitRack.appendChild(empty);
        return;
    }

    currentBaits.forEach((baitId) => {
        const bait = DATA.baitTypes[baitId] || DATA.baitTypes.basic;
        const item = document.createElement("span");
        item.className = `bait-chip bait-${bait.id}`;
        item.style.setProperty("--bait-color", bait.color || "#f4f7fb");
        item.setAttribute("aria-label", bait.name);
        item.textContent = "";
        item.title = bait.name;
        elements.baitRack.appendChild(item);
    });
}

function upgradeCost(storage) {
    const config = STORAGE[storage];
    const unlocked = unlockedCellCount(storage);
    return config.upgradeBaseCost + Math.max(0, unlocked - config.initialCells.length) * config.upgradeStep;
}

function coreUpgradeCost() {
    return 5 + state.baitLevel;
}

function canUsePondUpgradeToday() {
    return state.day % 3 === 0 && state.pondUpgradeDay !== state.day;
}

function pondHasLockedCells() {
    return unlockedCellCount("pond") < storageGridSize("pond");
}

function renderButtons() {
    const atSea = state.isAtSea;
    const available = currentPeriodAvailable();
    const coreCost = coreUpgradeCost();
    const baitCost = baitPurchaseCost();
    const baitCap = baitCapacity();
    const baitInventoryFull = state.reserveBait.length >= baitCap;
    const maxBaitLevel = DATA.baitLevelOrder?.length || 6;
    const disabledBeforeStart = !state.gameStarted;

    elements.startTripButton.disabled = disabledBeforeStart || atSea || !available || state.decisionLocked;
    elements.fishButton.disabled = disabledBeforeStart || !atSea || state.tripBait.length === 0 || state.decisionLocked;
    elements.returnHomeButton.disabled = disabledBeforeStart || !atSea || state.decisionLocked;
    elements.advanceTimeButton.disabled = disabledBeforeStart || atSea || state.decisionLocked;
    elements.buyBaitButton.textContent = `买饵料 ${baitCost}G`;
    elements.buyBaitButton.disabled = disabledBeforeStart || atSea || baitInventoryFull || state.coins < baitCost || state.decisionLocked;
    elements.sellBaitButton.textContent = state.pendingBaitSaleGold > 0
        ? `卖饵料 待收${state.pendingBaitSaleGold}G`
        : "卖饵料";
    elements.sellBaitButton.disabled = disabledBeforeStart || atSea || state.reserveBait.length === 0 || state.decisionLocked;
    elements.upgradeCoreButton.textContent = `升级补给 ${coreCost}G`;
    elements.upgradeCoreButton.disabled = disabledBeforeStart
        || atSea
        || state.baitLevel >= maxBaitLevel
        || state.coins < coreCost
        || state.decisionLocked;
    elements.advanceTimeButton.textContent = nextTimeLabel();
}

function render() {
    const period = currentPeriod();
    const backpackCapacity = effectiveCapacity("backpack");
    const pondCapacity = effectiveCapacity("pond");
    const backpackUsedSlots = storageUsedSlots(state.backpack, "backpack");
    const pondUsedSlots = storageUsedSlots(state.pond, "pond");
    const totalValue = pondTotalValue();

    elements.dayValue.textContent = String(state.day);
    elements.periodValue.textContent = period.label;
    elements.coinValue.textContent = String(state.coins);
    elements.bagCount.textContent = String(backpackUsedSlots);
    elements.bagMax.textContent = String(backpackCapacity);
    elements.bagCountSmall.textContent = String(backpackUsedSlots);
    elements.bagMaxSmall.textContent = String(backpackCapacity);
    elements.pondCount.textContent = String(pondUsedSlots);
    elements.pondMax.textContent = String(pondCapacity);
    elements.pondValue.textContent = String(totalValue);
    elements.checkpointTarget.textContent = String(nextCheckpointTarget());
    elements.pondCountSmall.textContent = String(pondUsedSlots);
    elements.pondMaxSmall.textContent = String(pondCapacity);
    elements.baitScopeLabel.textContent = state.isAtSea ? "本次出海" : "库存饵料";
    elements.baitCount.textContent = String(state.isAtSea ? state.tripBait.length : state.reserveBait.length);
    elements.baitLimit.textContent = state.isAtSea ? " 个" : `/${baitCapacity()}`;
    document.body.classList.toggle("is-at-sea", state.isAtSea);
    document.body.classList.toggle("is-menu-open", !state.gameStarted);
    elements.mainMenu.hidden = state.gameStarted;

    renderBaitRack();
    renderStorageGrid(elements.backpackGrid, "backpack");
    renderStorageGrid(elements.pondGrid, "pond");
    renderButtons();
}

function startTrip() {
    if (!currentPeriodAvailable()) {
        addLog("当前时段没有可用的出海机会。");
        return;
    }

    const period = currentPeriod();
    state.isAtSea = true;
    state.usedPeriods[period.id] = true;
    state.tripBait = [...baseTripBaits(), ...state.reserveBait];
    state.reserveBait = [];
    state.tripCatchCount = 0;
    state.selectedCard = null;
    runOwnedCardsHook("onTripStart", { period });
    elements.pixelScene.classList.remove("is-catching");
    elements.pixelScene.classList.add("is-casting");
    setStatus(`${period.label}出海`);
    addLog(`${period.label}出海开始，携带 ${state.tripBait.length} 个库存饵料。`);

    window.setTimeout(() => {
        elements.pixelScene.classList.remove("is-casting");
    }, 900);

    render();
}

function addCaughtFishToBackpack(fish) {
    state.backpack.push(fish);
    state.stats.caught += 1;
    runCardHook(fish, "onEnterBackpack", { card: fish, reason: "catch" });
    runCardHook(fish, "onStoredAfterCatch", { caughtFish: fish });
}

function replaceBackpackFish(incomingFish, index) {
    const removed = state.backpack[index];

    if (!removed) {
        return null;
    }

    runCardHook(removed, "onReplaceOut", { card: removed, incomingCard: incomingFish, source: "backpack" });
    runCardHook(removed, "onDiscard", { card: removed, reason: "replaceFromBackpack" });
    state.backpack[index] = incomingFish;
    state.stats.caught += 1;
    state.stats.replaced += 1;
    runCardHook(incomingFish, "onEnterBackpack", { card: incomingFish, reason: "replace" });
    runCardHook(incomingFish, "onReplaceIn", { card: incomingFish, removedCard: removed, source: "backpack" });
    runCardHook(incomingFish, "onStoredAfterCatch", { caughtFish: incomingFish });

    return removed;
}

function storeCaughtFish(fish) {
    if (canStoreCard(state.backpack, effectiveCapacity("backpack"), fish, "backpack")) {
        addCaughtFishToBackpack(fish);
        restoreTripStatus();
        render();
        return true;
    }

    openBackpackDecision(fish);
    return false;
}

function openCatchChoiceModal(choices) {
    state.decisionLocked = true;
    elements.decisionModal.hidden = false;
    elements.decisionModal.classList.add("catch-choice-modal");
    elements.decisionTitle.textContent = "本次鱼获";
    elements.decisionCopy.textContent = "点击鱼卡查看效果，再选择 1 条鱼放入背包。";
    elements.decisionPreview.innerHTML = "";
    elements.decisionOptions.classList.remove("catch-replace-grid");
    elements.decisionOptions.classList.add("catch-choice-grid");

    function chooseFish(fish) {
        elements.lastCatch.textContent = `${fish.name} / ${DATA.rarityLabels[fish.rarity]}`;
        if (canStoreCard(state.backpack, effectiveCapacity("backpack"), fish, "backpack")) {
            closeDecision();
            storeCaughtFish(fish);
            return;
        }

        openCatchReplacementOptions(fish, choices);
    }

    function renderChoices(expandedUid = null) {
        elements.decisionOptions.innerHTML = "";

        choices.forEach((fish) => {
            const card = document.createElement("article");
            const choiceIndex = choices.indexOf(fish);
            const expanded = expandedUid === fish.uid;
            card.className = `catch-choice-card ${expanded ? "is-expanded" : ""}`;
            card.style.setProperty("--choice-index", String(choiceIndex));
            card.tabIndex = 0;
            card.innerHTML = cardTemplate(
                fish,
                expanded ? `<button class="inline-card-action choose-catch-button" type="button">带走</button>` : "",
                expanded
            );
            card.addEventListener("click", (event) => {
                const chooseButton = event.target.closest(".choose-catch-button");

                if (chooseButton) {
                    event.stopPropagation();
                    chooseFish(fish);
                    return;
                }

                renderChoices(expanded ? null : fish.uid);
            });
            elements.decisionOptions.appendChild(card);
        });
    }

    renderChoices();
    render();
}

function openCatchReplacementOptions(incomingFish, choices) {
    elements.decisionTitle.textContent = "背包已满";
    elements.decisionCopy.textContent = "点击背包鱼卡查看效果，再选择要替换的鱼卡。";
    elements.decisionPreview.innerHTML = `
        <div class="replacement-preview-label">准备带走</div>
        ${cardTemplate(incomingFish, "", true)}
    `;
    elements.decisionOptions.innerHTML = "";
    elements.decisionOptions.classList.remove("catch-choice-grid");
    elements.decisionOptions.classList.add("catch-replace-grid");

    function renderReplaceOptions(expandedUid = null) {
        elements.decisionOptions.innerHTML = "";

        state.backpack.forEach((fish, index) => {
            const canReplace = canStoreCard(state.backpack, effectiveCapacity("backpack"), incomingFish, "backpack", index);
            const expanded = expandedUid === fish.uid;
            const card = document.createElement("article");
            card.className = `catch-replace-card ${expanded ? "is-expanded" : ""} ${canReplace ? "" : "is-disabled"}`;
            card.tabIndex = 0;
            card.innerHTML = `
                ${cardTemplate(
                    fish,
                    expanded
                        ? `<button class="inline-card-action replace-catch-button" type="button" ${canReplace ? "" : "disabled"}>${canReplace ? "替换这张" : "占格不足"}</button>`
                        : "",
                    expanded
                )}
            `;
            card.addEventListener("click", (event) => {
                const replaceButton = event.target.closest(".replace-catch-button");

                if (replaceButton) {
                    event.stopPropagation();
                    if (!canReplace) {
                        return;
                    }

                    const removed = replaceBackpackFish(incomingFish, index);
                    closeDecision();
                    addLog(`已用「${incomingFish.name}」替换背包中的「${removed.name}」。`);
                    restoreTripStatus();
                    render();
                    return;
                }

                renderReplaceOptions(expanded ? null : fish.uid);
            });
            elements.decisionOptions.appendChild(card);
        });

        const backButton = document.createElement("button");
        backButton.type = "button";
        backButton.className = "decision-option";
        backButton.innerHTML = "<strong>返回鱼获选择</strong><span>重新选择本次钓上的 3 条鱼</span>";
        backButton.addEventListener("click", () => {
            elements.decisionOptions.classList.remove("catch-replace-grid");
            openCatchChoiceModal(choices);
        });
        elements.decisionOptions.appendChild(backButton);

        const discardButton = document.createElement("button");
        discardButton.type = "button";
        discardButton.className = "decision-option decision-danger";
        discardButton.innerHTML = `<strong>放弃 ${incomingFish.name}</strong><span>保留现有背包，这条鱼直接丢失</span>`;
        discardButton.addEventListener("click", () => {
            runCardHook(incomingFish, "onDiscard", { card: incomingFish, reason: "backpackFull" });
            state.stats.discarded += 1;
            closeDecision();
            addLog(`背包已满，「${incomingFish.name}」未能入包，已经丢失。`);
            restoreTripStatus();
            render();
        });
        elements.decisionOptions.appendChild(discardButton);
    }

    renderReplaceOptions();
    render();
}

function catchFish() {
    if (!state.isAtSea || state.tripBait.length === 0 || state.decisionLocked) {
        return;
    }

    const baitId = state.tripBait.shift();
    const bait = DATA.baitTypes[baitId] || DATA.baitTypes.basic;
    runEventSystemHook("onCatchStart", { baitId, bait, period: currentPeriod() });
    const choices = drawCatchChoices(baitId);
    runEventSystemHook("onCatchChoice", { baitId, bait, choices, period: currentPeriod() });
    state.stats.baitUsed += 1;
    state.tripCatchCount += 1;
    elements.lastCatch.textContent = "等待选择";
    elements.pixelScene.classList.add("is-catching");
    setStatus("选择鱼获");
    addLog(`消耗 1 个${bait.name}，钓上 3 条鱼，请选择 1 条带走。`);

    window.setTimeout(() => {
        elements.pixelScene.classList.remove("is-catching");
    }, 700);

    openCatchChoiceModal(choices);
}

function returnHome() {
    if (!state.isAtSea || state.decisionLocked) {
        return;
    }

    const returnedBaits = state.tripBait.splice(0, Math.max(0, baitCapacity() - state.reserveBait.length));
    const lostBaitCount = state.tripBait.length;
    state.tripBait = [];
    state.reserveBait.push(...returnedBaits);
    state.isAtSea = false;
    state.pendingTransferIndex = 0;
    runOwnedCardsHook("onReturnHome");
    setStatus("回家整理");
    if (lostBaitCount > 0) {
        addLog(`船已靠岸，库存已满，${lostBaitCount} 个未用完的饵料丢失。`);
    } else {
        addLog(returnedBaits.length > 0
            ? `船已靠岸，未用完的 ${returnedBaits.length} 个饵料放回库存。`
            : "船已靠岸，开始把背包里的鱼卡放入水族馆。");
    }
    processPondTransfers();
    render();
}

function processPondTransfers() {
    while (state.pendingTransferIndex < state.backpack.length) {
        const fish = state.backpack[state.pendingTransferIndex];

        if (canStoreCard(state.pond, effectiveCapacity("pond"), fish, "pond")) {
            state.pond.push(fish);
            state.backpack.splice(state.pendingTransferIndex, 1);
            runCardHook(fish, "onEnterPond", { card: fish, reason: "returnHome" });
            addLog(`「${fish.name}」已放入水族馆。`);
            resolvePondCombines();
            continue;
        }

        openPondDecision(fish, state.pendingTransferIndex);
        return;
    }

    setStatus("在家准备");
    addLog("回家整理完成。");
    render();
}

function openBackpackDecision(incomingFish) {
    state.decisionLocked = true;
    elements.decisionModal.hidden = false;
    elements.decisionTitle.textContent = "背包已满";
    elements.decisionCopy.textContent = "选择一个背包鱼卡替换，或保留现有背包。未放入背包的新鱼卡会直接丢失。";
    elements.decisionPreview.innerHTML = cardTemplate(incomingFish);
    elements.decisionOptions.innerHTML = "";

    state.backpack.forEach((fish, index) => {
        const button = document.createElement("button");
        const canReplace = canStoreCard(state.backpack, effectiveCapacity("backpack"), incomingFish, "backpack", index);
        button.type = "button";
        button.className = "decision-option";
        button.disabled = !canReplace;
        button.innerHTML = canReplace
            ? `<strong>替换 ${fish.name}</strong><span>丢弃旧卡，放入 ${incomingFish.name}</span>`
            : `<strong>无法只替换 ${fish.name}</strong><span>${incomingFish.name} 占格过大，需要更多空格</span>`;
        button.addEventListener("click", () => {
            if (!canReplace) {
                return;
            }

            const removed = replaceBackpackFish(incomingFish, index);
            closeDecision();
            addLog(`已用「${incomingFish.name}」替换背包中的「${removed.name}」。`);
            restoreTripStatus();
            render();
        });
        elements.decisionOptions.appendChild(button);
    });

    const keepButton = document.createElement("button");
    keepButton.type = "button";
    keepButton.className = "decision-option decision-danger";
    keepButton.innerHTML = `<strong>保留现有背包</strong><span>${incomingFish.name} 未入包，直接丢失</span>`;
    keepButton.addEventListener("click", () => {
        runCardHook(incomingFish, "onDiscard", { card: incomingFish, reason: "backpackFull" });
        closeDecision();
        addLog(`背包已满，「${incomingFish.name}」未能入包，已经丢失。`);
        restoreTripStatus();
        render();
    });
    elements.decisionOptions.appendChild(keepButton);
    render();
}

function openPondDecision(fish, backpackIndex) {
    state.decisionLocked = true;
    elements.decisionModal.hidden = false;
    elements.decisionTitle.textContent = "水族馆已满";
    elements.decisionCopy.textContent = "选择一个水族馆鱼卡替换，或暂时把这张鱼继续留在背包里。";
    elements.decisionPreview.innerHTML = cardTemplate(fish);
    elements.decisionOptions.innerHTML = "";

    state.pond.forEach((pondFish, pondIndex) => {
        const button = document.createElement("button");
        const canReplace = canStoreCard(state.pond, effectiveCapacity("pond"), fish, "pond", pondIndex);
        button.type = "button";
        button.className = "decision-option";
        button.disabled = !canReplace;
        button.innerHTML = canReplace
            ? `<strong>替换 ${pondFish.name}</strong><span>${fish.name} 进入水族馆，旧鱼卡丢失</span>`
            : `<strong>无法只替换 ${pondFish.name}</strong><span>${fish.name} 占格过大，需要更多空格</span>`;
        button.addEventListener("click", () => {
            if (!canReplace) {
                return;
            }

            const removed = state.pond[pondIndex];
            runCardHook(removed, "onReplaceOut", { card: removed, incomingCard: fish, source: "pond" });
            runCardHook(removed, "onDiscard", { card: removed, reason: "replaceFromPond" });
            state.pond[pondIndex] = fish;
            state.backpack.splice(backpackIndex, 1);
            state.stats.replaced += 1;
            state.stats.discarded += 1;
            runCardHook(fish, "onEnterPond", { card: fish, reason: "replace" });
            runCardHook(fish, "onReplaceIn", { card: fish, removedCard: removed, source: "pond" });
            closeDecision();
            addLog(`「${fish.name}」进入水族馆，替换了「${removed.name}」。`);
            resolvePondCombines();
            processPondTransfers();
        });
        elements.decisionOptions.appendChild(button);
    });

    const keepButton = document.createElement("button");
    keepButton.type = "button";
    keepButton.className = "decision-option";
    keepButton.innerHTML = `<strong>留在背包</strong><span>水族馆不变，继续占用随身背包格子</span>`;
    keepButton.addEventListener("click", () => {
        state.pendingTransferIndex = backpackIndex + 1;
        closeDecision();
        addLog(`水族馆已满，「${fish.name}」暂时留在背包。`);
        processPondTransfers();
    });
    elements.decisionOptions.appendChild(keepButton);
    render();
}

function closeDecision() {
    state.decisionLocked = false;
    elements.decisionModal.hidden = true;
    elements.decisionModal.classList.remove("catch-choice-modal");
    elements.decisionOptions.innerHTML = "";
    elements.decisionPreview.innerHTML = "";
    elements.decisionOptions.classList.remove("upgrade-cell-grid");
    elements.decisionOptions.classList.remove("catch-choice-grid");
    elements.decisionOptions.classList.remove("catch-replace-grid");
}

function nextTimeLabel() {
    const period = currentPeriod();

    if (period.id === "morning") {
        return "进入下午";
    }

    if (period.id === "afternoon" && state.nightUnlocked) {
        return "进入晚上";
    }

    return "进入明天";
}

function advanceTime() {
    if (!state.gameStarted || state.isAtSea || state.decisionLocked) {
        return;
    }

    const period = currentPeriod();

    if (period.id === "morning") {
        runEventSystemHook("onPeriodEnd", { period });
        state.periodIndex = 1;
        runEventSystemHook("onPeriodStart", { period: currentPeriod() });
        setStatus("下午准备");
        addLog("时间推进到下午，获得第二次常规出海机会。");
        render();
        return;
    }

    if (period.id === "afternoon") {
        runOwnedCardsHook("onPeriodEnd", { period });
        runEventSystemHook("onPeriodEnd", { period });
    }

    if (period.id === "afternoon" && state.nightUnlocked) {
        state.periodIndex = 2;
        runEventSystemHook("onPeriodStart", { period: currentPeriod() });
        setStatus("夜航准备");
        addLog("夜航条件已满足，晚上可以额外出海一次。");
        render();
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
    state.periodIndex = 0;
    state.usedPeriods = {
        morning: false,
        afternoon: false,
        night: false
    };
    state.nightUnlocked = false;
    growCardValuesForNewDay();
    runOwnedCardsHook("onDayStart");
    runEventSystemHook("onDayStart");
    if (state.pendingBaitSaleGold > 0) {
        state.coins += state.pendingBaitSaleGold;
        addLog(`昨日卖出的饵料结算，获得 ${state.pendingBaitSaleGold}G。`);
        state.pendingBaitSaleGold = 0;
    }

    const dailyBaitId = baitIdForLevel(state.baitLevel);
    const dailyBait = DATA.baitTypes[dailyBaitId] || DATA.baitTypes.basic;
    const expectedDailyBait = dailyBaitGain();
    const addedDailyBait = addBaitToReserve(dailyBaitId, expectedDailyBait);
    setStatus("新的一天");
    addLog(`第 ${state.day} 天开始，上午出海机会已刷新，自动获得 ${addedDailyBait}/${expectedDailyBait} 个${dailyBait.name}。`);
    if (isCheckpointEve()) {
        addLog(`结算提醒：明天结束需要水族馆总价值达到 ${nextCheckpointTarget()}，当前为 ${pondTotalValue()}。`);
    }
    render();
}

function buyBait() {
    const baitId = baitIdForLevel(state.baitLevel);
    const cost = baitPurchaseCost();

    if (state.isAtSea || state.coins < cost || state.reserveBait.length >= baitCapacity()) {
        return;
    }

    state.coins -= cost;
    addBaitToReserve(baitId, 1);
    addLog(`购买 1 个${DATA.baitTypes[baitId].name}，会加入下次出海补给。`);
    render();
}

function sellBait() {
    if (state.isAtSea || state.decisionLocked || state.reserveBait.length === 0) {
        return;
    }

    const baitId = state.reserveBait.pop();
    const bait = DATA.baitTypes[baitId] || DATA.baitTypes.basic;
    const value = baitSellValue(baitId);
    state.pendingBaitSaleGold += value;
    addLog(`寄售 1 个${bait.name}，明天开始时结算 ${value}G。`);
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
    const cells = storageCells("backpack");
    const nextCellIndex = cells.findIndex((enabled) => !enabled);
    const maxBaitLevel = DATA.baitLevelOrder?.length || 6;

    if (
        state.isAtSea
        || state.decisionLocked
        || state.coins < cost
        || state.baitLevel >= maxBaitLevel
    ) {
        return;
    }

    state.coins -= cost;
    if (nextCellIndex >= 0) {
        cells[nextCellIndex] = true;
    }

    state.baitLevel = Math.min(maxBaitLevel, state.baitLevel + 1);
    addLog(nextCellIndex >= 0
        ? `补给升级：背包自动解锁第 ${nextCellIndex + 1} 格，饵料等级提升到 Lv.${state.baitLevel}。`
        : `补给升级：饵料等级提升到 Lv.${state.baitLevel}。`);
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
        value: sourceCards.reduce((sum, card) => sum + (card.value || 0), 0)
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
    if (state.isAtSea || state.decisionLocked) {
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

    collection.splice(index, 1);
    state.selectedCard = null;
    state.coins += sale.value;
    state.stats.soldFish += 1;
    runCardHook(fish, "onSell", { card: fish, sale });
    runOwnedCardsHook("onSell", { card: fish, sale });
    addLog(`卖出「${fish.name}」，获得 ${sale.value}G。`);
    render();
}

function handleCardClick(event, storage) {
    const action = event.target.closest(".card-action");
    const slot = event.target.closest(".slot[data-card-index]");

    if (!slot || state.decisionLocked) {
        return;
    }

    const index = Number(slot.dataset.cardIndex);
    const card = storageCards(storage)[index];

    if (!card) {
        return;
    }

    if (action) {
        if (state.isAtSea) {
            return;
        }

        sellFish(storage, index);
        return;
    }

    const isSameCard = state.selectedCard
        && state.selectedCard.storage === storage
        && state.selectedCard.uid === card.uid;

    state.selectedCard = isSameCard
        ? null
        : {
            storage,
            uid: card.uid
        };
    render();
}

function moveCard(source, sourceIndex, target, targetIndex) {
    if (state.isAtSea || state.decisionLocked) {
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
        runCardHook(card, "onEnterPond", { card, reason: "manualMove" });
        resolvePondCombines();
    }

    addLog(`「${card.name}」已移动到${STORAGE[target].label}。`);
    render();
}

function handleDragStart(event) {
    const slot = event.target.closest(".slot[data-card-index]");

    if (!slot || state.isAtSea || state.decisionLocked) {
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
        addLog(`${currentMode().name}开始：${activeCharacter().name} 登船，每三天检查一次水族馆总价值。`);
    }
}

elements.startTripButton.addEventListener("click", startTrip);
elements.fishButton.addEventListener("click", catchFish);
elements.returnHomeButton.addEventListener("click", returnHome);
elements.advanceTimeButton.addEventListener("click", advanceTime);
elements.buyBaitButton.addEventListener("click", buyBait);
elements.sellBaitButton.addEventListener("click", sellBait);
elements.upgradeCoreButton.addEventListener("click", openCoreUpgrade);
elements.startGameButton.addEventListener("click", () => resetGame(state.modeId, true, state.characterId));
elements.modeButtons.forEach((button) => {
    button.addEventListener("click", () => setSelectedMode(button.dataset.modeId));
});
elements.characterButtons.forEach((button) => {
    button.addEventListener("click", () => setSelectedCharacter(button.dataset.characterId));
});
bindStorageDrag(elements.backpackGrid, "backpack");
bindStorageDrag(elements.pondGrid, "pond");
elements.shopPanel.addEventListener("dragover", (event) => {
    if (state.dragData && !state.isAtSea && !state.decisionLocked) {
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
addLog("原型已切换为单屏鱼卡桌面：拖动鱼卡可排序，拖到商店出售。");

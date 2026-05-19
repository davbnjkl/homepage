const DATA = window.FISHING_GAME_DATA;
const EFFECTS = window.FISHING_CARD_EFFECTS;

const elements = {
    dayValue: document.getElementById("dayValue"),
    periodValue: document.getElementById("periodValue"),
    coinValue: document.getElementById("coinValue"),
    bagCount: document.getElementById("bagCount"),
    bagMax: document.getElementById("bagMax"),
    bagCountSmall: document.getElementById("bagCountSmall"),
    bagMaxSmall: document.getElementById("bagMaxSmall"),
    pondCount: document.getElementById("pondCount"),
    pondMax: document.getElementById("pondMax"),
    pondCountSmall: document.getElementById("pondCountSmall"),
    pondMaxSmall: document.getElementById("pondMaxSmall"),
    sceneStatus: document.getElementById("sceneStatus"),
    baitCount: document.getElementById("baitCount"),
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
    upgradeBaitButton: document.getElementById("upgradeBaitButton"),
    upgradeBagButton: document.getElementById("upgradeBagButton"),
    upgradePondButton: document.getElementById("upgradePondButton"),
    combineButton: document.getElementById("combineButton"),
    shopPanel: document.querySelector(".shop-panel"),
    decisionModal: document.getElementById("decisionModal"),
    decisionTitle: document.getElementById("decisionTitle"),
    decisionCopy: document.getElementById("decisionCopy"),
    decisionPreview: document.getElementById("decisionPreview"),
    decisionOptions: document.getElementById("decisionOptions")
};

const GRID_SIZE = 9;
const STORAGE = {
    backpack: {
        label: "背包",
        cardsKey: "backpack",
        cellsKey: "backpackCells",
        initialCells: [0, 1],
        upgradeBaseCost: 20,
        upgradeStep: 12
    },
    pond: {
        label: "鱼塘",
        cardsKey: "pond",
        cellsKey: "pondCells",
        initialCells: [0, 1, 3, 4],
        upgradeBaseCost: 25,
        upgradeStep: 15
    }
};

const state = {
    day: 1,
    periodIndex: 0,
    coins: 0,
    baitLevel: 1,
    backpackCells: createInitialCells(STORAGE.backpack.initialCells),
    pondCells: createInitialCells(STORAGE.pond.initialCells),
    backpack: [],
    pond: [],
    reserveBait: [],
    tripBait: [],
    isAtSea: false,
    usedPeriods: {
        morning: false,
        afternoon: false,
        night: false
    },
    nightUnlocked: false,
    pendingTransferIndex: 0,
    decisionLocked: false,
    dragData: null
};

function createInitialCells(enabledIndexes) {
    return Array.from({ length: GRID_SIZE }, (_, index) => enabledIndexes.includes(index));
}

function currentPeriod() {
    return DATA.periods[state.periodIndex];
}

function storageCards(storage) {
    return state[STORAGE[storage].cardsKey];
}

function storageCells(storage) {
    return state[STORAGE[storage].cellsKey];
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

function effectContext(extra = {}) {
    return {
        state,
        data: DATA,
        random: Math.random,
        addLog,
        addBaitToTrip,
        ownedCards,
        ...extra
    };
}

function runCardHook(card, hook, extra = {}) {
    EFFECTS.runCardHook(card, hook, effectContext(extra));
}

function runOwnedCardsHook(hook, extra = {}) {
    EFFECTS.runCardsHook(ownedCards(), hook, effectContext(extra));
}

function cardsForTargetModifiers(targetCard) {
    const cards = ownedCards();

    if (targetCard && !cards.some((card) => card.uid === targetCard.uid)) {
        cards.push(targetCard);
    }

    return cards;
}

function weightedPick(items) {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;

    for (const item of items) {
        roll -= item.weight;
        if (roll <= 0) {
            return item;
        }
    }

    return items[items.length - 1];
}

function drawFishByBait(baitId) {
    const bait = DATA.baitTypes[baitId] || DATA.baitTypes.basic;
    const rarityWeights = bait.rarityWeights.map((item) => ({ ...item }));
    runOwnedCardsHook("modifyBaitPool", { baitId, rarityWeights });
    const availableWeights = rarityWeights.filter((item) => item.weight > 0);
    const rarity = weightedPick(availableWeights.length > 0 ? availableWeights : bait.rarityWeights).rarity;
    const candidates = DATA.fishPool.filter((fish) => fish.rarity === rarity);
    const template = candidates[Math.floor(Math.random() * candidates.length)] || DATA.fishPool[0];

    return createFishInstance(template, baitId);
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

function growCardValuesForNewDay() {
    ownedCards().forEach((card) => {
        const gain = dailyValueGain(card);
        card.value = (card.value || 0) + gain;
        runCardHook(card, "onDayValueGain", { card, gain });
    });
}

function addBaitToTrip(baitId, amount) {
    for (let index = 0; index < amount; index += 1) {
        state.tripBait.push(baitId);
    }
}

function baseTripBaits() {
    if (state.baitLevel >= 3) {
        return ["fine", "fine", "fine"];
    }

    if (state.baitLevel === 2) {
        return ["fine", "basic", "basic"];
    }

    return ["basic", "basic", "basic"];
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

function currentPeriodAvailable() {
    const period = currentPeriod();

    if (period.id === "night" && !state.nightUnlocked) {
        return false;
    }

    return !state.usedPeriods[period.id];
}

function cardTemplate(fish, controls = "") {
    const rarityLabel = DATA.rarityLabels[fish.rarity] || fish.rarity;

    return `
        <div class="fish-card" style="--fish-color:${fish.color}; --rarity-color:${fish.rarityColor};">
            <div class="fish-card-header">
                <strong class="fish-name">${fish.name}</strong>
                <span class="fish-rarity">${rarityLabel} ${fish.star || 1}★</span>
            </div>
            <div class="fish-sprite" aria-hidden="true"></div>
            <div class="fish-meta">
                <span>价值</span>
                <strong>${fish.value || 0}</strong>
            </div>
            <div class="fish-meta">
                <span>售价</span>
                <strong>${fishSellValue(fish)}G</strong>
            </div>
            <div class="fish-meta">
                <span>占格</span>
                <strong>${cardSlotSize(fish, "card")}</strong>
            </div>
            <p class="fish-effect">${fish.effectText}</p>
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
        while (cursor < GRID_SIZE && !cells[cursor]) {
            cursor += 1;
        }
        cardByStartCell.set(cursor, { fish, index });
        cursor += cardSlotSize(fish, storage);
    });

    for (let cellIndex = 0; cellIndex < GRID_SIZE; cellIndex += 1) {
        const entry = cardByStartCell.get(cellIndex);
        const slot = document.createElement("article");
        slot.className = `slot ${cells[cellIndex] ? "slot-open" : "slot-locked-shell"}`;
        slot.dataset.storage = storage;
        slot.dataset.cellIndex = String(cellIndex);

        if (entry) {
            const slotSize = Math.min(cardSlotSize(entry.fish, storage), GRID_SIZE - cellIndex);
            slot.dataset.cardIndex = String(entry.index);
            slot.draggable = !state.decisionLocked;
            slot.style.gridColumn = `span ${slotSize}`;
            slot.innerHTML = cardTemplate(entry.fish);
        } else {
            slot.innerHTML = emptySlotTemplate(cellIndex, !cells[cellIndex]);
        }

        grid.appendChild(slot);
    }
}

function renderBaitRack() {
    elements.baitRack.innerHTML = "";

    if (state.tripBait.length === 0) {
        const empty = document.createElement("span");
        empty.className = "bait-empty";
        empty.textContent = state.isAtSea ? "饵料已用尽" : `备用 ${state.reserveBait.length}`;
        elements.baitRack.appendChild(empty);
        return;
    }

    state.tripBait.forEach((baitId) => {
        const bait = DATA.baitTypes[baitId] || DATA.baitTypes.basic;
        const item = document.createElement("span");
        item.className = `bait-chip bait-${bait.id}`;
        item.textContent = bait.shortName;
        item.title = bait.name;
        elements.baitRack.appendChild(item);
    });
}

function upgradeCost(storage) {
    const config = STORAGE[storage];
    const unlocked = unlockedCellCount(storage);
    return config.upgradeBaseCost + Math.max(0, unlocked - config.initialCells.length) * config.upgradeStep;
}

function baitUpgradeCost() {
    return 18 + (state.baitLevel - 1) * 18;
}

function renderButtons() {
    const atSea = state.isAtSea;
    const available = currentPeriodAvailable();
    const bagCost = upgradeCost("backpack");
    const pondCost = upgradeCost("pond");
    const baitCost = baitUpgradeCost();
    const canUpgradePondToday = state.day % 3 === 0;

    elements.startTripButton.disabled = atSea || !available || state.decisionLocked;
    elements.fishButton.disabled = !atSea || state.tripBait.length === 0 || state.decisionLocked;
    elements.returnHomeButton.disabled = !atSea || state.decisionLocked;
    elements.advanceTimeButton.disabled = atSea || state.decisionLocked;
    elements.buyBaitButton.disabled = atSea || state.coins < 5 || state.decisionLocked;
    elements.upgradeBaitButton.textContent = `升级饵料 ${baitCost}G`;
    elements.upgradeBaitButton.disabled = atSea || state.baitLevel >= 3 || state.coins < baitCost || state.decisionLocked;
    elements.upgradeBagButton.textContent = `升级背包 ${bagCost}G`;
    elements.upgradeBagButton.disabled = atSea || unlockedCellCount("backpack") >= GRID_SIZE || state.coins < bagCost || state.decisionLocked;
    elements.upgradePondButton.textContent = canUpgradePondToday ? `升级鱼塘 ${pondCost}G` : "鱼塘三天升级";
    elements.upgradePondButton.disabled = atSea || !canUpgradePondToday || unlockedCellCount("pond") >= GRID_SIZE || state.coins < pondCost || state.decisionLocked;
    elements.combineButton.disabled = atSea || state.decisionLocked || findCombinableGroups().length === 0;
    elements.advanceTimeButton.textContent = nextTimeLabel();
}

function render() {
    const period = currentPeriod();
    const backpackCapacity = effectiveCapacity("backpack");
    const pondCapacity = effectiveCapacity("pond");
    const backpackUsedSlots = storageUsedSlots(state.backpack, "backpack");
    const pondUsedSlots = storageUsedSlots(state.pond, "pond");

    elements.dayValue.textContent = String(state.day);
    elements.periodValue.textContent = period.label;
    elements.coinValue.textContent = String(state.coins);
    elements.bagCount.textContent = String(backpackUsedSlots);
    elements.bagMax.textContent = String(backpackCapacity);
    elements.bagCountSmall.textContent = String(backpackUsedSlots);
    elements.bagMaxSmall.textContent = String(backpackCapacity);
    elements.pondCount.textContent = String(pondUsedSlots);
    elements.pondMax.textContent = String(pondCapacity);
    elements.pondCountSmall.textContent = String(pondUsedSlots);
    elements.pondMaxSmall.textContent = String(pondCapacity);
    elements.baitCount.textContent = String(state.tripBait.length);

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
    runOwnedCardsHook("onTripStart", { period });
    elements.pixelScene.classList.remove("is-catching");
    elements.pixelScene.classList.add("is-casting");
    setStatus(`${period.label}出海`);
    addLog(`${period.label}出海开始，获得 3 个基础饵料。`);

    window.setTimeout(() => {
        elements.pixelScene.classList.remove("is-casting");
    }, 900);

    render();
}

function storeCaughtFish(fish) {
    if (canStoreCard(state.backpack, effectiveCapacity("backpack"), fish, "backpack")) {
        state.backpack.push(fish);
        runCardHook(fish, "onEnterBackpack", { card: fish, reason: "catch" });
        runCardHook(fish, "onStoredAfterCatch", { caughtFish: fish });
        render();
        return;
    }

    openBackpackDecision(fish);
}

function catchFish() {
    if (!state.isAtSea || state.tripBait.length === 0 || state.decisionLocked) {
        return;
    }

    const baitId = state.tripBait.shift();
    const bait = DATA.baitTypes[baitId] || DATA.baitTypes.basic;
    const fish = drawFishByBait(baitId);
    elements.lastCatch.textContent = `${fish.name} / ${DATA.rarityLabels[fish.rarity]}`;
    elements.pixelScene.classList.add("is-catching");
    setStatus("捕获鱼卡");
    addLog(`消耗 1 个${bait.name}，捕获 ${DATA.rarityLabels[fish.rarity]}鱼卡「${fish.name}」。`);

    window.setTimeout(() => {
        elements.pixelScene.classList.remove("is-catching");
    }, 700);

    storeCaughtFish(fish);
}

function returnHome() {
    if (!state.isAtSea || state.decisionLocked) {
        return;
    }

    state.isAtSea = false;
    state.tripBait = [];
    state.pendingTransferIndex = 0;
    runOwnedCardsHook("onReturnHome");
    setStatus("回家整理");
    addLog("船已靠岸，开始把背包里的鱼卡放入家里鱼塘。");
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
            addLog(`「${fish.name}」已放入家里鱼塘。`);
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

            const removed = state.backpack[index];
            runCardHook(removed, "onReplaceOut", { card: removed, incomingCard: incomingFish, source: "backpack" });
            runCardHook(removed, "onDiscard", { card: removed, reason: "replaceFromBackpack" });
            state.backpack[index] = incomingFish;
            runCardHook(incomingFish, "onEnterBackpack", { card: incomingFish, reason: "replace" });
            runCardHook(incomingFish, "onReplaceIn", { card: incomingFish, removedCard: removed, source: "backpack" });
            runCardHook(incomingFish, "onStoredAfterCatch", { caughtFish: incomingFish });
            closeDecision();
            addLog(`已用「${incomingFish.name}」替换背包中的「${removed.name}」。`);
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
        render();
    });
    elements.decisionOptions.appendChild(keepButton);
    render();
}

function openPondDecision(fish, backpackIndex) {
    state.decisionLocked = true;
    elements.decisionModal.hidden = false;
    elements.decisionTitle.textContent = "鱼塘已满";
    elements.decisionCopy.textContent = "选择一个鱼塘鱼卡替换，或暂时把这张鱼继续留在背包里。";
    elements.decisionPreview.innerHTML = cardTemplate(fish);
    elements.decisionOptions.innerHTML = "";

    state.pond.forEach((pondFish, pondIndex) => {
        const button = document.createElement("button");
        const canReplace = canStoreCard(state.pond, effectiveCapacity("pond"), fish, "pond", pondIndex);
        button.type = "button";
        button.className = "decision-option";
        button.disabled = !canReplace;
        button.innerHTML = canReplace
            ? `<strong>替换 ${pondFish.name}</strong><span>${fish.name} 进入鱼塘，旧鱼卡丢失</span>`
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
            runCardHook(fish, "onEnterPond", { card: fish, reason: "replace" });
            runCardHook(fish, "onReplaceIn", { card: fish, removedCard: removed, source: "pond" });
            closeDecision();
            addLog(`「${fish.name}」进入鱼塘，替换了「${removed.name}」。`);
            processPondTransfers();
        });
        elements.decisionOptions.appendChild(button);
    });

    const keepButton = document.createElement("button");
    keepButton.type = "button";
    keepButton.className = "decision-option";
    keepButton.innerHTML = `<strong>留在背包</strong><span>鱼塘不变，继续占用随身背包格子</span>`;
    keepButton.addEventListener("click", () => {
        state.pendingTransferIndex = backpackIndex + 1;
        closeDecision();
        addLog(`鱼塘已满，「${fish.name}」暂时留在背包。`);
        processPondTransfers();
    });
    elements.decisionOptions.appendChild(keepButton);
    render();
}

function closeDecision() {
    state.decisionLocked = false;
    elements.decisionModal.hidden = true;
    elements.decisionOptions.innerHTML = "";
    elements.decisionPreview.innerHTML = "";
    elements.decisionOptions.classList.remove("upgrade-cell-grid");
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
    if (state.isAtSea || state.decisionLocked) {
        return;
    }

    const period = currentPeriod();

    if (period.id === "morning") {
        state.periodIndex = 1;
        setStatus("下午准备");
        addLog("时间推进到下午，获得第二次常规出海机会。");
        render();
        return;
    }

    if (period.id === "afternoon" && state.nightUnlocked) {
        state.periodIndex = 2;
        setStatus("夜航准备");
        addLog("夜航条件已满足，晚上可以额外出海一次。");
        render();
        return;
    }

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
    setStatus("新的一天");
    addLog(`第 ${state.day} 天开始，上午出海机会已刷新。`);
    render();
}

function buyBait() {
    const baitId = state.baitLevel >= 2 ? "fine" : "basic";
    const cost = state.baitLevel >= 2 ? 12 : 5;

    if (state.isAtSea || state.coins < cost) {
        return;
    }

    state.coins -= cost;
    state.reserveBait.push(baitId);
    addLog(`购买 1 个${DATA.baitTypes[baitId].name}，会加入下次出海补给。`);
    render();
}

function upgradeBait() {
    const cost = baitUpgradeCost();

    if (state.isAtSea || state.baitLevel >= 3 || state.coins < cost) {
        return;
    }

    state.coins -= cost;
    state.baitLevel += 1;
    addLog(`饵料补给升级到 Lv.${state.baitLevel}。`);
    render();
}

function openStorageUpgrade(storage) {
    const config = STORAGE[storage];
    const cost = upgradeCost(storage);
    const cells = storageCells(storage);

    if (state.isAtSea || state.decisionLocked || state.coins < cost || unlockedCellCount(storage) >= GRID_SIZE) {
        return;
    }

    if (storage === "pond" && state.day % 3 !== 0) {
        addLog("鱼塘只能在第 3、6、9... 天升级。");
        return;
    }

    state.decisionLocked = true;
    elements.decisionModal.hidden = false;
    elements.decisionTitle.textContent = `升级${config.label}`;
    elements.decisionCopy.textContent = `花费 ${cost}G，在 3x3 范围内选择 1 个未解锁格子。`;
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
            state.coins -= cost;
            cells[index] = true;
            closeDecision();
            elements.decisionOptions.classList.remove("upgrade-cell-grid");
            addLog(`${config.label}解锁了第 ${index + 1} 格。`);
            render();
        });
        elements.decisionOptions.appendChild(button);
    });

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "decision-option decision-danger upgrade-cancel";
    cancel.innerHTML = "<strong>取消升级</strong><span>不消耗金币</span>";
    cancel.addEventListener("click", () => {
        closeDecision();
        elements.decisionOptions.classList.remove("upgrade-cell-grid");
        render();
    });
    elements.decisionOptions.appendChild(cancel);
    render();
}

function allStoredCardRefs() {
    return ["backpack", "pond"].flatMap((storage) => (
        storageCards(storage).map((card, index) => ({ storage, index, card }))
    ));
}

function findCombinableGroups() {
    const groups = new Map();

    allStoredCardRefs().forEach((ref) => {
        const key = `${ref.card.id}::${ref.card.star || 1}`;
        const group = groups.get(key) || {
            key,
            id: ref.card.id,
            name: ref.card.name,
            star: ref.card.star || 1,
            refs: []
        };
        group.refs.push(ref);
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

function combineGroup(group) {
    const firstRef = group.refs[0];
    const removed = group.refs.slice(0, 3)
        .map((ref) => removeCardByUid(ref.card.uid))
        .filter(Boolean);
    const combined = createCombinedCard({ ...group, refs: removed });
    const targetCards = storageCards(firstRef.storage);
    const insertIndex = Math.min(firstRef.index, targetCards.length);

    if (!canStoreCard(targetCards, effectiveCapacity(firstRef.storage), combined, firstRef.storage)) {
        const fallbackStorage = firstRef.storage === "backpack" ? "pond" : "backpack";

        if (!canStoreCard(storageCards(fallbackStorage), effectiveCapacity(fallbackStorage), combined, fallbackStorage)) {
            removed.forEach((ref) => storageCards(ref.storage).splice(ref.index, 0, ref.card));
            addLog("合成后的鱼卡没有可用空间，合成取消。");
            render();
            return;
        }

        storageCards(fallbackStorage).push(combined);
        addLog(`三张「${combined.name}」合成为 ${combined.star}★，已放入${STORAGE[fallbackStorage].label}。`);
        render();
        return;
    }

    targetCards.splice(insertIndex, 0, combined);
    addLog(`三张「${combined.name}」合成为 ${combined.star}★，价值变为 ${combined.value}。`);
    render();
}

function openCombineModal() {
    const groups = findCombinableGroups();

    if (groups.length === 0 || state.isAtSea || state.decisionLocked) {
        addLog("当前没有三张同名同星的鱼卡可以合成。");
        return;
    }

    state.decisionLocked = true;
    elements.decisionModal.hidden = false;
    elements.decisionTitle.textContent = "合成鱼卡";
    elements.decisionCopy.textContent = "选择三张同名同星鱼卡，合成为一张星数 +1 的鱼卡。新卡价值继承三张材料的价值总和。";
    elements.decisionPreview.innerHTML = "";
    elements.decisionOptions.innerHTML = "";

    groups.forEach((group) => {
        const totalValue = group.refs
            .slice(0, 3)
            .reduce((sum, ref) => sum + (ref.card.value || 0), 0);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "decision-option";
        button.innerHTML = `<strong>${group.name} ${group.star}★ ×3</strong><span>合成为 ${group.star + 1}★，新价值 ${totalValue}</span>`;
        button.addEventListener("click", () => {
            closeDecision();
            combineGroup(group);
        });
        elements.decisionOptions.appendChild(button);
    });

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "decision-option decision-danger";
    cancel.innerHTML = "<strong>取消合成</strong><span>保留现有鱼卡</span>";
    cancel.addEventListener("click", () => {
        closeDecision();
        render();
    });
    elements.decisionOptions.appendChild(cancel);
    render();
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
    state.coins += sale.value;
    runCardHook(fish, "onSell", { card: fish, sale });
    runOwnedCardsHook("onSell", { card: fish, sale });
    addLog(`卖出「${fish.name}」，获得 ${sale.value}G。`);
    render();
}

function moveCard(source, sourceIndex, target, targetIndex) {
    if (state.isAtSea || state.decisionLocked) {
        return;
    }

    const fromCards = storageCards(source);
    const toCards = storageCards(target);
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
    grid.addEventListener("dragstart", handleDragStart);
    grid.addEventListener("dragend", handleDragEnd);
    grid.addEventListener("dragover", (event) => {
        if (state.dragData) {
            event.preventDefault();
        }
    });
    grid.addEventListener("drop", (event) => handleStorageDrop(event, storage));
}

elements.startTripButton.addEventListener("click", startTrip);
elements.fishButton.addEventListener("click", catchFish);
elements.returnHomeButton.addEventListener("click", returnHome);
elements.advanceTimeButton.addEventListener("click", advanceTime);
elements.buyBaitButton.addEventListener("click", buyBait);
elements.upgradeBaitButton.addEventListener("click", upgradeBait);
elements.upgradeBagButton.addEventListener("click", () => openStorageUpgrade("backpack"));
elements.upgradePondButton.addEventListener("click", () => openStorageUpgrade("pond"));
elements.combineButton.addEventListener("click", openCombineModal);
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

render();
addLog("原型已切换为单屏鱼卡桌面：拖动鱼卡可排序，拖到商店出售。");

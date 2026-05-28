// Split from app.js: 10 core utils.
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

    const startValue = card.value || 0;
    card.value = (card.value || 0) + gain;
    card.valueGainedToday = (card.valueGainedToday || 0) + gain;
    queueValueAnimation(card, gain, startValue, card.value);
    markEffectHighlight([card, options.sourceCard]);

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

function markEffectHighlight(cards) {
    const uids = [...new Set(cards.filter(Boolean).map((card) => card.uid).filter(Boolean))];

    if (uids.length === 0) {
        return;
    }

    state.effectHighlightUids = [...new Set([...state.effectHighlightUids, ...uids])];
    window.setTimeout(() => {
        state.effectHighlightUids = state.effectHighlightUids.filter((uid) => !uids.includes(uid));
        render();
    }, 420);
}

function valueAnimationDuration(gain) {
    return Math.min(1500, 180 + Math.max(1, gain) * 70);
}

function valueAnimationDisplayValue(startValue, finalValue, elapsed, duration) {
    const progress = Math.min(1, elapsed / Math.max(1, duration));

    if (progress >= 0.88) {
        return finalValue;
    }

    const range = Math.max(4, finalValue - startValue + 5);
    const base = startValue + Math.floor((finalValue - startValue) * progress);
    const jitter = Math.floor(Math.random() * range);

    return Math.max(0, Math.min(finalValue + range, base + jitter));
}

function updateValueAnimationDisplay(uid, value) {
    document.querySelectorAll(".fish-card").forEach((cardElement) => {
        if (cardElement.dataset.cardUid !== uid) {
            return;
        }

        const valueNumber = cardElement.querySelector(".fish-value-number");
        if (valueNumber) {
            valueNumber.textContent = value;
        }
    });
}

function queueValueAnimation(card, gain, startValue, finalValue) {
    if (!card?.uid || !state.valueAnimations) {
        return;
    }

    const previous = state.valueAnimations[card.uid];
    const totalGain = (previous?.gain || 0) + gain;
    const animationStartValue = previous?.startValue ?? startValue;
    const duration = valueAnimationDuration(totalGain);
    const startedAt = Date.now();

    state.valueAnimations[card.uid] = {
        gain: totalGain,
        startValue: animationStartValue,
        finalValue,
        displayValue: animationStartValue,
        duration,
        startedAt,
        until: startedAt + duration
    };

    if (valueAnimationTimers.has(card.uid)) {
        window.clearTimeout(valueAnimationTimers.get(card.uid));
    }

    if (valueAnimationIntervals.has(card.uid)) {
        window.clearInterval(valueAnimationIntervals.get(card.uid));
    }

    valueAnimationIntervals.set(card.uid, window.setInterval(() => {
        const animation = state.valueAnimations?.[card.uid];

        if (!animation) {
            window.clearInterval(valueAnimationIntervals.get(card.uid));
            valueAnimationIntervals.delete(card.uid);
            return;
        }

        const elapsed = Date.now() - animation.startedAt;
        animation.displayValue = valueAnimationDisplayValue(animation.startValue, animation.finalValue, elapsed, animation.duration);
        updateValueAnimationDisplay(card.uid, animation.displayValue);
    }, 55));

    valueAnimationTimers.set(card.uid, window.setTimeout(() => {
        if (state.valueAnimations?.[card.uid]?.until <= Date.now()) {
            if (valueAnimationIntervals.has(card.uid)) {
                window.clearInterval(valueAnimationIntervals.get(card.uid));
                valueAnimationIntervals.delete(card.uid);
            }
            updateValueAnimationDisplay(card.uid, state.valueAnimations[card.uid].finalValue);
            delete state.valueAnimations[card.uid];
            valueAnimationTimers.delete(card.uid);
            render();
        }
    }, duration + 40));
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
        pondCellIndex,
        pondCellInfo,
        pondCardsInCells,
        pondCardsInSameLine,
        pondCardAtCell,
        pondEmptyCells,
        adjacentEmptyPondCells,
        adjacentPondCards,
        hasAdjacentEmptyPondCell,
        isPondFull,
        movePondCard,
        swapPondCards,
        moveReward,
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

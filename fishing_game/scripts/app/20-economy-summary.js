// Split from app.js: 20 economy summary.
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

function moveReward(baseValue, targetCard, sourceCard = null, reason = "") {
    const reward = EFFECTS.modifyNumberWithCards(
        effectSources(),
        "modifyMoveReward",
        baseValue,
        effectContext({ targetCard, sourceCard, reason })
    );

    return Math.max(0, Math.floor(reward));
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
    pulseCoinChange();
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

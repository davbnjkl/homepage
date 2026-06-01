// Split from app.js: 50 fishing.
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

function sellReplacedPondFish(removed, incomingCard, cellIndex) {
    const sale = {
        source: "pond",
        index: state.pond.findIndex((card) => card.uid === removed.uid),
        value: fishSellValue(removed),
        cancelled: false,
        reason: "replace"
    };

    runOwnedCardsHook("onBeforeSell", { card: removed, sale, replacingWith: incomingCard, soldCellIndex: cellIndex });

    if (sale.cancelled) {
        addLog(`「${removed.name}」的出售被鱼卡效果阻止，无法替换。`);
        return false;
    }

    state.pond = state.pond.filter((card) => card.uid !== removed.uid);
    state.coins += sale.value;
    pulseCoinChange();
    pulseShopPanel();
    state.stats.soldFish += 1;
    state.dailySoldFishCount += 1;
    runCardHook(removed, "onSell", { card: removed, sale, soldCellIndex: cellIndex, replacedBy: incomingCard });
    runOwnedCardsHook("onSell", { card: removed, sale, soldCellIndex: cellIndex, replacedBy: incomingCard });
    runOwnedCardsHook("onFishSold", { card: removed, soldCard: removed, sale, soldCellIndex: cellIndex, replacedBy: incomingCard });
    addLog(`替换出售「${removed.name}」，获得 ${sale.value}G。`);
    return true;
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
        if (!sellReplacedPondFish(removed, fish, target.start)) {
            return false;
        }
        state.stats.replaced += 1;
        runCardHook(fish, "onReplaceIn", { card: fish, removedCard: removed, source: "pond" });
        addLog(`「${fish.name}」放入第 ${cellIndex + 1} 格，替换并出售了「${removed.name}」。`);
    } else {
        addLog(`「${fish.name}」放入水族馆第 ${cellIndex + 1} 格。`);
    }

    fish.cellIndex = cellIndex;
    state.pond.push(fish);
    state.pond.sort((left, right) => (left.cellIndex || 0) - (right.cellIndex || 0));
    state.stats.caught += 1;
    pulsePondValue();
    runOwnedCardsHook("onEnterPond", { card: fish, enteringCard: fish, reason: target ? "replace" : "catch" });
    runCardHook(fish, "onStoredAfterCatch", { caughtFish: fish, targetStorage: "pond" });
    state.placementHighlightUid = fish.uid;
    state.placementHighlightCellIndex = cellIndex;
    window.setTimeout(() => {
        if (state.placementHighlightUid === fish.uid) {
            state.placementHighlightUid = null;
            state.placementHighlightCellIndex = null;
            render();
        }
    }, 520);
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
        option.addEventListener("click", () => {
            if (option.classList.contains("is-picked")) {
                return;
            }

            option.classList.add("is-picked");
            window.setTimeout(() => chooseCatchFish(fish), 150);
        });
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
    if (state.nextFishingCostDiscount > 0) {
        state.nextFishingCostDiscount = 0;
    }
    pulseCoinChange();
    runEventSystemHook("onCatchStart", { baitId, bait, day: state.day });
    state.currentCatchCharge = charge;
    const choices = drawCatchChoices(baitId);
    const batchHasFalcon = choices.some((choice) => choice.archetype === "falcon-risk");
    choices.forEach((choice) => {
        choice.catchBatchHasFalcon = batchHasFalcon;
    });
    runCardAndCharacterHook("onCatchChoice", { baitId, bait, choices, day: state.day, charge });
    runEventSystemHook("onCatchChoice", { baitId, bait, choices, day: state.day, charge });
    state.currentCatchCharge = null;
    state.stats.baitUsed += 1;
    state.dailyCatchCount += 1;
    state.catchChoices = choices;
    state.catchPickLimit = catchPickLimit(baitId, bait, choices);
    state.catchPicksRemaining = state.catchPickLimit;
    state.selectedCatchUid = null;
    state.decisionLocked = true;
    elements.lastCatch.textContent = "等待放入";
    elements.pixelScene.classList.remove("is-casting");
    elements.pixelScene.classList.add("is-catching");
    setStatus("鱼获上钩");
    addLog(`支付 ${fishCost}G 使用${bait.name}钓鱼，钓上 3 条鱼，可选择 ${state.catchPickLimit} 条放入水族馆。`);
    if (charge.isPerfect) {
        addLog(`蓄力命中最佳区间，本次高品质鱼权重小幅提高。`);
    }

    render();
    openCatchChoiceDecision();

    window.setTimeout(() => {
        elements.pixelScene.classList.remove("is-catching");
    }, 420);
}

function handleFishButtonClick() {
    if (state.decisionLocked) {
        return;
    }

    if (state.catchChoices.length > 0) {
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

    if (elapsed < MIN_FISH_PRESS_MS) {
        shakeFishButton();
        return true;
    }

    if (!options.cancel) {
        catchFishWithCharge(result);
    }

    return true;
}

function shakeFishButton() {
    elements.fishButton.classList.remove("is-press-too-short");
    void elements.fishButton.offsetWidth;
    elements.fishButton.classList.add("is-press-too-short");

    window.setTimeout(() => {
        elements.fishButton.classList.remove("is-press-too-short");
    }, 180);
}

function cancelFishingCharge(event) {
    stopFishingCharge(event, { cancel: true });
}

function handleFishButtonPointerUp(event) {
    if (stopFishingCharge(event)) {
        return;
    }
}

function handleFishButtonFallbackClick() {
    if (performance.now() < suppressFishClickUntil) {
        return;
    }

    handleFishButtonClick();
}

// Split from app.js: 70 card actions input.
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
            const soldCellIndex = currentCollection[currentIndex].cellIndex;
            currentCollection.splice(currentIndex, 1);
            state.coins += sale.value;
            state.stats.soldFish += 1;
            runCardHook(fish, "onSell", { card: fish, sale, soldCellIndex });
            runOwnedCardsHook("onSell", { card: fish, sale, soldCellIndex });
            runOwnedCardsHook("onFishSold", { card: fish, soldCard: fish, sale, soldCellIndex });
            addLog(`卖出「${fish.name}」，获得 ${sale.value}G。`);
        }

        state.sellingCardUid = null;
        state.decisionLocked = false;
        elements.shopPanel.classList.remove("is-sale-pulse");
        render();
    }, 180);
}

function sellSelectedCatchFish() {
    if (state.decisionLocked || !state.selectedCatchUid) {
        return;
    }

    const fish = state.catchChoices.find((choice) => choice.uid === state.selectedCatchUid);
    const index = state.catchChoices.findIndex((choice) => choice.uid === state.selectedCatchUid);

    if (!fish || index < 0) {
        state.selectedCatchUid = null;
        render();
        return;
    }

    const sale = {
        source: "catch",
        index,
        value: fishSellValue(fish),
        cancelled: false
    };

    runOwnedCardsHook("onBeforeSell", { card: fish, sale });
    runCardHook(fish, "onBeforeSell", { card: fish, sale });

    if (sale.cancelled) {
        addLog(`「${fish.name}」的出售被鱼卡效果阻止。`);
        render();
        return;
    }

    state.coins += sale.value;
    state.stats.soldFish += 1;
    runCardHook(fish, "onSell", { card: fish, sale, soldCellIndex: null, directFromCatch: true });
    runOwnedCardsHook("onSell", { card: fish, sale, soldCellIndex: null, directFromCatch: true });
    runOwnedCardsHook("onFishSold", { card: fish, soldCard: fish, sale, soldCellIndex: null, directFromCatch: true });
    elements.lastCatch.textContent = `${fish.name} 已出售`;
    addLog(`直接卖出鱼获「${fish.name}」，获得 ${sale.value}G。`);
    finishCatchPick(fish);
    render();
}

function handleAdvanceButtonClick() {
    advanceTime();
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

function canDragStorageCards() {
    return !window.matchMedia?.("(pointer: coarse)")?.matches;
}

function handleDragStart(event) {
    const slot = event.target.closest(".slot[data-card-index]");

    if (!slot || state.decisionLocked || !canDragStorageCards()) {
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

function preventOperationTextSelection(element) {
    ["contextmenu", "selectstart", "dragstart"].forEach((eventName) => {
        element.addEventListener(eventName, (event) => {
            event.preventDefault();
        });
    });
}

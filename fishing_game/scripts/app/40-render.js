// Split from app.js: 40 render.
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
    const frameRarity = ["common", "uncommon", "rare", "epic", "legendary", "mythic"].includes(fish.rarity)
        ? fish.rarity
        : "common";
    const star = Math.max(1, Math.floor(fish.star || 1));
    const starIcons = "★".repeat(star);
    const starClass = star >= 3 ? " is-rainbow" : "";
    const artClass = fish.art ? " has-art" : "";
    const artStyle = fish.art ? ` --fish-art:url('${fish.art}');` : "";
    const frameStyle = ` --card-frame:url('./assets/cards/card-frame-${frameRarity}.png');`;
    const expandedClass = expanded ? " is-expanded" : "";
    const valueAnimation = state.valueAnimations?.[fish.uid];
    const isValueAnimating = valueAnimation && valueAnimation.until > Date.now();
    const value = isValueAnimating ? valueAnimation.displayValue : fishCardValue(fish);
    const valueClass = isValueAnimating ? " is-value-spinning" : "";
    const valueStyle = isValueAnimating ? ` style="--value-spin-duration:${valueAnimation.duration}ms"` : "";
    const valueGain = isValueAnimating ? ` data-gain="+${valueAnimation.gain}"` : "";

    return `
        <div class="fish-card${starClass}${artClass}${expandedClass}" data-card-uid="${fish.uid || ""}" style="--fish-color:${fish.color}; --rarity-color:${rarityColor};${frameStyle}${artStyle}">
            <div class="fish-card-header">
                <strong class="fish-name">${fish.name}</strong>
                <span class="fish-stars" aria-label="${star}星">${starIcons}</span>
            </div>
            <div class="fish-sprite" aria-hidden="true"></div>
            <strong class="fish-value${valueClass}"${valueStyle}${valueGain} aria-label="价值"><span class="fish-value-number">${value}</span></strong>
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
    const selectedCatch = storage === "pond" ? selectedCatchFish() : null;

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

            if (selectedCatch && cells[cellIndex] && !(coveredEntry && !coveredEntry.isStart)) {
                const target = occupied.get(cellIndex);
                const canPlace = canPlacePondAt(selectedCatch, cellIndex, target?.card.uid || null);
                slot.classList.toggle("is-place-valid", canPlace);
                slot.classList.toggle("is-place-invalid", !canPlace);
                slot.dataset.placeLabel = canPlace
                    ? target?.card ? "替换" : "放入"
                    : "不可放";
            }
        }

        if (entry) {
            const slotSize = Math.min(cardSlotSize(entry.fish, storage), storageGridSize(storage) - cellIndex);
            const isSelected = state.selectedCard
                && state.selectedCard.storage === storage
                && state.selectedCard.uid === entry.fish.uid;
            const isCombined = state.combineHighlightUid === entry.fish.uid;
            const isPlaced = state.placementHighlightUid === entry.fish.uid;
            const isMoved = state.movementHighlightUids.includes(entry.fish.uid);
            const isEffect = state.effectHighlightUids.includes(entry.fish.uid);
            const isSelling = state.sellingCardUid === entry.fish.uid;
            slot.dataset.cardIndex = String(entry.index);
            slot.draggable = !state.decisionLocked && canDragStorageCards();
            slot.classList.toggle("is-selected", isSelected);
            slot.classList.toggle("is-slot-confirm", state.placementHighlightCellIndex === cellIndex);
            slot.classList.toggle("is-combined-result", isCombined);
            slot.classList.toggle("is-placed-result", isPlaced);
            slot.classList.toggle("is-moved-result", isMoved);
            slot.classList.toggle("is-effect-result", isEffect);
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
        elements.fishButton.textContent = "鱼获待处理";
        elements.fishButton.disabled = true;
    } else {
        elements.fishButton.textContent = `钓鱼 ${fishCost}G`;
        elements.fishButton.disabled = disabledBeforeStart || state.coins < fishCost || state.decisionLocked;
    }

    elements.advanceTimeButton.textContent = "结束今天";
    elements.advanceTimeButton.disabled = disabledBeforeStart
        || state.decisionLocked
        || hasPendingCatch;
    elements.upgradeCoreButton.textContent = state.baitLevel >= maxBaitLevel
        ? `饵料已满 ${baitStars}`
        : `升级饵料 ${baitStars} ${coreCost}G`;
    elements.upgradeCoreButton.disabled = disabledBeforeStart
        || state.baitLevel >= maxBaitLevel
        || state.coins < coreCost
        || state.decisionLocked
        || hasPendingCatch;
}

function selectedCatchFish() {
    return state.catchChoices.find((choice) => choice.uid === state.selectedCatchUid) || null;
}

function renderCatchActionRow() {
    if (!elements.catchActionRow) {
        return;
    }

    const hasPendingCatch = state.catchChoices.length > 0;
    const selectedFish = selectedCatchFish();

    elements.catchActionRow.hidden = !hasPendingCatch;

    if (!hasPendingCatch) {
        return;
    }

    elements.catchActionLabel.textContent = selectedFish
        ? `已选择：${selectedFish.name}，点击高亮鱼缸放入`
        : "请选择一条鱼获";
    elements.reselectCatchButton.disabled = state.decisionLocked;
    elements.sellCatchButton.disabled = state.decisionLocked || !selectedFish;
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
    renderCatchActionRow();
    renderButtons();
    renderChargeMeter();
}

// Split from app.js: 90 boot.
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
    valueAnimationTimers.forEach((timerId) => window.clearTimeout(timerId));
    valueAnimationIntervals.forEach((intervalId) => window.clearInterval(intervalId));
    valueAnimationTimers.clear();
    valueAnimationIntervals.clear();
    if (dayTransitionTimer) {
        window.clearTimeout(dayTransitionTimer);
        dayTransitionTimer = null;
    }
    elements.dayTransitionOverlay?.classList.remove("is-active");
    if (elements.dayTransitionOverlay) {
        elements.dayTransitionOverlay.hidden = true;
    }

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

function setLoadingText(text) {
    if (elements.loadingText) {
        elements.loadingText.textContent = text;
    }
}

function waitForWindowLoad() {
    if (document.readyState === "complete") {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        window.addEventListener("load", resolve, { once: true });
    });
}

function waitForFonts() {
    if (!document.fonts?.ready) {
        return Promise.resolve();
    }

    return document.fonts.ready.catch(() => undefined);
}

function assetUrlsForLoading() {
    const urls = new Set([
        "./assets/backgrounds/aquarium-main.png",
        "./assets/characters/tide-avatar.png",
        "./assets/characters/tide-art.png"
    ]);

    Object.values(DATA.characters || {}).forEach((character) => {
        if (character.avatar) {
            urls.add(character.avatar);
        }
        if (character.art) {
            urls.add(character.art);
        }
    });

    DATA.fishPool.slice(0, 12).forEach((fish) => {
        if (fish.art) {
            urls.add(fish.art);
        }
    });

    return [...urls];
}

function preloadImage(url) {
    return new Promise((resolve) => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = resolve;
        image.src = url;
    });
}

async function waitForInitialAssets() {
    setLoadingText("正在装载水族馆...");
    await waitForWindowLoad();
    setLoadingText("正在整理鱼卡...");
    await waitForFonts();
    setLoadingText("正在放入鱼鱼...");
    await Promise.all(assetUrlsForLoading().map(preloadImage));
}

async function hideLoadingWhenReady() {
    const minVisible = new Promise((resolve) => window.setTimeout(resolve, 420));
    const maxWait = new Promise((resolve) => window.setTimeout(resolve, 3600));

    await Promise.race([
        Promise.all([waitForInitialAssets(), minVisible]),
        maxWait
    ]);

    setLoadingText("准备完成");
    elements.loadingScreen?.classList.add("is-hidden");
    window.setTimeout(() => {
        if (elements.loadingScreen) {
            elements.loadingScreen.hidden = true;
        }
    }, 320);
}

elements.fishButton.addEventListener("pointerdown", startFishingCharge);
elements.fishButton.addEventListener("pointerup", handleFishButtonPointerUp);
elements.fishButton.addEventListener("pointercancel", cancelFishingCharge);
elements.fishButton.addEventListener("lostpointercapture", cancelFishingCharge);
elements.fishButton.addEventListener("click", handleFishButtonFallbackClick);
elements.advanceTimeButton.addEventListener("click", handleAdvanceButtonClick);
elements.upgradeCoreButton.addEventListener("click", openCoreUpgrade);
[elements.fishButton, elements.advanceTimeButton, elements.upgradeCoreButton].forEach(preventOperationTextSelection);
elements.reselectCatchButton.addEventListener("click", () => {
    state.selectedCatchUid = null;
    openCatchChoiceDecision();
    render();
});
elements.sellCatchButton.addEventListener("click", sellSelectedCatchFish);
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
hideLoadingWhenReady();

// Split from app.js: 60 decisions progression.
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
                <p>饵料等级用星星表示。星数越高，高品质鱼卡在稀有度池里的权重越高。长按钓鱼进入最佳区间时，本次高品质权重会小幅提高。</p>
            </section>
            <section>
                <h3>水族馆格子</h3>
                <p>鱼卡只能放进已解锁的鱼缸格子。每 3 天结算通过后，会获得一次免费扩建水族馆的机会。</p>
            </section>
            <section>
                <h3>金币收入</h3>
                <p>每天开始时会获得基础金币。每过 3 天，基础每日金币会增加 1 点；角色和鱼卡效果还可能提供额外收入。</p>
            </section>
            <section>
                <h3>价值与出售</h3>
                <p>鱼卡右下角的数字是当前价值。新一天开始时，水族馆里的鱼卡会按自身星级和效果增加价值。点击鱼卡可以查看详情或出售。</p>
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
    const coinSettlement = settleCheckpointCoins(totalValue, target, passed);
    state.decisionLocked = true;
    state.lastCheckpointDay = state.day;
    elements.decisionModal.hidden = false;
    elements.decisionTitle.textContent = passed ? "三日结算达标" : "三日结算失败";
    elements.decisionCopy.textContent = passed
        ? `第 ${state.day} 天结束，水族馆总价值 ${totalValue}/${target}，可以继续航行。`
        : `第 ${state.day} 天结束，水族馆总价值 ${totalValue}/${target}，未达到标准，本轮结束。`;
    elements.decisionPreview.innerHTML = checkpointSummaryTemplate(totalValue, target, passed, coinSettlement);
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
    pulseDayChange();
    state.decisionLocked = true;
    state.dayTransitioning = true;
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
    showDayTransition(state.day);
}

function showDayTransition(day) {
    if (!elements.dayTransitionOverlay || !elements.dayTransitionText) {
        state.decisionLocked = false;
        state.dayTransitioning = false;
        render();
        return;
    }

    if (dayTransitionTimer) {
        window.clearTimeout(dayTransitionTimer);
    }

    const token = (state.dayTransitionToken || 0) + 1;
    state.dayTransitionToken = token;
    elements.dayTransitionText.textContent = `第 ${day} 天`;
    elements.dayTransitionOverlay.hidden = false;
    elements.dayTransitionOverlay.classList.remove("is-active");
    void elements.dayTransitionOverlay.offsetWidth;
    elements.dayTransitionOverlay.classList.add("is-active");

    dayTransitionTimer = window.setTimeout(() => {
        if (state.dayTransitionToken !== token) {
            return;
        }

        elements.dayTransitionOverlay.classList.remove("is-active");
        elements.dayTransitionOverlay.hidden = true;
        state.decisionLocked = false;
        state.dayTransitioning = false;
        dayTransitionTimer = null;
        render();
    }, 800);
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
    replayElementAnimation(elements.upgradeCoreButton, "is-upgrade-pop", 360);
    pulseCoinChange();
    addLog(`饵料升级：之后购买和每日获得的饵料提升到 Lv.${state.baitLevel}。`);
    render();
}

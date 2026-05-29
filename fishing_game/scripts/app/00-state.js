// Split from app.js: 00 state.
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
    catchActionRow: document.getElementById("catchActionRow"),
    catchActionLabel: document.getElementById("catchActionLabel"),
    reselectCatchButton: document.getElementById("reselectCatchButton"),
    sellCatchButton: document.getElementById("sellCatchButton"),
    lastCatch: document.getElementById("lastCatch"),
    loadingScreen: document.getElementById("loadingScreen"),
    loadingText: document.getElementById("loadingText"),
    renderWarmup: document.getElementById("renderWarmup"),
    logList: document.getElementById("logList"),
    pixelScene: document.getElementById("pixelScene"),
    pondGrid: document.getElementById("pondGrid"),
    fishButton: document.getElementById("fishButton"),
    advanceTimeButton: document.getElementById("advanceTimeButton"),
    upgradeCoreButton: document.getElementById("upgradeCoreButton"),
    shopPanel: document.querySelector(".shop-panel"),
    dayTransitionOverlay: document.getElementById("dayTransitionOverlay"),
    dayTransitionText: document.getElementById("dayTransitionText"),
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
const BASE_DAILY_COINS = 3;
const MAX_BASE_DAILY_COINS = 8;
const BASE_FISHING_COST = 3;
const DEFAULT_CHARGE_WINDOW = {
    perfectStartMs: 900,
    perfectEndMs: 1100,
    maxMs: 1300,
    rarityBonus: 0.08
};
const MIN_FISH_PRESS_MS = 100;

function createInitialCells(config) {
    return Array.from({ length: config.gridSize }, (_, index) => config.initialCells.includes(index));
}

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
        dayTransitioning: false,
        dayTransitionToken: 0,
        dragData: null,
        selectedCard: null,
        lastCheckpointDay: 0,
        combineHighlightUid: null,
        placementHighlightUid: null,
        placementHighlightCellIndex: null,
        movementHighlightUids: [],
        effectHighlightUids: [],
        sellingCardUid: null,
        valueAnimations: {},
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

const valueAnimationTimers = new Map();
const valueAnimationIntervals = new Map();
const preloadedImageCache = new Map();
let dayTransitionTimer = null;

const state = createInitialState("standard", false);

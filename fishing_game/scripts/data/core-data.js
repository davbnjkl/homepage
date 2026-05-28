window.FISHING_GAME_DATA = {
    gameModes: {
        standard: {
            id: "standard",
            name: "标准模式",
            checkpointTargets: [12, 30, 55, 90, 135],
            checkpointTargetStep: 60
        }
    },
    eventSystem: {
        enabled: false,
        hooks: {
            onDayStart: "新的一天开始时",
            onCatchStart: "捕鱼开始时",
            onCatchChoice: "生成鱼获选择时",
            onCheckpoint: "三日结算时",
            modifyBaitPool: "事件调整稀有度池",
        modifyCatchPickCount: "事件调整鱼获选择数量",
        modifySellValue: "事件调整卖鱼价格",
        modifyCardValue: "事件调整鱼卡价值",
        modifyCoreUpgradeCost: "事件调整饵料升级费用",
        modifyFishingChargeWindow: "事件调整钓鱼蓄力窗口"
        },
        events: []
    },
    characters: {
        tide: {
            id: "tide",
            name: "阿潮",
            title: "稳潮钓手",
            shortName: "潮",
            avatar: "./assets/characters/tide-avatar.png",
            art: "./assets/characters/tide-art.png",
            passiveText: "每天开始时获得 1G。",
            effects: [
                {
                    id: "tide-daily-coin",
                    hook: "onDayStart",
                    type: "gainCoins",
                    amount: 1
                }
            ]
        },
        hookGranny: {
            id: "hookGranny",
            name: "红钩婆婆",
            title: "旧港商贩",
            shortName: "婆",
            avatar: "./assets/characters/hook-granny-avatar.png",
            art: "./assets/characters/hook-granny-art.png",
            passiveText: "每出售 3 张鱼卡，第 3 张额外 +1G。",
            effects: [
                {
                    id: "granny-fish-sale",
                    hook: "modifySellValue",
                    type: "addSellValueEveryNthSale",
                    interval: 3,
                    amount: 1
                }
            ]
        },
        starLantern: {
            id: "starLantern",
            name: "星灯少年",
            title: "星灯钓手",
            shortName: "星",
            avatar: "./assets/characters/star-lantern-avatar.png",
            art: "./assets/characters/star-lantern-art.png",
            passiveText: "每天第一次捕鱼时，蓝色及以上鱼权重提高。",
            effects: [
                {
                    id: "star-lantern-daily-first-catch",
                    hook: "modifyBaitPool",
                    type: "multiplyRarityWeights",
                    maxTripCatchCount: 0,
                    multipliers: {
                        rare: 1.35,
                        epic: 1.35,
                        legendary: 1.35,
                        mythic: 1.35
                    }
                }
            ]
        },
        tankSmith: {
            id: "tankSmith",
            name: "缸匠洛",
            title: "水族馆匠人",
            shortName: "洛",
            avatar: "./assets/characters/tank-smith-avatar.png",
            art: "./assets/characters/tank-smith-art.png",
            passiveText: "每天开始时，水族馆最低价值鱼 +2 价值；每次合成结果额外 +5 价值。",
            effects: [
                {
                    id: "tank-smith-lowest-value",
                    hook: "onDayStart",
                    type: "addValueToLowestPond",
                    amount: 2
                },
                {
                    id: "tank-smith-combine-value",
                    hook: "onCombineResult",
                    type: "addCombinedCardValue",
                    amount: 5
                }
            ]
        }
    },
    baitTypes: {
        basic: {
            id: "basic",
            level: 1,
            name: "白色饵料",
            shortName: "",
            color: "#f4f7fb",
            rarityWeights: [
                { rarity: "common", weight: 80 },
                { rarity: "uncommon", weight: 20 }
            ]
        },
        green: {
            id: "green",
            level: 2,
            name: "绿色饵料",
            shortName: "",
            color: "#51d96b",
            rarityWeights: [
                { rarity: "common", weight: 50 },
                { rarity: "uncommon", weight: 35 },
                { rarity: "rare", weight: 15 }
            ]
        },
        blue: {
            id: "blue",
            level: 3,
            name: "蓝色饵料",
            shortName: "",
            color: "#4d91ff",
            rarityWeights: [
                { rarity: "common", weight: 24 },
                { rarity: "uncommon", weight: 36 },
                { rarity: "rare", weight: 28 },
                { rarity: "epic", weight: 10 },
                { rarity: "legendary", weight: 2 }
            ]
        },
        purple: {
            id: "purple",
            level: 4,
            name: "紫色饵料",
            shortName: "",
            color: "#9b5cff",
            rarityWeights: [
                { rarity: "common", weight: 10 },
                { rarity: "uncommon", weight: 24 },
                { rarity: "rare", weight: 36 },
                { rarity: "epic", weight: 23 },
                { rarity: "legendary", weight: 6 },
                { rarity: "mythic", weight: 1 }
            ]
        },
        orange: {
            id: "orange",
            level: 5,
            name: "橙色饵料",
            shortName: "",
            color: "#ff9f43",
            rarityWeights: [
                { rarity: "common", weight: 3 },
                { rarity: "uncommon", weight: 10 },
                { rarity: "rare", weight: 27 },
                { rarity: "epic", weight: 38 },
                { rarity: "legendary", weight: 18 },
                { rarity: "mythic", weight: 4 }
            ]
        },
        red: {
            id: "red",
            level: 6,
            name: "红色饵料",
            shortName: "",
            color: "#ff4d5f",
            rarityWeights: [
                { rarity: "uncommon", weight: 4 },
                { rarity: "rare", weight: 16 },
                { rarity: "epic", weight: 34 },
                { rarity: "legendary", weight: 34 },
                { rarity: "mythic", weight: 12 }
            ]
        }
    },
    baitLevelOrder: ["basic", "green", "blue", "purple", "orange", "red"],
    rarityLabels: {
        common: "普通",
        uncommon: "少见",
        rare: "稀有",
        epic: "史诗",
        legendary: "传说",
        mythic: "神话"
    },
    rarityColors: {
        common: "#f4f7fb",
        uncommon: "#51d96b",
        rare: "#4d91ff",
        epic: "#9b5cff",
        legendary: "#ff9f43",
        mythic: "#ff4d5f"
    },
    archetypeLabels: {
        "school-growth": "共生鱼",
        "position-shift": "迁游鱼"
    },
    effectHooks: {
        onStoredAfterCatch: "捕获并放入水族馆后",
        onEnterPond: "进入水族馆时",
        onBeforeSell: "出售前",
        onSell: "出售后",
        onDiscard: "鱼卡丢失时",
        onReplaceOut: "被替换移除时",
        onReplaceIn: "替换进入时",
        onDayStart: "新的一天开始时",
        onDayValueGain: "每日价值成长后",
        onCardMoved: "鱼卡移动或换位后",
        onFishSold: "鱼卡出售后",
        modifySellValue: "计算售价时",
        modifyCardValue: "计算鱼卡价值时",
        modifyDailyValueGain: "计算每日价值成长时",
        modifyBaitPool: "计算饵料掉落池时",
        modifyFishingChargeWindow: "计算钓鱼蓄力窗口时",
        modifyCatchPickCount: "计算鱼获可选数量时",
        modifyFishingCost: "计算钓鱼花费时",
        modifyCoreUpgradeCost: "计算饵料升级费用时",
        modifyMoveReward: "计算移动收益时",
        modifyCardSlotSize: "计算鱼卡占格时",
        modifyPondCapacity: "计算水族馆容量时"
    },
    effectTypes: {
        reserved: {
            label: "预留效果",
            fields: ["note"]
        },
        gainCoins: {
            label: "获得金币",
            fields: ["amount"]
        },
        gainCoinsByStar: {
            label: "按星级获得金币",
            fields: ["amounts"]
        },
        chanceGainCoins: {
            label: "概率获得金币",
            fields: ["chance", "amount"]
        },
        chanceGainCoinsByStar: {
            label: "按星级概率获得金币",
            fields: ["chances", "amounts"]
        },
        addCatchPickCount: {
            label: "增加本次鱼获可选数量",
            fields: ["amount"]
        },
        addCatchPickCountByStar: {
            label: "按星级增加本次鱼获可选数量",
            fields: ["amounts"]
        },
        addFishingCost: {
            label: "调整钓鱼花费",
            fields: ["amount"]
        },
        addFishingCostByStar: {
            label: "按星级调整钓鱼花费",
            fields: ["amounts"]
        },
        addCoreUpgradeCost: {
            label: "调整饵料升级费用",
            fields: ["amount"]
        },
        addCoreUpgradeCostByStar: {
            label: "按星级调整饵料升级费用",
            fields: ["amounts"]
        },
        multiplyFishingCost: {
            label: "倍率调整钓鱼花费",
            fields: ["multiplier"]
        },
        addSellValue: {
            label: "调整售价",
            fields: ["amount", "scope"]
        },
        addSellValueByStar: {
            label: "按星级调整售价",
            fields: ["amounts", "scope"]
        },
        addSellValueEveryNthSale: {
            label: "每出售若干张鱼卡调整售价",
            fields: ["interval", "amount"]
        },
        addSaleValue: {
            label: "出售流程中调整本次售价",
            fields: ["amount"]
        },
        addDailyValueGain: {
            label: "调整每日价值成长",
            fields: ["amount", "scope"]
        },
        addDailyValueGainByStar: {
            label: "按星级调整每日价值成长",
            fields: ["amounts", "scope"]
        },
        addCardValue: {
            label: "调整鱼卡当前价值",
            fields: ["amount", "scope"]
        },
        multiplyCardValue: {
            label: "倍率调整鱼卡当前价值",
            fields: ["multiplier", "scope"]
        },
        cancelSale: {
            label: "阻止出售",
            fields: []
        },
        addCapacity: {
            label: "调整容量",
            fields: ["amount"]
        },
        setCardSlotSize: {
            label: "设置鱼卡占格",
            fields: ["size", "scope"]
        },
        addCardSlotSize: {
            label: "调整鱼卡占格",
            fields: ["amount", "scope"]
        },
        addRarityWeight: {
            label: "调整稀有度权重",
            fields: ["rarity", "amount"]
        },
        multiplyRarityWeight: {
            label: "倍率调整稀有度权重",
            fields: ["rarity", "multiplier"]
        },
        setRarityWeight: {
            label: "设置稀有度权重",
            fields: ["rarity", "weight"]
        },
        multiplyRarityWeights: {
            label: "批量倍率调整稀有度权重",
            fields: ["multipliers"]
        },
        adjustFishingChargeWindow: {
            label: "调整钓鱼蓄力窗口",
            fields: ["perfectStartMs", "perfectEndMs", "maxMs", "rarityBonus"]
        },
        addValueToLowestPond: {
            label: "水族馆最低价值鱼加值",
            fields: ["amount"]
        },
        addCombinedCardValue: {
            label: "合成结果加值",
            fields: ["amount"]
        },
        addSelfValueByStar: {
            label: "按星级给自身加值",
            fields: ["amounts"]
        },
        addValueToHighestPondByStar: {
            label: "按星级给水族馆最高价值鱼加值",
            fields: ["amounts"]
        },
        addMoveReward: {
            label: "调整移动收益",
            fields: ["amount"]
        },
        shiftMoveToAdjacentEmptyDaily: {
            label: "每日移动到相邻空格",
            fields: ["amounts"]
        },
        shiftCornerLoachDaily: {
            label: "角落或向角落移动成长",
            fields: ["cornerAmounts", "moveAmounts"]
        },
        shiftCurrentScaleMoved: {
            label: "同排迁游鱼移动时成长",
            fields: ["limits", "amount"]
        },
        shiftNestCarpEnter: {
            label: "入馆后与相邻鱼换位",
            fields: ["amounts"]
        },
        shiftEdgeLanternDaily: {
            label: "边缘和移动成长",
            fields: ["edgeAmounts", "movedAmounts"]
        },
        shiftCenterGoldfishDaily: {
            label: "中心或向中心移动成长",
            fields: ["centerAmounts", "moveAmounts"]
        },
        shiftLoopEelMoved: {
            label: "自身移动按距离成长",
            fields: ["amounts", "caps"]
        },
        shiftThreeLineFishDaily: {
            label: "行列成型成长",
            fields: []
        },
        shiftVacancyStargazerSold: {
            label: "出售空位触发移动",
            fields: ["amounts"]
        },
        shiftVacancyStargazerEnter: {
            label: "空位相邻入馆加值",
            fields: ["star3EnterBonus"]
        },
        shiftTidePusherDaily: {
            label: "推动相邻迁游鱼移动",
            fields: []
        },
        shiftMirrorRayDaily: {
            label: "镜像位置成长或移动",
            fields: ["amounts"]
        },
        shiftNineGridBreamMoved: {
            label: "到达新格成长",
            fields: ["amounts"]
        },
        shiftAnchorGrouperMoved: {
            label: "同线移动支援",
            fields: ["lineAmounts", "selfAmounts"]
        },
        shiftTideGateDragonMoved: {
            label: "进入中心时群体成长",
            fields: ["amounts"]
        },
        shiftAllImageSwapperDaily: {
            label: "最高最低价值鱼换位",
            fields: []
        },
        shiftAllImageSwapperMoved: {
            label: "换位次数群体成长",
            fields: ["star3Cap"]
        },
        shiftStarTrackKoiDaily: {
            label: "对角线成型成长",
            fields: ["amounts"]
        },
        shiftNineGridDeityMoved: {
            label: "迁游鱼移动时群体成长",
            fields: []
        },
        shiftNineGridDeityDaily: {
            label: "每日推动最低价值迁游鱼",
            fields: []
        },
        shiftReturnMothershipDaily: {
            label: "迁游路径群体成长",
            fields: []
        }
    },
    fishPool: []
};

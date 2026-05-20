window.FISHING_GAME_DATA = {
    gameModes: {
        standard: {
            id: "standard",
            name: "标准模式",
            checkpointTargets: [24, 60, 110, 180, 270],
            checkpointTargetStep: 120
        }
    },
    eventSystem: {
        enabled: false,
        hooks: {
            onDayStart: "新的一天开始时",
            onPeriodStart: "时段开始时",
            onPeriodEnd: "时段结束时",
            onCatchStart: "捕鱼开始时",
            onCatchChoice: "生成鱼获选择时",
            onCheckpoint: "三日结算时",
            modifyBaitPool: "事件调整稀有度池",
            modifyDailyBaitGain: "事件调整每日饵料",
            modifySellValue: "事件调整卖鱼价格",
            modifyCardValue: "事件调整鱼卡价值"
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
            passiveText: "每天开始时额外获得 1 个当前等级饵料。",
            effects: [
                {
                    id: "tide-daily-current-bait",
                    hook: "onDayStart",
                    type: "gainReserveBait",
                    baitId: "current",
                    amount: 1
                }
            ]
        },
        hookGranny: {
            id: "hookGranny",
            name: "红钩婆婆",
            title: "旧港商贩",
            shortName: "婆",
            passiveText: "出售鱼卡额外 +1G；出售饵料次日结算额外 +1G。",
            effects: [
                {
                    id: "granny-fish-sale",
                    hook: "modifySellValue",
                    type: "addSellValue",
                    scope: "all",
                    amount: 1
                },
                {
                    id: "granny-bait-sale",
                    hook: "modifyBaitSellValue",
                    type: "addBaitSellValue",
                    amount: 1
                }
            ]
        },
        starLantern: {
            id: "starLantern",
            name: "星灯少年",
            title: "夜航旅人",
            shortName: "星",
            passiveText: "下午结束时 35% 开启夜航；夜航第一次捕鱼时蓝色及以上鱼权重提高。",
            effects: [
                {
                    id: "star-lantern-night-chance",
                    hook: "onPeriodEnd",
                    type: "chanceUnlockNightAfterPeriod",
                    periodId: "afternoon",
                    chance: 0.35
                },
                {
                    id: "star-lantern-night-first-catch",
                    hook: "modifyBaitPool",
                    type: "multiplyRarityWeights",
                    periodId: "night",
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
            passiveText: "每天开始时，水族馆最低价值鱼 +1 价值；每次合成结果额外 +2 价值。",
            effects: [
                {
                    id: "tank-smith-lowest-value",
                    hook: "onDayStart",
                    type: "addValueToLowestPond",
                    amount: 1
                },
                {
                    id: "tank-smith-combine-value",
                    hook: "onCombineResult",
                    type: "addCombinedCardValue",
                    amount: 2
                }
            ]
        }
    },
    periods: [
        { id: "morning", label: "上午" },
        { id: "afternoon", label: "下午" },
        { id: "night", label: "晚上" }
    ],
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
    effectHooks: {
        onTripStart: "出海开始时",
        onEnterBackpack: "进入背包时",
        onStoredAfterCatch: "捕获并进入背包后",
        onEnterPond: "进入水族馆时",
        onReturnHome: "回家整理时",
        onBeforeSell: "出售前",
        onSell: "出售后",
        onDiscard: "鱼卡丢失时",
        onReplaceOut: "被替换移除时",
        onReplaceIn: "替换进入时",
        onDayStart: "新的一天开始时",
        onDayValueGain: "每日价值成长后",
        modifySellValue: "计算售价时",
        modifyCardValue: "计算鱼卡价值时",
        modifyDailyValueGain: "计算每日价值成长时",
        modifyBaitPool: "计算饵料掉落池时",
        modifyBaitBuyCost: "计算饵料购买价格时",
        modifyBaitSellValue: "计算饵料出售价格时",
        modifyDailyBaitGain: "计算每日自动获得饵料时",
        modifyBaitCapacity: "计算饵料库存上限时",
        modifyCardSlotSize: "计算鱼卡占格时",
        modifyBackpackCapacity: "计算背包容量时",
        modifyPondCapacity: "计算水族馆容量时"
    },
    effectTypes: {
        reserved: {
            label: "预留效果",
            fields: ["note"]
        },
        gainBait: {
            label: "获得饵料",
            fields: ["baitId", "amount"]
        },
        unlockNightChance: {
            label: "概率开启夜航",
            fields: ["chance"]
        },
        unlockNight: {
            label: "开启夜航",
            fields: []
        },
        gainCoins: {
            label: "获得金币",
            fields: ["amount"]
        },
        legendaryBurst: {
            label: "传说组合效果",
            fields: []
        },
        addTripBait: {
            label: "出海开始时追加饵料",
            fields: ["baitId", "amount"]
        },
        addSellValue: {
            label: "调整售价",
            fields: ["amount", "scope"]
        },
        addSaleValue: {
            label: "出售流程中调整本次售价",
            fields: ["amount"]
        },
        addDailyValueGain: {
            label: "调整每日价值成长",
            fields: ["amount", "scope"]
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
        addBaitBuyCost: {
            label: "调整饵料购买价格",
            fields: ["amount"]
        },
        multiplyBaitBuyCost: {
            label: "倍率调整饵料购买价格",
            fields: ["multiplier"]
        },
        addBaitSellValue: {
            label: "调整饵料出售价格",
            fields: ["amount"]
        },
        multiplyBaitSellValue: {
            label: "倍率调整饵料出售价格",
            fields: ["multiplier"]
        },
        addDailyBaitGain: {
            label: "调整每日自动饵料",
            fields: ["amount"]
        },
        addBaitCapacity: {
            label: "调整饵料库存上限",
            fields: ["amount"]
        },
        gainReserveBait: {
            label: "获得库存饵料",
            fields: ["baitId", "amount"]
        },
        chanceUnlockNightAfterPeriod: {
            label: "时段结束概率开启夜航",
            fields: ["periodId", "chance"]
        },
        addValueToLowestPond: {
            label: "水族馆最低价值鱼加值",
            fields: ["amount"]
        },
        addCombinedCardValue: {
            label: "合成结果加值",
            fields: ["amount"]
        }
    },
    fishPool: [
        {
            id: "blue-scale",
            name: "青鳞鱼",
            rarity: "common",
            slotSize: 1,
            baseValue: 4,
            sellValue: 1,
            weight: "1.2kg",
            art: "./assets/fish/blue-scale.png",
            color: "#69a8e7",
            rarityColor: "#f4f7fb",
            effectText: "出售时额外 +1G。",
            effects: [
                {
                    id: "blue-scale-sell-bonus",
                    hook: "modifySellValue",
                    type: "addSellValue",
                    amount: 1
                }
            ]
        },
        {
            id: "stone-catfish",
            name: "石甲鲶",
            rarity: "common",
            slotSize: 1,
            baseValue: 5,
            sellValue: 1,
            weight: "2.8kg",
            art: "./assets/fish/stone-catfish.png",
            color: "#7d9494",
            rarityColor: "#f4f7fb",
            effectText: "每日价值成长额外 +1。",
            effects: [
                {
                    id: "stone-catfish-daily-value",
                    hook: "modifyDailyValueGain",
                    type: "addDailyValueGain",
                    amount: 1
                }
            ]
        },
        {
            id: "orange-carp",
            name: "橙尾鲤",
            rarity: "uncommon",
            slotSize: 1,
            baseValue: 8,
            sellValue: 1,
            weight: "2.4kg",
            art: "./assets/fish/orange-carp.png",
            color: "#ff9d57",
            rarityColor: "#51d96b",
            effectText: "捕获时，本次出海额外获得 1 个白色饵料。",
            effects: [
                {
                    id: "orange-carp-extra-basic-bait",
                    hook: "onStoredAfterCatch",
                    type: "gainBait",
                    baitId: "basic",
                    amount: 1
                }
            ]
        },
        {
            id: "red-lantern",
            name: "红鳍灯鱼",
            rarity: "uncommon",
            slotSize: 1,
            baseValue: 9,
            sellValue: 1,
            weight: "0.9kg",
            art: "./assets/fish/red-lantern.png",
            color: "#ff6b6b",
            rarityColor: "#51d96b",
            effectText: "捕获时，有 25% 概率开启今晚夜航。",
            effects: [
                {
                    id: "red-lantern-night-chance",
                    hook: "onStoredAfterCatch",
                    type: "unlockNightChance",
                    chance: 0.25
                }
            ]
        },
        {
            id: "moon-bass",
            name: "月光鲈",
            rarity: "rare",
            slotSize: 1,
            baseValue: 15,
            sellValue: 1,
            weight: "3.1kg",
            art: "./assets/fish/moon-bass.png",
            color: "#91a4ff",
            rarityColor: "#4d91ff",
            effectText: "捕获时，直接开启今晚夜航。",
            effects: [
                {
                    id: "moon-bass-unlock-night",
                    hook: "onStoredAfterCatch",
                    type: "unlockNight"
                }
            ]
        },
        {
            id: "silver-sail",
            name: "银帆鲭",
            rarity: "rare",
            slotSize: 1,
            baseValue: 16,
            sellValue: 1,
            weight: "3.8kg",
            art: "./assets/fish/silver-sail.png",
            color: "#b8f3ff",
            rarityColor: "#4d91ff",
            effectText: "捕获时，本次出海额外获得 1 个蓝色饵料。",
            effects: [
                {
                    id: "silver-sail-extra-blue-bait",
                    hook: "onStoredAfterCatch",
                    type: "gainBait",
                    baitId: "blue",
                    amount: 1
                }
            ]
        },
        {
            id: "deep-crown",
            name: "深冠鳐",
            rarity: "epic",
            slotSize: 2,
            baseValue: 28,
            sellValue: 1,
            weight: "6.4kg",
            art: "./assets/fish/deep-crown.png",
            color: "#946cff",
            rarityColor: "#9b5cff",
            effectText: "占 2 格。捕获时，立刻获得 10G。",
            effects: [
                {
                    id: "deep-crown-gain-coins",
                    hook: "onStoredAfterCatch",
                    type: "gainCoins",
                    amount: 10
                }
            ]
        },
        {
            id: "gold-dragon",
            name: "金纹龙鱼",
            rarity: "legendary",
            slotSize: 2,
            baseValue: 50,
            sellValue: 1,
            weight: "5.6kg",
            art: "./assets/fish/gold-dragon.png",
            color: "#ffd166",
            rarityColor: "#ff9f43",
            effectText: "占 2 格。捕获时，开启今晚夜航并获得 1 个蓝色饵料。",
            effects: [
                {
                    id: "gold-dragon-legendary-burst",
                    hook: "onStoredAfterCatch",
                    type: "legendaryBurst"
                }
            ]
        }
    ]
};

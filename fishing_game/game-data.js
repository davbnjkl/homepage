window.FISHING_GAME_DATA = {
    periods: [
        { id: "morning", label: "上午" },
        { id: "afternoon", label: "下午" },
        { id: "night", label: "晚上" }
    ],
    baitTypes: {
        basic: {
            id: "basic",
            name: "普通饵",
            shortName: "普",
            rarityWeights: [
                { rarity: "common", weight: 72 },
                { rarity: "uncommon", weight: 23 },
                { rarity: "rare", weight: 5 }
            ]
        },
        fine: {
            id: "fine",
            name: "精制饵",
            shortName: "精",
            rarityWeights: [
                { rarity: "common", weight: 36 },
                { rarity: "uncommon", weight: 42 },
                { rarity: "rare", weight: 18 },
                { rarity: "epic", weight: 4 }
            ]
        }
    },
    rarityLabels: {
        common: "普通",
        uncommon: "少见",
        rare: "稀有",
        epic: "史诗",
        legendary: "传说"
    },
    effectHooks: {
        onTripStart: "出海开始时",
        onEnterBackpack: "进入背包时",
        onStoredAfterCatch: "捕获并进入背包后",
        onEnterPond: "进入鱼塘时",
        onReturnHome: "回家整理时",
        onBeforeSell: "出售前",
        onSell: "出售后",
        onDiscard: "鱼卡丢失时",
        onReplaceOut: "被替换移除时",
        onReplaceIn: "替换进入时",
        onDayStart: "新的一天开始时",
        onDayValueGain: "每日价值成长后",
        modifySellValue: "计算售价时",
        modifyDailyValueGain: "计算每日价值成长时",
        modifyBaitPool: "计算饵料掉落池时",
        modifyCardSlotSize: "计算鱼卡占格时",
        modifyBackpackCapacity: "计算背包容量时",
        modifyPondCapacity: "计算鱼塘容量时"
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
            color: "#69a8e7",
            rarityColor: "#4d91ff",
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
            color: "#7d9494",
            rarityColor: "#78909c",
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
            color: "#ff9d57",
            rarityColor: "#ff9f43",
            effectText: "捕获时，本次出海额外获得 1 个普通饵。",
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
            color: "#ff6b6b",
            rarityColor: "#ff6b6b",
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
            color: "#91a4ff",
            rarityColor: "#7d7bff",
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
            color: "#b8f3ff",
            rarityColor: "#5fd3e8",
            effectText: "捕获时，本次出海额外获得 1 个精制饵。",
            effects: [
                {
                    id: "silver-sail-extra-fine-bait",
                    hook: "onStoredAfterCatch",
                    type: "gainBait",
                    baitId: "fine",
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
            color: "#946cff",
            rarityColor: "#8f5dff",
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
            color: "#ffd166",
            rarityColor: "#e2a400",
            effectText: "占 2 格。捕获时，开启今晚夜航并获得 1 个精制饵。",
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

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
            onCatchStart: "捕鱼开始时",
            onCatchChoice: "生成鱼获选择时",
            onCheckpoint: "三日结算时",
            modifyBaitPool: "事件调整稀有度池",
            modifyCatchPickCount: "事件调整鱼获选择数量",
            modifySellValue: "事件调整卖鱼价格",
            modifyCardValue: "事件调整鱼卡价值",
            modifyCoreUpgradeCost: "事件调整饵料升级费用"
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
        "school-growth": "共生鱼"
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
        modifySellValue: "计算售价时",
        modifyCardValue: "计算鱼卡价值时",
        modifyDailyValueGain: "计算每日价值成长时",
        modifyBaitPool: "计算饵料掉落池时",
        modifyCatchPickCount: "计算鱼获可选数量时",
        modifyFishingCost: "计算钓鱼花费时",
        modifyCoreUpgradeCost: "计算饵料升级费用时",
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
        }
    },
    fishPool: [
        {
            id: "blue-scale",
            name: "青鳞鱼",
            race: "杂鱼种族",
            rarity: "common",
            slotSize: 1,
            baseValue: 4,
            dailyGain: 1,
            sellValue: 1,
            weight: "1.2kg",
            art: "./assets/fish/blue-scale.png",
            color: "#69a8e7",
            rarityColor: "#f4f7fb",
            effectText: "1星：出售时额外 +1G。2星：额外 +2G。3星：额外 +3G。",
            effects: [
                {
                    id: "blue-scale-sell-bonus",
                    hook: "modifySellValue",
                    type: "addSellValueByStar",
                    amounts: { 1: 1, 2: 2, 3: 3 }
                }
            ]
        },
        {
            id: "orange-carp",
            name: "橙尾鲤",
            race: "杂鱼种族",
            rarity: "uncommon",
            slotSize: 1,
            baseValue: 7,
            dailyGain: 1,
            sellValue: 1,
            weight: "2.4kg",
            art: "./assets/fish/orange-carp.png",
            color: "#ff9d57",
            rarityColor: "#51d96b",
            effectText: "1星：放入水族馆时获得 1G。2星：获得 2G。3星：获得 3G。",
            effects: [
                {
                    id: "orange-carp-catch-coin",
                    hook: "onStoredAfterCatch",
                    type: "gainCoinsByStar",
                    amounts: { 1: 1, 2: 2, 3: 3 }
                }
            ]
        },
        {
            id: "red-lantern",
            name: "红鳍灯鱼",
            race: "杂鱼种族",
            rarity: "uncommon",
            slotSize: 1,
            baseValue: 8,
            dailyGain: 1,
            sellValue: 1,
            weight: "0.9kg",
            art: "./assets/fish/red-lantern.png",
            color: "#ff6b6b",
            rarityColor: "#51d96b",
            effectText: "1星：放入水族馆时，有 25% 概率获得 2G。2星：35% 概率获得 3G。3星：50% 概率获得 4G。",
            effects: [
                {
                    id: "red-lantern-coin-chance",
                    hook: "onStoredAfterCatch",
                    type: "chanceGainCoinsByStar",
                    chances: { 1: 0.25, 2: 0.35, 3: 0.5 },
                    amounts: { 1: 2, 2: 3, 3: 4 }
                }
            ]
        },
        {
            id: "moon-bass",
            name: "月光鲈",
            race: "杂鱼种族",
            rarity: "rare",
            slotSize: 1,
            baseValue: 12,
            dailyGain: 1,
            sellValue: 1,
            weight: "3.1kg",
            art: "./assets/fish/moon-bass.png",
            color: "#91a4ff",
            rarityColor: "#4d91ff",
            effectText: "1星：在水族馆时，钓鱼费用 -1G。2星：仍为 -1G。3星：改为 -2G。",
            effects: [
                {
                    id: "moon-bass-fishing-cost",
                    hook: "modifyFishingCost",
                    type: "addFishingCostByStar",
                    amounts: { 1: -1, 2: -1, 3: -2 }
                }
            ]
        },
        {
            id: "silver-sail",
            name: "银帆鲭",
            race: "杂鱼种族",
            rarity: "rare",
            slotSize: 1,
            baseValue: 13,
            dailyGain: 1,
            sellValue: 1,
            weight: "3.8kg",
            art: "./assets/fish/silver-sail.png",
            color: "#b8f3ff",
            rarityColor: "#4d91ff",
            effectText: "1星：放入水族馆时，自身价值 +2。2星：自身价值 +4。3星：自身价值 +4，且每次钓鱼可多选择 1 条鱼。",
            effects: [
                {
                    id: "silver-sail-enter-value",
                    hook: "onStoredAfterCatch",
                    type: "addSelfValueByStar",
                    amounts: { 1: 2, 2: 4, 3: 4 }
                },
                {
                    id: "silver-sail-pick-count",
                    hook: "modifyCatchPickCount",
                    type: "addCatchPickCountByStar",
                    amounts: { 1: 0, 2: 0, 3: 1 }
                }
            ]
        },
        {
            id: "stone-catfish",
            name: "石甲鲶",
            race: "杂鱼种族",
            rarity: "epic",
            slotSize: 1,
            baseValue: 20,
            dailyGain: 1,
            sellValue: 1,
            weight: "2.8kg",
            art: "./assets/fish/stone-catfish.png",
            color: "#7d9494",
            rarityColor: "#9b5cff",
            effectText: "1星：每日价值成长额外 +2。2星：额外 +3。3星：额外 +5。",
            effects: [
                {
                    id: "stone-catfish-daily-value",
                    hook: "modifyDailyValueGain",
                    type: "addDailyValueGainByStar",
                    amounts: { 1: 2, 2: 3, 3: 5 }
                }
            ]
        },
        {
            id: "deep-crown",
            name: "深冠鳐",
            race: "杂鱼种族",
            rarity: "epic",
            slotSize: 2,
            baseValue: 24,
            dailyGain: 1,
            sellValue: 1,
            weight: "6.4kg",
            art: "./assets/fish/deep-crown.png",
            color: "#946cff",
            rarityColor: "#9b5cff",
            effectText: "占 2 格。1星：放入水族馆时获得 8G。2星：获得 12G。3星：获得 16G。",
            effects: [
                {
                    id: "deep-crown-gain-coins",
                    hook: "onStoredAfterCatch",
                    type: "gainCoinsByStar",
                    amounts: { 1: 8, 2: 12, 3: 16 }
                }
            ]
        },
        {
            id: "gold-dragon",
            name: "金纹龙鱼",
            race: "杂鱼种族",
            rarity: "legendary",
            slotSize: 2,
            baseValue: 42,
            dailyGain: 1,
            sellValue: 1,
            weight: "5.6kg",
            art: "./assets/fish/gold-dragon.png",
            color: "#ffd166",
            rarityColor: "#ff9f43",
            effectText: "占 2 格。1星：新一天开始时获得 3G。2星：获得 5G。3星：获得 8G，且钓鱼费用 -1G。",
            effects: [
                {
                    id: "gold-dragon-daily-coins",
                    hook: "onDayStart",
                    type: "gainCoinsByStar",
                    amounts: { 1: 3, 2: 5, 3: 8 }
                },
                {
                    id: "gold-dragon-fishing-cost",
                    hook: "modifyFishingCost",
                    type: "addFishingCostByStar",
                    amounts: { 1: 0, 2: 0, 3: -1 }
                }
            ]
        },
        {
            id: "deep-monster",
            name: "深海异王",
            race: "杂鱼种族",
            rarity: "mythic",
            slotSize: 2,
            baseValue: 55,
            dailyGain: 1,
            sellValue: 1,
            weight: "12.0kg",
            art: "./assets/fish/deep-monster.png",
            color: "#ff4d5f",
            rarityColor: "#ff4d5f",
            effectText: "占 2 格。1星：新一天开始时，水族馆最高价值鱼 +8。2星：改为 +12。3星：改为 +18，且钓鱼费用 -2G。",
            effects: [
                {
                    id: "deep-monster-highest-value",
                    hook: "onDayStart",
                    type: "addValueToHighestPondByStar",
                    amounts: { 1: 8, 2: 12, 3: 18 }
                },
                {
                    id: "deep-monster-fishing-cost",
                    hook: "modifyFishingCost",
                    type: "addFishingCostByStar",
                    amounts: { 1: 0, 2: 0, 3: -2 }
                }
            ]
        },
        {
            id: "school-silver-minnow",
            name: "小群银鱼",
            archetype: "school-growth",
            race: "共生鱼",
            rarity: "common",
            slotSize: 1,
            baseValue: 1,
            dailyGain: 1,
            sellValue: 1,
            tags: ["school", "growth", "enter"],
            art: "./assets/fish/silver-sail.png",
            color: "#d8edf2",
            rarityColor: "#f4f7fb",
            effectText: "1星：入馆时，每有1条其他共生鱼，自身价值+1，最多+3。2星：上限+5。3星：上限+7；入馆后共生鱼达到5条时额外+2。",
            effects: [
                {
                    id: "school-silver-minnow-enter",
                    hook: "onEnterPond",
                    type: "schoolSilverMinnowEnter",
                    archetype: "school-growth",
                    amount: 1,
                    caps: { 1: 3, 2: 5, 3: 7 },
                    star3Threshold: 5,
                    star3Bonus: 2
                }
            ]
        },
        {
            id: "school-edge-crucian",
            name: "贴边小鲫",
            archetype: "school-growth",
            race: "共生鱼",
            rarity: "common",
            slotSize: 1,
            baseValue: 1,
            dailyGain: 1,
            sellValue: 1,
            tags: ["school", "growth", "adjacent", "daily"],
            art: "./assets/fish/orange-carp.png",
            color: "#f1c27d",
            rarityColor: "#f4f7fb",
            effectText: "1星：新一天开始时，如果相邻有鱼，自身价值+1。2星：如果相邻有共生鱼，改为+2。3星：每有1条相邻共生鱼，自身价值+1，最多+4。",
            effects: [
                {
                    id: "school-edge-crucian-daily",
                    hook: "onDayStart",
                    type: "schoolEdgeCrucianDaily",
                    archetype: "school-growth",
                    amount: 1,
                    star3Cap: 4
                }
            ]
        },
        {
            id: "school-green-leader",
            name: "领游青鱼",
            archetype: "school-growth",
            race: "共生鱼",
            rarity: "uncommon",
            slotSize: 1,
            baseValue: 2,
            dailyGain: 1,
            sellValue: 1,
            tags: ["school", "support", "adjacent", "daily"],
            art: "./assets/fish/blue-scale.png",
            color: "#51d96b",
            rarityColor: "#51d96b",
            effectText: "1星：新一天开始时，所有相邻鱼价值+1。2星：相邻共生鱼额外+1。3星：相邻鱼全部+1；相邻共生鱼再+2。",
            effects: [
                {
                    id: "school-green-leader-daily",
                    hook: "onDayStart",
                    type: "schoolGreenLeaderDaily",
                    archetype: "school-growth",
                    baseAmount: 1
                }
            ]
        },
        {
            id: "school-tide-follower",
            name: "跟潮鳞鱼",
            archetype: "school-growth",
            race: "共生鱼",
            rarity: "uncommon",
            slotSize: 1,
            baseValue: 2,
            dailyGain: 1,
            sellValue: 1,
            tags: ["school", "growth", "enter"],
            art: "./assets/fish/glow-fish.png",
            color: "#79ffc9",
            rarityColor: "#51d96b",
            effectText: "1星：入馆时，如果已有至少3条鱼，自身价值+3。2星：条件降低为至少2条鱼。3星：如果已有至少4条共生鱼，自身价值额外+4。",
            effects: [
                {
                    id: "school-tide-follower-enter",
                    hook: "onEnterPond",
                    type: "schoolTideFollowerEnter",
                    archetype: "school-growth",
                    amount: 3,
                    star3SchoolThreshold: 4,
                    star3Bonus: 4
                }
            ]
        },
        {
            id: "school-twin-tail",
            name: "并游双尾",
            archetype: "school-growth",
            race: "共生鱼",
            rarity: "uncommon",
            slotSize: 1,
            baseValue: 2,
            dailyGain: 1,
            sellValue: 1,
            tags: ["school", "growth", "adjacent", "daily"],
            art: "./assets/fish/red-lantern.png",
            color: "#ff8a7a",
            rarityColor: "#51d96b",
            effectText: "1星：新一天开始时，如果相邻有共生鱼，自身价值+2。2星：改为+3。3星：如果相邻有2条以上共生鱼，额外使其中价值最低的1条+2。",
            effects: [
                {
                    id: "school-twin-tail-daily",
                    hook: "onDayStart",
                    type: "schoolTwinTailDaily",
                    archetype: "school-growth",
                    star3Bonus: 2
                }
            ]
        },
        {
            id: "school-bluefin-ring",
            name: "环游蓝鳍",
            archetype: "school-growth",
            race: "共生鱼",
            rarity: "rare",
            slotSize: 1,
            baseValue: 3,
            dailyGain: 1,
            sellValue: 1,
            tags: ["school", "growth", "daily", "count"],
            art: "./assets/fish/moon-bass.png",
            color: "#4d91ff",
            rarityColor: "#4d91ff",
            effectText: "1星：新一天开始时，每有2条共生鱼，自身价值+1。2星：改为每有2条+2。3星：改为每有1条共生鱼，自身价值+1。",
            effects: [
                {
                    id: "school-bluefin-ring-daily",
                    hook: "onDayStart",
                    type: "schoolBluefinRingDaily",
                    archetype: "school-growth",
                    amount: 1
                }
            ]
        },
        {
            id: "school-scale-gatherer",
            name: "聚鳞鱼",
            archetype: "school-growth",
            race: "共生鱼",
            rarity: "rare",
            slotSize: 1,
            baseValue: 3,
            dailyGain: 1,
            sellValue: 1,
            tags: ["school", "support", "enter"],
            art: "./assets/fish/armor-fish.png",
            color: "#8cc3ff",
            rarityColor: "#4d91ff",
            effectText: "1星：入馆时，所有共生鱼价值+1。2星：改为+2。3星：额外让本次进入水族馆的共生鱼获得+2。",
            effects: [
                {
                    id: "school-scale-gatherer-enter",
                    hook: "onEnterPond",
                    type: "schoolScaleGathererEnter",
                    archetype: "school-growth",
                    star3SelfBonus: 2
                }
            ]
        },
        {
            id: "school-reef-guardian",
            name: "占潮石斑",
            archetype: "school-growth",
            race: "共生鱼",
            rarity: "rare",
            slotSize: 1,
            baseValue: 3,
            dailyGain: 1,
            sellValue: 1,
            tags: ["school", "growth", "adjacent", "enter"],
            art: "./assets/fish/stone-catfish.png",
            color: "#7da0b2",
            rarityColor: "#4d91ff",
            effectText: "1星：每当有鱼入馆时，如果自身相邻有空位，自身价值+1，每天最多3次。2星：每天最多5次。3星：如果进入的是共生鱼，额外+1。",
            effects: [
                {
                    id: "school-reef-guardian-enter",
                    hook: "onEnterPond",
                    type: "schoolReefGuardianOnEnter",
                    archetype: "school-growth"
                }
            ]
        },
        {
            id: "school-three-line-lantern",
            name: "三线灯鱼",
            archetype: "school-growth",
            race: "共生鱼",
            rarity: "rare",
            slotSize: 1,
            baseValue: 3,
            dailyGain: 1,
            sellValue: 1,
            tags: ["school", "combine", "support"],
            art: "./assets/fish/red-lantern.png",
            color: "#ffdb73",
            rarityColor: "#4d91ff",
            effectText: "1星：自身参与合成后，随机2条共生鱼价值+3。2星：改为+4。3星：改为选择价值最低的3条共生鱼，各+4。",
            effects: [
                {
                    id: "school-three-line-lantern-combine",
                    hook: "onCombineResult",
                    type: "schoolThreeLineLanternCombine",
                    archetype: "school-growth"
                }
            ]
        },
        {
            id: "school-herald",
            name: "鱼群号令者",
            archetype: "school-growth",
            race: "共生鱼",
            rarity: "epic",
            slotSize: 1,
            baseValue: 4,
            dailyGain: 1,
            sellValue: 1,
            tags: ["school", "support", "daily", "count"],
            art: "./assets/fish/deep-crown.png",
            color: "#9b5cff",
            rarityColor: "#9b5cff",
            effectText: "1星：新一天开始时，共生鱼每有3条，所有共生鱼价值+1。2星：改为每有2条+1。3星：如果有7条以上共生鱼，本效果额外触发1次。",
            effects: [
                {
                    id: "school-herald-daily",
                    hook: "onDayStart",
                    type: "schoolHeraldDaily",
                    archetype: "school-growth"
                }
            ]
        },
        {
            id: "school-star-bream",
            name: "星纹群鲷",
            archetype: "school-growth",
            race: "共生鱼",
            rarity: "epic",
            slotSize: 1,
            baseValue: 4,
            dailyGain: 1,
            sellValue: 1,
            tags: ["school", "growth", "combine"],
            art: "./assets/fish/glow-fish.png",
            color: "#c89cff",
            rarityColor: "#9b5cff",
            effectText: "1星：每当任意共生鱼合成时，自身价值+5。2星：改为+7。3星：如果合成结果为3星，自身价值额外+8。",
            effects: [
                {
                    id: "school-star-bream-combine",
                    hook: "onCombineResult",
                    type: "schoolStarBreamCombine",
                    archetype: "school-growth",
                    star3Bonus: 8
                }
            ]
        },
        {
            id: "school-return-sailfish",
            name: "回游旗鱼",
            archetype: "school-growth",
            race: "共生鱼",
            rarity: "epic",
            slotSize: 1,
            baseValue: 4,
            dailyGain: 1,
            sellValue: 1,
            tags: ["school", "copy", "enter", "adjacent"],
            art: "./assets/fish/silver-sail.png",
            color: "#b8f3ff",
            rarityColor: "#9b5cff",
            effectText: "1星：入馆时，复制相邻一条鱼本日已获得的价值成长，最多6点。2星：上限9点。3星：复制后，目标鱼也获得复制值的一半。",
            effects: [
                {
                    id: "school-return-sailfish-enter",
                    hook: "onEnterPond",
                    type: "schoolReturnSailfishEnter",
                    archetype: "school-growth"
                }
            ]
        },
        {
            id: "school-dense-guard",
            name: "密鳞护卫",
            archetype: "school-growth",
            race: "共生鱼",
            rarity: "epic",
            slotSize: 2,
            baseValue: 4,
            dailyGain: 1,
            sellValue: 1,
            tags: ["school", "growth", "adjacent", "support"],
            art: "./assets/fish/armor-fish.png",
            color: "#6c7fb2",
            rarityColor: "#9b5cff",
            effectText: "占2格。1星：相邻共生鱼获得价值时，自身也+1，每天最多4次。2星：最多6次。3星：每天首次触发时，相邻共生鱼也额外+1。",
            effects: [
                {
                    id: "school-dense-guard-gain",
                    hook: "onCardValueGain",
                    type: "schoolDenseGuardValueGain",
                    archetype: "school-growth"
                }
            ]
        },
        {
            id: "school-tide-king",
            name: "万尾潮王",
            archetype: "school-growth",
            race: "共生鱼",
            rarity: "legendary",
            slotSize: 1,
            baseValue: 6,
            dailyGain: 1,
            sellValue: 1,
            tags: ["school", "growth", "daily", "count"],
            art: "./assets/fish/gold-dragon.png",
            color: "#ffcf6a",
            rarityColor: "#ff9f43",
            effectText: "1星：新一天开始时，每有1条共生鱼，自身价值+1；水族馆满时额外+5。2星：满馆额外+8。3星：满馆时所有其他共生鱼+2。",
            effects: [
                {
                    id: "school-tide-king-daily",
                    hook: "onDayStart",
                    type: "schoolTideKingDaily",
                    archetype: "school-growth"
                }
            ]
        },
        {
            id: "school-mother-of-stars",
            name: "群星母鱼",
            archetype: "school-growth",
            race: "共生鱼",
            rarity: "legendary",
            slotSize: 1,
            baseValue: 6,
            dailyGain: 1,
            sellValue: 1,
            tags: ["school", "combine", "support"],
            art: "./assets/fish/deep-crown.png",
            color: "#f6e85a",
            rarityColor: "#ff9f43",
            effectText: "1星：每当共生鱼合成时，合成鱼额外获得星数×2价值。2星：改为星数×3。3星：如果合成鱼为3星，额外使所有共生鱼+3。",
            effects: [
                {
                    id: "school-mother-of-stars-combine",
                    hook: "onCombineResult",
                    type: "schoolMotherOfStarsCombine",
                    archetype: "school-growth"
                }
            ]
        },
        {
            id: "school-golden-resonance",
            name: "共鸣金鲤",
            archetype: "school-growth",
            race: "共生鱼",
            rarity: "legendary",
            slotSize: 1,
            baseValue: 6,
            dailyGain: 1,
            sellValue: 1,
            tags: ["school", "support", "daily", "value"],
            art: "./assets/fish/orange-carp.png",
            color: "#ffb84d",
            rarityColor: "#ff9f43",
            effectText: "1星：新一天开始时，取最高价值共生鱼的20%平分给其他共生鱼，单鱼最多+5。2星：上限+8。3星：比例30%，且自身+3。",
            effects: [
                {
                    id: "school-golden-resonance-daily",
                    hook: "onDayStart",
                    type: "schoolGoldenResonanceDaily",
                    archetype: "school-growth"
                }
            ]
        },
        {
            id: "school-nine-tide-ancestor",
            name: "九潮祖鱼",
            archetype: "school-growth",
            race: "共生鱼",
            rarity: "mythic",
            slotSize: 2,
            baseValue: 9,
            dailyGain: 1,
            sellValue: 1,
            tags: ["school", "support", "daily", "count"],
            art: "./assets/fish/deep-monster.png",
            color: "#ff4d5f",
            rarityColor: "#ff4d5f",
            effectText: "占2格。1星：新一天开始时，如果有6条以上共生鱼，所有共生鱼+3；满馆时额外+6。2星：提高为+4和额外+8。3星：满馆时共生鱼每日成长额外+1。",
            effects: [
                {
                    id: "school-nine-tide-ancestor-daily",
                    hook: "onDayStart",
                    type: "schoolNineTideAncestorDaily",
                    archetype: "school-growth"
                },
                {
                    id: "school-nine-tide-ancestor-daily-gain",
                    hook: "modifyDailyValueGain",
                    type: "schoolNineTideAncestorDailyGain",
                    archetype: "school-growth"
                }
            ]
        },
        {
            id: "school-all-scales-one",
            name: "万鳞归一",
            archetype: "school-growth",
            race: "共生鱼",
            rarity: "mythic",
            slotSize: 1,
            baseValue: 9,
            dailyGain: 1,
            sellValue: 1,
            tags: ["school", "combine", "finisher"],
            art: "./assets/fish/red-rare.png",
            color: "#ff6b8a",
            rarityColor: "#ff4d5f",
            effectText: "1星：每当有3星共生鱼生成时，所有共生鱼获得该鱼星数×2价值。2星：改为×3。3星：额外触发1次；每次触发后自身+9。",
            effects: [
                {
                    id: "school-all-scales-one-combine",
                    hook: "onCombineResult",
                    type: "schoolAllScalesOneCombine",
                    archetype: "school-growth"
                }
            ]
        }
    ]
};

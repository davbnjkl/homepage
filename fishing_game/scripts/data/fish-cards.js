// Fish card definitions are split out so card design can grow without touching core rules.
window.FISHING_GAME_DATA.fishPool.push(
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
            id: "shift-grid-darter",
            name: "游格小鲦",
            archetype: "position-shift",
            race: "迁游鱼",
            rarity: "common",
            slotSize: 1,
            baseValue: 1,
            dailyGain: 1,
            sellValue: 1,
            tags: ["shift", "move", "growth", "daily"],
            art: "./assets/fish/blue-scale.png",
            color: "#9bd7ff",
            rarityColor: "#f4f7fb",
            effectText: "1星：新一天开始时，如果相邻有空格，移动过去并获得 +1 价值。2星：移动后获得 +2 价值。3星：移动后获得 +2 价值；如果移动后位于边缘，额外 +1。",
            effects: [
                {
                    id: "shift-grid-darter-daily",
                    hook: "onDayStart",
                    type: "shiftMoveToAdjacentEmptyDaily",
                    archetype: "position-shift",
                    amounts: { 1: 1, 2: 2, 3: 2 }
                }
            ]
        },
        {
            id: "shift-corner-loach",
            name: "贴角泥鳅",
            archetype: "position-shift",
            race: "迁游鱼",
            rarity: "common",
            slotSize: 1,
            baseValue: 1,
            dailyGain: 1,
            sellValue: 1,
            tags: ["shift", "corner", "growth", "daily"],
            art: "./assets/fish/stone-catfish.png",
            color: "#a77b54",
            rarityColor: "#f4f7fb",
            effectText: "1星：新一天开始时，如果在角落则价值 +2；否则向最近角落移动并价值 +1。2星：角落 +3，移动 +2。3星：角落 +4；移动后相邻迁游鱼 +1。",
            effects: [
                {
                    id: "shift-corner-loach-daily",
                    hook: "onDayStart",
                    type: "shiftCornerLoachDaily",
                    archetype: "position-shift",
                    cornerAmounts: { 1: 2, 2: 3, 3: 4 },
                    moveAmounts: { 1: 1, 2: 2, 3: 2 },
                    star3AdjacentBonus: 1
                }
            ]
        },
        {
            id: "shift-current-scale",
            name: "顺流青鳞",
            archetype: "position-shift",
            race: "迁游鱼",
            rarity: "uncommon",
            slotSize: 1,
            baseValue: 2,
            dailyGain: 1,
            sellValue: 1,
            tags: ["shift", "support", "row", "value-gain"],
            art: "./assets/fish/glow-fish.png",
            color: "#62f2b3",
            rarityColor: "#51d96b",
            effectText: "1星：其他迁游鱼移动后，如果和自身在同一行，自身价值 +1，每天最多 3 次。2星：每天最多 5 次。3星：同一行或同一列都可触发，每天最多 6 次。",
            effects: [
                {
                    id: "shift-current-scale-moved",
                    hook: "onCardMoved",
                    type: "shiftCurrentScaleMoved",
                    archetype: "position-shift",
                    amount: 1,
                    limits: { 1: 3, 2: 5, 3: 6 }
                }
            ]
        },
        {
            id: "shift-nest-carp",
            name: "换巢鲤",
            archetype: "position-shift",
            race: "迁游鱼",
            rarity: "uncommon",
            slotSize: 1,
            baseValue: 2,
            dailyGain: 1,
            sellValue: 1,
            tags: ["shift", "swap", "enter", "support"],
            art: "./assets/fish/orange-carp.png",
            color: "#ffc46b",
            rarityColor: "#51d96b",
            effectText: "1星：进入水族馆时，与相邻鱼换位；成功后双方各 +2 价值。2星：双方各 +3。3星：如果目标也是迁游鱼，目标额外 +2。",
            effects: [
                {
                    id: "shift-nest-carp-enter",
                    hook: "onStoredAfterCatch",
                    type: "shiftNestCarpEnter",
                    archetype: "position-shift",
                    amounts: { 1: 2, 2: 3, 3: 3 },
                    star3TargetBonus: 2
                }
            ]
        },
        {
            id: "shift-edge-lantern",
            name: "边巡灯鱼",
            archetype: "position-shift",
            race: "迁游鱼",
            rarity: "uncommon",
            slotSize: 1,
            baseValue: 2,
            dailyGain: 1,
            sellValue: 1,
            tags: ["shift", "edge", "growth", "daily"],
            art: "./assets/fish/red-lantern.png",
            color: "#ff8f84",
            rarityColor: "#51d96b",
            effectText: "1星：新一天开始时，如果在边缘，自身价值 +2；如果今天移动过，额外 +1。2星：边缘 +3，移动额外 +2。3星：边缘 +4；同一行或同一列迁游鱼 +1。",
            effects: [
                {
                    id: "shift-edge-lantern-daily",
                    hook: "onDayStart",
                    type: "shiftEdgeLanternDaily",
                    archetype: "position-shift",
                    edgeAmounts: { 1: 2, 2: 3, 3: 4 },
                    movedAmounts: { 1: 1, 2: 2, 3: 2 },
                    star3LineBonus: 1
                }
            ]
        },
        {
            id: "shift-center-goldfish",
            name: "中庭金鲫",
            archetype: "position-shift",
            race: "迁游鱼",
            rarity: "rare",
            slotSize: 1,
            baseValue: 3,
            dailyGain: 1,
            sellValue: 1,
            tags: ["shift", "center", "growth", "daily"],
            art: "./assets/fish/gold-dragon.png",
            color: "#ffd46b",
            rarityColor: "#4d91ff",
            effectText: "1星：新一天开始时，如果在中心，自身价值 +4；否则向中心移动并价值 +2。2星：中心 +5，移动 +3。3星：如果移动进入中心，所有迁游鱼 +2。",
            effects: [
                {
                    id: "shift-center-goldfish-daily",
                    hook: "onDayStart",
                    type: "shiftCenterGoldfishDaily",
                    archetype: "position-shift",
                    centerAmounts: { 1: 4, 2: 5, 3: 5 },
                    moveAmounts: { 1: 2, 2: 3, 3: 3 },
                    star3AllBonus: 2
                }
            ]
        },
        {
            id: "shift-loop-eel",
            name: "回环鳗",
            archetype: "position-shift",
            race: "迁游鱼",
            rarity: "rare",
            slotSize: 1,
            baseValue: 3,
            dailyGain: 1,
            sellValue: 1,
            tags: ["shift", "move", "growth", "value-gain"],
            art: "./assets/fish/silver-sail.png",
            color: "#b6ecff",
            rarityColor: "#4d91ff",
            effectText: "1星：自身移动时，每移动 1 格价值 +2，每天最多 +6。2星：每格 +3，每天最多 +9。3星：每天第一次移动后，额外触发一次自身移动收益。",
            effects: [
                {
                    id: "shift-loop-eel-moved",
                    hook: "onCardMoved",
                    type: "shiftLoopEelMoved",
                    archetype: "position-shift",
                    amounts: { 1: 2, 2: 3, 3: 3 },
                    caps: { 1: 6, 2: 9, 3: 9 }
                }
            ]
        },
        {
            id: "shift-three-line-fish",
            name: "排浪三线鱼",
            archetype: "position-shift",
            race: "迁游鱼",
            rarity: "rare",
            slotSize: 1,
            baseValue: 3,
            dailyGain: 1,
            sellValue: 1,
            tags: ["shift", "row", "column", "support", "daily"],
            art: "./assets/fish/moon-bass.png",
            color: "#7fb7ff",
            rarityColor: "#4d91ff",
            effectText: "1星：新一天开始时，如果任意一行有 3 条迁游鱼，该行各 +2。2星：任意一行或一列都可触发。3星：触发行列各 +3，自身额外 +2。",
            effects: [
                {
                    id: "shift-three-line-fish-daily",
                    hook: "onDayStart",
                    type: "shiftThreeLineFishDaily",
                    archetype: "position-shift",
                    star3SelfBonus: 2
                }
            ]
        },
        {
            id: "shift-vacancy-stargazer",
            name: "空位占星鱼",
            archetype: "position-shift",
            race: "迁游鱼",
            rarity: "rare",
            slotSize: 1,
            baseValue: 3,
            dailyGain: 1,
            sellValue: 1,
            tags: ["shift", "empty", "sell", "growth"],
            art: "./assets/fish/glow-fish.png",
            color: "#b08cff",
            rarityColor: "#4d91ff",
            effectText: "1星：出售鱼卡出现空位后，如果能移动到该空位相邻格，自身价值 +3，每天最多 1 次。2星：改为 +5。3星：下一张放入该空位相邻格的鱼额外 +2。",
            effects: [
                {
                    id: "shift-vacancy-stargazer-sold",
                    hook: "onFishSold",
                    type: "shiftVacancyStargazerSold",
                    archetype: "position-shift",
                    amounts: { 1: 3, 2: 5, 3: 5 }
                },
                {
                    id: "shift-vacancy-stargazer-enter",
                    hook: "onEnterPond",
                    type: "shiftVacancyStargazerEnter",
                    archetype: "position-shift",
                    star3EnterBonus: 2
                }
            ]
        },
        {
            id: "shift-tide-pusher",
            name: "潮汐推手",
            archetype: "position-shift",
            race: "迁游鱼",
            rarity: "epic",
            slotSize: 1,
            baseValue: 4,
            dailyGain: 1,
            sellValue: 1,
            tags: ["shift", "move", "support", "daily"],
            art: "./assets/fish/deep-crown.png",
            color: "#9f7cff",
            rarityColor: "#9b5cff",
            effectText: "1星：新一天开始时，使 1 条相邻迁游鱼移动；被移动鱼价值 +3。2星：可移动 2 条。3星：被移动鱼价值 +4；并使移动收益 +1。",
            effects: [
                {
                    id: "shift-tide-pusher-daily",
                    hook: "onDayStart",
                    type: "shiftTidePusherDaily",
                    archetype: "position-shift"
                },
                {
                    id: "shift-tide-pusher-move-reward",
                    hook: "modifyMoveReward",
                    type: "addMoveReward",
                    amount: 1,
                    minStar: 3
                }
            ]
        },
        {
            id: "shift-mirror-ray",
            name: "镜位魟",
            archetype: "position-shift",
            race: "迁游鱼",
            rarity: "epic",
            slotSize: 1,
            baseValue: 4,
            dailyGain: 1,
            sellValue: 1,
            tags: ["shift", "mirror", "support", "daily"],
            art: "./assets/fish/deep-crown.png",
            color: "#cba2ff",
            rarityColor: "#9b5cff",
            effectText: "1星：新一天开始时，如果中心对称位置有鱼，双方各 +3。2星：双方各 +5。3星：对称位置是迁游鱼则双方额外 +2；对称位为空时可以移动过去。",
            effects: [
                {
                    id: "shift-mirror-ray-daily",
                    hook: "onDayStart",
                    type: "shiftMirrorRayDaily",
                    archetype: "position-shift",
                    amounts: { 1: 3, 2: 5, 3: 5 },
                    star3ShiftBonus: 2
                }
            ]
        },
        {
            id: "shift-nine-grid-bream",
            name: "九宫巡游鲷",
            archetype: "position-shift",
            race: "迁游鱼",
            rarity: "epic",
            slotSize: 1,
            baseValue: 4,
            dailyGain: 1,
            sellValue: 1,
            tags: ["shift", "path", "growth", "daily"],
            art: "./assets/fish/orange-carp.png",
            color: "#ffb070",
            rarityColor: "#9b5cff",
            effectText: "1星：自身每到达一个本轮未到达过的位置，自身价值 +4。2星：改为 +6。3星：到达过 4 个不同位置后，所有迁游鱼 +4，每局最多一次。",
            effects: [
                {
                    id: "shift-nine-grid-bream-moved",
                    hook: "onCardMoved",
                    type: "shiftNineGridBreamMoved",
                    archetype: "position-shift",
                    amounts: { 1: 4, 2: 6, 3: 6 },
                    star3AllBonus: 4
                }
            ]
        },
        {
            id: "shift-anchor-grouper",
            name: "压阵石斑",
            archetype: "position-shift",
            race: "迁游鱼",
            rarity: "epic",
            slotSize: 2,
            baseValue: 4,
            dailyGain: 1,
            sellValue: 1,
            tags: ["shift", "large", "support", "row", "column"],
            art: "./assets/fish/armor-fish.png",
            color: "#8e9bb8",
            rarityColor: "#9b5cff",
            effectText: "1星：占 2 格。同一行或同一列迁游鱼移动时，那条鱼 +2；自身被移动时自身 +8。2星：同线 +3，自身 +12。3星：每天首次同线奖励时，自身额外 +4。",
            effects: [
                {
                    id: "shift-anchor-grouper-moved",
                    hook: "onCardMoved",
                    type: "shiftAnchorGrouperMoved",
                    archetype: "position-shift",
                    lineAmounts: { 1: 2, 2: 3, 3: 3 },
                    selfAmounts: { 1: 8, 2: 12, 3: 12 },
                    star3SelfBonus: 4
                }
            ]
        },
        {
            id: "shift-tide-gate-dragon",
            name: "潮门龙鱼",
            archetype: "position-shift",
            race: "迁游鱼",
            rarity: "legendary",
            slotSize: 1,
            baseValue: 6,
            dailyGain: 1,
            sellValue: 1,
            tags: ["shift", "center", "support", "daily"],
            art: "./assets/fish/gold-dragon.png",
            color: "#ffd35d",
            rarityColor: "#ff9f43",
            effectText: "1星：每天第一次有迁游鱼移动进入中心时，所有迁游鱼 +3。2星：改为 +4。3星：如果进入中心的是 3 星鱼，它额外 +10。",
            effects: [
                {
                    id: "shift-tide-gate-dragon-moved",
                    hook: "onCardMoved",
                    type: "shiftTideGateDragonMoved",
                    archetype: "position-shift",
                    amounts: { 1: 3, 2: 4, 3: 4 },
                    star3MovedBonus: 10
                }
            ]
        },
        {
            id: "shift-all-image-swapper",
            name: "万象换位鱼",
            archetype: "position-shift",
            race: "迁游鱼",
            rarity: "legendary",
            slotSize: 1,
            baseValue: 6,
            dailyGain: 1,
            sellValue: 1,
            tags: ["shift", "swap", "value", "daily"],
            art: "./assets/fish/red-rare.png",
            color: "#ffbf7c",
            rarityColor: "#ff9f43",
            effectText: "1星：新一天开始时，使最高价值和最低价值鱼换位；双方获得价值差一半，最多 +10。2星：上限 +15。3星：换位后，所有迁游鱼获得本日换位次数价值，最多 +6。",
            effects: [
                {
                    id: "shift-all-image-swapper-daily",
                    hook: "onDayStart",
                    type: "shiftAllImageSwapperDaily",
                    archetype: "position-shift"
                },
                {
                    id: "shift-all-image-swapper-moved",
                    hook: "onCardMoved",
                    type: "shiftAllImageSwapperMoved",
                    archetype: "position-shift",
                    star3Cap: 6
                }
            ]
        },
        {
            id: "shift-star-track-koi",
            name: "星轨皇鲤",
            archetype: "position-shift",
            race: "迁游鱼",
            rarity: "legendary",
            slotSize: 1,
            baseValue: 6,
            dailyGain: 1,
            sellValue: 1,
            tags: ["shift", "diagonal", "support", "daily"],
            art: "./assets/fish/glow-fish.png",
            color: "#ffe66d",
            rarityColor: "#ff9f43",
            effectText: "1星：新一天开始时，如果任意对角线有 3 条迁游鱼，该对角线各 +6。2星：各 +8。3星：触发后两端换位，成功则该对角线额外各 +3。",
            effects: [
                {
                    id: "shift-star-track-koi-daily",
                    hook: "onDayStart",
                    type: "shiftStarTrackKoiDaily",
                    archetype: "position-shift",
                    amounts: { 1: 6, 2: 8, 3: 8 },
                    star3SwapBonus: 3
                }
            ]
        },
        {
            id: "shift-nine-grid-deity",
            name: "九宫游神",
            archetype: "position-shift",
            race: "迁游鱼",
            rarity: "mythic",
            slotSize: 1,
            baseValue: 9,
            dailyGain: 1,
            sellValue: 1,
            tags: ["shift", "finisher", "support", "value-gain"],
            art: "./assets/fish/deep-monster.png",
            color: "#ff5e78",
            rarityColor: "#ff4d5f",
            effectText: "1星：任意迁游鱼移动时，所有迁游鱼 +1，每天最多 9 次。2星：每次 +2。3星：每天最多 12 次；每天第一次额外推动最低价值迁游鱼移动。",
            effects: [
                {
                    id: "shift-nine-grid-deity-moved",
                    hook: "onCardMoved",
                    type: "shiftNineGridDeityMoved",
                    archetype: "position-shift"
                },
                {
                    id: "shift-nine-grid-deity-daily",
                    hook: "onDayStart",
                    type: "shiftNineGridDeityDaily",
                    archetype: "position-shift"
                }
            ]
        },
        {
            id: "shift-return-mothership",
            name: "归潮母舰",
            archetype: "position-shift",
            race: "迁游鱼",
            rarity: "mythic",
            slotSize: 2,
            baseValue: 9,
            dailyGain: 1,
            sellValue: 1,
            tags: ["shift", "large", "path", "finisher", "daily"],
            art: "./assets/fish/deep-monster.png",
            color: "#ff4d9a",
            rarityColor: "#ff4d5f",
            effectText: "1星：占 2 格。新一天开始时，迁游鱼路径上的鱼各 +5。2星：各 +7。3星：如果路径包含中心和至少 2 个角落，奖励额外触发一次；自身 +9。",
            effects: [
                {
                    id: "shift-return-mothership-daily",
                    hook: "onDayStart",
                    type: "shiftReturnMothershipDaily",
                    archetype: "position-shift"
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
);

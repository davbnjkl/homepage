window.FISHING_CARD_EFFECTS = {
    runCardHook(card, hook, context) {
        if (!card || !Array.isArray(card.effects)) {
            return;
        }

        card.effects
            .filter((effect) => effect.hook === hook)
            .forEach((effect) => this.runEffect(effect, card, context));
    },

    runCardsHook(cards, hook, context) {
        cards.forEach((card) => this.runCardHook(card, hook, context));
    },

    modifyNumberWithCard(card, hook, baseValue, context) {
        if (!card || !Array.isArray(card.effects)) {
            return baseValue;
        }

        return card.effects
            .filter((effect) => effect.hook === hook)
            .reduce((value, effect) => this.modifyNumber(effect, card, value, context), baseValue);
    },

    modifyNumberWithCards(cards, hook, baseValue, context) {
        return cards.reduce(
            (value, card) => this.modifyNumberWithCard(card, hook, value, context),
            baseValue
        );
    },

    runEffect(effect, card, context) {
        const handler = this.handlers[effect.type];

        if (!handler || !handler.run) {
            return;
        }

        handler.run(effect, card, context);
    },

    modifyNumber(effect, card, value, context) {
        const handler = this.handlers[effect.type];

        if (!handler || !handler.modifyNumber) {
            return value;
        }

        return handler.modifyNumber(effect, card, value, context);
    },

    utils: {
        star(card) {
            return Math.max(1, Math.min(3, Math.floor(card?.star || 1)));
        },

        starValue(effect, key, card, fallback = 0) {
            const star = this.star(card);
            const config = effect[key];

            if (config && typeof config === "object") {
                return config[star] ?? config[String(star)] ?? config.default ?? fallback;
            }

            return Number.isFinite(config) ? config : fallback;
        },

        isEnteringSelf(card, context) {
            return Boolean(context.enteringCard && context.enteringCard.uid === card.uid);
        },

        isSchoolCard(card, archetype = "school-growth") {
            return card?.archetype === archetype;
        },

        schoolCards(context, archetype = "school-growth", options = {}) {
            if (context.pondCardsByArchetype) {
                return context.pondCardsByArchetype(archetype, options);
            }

            return context.ownedCards().filter((card) => {
                if (card.archetype !== archetype) {
                    return false;
                }

                return !options.excludeUid || card.uid !== options.excludeUid;
            });
        },

        addValue(context, target, amount, sourceCard = null, triggerGain = true) {
            if (!target || amount <= 0) {
                return 0;
            }

            if (context.addValueToCard) {
                return context.addValueToCard(target, amount, {
                    sourceCard,
                    triggerGain
                });
            }

            target.value = (target.value || 0) + Math.floor(amount);
            return Math.floor(amount);
        },

        lowestByValue(cards, context, count) {
            return [...cards]
                .sort((left, right) => context.fishCardValue(left) - context.fishCardValue(right))
                .slice(0, count);
        },

        highestByValue(cards, context) {
            return cards.reduce((best, current) => {
                if (!best || context.fishCardValue(current) > context.fishCardValue(best)) {
                    return current;
                }

                return best;
            }, null);
        }
    },

    handlers: {
        reserved: {},

        addSellValue: {
            modifyNumber(effect, card, value, context) {
                if (effect.scope !== "all" && context.targetCard && context.targetCard.uid !== card.uid) {
                    return value;
                }

                return value + effect.amount;
            }
        },

        addSellValueByStar: {
            modifyNumber(effect, card, value, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (effect.scope !== "all" && context.targetCard && context.targetCard.uid !== card.uid) {
                    return value;
                }

                return value + utils.starValue(effect, "amounts", card, effect.amount || 0);
            }
        },

        addSellValueEveryNthSale: {
            modifyNumber(effect, card, value, context) {
                const interval = Math.max(1, Math.floor(effect.interval || 1));
                const soldCount = context.state?.stats?.soldFish || 0;
                const nextSaleCount = soldCount + 1;

                if (nextSaleCount % interval !== 0) {
                    return value;
                }

                return value + (effect.amount || 0);
            }
        },

        addSaleValue: {
            run(effect, card, context) {
                if (!context.sale) {
                    return;
                }

                context.sale.value += effect.amount;
            }
        },

        addDailyValueGain: {
            modifyNumber(effect, card, value, context) {
                if (effect.scope !== "all" && context.targetCard && context.targetCard.uid !== card.uid) {
                    return value;
                }

                return value + effect.amount;
            }
        },

        addDailyValueGainByStar: {
            modifyNumber(effect, card, value, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (effect.scope !== "all" && context.targetCard && context.targetCard.uid !== card.uid) {
                    return value;
                }

                return value + utils.starValue(effect, "amounts", card, effect.amount || 0);
            }
        },

        addCardValue: {
            modifyNumber(effect, card, value, context) {
                if (effect.scope !== "all" && context.targetCard && context.targetCard.uid !== card.uid) {
                    return value;
                }

                return value + effect.amount;
            }
        },

        multiplyCardValue: {
            modifyNumber(effect, card, value, context) {
                if (effect.scope !== "all" && context.targetCard && context.targetCard.uid !== card.uid) {
                    return value;
                }

                return value * effect.multiplier;
            }
        },

        cancelSale: {
            run(effect, card, context) {
                if (!context.sale) {
                    return;
                }

                context.sale.cancelled = true;
            }
        },

        gainCoins: {
            run(effect, card, context) {
                context.state.coins += effect.amount;
                context.addLog(`${card.name} 带来沉船宝物，获得 ${effect.amount}G。`);
            }
        },

        gainCoinsByStar: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const amount = utils.starValue(effect, "amounts", card, effect.amount || 0);

                if (amount <= 0) {
                    return;
                }

                context.state.coins += amount;
                context.addLog(`${card.name} 的效果触发，获得 ${amount}G。`);
            }
        },

        chanceGainCoins: {
            run(effect, card, context) {
                if (context.random() >= effect.chance) {
                    context.addLog(`${card.name} 的金币效果没有触发。`);
                    return;
                }

                context.state.coins += effect.amount;
                context.addLog(`${card.name} 的效果触发，获得 ${effect.amount}G。`);
            }
        },

        chanceGainCoinsByStar: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const chance = utils.starValue(effect, "chances", card, effect.chance || 0);
                const amount = utils.starValue(effect, "amounts", card, effect.amount || 0);

                if (context.random() >= chance) {
                    context.addLog(`${card.name} 的金币效果没有触发。`);
                    return;
                }

                context.state.coins += amount;
                context.addLog(`${card.name} 的效果触发，获得 ${amount}G。`);
            }
        },

        addCatchPickCount: {
            modifyNumber(effect, card, value) {
                return value + effect.amount;
            }
        },

        addCatchPickCountByStar: {
            modifyNumber(effect, card, value) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                return value + utils.starValue(effect, "amounts", card, effect.amount || 0);
            }
        },

        addFishingCost: {
            modifyNumber(effect, card, value) {
                return value + effect.amount;
            }
        },

        addFishingCostByStar: {
            modifyNumber(effect, card, value) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                return value + utils.starValue(effect, "amounts", card, effect.amount || 0);
            }
        },

        addCoreUpgradeCost: {
            modifyNumber(effect, card, value) {
                return value + effect.amount;
            }
        },

        addCoreUpgradeCostByStar: {
            modifyNumber(effect, card, value) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                return value + utils.starValue(effect, "amounts", card, effect.amount || 0);
            }
        },

        multiplyFishingCost: {
            modifyNumber(effect, card, value) {
                return value * effect.multiplier;
            }
        },

        addCapacity: {
            modifyNumber(effect, card, value) {
                return value + effect.amount;
            }
        },

        setCardSlotSize: {
            modifyNumber(effect, card, value, context) {
                if (effect.scope !== "all" && context.targetCard && context.targetCard.uid !== card.uid) {
                    return value;
                }

                return effect.size;
            }
        },

        addCardSlotSize: {
            modifyNumber(effect, card, value, context) {
                if (effect.scope !== "all" && context.targetCard && context.targetCard.uid !== card.uid) {
                    return value;
                }

                return value + effect.amount;
            }
        },

        addRarityWeight: {
            run(effect, card, context) {
                const target = context.rarityWeights.find((item) => item.rarity === effect.rarity);

                if (target) {
                    target.weight += effect.amount;
                    return;
                }

                context.rarityWeights.push({ rarity: effect.rarity, weight: effect.amount });
            }
        },

        multiplyRarityWeight: {
            run(effect, card, context) {
                const target = context.rarityWeights.find((item) => item.rarity === effect.rarity);

                if (!target) {
                    return;
                }

                target.weight *= effect.multiplier;
            }
        },

        setRarityWeight: {
            run(effect, card, context) {
                const target = context.rarityWeights.find((item) => item.rarity === effect.rarity);

                if (target) {
                    target.weight = effect.weight;
                    return;
                }

                context.rarityWeights.push({ rarity: effect.rarity, weight: effect.weight });
            }
        },

        multiplyRarityWeights: {
            run(effect, card, context) {
                if (effect.periodId && context.period?.id !== effect.periodId) {
                    return;
                }

                if (Number.isFinite(effect.maxTripCatchCount) && context.tripCatchCount > effect.maxTripCatchCount) {
                    return;
                }

                Object.entries(effect.multipliers || {}).forEach(([rarity, multiplier]) => {
                    const target = context.rarityWeights.find((item) => item.rarity === rarity);

                    if (!target) {
                        return;
                    }

                    target.weight *= multiplier;
                });
            }
        },

        adjustFishingChargeWindow: {
            run(effect, card, context) {
                if (!context.chargeWindow) {
                    return;
                }

                ["perfectStartMs", "perfectEndMs", "maxMs", "rarityBonus"].forEach((key) => {
                    if (Number.isFinite(effect[key])) {
                        context.chargeWindow[key] += effect[key];
                    }
                });
            }
        },

        addValueToLowestPond: {
            run(effect, card, context) {
                const target = context.state.pond.reduce((lowest, fish) => {
                    if (!lowest || context.fishCardValue(fish) < context.fishCardValue(lowest)) {
                        return fish;
                    }

                    return lowest;
                }, null);

                if (!target) {
                    return;
                }

                if (context.addValueToCard) {
                    context.addValueToCard(target, effect.amount, { sourceCard: card });
                } else {
                    target.value = (target.value || 0) + effect.amount;
                }
                context.addLog(`${card.name} 的被动触发，「${target.name}」价值 +${effect.amount}。`);
            }
        },

        addCombinedCardValue: {
            run(effect, card, context) {
                if (!context.combinedCard) {
                    return;
                }

                if (context.addValueToCard) {
                    context.addValueToCard(context.combinedCard, effect.amount, { sourceCard: card });
                } else {
                    context.combinedCard.value = (context.combinedCard.value || 0) + effect.amount;
                }
                context.addLog(`${card.name} 的被动触发，合成结果价值 +${effect.amount}。`);
            }
        },

        addSelfValueByStar: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const amount = utils.starValue(effect, "amounts", card, effect.amount || 0);

                if (utils.addValue(context, card, amount, card)) {
                    context.addLog(`${card.name} 的效果触发，自身价值 +${amount}。`);
                }
            }
        },

        addValueToHighestPondByStar: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const target = utils.highestByValue(context.ownedCards(), context);
                const amount = utils.starValue(effect, "amounts", card, effect.amount || 0);

                if (!target) {
                    return;
                }

                if (utils.addValue(context, target, amount, card)) {
                    context.addLog(`${card.name} 强化最高价值鱼，「${target.name}」价值 +${amount}。`);
                }
            }
        },

        schoolSilverMinnowEnter: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (!utils.isEnteringSelf(card, context)) {
                    return;
                }

                const count = context.countPondCardsByArchetype(effect.archetype, { excludeUid: card.uid });
                const cap = utils.starValue(effect, "caps", card, 3);
                let gain = Math.min(count * (effect.amount || 1), cap);

                if (utils.star(card) >= 3 && count + 1 >= (effect.star3Threshold || 5)) {
                    gain += effect.star3Bonus || 0;
                }

                if (utils.addValue(context, card, gain, card)) {
                    context.addLog(`${card.name} 聚成小群，价值 +${gain}。`);
                }
            }
        },

        schoolEdgeCrucianDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const adjacent = context.adjacentPondCards(card);
                const schoolAdjacent = adjacent.filter((fish) => utils.isSchoolCard(fish, effect.archetype));
                let gain = 0;

                if (utils.star(card) >= 3) {
                    gain = Math.min(schoolAdjacent.length * (effect.amount || 1), effect.star3Cap || 4);
                } else if (schoolAdjacent.length > 0) {
                    gain = utils.star(card) >= 2 ? 2 : 1;
                } else if (adjacent.length > 0) {
                    gain = 1;
                }

                if (utils.addValue(context, card, gain, card)) {
                    context.addLog(`${card.name} 贴着鱼群成长，价值 +${gain}。`);
                }
            }
        },

        schoolGreenLeaderDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const adjacent = context.adjacentPondCards(card);
                const schoolBonus = utils.star(card) >= 3 ? 2 : utils.star(card) >= 2 ? 1 : 0;
                let changed = 0;

                adjacent.forEach((target) => {
                    const gain = (effect.baseAmount || 1)
                        + (utils.isSchoolCard(target, effect.archetype) ? schoolBonus : 0);
                    changed += utils.addValue(context, target, gain, card);
                });

                if (changed > 0) {
                    context.addLog(`${card.name} 领游相邻鱼，合计价值 +${changed}。`);
                }
            }
        },

        schoolTideFollowerEnter: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (!utils.isEnteringSelf(card, context)) {
                    return;
                }

                const otherFishCount = context.ownedCards().filter((fish) => fish.uid !== card.uid).length;
                const threshold = utils.star(card) >= 2 ? 2 : 3;
                let gain = otherFishCount >= threshold ? effect.amount || 3 : 0;
                const schoolCount = context.countPondCardsByArchetype(effect.archetype, { excludeUid: card.uid });

                if (utils.star(card) >= 3 && schoolCount >= (effect.star3SchoolThreshold || 4)) {
                    gain += effect.star3Bonus || 4;
                }

                if (utils.addValue(context, card, gain, card)) {
                    context.addLog(`${card.name} 跟上潮水，价值 +${gain}。`);
                }
            }
        },

        schoolTwinTailDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const schoolAdjacent = context.adjacentPondCards(card)
                    .filter((fish) => utils.isSchoolCard(fish, effect.archetype));

                if (schoolAdjacent.length <= 0) {
                    return;
                }

                const gain = utils.star(card) >= 2 ? 3 : 2;
                utils.addValue(context, card, gain, card);

                if (utils.star(card) >= 3 && schoolAdjacent.length >= 2) {
                    const target = utils.lowestByValue(schoolAdjacent, context, 1)[0];
                    utils.addValue(context, target, effect.star3Bonus || 2, card);
                }

                context.addLog(`${card.name} 并游成长，价值 +${gain}。`);
            }
        },

        schoolBluefinRingDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const count = context.countPondCardsByArchetype(effect.archetype);
                const gain = utils.star(card) >= 3
                    ? count * (effect.amount || 1)
                    : Math.floor(count / 2) * (utils.star(card) >= 2 ? 2 : 1);

                if (utils.addValue(context, card, gain, card)) {
                    context.addLog(`${card.name} 环游鱼群，价值 +${gain}。`);
                }
            }
        },

        schoolScaleGathererEnter: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (!utils.isEnteringSelf(card, context)) {
                    return;
                }

                const amount = utils.star(card) >= 2 ? 2 : 1;
                let changed = 0;

                utils.schoolCards(context, effect.archetype).forEach((target) => {
                    changed += utils.addValue(context, target, amount, card);
                });

                if (utils.star(card) >= 3) {
                    changed += utils.addValue(context, card, effect.star3SelfBonus || 2, card);
                }

                if (changed > 0) {
                    context.addLog(`${card.name} 聚起鳞光，鱼群价值合计 +${changed}。`);
                }
            }
        },

        schoolReefGuardianOnEnter: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (!context.hasAdjacentEmptyPondCell(card)) {
                    return;
                }

                const limit = utils.star(card) >= 2 ? 5 : 3;
                const key = `reef-guardian-${card.uid}`;

                if (context.dailyCounter(card, key) >= limit) {
                    return;
                }

                context.incrementDailyCounter(card, key);
                const enteringIsSchool = utils.isSchoolCard(context.enteringCard, effect.archetype);
                const gain = 1 + (utils.star(card) >= 3 && enteringIsSchool ? 1 : 0);

                if (utils.addValue(context, card, gain, card)) {
                    context.addLog(`${card.name} 守住空潮，价值 +${gain}。`);
                }
            }
        },

        schoolThreeLineLanternCombine: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const combined = context.combinedCard;

                if (!combined || combined.uid !== card.uid || !utils.isSchoolCard(combined, effect.archetype)) {
                    return;
                }

                const targets = utils.star(card) >= 3
                    ? utils.lowestByValue(utils.schoolCards(context, effect.archetype), context, 3)
                    : utils.schoolCards(context, effect.archetype)
                        .sort(() => context.random() - 0.5)
                        .slice(0, 2);
                const amount = utils.star(card) >= 2 ? 4 : 3;
                let changed = 0;

                targets.forEach((target) => {
                    changed += utils.addValue(context, target, amount, card);
                });

                if (changed > 0) {
                    context.addLog(`${card.name} 合成后点亮鱼群，合计价值 +${changed}。`);
                }
            }
        },

        schoolHeraldDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const cards = utils.schoolCards(context, effect.archetype);
                const count = cards.length;
                const bucket = utils.star(card) >= 2 ? 2 : 3;
                const repeat = Math.floor(count / bucket) * (utils.star(card) >= 3 && count >= 7 ? 2 : 1);
                let changed = 0;

                cards.forEach((target) => {
                    changed += utils.addValue(context, target, repeat, card);
                });

                if (changed > 0) {
                    context.addLog(`${card.name} 号令鱼群，合计价值 +${changed}。`);
                }
            }
        },

        schoolStarBreamCombine: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const combined = context.combinedCard;

                if (!combined || !utils.isSchoolCard(combined, effect.archetype)) {
                    return;
                }

                let gain = utils.star(card) >= 2 ? 7 : 5;

                if (utils.star(card) >= 3 && (combined.star || 1) >= 3) {
                    gain += effect.star3Bonus || 8;
                }

                if (utils.addValue(context, card, gain, card)) {
                    context.addLog(`${card.name} 吸收合成星纹，价值 +${gain}。`);
                }
            }
        },

        schoolReturnSailfishEnter: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (!utils.isEnteringSelf(card, context)) {
                    return;
                }

                const target = context.adjacentPondCards(card)
                    .sort((left, right) => (right.valueGainedToday || 0) - (left.valueGainedToday || 0))[0];

                if (!target || !target.valueGainedToday) {
                    return;
                }

                const cap = utils.star(card) >= 2 ? 9 : 6;
                const copied = Math.min(target.valueGainedToday || 0, cap);

                utils.addValue(context, card, copied, card);

                if (utils.star(card) >= 3) {
                    utils.addValue(context, target, Math.floor(copied / 2), card);
                }

                context.addLog(`${card.name} 复制回游成长，价值 +${copied}。`);
            }
        },

        schoolDenseGuardValueGain: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const target = context.gainedCard;

                if (!target || target.uid === card.uid || !utils.isSchoolCard(target, effect.archetype)) {
                    return;
                }

                if (!context.adjacentPondCards(card).some((fish) => fish.uid === target.uid)) {
                    return;
                }

                const limit = utils.star(card) >= 2 ? 6 : 4;
                const key = `dense-guard-${card.uid}`;
                const used = context.dailyCounter(card, key);

                if (used >= limit) {
                    return;
                }

                context.incrementDailyCounter(card, key);
                utils.addValue(context, card, 1, card);

                if (utils.star(card) >= 3 && used === 0) {
                    utils.addValue(context, target, 1, card, false);
                }
            }
        },

        schoolTideKingDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const cards = utils.schoolCards(context, effect.archetype);
                const full = context.isPondFull();
                let gain = cards.length;

                if (full) {
                    gain += utils.star(card) >= 2 ? 8 : 5;
                }

                utils.addValue(context, card, gain, card);

                if (full && utils.star(card) >= 3) {
                    cards
                        .filter((target) => target.uid !== card.uid)
                        .forEach((target) => utils.addValue(context, target, 2, card));
                }

                if (gain > 0) {
                    context.addLog(`${card.name} 唤起万尾潮，价值 +${gain}。`);
                }
            }
        },

        schoolMotherOfStarsCombine: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const combined = context.combinedCard;

                if (!combined || !utils.isSchoolCard(combined, effect.archetype)) {
                    return;
                }

                const multiplier = utils.star(card) >= 2 ? 3 : 2;
                const gain = (combined.star || 1) * multiplier;

                utils.addValue(context, combined, gain, card);

                if (utils.star(card) >= 3 && (combined.star || 1) >= 3) {
                    utils.schoolCards(context, effect.archetype).forEach((target) => {
                        utils.addValue(context, target, 3, card);
                    });
                }

                context.addLog(`${card.name} 强化合成结果，价值 +${gain}。`);
            }
        },

        schoolGoldenResonanceDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const cards = utils.schoolCards(context, effect.archetype);
                const top = utils.highestByValue(cards, context);
                const targets = cards.filter((target) => target.uid !== top?.uid);

                if (!top || targets.length <= 0) {
                    return;
                }

                const ratio = utils.star(card) >= 3 ? 0.3 : 0.2;
                const cap = utils.star(card) >= 2 ? 8 : 5;
                const total = Math.floor(context.fishCardValue(top) * ratio);
                const each = Math.min(cap, Math.floor(total / targets.length));
                let changed = 0;

                targets.forEach((target) => {
                    changed += utils.addValue(context, target, each, card);
                });

                if (utils.star(card) >= 3) {
                    changed += utils.addValue(context, card, 3, card);
                }

                if (changed > 0) {
                    context.addLog(`${card.name} 共鸣分流，鱼群合计价值 +${changed}。`);
                }
            }
        },

        schoolNineTideAncestorDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const cards = utils.schoolCards(context, effect.archetype);
                const count = cards.length;

                if (count < 6) {
                    return;
                }

                let amount = utils.star(card) >= 2 ? 4 : 3;

                if (count >= 9 || context.isPondFull()) {
                    amount += utils.star(card) >= 2 ? 8 : 6;
                }

                let changed = 0;
                cards.forEach((target) => {
                    changed += utils.addValue(context, target, amount, card);
                });

                if (changed > 0) {
                    context.addLog(`${card.name} 召回九潮，鱼群合计价值 +${changed}。`);
                }
            }
        },

        schoolNineTideAncestorDailyGain: {
            modifyNumber(effect, card, value, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (utils.star(card) < 3 || !context.targetCard || !utils.isSchoolCard(context.targetCard, effect.archetype)) {
                    return value;
                }

                const count = context.countPondCardsByArchetype(effect.archetype);

                return count >= 9 || context.isPondFull() ? value + 1 : value;
            }
        },

        schoolAllScalesOneCombine: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const combined = context.combinedCard;

                if (!combined || !utils.isSchoolCard(combined, effect.archetype) || (combined.star || 1) < 3) {
                    return;
                }

                const multiplier = utils.star(card) >= 2 ? 3 : 2;
                const repeat = utils.star(card) >= 3 ? 2 : 1;
                const amount = (combined.star || 1) * multiplier;
                let changed = 0;

                for (let index = 0; index < repeat; index += 1) {
                    utils.schoolCards(context, effect.archetype).forEach((target) => {
                        changed += utils.addValue(context, target, amount, card);
                    });
                }

                if (utils.star(card) >= 3) {
                    changed += utils.addValue(context, card, 9 * repeat, card);
                }

                if (changed > 0) {
                    context.addLog(`${card.name} 万鳞归一，鱼群合计价值 +${changed}。`);
                }
            }
        }
    }
};

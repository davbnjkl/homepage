// modifier effects.
Object.assign(window.FISHING_CARD_EFFECTS.handlers, {
reserved: {},

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

falconCutlineFishingCost: {
            modifyNumber(effect, card, value) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                return value + utils.starValue(effect, "amounts", card, -1);
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

addBaseDailyCoinCap: {
            modifyNumber(effect, card, value) {
                return value + effect.amount;
            }
        },

addBaseDailyCoinCapByStar: {
            modifyNumber(effect, card, value) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                return value + utils.starValue(effect, "amounts", card, effect.amount || 0);
            }
        },

addCheckpointCoinRetention: {
            modifyNumber(effect, card, value) {
                return value + effect.amount;
            }
        },

addCheckpointCoinRetentionByStar: {
            modifyNumber(effect, card, value) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                return value + utils.starValue(effect, "amounts", card, effect.amount || 0);
            }
        },

retainCheckpointCoinPercent: {
            modifyNumber(effect, card, value, context) {
                const coinsBeforeCheckpoint = Math.max(0, Math.floor(context.coinsBeforeCheckpoint || 0));
                const percent = Math.max(0, effect.percent || 0);

                return value + Math.floor(coinsBeforeCheckpoint * percent);
            }
        },

multiplyFishingCost: {
            modifyNumber(effect, card, value) {
                return value * effect.multiplier;
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

falconHeadwindRarity: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const multipliers = utils.starValue(effect, "multipliers", card, {});

                Object.entries(multipliers || {}).forEach(([rarity, multiplier]) => {
                    const target = context.rarityWeights.find((item) => item.rarity === rarity);

                    if (target) {
                        target.weight *= multiplier;
                    }
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

addMoveReward: {
            modifyNumber(effect, card, value) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (utils.star(card) < (effect.minStar || 1)) {
                    return value;
                }

                return value + (effect.amount || 0);
            }
        },

falconRedwingJudgeRetention: {
            modifyNumber(effect, card, value, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (utils.star(card) < 3 || !context.passed || (context.totalValue || 0) - (context.target || 0) < (effect.threshold || 20)) {
                    return value;
                }

                return value + (effect.amount || 2);
            }
        },

falconCloudCutterRetention: {
            modifyNumber(effect, card, value, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (!context.passed) {
                    return value;
                }

                const percent = utils.starValue(effect, "percents", card, 0.15);
                return value + Math.floor(Math.max(0, context.coinsBeforeCheckpoint || 0) * percent);
            }
        }
});

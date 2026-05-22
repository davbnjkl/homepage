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

        addCatchPickCount: {
            modifyNumber(effect, card, value) {
                return value + effect.amount;
            }
        },

        addFishingCost: {
            modifyNumber(effect, card, value) {
                return value + effect.amount;
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

                target.value = (target.value || 0) + effect.amount;
                context.addLog(`${card.name} 的被动触发，「${target.name}」价值 +${effect.amount}。`);
            }
        },

        addCombinedCardValue: {
            run(effect, card, context) {
                if (!context.combinedCard) {
                    return;
                }

                context.combinedCard.value = (context.combinedCard.value || 0) + effect.amount;
                context.addLog(`${card.name} 的被动触发，合成结果价值 +${effect.amount}。`);
            }
        }
    }
};

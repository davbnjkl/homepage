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

        gainBait: {
            run(effect, card, context) {
                context.addBaitToTrip(effect.baitId, effect.amount);
                const bait = context.data.baitTypes[effect.baitId]
                    || context.data.baitTypes.blue
                    || context.data.baitTypes.basic;
                context.addLog(`${card.name} 的效果触发，本次出海获得 ${effect.amount} 个${bait.name}。`);
            }
        },

        unlockNightChance: {
            run(effect, card, context) {
                if (context.random() < effect.chance) {
                    context.state.nightUnlocked = true;
                    context.addLog(`${card.name} 点亮海面，今晚夜航机会已开启。`);
                    return;
                }

                context.addLog(`${card.name} 的夜航效果没有触发。`);
            }
        },

        unlockNight: {
            run(effect, card, context) {
                context.state.nightUnlocked = true;
                context.addLog(`${card.name} 开启了今晚夜航机会。`);
            }
        },

        gainCoins: {
            run(effect, card, context) {
                context.state.coins += effect.amount;
                context.addLog(`${card.name} 带来沉船宝物，获得 ${effect.amount}G。`);
            }
        },

        legendaryBurst: {
            run(effect, card, context) {
                context.state.nightUnlocked = true;
                context.addBaitToTrip("blue", 1);
                context.addLog(`${card.name} 的传说效果触发：今晚可夜航，并获得 1 个蓝色饵料。`);
            }
        },

        addTripBait: {
            run(effect, card, context) {
                context.addBaitToTrip(effect.baitId, effect.amount);
                const bait = context.data.baitTypes[effect.baitId]
                    || context.data.baitTypes.blue
                    || context.data.baitTypes.basic;
                context.addLog(`${card.name} 在出海准备时加入 ${effect.amount} 个${bait.name}。`);
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

        addBaitBuyCost: {
            modifyNumber(effect, card, value) {
                return value + effect.amount;
            }
        },

        multiplyBaitBuyCost: {
            modifyNumber(effect, card, value) {
                return value * effect.multiplier;
            }
        },

        addBaitSellValue: {
            modifyNumber(effect, card, value) {
                return value + effect.amount;
            }
        },

        multiplyBaitSellValue: {
            modifyNumber(effect, card, value) {
                return value * effect.multiplier;
            }
        },

        addDailyBaitGain: {
            modifyNumber(effect, card, value) {
                return value + effect.amount;
            }
        },

        addBaitCapacity: {
            modifyNumber(effect, card, value) {
                return value + effect.amount;
            }
        },

        gainReserveBait: {
            run(effect, card, context) {
                const baitId = effect.baitId === "current"
                    ? context.baitIdForLevel?.(context.state.baitLevel)
                    : effect.baitId;
                const added = context.addBaitToReserve(baitId, effect.amount);
                const bait = context.data.baitTypes[baitId] || context.data.baitTypes.basic;
                context.addLog(`${card.name} 的被动触发，库存获得 ${added}/${effect.amount} 个${bait.name}。`);
            }
        },

        chanceUnlockNightAfterPeriod: {
            run(effect, card, context) {
                if (context.period?.id !== effect.periodId) {
                    return;
                }

                if (context.random() < effect.chance) {
                    context.state.nightUnlocked = true;
                    context.addLog(`${card.name} 的被动触发，今晚夜航机会已开启。`);
                }
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

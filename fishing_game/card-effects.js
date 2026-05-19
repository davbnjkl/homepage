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
                context.addLog(`${card.name} 的效果触发，本次出海获得 ${effect.amount} 个${context.data.baitTypes[effect.baitId].name}。`);
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
                context.addBaitToTrip("fine", 1);
                context.addLog(`${card.name} 的传说效果触发：今晚可夜航，并获得 1 个精制饵。`);
            }
        },

        addTripBait: {
            run(effect, card, context) {
                context.addBaitToTrip(effect.baitId, effect.amount);
                context.addLog(`${card.name} 在出海准备时加入 ${effect.amount} 个${context.data.baitTypes[effect.baitId].name}。`);
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
        }
    }
};

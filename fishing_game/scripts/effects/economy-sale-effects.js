// economy sale effects.
Object.assign(window.FISHING_CARD_EFFECTS.handlers, {
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

falconGoldPeckerSold: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const sold = context.soldCard || context.card;

                if (!sold || sold.uid === card.uid) {
                    return;
                }

                const amount = utils.starValue(effect, "amounts", card, 2);
                utils.addValue(context, card, amount, card);

                const key = `falcon-gold-pecker-sale-${card.uid}`;
                if (utils.star(card) >= 3 && context.dailyCounter(card, key) <= 0) {
                    context.incrementDailyCounter(card, key);
                    context.state.coins += effect.star3FirstSaleCoin || 1;
                }
            }
        },

falconDiveSailfishSold: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (!context.directFromCatch || utils.star(card) >= 2) {
                    return;
                }

                const loss = utils.starValue(effect, "lossAmounts", card, 2);
                const changed = utils.removeValue(context, card, loss, card);
                if (changed > 0) {
                    context.addLog(`${card.name} 俯冲落空，价值 -${changed}。`);
                }
            }
        },

falconBlackPlunderSellValue: {
            modifyNumber(effect, card, value, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (!context.targetCard || context.targetCard.uid === card.uid) {
                    return value;
                }

                return value + utils.starValue(effect, "amounts", card, 1);
            }
        },

falconBlackPlunderSold: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const sold = context.soldCard || context.card;

                if (!sold || sold.uid === card.uid) {
                    return;
                }

                const percent = utils.starValue(effect, "percents", card, 0.2);
                const absorbed = Math.floor((context.fishCardValue?.(sold) || sold.value || 0) * percent);

                if (absorbed > 0) {
                    utils.addValue(context, card, absorbed, card);
                    context.addLog(`${card.name} 掠夺「${sold.name}」余势，价值 +${absorbed}。`);
                }
            }
        }
});

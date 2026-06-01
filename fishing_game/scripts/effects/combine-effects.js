// combine effects.
Object.assign(window.FISHING_CARD_EFFECTS.handlers, {
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
                        utils.addValue(context, target, 2, card);
                    });
                }

                context.addLog(`${card.name} 强化合成结果，价值 +${gain}。`);
            }
        },

schoolAllScalesOneCombine: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const combined = context.combinedCard;

                if (!combined || !utils.isSchoolCard(combined, effect.archetype) || (combined.star || 1) < 3) {
                    return;
                }

                const multiplier = utils.star(card) >= 2 ? 2 : 1;
                const amount = (combined.star || 1) * multiplier;
                let changed = 0;

                utils.schoolCards(context, effect.archetype).forEach((target) => {
                    changed += utils.addValue(context, target, amount, card);
                });

                if (utils.star(card) >= 3) {
                    changed += utils.addValue(context, card, 6, card);
                }

                if (changed > 0) {
                    context.addLog(`${card.name} 万鳞归一，鱼群合计价值 +${changed}。`);
                }
            }
        },

falconFrostStarCombine: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const combined = context.combinedCard;
                const amount = utils.starValue(effect, "amounts", card, 6);

                utils.addValue(context, card, amount, card);

                if (utils.star(card) >= 3 && (combined?.star || 1) >= 3) {
                    utils.falconCards(context, effect.archetype).forEach((target) => {
                        utils.addValue(context, target, effect.star3AllBonus || 3, card);
                    });
                }

                context.addLog(`${card.name} 猎星合成，价值 +${amount}。`);
            }
        }
});

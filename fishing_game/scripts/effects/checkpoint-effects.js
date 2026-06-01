// Effects that resolve during the three-day checkpoint.
Object.assign(window.FISHING_CARD_EFFECTS.handlers, {
falconCutlineEelCheckpoint: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if ((context.state.coins || 0) <= 0) {
                    if (utils.star(card) >= 3) {
                        utils.addValue(context, card, effect.zeroCoinBonus || 6, card);
                    }
                    return;
                }

                const loss = utils.starValue(effect, "lossAmounts", card, 3);
                const changed = utils.removeValue(context, card, loss, card);
                if (changed > 0) {
                    context.addLog(`${card.name} 结算时仍有余钱，价值 -${changed}。`);
                }
            }
        },

falconRedwingJudgeCheckpoint: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (context.passed) {
                    const amount = utils.starValue(effect, "passAmounts", card, 8);
                    utils.addValue(context, card, amount, card);
                    return;
                }

                if (utils.star(card) >= 2) {
                    const current = Math.floor(card.value || 0);
                    card.value = Math.max(1, Math.floor(current / 2));
                    context.addLog(`${card.name} 审判失败，价值减半。`);
                    return;
                }

                card.value = 1;
                context.addLog(`${card.name} 审判失败，价值归 1。`);
            }
        },

falconCloudCutterCheckpoint: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const falcons = utils.falconCards(context, effect.archetype);

                if (!context.passed) {
                    const loss = utils.starValue(effect, "failLossAmounts", card, 4);
                    let changed = 0;
                    falcons.forEach((target) => {
                        changed += utils.removeValue(context, target, loss, card);
                    });
                    if (changed > 0) {
                        context.addLog(`${card.name} 裁云失败，隼鱼合计价值 -${changed}。`);
                    }
                    return;
                }

                if (utils.star(card) >= 3 && (context.totalValue || 0) - (context.target || 0) >= (effect.star3OverTargetThreshold || 30)) {
                    falcons.forEach((target) => utils.addValue(context, target, effect.star3OverTargetBonus || 4, card));
                }
            }
        },

falconEclipseDeityCheckpoint: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const overValue = (context.totalValue || 0) - (context.target || 0);
                const threshold = utils.starValue(effect, "thresholds", card, 20);

                if (context.passed && overValue >= threshold) {
                    const amount = utils.starValue(effect, "amounts", card, 18);
                    utils.addValue(context, card, amount, card);

                    if (utils.star(card) >= 3 && overValue >= (effect.star3GreatThreshold || 30)) {
                        context.state.temporaryBaseDailyCoinCapMods.push({
                            id: `${effect.id}-bonus-${context.state.day}`,
                            amount: effect.star3CapBonus || 1,
                            untilDay: context.state.day + 3
                        });
                    }
                    return;
                }

                context.state.temporaryBaseDailyCoinCapMods.push({
                    id: `${effect.id}-fail-${context.state.day}`,
                    amount: effect.failCapMod || -1,
                    untilDay: context.state.day + utils.starValue(effect, "failDurations", card, 3)
                });
                context.addLog(`${card.name} 日蚀未成，下一阶段基础每日金币上限 -1。`);
            }
        }
});

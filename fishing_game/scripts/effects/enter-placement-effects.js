// enter placement effects.
Object.assign(window.FISHING_CARD_EFFECTS.handlers, {
shiftNestCarpEnter: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (!utils.isEnteringSelf(card, context)) {
                    return;
                }

                const target = context.adjacentPondCards(card)[0];

                if (!target || !context.swapPondCards(card, target, { sourceCard: card, reason: effect.id })) {
                    return;
                }

                const amount = utils.moveReward(context, utils.starValue(effect, "amounts", card, 2), card, card, effect.id);
                utils.addValue(context, card, amount, card);
                utils.addValue(context, target, amount, card);

                if (utils.star(card) >= 3 && utils.isShiftCard(target, effect.archetype)) {
                    utils.addValue(context, target, effect.star3TargetBonus || 2, card);
                }

                context.addLog(`${card.name} 换巢成功，双方价值 +${amount}。`);
            }
        },

shiftVacancyStargazerEnter: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const entering = context.enteringCard || context.caughtFish;

                if (!entering || entering.uid === card.uid || !Number.isFinite(card.shiftVacancyBuffCell)) {
                    return;
                }

                const enteringCell = context.pondCellIndex(entering);
                const buffCell = card.shiftVacancyBuffCell;
                const adjacent = Math.abs(context.pondCellInfo(enteringCell).row - context.pondCellInfo(buffCell).row)
                    + Math.abs(context.pondCellInfo(enteringCell).column - context.pondCellInfo(buffCell).column) <= 1;

                if (adjacent) {
                    utils.addValue(context, entering, effect.star3EnterBonus || 2, card);
                    delete card.shiftVacancyBuffCell;
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
        }
});

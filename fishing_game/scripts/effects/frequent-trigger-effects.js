// frequent trigger effects.
Object.assign(window.FISHING_CARD_EFFECTS.handlers, {
shiftCurrentScaleMoved: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const moved = context.movedCard;

                if (!moved || moved.uid === card.uid || !utils.isShiftCard(moved, effect.archetype)) {
                    return;
                }

                const movedInfo = context.pondCellInfo(context.toCell);
                const ownInfo = context.pondCellInfo(context.pondCellIndex(card));
                const aligned = utils.star(card) >= 3
                    ? movedInfo.row === ownInfo.row || movedInfo.column === ownInfo.column
                    : movedInfo.row === ownInfo.row;

                if (!aligned) {
                    return;
                }

                const limit = utils.starValue(effect, "limits", card, 3);
                const key = `shift-current-scale-${card.uid}`;

                if (context.dailyCounter(card, key) >= limit) {
                    return;
                }

                context.incrementDailyCounter(card, key);
                utils.addValue(context, card, effect.amount || 1, card);
            }
        },

shiftLoopEelMoved: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (context.movedCard?.uid !== card.uid) {
                    return;
                }

                const key = `shift-loop-eel-${card.uid}`;
                const cap = utils.starValue(effect, "caps", card, 6);
                const used = context.dailyCounter(card, key);

                if (used >= cap) {
                    return;
                }

                const perCell = utils.starValue(effect, "amounts", card, 2);
                const rawGain = perCell * Math.max(1, context.distance || 1);
                const gain = Math.min(cap - used, rawGain);

                context.incrementDailyCounter(card, key, gain);
                utils.addValue(context, card, gain, card);

                if (utils.star(card) >= 3 && used === 0) {
                    const extra = Math.min(cap - context.dailyCounter(card, key), gain);
                    if (extra > 0) {
                        context.incrementDailyCounter(card, key, extra);
                        utils.addValue(context, card, extra, card);
                    }
                }
            }
        },

shiftVacancyStargazerSold: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const soldCell = context.soldCellIndex;

                if (!Number.isFinite(soldCell)) {
                    return;
                }

                const key = `shift-vacancy-${card.uid}`;

                if (context.dailyCounter(card, key) >= 1) {
                    return;
                }

                const targetCell = context.adjacentEmptyPondCells(card)
                    .find((cell) => Math.abs(context.pondCellInfo(cell).row - context.pondCellInfo(soldCell).row) + Math.abs(context.pondCellInfo(cell).column - context.pondCellInfo(soldCell).column) <= 1);

                if (!Number.isFinite(targetCell) || !context.movePondCard(card, targetCell, { sourceCard: card, reason: effect.id })) {
                    return;
                }

                context.incrementDailyCounter(card, key);
                const amount = utils.moveReward(context, utils.starValue(effect, "amounts", card, 3), card, card, effect.id);
                utils.addValue(context, card, amount, card);

                if (utils.star(card) >= 3) {
                    card.shiftVacancyBuffCell = soldCell;
                }
            }
        },

shiftNineGridBreamMoved: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (context.movedCard?.uid !== card.uid || !Number.isFinite(context.toCell)) {
                    return;
                }

                card.visitedCells = Array.isArray(card.visitedCells) ? card.visitedCells : [];

                if (card.visitedCells.includes(context.toCell)) {
                    return;
                }

                card.visitedCells.push(context.toCell);
                const amount = utils.starValue(effect, "amounts", card, 4);
                utils.addValue(context, card, amount, card);

                if (utils.star(card) >= 3 && card.visitedCells.length >= 4 && !card.shiftVisitedRewarded) {
                    card.shiftVisitedRewarded = true;
                    utils.shiftCards(context, effect.archetype).forEach((target) => utils.addValue(context, target, effect.star3AllBonus || 4, card));
                }
            }
        },

shiftAnchorGrouperMoved: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const moved = context.movedCard;

                if (!moved || !utils.isShiftCard(moved, effect.archetype)) {
                    return;
                }

                if (moved.uid === card.uid) {
                    const amount = utils.starValue(effect, "selfAmounts", card, 8);
                    utils.addValue(context, card, amount, card);
                    return;
                }

                const ownInfo = context.pondCellInfo(context.pondCellIndex(card));
                const movedInfo = context.pondCellInfo(context.toCell);

                if (ownInfo.row !== movedInfo.row && ownInfo.column !== movedInfo.column) {
                    return;
                }

                const amount = utils.starValue(effect, "lineAmounts", card, 2);
                utils.addValue(context, moved, amount, card);

                const key = `shift-anchor-${card.uid}`;
                if (utils.star(card) >= 3 && context.dailyCounter(card, key) <= 0) {
                    context.incrementDailyCounter(card, key);
                    utils.addValue(context, card, effect.star3SelfBonus || 4, card);
                }
            }
        },

shiftTideGateDragonMoved: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const moved = context.movedCard;

                if (!moved || !utils.isShiftCard(moved, effect.archetype) || context.toCell !== 4) {
                    return;
                }

                const key = `shift-tide-gate-${card.uid}`;
                if (context.dailyCounter(card, key) > 0) {
                    return;
                }

                context.incrementDailyCounter(card, key);
                const amount = utils.starValue(effect, "amounts", card, 3);
                utils.shiftCards(context, effect.archetype).forEach((target) => utils.addValue(context, target, amount, card));

                if (utils.star(card) >= 3 && utils.star(moved) >= 3) {
                    utils.addValue(context, moved, effect.star3MovedBonus || 10, card);
                }
            }
        },

shiftAllImageSwapperMoved: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (utils.star(card) < 3 || !context.isSwap) {
                    return;
                }

                if (context.swapId && card.lastProcessedShiftSwapId === context.swapId) {
                    return;
                }

                if (context.swapId) {
                    card.lastProcessedShiftSwapId = context.swapId;
                }

                const key = `shift-swaps-${card.uid}`;
                const swaps = context.incrementDailyCounter(card, key);
                const amount = Math.min(effect.star3Cap || 6, swaps);

                if (amount <= 0) {
                    return;
                }

                utils.shiftCards(context, effect.archetype).forEach((target) => utils.addValue(context, target, amount, card));
            }
        },

shiftNineGridDeityMoved: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const moved = context.movedCard;

                if (!moved || !utils.isShiftCard(moved, effect.archetype)) {
                    return;
                }

                const limit = utils.starValue(effect, "limits", card, 6);
                const key = `shift-deity-${card.uid}`;

                if (context.dailyCounter(card, key) >= limit) {
                    return;
                }

                context.incrementDailyCounter(card, key);
                const amount = utils.starValue(effect, "amounts", card, 1);
                utils.shiftCards(context, effect.archetype).forEach((target) => utils.addValue(context, target, amount, card));
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

falconLockEyeGain: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const target = context.gainedCard;

                if (!target || target.uid !== card.falconMarkUid || context.sourceCard?.uid === card.uid) {
                    return;
                }

                const amount = utils.starValue(effect, "amounts", card, 1);
                utils.addValue(context, card, amount, card, false);
                card.falconMarkTriggered = true;

                const key = `falcon-lock-eye-target-bonus-${card.uid}`;
                if (utils.star(card) >= 3 && utils.isFalconCard(target, effect.archetype) && context.dailyCounter(card, key) <= 0) {
                    context.incrementDailyCounter(card, key);
                    utils.addValue(context, target, effect.star3TargetBonus || 2, card);
                }
            }
        }
});

// daily effects.
Object.assign(window.FISHING_CARD_EFFECTS.handlers, {
shiftMoveToAdjacentEmptyDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const targetCell = context.adjacentEmptyPondCells(card)[0];

                if (!Number.isFinite(targetCell)) {
                    return;
                }

                const moved = context.movePondCard(card, targetCell, { sourceCard: card, reason: effect.id || "shift-daily" });
                const amount = utils.moveReward(
                    context,
                    utils.starValue(effect, "amounts", card, effect.amount || 1),
                    card,
                    card,
                    effect.id
                );

                if (moved && utils.addValue(context, card, amount, card)) {
                    context.addLog(`${card.name} 游过新格，价值 +${amount}。`);
                }
            }
        },

shiftCornerLoachDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const cell = context.pondCellIndex(card);
                const info = context.pondCellInfo(cell);

                if (info.isCorner) {
                    const amount = utils.starValue(effect, "cornerAmounts", card, 2);
                    if (utils.addValue(context, card, amount, card)) {
                        context.addLog(`${card.name} 贴住角落，价值 +${amount}。`);
                    }
                    return;
                }

                const corners = [0, 2, 6, 8];
                const targetCell = context.adjacentEmptyPondCells(card)
                    .sort((left, right) => {
                        const leftDistance = Math.min(...corners.map((corner) => Math.abs(context.pondCellInfo(left).row - context.pondCellInfo(corner).row) + Math.abs(context.pondCellInfo(left).column - context.pondCellInfo(corner).column)));
                        const rightDistance = Math.min(...corners.map((corner) => Math.abs(context.pondCellInfo(right).row - context.pondCellInfo(corner).row) + Math.abs(context.pondCellInfo(right).column - context.pondCellInfo(corner).column)));
                        return leftDistance - rightDistance;
                    })[0];

                if (!Number.isFinite(targetCell) || !context.movePondCard(card, targetCell, { sourceCard: card, reason: effect.id })) {
                    return;
                }

                const amount = utils.moveReward(context, utils.starValue(effect, "moveAmounts", card, 1), card, card, effect.id);
                utils.addValue(context, card, amount, card);

                if (utils.star(card) >= 3) {
                    const target = context.adjacentPondCards(card)
                        .find((fish) => utils.isShiftCard(fish, effect.archetype));
                    if (target) {
                        utils.addValue(context, target, effect.star3AdjacentBonus || 1, card);
                    }
                }

                context.addLog(`${card.name} 向角落迁游，价值 +${amount}。`);
            }
        },

shiftEdgeLanternDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const info = context.pondCellInfo(context.pondCellIndex(card));
                let gain = info.isEdge ? utils.starValue(effect, "edgeAmounts", card, 2) : 0;

                if ((card.dailyCounters?.[`moved-${card.uid}`] || 0) > 0) {
                    gain += utils.starValue(effect, "movedAmounts", card, 1);
                }

                if (gain > 0) {
                    utils.addValue(context, card, gain, card);
                }

                if (utils.star(card) >= 3) {
                    const target = context.pondCardsInSameLine(card)
                        .find((fish) => utils.isShiftCard(fish, effect.archetype));
                    if (target) {
                        utils.addValue(context, target, effect.star3LineBonus || 1, card);
                    }
                }
            }
        },

shiftCenterGoldfishDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const cell = context.pondCellIndex(card);

                if (cell === 4) {
                    const amount = utils.starValue(effect, "centerAmounts", card, 4);
                    if (utils.addValue(context, card, amount, card)) {
                        context.addLog(`${card.name} 占住中庭，价值 +${amount}。`);
                    }
                    return;
                }

                const currentDistance = Math.abs(context.pondCellInfo(cell).row - 1) + Math.abs(context.pondCellInfo(cell).column - 1);
                const targetCell = context.adjacentEmptyPondCells(card)
                    .filter((candidate) => {
                        const info = context.pondCellInfo(candidate);
                        return Math.abs(info.row - 1) + Math.abs(info.column - 1) < currentDistance;
                    })[0];

                if (!Number.isFinite(targetCell) || !context.movePondCard(card, targetCell, { sourceCard: card, reason: effect.id })) {
                    return;
                }

                const amount = utils.moveReward(context, utils.starValue(effect, "moveAmounts", card, 2), card, card, effect.id);
                utils.addValue(context, card, amount, card);

                if (utils.star(card) >= 3 && targetCell === 4) {
                    utils.shiftCards(context, effect.archetype).forEach((target) => utils.addValue(context, target, effect.star3AllBonus || 2, card));
                }
            }
        },

shiftThreeLineFishDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const lines = [
                    [0, 1, 2], [3, 4, 5], [6, 7, 8],
                    [0, 3, 6], [1, 4, 7], [2, 5, 8]
                ];
                const rowOnlyLimit = utils.star(card) < 2 ? 3 : 6;
                const amount = utils.star(card) >= 3 ? 3 : 2;
                let changed = 0;

                lines.slice(0, rowOnlyLimit).forEach((line) => {
                    const cards = context.pondCardsInCells(line).filter((fish) => utils.isShiftCard(fish, effect.archetype));
                    if (cards.length >= 3) {
                        cards.forEach((target) => {
                            changed += utils.addValue(context, target, amount, card);
                        });
                    }
                });

                if (changed > 0 && utils.star(card) >= 3) {
                    changed += utils.addValue(context, card, effect.star3SelfBonus || 2, card);
                }
            }
        },

shiftTidePusherDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const limit = utils.star(card) >= 2 ? 2 : 1;
                const amount = utils.moveReward(context, utils.star(card) >= 3 ? 4 : 3, card, card, effect.id);
                let movedCount = 0;

                context.adjacentPondCards(card)
                    .filter((fish) => utils.isShiftCard(fish, effect.archetype))
                    .some((target) => {
                        const cell = context.adjacentEmptyPondCells(target)[0];
                        if (Number.isFinite(cell) && context.movePondCard(target, cell, { sourceCard: card, reason: effect.id })) {
                            utils.addValue(context, target, amount, card);
                            movedCount += 1;
                        }
                        return movedCount >= limit;
                    });
            }
        },

shiftMirrorRayDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const cell = context.pondCellIndex(card);
                const mirrorCell = 8 - cell;
                const target = context.pondCardAtCell(mirrorCell, card.uid);

                if (target) {
                    let amount = utils.starValue(effect, "amounts", card, 3);
                    if (utils.star(card) >= 3 && utils.isShiftCard(target, effect.archetype)) {
                        amount += effect.star3ShiftBonus || 2;
                    }
                    utils.addValue(context, card, amount, card);
                    utils.addValue(context, target, amount, card);
                    return;
                }

                if (utils.star(card) >= 3 && context.pondEmptyCells(card.uid).includes(mirrorCell)) {
                    context.movePondCard(card, mirrorCell, { sourceCard: card, reason: effect.id });
                }
            }
        },

shiftAllImageSwapperDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const cards = context.ownedCards().filter((fish) => fish.uid !== card.uid);
                const highest = utils.highestByValue(cards, context);
                const lowest = utils.lowestByValue(cards, context, 1)[0];

                if (!highest || !lowest || highest.uid === lowest.uid) {
                    return;
                }

                const diff = Math.abs(context.fishCardValue(highest) - context.fishCardValue(lowest));
                const cap = utils.star(card) >= 2 ? 12 : 8;
                const amount = Math.min(cap, Math.floor(diff / 2));

                if (!context.swapPondCards(highest, lowest, { sourceCard: card, reason: effect.id })) {
                    return;
                }

                utils.addValue(context, highest, amount, card);
                utils.addValue(context, lowest, amount, card);
            }
        },

shiftStarTrackKoiDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const diagonals = [[0, 4, 8], [2, 4, 6]];
                const amount = utils.starValue(effect, "amounts", card, 6);

                diagonals.forEach((line) => {
                    const cards = context.pondCardsInCells(line).filter((fish) => utils.isShiftCard(fish, effect.archetype));

                    if (cards.length < 3) {
                        return;
                    }

                    cards.forEach((target) => utils.addValue(context, target, amount, card));

                    if (utils.star(card) >= 3) {
                        const left = context.pondCardAtCell(line[0]);
                        const right = context.pondCardAtCell(line[2]);
                        if (left && right && context.swapPondCards(left, right, { sourceCard: card, reason: effect.id })) {
                            cards.forEach((target) => utils.addValue(context, target, effect.star3SwapBonus || 3, card));
                        }
                    }
                });
            }
        },

shiftNineGridDeityDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (utils.star(card) < 3) {
                    return;
                }

                const key = `shift-deity-extra-move-${card.uid}`;
                if (context.dailyCounter(card, key) > 0) {
                    return;
                }

                const target = utils.lowestByValue(utils.shiftCards(context, effect.archetype), context, 1)[0];
                const cell = target ? context.adjacentEmptyPondCells(target)[0] : null;

                if (target && Number.isFinite(cell) && context.movePondCard(target, cell, { sourceCard: card, reason: effect.id })) {
                    context.incrementDailyCounter(card, key);
                }
            }
        },

shiftReturnMothershipDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const cards = utils.shiftCards(context, effect.archetype);

                if (cards.length <= 0) {
                    return;
                }

                const neighbors = new Map(cards.map((fish) => [fish.uid, []]));

                cards.forEach((left) => {
                    cards.forEach((right) => {
                        if (left.uid === right.uid) {
                            return;
                        }

                        const leftInfo = context.pondCellInfo(context.pondCellIndex(left));
                        const rightInfo = context.pondCellInfo(context.pondCellIndex(right));
                        const distance = Math.abs(leftInfo.row - rightInfo.row) + Math.abs(leftInfo.column - rightInfo.column);

                        if (distance === 1) {
                            neighbors.get(left.uid).push(right);
                        }
                    });
                });

                const visited = new Set();
                let pathCards = [];

                cards.forEach((fish) => {
                    if (visited.has(fish.uid)) {
                        return;
                    }

                    const component = [];
                    const queue = [fish];
                    visited.add(fish.uid);

                    while (queue.length > 0) {
                        const current = queue.shift();
                        component.push(current);
                        neighbors.get(current.uid).forEach((next) => {
                            if (!visited.has(next.uid)) {
                                visited.add(next.uid);
                                queue.push(next);
                            }
                        });
                    }

                    if (component.length > pathCards.length) {
                        pathCards = component;
                    }
                });

                const amount = utils.starValue(effect, "amounts", card, 4);
                const cells = pathCards.map((fish) => context.pondCellIndex(fish));
                const includesCenter = cells.includes(4);
                const cornerCount = cells.filter((cell) => [0, 2, 6, 8].includes(cell)).length;
                let changed = 0;

                pathCards.forEach((target) => {
                    changed += utils.addValue(context, target, amount, card);
                });

                if (utils.star(card) >= 3 && includesCenter && cornerCount >= 2) {
                    pathCards.forEach((target) => {
                        changed += utils.addValue(context, target, effect.star3PathBonus || 3, card);
                    });
                }

                if (utils.star(card) >= 3) {
                    changed += utils.addValue(context, card, effect.star3SelfBonus || 6, card);
                }

                if (changed > 0) {
                    context.addLog(`${card.name} 召回迁游路径，合计价值 +${changed}。`);
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

schoolHeraldDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const cards = utils.schoolCards(context, effect.archetype);
                const count = cards.length;
                const bucket = utils.star(card) >= 2 ? 4 : 5;
                const repeat = Math.floor(count / bucket) + (utils.star(card) >= 3 && count >= 7 ? 1 : 0);
                let changed = 0;

                cards.forEach((target) => {
                    changed += utils.addValue(context, target, repeat, card);
                });

                if (changed > 0) {
                    context.addLog(`${card.name} 号令鱼群，合计价值 +${changed}。`);
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
                    gain += utils.star(card) >= 2 ? 6 : 5;
                }

                utils.addValue(context, card, gain, card);

                if (full && utils.star(card) >= 3) {
                    cards
                        .filter((target) => target.uid !== card.uid)
                        .forEach((target) => utils.addValue(context, target, 1, card));
                }

                if (gain > 0) {
                    context.addLog(`${card.name} 唤起万尾潮，价值 +${gain}。`);
                }
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

                const ratio = utils.star(card) >= 3 ? 0.25 : 0.2;
                const cap = utils.star(card) >= 2 ? 6 : 4;
                const total = Math.floor(context.fishCardValue(top) * ratio);
                const each = Math.min(cap, Math.floor(total / targets.length));
                let changed = 0;

                targets.forEach((target) => {
                    changed += utils.addValue(context, target, each, card);
                });

                if (utils.star(card) >= 3) {
                    changed += utils.addValue(context, card, 2, card);
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

                let amount = utils.star(card) >= 2 ? 3 : 2;

                if (count >= 9 || context.isPondFull()) {
                    amount += utils.star(card) >= 2 ? 4 : 3;
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

falconLowDarterDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const catches = context.state.previousDailyCatchCount || 0;

                if (catches > 0) {
                    let gain = utils.starValue(effect, "successAmounts", card, 2);
                    if (utils.star(card) >= 3 && catches >= (effect.extraCatchThreshold || 2)) {
                        gain += effect.extraAmount || 0;
                    }
                    if (utils.addValue(context, card, gain, card)) {
                        context.addLog(`${card.name} 低空追击，价值 +${gain}。`);
                    }
                    return;
                }

                const loss = utils.starValue(effect, "failAmounts", card, 1);
                const changed = utils.removeValue(context, card, loss, card);
                if (changed > 0) {
                    context.addLog(`${card.name} 昨日无猎，价值 -${changed}。`);
                }
            }
        },

falconShortBeakDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (!card.falconShortBeakRiskDay || card.falconShortBeakRiskDay >= context.state.day) {
                    return;
                }

                if (context.adjacentPondCards(card).length > 0) {
                    delete card.falconShortBeakRiskDay;
                    return;
                }

                const loss = utils.starValue(effect, "lossAmounts", card, 2);
                const changed = utils.removeValue(context, card, loss, card);
                delete card.falconShortBeakRiskDay;
                if (changed > 0) {
                    context.addLog(`${card.name} 孤身失衡，价值 -${changed}。`);
                }
            }
        },

falconSplitShadowDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const adjacent = context.adjacentPondCards(card);
                const target = adjacent.sort((left, right) => (right.valueGainedToday || 0) - (left.valueGainedToday || 0))[0];

                if (!target) {
                    const changed = utils.removeValue(context, card, 2, card);
                    if (changed > 0) {
                        context.addLog(`${card.name} 裂影无处依附，价值 -${changed}。`);
                    }
                    return;
                }

                let gain = 0;
                if (utils.star(card) <= 1) {
                    gain = Math.floor((target.valueGainedToday || 0) / 2);
                } else {
                    gain = Math.min(target.valueGainedToday || 0, utils.starValue(effect, "caps", card, 4));
                }

                if (utils.addValue(context, card, gain, card)) {
                    context.addLog(`${card.name} 复制裂影成长，价值 +${gain}。`);
                }

                if (utils.star(card) >= 3 && utils.isFalconCard(target, effect.archetype)) {
                    utils.addValue(context, target, effect.star3TargetBonus || 1, card);
                }
            }
        },

falconGoldPeckerDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if ((context.state.previousDailySoldFishCount || 0) > 0) {
                    return;
                }

                const loss = utils.starValue(effect, "lossAmounts", card, 2);
                const changed = utils.removeValue(context, card, loss, card);
                if (changed > 0) {
                    context.addLog(`${card.name} 昨日无售，价值 -${changed}。`);
                }
            }
        },

falconLockEyeDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if (card.falconMarkUid && card.falconMarkDay < context.state.day && !card.falconMarkTriggered) {
                    const loss = utils.starValue(effect, "lossAmounts", card, 3);
                    const changed = utils.removeValue(context, card, loss, card);
                    if (changed > 0) {
                        context.addLog(`${card.name} 猎标未动，价值 -${changed}。`);
                    }
                }

                const target = utils.highestByValue(context.ownedCards().filter((fish) => fish.uid !== card.uid), context);
                card.falconMarkUid = target?.uid || null;
                card.falconMarkDay = context.state.day;
                card.falconMarkTriggered = false;

                if (target) {
                    context.addLog(`${card.name} 锁定「${target.name}」为猎标。`);
                }
            }
        },

falconTideSpikeDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const adjacent = context.adjacentPondCards(card);
                const amount = utils.starValue(effect, "amounts", card, 1);
                const gain = adjacent.length * amount;

                if (utils.addValue(context, card, gain, card)) {
                    context.addLog(`${card.name} 借相邻鱼起势，价值 +${gain}。`);
                }

                if (adjacent.length <= (effect.crowdedThreshold || 2)) {
                    return;
                }

                if (utils.star(card) >= 3) {
                    adjacent.forEach((target) => utils.addValue(context, target, effect.star3AdjacentBonus || 1, card));
                    return;
                }

                const loss = utils.starValue(effect, "coinLossAmounts", card, 2);
                context.state.coins = Math.max(0, context.state.coins - loss);
                context.addLog(`${card.name} 猎潮过密，失去 ${loss}G。`);
            }
        },

falconBlackPlunderDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const sold = context.state.previousDailySoldFishCount || 0;
                const threshold = utils.starValue(effect, "thresholds", card, 3);

                if (sold < threshold || utils.star(card) >= 3) {
                    return;
                }

                const changed = utils.removeValue(context, card, effect.lossAmount || 5, card);
                if (changed > 0) {
                    context.addLog(`${card.name} 掠夺过度，价值 -${changed}。`);
                }
            }
        },

falconEmptyFallDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const cell = context.pondCellIndex(card);
                const info = context.pondCellInfo(cell);
                const cells = Array.from({ length: 9 }, (_, index) => context.pondCellInfo(index));
                const unlocked = context.state.pondCells || [];
                const occupied = new Set(context.ownedCards().map((fish) => context.pondCellIndex(fish)));
                const rowHasEmpty = cells.some((item) => item.row === info.row && unlocked[item.cellIndex] && !occupied.has(item.cellIndex));
                const columnHasEmpty = cells.some((item) => item.column === info.column && unlocked[item.cellIndex] && !occupied.has(item.cellIndex));

                if (rowHasEmpty || columnHasEmpty) {
                    let gain = utils.starValue(effect, "amounts", card, 6);
                    if (utils.star(card) >= 3 && rowHasEmpty && columnHasEmpty) {
                        gain += effect.star3BothBonus || 3;
                    }
                    utils.addValue(context, card, gain, card);
                    return;
                }

                const loss = utils.starValue(effect, "noEmptyLossAmounts", card, 4);
                const changed = utils.removeValue(context, card, loss, card);
                if (changed > 0) {
                    context.addLog(`${card.name} 无处空坠，价值 -${changed}。`);
                }
            }
        },

falconSkyfallKingDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const falcons = utils.falconCards(context, effect.archetype);

                if (falcons.length >= (effect.threshold || 3)) {
                    const gain = utils.starValue(effect, "amounts", card, 10);
                    utils.addValue(context, card, gain, card);

                    if (utils.star(card) >= 3) {
                        falcons
                            .filter((target) => target.uid !== card.uid)
                            .forEach((target) => utils.addValue(context, target, effect.star3OtherBonus || 2, card));
                    }
                    return;
                }

                if (utils.star(card) >= 3) {
                    return;
                }

                const target = falcons[Math.floor(context.random() * Math.max(1, falcons.length))];
                const changed = utils.removeValue(context, target, effect.failLossAmount || 3, card);
                if (changed > 0) {
                    context.addLog(`${card.name} 天坠失势，「${target.name}」价值 -${changed}。`);
                }
            }
        },

falconFrostStarDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;

                if ((context.state.previousDailyCombineCount || 0) > 0) {
                    return;
                }

                const loss = utils.starValue(effect, "lossAmounts", card, 4);
                const changed = utils.removeValue(context, card, loss, card);
                if (changed > 0) {
                    context.addLog(`${card.name} 昨日无合成，价值 -${changed}。`);
                }
            }
        },

falconAllWingsDaily: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const falcons = utils.falconCards(context, effect.archetype);

                if ((context.state.dayStartCoinsBeforeIncome || 0) <= 0 && utils.star(card) < 3) {
                    const targets = utils.star(card) >= 2 ? [card] : falcons;
                    const changed = targets.reduce((sum, target) => (
                        sum + utils.removeValue(context, target, effect.zeroCoinLoss || 2, card)
                    ), 0);
                    if (changed > 0) {
                        context.addLog(`${card.name} 零金币失衡，隼鱼合计价值 -${changed}。`);
                    }
                    return;
                }

                const amount = utils.starValue(effect, "amounts", card, 2);
                let changed = 0;
                falcons.forEach((target) => {
                    changed += utils.addValue(context, target, amount, card);
                });

                if ((context.state.dayStartCoinsBeforeIncome || 0) <= 0 && utils.star(card) >= 3) {
                    context.state.coins += 1;
                }

                if (changed > 0) {
                    context.addLog(`${card.name} 万羽归猎，隼鱼合计价值 +${changed}。`);
                }
            }
        }
});

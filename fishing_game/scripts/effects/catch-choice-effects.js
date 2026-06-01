// Effects that resolve after a catch choice batch is generated.
Object.assign(window.FISHING_CARD_EFFECTS.handlers, {
falconHeadwindChoice: {
            run(effect, card, context) {
                const utils = window.FISHING_CARD_EFFECTS.utils;
                const highRarities = new Set(effect.highRarities || ["rare", "epic", "legendary", "mythic"]);
                const hasHighRarity = (context.choices || []).some((fish) => highRarities.has(fish.rarity));

                if (hasHighRarity) {
                    return;
                }

                if (utils.star(card) >= 3) {
                    context.state.nextFishingCostDiscount = Math.max(
                        context.state.nextFishingCostDiscount || 0,
                        effect.star3Discount || 1
                    );
                    context.addLog(`${card.name} 逆风未中，下一次钓鱼费用 -${effect.star3Discount || 1}G。`);
                    return;
                }

                const loss = utils.starValue(effect, "lossAmounts", card, 3);
                const changed = utils.removeValue(context, card, loss, card);
                if (changed > 0) {
                    context.addLog(`${card.name} 逆风落空，价值 -${changed}。`);
                }
            }
        }
});

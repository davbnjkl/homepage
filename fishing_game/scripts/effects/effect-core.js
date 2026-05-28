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

    utils: {
        star(card) {
            return Math.max(1, Math.min(3, Math.floor(card?.star || 1)));
        },

        starValue(effect, key, card, fallback = 0) {
            const star = this.star(card);
            const config = effect[key];

            if (config && typeof config === "object") {
                return config[star] ?? config[String(star)] ?? config.default ?? fallback;
            }

            return Number.isFinite(config) ? config : fallback;
        },

        isEnteringSelf(card, context) {
            return Boolean(context.enteringCard && context.enteringCard.uid === card.uid);
        },

        isSchoolCard(card, archetype = "school-growth") {
            return card?.archetype === archetype;
        },

        isShiftCard(card, archetype = "position-shift") {
            return card?.archetype === archetype;
        },

        schoolCards(context, archetype = "school-growth", options = {}) {
            if (context.pondCardsByArchetype) {
                return context.pondCardsByArchetype(archetype, options);
            }

            return context.ownedCards().filter((card) => {
                if (card.archetype !== archetype) {
                    return false;
                }

                return !options.excludeUid || card.uid !== options.excludeUid;
            });
        },

        shiftCards(context, archetype = "position-shift", options = {}) {
            if (context.pondCardsByArchetype) {
                return context.pondCardsByArchetype(archetype, options);
            }

            return context.ownedCards().filter((card) => {
                if (card.archetype !== archetype) {
                    return false;
                }

                return !options.excludeUid || card.uid !== options.excludeUid;
            });
        },

        moveReward(context, baseValue, target, sourceCard, reason = "") {
            if (context.moveReward) {
                return context.moveReward(baseValue, target, sourceCard, reason);
            }

            return Math.max(0, Math.floor(baseValue));
        },

        addValue(context, target, amount, sourceCard = null, triggerGain = true) {
            if (!target || amount <= 0) {
                return 0;
            }

            if (context.addValueToCard) {
                return context.addValueToCard(target, amount, {
                    sourceCard,
                    triggerGain
                });
            }

            target.value = (target.value || 0) + Math.floor(amount);
            return Math.floor(amount);
        },

        lowestByValue(cards, context, count) {
            return [...cards]
                .sort((left, right) => context.fishCardValue(left) - context.fishCardValue(right))
                .slice(0, count);
        },

        highestByValue(cards, context) {
            return cards.reduce((best, current) => {
                if (!best || context.fishCardValue(current) > context.fishCardValue(best)) {
                    return current;
                }

                return best;
            }, null);
        }
    },

    handlers: {}
};

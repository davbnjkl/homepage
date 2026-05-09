(function () {
    const story = window.storyData;
    const TYPEWRITER_SPEED = 256;
    const BLOCK_PAUSE_MS = 28;

    if (!story || !story.nodes || !story.startNode) {
        return;
    }

    const elements = {
        gameTitle: document.getElementById("gameTitle"),
        chapterValue: document.getElementById("chapterValue"),
        sceneCode: document.getElementById("sceneCode"),
        sceneTitle: document.getElementById("sceneTitle"),
        locationText: document.getElementById("locationText"),
        speakerName: document.getElementById("speakerName"),
        speakerRole: document.getElementById("speakerRole"),
        statusLine: document.getElementById("statusLine"),
        storyCard: document.getElementById("storyCard"),
        dialogueBlock: document.getElementById("dialogueBlock"),
        cipherPanel: document.getElementById("cipherPanel"),
        cipherLabel: document.getElementById("cipherLabel"),
        cipherText: document.getElementById("cipherText"),
        storyNote: document.getElementById("storyNote"),
        choicesHint: document.getElementById("choicesHint"),
        choicesGrid: document.getElementById("choicesGrid"),
        jumpPanel: document.getElementById("jumpPanel"),
        jumpInput: document.getElementById("jumpInput"),
        jumpError: document.getElementById("jumpError"),
        restartButton: document.getElementById("restartButton"),
        entryModal: document.getElementById("entryModal"),
        playerNameInput: document.getElementById("playerNameInput"),
        nameError: document.getElementById("nameError"),
        startGameButton: document.getElementById("startGameButton")
    };
    elements.gameShell = document.querySelector(".game-shell");
    elements.choicesCard = document.querySelector(".choices-card");
    elements.root = document.documentElement;

    let currentNodeId = story.startNode;
    let renderToken = 0;
    let skipTyping = false;
    let isTyping = false;
    let playerName = "";
    let displayName = "";
    let lastTransitionGlitched = false;
    let hauntTimer = 0;
    let staticTimer = 0;
    const sceneNumberIndex = buildSceneNumberIndex(story.nodes);
    const jumpPanelEntryNodeId = "park_001";

    function initializeRetroHorrorEffects() {
        const overlay = document.createElement("div");
        const noise = document.createElement("div");
        const tear = document.createElement("div");
        const corners = document.createElement("div");
        const message = document.createElement("div");

        overlay.className = "retro-horror-overlay";
        noise.className = "retro-noise";
        tear.className = "retro-tear";
        corners.className = "retro-corners";
        message.className = "retro-message";
        message.textContent = "HELP";

        overlay.append(noise, tear, corners, message);
        document.body.appendChild(overlay);

        document.addEventListener("pointermove", function (event) {
            elements.root.style.setProperty("--mouse-x", event.clientX + "px");
            elements.root.style.setProperty("--mouse-y", event.clientY + "px");
        });

        function pulseStatic() {
            document.body.classList.add("is-static-hit");
            window.setTimeout(function () {
                document.body.classList.remove("is-static-hit");
            }, 120 + Math.random() * 180);
        }

        function whisper() {
            document.body.classList.add("is-haunted");
            window.setTimeout(function () {
                document.body.classList.remove("is-haunted");
            }, 520);
        }

        staticTimer = window.setInterval(function () {
            if (Math.random() > 0.42) {
                pulseStatic();
            }

            if (Math.random() > 0.84) {
                whisper();
            }
        }, 3600);
    }

    function normalizeDialogue(dialogue) {
        if (Array.isArray(dialogue)) {
            return dialogue;
        }

        if (typeof dialogue === "string" && dialogue.trim()) {
            return [dialogue];
        }

        return [];
    }

    function wait(ms, token) {
        return new Promise(function (resolve) {
            window.setTimeout(function () {
                resolve(token === renderToken);
            }, ms);
        });
    }

    function clampName(value) {
        return Array.from(value || "").slice(0, 6).join("");
    }

    function normalizeSceneNumber(value) {
        const digits = String(value || "").replace(/\D/g, "");

        if (!digits) {
            return "";
        }

        return digits.slice(-3).padStart(3, "0");
    }

    function buildSceneNumberIndex(nodes) {
        const index = {};

        Object.keys(nodes || {}).forEach(function (nodeId) {
            const node = nodes[nodeId] || {};
            const normalizedCode = normalizeSceneNumber(node.code);
            const normalizedTitle = normalizeSceneNumber(node.title);
            const normalizedId = normalizeSceneNumber(nodeId);
            const sceneNumber = normalizedCode || normalizedTitle || normalizedId;

            if (sceneNumber && !index[sceneNumber]) {
                index[sceneNumber] = nodeId;
            }
        });

        return index;
    }

    function getResolvedPlayerName() {
        return playerName || "访客";
    }

    function createCorruptedName(source) {
        const nameChars = Array.from(source || "访客");
        const glitchChars = ["？", "#", "※", "■"];

        if (!nameChars.length) {
            return "？？？";
        }

        if (Math.random() < 0.34) {
            return "？？？";
        }

        const corrupted = nameChars.map(function (char) {
            if (Math.random() < 0.45) {
                return glitchChars[Math.floor(Math.random() * glitchChars.length)];
            }

            return char;
        }).join("");

        if (corrupted !== source) {
            return corrupted;
        }

        return nameChars.map(function (_char, index) {
            return index === 0 ? "？" : nameChars[index];
        }).join("");
    }

    function updateDisplayName(options) {
        const settings = options || {};
        const resolvedName = getResolvedPlayerName();

        if (settings.forceNormal) {
            displayName = resolvedName;
            lastTransitionGlitched = false;
            return;
        }

        if (lastTransitionGlitched) {
            displayName = resolvedName;
            lastTransitionGlitched = false;
            return;
        }

        if (Math.random() < 0.1) {
            displayName = createCorruptedName(resolvedName);
            lastTransitionGlitched = true;
            return;
        }

        displayName = resolvedName;
        lastTransitionGlitched = false;
    }

    function resolveText(text) {
        if (typeof text !== "string") {
            return "";
        }

        return text.replace(/\{\{playerName\}\}/g, getResolvedPlayerName());
    }

    function resolveStatusLine(text) {
        const resolved = resolveText(text || "").trim();

        if (/^合集[一二三四五六七八九十0-9]+档案正在显字。?$/.test(resolved)) {
            return "";
        }

        return resolved;
    }

    function resolveSceneTitle(text) {
        const resolved = resolveText(text || "").replace(/剧情/g, "").trim();

        return resolved || "无题残页";
    }

    function setJumpError(text) {
        const message = text || "";

        renderRichText(elements.jumpError, message);
        elements.jumpError.hidden = !message;
    }

    function renderJumpPanel() {
        const showJumpPanel = currentNodeId === jumpPanelEntryNodeId;

        elements.jumpPanel.hidden = !showJumpPanel;

        if (!showJumpPanel) {
            elements.jumpInput.value = "";
            setJumpError("");
        }
    }

    function jumpToSceneByInput() {
        const sceneNumber = normalizeSceneNumber(elements.jumpInput.value);

        if (!sceneNumber) {
            setJumpError("请输入剧情序号。");
            return;
        }

        const targetNodeId = sceneNumberIndex[sceneNumber];

        if (!targetNodeId || !story.nodes[targetNodeId]) {
            setJumpError(sceneNumber + " 号尚未接入。");
            return;
        }

        setJumpError("");
        elements.jumpInput.value = sceneNumber;
        currentNodeId = targetNodeId;
        renderNode();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function buildTextToken(text, classes) {
        if (!text) {
            return null;
        }

        return {
            text: text,
            classes: classes || []
        };
    }

    function parseInlineTokens(line, extraClasses) {
        const tokens = [];
        const classes = extraClasses || [];
        let cursor = 0;

        while (cursor < line.length) {
            if (line.startsWith("**", cursor)) {
                const closeIndex = line.indexOf("**", cursor + 2);

                if (closeIndex !== -1) {
                    const strongText = line.slice(cursor + 2, closeIndex);
                    const token = buildTextToken(strongText, ["inline-strong"].concat(classes));

                    if (token) {
                        tokens.push(token);
                    }

                    cursor = closeIndex + 2;
                    continue;
                }
            }

            if (line.charAt(cursor) === "*") {
                const closeIndex = line.indexOf("*", cursor + 1);

                if (closeIndex !== -1) {
                    const emText = line.slice(cursor + 1, closeIndex);
                    const token = buildTextToken(emText, ["inline-em"].concat(classes));

                    if (token) {
                        tokens.push(token);
                    }

                    cursor = closeIndex + 1;
                    continue;
                }
            }

            const nextBold = line.indexOf("**", cursor);
            const nextItalic = line.indexOf("*", cursor);
            const markerIndexes = [nextBold, nextItalic].filter(function (value) {
                return value !== -1;
            });
            const nextMarker = markerIndexes.length ? Math.min.apply(Math, markerIndexes) : line.length;
            const plainText = line.slice(cursor, nextMarker);
            const token = buildTextToken(plainText, classes);

            if (token) {
                tokens.push(token);
            }

            cursor = nextMarker;
        }

        return tokens;
    }

    function parseRichText(text) {
        const source = text || "";
        const tokens = [];
        const lines = source.split("\n");

        lines.forEach(function (line, index) {
            let workingLine = line;
            let lineClasses = [];

            if (workingLine.startsWith("【错误规则】")) {
                tokens.push({
                    text: "【错误规则】",
                    classes: ["inline-error-flag"]
                });
                tokens.push({
                    text: " ",
                    classes: []
                });
                workingLine = workingLine.slice("【错误规则】".length).trimStart();
                lineClasses = ["inline-error"];
            }

            tokens.push.apply(tokens, parseInlineTokens(workingLine, lineClasses));

            if (index < lines.length - 1) {
                tokens.push({
                    text: "\n",
                    classes: []
                });
            }
        });

        return tokens;
    }

    function mountRichText(target, text) {
        const tokens = parseRichText(text);
        const segments = [];

        target.innerHTML = "";

        tokens.forEach(function (token) {
            const span = document.createElement("span");

            span.className = token.classes.join(" ");
            span.textContent = "";
            target.appendChild(span);

            segments.push({
                node: span,
                chars: Array.from(token.text),
                fullText: token.text
            });
        });

        return segments;
    }

    function setVisibleSegments(segments, visibleCount) {
        let remaining = visibleCount;

        segments.forEach(function (segment) {
            if (remaining <= 0) {
                segment.node.textContent = "";
                return;
            }

            if (remaining >= segment.chars.length) {
                segment.node.textContent = segment.fullText;
                remaining -= segment.chars.length;
                return;
            }

            segment.node.textContent = segment.chars.slice(0, remaining).join("");
            remaining = 0;
        });
    }

    function renderRichText(target, text) {
        const segments = mountRichText(target, text || "");

        setVisibleSegments(segments, Number.MAX_SAFE_INTEGER);
    }

    function renderGameTitle(text) {
        const title = text || "游乐园怪诞";

        renderRichText(elements.gameTitle, title);
        elements.gameTitle.setAttribute("data-ghost", title);
        elements.gameTitle.setAttribute("aria-label", title);
    }

    function createTypewriterState(target, text) {
        const content = text || "";
        const shell = document.createElement("span");
        const ghost = document.createElement("span");
        const live = document.createElement("span");

        shell.className = "typewriter-shell";
        ghost.className = "typewriter-ghost";
        live.className = "typewriter-live";

        target.innerHTML = "";
        shell.append(ghost, live);
        target.appendChild(shell);

        renderRichText(ghost, content);

        const segments = mountRichText(live, content);
        setVisibleSegments(segments, 0);

        return {
            target: target,
            segments: segments,
            totalLength: segments.reduce(function (sum, segment) {
                return sum + segment.chars.length;
            }, 0)
        };
    }

    function typePreparedRichText(state, token) {
        return new Promise(function (resolve) {
            const totalLength = state.totalLength;

            if (!totalLength || token !== renderToken) {
                resolve(token === renderToken);
                return;
            }

            const startedAt = performance.now();

            function frame(now) {
                if (token !== renderToken) {
                    resolve(false);
                    return;
                }

                if (skipTyping) {
                    setVisibleSegments(state.segments, Number.MAX_SAFE_INTEGER);
                    resolve(true);
                    return;
                }

                const visibleCount = Math.min(
                    totalLength,
                    Math.ceil(((now - startedAt) / 1000) * TYPEWRITER_SPEED)
                );

                setVisibleSegments(state.segments, visibleCount);

                if (visibleCount >= totalLength) {
                    resolve(true);
                    return;
                }

                window.requestAnimationFrame(frame);
            }

            window.requestAnimationFrame(frame);
        });
    }

    function createChoiceButton(choice) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice-btn";
        button.dataset.tone = choice.tone || "normal";

        const main = document.createElement("span");
        main.className = "choice-main";
        renderRichText(main, resolveText(choice.label || "继续"));

        const sub = document.createElement("span");
        sub.className = "choice-sub";
        renderRichText(sub, resolveText(choice.detail || "进入下一段剧情。"));

        button.append(main, sub);
        button.addEventListener("click", function () {
            if (choice.next && story.nodes[choice.next]) {
                updateDisplayName();
                currentNodeId = choice.next;
                renderNode();
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });

        return button;
    }

    async function renderNarrative(node, token) {
        const lines = normalizeDialogue(node.dialogue);

        elements.dialogueBlock.innerHTML = "";
        elements.dialogueBlock.classList.toggle("is-typing", true);
        elements.storyCard.classList.toggle("is-typing", true);

        const lineStates = lines.map(function (line) {
            const paragraph = document.createElement("p");
            elements.dialogueBlock.appendChild(paragraph);
            return createTypewriterState(paragraph, resolveText(line));
        });

        for (const state of lineStates) {
            state.target.classList.add("typed-line");
            await typePreparedRichText(state, token);

            if (token !== renderToken) {
                return;
            }

            state.target.classList.remove("typed-line");
            await wait(BLOCK_PAUSE_MS, token);
        }

        if (node.cipher) {
            elements.cipherPanel.hidden = false;
            renderRichText(elements.cipherLabel, resolveText(node.recordLabel || "残页摘录"));
            const cipherState = createTypewriterState(elements.cipherText, resolveText(node.cipher));
            elements.cipherText.classList.add("typed-line");
            await typePreparedRichText(cipherState, token);

            if (token !== renderToken) {
                return;
            }

            elements.cipherText.classList.remove("typed-line");
            await wait(BLOCK_PAUSE_MS, token);
        } else {
            elements.cipherLabel.innerHTML = "";
            elements.cipherText.innerHTML = "";
            elements.cipherPanel.hidden = true;
        }

        if (resolveText(node.note || "")) {
            const noteState = createTypewriterState(elements.storyNote, resolveText(node.note || ""));
            elements.storyNote.classList.add("typed-line");
            await typePreparedRichText(noteState, token);

            if (token !== renderToken) {
                return;
            }

            elements.storyNote.classList.remove("typed-line");
        } else {
            elements.storyNote.innerHTML = "";
        }

        elements.dialogueBlock.classList.toggle("is-typing", false);
        elements.storyCard.classList.toggle("is-typing", false);
    }

    async function renderNode() {
        const node = story.nodes[currentNodeId];

        if (!node) {
            return;
        }

        renderToken += 1;
        skipTyping = false;
        isTyping = true;
        const token = renderToken;

        renderGameTitle(resolveText(story.title || "游乐园怪诞"));
        renderRichText(elements.chapterValue, displayName || getResolvedPlayerName());
        renderRichText(elements.sceneCode, resolveText(node.code || ""));
        renderRichText(elements.sceneTitle, resolveSceneTitle(node.title || ""));
        renderRichText(elements.locationText, resolveText(node.location || "地点未明"));
        renderRichText(elements.speakerName, resolveText(node.speaker || "旧档案来源"));
        renderRichText(elements.speakerRole, resolveText(node.role || ""));
        const statusLineText = resolveStatusLine(node.statusLine || "");
        renderRichText(elements.statusLine, statusLineText);
        elements.statusLine.hidden = !statusLineText;
        renderRichText(elements.choicesHint, "纸页正在显字，点击正文可直接看完。");
        elements.choicesGrid.innerHTML = "";
        elements.choicesGrid.classList.add("is-waiting");
        elements.storyNote.innerHTML = "";
        elements.cipherText.innerHTML = "";
        elements.cipherPanel.hidden = !node.cipher;

        await renderNarrative(node, token);

        if (token !== renderToken) {
            return;
        }

        elements.choicesGrid.innerHTML = "";
        (node.choices || []).forEach(function (choice) {
            elements.choicesGrid.appendChild(createChoiceButton(choice));
        });

        renderJumpPanel();
        renderRichText(elements.choicesHint, resolveText(node.choicesHint || "请从纸页留下的线索里继续。"));
        elements.choicesGrid.classList.remove("is-waiting");
        isTyping = false;
    }

    elements.storyCard.addEventListener("click", function () {
        if (isTyping) {
            skipTyping = true;
        }
    });

    elements.restartButton.addEventListener("click", function () {
        updateDisplayName({ forceNormal: true });
        currentNodeId = story.startNode;
        renderNode();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    elements.playerNameInput.addEventListener("input", function () {
        const limitedValue = clampName(elements.playerNameInput.value);

        if (elements.playerNameInput.value !== limitedValue) {
            elements.playerNameInput.value = limitedValue;
        }

        elements.nameError.hidden = true;
    });

    elements.jumpInput.addEventListener("input", function () {
        const cleanedValue = elements.jumpInput.value.replace(/\D/g, "").slice(0, 3);

        if (elements.jumpInput.value !== cleanedValue) {
            elements.jumpInput.value = cleanedValue;
        }

        setJumpError("");
    });

    elements.jumpPanel.addEventListener("submit", function (event) {
        event.preventDefault();
        jumpToSceneByInput();
    });

    function startGame() {
        const enteredName = clampName(elements.playerNameInput.value.trim());

        if (!enteredName) {
            elements.nameError.hidden = false;
            return;
        }

        playerName = enteredName;
        updateDisplayName({ forceNormal: true });
        elements.playerNameInput.value = enteredName;
        elements.entryModal.classList.remove("is-visible");
        document.body.classList.remove("modal-open");
        renderNode();
        window.clearTimeout(hauntTimer);
        window.clearInterval(staticTimer);
        initializeRetroHorrorEffects();
    }

    elements.startGameButton.addEventListener("click", startGame);
    elements.playerNameInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            startGame();
        }
    });

    document.body.classList.add("modal-open");
    elements.playerNameInput.focus();
})();

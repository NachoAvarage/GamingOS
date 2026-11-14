
(() => {
    "use strict";

    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        [...root.querySelectorAll(selector)];

    const layer = $("#windowLayer");
    const startMenu = $("#startMenu");
    const taskApps = $("#taskApps");

    const apps = {
        browser: {
            name: "Browser",
            icon: "◎",
            color: "browser-icon"
        },
        games: {
            name: "Game Library",
            icon: "🎮",
            color: "games-icon"
        },
        files: {
            name: "My Files",
            icon: "📁",
            color: "files-icon"
        },
        settings: {
            name: "Settings",
            icon: "⚙",
            color: "settings-icon"
        },
        calculator: {
            name: "Calculator",
            icon: "＋",
            color: "calculator-icon"
        },
        terminal: {
            name: "Terminal",
            icon: ">_",
            color: "terminal-icon"
        },
        notes: {
            name: "Notes",
            icon: "✎",
            color: "files-icon"
        }
    };

    let windows = {};
    let activeWindow = null;
    let zIndex = 10;
    let toastTimer;

    /* UTILITIES */

    function notify(message) {
        const toast = $("#toast");

        toast.textContent = message;
        toast.classList.remove("hidden");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            toast.classList.add("hidden");
        }, 2600);
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    /* WINDOW MANAGEMENT */

    function openApp(id) {
        if (!apps[id]) return;

        startMenu.classList.add("hidden");

        if (windows[id]) {
            focusWindow(id);
            return;
        }

        const app = apps[id];
        const win = document.createElement("section");

        win.className = "window";
        win.dataset.app = id;
        win.style.zIndex = ++zIndex;

        win.innerHTML = `
            <div class="window-header">
                <div class="window-title">
                    <span class="tiny-icon ${app.color}">
                        ${app.icon}
                    </span>
                    ${app.name}
                </div>

                <div class="window-controls">
                    <button data-action="min" title="Minimize">−</button>
                    <button data-action="max" title="Maximize">□</button>
                    <button data-action="close" class="close" title="Close">×</button>
                </div>
            </div>

            <div class="window-body">
                ${renderApp(id)}
            </div>
        `;

        layer.appendChild(win);
        windows[id] = win;

        focusWindow(id);
        addTaskButton(id);
        makeDraggable(win);
        setupApp(id, win);

        win.addEventListener("pointerdown", () => {
            focusWindow(id);
        });

        win.querySelectorAll("[data-action]").forEach(button => {
            button.addEventListener("click", event => {
                event.stopPropagation();

                const action = button.dataset.action;

                if (action === "close") closeApp(id);

                if (action === "min") minimizeApp(id);

                if (action === "max") maximizeApp(id);
            });
        });
    }

    function focusWindow(id) {
        if (!windows[id]) return;

        const win = windows[id];

        win.style.display = "flex";
        win.style.zIndex = ++zIndex;

        activeWindow = id;

        $("#activeTitle").textContent =
            apps[id].name.toUpperCase();

        updateTaskbar();
    }

    function closeApp(id) {
        if (!windows[id]) return;

        windows[id].remove();

        delete windows[id];

        $(`.task-app[data-app="${id}"]`)?.remove();

        if (activeWindow === id) {
            activeWindow = null;

            const remaining = Object.keys(windows);

            if (remaining.length) {
                focusWindow(remaining[remaining.length - 1]);
            } else {
                $("#activeTitle").textContent = "WEB DESKTOP";
            }
        }

        updateTaskbar();
    }

    function minimizeApp(id) {
        if (!windows[id]) return;

        windows[id].style.display = "none";

        if (activeWindow === id) {
            activeWindow = null;
            $("#activeTitle").textContent = "WEB DESKTOP";
        }

        updateTaskbar();
    }

    function maximizeApp(id) {
        if (!windows[id]) return;

        const win = windows[id];

        win.classList.toggle("maximized");
    }

    function addTaskButton(id) {
        const button = document.createElement("button");

        button.className = "task-app";
        button.dataset.app = id;

        button.textContent =
            apps[id].icon + " " + apps[id].name;

        button.addEventListener("click", () => {
            if (windows[id].style.display === "none") {
                focusWindow(id);
            } else if (activeWindow === id) {
                minimizeApp(id);
            } else {
                focusWindow(id);
            }
        });

        taskApps.appendChild(button);
    }

    function updateTaskbar() {
        $$(".task-app").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.app === activeWindow
            );
        });
    }

    /* DRAGGABLE WINDOWS */

    function makeDraggable(win) {
        const header = $(".window-header", win);

        let dragging = false;
        let startX = 0;
        let startY = 0;
        let originalX = 0;
        let originalY = 0;

        header.addEventListener("pointerdown", event => {
            if (event.target.closest(".window-controls")) return;
            if (win.classList.contains("maximized")) return;

            dragging = true;

            header.setPointerCapture(event.pointerId);

            const rect = win.getBoundingClientRect();

            startX = event.clientX;
            startY = event.clientY;

            originalX = rect.left;
            originalY = rect.top;

            win.style.transform = "none";
            win.style.left = originalX + "px";
            win.style.top = originalY + "px";

            focusWindow(win.dataset.app);
        });

        header.addEventListener("pointermove", event => {
            if (!dragging) return;

            const maxX = innerWidth - win.offsetWidth;
            const maxY = innerHeight - 70;

            const x = Math.max(
                0,
                Math.min(
                    maxX,
                    originalX + event.clientX - startX
                )
            );

            const y = Math.max(
                43,
                Math.min(
                    maxY,
                    originalY + event.clientY - startY
                )
            );

            win.style.left = x + "px";
            win.style.top = y + "px";
        });

        const stopDragging = () => {
            dragging = false;
        };

        header.addEventListener("pointerup", stopDragging);
        header.addEventListener("pointercancel", stopDragging);
    }

    /* APPLICATION CONTENT */

    function renderApp(id) {

        if (id === "browser") {
            return `
                <div class="browser-toolbar">
                    <button id="backButton">←</button>
                    <button id="forwardButton">→</button>
                    <button id="reloadButton">↻</button>

                    <input
                        id="urlInput"
                        class="field"
                        value="https://example.com"
                        placeholder="Search or enter URL"
                    >

                    <button class="action" id="goButton">
                        Go
                    </button>
                </div>

                <iframe
                    class="browser-frame"
                    id="browserFrame"
                    src="https://example.com"
                    title="GamingOS Browser"
                    sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                ></iframe>

                <p class="muted">
                    Some websites block iframe embedding.
                    External websites may not work here.
                </p>
            `;
        }

        if (id === "games") {
            return `
                <h2 class="section-title">Game Library</h2>

                <p class="muted">
                    Discover browser games.
                </p>

                <div class="card-grid">

                    <article class="card">
                        <div class="icon games-icon">2048</div>
                        <h3>2048</h3>
                        <p>Combine numbers to reach 2048.</p>
                        <button class="action" data-game="https://play2048.co/">
                            Play
                        </button>
                    </article>

                    <article class="card">
                        <div class="icon browser-icon">⬡</div>
                        <h3>Hextris</h3>
                        <p>A fast-paced puzzle game.</p>
                        <button class="action" data-game="https://hextris.io/">
                            Play
                        </button>
                    </article>

                    <article class="card">
                        <div class="icon calculator-icon">🎮</div>
                        <h3>CrazyGames</h3>
                        <p>Explore a browser game collection.</p>
                        <button class="action" data-game="https://www.crazygames.com/">
                            Explore
                        </button>
                    </article>

                </div>
            `;
        }

        if (id === "files") {
            return `
                <h2 class="section-title">My Files</h2>

                <p class="muted">
                    GamingOS local storage.
                </p>

                <div class="card-grid">

                    <article class="card">
                        <div class="icon files-icon">📁</div>
                        <h3>Documents</h3>
                        <p>Your documents.</p>
                    </article>

                    <article class="card">
                        <div class="icon files-icon">🖼</div>
                        <h3>Pictures</h3>
                        <p>Your pictures.</p>
                    </article>

                    <article class="card">
                        <div class="icon files-icon">⬇</div>
                        <h3>Downloads</h3>
                        <p>Browser downloads.</p>
                    </article>

                </div>

                <p class="muted">
                    File management is currently a visual interface.
                </p>
            `;
        }

        if (id === "settings") {
            return `
                <h2 class="section-title">Settings</h2>

                <p class="muted">
                    Personalize your desktop.
                </p>

                <div class="setting-row">
                    <span>Accent color</span>
                    <input
                        id="accentColor"
                        type="color"
                        value="${escapeHTML(localStorage.getItem("gosAccent") || "#5597ff")}"
                    >
                </div>

                <div class="setting-row">
                    <span>Wallpaper</span>
                    <select id="wallpaperChoice" class="field">
                        <option value="blue">Aurora Blue</option>
                        <option value="purple">Purple Night</option>
                        <option value="green">Neon Green</option>
                        <option value="dark">Dark Minimal</option>
                    </select>
                </div>

                <div class="setting-row">
                    <span>Fullscreen</span>
                    <button class="action" id="fullscreenButton">
                        Enter Fullscreen
                    </button>
                </div>

                <div class="setting-row">
                    <span>System</span>
                    <span class="muted">GamingOS 1.0</span>
                </div>

                <div class="setting-row">
                    <span>Edition</span>
                    <span class="muted">Liquid Web Edition</span>
                </div>
            `;
        }

        if (id === "calculator") {
            return `
                <div class="calculator">

                    <input
                        id="calcDisplay"
                        class="field calc-display"
                        value="0"
                        readonly
                    >

                    <div class="calc-grid">
                        ${[
                            "7","8","9","÷",
                            "4","5","6","×",
                            "1","2","3","−",
                            "0",".","C","+",
                            "(" ,")","⌫","="
                        ].map(key => `
                            <button
                                data-key="${key}"
                                class="${"÷×−+".includes(key) ? "operator" : ""}"
                            >
                                ${key}
                            </button>
                        `).join("")}
                    </div>

                </div>
            `;
        }

        if (id === "terminal") {
            return `
                <h2 class="section-title">GamingOS Terminal</h2>

                <p class="muted">
                    Simulated terminal environment.
                </p>

                <div id="terminalOutput" class="terminal-output">GamingOS Terminal v1.0
Welcome, guest.

Type help to see available commands.
</div>

                <div class="terminal-line">
                    guest@gamingos:~$
                    <input
                        id="terminalInput"
                        class="field"
                        autocomplete="off"
                    >
                </div>
            `;
        }

        if (id === "notes") {
            return `
                <h2 class="section-title">Notes</h2>

                <p class="muted">
                    Your notes save automatically.
                </p>

                <textarea
                    id="notesArea"
                    class="note-area"
                    placeholder="Write something..."
                ></textarea>
            `;
        }

        return "<p>Application unavailable.</p>";
    }

    /* BROWSER */

    function normalizeURL(value) {
        let url = value.trim();

        if (!url) return "";

        if (!/^https?:\/\//i.test(url)) {
            if (url.includes(".") && !url.includes(" ")) {
                url = "https://" + url;
            } else {
                url = "https://www.google.com/search?q=" +
                    encodeURIComponent(url);
            }
        }

        try {
            const parsed = new URL(url);

            if (!["http:", "https:"].includes(parsed.protocol)) {
                return "";
            }

            return parsed.href;

        } catch {
            return "";
        }
    }

    function openBrowser(url) {
        openApp("browser");

        const win = windows.browser;

        if (!win) return;

        $("#urlInput", win).value = url;
        $("#goButton", win).click();
    }

    /* APP INITIALIZATION */

    function setupApp(id, win) {
        const body = $(".window-body", win);

        if (id === "browser") {
            const input = $("#urlInput", body);
            const frame = $("#browserFrame", body);

            const navigate = () => {
                const url = normalizeURL(input.value);

                if (!url) {
                    notify("Invalid web address.");
                    return;
                }

                input.value = url;
                frame.src = url;
            };

            $("#goButton", body).addEventListener("click", navigate);

            input.addEventListener("keydown", event => {
                if (event.key === "Enter") navigate();
            });

            $("#reloadButton", body).addEventListener("click", () => {
                frame.src = frame.src;
            });

            $("#backButton", body).addEventListener("click", () => {
                notify("Browser history is restricted.");
            });

            $("#forwardButton", body).addEventListener("click", () => {
                notify("Browser history is restricted.");
            });
        }

        if (id === "games") {
            $$("[data-game]", body).forEach(button => {
                button.addEventListener("click", () => {
                    openBrowser(button.dataset.game);
                });
            });
        }

        if (id === "settings") {
            const accent = $("#accentColor", body);
            const wallpaperSelect = $("#wallpaperChoice", body);

            accent.addEventListener("input", event => {
                document.documentElement.style.setProperty(
                    "--accent",
                    event.target.value
                );

                localStorage.setItem("gosAccent", event.target.value);
            });

            const wallpapers = {
                blue: `
                    radial-gradient(ellipse at 75% 25%,rgba(40,105,220,.3),transparent 40%),
                    radial-gradient(ellipse at 20% 80%,rgba(0,195,220,.14),transparent 40%),
                    linear-gradient(135deg,#070a12,#10182b 55%,#080d19)
                `,
                purple: `
                    radial-gradient(ellipse at 70% 30%,#56358c,transparent 45%),
                    linear-gradient(135deg,#100b1b,#201436)
                `,
                green: `
                    radial-gradient(ellipse at 70% 35%,#176e55,transparent 45%),
                    linear-gradient(135deg,#07130f,#102c25)
                `,
                dark: `
                    radial-gradient(ellipse at center,#202a3b,transparent 65%),
                    #080b13
                `
            };

            wallpaperSelect.addEventListener("change", event => {
                $(".wallpaper").style.background =
                    wallpapers[event.target.value];

                localStorage.setItem(
                    "gosWallpaper",
                    event.target.value
                );
            });

            const savedWallpaper =
                localStorage.getItem("gosWallpaper");

            if (savedWallpaper && wallpapers[savedWallpaper]) {
                wallpaperSelect.value = savedWallpaper;
                wallpaperSelect.dispatchEvent(new Event("change"));
            }

            $("#fullscreenButton", body).addEventListener("click", async () => {
                try {
                    if (!document.fullscreenElement) {
                        await document.documentElement.requestFullscreen();
                    } else {
                        await document.exitFullscreen();
                    }
                } catch {
                    notify("Fullscreen unavailable.");
                }
            });
        }

        if (id === "calculator") {
            let expression = "";
            const display = $("#calcDisplay", body);

            $$("[data-key]", body).forEach(button => {
                button.addEventListener("click", () => {
                    const key = button.dataset.key;

                    if (key === "C") {
                        expression = "";
                    } else if (key === "⌫") {
                        expression = expression.slice(0, -1);
                    } else if (key === "=") {
                        try {
                            if (!/^[0-9+\-*/(). ]+$/.test(expression)) {
                                throw new Error("Invalid expression");
                            }

                            const result = Function(
                                '"use strict";return (' + expression + ')'
                            )();

                            if (!Number.isFinite(result)) {
                                throw new Error("Invalid result");
                            }

                            expression = String(result);

                        } catch {
                            expression = "";
                            notify("Invalid calculation.");
                        }
                    } else {
                        expression += ({
                            "÷": "/",
                            "×": "*",
                            "−": "-"
                        }[key] || key);
                    }

                    display.value = expression || "0";
                });
            });
        }

        if (id === "terminal") {
            const output = $("#terminalOutput", body);
            const input = $("#terminalInput", body);

            const commands = {
                help: "Commands: help, date, whoami, apps, clear, about, version",
                whoami: "guest",
                apps: "Browser, Games, Files, Settings, Calculator, Terminal, Notes",
                about: "GamingOS Liquid Web Edition",
                version: "GamingOS 1.0",
                date: () => new Date().toString()
            };

            input.addEventListener("keydown", event => {
                if (event.key !== "Enter") return;

                const command = input.value.trim().toLowerCase();

                input.value = "";

                if (command === "clear") {
                    output.textContent = "";
                    return;
                }

                let result = commands[command];

                if (typeof result === "function") {
                    result = result();
                }

                output.textContent +=
                    "\nguest@gamingos:~$ " + command +
                    "\n" + (result || "Command not found. Type help.") + "\n";

                output.scrollTop = output.scrollHeight;
            });
        }

        if (id === "notes") {
            const area = $("#notesArea", body);

            area.value = localStorage.getItem("gosNotes") || "";

            area.addEventListener("input", () => {
                localStorage.setItem("gosNotes", area.value);
            });
        }
    }

    /* START MENU */

    function toggleStartMenu() {
        startMenu.classList.toggle("hidden");

        if (!startMenu.classList.contains("hidden")) {
            $("#appSearch").focus();
        }
    }

    $("#startButton").addEventListener("click", toggleStartMenu);
    $("#brandButton").addEventListener("click", toggleStartMenu);

    $("#restartButton").addEventListener("click", () => {
        Object.keys(windows).forEach(closeApp);

        startMenu.classList.add("hidden");

        notify("Desktop refreshed.");
    });

    $$("[data-app]").forEach(button => {
        button.addEventListener("click", () => {
            openApp(button.dataset.app);
        });
    });

    $("#appSearch").addEventListener("input", event => {
        const query = event.target.value.toLowerCase();

        $$(".pinned-grid button").forEach(button => {
            button.style.display =
                button.textContent.toLowerCase().includes(query)
                    ? "flex"
                    : "none";
        });
    });

    document.addEventListener("pointerdown", event => {
        if (
            !event.target.closest("#startMenu") &&
            !event.target.closest("#startButton") &&
            !event.target.closest("#brandButton")
        ) {
            startMenu.classList.add("hidden");
        }
    });

    /* CLOCK */

    function updateClock() {
        const time = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

        $("#clock").textContent = time;
        $("#taskClock").textContent = time;
    }

    updateClock();
    setInterval(updateClock, 15000);

    /* KEYBOARD SHORTCUTS */

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            startMenu.classList.add("hidden");
        }

        if (event.altKey && event.key.toLowerCase() === "f") {
            event.preventDefault();

            if (document.fullscreenElement) {
                document.exitFullscreen?.();
            } else {
                document.documentElement.requestFullscreen?.()
                    .catch(() => notify("Fullscreen unavailable."));
            }
        }
    });

    /* RESTORE SETTINGS */

    const savedAccent = localStorage.getItem("gosAccent");

    if (savedAccent) {
        document.documentElement.style.setProperty(
            "--accent",
            savedAccent
        );
    }

    /* STARTUP */

    window.addEventListener("load", () => {
        setTimeout(() => {
            $("#boot").classList.add("hidden");
            $("#desktop").classList.remove("hidden");
        }, 1100);
    });

})();

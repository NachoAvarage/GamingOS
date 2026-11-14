
(() => {
    "use strict";

    // =========================================================
    // GAMINGOS - GNOME DESKTOP
    // Complete app.js
    // =========================================================

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    const desktop = $("#desktop");
    const workspace = $("#workspace");
    const overview = $("#overview");
    const boot = $("#boot");

    // Stop safely if the main HTML structure is missing.
    if (!desktop || !workspace) {
        console.error("GamingOS: #desktop or #workspace is missing from index.html.");
        return;
    }

    const apps = [
        { id: "browser", icon: "🌐", name: "Web Browser", description: "Browse the web" },
        { id: "files", icon: "📁", name: "Files", description: "Browse your files" },
        { id: "terminal", icon: "▣", name: "Terminal", description: "Command line" },
        { id: "notes", icon: "📝", name: "Text Editor", description: "Write notes" },
        { id: "settings", icon: "⚙", name: "Settings", description: "Configure GamingOS" },
        { id: "calculator", icon: "＋", name: "Calculator", description: "Perform calculations" },
        { id: "about", icon: "ⓘ", name: "About GamingOS", description: "System information" }
    ];

    let windowZ = 20;
    let windowCount = 0;
    let activeWindow = null;
    let overviewOpen = false;
    let systemPanelOpen = false;

    const storage = {
        get(key, fallback = "") {
            try {
                return localStorage.getItem("gamingos-" + key) ?? fallback;
            } catch {
                return fallback;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem("gamingos-" + key, value);
            } catch (error) {
                console.warn("GamingOS storage unavailable:", error);
            }
        }
    };

    // =========================================================
    // UTILITIES
    // =========================================================

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    function notify(message) {
        const toast = $("#toast");

        if (!toast) {
            console.info("GamingOS:", message);
            return;
        }

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(notify.timer);

        notify.timer = setTimeout(() => {
            toast.classList.remove("show");
        }, 2200);
    }

    function getApp(id) {
        return apps.find(app => app.id === id);
    }

    function closeOverview() {
        overviewOpen = false;

        if (overview) {
            overview.classList.add("hidden");
        }
    }

    function closeSystemPanel() {
        systemPanelOpen = false;

        const panel = $("#systemPanel");

        if (panel) {
            panel.classList.add("hidden");
        }
    }

    function toggleOverview() {
        if (!overview) return;

        overviewOpen = !overviewOpen;
        overview.classList.toggle("hidden", !overviewOpen);

        closeSystemPanel();

        if (overviewOpen) {
            renderOverview();

            const search = $("#searchApps");

            if (search) {
                search.value = "";
                search.focus();
            }
        }
    }

    // =========================================================
    // CLOCK
    // =========================================================

    function updateClock() {
        const clock = $("#clock");

        if (!clock) return;

        const now = new Date();

        clock.textContent = now.toLocaleString([], {
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit"
        });

        clock.title = now.toLocaleDateString([], {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    updateClock();
    setInterval(updateClock, 1000);

    // =========================================================
    // APPLICATION CONTENT
    // =========================================================

    function contentFor(id) {
        switch (id) {
            case "browser":
                return `
                    <div class="browser">
                        <div class="browser-toolbar">
                            <button class="browser-back" title="Back">←</button>
                            <button class="browser-forward" title="Forward">→</button>
                            <button class="browser-reload" title="Reload">↻</button>
                            <input
                                class="browser-address"
                                type="text"
                                value="https://example.com"
                                placeholder="Search or enter address"
                            >
                            <button class="browser-go">Go</button>
                        </div>
                        <iframe
                            class="browser-frame"
                            src="https://example.com"
                            title="Web Browser"
                            referrerpolicy="no-referrer"
                        ></iframe>
                    </div>
                `;

            case "files":
                return `
                    <div class="files-app">
                        <div class="files-sidebar">
                            <button class="file-location active" data-location="Home">⌂ Home</button>
                            <button class="file-location" data-location="Desktop">▦ Desktop</button>
                            <button class="file-location" data-location="Documents">▤ Documents</button>
                            <button class="file-location" data-location="Downloads">↓ Downloads</button>
                            <button class="file-location" data-location="Pictures">▧ Pictures</button>
                            <button class="file-location" data-location="Music">♫ Music</button>
                        </div>
                        <div class="files-main">
                            <div class="files-heading">Home</div>
                            <div class="files-grid">
                                <button class="file-item" data-folder="Desktop">
                                    <span>🖥️</span>
                                    <span>Desktop</span>
                                </button>
                                <button class="file-item" data-folder="Documents">
                                    <span>📄</span>
                                    <span>Documents</span>
                                </button>
                                <button class="file-item" data-folder="Downloads">
                                    <span>📥</span>
                                    <span>Downloads</span>
                                </button>
                                <button class="file-item" data-folder="Pictures">
                                    <span>🖼️</span>
                                    <span>Pictures</span>
                                </button>
                                <button class="file-item" data-folder="Music">
                                    <span>🎵</span>
                                    <span>Music</span>
                                </button>
                                <button class="file-item" data-folder="Videos">
                                    <span>🎬</span>
                                    <span>Videos</span>
                                </button>
                            </div>
                            <p class="files-notice">
                                This is a simulated file manager. It cannot access your actual device files.
                            </p>
                        </div>
                    </div>
                `;

            case "terminal":
                return `
                    <div class="terminal-app">
                        <div class="terminal-output">
                            <div>GamingOS Terminal</div>
                            <div>Browser-based desktop environment</div>
                            <div>Type <span class="terminal-highlight">help</span> for available commands.</div>
                            <br>
                        </div>
                        <form class="terminal-form">
                            <span class="terminal-prompt">user@gamingos:~$</span>
                            <input
                                class="terminal-input"
                                autocomplete="off"
                                spellcheck="false"
                                aria-label="Terminal command"
                            >
                        </form>
                    </div>
                `;

            case "notes":
                return `
                    <div class="notes-app">
                        <div class="notes-toolbar">
                            <span>Text Editor</span>
                            <button class="notes-clear">Clear</button>
                        </div>
                        <textarea
                            class="notes-content"
                            placeholder="Start writing..."
                            spellcheck="false"
                        ></textarea>
                        <div class="notes-status">Saved locally</div>
                    </div>
                `;

            case "settings":
                return `
                    <div class="settings-app">
                        <aside class="settings-sidebar">
                            <button class="settings-tab active" data-tab="appearance">🎨 Appearance</button>
                            <button class="settings-tab" data-tab="display">▣ Display</button>
                            <button class="settings-tab" data-tab="about">ⓘ About</button>
                        </aside>
                        <div class="settings-content">
                            <section class="settings-page" data-page="appearance">
                                <h3>Appearance</h3>
                                <p>Choose your desktop appearance.</p>
                                <div class="setting-row">
                                    <div>
                                        <strong>Dark mode</strong>
                                        <p>Use a dark desktop theme.</p>
                                    </div>
                                    <input type="checkbox" class="theme-toggle" checked>
                                </div>
                                <div class="setting-row">
                                    <div>
                                        <strong>Desktop animations</strong>
                                        <p>Enable interface transitions.</p>
                                    </div>
                                    <input type="checkbox" class="animation-toggle" checked>
                                </div>
                            </section>

                            <section class="settings-page hidden" data-page="display">
                                <h3>Display</h3>
                                <p>Adjust the desktop brightness.</p>
                                <div class="setting-row">
                                    <strong>Brightness</strong>
                                    <input
                                        type="range"
                                        class="settings-brightness"
                                        min="40"
                                        max="100"
                                        value="100"
                                    >
                                </div>
                            </section>

                            <section class="settings-page hidden" data-page="about">
                                <h3>About GamingOS</h3>
                                <p>GamingOS is a browser-based desktop environment.</p>
                                <p>Version 1.0</p>
                                <p>Designed for desktop browsers.</p>
                            </section>
                        </div>
                    </div>
                `;

            case "calculator":
                return `
                    <div class="calculator-app">
                        <input
                            class="calculator-display"
                            value="0"
                            readonly
                            aria-label="Calculator display"
                        >
                        <div class="calculator-buttons">
                            <button data-calc="clear">C</button>
                            <button data-calc="(">(</button>
                            <button data-calc=")">)</button>
                            <button data-calc="/">÷</button>

                            <button data-calc="7">7</button>
                            <button data-calc="8">8</button>
                            <button data-calc="9">9</button>
                            <button data-calc="*">×</button>

                            <button data-calc="4">4</button>
                            <button data-calc="5">5</button>
                            <button data-calc="6">6</button>
                            <button data-calc="-">−</button>

                            <button data-calc="1">1</button>
                            <button data-calc="2">2</button>
                            <button data-calc="3">3</button>
                            <button data-calc="+">+</button>

                            <button data-calc="0">0</button>
                            <button data-calc=".">.</button>
                            <button data-calc="backspace">⌫</button>
                            <button data-calc="equals">=</button>
                        </div>
                    </div>
                `;

            case "about":
                return `
                    <div class="about-app">
                        <div class="about-icon">◈</div>
                        <h2>GamingOS</h2>
                        <p class="about-subtitle">A desktop experience in your browser.</p>
                        <div class="about-details">
                            <div><span>Version</span><strong>1.0</strong></div>
                            <div><span>Environment</span><strong>GamingOS Desktop</strong></div>
                            <div><span>Interface</span><strong>GNOME-inspired</strong></div>
                            <div><span>Platform</span><strong>Web browser</strong></div>
                        </div>
                    </div>
                `;

            default:
                return `<p>Application not found.</p>`;
        }
    }

    // =========================================================
    // WINDOW MANAGEMENT
    // =========================================================

    function focusWindow(win) {
        if (!win) return;

        $$(".window", workspace).forEach(window => {
            window.classList.remove("focused");
        });

        win.classList.add("focused");
        win.style.zIndex = ++windowZ;
        activeWindow = win;

        updateDock();
    }

    function createWindow(id) {
        const app = getApp(id);

        if (!app) {
            notify("Application not found");
            return;
        }

        closeOverview();
        closeSystemPanel();

        const existing = $$(".window", workspace).find(win =>
            win.dataset.app === id && win.dataset.minimized !== "true"
        );

        if (existing) {
            focusWindow(existing);
            return existing;
        }

        const minimized = $$(".window", workspace).find(win =>
            win.dataset.app === id && win.dataset.minimized === "true"
        );

        if (minimized) {
            minimized.dataset.minimized = "false";
            minimized.classList.remove("minimized");
            minimized.style.display = "";
            focusWindow(minimized);
            return minimized;
        }

        windowCount++;

        const win = document.createElement("section");

        win.className = "window";
        win.dataset.app = id;
        win.dataset.minimized = "false";

        const width = Math.min(850, Math.max(360, window.innerWidth * 0.65));
        const height = Math.min(600, Math.max(300, window.innerHeight * 0.65));

        win.style.width = width + "px";
        win.style.height = height + "px";
        win.style.left = Math.max(20, (window.innerWidth - width) / 2) + "px";
        win.style.top = Math.max(55, (window.innerHeight - height) / 2) + "px";
        win.style.zIndex = ++windowZ;

        win.innerHTML = `
            <header class="window-header">
                <div class="window-title">
                    <span class="window-icon">${app.icon}</span>
                    <span>${escapeHTML(app.name)}</span>
                </div>
                <div class="window-controls">
                    <button class="window-minimize" title="Minimize">−</button>
                    <button class="window-maximize" title="Maximize">□</button>
                    <button class="window-close" title="Close">×</button>
                </div>
            </header>
            <div class="window-content">
                ${contentFor(id)}
            </div>
        `;

        workspace.appendChild(win);

        setupWindow(win);
        setupApp(win, id);
        focusWindow(win);
        updateDock();

        return win;
    }

    function setupWindow(win) {
        const header = $(".window-header", win);
        const minimize = $(".window-minimize", win);
        const maximize = $(".window-maximize", win);
        const close = $(".window-close", win);

        win.addEventListener("pointerdown", () => focusWindow(win));

        if (close) {
            close.addEventListener("click", event => {
                event.stopPropagation();
                win.remove();

                if (activeWindow === win) {
                    activeWindow = null;
                }

                updateDock();
            });
        }

        if (minimize) {
            minimize.addEventListener("click", event => {
                event.stopPropagation();

                win.dataset.minimized = "true";
                win.classList.add("minimized");
                win.style.display = "none";

                if (activeWindow === win) {
                    activeWindow = null;
                }

                updateDock();
            });
        }

        if (maximize) {
            maximize.addEventListener("click", event => {
                event.stopPropagation();

                if (win.dataset.maximized === "true") {
                    win.dataset.maximized = "false";
                    win.style.left = win.dataset.oldLeft || "100px";
                    win.style.top = win.dataset.oldTop || "100px";
                    win.style.width = win.dataset.oldWidth || "700px";
                    win.style.height = win.dataset.oldHeight || "500px";
                    win.classList.remove("maximized");
                } else {
                    win.dataset.oldLeft = win.style.left;
                    win.dataset.oldTop = win.style.top;
                    win.dataset.oldWidth = win.style.width;
                    win.dataset.oldHeight = win.style.height;

                    win.dataset.maximized = "true";
                    win.classList.add("maximized");

                    win.style.left = "0";
                    win.style.top = "32px";
                    win.style.width = "100%";
                    win.style.height = "calc(100% - 32px)";
                }

                focusWindow(win);
            });
        }

        if (header) {
            let dragging = false;
            let startX = 0;
            let startY = 0;
            let originalX = 0;
            let originalY = 0;

            header.addEventListener("pointerdown", event => {
                if (event.target.closest(".window-controls")) return;
                if (win.dataset.maximized === "true") return;

                dragging = true;

                startX = event.clientX;
                startY = event.clientY;
                originalX = win.offsetLeft;
                originalY = win.offsetTop;

                header.setPointerCapture(event.pointerId);
                focusWindow(win);
            });

            header.addEventListener("pointermove", event => {
                if (!dragging) return;

                const x = originalX + event.clientX - startX;
                const y = originalY + event.clientY - startY;

                win.style.left = Math.max(
                    -win.offsetWidth + 100,
                    Math.min(window.innerWidth - 100, x)
                ) + "px";

                win.style.top = Math.max(
                    32,
                    Math.min(window.innerHeight - 80, y)
                ) + "px";
            });

            header.addEventListener("pointerup", () => {
                dragging = false;
            });

            header.addEventListener("pointercancel", () => {
                dragging = false;
            });

            header.addEventListener("dblclick", event => {
                if (!event.target.closest(".window-controls") && maximize) {
                    maximize.click();
                }
            });
        }
    }

    // =========================================================
    // BROWSER APP
    // =========================================================

    function setupBrowser(win) {
        const address = $(".browser-address", win);
        const frame = $(".browser-frame", win);
        const go = $(".browser-go", win);
        const back = $(".browser-back", win);
        const forward = $(".browser-forward", win);
        const reload = $(".browser-reload", win);

        if (!address || !frame) return;

        function navigate() {
            let value = address.value.trim();

            if (!value) return;

            if (!/^https?:\/\//i.test(value)) {
                if (value.includes(".") && !value.includes(" ")) {
                    value = "https://" + value;
                } else {
                    value = "https://www.google.com/search?q=" +
                        encodeURIComponent(value);
                }
            }

            try {
                const parsed = new URL(value);

                if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
                    notify("Unsupported address");
                    return;
                }

                address.value = parsed.href;
                frame.src = parsed.href;
            } catch {
                notify("Invalid address");
            }
        }

        go?.addEventListener("click", navigate);

        address.addEventListener("keydown", event => {
            if (event.key === "Enter") navigate();
        });

        reload?.addEventListener("click", () => {
            try {
                frame.contentWindow.location.reload();
            } catch {
                frame.src = frame.src;
            }
        });

        back?.addEventListener("click", () => {
            try {
                frame.contentWindow.history.back();
            } catch {
                notify("This page does not allow browser navigation");
            }
        });

        forward?.addEventListener("click", () => {
            try {
                frame.contentWindow.history.forward();
            } catch {
                notify("This page does not allow browser navigation");
            }
        });
    }

    // =========================================================
    // FILES APP
    // =========================================================

    function setupFiles(win) {
        const heading = $(".files-heading", win);

        $$(".file-location", win).forEach(button => {
            button.addEventListener("click", () => {
                $$(".file-location", win).forEach(item =>
                    item.classList.remove("active")
                );

                button.classList.add("active");

                if (heading) {
                    heading.textContent = button.dataset.location;
                }
            });
        });

        $$(".file-item", win).forEach(button => {
            button.addEventListener("click", () => {
                const folder = button.dataset.folder;

                if (heading) {
                    heading.textContent = folder;
                }

                $$(".file-location", win).forEach(item =>
                    item.classList.toggle(
                        "active",
                        item.dataset.location === folder
                    )
                );

                notify(folder + " is empty");
            });
        });
    }

    // =========================================================
    // TERMINAL APP
    // =========================================================

    function setupTerminal(win) {
        const form = $(".terminal-form", win);
        const input = $(".terminal-input", win);
        const output = $(".terminal-output", win);

        if (!form || !input || !output) return;

        function writeLine(value = "") {
            const line = document.createElement("div");
            line.textContent = value;
            output.appendChild(line);
        }

        function execute(command) {
            const args = command.trim().split(/\s+/);
            const cmd = (args.shift() || "").toLowerCase();

            switch (cmd) {
                case "":
                    break;

                case "help":
                    writeLine("Available commands:");
                    writeLine("help       - Show available commands");
                    writeLine("clear      - Clear the terminal");
                    writeLine("date       - Show the current date");
                    writeLine("time       - Show the current time");
                    writeLine("whoami     - Show current user");
                    writeLine("hostname   - Show system name");
                    writeLine("uname      - Show environment information");
                    writeLine("ls         - List simulated files");
                    writeLine("pwd        - Show current directory");
                    writeLine("echo       - Print text");
                    writeLine("neofetch   - Show GamingOS information");
                    writeLine("about      - About GamingOS");
                    writeLine("exit       - Close terminal");
                    break;

                case "clear":
                    output.innerHTML = "";
                    break;

                case "date":
                    writeLine(new Date().toDateString());
                    break;

                case "time":
                    writeLine(new Date().toLocaleTimeString());
                    break;

                case "whoami":
                    writeLine("user");
                    break;

                case "hostname":
                    writeLine("gamingos");
                    break;

                case "uname":
                    writeLine("GamingOS Browser Desktop");
                    break;

                case "pwd":
                    writeLine("/home/user");
                    break;

                case "ls":
                    writeLine("Desktop  Documents  Downloads  Pictures  Music  Videos");
                    break;

                case "echo":
                    writeLine(args.join(" "));
                    break;

                case "neofetch":
                    writeLine("       .--.       user@gamingos");
                    writeLine("      |o_o |      ----------------");
                    writeLine("      |:_/ |      OS: GamingOS");
                    writeLine("     //   \\ \\     Version: 1.0");
                    writeLine("    (|     | )    Shell: GamingOS Terminal");
                    writeLine("   /'\\_   _/`\\    Platform: Browser");
                    writeLine("   \\___)=(___/    Desktop: GNOME-inspired");
                    break;

                case "about":
                    writeLine("GamingOS 1.0 - A browser-based desktop environment.");
                    break;

                case "exit":
                    win.remove();
                    updateDock();
                    break;

                default:
                    writeLine("Command not found: " + cmd);
                    writeLine("Type 'help' to see available commands.");
            }

            output.scrollTop = output.scrollHeight;
        }

        form.addEventListener("submit", event => {
            event.preventDefault();

            const command = input.value;

            writeLine("user@gamingos:~$ " + command);
            execute(command);

            input.value = "";
            output.scrollTop = output.scrollHeight;
        });

        input.focus();
    }

    // =========================================================
    // NOTES APP
    // =========================================================

    function setupNotes(win) {
        const editor = $(".notes-content", win);
        const clear = $(".notes-clear", win);
        const status = $(".notes-status", win);

        if (!editor) return;

        editor.value = storage.get("notes", "");

        editor.addEventListener("input", () => {
            storage.set("notes", editor.value);

            if (status) {
                status.textContent = "Saved locally";
            }
        });

        clear?.addEventListener("click", () => {
            editor.value = "";
            storage.set("notes", "");

            if (status) {
                status.textContent = "Cleared";
            }

            notify("Notes cleared");
        });
    }

    // =========================================================
    // SETTINGS APP
    // =========================================================

    function setupSettings(win) {
        const tabs = $$(".settings-tab", win);
        const pages = $$(".settings-page", win);

        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                tabs.forEach(item => item.classList.remove("active"));
                tab.classList.add("active");

                pages.forEach(page => {
                    page.classList.toggle(
                        "hidden",
                        page.dataset.page !== tab.dataset.tab
                    );
                });
            });
        });

        const themeToggle = $(".theme-toggle", win);
        const animationToggle = $(".animation-toggle", win);
        const brightness = $(".settings-brightness", win);

        if (themeToggle) {
            themeToggle.checked = storage.get("light-theme", "false") !== "true";

            themeToggle.addEventListener("change", () => {
                const light = !themeToggle.checked;

                document.body.classList.toggle("light-theme", light);
                storage.set("light-theme", String(light));
            });
        }

        if (animationToggle) {
            animationToggle.checked = storage.get("animations", "true") !== "false";

            animationToggle.addEventListener("change", () => {
                document.body.classList.toggle(
                    "no-animations",
                    !animationToggle.checked
                );

                storage.set("animations", String(animationToggle.checked));
            });
        }

        if (brightness) {
            brightness.value = storage.get("brightness", "100");

            brightness.addEventListener("input", () => {
                setBrightness(brightness.value);
            });
        }
    }

    // =========================================================
    // CALCULATOR APP
    // =========================================================

    function setupCalculator(win) {
        const display = $(".calculator-display", win);

        if (!display) return;

        let expression = "";

        function updateDisplay() {
            display.value = expression || "0";
        }

        function calculate() {
            if (!expression) return;

            // Only allow numbers and arithmetic operators.
            if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
                display.value = "Error";
                expression = "";
                return;
            }

            try {
                // Arithmetic-only parser using JavaScript's expression evaluator.
                // The strict character allowlist prevents arbitrary code input.
                const result = Function('"use strict"; return (' + expression + ')')();

                if (!Number.isFinite(result)) {
                    throw new Error("Invalid result");
                }

                expression = String(Number(result.toFixed(10)));
                updateDisplay();
            } catch {
                display.value = "Error";
                expression = "";
            }
        }

        $$(".calculator-buttons button", win).forEach(button => {
            button.addEventListener("click", () => {
                const value = button.dataset.calc;

                if (value === "clear") {
                    expression = "";
                } else if (value === "backspace") {
                    expression = expression.slice(0, -1);
                } else if (value === "equals") {
                    calculate();
                    return;
                } else {
                    expression += value;
                }

                updateDisplay();
            });
        });
    }

    // =========================================================
    // APP INITIALIZATION
    // =========================================================

    function setupApp(win, id) {
        switch (id) {
            case "browser":
                setupBrowser(win);
                break;

            case "files":
                setupFiles(win);
                break;

            case "terminal":
                setupTerminal(win);
                break;

            case "notes":
                setupNotes(win);
                break;

            case "settings":
                setupSettings(win);
                break;

            case "calculator":
                setupCalculator(win);
                break;
        }
    }

    // =========================================================
    // APPLICATION GRID
    // =========================================================

    function renderApps(query = "") {
        const grid = $("#appGrid");

        if (!grid) return;

        const filtered = apps.filter(app =>
            app.name.toLowerCase().includes(query.toLowerCase()) ||
            app.description.toLowerCase().includes(query.toLowerCase())
        );

        grid.innerHTML = "";

        filtered.forEach(app => {
            const button = document.createElement("button");

            button.className = "app-launcher";
            button.innerHTML = `
                <span class="app-launcher-icon">${app.icon}</span>
                <span class="app-launcher-name">${escapeHTML(app.name)}</span>
            `;

            button.addEventListener("click", () => {
                createWindow(app.id);
            });

            grid.appendChild(button);
        });

        if (filtered.length === 0) {
            grid.innerHTML = `<p class="no-apps">No applications found.</p>`;
        }
    }

    function renderOverview() {
        renderApps();

        const running = $("#runningApps");

        if (!running) return;

        running.innerHTML = "";

        const openWindows = $$(".window", workspace);

        openWindows.forEach(win => {
            const app = getApp(win.dataset.app);

            if (!app) return;

            const button = document.createElement("button");

            button.className = "running-app";
            button.textContent = app.icon + " " + app.name;

            button.addEventListener("click", () => {
                win.dataset.minimized = "false";
                win.classList.remove("minimized");
                win.style.display = "";
                focusWindow(win);
                closeOverview();
            });

            running.appendChild(button);
        });
    }

    // =========================================================
    // DOCK
    // =========================================================

    function updateDock() {
        $$(".dock-app").forEach(button => {
            const id = button.dataset.app;

            const isOpen = $$(".window", workspace).some(win =>
                win.dataset.app === id
            );

            button.classList.toggle("running", isOpen);
        });
    }

    // =========================================================
    // BRIGHTNESS
    // =========================================================

    function setBrightness(value) {
        const brightness = Math.max(40, Math.min(100, Number(value)));

        desktop.style.filter = `brightness(${brightness}%)`;

        storage.set("brightness", String(brightness));

        const slider = $("#brightness");

        if (slider) {
            slider.value = String(brightness);
        }
    }

    // =========================================================
    // TOP BAR AND SYSTEM MENU
    // =========================================================

    $("#activities")?.addEventListener("click", toggleOverview);
    $("#showApps")?.addEventListener("click", toggleOverview);

    $("#searchApps")?.addEventListener("input", event => {
        renderApps(event.target.value);
    });

    $("#systemButton")?.addEventListener("click", () => {
        const panel = $("#systemPanel");

        if (!panel) return;

        systemPanelOpen = !systemPanelOpen;
        panel.classList.toggle("hidden", !systemPanelOpen);

        closeOverview();
    });

    $$(".dock-app").forEach(button => {
        button.addEventListener("click", () => {
            createWindow(button.dataset.app);
        });
    });

    $$(".toggle").forEach(button => {
        button.addEventListener("click", () => {
            button.classList.toggle("active");

            const label = button.dataset.label ||
                button.textContent.trim() ||
                "Setting";

            notify(label + (button.classList.contains("active") ? " enabled" : " disabled"));
        });
    });

    $("#brightness")?.addEventListener("input", event => {
        setBrightness(event.target.value);
    });

    $("#openSettings")?.addEventListener("click", () => {
        closeSystemPanel();
        createWindow("settings");
    });

    $("#shutdown")?.addEventListener("click", () => {
        const confirmed = window.confirm("Power off GamingOS?");

        if (!confirmed) return;

        $$(".window", workspace).forEach(win => win.remove());

        closeOverview();
        closeSystemPanel();

        if (boot) {
            boot.classList.remove("hidden");
        }

        desktop.classList.add("hidden");

        notify("GamingOS powered off");
    });

    // =========================================================
    // KEYBOARD SHORTCUTS
    // =========================================================

    document.addEventListener("keydown", event => {
        const target = event.target;

        const typing = target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target?.isContentEditable;

        if (event.key === "Escape") {
            closeOverview();
            closeSystemPanel();
        }

        if (event.key === "F1") {
            event.preventDefault();
            toggleOverview();
        }

        if (event.altKey && event.key === "F4") {
            event.preventDefault();

            if (activeWindow) {
                activeWindow.remove();
                activeWindow = null;
                updateDock();
            }
        }

        if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "t") {
            event.preventDefault();
            createWindow("terminal");
        }

        if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "b") {
            event.preventDefault();
            createWindow("browser");
        }

        if (!typing && event.key === "Escape") {
            closeOverview();
        }
    });

    // =========================================================
    // RESTORE USER SETTINGS
    // =========================================================

    if (storage.get("light-theme", "false") === "true") {
        document.body.classList.add("light-theme");
    }

    if (storage.get("animations", "true") === "false") {
        document.body.classList.add("no-animations");
    }

    setBrightness(storage.get("brightness", "100"));

    // =========================================================
    // STARTUP
    // =========================================================

    function startDesktop() {
        boot?.classList.add("hidden");
        desktop.classList.remove("hidden");

        updateClock();
        updateDock();

        // Start with the browser open.
        createWindow("browser");
    }

    // Start even if the boot element is missing.
    if (boot) {
        setTimeout(startDesktop, 1200);
    } else {
        startDesktop();
    }

    console.info("GamingOS initialized successfully.");
})();

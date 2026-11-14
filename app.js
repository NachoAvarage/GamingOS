
(() => {
    "use strict";

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

    const desktop = $("#desktop");
    const workspace = $("#workspace");
    const boot = $("#boot-screen");

    if (!desktop || !workspace) {
        console.error("GamingOS: Required desktop elements are missing.");
        return;
    }

    const applications = [
        { id: "browser", name: "Web Browser", icon: "🌐", description: "Browse websites" },
        { id: "files", name: "Files", icon: "📁", description: "Browse folders" },
        { id: "terminal", name: "Terminal", icon: "▣", description: "Command line" },
        { id: "notes", name: "Text Editor", icon: "📝", description: "Write notes" },
        { id: "settings", name: "Settings", icon: "⚙", description: "Configure GamingOS" },
        { id: "calculator", name: "Calculator", icon: "▦", description: "Perform calculations" },
        { id: "about", name: "About GamingOS", icon: "ⓘ", description: "System information" }
    ];

    let highestZ = 100;
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
                console.warn("Could not save setting:", error);
            }
        }
    };

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    function appInfo(id) {
        return applications.find(app => app.id === id);
    }

    function notify(message) {
        const toast = $("#toast");
        if (!toast) return;

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(notify.timer);
        notify.timer = setTimeout(() => {
            toast.classList.remove("show");
        }, 2200);
    }

    // ---------------------------------------------------------
    // CLOCK
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // OVERVIEW
    // ---------------------------------------------------------

    function openOverview() {
        const overview = $("#overview");
        if (!overview) return;

        overviewOpen = true;
        overview.classList.remove("hidden");

        closeSystemPanel();
        renderOverview();

        const search = $("#searchApps");
        if (search) {
            search.value = "";
            renderApplications("");
            search.focus();
        }
    }

    function closeOverview() {
        overviewOpen = false;
        $("#overview")?.classList.add("hidden");
    }

    function toggleOverview() {
        if (overviewOpen) {
            closeOverview();
        } else {
            openOverview();
        }
    }

    function renderApplications(query = "") {
        const grid = $("#appGrid");
        if (!grid) return;

        const search = query.trim().toLowerCase();

        const results = applications.filter(app =>
            app.name.toLowerCase().includes(search) ||
            app.description.toLowerCase().includes(search)
        );

        grid.innerHTML = "";

        results.forEach(app => {
            const button = document.createElement("button");
            button.className = "app-launcher";

            button.innerHTML = `
                <span class="app-launcher-icon">${app.icon}</span>
                <span class="app-launcher-name">${escapeHTML(app.name)}</span>
            `;

            button.addEventListener("click", () => {
                launchApp(app.id);
            });

            grid.appendChild(button);
        });

        if (!results.length) {
            const empty = document.createElement("p");
            empty.className = "no-apps";
            empty.textContent = "No applications found";
            grid.appendChild(empty);
        }
    }

    function renderOverview() {
        renderApplications();

        const running = $("#runningApps");
        if (!running) return;

        running.innerHTML = "";

        $$(".window", workspace).forEach(win => {
            const app = appInfo(win.dataset.app);
            if (!app) return;

            const button = document.createElement("button");
            button.className = "running-app";
            button.textContent = app.icon + " " + app.name;

            button.addEventListener("click", () => {
                restoreWindow(win);
                closeOverview();
            });

            running.appendChild(button);
        });
    }

    $("#activities")?.addEventListener("click", toggleOverview);
    $("#showApps")?.addEventListener("click", toggleOverview);

    $("#searchApps")?.addEventListener("input", event => {
        renderApplications(event.target.value);
    });

    // ---------------------------------------------------------
    // SYSTEM MENU
    // ---------------------------------------------------------

    function closeSystemPanel() {
        systemPanelOpen = false;
        $("#systemPanel")?.classList.add("hidden");
    }

    $("#systemButton")?.addEventListener("click", () => {
        const panel = $("#systemPanel");
        if (!panel) return;

        systemPanelOpen = !systemPanelOpen;
        panel.classList.toggle("hidden", !systemPanelOpen);

        closeOverview();
    });

    $$(".quick-toggle").forEach(button => {
        button.addEventListener("click", () => {
            const enabled = button.classList.toggle("active");
            const name = button.dataset.toggle || "Setting";

            notify(name.charAt(0).toUpperCase() + name.slice(1) +
                (enabled ? " enabled" : " disabled"));
        });
    });

    function setBrightness(value) {
        const brightness = Math.max(50, Math.min(100, Number(value)));
        desktop.style.filter = `brightness(${brightness}%)`;

        const slider = $("#brightness");
        if (slider) slider.value = brightness;

        storage.set("brightness", String(brightness));
    }

    $("#brightness")?.addEventListener("input", event => {
        setBrightness(event.target.value);
    });

    $("#openSettings")?.addEventListener("click", () => {
        closeSystemPanel();
        launchApp("settings");
    });

    $("#shutdown")?.addEventListener("click", () => {
        if (!confirm("Power off GamingOS?")) return;

        $$(".window", workspace).forEach(win => win.remove());

        closeOverview();
        closeSystemPanel();

        desktop.classList.add("hidden");
        boot?.classList.remove("hidden");

        notify("GamingOS powered off");
    });

    // ---------------------------------------------------------
    // WINDOW MANAGEMENT
    // ---------------------------------------------------------

    function focusWindow(win) {
        if (!win) return;

        $$(".window", workspace).forEach(item => {
            item.classList.remove("focused");
        });

        win.classList.add("focused");
        win.style.zIndex = ++highestZ;
        activeWindow = win;

        updateDock();
    }

    function restoreWindow(win) {
        if (!win) return;

        win.classList.remove("minimized");
        win.style.display = "flex";
        win.dataset.minimized = "false";

        focusWindow(win);
    }

    function launchApp(id) {
        const app = appInfo(id);
        if (!app) return;

        closeOverview();
        closeSystemPanel();

        const existing = $$(".window", workspace).find(win =>
            win.dataset.app === id
        );

        if (existing) {
            restoreWindow(existing);
            return;
        }

        createWindow(app);
    }

    function createWindow(app) {
        const win = document.createElement("section");

        win.className = "window focused";
        win.dataset.app = app.id;
        win.dataset.minimized = "false";
        win.dataset.maximized = "false";

        const width = Math.min(850, window.innerWidth - 40);
        const height = Math.min(590, window.innerHeight - 110);

        win.style.width = Math.max(320, width) + "px";
        win.style.height = Math.max(250, height) + "px";
        win.style.left = Math.max(10, (window.innerWidth - width) / 2) + "px";
        win.style.top = Math.max(45, (window.innerHeight - height) / 2) + "px";
        win.style.zIndex = ++highestZ;

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
                ${getApplicationHTML(app.id)}
            </div>
        `;

        workspace.appendChild(win);

        setupWindow(win);
        setupApplication(win, app.id);
        focusWindow(win);
        updateDock();

        return win;
    }

    function setupWindow(win) {
        const header = $(".window-header", win);
        const close = $(".window-close", win);
        const minimize = $(".window-minimize", win);
        const maximize = $(".window-maximize", win);

        win.addEventListener("pointerdown", () => focusWindow(win));

        close?.addEventListener("click", event => {
            event.stopPropagation();

            win.remove();

            if (activeWindow === win) {
                activeWindow = null;
            }

            updateDock();
        });

        minimize?.addEventListener("click", event => {
            event.stopPropagation();

            win.classList.add("minimized");
            win.style.display = "none";
            win.dataset.minimized = "true";

            if (activeWindow === win) {
                activeWindow = null;
            }

            updateDock();
        });

        maximize?.addEventListener("click", event => {
            event.stopPropagation();
            toggleMaximize(win);
        });

        header?.addEventListener("dblclick", event => {
            if (!event.target.closest(".window-controls")) {
                toggleMaximize(win);
            }
        });

        // Dragging
        if (header) {
            let dragging = false;
            let startX = 0;
            let startY = 0;
            let originalX = 0;
            let originalY = 0;

            header.addEventListener("pointerdown", event => {
                if (event.target.closest(".window-controls")) return;
                if (win.dataset.maximized === "true") return;
                if (event.button !== 0) return;

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
                    0,
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
        }
    }

    function toggleMaximize(win) {
        if (win.dataset.maximized === "true") {
            win.dataset.maximized = "false";

            win.style.left = win.dataset.previousLeft;
            win.style.top = win.dataset.previousTop;
            win.style.width = win.dataset.previousWidth;
            win.style.height = win.dataset.previousHeight;

            win.classList.remove("maximized");
        } else {
            win.dataset.previousLeft = win.style.left;
            win.dataset.previousTop = win.style.top;
            win.dataset.previousWidth = win.style.width;
            win.dataset.previousHeight = win.style.height;

            win.dataset.maximized = "true";
            win.classList.add("maximized");

            win.style.left = "0";
            win.style.top = "32px";
            win.style.width = "100%";
            win.style.height = "calc(100% - 32px)";
        }

        focusWindow(win);
    }

    // ---------------------------------------------------------
    // DOCK
    // ---------------------------------------------------------

    function updateDock() {
        $$(".dock-app").forEach(button => {
            const open = $$(".window", workspace).some(win =>
                win.dataset.app === button.dataset.app
            );

            button.classList.toggle("running", open);
        });
    }

    $$(".dock-app").forEach(button => {
        button.addEventListener("click", () => {
            const id = button.dataset.app;
            const existing = $$(".window", workspace).find(win =>
                win.dataset.app === id
            );

            if (existing && existing === activeWindow &&
                existing.dataset.minimized !== "true") {
                existing.style.display = "none";
                existing.dataset.minimized = "true";
                existing.classList.add("minimized");
                activeWindow = null;
                updateDock();
                return;
            }

            launchApp(id);
        });
    });

    // ---------------------------------------------------------
    // APPLICATION CONTENT
    // ---------------------------------------------------------

    function getApplicationHTML(id) {
        switch (id) {
            case "browser":
                return `
                    <div class="browser">
                        <div class="browser-toolbar">
                            <button class="browser-back" title="Back">←</button>
                            <button class="browser-forward" title="Forward">→</button>
                            <button class="browser-reload" title="Reload">↻</button>
                            <input class="browser-address"
                                value="https://example.com"
                                placeholder="Search or enter address">
                            <button class="browser-go">Go</button>
                        </div>
                        <iframe class="browser-frame"
                            src="https://example.com"
                            title="Web Browser"
                            referrerpolicy="no-referrer"></iframe>
                    </div>
                `;

            case "files":
                return `
                    <div class="files-app">
                        <aside class="files-sidebar">
                            <button class="file-location active" data-location="Home">⌂ Home</button>
                            <button class="file-location" data-location="Desktop">▦ Desktop</button>
                            <button class="file-location" data-location="Documents">▤ Documents</button>
                            <button class="file-location" data-location="Downloads">↓ Downloads</button>
                            <button class="file-location" data-location="Pictures">▧ Pictures</button>
                            <button class="file-location" data-location="Music">♫ Music</button>
                        </aside>

                        <div class="files-main">
                            <div class="files-heading">Home</div>
                            <div class="files-grid">
                                ${[
                                    ["Desktop", "🖥️"],
                                    ["Documents", "📄"],
                                    ["Downloads", "📥"],
                                    ["Pictures", "🖼️"],
                                    ["Music", "🎵"],
                                    ["Videos", "🎬"]
                                ].map(([name, icon]) => `
                                    <button class="file-item" data-folder="${name}">
                                        <span>${icon}</span>
                                        <span>${name}</span>
                                    </button>
                                `).join("")}
                            </div>
                            <p class="files-notice">
                                Simulated file manager. Actual device files are not accessible.
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
                            <div>Type <span class="terminal-highlight">help</span> for commands.</div>
                            <br>
                        </div>
                        <form class="terminal-form">
                            <span class="terminal-prompt">user@gamingos:~$</span>
                            <input class="terminal-input" autocomplete="off"
                                spellcheck="false" aria-label="Terminal command">
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
                        <textarea class="notes-content"
                            placeholder="Start writing..."
                            spellcheck="false"></textarea>
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
                                <p>Customize your desktop.</p>

                                <div class="setting-row">
                                    <div>
                                        <strong>Dark mode</strong>
                                        <p>Use a dark desktop theme.</p>
                                    </div>
                                    <input type="checkbox" class="theme-toggle">
                                </div>

                                <div class="setting-row">
                                    <div>
                                        <strong>Animations</strong>
                                        <p>Enable interface transitions.</p>
                                    </div>
                                    <input type="checkbox" class="animation-toggle">
                                </div>
                            </section>

                            <section class="settings-page hidden" data-page="display">
                                <h3>Display</h3>
                                <p>Adjust screen brightness.</p>
                                <div class="setting-row">
                                    <strong>Brightness</strong>
                                    <input class="settings-brightness"
                                        type="range" min="50" max="100" value="100">
                                </div>
                            </section>

                            <section class="settings-page hidden" data-page="about">
                                <h3>About GamingOS</h3>
                                <p>GamingOS is a browser-based desktop environment.</p>
                                <p>Version 1.0</p>
                                <p>GNOME-inspired interface</p>
                            </section>
                        </div>
                    </div>
                `;

            case "calculator":
                return `
                    <div class="calculator-app">
                        <input class="calculator-display" value="0" readonly
                            aria-label="Calculator display">

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
                        <div class="about-icon">g</div>
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
                return "<p>Application not found.</p>";
        }
    }

    // ---------------------------------------------------------
    // BROWSER
    // ---------------------------------------------------------

    function setupBrowser(win) {
        const address = $(".browser-address", win);
        const frame = $(".browser-frame", win);

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
                const url = new URL(value);

                if (!["http:", "https:"].includes(url.protocol)) {
                    notify("Unsupported address");
                    return;
                }

                address.value = url.href;
                frame.src = url.href;
            } catch {
                notify("Invalid address");
            }
        }

        $(".browser-go", win)?.addEventListener("click", navigate);

        address.addEventListener("keydown", event => {
            if (event.key === "Enter") navigate();
        });

        $(".browser-reload", win)?.addEventListener("click", () => {
            frame.src = frame.src;
        });

        $(".browser-back", win)?.addEventListener("click", () => {
            try {
                frame.contentWindow.history.back();
            } catch {
                notify("This page blocks browser navigation");
            }
        });

        $(".browser-forward", win)?.addEventListener("click", () => {
            try {
                frame.contentWindow.history.forward();
            } catch {
                notify("This page blocks browser navigation");
            }
        });
    }

    // ---------------------------------------------------------
    // FILES
    // ---------------------------------------------------------

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

                if (heading) heading.textContent = folder;

                $$(".file-location", win).forEach(item => {
                    item.classList.toggle(
                        "active",
                        item.dataset.location === folder
                    );
                });

                notify(folder + " is empty");
            });
        });
    }

    // ---------------------------------------------------------
    // TERMINAL
    // ---------------------------------------------------------

    function setupTerminal(win) {
        const form = $(".terminal-form", win);
        const input = $(".terminal-input", win);
        const output = $(".terminal-output", win);

        if (!form || !input || !output) return;

        function print(value = "") {
            const line = document.createElement("div");
            line.textContent = value;
            output.appendChild(line);
        }

        function execute(command) {
            const parts = command.trim().split(/\s+/);
            const cmd = (parts.shift() || "").toLowerCase();

            switch (cmd) {
                case "":
                    break;

                case "help":
                    print("Available commands:");
                    print("help       Show commands");
                    print("clear      Clear terminal");
                    print("date       Show date");
                    print("time       Show time");
                    print("whoami     Current user");
                    print("hostname   System name");
                    print("uname      Environment information");
                    print("ls         List simulated files");
                    print("pwd        Current directory");
                    print("echo       Print text");
                    print("neofetch   System information");
                    print("about      About GamingOS");
                    print("exit       Close terminal");
                    break;

                case "clear":
                    output.innerHTML = "";
                    break;

                case "date":
                    print(new Date().toDateString());
                    break;

                case "time":
                    print(new Date().toLocaleTimeString());
                    break;

                case "whoami":
                    print("user");
                    break;

                case "hostname":
                    print("gamingos");
                    break;

                case "uname":
                    print("GamingOS Browser Desktop");
                    break;

                case "pwd":
                    print("/home/user");
                    break;

                case "ls":
                    print("Desktop  Documents  Downloads  Pictures  Music  Videos");
                    break;

                case "echo":
                    print(parts.join(" "));
                    break;

                case "neofetch":
                    print("       .--.       user@gamingos");
                    print("      |o_o |      ----------------");
                    print("      |:_/ |      OS: GamingOS");
                    print("     //   \\ \\     Version: 1.0");
                    print("    (|     | )    Shell: GamingOS Terminal");
                    print("   /'\\_   _/`\\    Platform: Browser");
                    print("   \\___)=(___/    Desktop: GNOME-inspired");
                    break;

                case "about":
                    print("GamingOS 1.0 - Browser-based desktop environment.");
                    break;

                case "exit":
                    win.remove();
                    activeWindow = null;
                    updateDock();
                    break;

                default:
                    print("Command not found: " + cmd);
                    print("Type 'help' for available commands.");
            }

            output.scrollTop = output.scrollHeight;
        }

        form.addEventListener("submit", event => {
            event.preventDefault();

            const command = input.value;
            print("user@gamingos:~$ " + command);

            execute(command);
            input.value = "";
            output.scrollTop = output.scrollHeight;
        });

        input.focus();
    }

    // ---------------------------------------------------------
    // NOTES
    // ---------------------------------------------------------

    function setupNotes(win) {
        const editor = $(".notes-content", win);
        const clear = $(".notes-clear", win);
        const status = $(".notes-status", win);

        if (!editor) return;

        editor.value = storage.get("notes", "");

        editor.addEventListener("input", () => {
            storage.set("notes", editor.value);
            if (status) status.textContent = "Saved locally";
        });

        clear?.addEventListener("click", () => {
            editor.value = "";
            storage.set("notes", "");

            if (status) status.textContent = "Cleared";
            notify("Notes cleared");
        });
    }

    // ---------------------------------------------------------
    // SETTINGS
    // ---------------------------------------------------------

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

        const theme = $(".theme-toggle", win);
        const animations = $(".animation-toggle", win);
        const brightness = $(".settings-brightness", win);

        if (theme) {
            theme.checked = storage.get("light-theme", "false") !== "true";

            theme.addEventListener("change", () => {
                const light = !theme.checked;

                document.body.classList.toggle("light-theme", light);
                storage.set("light-theme", String(light));
            });
        }

        if (animations) {
            animations.checked = storage.get("animations", "true") !== "false";

            animations.addEventListener("change", () => {
                document.body.classList.toggle(
                    "no-animations",
                    !animations.checked
                );

                storage.set("animations", String(animations.checked));
            });
        }

        if (brightness) {
            brightness.value = storage.get("brightness", "100");

            brightness.addEventListener("input", () => {
                setBrightness(brightness.value);
            });
        }
    }

    // ---------------------------------------------------------
    // CALCULATOR
    // ---------------------------------------------------------

    function setupCalculator(win) {
        const display = $(".calculator-display", win);
        if (!display) return;

        let expression = "";

        function update() {
            display.value = expression || "0";
        }

        function calculate() {
            if (!expression) return;

            // The allowlist prevents letters, property access, and arbitrary code.
            if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
                display.value = "Error";
                expression = "";
                return;
            }

            try {
                const result = Function(
                    '"use strict"; return (' + expression + ')'
                )();

                if (!Number.isFinite(result)) {
                    throw new Error("Invalid result");
                }

                expression = String(Number(result.toFixed(10)));
                update();
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

                update();
            });
        });
    }

    // ---------------------------------------------------------
    // INITIALIZE APPS
    // ---------------------------------------------------------

    function setupApplication(win, id) {
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

    // ---------------------------------------------------------
    // KEYBOARD SHORTCUTS
    // ---------------------------------------------------------

    document.addEventListener("keydown", event => {
        const target = event.target;

        const typing =
            target instanceof HTMLInputElement ||
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

        if (event.ctrlKey && event.altKey &&
            event.key.toLowerCase() === "t") {
            event.preventDefault();
            launchApp("terminal");
        }

        if (event.ctrlKey && event.altKey &&
            event.key.toLowerCase() === "b") {
            event.preventDefault();
            launchApp("browser");
        }

        if (!typing && event.key === " ") {
            // Space is intentionally not bound to a desktop action.
        }
    });

    // ---------------------------------------------------------
    // RESTORE SETTINGS
    // ---------------------------------------------------------

    if (storage.get("light-theme", "false") === "true") {
        document.body.classList.add("light-theme");
    }

    if (storage.get("animations", "true") === "false") {
        document.body.classList.add("no-animations");
    }

    setBrightness(storage.get("brightness", "100"));

    // ---------------------------------------------------------
    // STARTUP
    // ---------------------------------------------------------

    function startDesktop() {
        boot?.classList.add("hidden");
        desktop.classList.remove("hidden");

        updateClock();
        renderApplications();
        updateDock();

        launchApp("browser");
    }

    if (boot) {
        setTimeout(startDesktop, 1000);
    } else {
        startDesktop();
    }

    console.info("GamingOS started.");
})();

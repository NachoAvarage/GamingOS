
const $ = selector => document.querySelector(selector);

const desktop = $("#desktop");
const workspace = $("#workspace");
const overview = $("#overview");

const apps = [
    ["browser", "🌐", "Web Browser"],
    ["files", "📁", "Files"],
    ["terminal", "▣", "Terminal"],
    ["notes", "📝", "Notes"],
    ["settings", "⚙", "Settings"],
    ["calculator", "＋", "Calculator"],
    ["about", "ⓘ", "About GamingOS"]
];

let windowZ = 10;
let windowCount = 0;

function notify(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

function updateClock() {
    $("#clock").textContent = new Date().toLocaleString([], {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}

setInterval(updateClock, 1000);
updateClock();

function contentFor(id) {
    switch (id) {
        case "browser":
            return `
                <div class="browser">
                    <div class="browser-toolbar">
                        <button id="back">←</button>
                        <button id="forward">→</button>
                        <button id="reload">↻</button>
                        <input id="address" value="https://example.com">
                        <button id="go">Go</button>
                    </div>
                    <div class="browser-start" id="browserStart">
                        <h2>GamingOS Web</h2>
                        <p>Welcome to the GamingOS browser.</p>
                        <p>Enter a website address above.</p>
                        <button data-url="https://wikipedia.org">Wikipedia</button>
                        <button data-url="https://github.com">GitHub</button>
                        <button data-url="https://example.com">Example</button>
                    </div>
                    <iframe id="browserFrame" class="hidden"
                        title="Browser window"
                        sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-downloads">
                    </iframe>
                </div>
            `;

        case "files":
            return `
                <div class="file-app">
                    <nav class="file-sidebar">
                        <button>⌂ Home</button>
                        <button>◷ Recent</button>
                        <button>★ Starred</button>
                        <button>▣ Downloads</button>
                        <button>▤ Documents</button>
                        <button>▧ Pictures</button>
                    </nav>
                    <div class="file-content">
                        <h2>Home</h2>
                        <p>GamingOS folders</p>
                        <p>📁 Documents</p>
                        <p>📁 Downloads</p>
                        <p>📁 Pictures</p>
                        <p>📁 Music</p>
                        <p>📁 Videos</p>
                        <p>📁 Games</p>
                    </div>
                </div>
            `;

        case "terminal":
            return `
                <div class="terminal">
                    <div id="terminalOutput">
                        GamingOS Terminal 1.0<br>
                        Type <b>help</b> for commands.<br><br>
                    </div>
                    <div class="terminal-input">
                        user@gamingos:~$
                        <input id="terminalInput" autocomplete="off">
                    </div>
                </div>
            `;

        case "notes":
            return `
                <div class="notes">
                    <textarea id="notesText"
                        placeholder="Start writing..."></textarea>
                </div>
            `;

        case "settings":
            return `
                <div class="settings">
                    <h2>Settings</h2>
                    <div class="setting">
                        <div>
                            <b>Appearance</b>
                            <small>Desktop appearance</small>
                        </div>
                        <span>Dark</span>
                    </div>
                    <div class="setting">
                        <div>
                            <b>Desktop</b>
                            <small>GNOME-inspired interface</small>
                        </div>
                        <span>GamingOS</span>
                    </div>
                    <div class="setting">
                        <div>
                            <b>Version</b>
                            <small>GamingOS Web Edition</small>
                        </div>
                        <span>1.0</span>
                    </div>
                    <div class="setting">
                        <div>
                            <b>Animations</b>
                            <small>Interface transitions</small>
                        </div>
                        <input type="checkbox" id="animations" checked>
                    </div>
                </div>
            `;

        case "calculator":
            return `
                <div class="calculator">
                    <div class="calc-display" id="calcDisplay">0</div>
                    <div class="calc-grid">
                        ${["C","(",")","÷","7","8","9","×","4","5","6","−","1","2","3","+","0",".","⌫","="]
                            .map(key => `<button data-key="${key}" class="${key === "=" ? "equals" : ""}">${key}</button>`)
                            .join("")}
                    </div>
                </div>
            `;

        default:
            return `
                <div class="settings">
                    <h2>GamingOS</h2>
                    <p>A desktop environment inspired by GNOME.</p>
                    <p>Version 1.0 Web Edition.</p>
                    <p>This is a website, not a full operating system.</p>
                </div>
            `;
    }
}

function focusWindow(win) {
    document.querySelectorAll(".window").forEach(window => {
        window.style.borderColor = "#59616c";
    });

    win.style.borderColor = "#8a9aaa";
    win.style.zIndex = ++windowZ;
}

function createWindow(id) {
    const app = apps.find(item => item[0] === id);
    if (!app) return;

    const existing = document.querySelector(
        `.window[data-app="${id}"]`
    );

    if (existing) {
        existing.style.display = "flex";
        focusWindow(existing);
        overview.classList.add("hidden");
        return;
    }

    windowCount++;

    const win = document.createElement("section");
    win.className = "window";
    win.dataset.app = id;

    win.style.left = `${100 + windowCount * 22}px`;
    win.style.top = `${65 + windowCount * 18}px`;
    win.style.zIndex = ++windowZ;

    win.innerHTML = `
        <div class="titlebar">
            <span class="window-title">${app[1]} ${app[2]}</span>
            <div class="window-controls">
                <button class="minimize">−</button>
                <button class="maximize">□</button>
                <button class="close">×</button>
            </div>
        </div>
        <div class="window-body">
            ${contentFor(id)}
        </div>
        <div class="resize"></div>
    `;

    workspace.appendChild(win);

    focusWindow(win);
    setupWindow(win);
    setupApp(win, id);

    overview.classList.add("hidden");
    updateDock();
}

function setupWindow(win) {
    const titlebar = win.querySelector(".titlebar");

    win.addEventListener("pointerdown", () => focusWindow(win));

    win.querySelector(".close").onclick = () => {
        win.remove();
        updateDock();
    };

    win.querySelector(".minimize").onclick = () => {
        win.style.display = "none";
        updateDock();
    };

    win.querySelector(".maximize").onclick = () => {
        win.classList.toggle("maximized");
    };

    let drag = null;

    titlebar.addEventListener("pointerdown", event => {
        if (event.target.closest("button")) return;
        if (win.classList.contains("maximized")) return;

        focusWindow(win);

        drag = {
            x: event.clientX - win.offsetLeft,
            y: event.clientY - win.offsetTop
        };

        titlebar.setPointerCapture(event.pointerId);
    });

    titlebar.addEventListener("pointermove", event => {
        if (!drag) return;

        win.style.left = Math.max(
            0,
            event.clientX - drag.x
        ) + "px";

        win.style.top = Math.max(
            32,
            event.clientY - drag.y
        ) + "px";
    });

    titlebar.addEventListener("pointerup", () => {
        drag = null;
    });

    const resize = win.querySelector(".resize");
    let sizing = null;

    resize.addEventListener("pointerdown", event => {
        event.preventDefault();

        sizing = {
            x: event.clientX,
            y: event.clientY,
            width: win.offsetWidth,
            height: win.offsetHeight
        };

        resize.setPointerCapture(event.pointerId);
    });

    resize.addEventListener("pointermove", event => {
        if (!sizing) return;

        win.style.width = Math.max(
            300,
            sizing.width + event.clientX - sizing.x
        ) + "px";

        win.style.height = Math.max(
            200,
            sizing.height + event.clientY - sizing.y
        ) + "px";
    });

    resize.addEventListener("pointerup", () => {
        sizing = null;
    });
}

function setupApp(win, id) {
    if (id === "browser") {
        const address = win.querySelector("#address");
        const frame = win.querySelector("#browserFrame");
        const start = win.querySelector("#browserStart");

        function navigate() {
            let url = address.value.trim();

            if (!url) return;

            if (!/^https?:\/\//i.test(url)) {
                if (url.includes(".") && !url.includes(" ")) {
                    url = "https://" + url;
                } else {
                    url = "https://www.google.com/search?q=" +
                        encodeURIComponent(url);
                }
            }

            address.value = url;
            frame.src = url;
            frame.classList.remove("hidden");
            start.classList.add("hidden");
        }

        win.querySelector("#go").onclick = navigate;

        address.addEventListener("keydown", event => {
            if (event.key === "Enter") navigate();
        });

        win.querySelectorAll("[data-url]").forEach(button => {
            button.onclick = () => {
                address.value = button.dataset.url;
                navigate();
            };
        });

        win.querySelector("#reload").onclick = () => {
            try {
                frame.contentWindow.location.reload();
            } catch {
                notify("This website blocks browser controls.");
            }
        };

        win.querySelector("#back").onclick = () => {
            try {
                frame.contentWindow.history.back();
            } catch {
                notify("Navigation unavailable.");
            }
        };

        win.querySelector("#forward").onclick = () => {
            try {
                frame.contentWindow.history.forward();
            } catch {
                notify("Navigation unavailable.");
            }
        };
    }

    if (id === "notes") {
        const textarea = win.querySelector("#notesText");
        textarea.value = localStorage.getItem("gamingos-notes") || "";

        textarea.addEventListener("input", () => {
            localStorage.setItem("gamingos-notes", textarea.value);
        });
    }

    if (id === "terminal") {
        const input = win.querySelector("#terminalInput");
        const output = win.querySelector("#terminalOutput");

        input.addEventListener("keydown", event => {
            if (event.key !== "Enter") return;

            const command = input.value.trim();
            const safe = escapeHTML(command);

            output.innerHTML +=
                `<span style="color:#8bd49b">user@gamingos:~$</span> ${safe}<br>`;

            let result = "";

            switch (command) {
                case "help":
                    result = "help, clear, date, whoami, uname, ls, neofetch";
                    break;
                case "date":
                    result = new Date().toString();
                    break;
                case "whoami":
                    result = "user";
                    break;
                case "uname":
                    result = "GamingOS Web 1.0";
                    break;
                case "ls":
                    result = "Desktop Documents Downloads Games Music Pictures Videos";
                    break;
                case "neofetch":
                    result = "   G      OS: GamingOS Web Edition\n  /_\\     Desktop: GNOME-inspired\n           Shell: Browser";
                    break;
                case "clear":
                    output.innerHTML = "";
                    input.value = "";
                    return;
                default:
                    if (command) result = `Command not found: ${command}`;
            }

            output.innerHTML += escapeHTML(result) + "<br><br>";
            output.scrollTop = output.scrollHeight;
            input.value = "";
        });
    }

    if (id === "settings") {
        win.querySelector("#animations").onchange = event => {
            document.body.style.transition = event.target.checked ? "" : "none";
        };
    }

    if (id === "calculator") {
        let expression = "";
        const display = win.querySelector("#calcDisplay");

        win.querySelectorAll("[data-key]").forEach(button => {
            button.onclick = () => {
                const key = button.dataset.key;

                if (key === "C") {
                    expression = "";
                } else if (key === "⌫") {
                    expression = expression.slice(0, -1);
                } else if (key === "=") {
                    try {
                        const normalized = expression
                            .replace(/×/g, "*")
                            .replace(/÷/g, "/")
                            .replace(/−/g, "-");

                        if (!/^[0-9+\-*/(). ]+$/.test(normalized)) {
                            throw new Error("Invalid");
                        }

                        expression = String(
                            Function('"use strict"; return (' +
                            normalized + ')')()
                        );
                    } catch {
                        expression = "Error";
                    }
                } else {
                    expression += key;
                }

                display.textContent = expression || "0";
            };
        });
    }
}

function escapeHTML(value) {
    return value.replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function updateDock() {
    document.querySelectorAll(".dock-app").forEach(button => {
        const appWindow = document.querySelector(
            `.window[data-app="${button.dataset.app}"]`
        );

        button.classList.toggle("running", !!appWindow);
    });
}

function renderOverview() {
    const running = $("#runningApps");
    const grid = $("#appGrid");

    running.innerHTML = "";

    document.querySelectorAll(".window").forEach(win => {
        const app = apps.find(item => item[0] === win.dataset.app);

        const button = document.createElement("button");
        button.className = "running-item";
        button.textContent = app[1] + " " + app[2];

        button.onclick = () => {
            win.style.display = "flex";
            focusWindow(win);
            overview.classList.add("hidden");
        };

        running.appendChild(button);
    });

    renderApps("");
}

function renderApps(query) {
    const grid = $("#appGrid");
    grid.innerHTML = "";

    apps.filter(app =>
        app[2].toLowerCase().includes(query.toLowerCase())
    ).forEach(app => {
        const button = document.createElement("button");
        button.className = "app-tile";

        button.innerHTML = `
            <span class="app-icon">${app[1]}</span>
            <span class="app-name">${app[2]}</span>
        `;

        button.onclick = () => createWindow(app[0]);
        grid.appendChild(button);
    });
}

function toggleOverview() {
    overview.classList.toggle("hidden");
    $("#systemPanel").classList.add("hidden");

    if (!overview.classList.contains("hidden")) {
        renderOverview();
        $("#searchApps").value = "";
        $("#searchApps").focus();
    }
}

$("#activities").onclick = toggleOverview;
$("#showApps").onclick = toggleOverview;

$("#searchApps").addEventListener("input", event => {
    renderApps(event.target.value);
});

document.querySelectorAll(".dock-app").forEach(button => {
    button.onclick = () => createWindow(button.dataset.app);
});

$("#systemButton").onclick = () => {
    $("#systemPanel").classList.toggle("hidden");
    overview.classList.add("hidden");
};

document.querySelectorAll(".toggle").forEach(button => {
    button.onclick = () => {
        button.classList.toggle("enabled");
        button.style.background = button.classList.contains("enabled")
            ? "#3584e4"
            : "";
    };
});

$("#brightness").oninput = event => {
    $(".wallpaper").style.filter =
        `brightness(${event.target.value / 85})`;
};

$("#openSettings").onclick = () => createWindow("settings");

$("#shutdown").onclick = () => {
    if (confirm("Power off GamingOS?")) {
        desktop.classList.add("hidden");
        $("#boot").classList.remove("hidden");

        setTimeout(() => {
            $("#boot").classList.add("hidden");
            desktop.classList.remove("hidden");
        }, 1500);
    }
};

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        overview.classList.add("hidden");
        $("#systemPanel").classList.add("hidden");
    }

    if (event.key === "F1" || (event.altKey && event.code === "Space")) {
        event.preventDefault();
        toggleOverview();
    }

    if (event.key === "F2") {
        createWindow("browser");
    }
});

setTimeout(() => {
    $("#boot").classList.add("hidden");
    desktop.classList.remove("hidden");
    createWindow("browser");
}, 1600);

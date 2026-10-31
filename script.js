"use strict";

/* =========================================================
   WAZIR AURA — MAIN JAVASCRIPT
   Version: 2.1 (fully wired to current HTML/CSS)
   ========================================================= */

(() => {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  const STORAGE = {
    theme: "wa_v2_theme",
    projects: "wa_v2_projects",
    notes: "wa_v2_notes",
    analytics: "wa_v2_analytics",
    reviews: "wa_v2_reviews",
    settings: "wa_v2_settings",
    editor: "wa_v2_editor",
    activity: "wa_v2_activity",
    gamesPlayed: "wa_v2_games_played"
  };

  const PAGE_TITLES = {
    overview: "Overview",
    ai: "AI Assistant",
    tools: "Free Tools",
    projects: "My Projects",
    games: "Game Galaxy",
    codelab: "Code Lab",
    notepad: "Notepad",
    analytics: "Analytics",
    services: "Services & Hire",
    pricing: "Plans & Pricing",
    reviews: "Reviews",
    about: "About Us",
    contact: "Contact",
    settings: "Settings"
  };

  const DEFAULT_SETTINGS = {
    theme: "dark",
    accent: "aurora",
    density: "comfortable",
    stars: true,
    animations: true,
    effects3d: true,
    sound: false,
    startPage: "overview",
    confirmDelete: true,
    autosave: true,
    defaultProjectCategory: "Personal",
    defaultProjectColor: "purple"
  };

  const DEFAULT_HTML = `<main class="demo">
  <h1>Hello, Creator!</h1>
  <p>Welcome to my first Wazir Aura project.</p>
  <button onclick="document.querySelector('p').textContent='You made it work!'">Click me</button>
</main>`;

  const DEFAULT_CSS = `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #101329;
  color: white;
  font-family: Arial, sans-serif;
}
.demo { text-align: center; padding: 40px; }
h1 { color: #67e8f9; }
button {
  padding: 12px 22px;
  border: 0;
  border-radius: 10px;
  background: #8258ff;
  color: white;
  cursor: pointer;
}`;

  const DEFAULT_JS = `console.log("Welcome to Wazir Aura Code Lab!");`;

  const QUOTES = [
    "Great things begin with a curious mind.",
    "Code is poetry written for machines and humans.",
    "Explore boldly. Create without limits.",
    "Every expert was once a beginner who refused to stop.",
    "Your digital universe is limited only by imagination.",
    "Small experiments lead to big discoveries.",
    "Build what you wish existed.",
    "Creativity is intelligence having fun.",
    "Ship ideas. Learn. Improve. Repeat.",
    "The best way to predict the future is to invent it."
  ];

  /* -------------------- STORAGE HELPERS -------------------- */

  const read = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Storage error:", error);
      showToast("Could not save data. Browser storage may be full.", "error");
      return false;
    }
  };

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char])
    );

  const makeId = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  };

  /* -------------------- TOAST -------------------- */

  function showToast(message, type = "success") {
    const container = $("#toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(20px)";
      setTimeout(() => toast.remove(), 280);
    }, 2800);
  }

  /* -------------------- CONFIRM DIALOG -------------------- */

  let confirmResolver = null;

  function confirmAction(title, message) {
    return new Promise((resolve) => {
      const modal = $("#confirmModal");
      if (!modal) {
        resolve(window.confirm(message));
        return;
      }
      $("#confirmTitle").textContent = title || "Are you sure?";
      $("#confirmMessage").textContent = message || "Please confirm this action.";
      modal.classList.remove("hidden");
      confirmResolver = resolve;
    });
  }

  function closeConfirm(result) {
    $("#confirmModal")?.classList.add("hidden");
    if (confirmResolver) {
      confirmResolver(result);
      confirmResolver = null;
    }
  }

  /* -------------------- ANALYTICS & ACTIVITY -------------------- */

  let analytics = read(STORAGE.analytics, {
    views: 0,
    events: 0,
    pages: {},
    tools: {},
    games: {},
    started: new Date().toISOString()
  });

  let activityLog = read(STORAGE.activity, []);
  let gamesPlayedCount = read(STORAGE.gamesPlayed, 0);

  function pushActivity(text) {
    activityLog.unshift({
      id: makeId(),
      text,
      at: new Date().toISOString()
    });
    activityLog = activityLog.slice(0, 40);
    write(STORAGE.activity, activityLog);
    renderRecentActivity();
  }

  function recordEvent(name, label) {
    analytics.events = (analytics.events || 0) + 1;
    if (name.startsWith("page:")) {
      const page = name.slice(5);
      analytics.pages[page] = (analytics.pages[page] || 0) + 1;
    } else if (name.startsWith("tool:")) {
      const tool = name.slice(5);
      analytics.tools[tool] = (analytics.tools[tool] || 0) + 1;
    } else if (name.startsWith("game:")) {
      const game = name.slice(5);
      analytics.games[game] = (analytics.games[game] || 0) + 1;
    }
    write(STORAGE.analytics, analytics);
    updateAnalyticsUI();
    if (label) pushActivity(label);
  }

  function updateAnalyticsUI() {
    const setText = (id, value) => {
      const el = $(id);
      if (el) el.textContent = value;
    };

    setText("#totalViews", analytics.views || 0);
    setText("#totalEvents", analytics.events || 0);
    setText("#totalProjects", projectsData.length);
    setText("#gamesPlayed", gamesPlayedCount);

    setText("#analyticsViews", analytics.views || 0);
    setText("#analyticsEvents", analytics.events || 0);
    setText("#analyticsProjects", projectsData.length);

    const pagesEl = $("#analyticsPages");
    if (pagesEl) {
      const entries = Object.entries(analytics.pages || {}).sort((a, b) => b[1] - a[1]);
      if (!entries.length) {
        pagesEl.innerHTML = `<p class="empty-state">No page activity recorded yet.</p>`;
      } else {
        const max = Math.max(...entries.map(([, c]) => c), 1);
        pagesEl.innerHTML = entries
          .map(
            ([name, count]) => `
          <div class="analytics-bar-row">
            <span>${escapeHTML(PAGE_TITLES[name] || name)}</span>
            <div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:${Math.round((count / max) * 100)}%"></div></div>
            <strong>${count}</strong>
          </div>`
          )
          .join("");
      }
    }

    const recentEl = $("#analyticsRecent");
    if (recentEl) {
      recentEl.innerHTML = activityLog.length
        ? activityLog
            .slice(0, 12)
            .map(
              (item) => `
          <div class="activity-item">
            <span class="activity-dot"></span>
            <div>
              <strong>${escapeHTML(item.text)}</strong>
              <small>${escapeHTML(formatDate(item.at))}</small>
            </div>
          </div>`
            )
            .join("")
        : `<p class="empty-state">Your activity will appear here.</p>`;
    }
  }

  function renderRecentActivity() {
    const el = $("#recentActivity");
    if (!el) return;
    el.innerHTML = activityLog.length
      ? activityLog
          .slice(0, 6)
          .map(
            (item) => `
        <div class="activity-item">
          <span class="activity-dot"></span>
          <div>
            <strong>${escapeHTML(item.text)}</strong>
            <small>${escapeHTML(formatDate(item.at))}</small>
          </div>
        </div>`
          )
          .join("")
      : `<p class="empty-state">Your activity will appear here.</p>`;
  }

  /* -------------------- NAVIGATION -------------------- */

  let currentPage = "overview";

  function openPage(pageName, pushHistory = true) {
    if (!pageName) return;
    const target = $(`#page-${pageName}`);
    if (!target) {
      console.warn("Page not found:", pageName);
      return;
    }

    $$(".page-section").forEach((page) => page.classList.remove("active"));
    target.classList.add("active");

    $$(".nav-link").forEach((link) => {
      const page = link.dataset.page || link.dataset.pageLink;
      link.classList.toggle("active", page === pageName);
    });

    const title = $("#pageTitle");
    if (title) title.textContent = PAGE_TITLES[pageName] || pageName;

    currentPage = pageName;
    closeMobileMenu();
    recordEvent("page:" + pageName, `Opened ${PAGE_TITLES[pageName] || pageName}`);

    if (pushHistory && history.state?.page !== pageName) {
      history.pushState({ page: pageName }, "", `#${pageName}`);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (pageName === "analytics") updateAnalyticsUI();
    if (pageName === "projects") renderProjects();
    if (pageName === "notepad") renderNotesList();
    if (pageName === "tools") renderTools();
    if (pageName === "games") renderGames();
    if (pageName === "reviews") renderReviews();
  }

  function closeMobileMenu() {
    $("#sidebar")?.classList.remove("mobile-open", "open");
    const overlay = $("#sidebarOverlay");
    if (overlay) {
      overlay.classList.remove("active", "show");
    }
  }

  function openMobileMenu() {
    $("#sidebar")?.classList.add("mobile-open");
    $("#sidebarOverlay")?.classList.add("active");
  }

  /* -------------------- THEME & SETTINGS -------------------- */

  let settings = { ...DEFAULT_SETTINGS, ...read(STORAGE.settings, {}) };

  function applyTheme(theme) {
    settings.theme = theme === "light" ? "light" : "dark";
    document.body.classList.toggle("light-theme", settings.theme === "light");
    document.documentElement.dataset.theme = settings.theme;

    const icon = settings.theme === "light" ? "fa-moon" : "fa-sun";
    ["#themeToggle", "#mobileThemeBtn"].forEach((sel) => {
      const btn = $(sel);
      if (btn) btn.innerHTML = `<i class="fa-solid ${icon}"></i>`;
    });
  }

  function applyAccent(accent) {
    settings.accent = accent || "aurora";
    document.body.classList.remove(
      "accent-gold",
      "accent-cyan",
      "accent-pink",
      "accent-green"
    );
    if (settings.accent !== "aurora") {
      document.body.classList.add(`accent-${settings.accent}`);
    }
  }

  function applySettings() {
    applyTheme(settings.theme);
    applyAccent(settings.accent);

    document.body.classList.toggle("compact-ui", settings.density === "compact");
    document.body.classList.toggle("no-animations", !settings.animations);
    document.body.classList.toggle("no-space-effects", !settings.stars);
    document.body.classList.toggle("no-3d", !settings.effects3d);

    const map = {
      appearanceTheme: settings.theme,
      accentColor: settings.accent,
      interfaceDensity: settings.density,
      startPage: settings.startPage,
      defaultProjectCategory: settings.defaultProjectCategory,
      defaultProjectColor: settings.defaultProjectColor
    };

    Object.entries(map).forEach(([id, value]) => {
      const el = $(`#${id}`);
      if (el) el.value = value;
    });

    const toggles = {
      starsToggle: settings.stars,
      animationsToggle: settings.animations,
      effects3dToggle: settings.effects3d,
      soundToggle: settings.sound,
      confirmDeleteToggle: settings.confirmDelete,
      autosaveToggle: settings.autosave
    };

    Object.entries(toggles).forEach(([id, value]) => {
      const el = $(`#${id}`);
      if (el) el.checked = !!value;
    });

    if (!settings.stars) stopStars();
    else startStars();
  }

  function collectSettingsFromUI() {
    settings.theme = $("#appearanceTheme")?.value || settings.theme;
    settings.accent = $("#accentColor")?.value || settings.accent;
    settings.density = $("#interfaceDensity")?.value || settings.density;
    settings.stars = !!$("#starsToggle")?.checked;
    settings.animations = !!$("#animationsToggle")?.checked;
    settings.effects3d = !!$("#effects3dToggle")?.checked;
    settings.sound = !!$("#soundToggle")?.checked;
    settings.startPage = $("#startPage")?.value || "overview";
    settings.confirmDelete = !!$("#confirmDeleteToggle")?.checked;
    settings.autosave = !!$("#autosaveToggle")?.checked;
    settings.defaultProjectCategory =
      $("#defaultProjectCategory")?.value || "Personal";
    settings.defaultProjectColor = $("#defaultProjectColor")?.value || "purple";
  }

  function saveSettings() {
    collectSettingsFromUI();
    write(STORAGE.settings, settings);
    applySettings();
    const status = $("#settingsSaveStatus");
    if (status) status.textContent = "Settings saved on this device.";
    showToast("Settings saved.");
  }

  /* -------------------- STARFIELD -------------------- */

  let starRAF = null;
  let stars = [];

  function startStars() {
    const canvas = $("#starCanvas");
    if (!canvas || !settings.stars) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: Math.min(140, Math.floor(canvas.width / 12)) }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.2,
        a: Math.random() * 0.7 + 0.2,
        s: Math.random() * 0.25 + 0.05
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      if (!settings.stars) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((star) => {
        star.y += star.s;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210, 220, 255, ${star.a})`;
        ctx.fill();
      });
      starRAF = requestAnimationFrame(draw);
    };

    cancelAnimationFrame(starRAF);
    draw();
  }

  function stopStars() {
    cancelAnimationFrame(starRAF);
    const canvas = $("#starCanvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /* -------------------- CLOCK & QUOTE -------------------- */

  function updateClock() {
    const el = $("#localClock span");
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function setRandomQuote() {
    const el = $("#dailyQuote");
    if (!el) return;
    el.textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }

  /* -------------------- TOOLS -------------------- */

  const TOOLS = [
    {
      id: "uppercase",
      name: "UPPERCASE",
      category: "text",
      icon: "fa-font",
      description: "Convert text to uppercase.",
      fields: [{ id: "input", type: "textarea", label: "Text", placeholder: "Type or paste text..." }]
    },
    {
      id: "lowercase",
      name: "lowercase",
      category: "text",
      icon: "fa-font",
      description: "Convert text to lowercase.",
      fields: [{ id: "input", type: "textarea", label: "Text", placeholder: "Type or paste text..." }]
    },
    {
      id: "reverse",
      name: "Reverse Text",
      category: "text",
      icon: "fa-left-right",
      description: "Reverse the characters in your text.",
      fields: [{ id: "input", type: "textarea", label: "Text", placeholder: "Type or paste text..." }]
    },
    {
      id: "wordcount",
      name: "Word & Character Counter",
      category: "text",
      icon: "fa-hashtag",
      description: "Count words, characters, and lines.",
      fields: [{ id: "input", type: "textarea", label: "Text", placeholder: "Paste content to analyze..." }]
    },
    {
      id: "slug",
      name: "Slug Generator",
      category: "text",
      icon: "fa-link",
      description: "Create a URL-friendly slug.",
      fields: [{ id: "input", type: "text", label: "Title", placeholder: "My Awesome Page Title" }]
    },
    {
      id: "json",
      name: "JSON Formatter",
      category: "developer",
      icon: "fa-braces",
      description: "Format and validate JSON.",
      fields: [{ id: "input", type: "textarea", label: "JSON", placeholder: '{"hello":"world"}' }]
    },
    {
      id: "base64encode",
      name: "Base64 Encode",
      category: "developer",
      icon: "fa-lock",
      description: "Encode text to Base64.",
      fields: [{ id: "input", type: "textarea", label: "Text", placeholder: "Text to encode..." }]
    },
    {
      id: "base64decode",
      name: "Base64 Decode",
      category: "developer",
      icon: "fa-lock-open",
      description: "Decode Base64 to text.",
      fields: [{ id: "input", type: "textarea", label: "Base64", placeholder: "Base64 string..." }]
    },
    {
      id: "urlencode",
      name: "URL Encode",
      category: "developer",
      icon: "fa-globe",
      description: "Percent-encode a string for URLs.",
      fields: [{ id: "input", type: "textarea", label: "Text", placeholder: "Hello World!" }]
    },
    {
      id: "urldecode",
      name: "URL Decode",
      category: "developer",
      icon: "fa-globe",
      description: "Decode a percent-encoded string.",
      fields: [{ id: "input", type: "textarea", label: "Encoded text", placeholder: "Hello%20World%21" }]
    },
    {
      id: "password",
      name: "Password Generator",
      category: "productivity",
      icon: "fa-key",
      description: "Generate a strong random password.",
      fields: [
        { id: "length", type: "number", label: "Length", value: "16", min: "8", max: "64" },
        {
          id: "charset",
          type: "select",
          label: "Character set",
          options: [
            { value: "all", label: "Letters + Numbers + Symbols" },
            { value: "alnum", label: "Letters + Numbers" },
            { value: "alpha", label: "Letters only" }
          ]
        }
      ]
    },
    {
      id: "color",
      name: "Color Converter",
      category: "design",
      icon: "fa-palette",
      description: "Convert HEX ↔ RGB.",
      fields: [
        { id: "hex", type: "text", label: "HEX", placeholder: "#36e5ff" },
        { id: "rgb", type: "text", label: "RGB", placeholder: "54, 229, 255" }
      ]
    },
    {
      id: "lorem",
      name: "Lorem Ipsum",
      category: "text",
      icon: "fa-paragraph",
      description: "Generate placeholder paragraphs.",
      fields: [{ id: "count", type: "number", label: "Paragraphs", value: "2", min: "1", max: "10" }]
    },
    {
      id: "compare",
      name: "Text Compare",
      category: "text",
      icon: "fa-code-compare",
      description: "Check if two texts are identical.",
      fields: [
        { id: "a", type: "textarea", label: "Text A", placeholder: "First text..." },
        { id: "b", type: "textarea", label: "Text B", placeholder: "Second text..." }
      ]
    },
    {
      id: "hash",
      name: "Simple Hash (SHA-256)",
      category: "developer",
      icon: "fa-fingerprint",
      description: "Compute SHA-256 hash of text (Web Crypto).",
      fields: [{ id: "input", type: "textarea", label: "Text", placeholder: "Text to hash..." }]
    },
    {
      id: "calculator",
      name: "Quick Calculator",
      category: "calculator",
      icon: "fa-calculator",
      description: "Evaluate a basic math expression.",
      fields: [{ id: "expr", type: "text", label: "Expression", placeholder: "12 * (3 + 4) / 2" }]
    }
  ];

  let activeToolId = null;

  function renderTools() {
    const grid = $("#toolsGrid");
    if (!grid) return;

    const query = ($("#toolSearch")?.value || "").toLowerCase().trim();
    const category = $("#toolCategory")?.value || "all";

    const filtered = TOOLS.filter((tool) => {
      const matchCat = category === "all" || tool.category === category;
      const matchQuery =
        !query ||
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });

    if (!filtered.length) {
      grid.innerHTML = `<p class="empty-state">No tools match your search.</p>`;
      return;
    }

    grid.innerHTML = filtered
      .map(
        (tool) => `
      <article class="tool-card" data-tool-id="${tool.id}" data-category="${tool.category}">
        <div class="tool-icon"><i class="fa-solid ${tool.icon}"></i></div>
        <h3>${escapeHTML(tool.name)}</h3>
        <p>${escapeHTML(tool.description)}</p>
        <button type="button" class="card-action" data-action="open-tool" data-id="${tool.id}">
          Open Tool <i class="fa-solid fa-arrow-right"></i>
        </button>
      </article>`
      )
      .join("");
  }

  function openTool(id) {
    const tool = TOOLS.find((t) => t.id === id);
    if (!tool) return;

    activeToolId = id;
    const workspace = $("#toolWorkspace");
    if (!workspace) return;

    workspace.classList.remove("hidden");
    workspace.dataset.tool = id;
    $("#workspaceTitle").textContent = tool.name;
    $("#workspaceDescription").textContent = tool.description;

    const fields = $("#toolFields");
    fields.innerHTML = tool.fields
      .map((field) => {
        if (field.type === "textarea") {
          return `<label>${escapeHTML(field.label)}<textarea id="tool-field-${field.id}" rows="5" placeholder="${escapeHTML(field.placeholder || "")}"></textarea></label>`;
        }
        if (field.type === "select") {
          const options = (field.options || [])
            .map((o) => `<option value="${escapeHTML(o.value)}">${escapeHTML(o.label)}</option>`)
            .join("");
          return `<label>${escapeHTML(field.label)}<select id="tool-field-${field.id}">${options}</select></label>`;
        }
        return `<label>${escapeHTML(field.label)}<input id="tool-field-${field.id}" type="${field.type || "text"}" value="${escapeHTML(field.value || "")}" placeholder="${escapeHTML(field.placeholder || "")}" ${field.min ? `min="${field.min}"` : ""} ${field.max ? `max="${field.max}"` : ""}></label>`;
      })
      .join("");

    $("#toolOutput").textContent = "Your result will appear here.";
    $("#toolResultStatus").textContent = "Ready";
    workspace.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeToolWorkspace() {
    $("#toolWorkspace")?.classList.add("hidden");
    activeToolId = null;
  }

  function getToolField(id) {
    return $(`#tool-field-${id}`)?.value ?? "";
  }

  async function runActiveTool() {
    if (!activeToolId) {
      showToast("Select a tool first.", "error");
      return;
    }

    const output = $("#toolOutput");
    const status = $("#toolResultStatus");
    if (!output) return;

    status.textContent = "Running...";
    let result = "";

    try {
      switch (activeToolId) {
        case "uppercase":
          result = getToolField("input").toUpperCase();
          break;
        case "lowercase":
          result = getToolField("input").toLowerCase();
          break;
        case "reverse":
          result = [...getToolField("input")].reverse().join("");
          break;
        case "wordcount": {
          const text = getToolField("input");
          const words = text.trim() ? text.trim().split(/\s+/).length : 0;
          const chars = text.length;
          const lines = text ? text.split(/\n/).length : 0;
          result = `Words: ${words}\nCharacters: ${chars}\nLines: ${lines}`;
          break;
        }
        case "slug":
          result = getToolField("input")
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
          break;
        case "json":
          try {
            result = JSON.stringify(JSON.parse(getToolField("input")), null, 2);
          } catch {
            result = "Invalid JSON. Please check your input.";
          }
          break;
        case "base64encode":
          result = btoa(unescape(encodeURIComponent(getToolField("input"))));
          break;
        case "base64decode":
          try {
            result = decodeURIComponent(escape(atob(getToolField("input"))));
          } catch {
            result = "Invalid Base64 input.";
          }
          break;
        case "urlencode":
          result = encodeURIComponent(getToolField("input"));
          break;
        case "urldecode":
          try {
            result = decodeURIComponent(getToolField("input"));
          } catch {
            result = "Invalid URL-encoded text.";
          }
          break;
        case "password": {
          const length = Math.min(64, Math.max(8, Number(getToolField("length")) || 16));
          const mode = getToolField("charset") || "all";
          const sets = {
            all: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+",
            alnum: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
            alpha: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
          };
          const chars = sets[mode] || sets.all;
          const arr = new Uint32Array(length);
          crypto.getRandomValues(arr);
          result = Array.from(arr, (n) => chars[n % chars.length]).join("");
          break;
        }
        case "color": {
          const hex = getToolField("hex").trim().replace(/^#/, "");
          const rgb = getToolField("rgb").trim();
          if (hex && /^[0-9a-fA-F]{6}$/.test(hex)) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            result = `HEX: #${hex.toUpperCase()}\nRGB: ${r}, ${g}, ${b}\nCSS: rgb(${r}, ${g}, ${b})`;
          } else if (rgb) {
            const parts = rgb.split(/[,\s]+/).map(Number);
            if (parts.length === 3 && parts.every((n) => n >= 0 && n <= 255)) {
              const toHex = (n) => n.toString(16).padStart(2, "0");
              result = `RGB: ${parts.join(", ")}\nHEX: #${toHex(parts[0])}${toHex(parts[1])}${toHex(parts[2])}`.toUpperCase();
            } else {
              result = "Enter a valid HEX (#RRGGBB) or RGB (r, g, b).";
            }
          } else {
            result = "Enter a HEX or RGB value.";
          }
          break;
        }
        case "lorem": {
          const count = Math.min(10, Math.max(1, Number(getToolField("count")) || 2));
          const paragraph =
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
          result = Array.from({ length: count }, () => paragraph).join("\n\n");
          break;
        }
        case "compare": {
          const a = getToolField("a");
          const b = getToolField("b");
          if (a === b) result = "The two texts are identical.";
          else {
            result = `Texts differ.\nLength A: ${a.length}\nLength B: ${b.length}`;
          }
          break;
        }
        case "hash": {
          const text = getToolField("input");
          if (!window.crypto?.subtle) {
            result = "Web Crypto API is not available in this browser.";
            break;
          }
          const data = new TextEncoder().encode(text);
          const buffer = await crypto.subtle.digest("SHA-256", data);
          result = [...new Uint8Array(buffer)]
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          break;
        }
        case "calculator": {
          const expr = getToolField("expr").trim();
          if (!/^[\d\s+\-*/().%]+$/.test(expr)) {
            result = "Only numbers and + - * / ( ) % are allowed.";
            break;
          }
          try {
            // eslint-disable-next-line no-new-func
            const value = Function(`"use strict"; return (${expr})`)();
            result = String(value);
          } catch {
            result = "Could not evaluate expression.";
          }
          break;
        }
        default:
          result = "This tool is not implemented yet.";
      }
    } catch (error) {
      console.error(error);
      result = "Something went wrong while running this tool.";
    }

    output.textContent = result;
    status.textContent = "Done";
    recordEvent("tool:" + activeToolId, `Used tool: ${activeToolId}`);
  }

  function clearToolWorkspace() {
    $$("#toolFields input, #toolFields textarea, #toolFields select").forEach((el) => {
      if (el.tagName === "SELECT") el.selectedIndex = 0;
      else el.value = el.defaultValue || "";
    });
    $("#toolOutput").textContent = "Your result will appear here.";
    $("#toolResultStatus").textContent = "Ready";
  }

  function copyToolOutput() {
    const text = $("#toolOutput")?.textContent || "";
    navigator.clipboard
      ?.writeText(text)
      .then(() => showToast("Result copied."))
      .catch(() => showToast("Could not copy.", "error"));
  }

  /* -------------------- PROJECTS -------------------- */

  let projectsData = read(STORAGE.projects, []);

  function saveProjects() {
    write(STORAGE.projects, projectsData);
    renderProjects();
    updateAnalyticsUI();
  }

  function renderProjects() {
    const grid = $("#projectsGrid");
    if (!grid) return;

    const query = ($("#projectSearch")?.value || "").toLowerCase().trim();
    const sort = $("#projectSort")?.value || "newest";

    let list = [...projectsData];
    if (query) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description || "").toLowerCase().includes(query) ||
          (p.category || "").toLowerCase().includes(query)
      );
    }

    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (!list.length) {
      grid.innerHTML = `<p class="empty-state">No projects yet. Create your first project!</p>`;
      return;
    }

    grid.innerHTML = list
      .map(
        (project) => {
          const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));
          return `
      <article class="project-card" data-color="${escapeHTML(project.color || "purple")}">
        <div class="project-card-top">
          <span class="project-category">${escapeHTML(project.category || "Personal")}</span>
          <span class="project-status">${escapeHTML(project.status || "Active")}</span>
        </div>
        <h3>${escapeHTML(project.name)}</h3>
        <p>${escapeHTML(project.description || "No description added.")}</p>
        <div class="project-meta-row">
          <span class="tag">Priority: ${escapeHTML(project.priority || "Medium")}</span>
          <span class="tag">${progress}%</span>
        </div>
        <div class="project-progress-bar"><span style="width:${progress}%"></span></div>
        <small>${escapeHTML(formatDate(project.updatedAt || project.createdAt))}</small>
        <div class="project-actions">
          <button type="button" class="secondary-btn" data-action="edit-project" data-id="${escapeHTML(project.id)}">Edit</button>
          <button type="button" class="danger-btn" data-action="delete-project" data-id="${escapeHTML(project.id)}">Delete</button>
        </div>
      </article>`;
        }
      )
      .join("");
  }

  function openProjectModal(project = null) {
    const modal = $("#projectModal");
    if (!modal) return;

    $("#projectModalTitle").textContent = project ? "Edit Project" : "New Project";
    $("#projectId").value = project?.id || "";
    $("#projectName").value = project?.name || "";
    $("#projectCategory").value =
      project?.category || settings.defaultProjectCategory || "Personal";
    $("#projectDescription").value = project?.description || "";
    $("#projectColor").value = project?.color || settings.defaultProjectColor || "purple";
    if ($("#projectStatus")) $("#projectStatus").value = project?.status || "Active";
    if ($("#projectPriority")) $("#projectPriority").value = project?.priority || "Medium";
    if ($("#projectProgress")) $("#projectProgress").value = project?.progress ?? 0;
    modal.classList.remove("hidden");
    $("#projectName")?.focus();
  }

  function closeProjectModal() {
    $("#projectModal")?.classList.add("hidden");
    $("#projectForm")?.reset();
    $("#projectId").value = "";
  }

  function handleProjectSubmit(event) {
    event.preventDefault();
    const id = $("#projectId")?.value;
    const name = ($("#projectName")?.value || "").trim();
    if (!name) {
      showToast("Please enter a project name.", "error");
      return;
    }

    const payload = {
      name,
      category: $("#projectCategory")?.value || "Personal",
      description: ($("#projectDescription")?.value || "").trim(),
      color: $("#projectColor")?.value || "purple",
      status: $("#projectStatus")?.value || "Active",
      priority: $("#projectPriority")?.value || "Medium",
      progress: Math.min(100, Math.max(0, Number($("#projectProgress")?.value) || 0)),
      updatedAt: new Date().toISOString()
    };

    if (id) {
      const index = projectsData.findIndex((p) => p.id === id);
      if (index >= 0) {
        projectsData[index] = { ...projectsData[index], ...payload };
        showToast("Project updated.");
        pushActivity(`Updated project: ${name}`);
      }
    } else {
      projectsData.unshift({
        id: makeId(),
        createdAt: new Date().toISOString(),
        ...payload
      });
      showToast("Project created.");
      recordEvent("project-created", `Created project: ${name}`);
    }

    saveProjects();
    closeProjectModal();
  }

  async function deleteProject(id) {
    const project = projectsData.find((p) => p.id === id);
    if (!project) return;

    const ok = settings.confirmDelete
      ? await confirmAction("Delete project?", `Delete "${project.name}"? This cannot be undone.`)
      : true;
    if (!ok) return;

    projectsData = projectsData.filter((p) => p.id !== id);
    saveProjects();
    showToast("Project deleted.");
    pushActivity(`Deleted project: ${project.name}`);
  }

  /* -------------------- AI CHAT -------------------- */

  let chatHistory = [];

  function clearChatUI(keepWelcome = true) {
    const container = $("#chatMessages");
    if (!container) return;
    chatHistory = [];
    if (keepWelcome) {
      container.innerHTML = `
        <div class="chat-welcome">
          <div class="chat-welcome-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
          <h2>What shall we create today?</h2>
          <p>Start with a question or choose an idea below.</p>
          <div class="prompt-suggestions">
            <button class="prompt-chip" data-prompt="Help me plan a creative website."><i class="fa-solid fa-globe"></i> Plan a website</button>
            <button class="prompt-chip" data-prompt="Explain artificial intelligence in simple words."><i class="fa-solid fa-brain"></i> Explain AI</button>
            <button class="prompt-chip" data-prompt="Give me five creative business ideas."><i class="fa-solid fa-lightbulb"></i> Business ideas</button>
            <button class="prompt-chip" data-prompt="Help me write JavaScript code."><i class="fa-solid fa-code"></i> Write code</button>
          </div>
        </div>`;
    } else {
      container.innerHTML = "";
    }
  }

  function appendChatMessage(role, text) {
    const container = $("#chatMessages");
    if (!container) return;

    const welcome = container.querySelector(".chat-welcome");
    if (welcome) welcome.remove();

    const row = document.createElement("div");
    row.className = `chat-message ${role}`;
    row.innerHTML = `
      <div class="chat-message-content">${escapeHTML(text)}</div>
      <button type="button" class="icon-button chat-copy" data-action="copy-chat" aria-label="Copy message">
        <i class="fa-regular fa-copy"></i>
      </button>`;
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
    chatHistory.push({ role, text });
  }

  function showTyping() {
    const container = $("#chatMessages");
    if (!container) return null;
    const el = document.createElement("div");
    el.className = "chat-message assistant typing";
    el.innerHTML = `<div class="chat-message-content">Thinking<span class="typing-dots">...</span></div>`;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
  }

  function getLocalAIResponse(message, mode = "general") {
    const text = message.toLowerCase();

    if (/hello|hi|hey|salam|assalam/.test(text)) {
      return "Hello! Welcome to Wazir Aura. I am the local demo assistant. How can I help you explore this workspace today?";
    }
    if (text.includes("html")) {
      return "HTML structures web pages with elements like headings, paragraphs, links, and forms. Try the Code Lab to practice live HTML, CSS, and JavaScript together.";
    }
    if (text.includes("css")) {
      return "CSS controls layout, color, typography, and motion. Useful ideas: Flexbox/Grid for layout, custom properties for themes, and media queries for responsiveness.";
    }
    if (text.includes("javascript") || /\bjs\b/.test(text)) {
      return "JavaScript adds interactivity. You can practice safely in the Code Lab — it runs inside a sandboxed iframe so experiments stay isolated from the main site.";
    }
    if (text.includes("game")) {
      return "Open Game Galaxy for lightweight browser games such as Number Guess, Memory Match, Reaction Test, Rock Paper Scissors, and Quick Math.";
    }
    if (text.includes("project")) {
      return "Use My Projects to create, edit, search, and export your local project list. Everything is stored in this browser until you connect a backend.";
    }
    if (text.includes("plan a website") || text.includes("creative website")) {
      return "Start with a clear goal, audience, and primary action. Sketch sections (hero, features, proof, CTA), choose a simple visual system, then build a minimal first version in Code Lab before expanding.";
    }
    if (text.includes("business idea")) {
      return "Five starter ideas: 1) niche browser tools for creators, 2) local-first note systems with export, 3) educational mini-games, 4) portfolio generators, 5) prompt libraries for specific professions. Validate demand before building heavily.";
    }
    if (text.includes("artificial intelligence") || text.includes("explain ai")) {
      return "Artificial intelligence is a set of techniques that let software recognize patterns, make predictions, or generate content from data. Modern assistants use large models trained on text; this demo does not call a live model yet.";
    }
    if (mode === "coding") {
      return "For coding help, describe the language, the goal, and any error messages. Meanwhile you can prototype directly in the Wazir Aura Code Lab.";
    }
    if (mode === "creative") {
      return "Creative mode tip: define the emotion, audience, and constraint first (time, length, platform). Then generate options and refine the strongest one.";
    }
    if (mode === "learning") {
      return "Learning tip: break the topic into concepts, examples, and a small practice task. Try explaining it in your own words in the Notepad.";
    }
    return "Thanks for your message. This is the local demo assistant for Wazir Aura. Connect a secure backend API to enable real AI responses. Until then I can help with guidance about this workspace, web basics, and creative planning.";
  }

  function handleChatSubmit(event) {
    event.preventDefault();
    const input = $("#chatInput");
    if (!input) return;
    const message = input.value.trim();
    if (!message) return;

    appendChatMessage("user", message);
    input.value = "";
    input.style.height = "auto";

    const mode = $(".ai-mode.active")?.dataset.aiMode || "general";
    const typing = showTyping();

    setTimeout(() => {
      typing?.remove();
      appendChatMessage("assistant", getLocalAIResponse(message, mode));
      recordEvent("ai-chat", "Sent AI chat message");
    }, 450);
  }

  /* -------------------- CODE LAB -------------------- */

  function getEditorCode() {
    return {
      html: $("#htmlCode")?.value || "",
      css: $("#cssCode")?.value || "",
      js: $("#jsCode")?.value || ""
    };
  }

  function saveEditorCode() {
    write(STORAGE.editor, getEditorCode());
  }

  function loadEditorCode() {
    const saved = read(STORAGE.editor, null);
    if (!saved) return;
    if ($("#htmlCode") && saved.html != null) $("#htmlCode").value = saved.html;
    if ($("#cssCode") && saved.css != null) $("#cssCode").value = saved.css;
    if ($("#jsCode") && saved.js != null) $("#jsCode").value = saved.js;
  }

  function runCode() {
    const preview = $("#codePreview");
    if (!preview) {
      showToast("Code preview area was not found.", "error");
      return;
    }

    const { html, css, js } = getEditorCode();
    const source = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css}</style>
</head>
<body>
${html}
<script>
window.addEventListener("error", function(event) {
  document.body.insertAdjacentHTML("beforeend",
    '<pre style="color:#ff8b9f;background:#111;padding:10px;border-radius:8px;">' +
    String(event.message).replace(/[<>&]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[s])) +
    '</pre>');
});
try {
${js}
} catch (error) {
  document.body.insertAdjacentHTML("beforeend",
    '<pre style="color:#ff8b9f;background:#111;padding:10px;border-radius:8px;">' +
    String(error.message).replace(/[<>&]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[s])) +
    '</pre>');
}
<\/script>
</body>
</html>`;

    preview.setAttribute("sandbox", "allow-scripts");
    preview.srcdoc = source;
    saveEditorCode();
    recordEvent("code-run", "Ran Code Lab project");
    showToast("Code executed in sandbox.");
  }

  async function resetCode() {
    const ok = await confirmAction("Reset editor?", "Restore the default starter HTML, CSS, and JavaScript?");
    if (!ok) return;
    if ($("#htmlCode")) $("#htmlCode").value = DEFAULT_HTML;
    if ($("#cssCode")) $("#cssCode").value = DEFAULT_CSS;
    if ($("#jsCode")) $("#jsCode").value = DEFAULT_JS;
    if ($("#codeProjectName")) $("#codeProjectName").value = "My Creative Website";
    saveEditorCode();
    runCode();
    showToast("Editor reset.");
  }

  function downloadCode() {
    const code = getEditorCode();
    const name = ($("#codeProjectName")?.value || "wazir-aura-project").trim() || "wazir-aura-project";
    const content = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHTML(name)}</title>
<style>
${code.css}
</style>
</head>
<body>
${code.html}
<script>
${code.js}
<\/script>
</body>
</html>`;

    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/[^\w\-]+/g, "-").toLowerCase()}.html`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("HTML file downloaded.");
    pushActivity("Downloaded Code Lab project");
  }

  /* -------------------- NOTEPAD -------------------- */

  let notesData = read(STORAGE.notes, []);
  let activeNoteId = null;
  let noteSaveTimer = null;

  function renderNotesList(filter = "") {
    const list = $("#notesList");
    if (!list) return;

    const q = filter.toLowerCase().trim();
    const filtered = notesData.filter(
      (n) =>
        !q ||
        (n.title || "").toLowerCase().includes(q) ||
        (n.content || "").toLowerCase().includes(q)
    );

    if (!filtered.length) {
      list.innerHTML = `<p class="empty-state">No notes yet.</p>`;
      return;
    }

    list.innerHTML = filtered
      .map(
        (note) => `
      <button type="button" class="note-item ${note.id === activeNoteId ? "active" : ""}" data-action="open-note" data-id="${escapeHTML(note.id)}">
        <strong>${escapeHTML(note.title || "Untitled")}</strong>
        <small>${escapeHTML(formatDate(note.updatedAt || note.createdAt))}</small>
      </button>`
      )
      .join("");
  }

  function updateNoteMeta() {
    const content = $("#noteContent")?.value || "";
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const wc = $("#noteWordCount");
    if (wc) wc.textContent = `${words} word${words === 1 ? "" : "s"}`;
  }

  function openNote(id) {
    const note = notesData.find((n) => n.id === id);
    if (!note) return;
    activeNoteId = id;
    $("#noteTitle").value = note.title || "";
    $("#noteContent").value = note.content || "";
    $("#noteSaveStatus").textContent = "Loaded from this device";
    updateNoteMeta();
    renderNotesList($("#notesSearch")?.value || "");
  }

  function createNote() {
    const note = {
      id: makeId(),
      title: "Untitled note",
      content: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    notesData.unshift(note);
    write(STORAGE.notes, notesData);
    activeNoteId = note.id;
    openNote(note.id);
    showToast("New note created.");
    pushActivity("Created a note");
  }

  function persistActiveNote(silent = false) {
    if (!activeNoteId) return;
    const note = notesData.find((n) => n.id === activeNoteId);
    if (!note) return;

    note.title = ($("#noteTitle")?.value || "Untitled note").trim() || "Untitled note";
    note.content = $("#noteContent")?.value || "";
    note.updatedAt = new Date().toISOString();
    write(STORAGE.notes, notesData);
    renderNotesList($("#notesSearch")?.value || "");
    updateNoteMeta();
    const status = $("#noteSaveStatus");
    if (status) status.textContent = silent ? "All changes saved locally" : "Saved just now";
  }

  function scheduleNoteSave() {
    if (!settings.autosave) return;
    clearTimeout(noteSaveTimer);
    const status = $("#noteSaveStatus");
    if (status) status.textContent = "Saving...";
    noteSaveTimer = setTimeout(() => persistActiveNote(true), 400);
  }

  async function deleteActiveNote() {
    if (!activeNoteId) {
      showToast("No note selected.", "error");
      return;
    }
    const note = notesData.find((n) => n.id === activeNoteId);
    const ok = settings.confirmDelete
      ? await confirmAction("Delete note?", `Delete "${note?.title || "this note"}"?`)
      : true;
    if (!ok) return;

    notesData = notesData.filter((n) => n.id !== activeNoteId);
    write(STORAGE.notes, notesData);
    activeNoteId = notesData[0]?.id || null;
    if (activeNoteId) openNote(activeNoteId);
    else {
      $("#noteTitle").value = "";
      $("#noteContent").value = "";
      renderNotesList();
      updateNoteMeta();
    }
    showToast("Note deleted.");
    pushActivity("Deleted a note");
  }

  function downloadActiveNote() {
    if (!activeNoteId) {
      showToast("No note selected.", "error");
      return;
    }
    const note = notesData.find((n) => n.id === activeNoteId);
    if (!note) return;
    const content = `# ${note.title}\n\n${note.content}\n`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(note.title || "note").replace(/[^\w\-]+/g, "-").toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Note downloaded.");
  }

  /* -------------------- GAMES -------------------- */

  const GAMES = [
    {
      id: "guess",
      name: "Number Guess",
      category: "puzzle",
      description: "Guess the secret number between 1 and 100.",
      icon: "fa-question"
    },
    {
      id: "reaction",
      name: "Reaction Test",
      category: "arcade",
      description: "Measure how quickly you can react.",
      icon: "fa-bolt"
    },
    {
      id: "memory",
      name: "Memory Match",
      category: "puzzle",
      description: "Find all matching emoji pairs.",
      icon: "fa-brain"
    },
    {
      id: "rps",
      name: "Rock Paper Scissors",
      category: "classic",
      description: "Play against the computer.",
      icon: "fa-hand-fist"
    },
    {
      id: "math",
      name: "Quick Math",
      category: "arcade",
      description: "Solve simple arithmetic quickly.",
      icon: "fa-plus"
    },
    {
      id: "tictactoe",
      name: "Tic Tac Toe",
      category: "classic",
      description: "Classic 3×3 strategy duel vs computer.",
      icon: "fa-table-cells"
    },
    {
      id: "snake",
      name: "Cosmic Snake",
      category: "arcade",
      description: "Classic snake — eat stars, avoid walls and yourself.",
      icon: "fa-dragon"
    },
    {
      id: "word",
      name: "Word Scramble",
      category: "puzzle",
      description: "Unscramble the hidden word.",
      icon: "fa-spell-check"
    }
  ];

  let activeGame = null;
  let secretNumber = 0;
  let reactionTimer = null;
  let reactionStarted = 0;
  let mathAnswer = 0;
  let memoryCards = [];
  let memoryOpen = [];
  let tttBoard = Array(9).fill(null);
  let tttOver = false;
  let snakeState = null;
  let snakeTimer = null;
  let scrambleWord = "";
  let scrambleAnswer = "";

  function renderGames(filter = "all") {
    const grid = $("#gamesGrid");
    if (!grid) return;
    const list =
      filter === "all" ? GAMES : GAMES.filter((g) => g.category === filter);

    grid.innerHTML = list
      .map(
        (game) => `
      <article class="game-card">
        <div class="game-art"><i class="fa-solid ${game.icon}"></i></div>
        <h3>${escapeHTML(game.name)}</h3>
        <p>${escapeHTML(game.description)}</p>
        <button type="button" class="primary-btn" data-action="open-game" data-id="${game.id}">Play</button>
      </article>`
      )
      .join("");
  }

  function openGame(id) {
    const game = GAMES.find((g) => g.id === id);
    if (!game) return;
    activeGame = id;

    const modal = $("#gameModal");
    const body = $("#gameModalBody");
    if (!modal || !body) return;

    $("#gameModalTitle").textContent = game.name;
    body.innerHTML = buildGameMarkup(id);
    modal.classList.remove("hidden");

    if (id === "guess") secretNumber = Math.floor(Math.random() * 100) + 1;
    if (id === "math") createMathQuestion();
    if (id === "memory") createMemoryGame();
    if (id === "tictactoe") resetTtt();
    if (id === "snake") startSnake();
    if (id === "word") setupScramble();

    gamesPlayedCount += 1;
    write(STORAGE.gamesPlayed, gamesPlayedCount);
    recordEvent("game:" + id, `Played game: ${game.name}`);
    updateAnalyticsUI();
  }

  function buildGameMarkup(id) {
    switch (id) {
      case "guess":
        return `
          <p>Guess a number between 1 and 100.</p>
          <div class="game-controls">
            <input id="guessInput" type="number" min="1" max="100" placeholder="Your guess">
            <button class="primary-btn" data-action="check-guess">Check</button>
            <button class="secondary-btn" data-action="restart-guess">New Number</button>
          </div>
          <p id="guessResult">Good luck!</p>`;
      case "reaction":
        return `
          <p>Press Start, wait for the green signal, then click as fast as you can.</p>
          <div class="game-controls">
            <button class="primary-btn" data-action="start-reaction">Start</button>
            <button class="secondary-btn" data-action="reaction-click" disabled>CLICK!</button>
          </div>
          <p id="reactionResult">Your result will appear here.</p>`;
      case "memory":
        return `
          <div id="memoryBoard" class="memory-board"></div>
          <p id="memoryResult">Find all matching pairs.</p>
          <button class="secondary-btn" data-action="restart-memory">Restart</button>`;
      case "rps":
        return `
          <div class="game-controls">
            <button class="primary-btn" data-action="rps" data-choice="rock">✊ Rock</button>
            <button class="primary-btn" data-action="rps" data-choice="paper">✋ Paper</button>
            <button class="primary-btn" data-action="rps" data-choice="scissors">✌️ Scissors</button>
          </div>
          <p id="rpsResult">Choose your move.</p>`;
      case "math":
        return `
          <h3 id="mathQuestion"></h3>
          <div class="game-controls">
            <input id="mathAnswer" type="number" placeholder="Your answer">
            <button class="primary-btn" data-action="check-math">Submit</button>
            <button class="secondary-btn" data-action="next-math">Next</button>
          </div>
          <p id="mathResult"></p>`;
      case "tictactoe":
        return `
          <div id="tttBoard" class="ttt-board"></div>
          <p id="tttResult">You are X. Computer is O.</p>
          <button class="secondary-btn" data-action="restart-ttt">Restart</button>`;
      case "snake":
        return `
          <div class="snake-wrap">
            <p>Use arrow keys or on-screen buttons. Eat gold food. Don't hit walls or yourself.</p>
            <div id="snakeBoard" class="snake-board"></div>
            <p id="snakeScore">Score: 0</p>
            <div class="game-controls">
              <button type="button" class="secondary-btn" data-action="snake-dir" data-dir="up">↑</button>
              <button type="button" class="secondary-btn" data-action="snake-dir" data-dir="left">←</button>
              <button type="button" class="secondary-btn" data-action="snake-dir" data-dir="down">↓</button>
              <button type="button" class="secondary-btn" data-action="snake-dir" data-dir="right">→</button>
              <button type="button" class="primary-btn" data-action="restart-snake">Restart</button>
            </div>
            <p id="snakeResult">Good luck!</p>
          </div>`;
      case "word":
        return `
          <p>Unscramble this word:</p>
          <h3 id="scrambleDisplay"></h3>
          <div class="game-controls">
            <input id="scrambleInput" type="text" placeholder="Your answer">
            <button class="primary-btn" data-action="check-scramble">Check</button>
            <button class="secondary-btn" data-action="restart-scramble">New Word</button>
          </div>
          <p id="scrambleResult"></p>`;
      default:
        return `<p>Game not available.</p>`;
    }
  }

  function closeGame() {
    $("#gameModal")?.classList.add("hidden");
    clearTimeout(reactionTimer);
    clearInterval(snakeTimer);
    activeGame = null;
  }

  function createMathQuestion() {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    const ops = ["+", "-", "×"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    mathAnswer = op === "+" ? a + b : op === "-" ? a - b : a * b;
    const q = $("#mathQuestion");
    if (q) q.textContent = `${a} ${op} ${b} = ?`;
    if ($("#mathAnswer")) $("#mathAnswer").value = "";
    if ($("#mathResult")) $("#mathResult").textContent = "";
  }

  function createMemoryGame() {
    const board = $("#memoryBoard");
    if (!board) return;
    const icons = ["🚀", "🌙", "⭐", "🪐", "🌎", "☄️"];
    memoryCards = [...icons, ...icons]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({ id: index, icon, matched: false }));
    memoryOpen = [];
    board.innerHTML = memoryCards
      .map(
        (card) =>
          `<button class="memory-card" data-action="memory-card" data-id="${card.id}">?</button>`
      )
      .join("");
    if ($("#memoryResult")) $("#memoryResult").textContent = "Find all matching pairs.";
  }

  function handleMemoryCard(id) {
    const card = memoryCards[id];
    if (!card || card.matched || memoryOpen.includes(id) || memoryOpen.length >= 2) return;
    const button = $(`[data-action="memory-card"][data-id="${id}"]`);
    if (!button) return;
    button.textContent = card.icon;
    memoryOpen.push(id);

    if (memoryOpen.length === 2) {
      const [first, second] = memoryOpen;
      if (memoryCards[first].icon === memoryCards[second].icon) {
        memoryCards[first].matched = true;
        memoryCards[second].matched = true;
        memoryOpen = [];
        if (memoryCards.every((item) => item.matched)) {
          const result = $("#memoryResult");
          if (result) result.textContent = "Congratulations! You matched every pair!";
        }
      } else {
        setTimeout(() => {
          memoryOpen.forEach((cardId) => {
            const item = $(`[data-action="memory-card"][data-id="${cardId}"]`);
            if (item) item.textContent = "?";
          });
          memoryOpen = [];
        }, 700);
      }
    }
  }

  function resetTtt() {
    tttBoard = Array(9).fill(null);
    tttOver = false;
    const board = $("#tttBoard");
    if (!board) return;
    board.innerHTML = tttBoard
      .map(
        (_, i) =>
          `<button class="ttt-cell" data-action="ttt-move" data-id="${i}"></button>`
      )
      .join("");
    if ($("#tttResult")) $("#tttResult").textContent = "You are X. Computer is O.";
  }

  function tttWinner(board) {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];
    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return board.every(Boolean) ? "draw" : null;
  }

  function tttComputerMove() {
    const empty = tttBoard.map((v, i) => (v ? null : i)).filter((v) => v !== null);
    if (!empty.length) return;
    // Prefer center, then corners, then sides
    const preference = [4, 0, 2, 6, 8, 1, 3, 5, 7].filter((i) => empty.includes(i));
    const choice = preference[0];
    tttBoard[choice] = "O";
    const cell = $(`[data-action="ttt-move"][data-id="${choice}"]`);
    if (cell) cell.textContent = "O";
  }

  function handleTttMove(index) {
    if (tttOver || tttBoard[index]) return;
    tttBoard[index] = "X";
    const cell = $(`[data-action="ttt-move"][data-id="${index}"]`);
    if (cell) cell.textContent = "X";

    let winner = tttWinner(tttBoard);
    if (winner) {
      tttOver = true;
      $("#tttResult").textContent =
        winner === "draw" ? "It's a draw!" : winner === "X" ? "You win!" : "Computer wins!";
      return;
    }

    tttComputerMove();
    winner = tttWinner(tttBoard);
    if (winner) {
      tttOver = true;
      $("#tttResult").textContent =
        winner === "draw" ? "It's a draw!" : winner === "X" ? "You win!" : "Computer wins!";
    }
  }

  const TYPING_SENTENCES = [
    "Creativity has no limits inside the Wazir Aura universe.",
    "Build something extraordinary with HTML CSS and JavaScript.",
    "Every great project starts with a single focused experiment.",
    "Explore tools games and ideas without leaving your browser."
  ];


  function startSnake() {
    const size = 16;
    clearInterval(snakeTimer);
    snakeState = {
      size,
      snake: [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: { x: 12, y: 10 },
      score: 0,
      over: false
    };
    placeSnakeFood();
    renderSnakeBoard();
    const score = $("#snakeScore");
    const result = $("#snakeResult");
    if (score) score.textContent = "Score: 0";
    if (result) result.textContent = "Use arrows to move.";
    snakeTimer = setInterval(tickSnake, 120);
  }

  function placeSnakeFood() {
    if (!snakeState) return;
    const { size, snake } = snakeState;
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) };
    } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
    snakeState.food = pos;
  }

  function renderSnakeBoard() {
    const board = $("#snakeBoard");
    if (!board || !snakeState) return;
    const { size, snake, food } = snakeState;
    const head = snake[0];
    let html = "";
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let cls = "snake-cell";
        if (food.x === x && food.y === y) cls += " food";
        const i = snake.findIndex((s) => s.x === x && s.y === y);
        if (i === 0) cls += " snake head";
        else if (i > 0) cls += " snake";
        html += `<div class="${cls}"></div>`;
      }
    }
    board.style.gridTemplateColumns = `repeat(${size}, 14px)`;
    board.innerHTML = html;
  }

  function tickSnake() {
    if (!snakeState || snakeState.over) return;
    snakeState.dir = snakeState.nextDir;
    const { snake, dir, size, food } = snakeState;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.y < 0 || head.x >= size || head.y >= size ||
        snake.some((s) => s.x === head.x && s.y === head.y)) {
      snakeState.over = true;
      clearInterval(snakeTimer);
      const result = $("#snakeResult");
      if (result) result.textContent = `Game over! Final score: ${snakeState.score}`;
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      snakeState.score += 1;
      const score = $("#snakeScore");
      if (score) score.textContent = `Score: ${snakeState.score}`;
      placeSnakeFood();
    } else {
      snake.pop();
    }
    renderSnakeBoard();
  }

  function setSnakeDir(name) {
    if (!snakeState || snakeState.over) return;
    const map = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };
    const nd = map[name];
    if (!nd) return;
    // prevent reverse
    if (nd.x + snakeState.dir.x === 0 && nd.y + snakeState.dir.y === 0) return;
    snakeState.nextDir = nd;
  }


  const SCRAMBLE_WORDS = [
    "galaxy",
    "nebula",
    "orbit",
    "rocket",
    "cosmos",
    "planet",
    "comet",
    "stellar",
    "quantum",
    "aurora"
  ];

  function setupScramble() {
    scrambleAnswer = SCRAMBLE_WORDS[Math.floor(Math.random() * SCRAMBLE_WORDS.length)];
    scrambleWord = [...scrambleAnswer].sort(() => Math.random() - 0.5).join("");
    if (scrambleWord === scrambleAnswer) {
      scrambleWord = [...scrambleAnswer].reverse().join("");
    }
    const display = $("#scrambleDisplay");
    if (display) display.textContent = scrambleWord.toUpperCase();
    if ($("#scrambleInput")) $("#scrambleInput").value = "";
    if ($("#scrambleResult")) $("#scrambleResult").textContent = "";
  }

  /* -------------------- REVIEWS -------------------- */

  let reviewsData = read(STORAGE.reviews, []);
  let selectedRating = 0;

  function renderReviews() {
    const list = $("#reviewsList");
    if (!list) return;

    if (!reviewsData.length) {
      list.innerHTML = `<p class="empty-state">No reviews yet. Be the first to leave feedback on this device.</p>`;
      $("#averageRating").textContent = "—";
      return;
    }

    const avg =
      reviewsData.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviewsData.length;
    $("#averageRating").textContent = avg.toFixed(1);

    list.innerHTML = reviewsData
      .map(
        (review) => `
      <article class="review-card">
        <div class="review-card-top">
          <h3>${escapeHTML(review.name)}</h3>
          <button type="button" class="icon-button" data-action="delete-review" data-id="${escapeHTML(review.id)}" aria-label="Delete review">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
        <div class="review-stars">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</div>
        <p>${escapeHTML(review.message)}</p>
        <small>${escapeHTML(review.date)}</small>
      </article>`
      )
      .join("");
  }

  function handleReviewSubmit(event) {
    event.preventDefault();
    const name = ($("#reviewName")?.value || "Guest").trim() || "Guest";
    const message = ($("#reviewText")?.value || "").trim();
    const rating = selectedRating || 5;

    if (!message) {
      showToast("Please write a review first.", "error");
      return;
    }

    reviewsData.unshift({
      id: makeId(),
      name,
      message,
      rating: Math.max(1, Math.min(5, rating)),
      date: new Date().toLocaleDateString()
    });

    write(STORAGE.reviews, reviewsData);
    renderReviews();
    $("#reviewForm")?.reset();
    selectedRating = 0;
    $$("#starRating button").forEach((btn) => btn.classList.remove("selected"));
    showToast("Review saved on this device.");
    pushActivity("Submitted a local review");
  }

  async function deleteReview(id) {
    const ok = settings.confirmDelete
      ? await confirmAction("Delete review?", "Remove this locally stored review?")
      : true;
    if (!ok) return;
    reviewsData = reviewsData.filter((r) => r.id !== id);
    write(STORAGE.reviews, reviewsData);
    renderReviews();
    showToast("Review deleted.");
  }

  /* -------------------- BACKUP -------------------- */

  function exportBackup() {
    const backup = {
      version: 2,
      createdAt: new Date().toISOString(),
      projects: projectsData,
      notes: notesData,
      analytics,
      reviews: reviewsData,
      settings,
      activity: activityLog,
      gamesPlayed: gamesPlayedCount,
      editor: read(STORAGE.editor, {})
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wazir-aura-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Backup downloaded.");
    pushActivity("Exported workspace backup");
  }

  async function importBackup(file) {
    if (!file) return;
    const ok = await confirmAction(
      "Import backup?",
      "This will replace projects, notes, reviews, settings, and related local data on this device."
    );
    if (!ok) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== "object") throw new Error("Invalid backup");

        projectsData = Array.isArray(data.projects) ? data.projects : [];
        notesData = Array.isArray(data.notes) ? data.notes : [];
        reviewsData = Array.isArray(data.reviews) ? data.reviews : [];
        analytics = data.analytics || analytics;
        settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
        activityLog = Array.isArray(data.activity) ? data.activity : activityLog;
        gamesPlayedCount = data.gamesPlayed || 0;

        write(STORAGE.projects, projectsData);
        write(STORAGE.notes, notesData);
        write(STORAGE.reviews, reviewsData);
        write(STORAGE.analytics, analytics);
        write(STORAGE.settings, settings);
        write(STORAGE.activity, activityLog);
        write(STORAGE.gamesPlayed, gamesPlayedCount);
        if (data.editor) write(STORAGE.editor, data.editor);

        applySettings();
        loadEditorCode();
        renderProjects();
        renderNotesList();
        renderReviews();
        renderRecentActivity();
        updateAnalyticsUI();
        if (notesData[0]) openNote(notesData[0].id);

        showToast("Backup restored successfully.");
        pushActivity("Imported workspace backup");
      } catch (error) {
        console.error(error);
        showToast("Invalid backup file.", "error");
      }
    };
    reader.readAsText(file);
  }

  async function clearAllData() {
    const ok = await confirmAction(
      "Clear local workspace?",
      "This permanently removes projects, notes, reviews, analytics, and settings stored in this browser."
    );
    if (!ok) return;

    Object.values(STORAGE).forEach((key) => localStorage.removeItem(key));
    projectsData = [];
    notesData = [];
    reviewsData = [];
    activityLog = [];
    gamesPlayedCount = 0;
    analytics = {
      views: 0,
      events: 0,
      pages: {},
      tools: {},
      games: {},
      started: new Date().toISOString()
    };
    settings = { ...DEFAULT_SETTINGS };
    activeNoteId = null;

    applySettings();
    renderProjects();
    renderNotesList();
    renderReviews();
    renderRecentActivity();
    updateAnalyticsUI();
    clearChatUI(true);
    showToast("Local workspace cleared.");
  }

  /* -------------------- PRICING UI -------------------- */

  function setBilling(period) {
    $$("[data-billing]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.billing === period);
    });
    $$(".plan-price strong").forEach((el) => {
      el.textContent = period === "yearly" ? el.dataset.yearly : el.dataset.monthly;
    });
    $$(".billing-period").forEach((el) => {
      el.textContent = period === "yearly" ? "/ year" : "/ month";
    });
  }

  /* -------------------- SETTINGS TABS -------------------- */

  function openSettingsTab(tab) {
    $$(".settings-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.settingsTab === tab);
    });
    $$(".settings-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === `settings-${tab}`);
    });
  }

  /* -------------------- EVENT BINDING -------------------- */


  /* -------------------- COMMAND PALETTE -------------------- */

  const COMMANDS = [
    { id: "page-overview", label: "Go to Overview", group: "Pages", icon: "fa-house", run: () => openPage("overview") },
    { id: "page-ai", label: "Open AI Assistant", group: "Pages", icon: "fa-robot", run: () => openPage("ai") },
    { id: "page-tools", label: "Open Free Tools", group: "Pages", icon: "fa-wand-magic-sparkles", run: () => openPage("tools") },
    { id: "page-projects", label: "Open Projects", group: "Pages", icon: "fa-layer-group", run: () => openPage("projects") },
    { id: "page-games", label: "Open Game Galaxy", group: "Pages", icon: "fa-gamepad", run: () => openPage("games") },
    { id: "page-codelab", label: "Open Code Lab", group: "Pages", icon: "fa-code", run: () => openPage("codelab") },
    { id: "page-notepad", label: "Open Notepad", group: "Pages", icon: "fa-note-sticky", run: () => openPage("notepad") },
    { id: "page-analytics", label: "Open Analytics", group: "Pages", icon: "fa-chart-line", run: () => openPage("analytics") },
    { id: "page-services", label: "Open Services & Hire", group: "Pages", icon: "fa-briefcase", run: () => openPage("services") },
    { id: "page-pricing", label: "Open Pricing", group: "Pages", icon: "fa-crown", run: () => openPage("pricing") },
    { id: "page-reviews", label: "Open Reviews", group: "Pages", icon: "fa-star", run: () => openPage("reviews") },
    { id: "page-about", label: "Open About", group: "Pages", icon: "fa-circle-info", run: () => openPage("about") },
    { id: "page-contact", label: "Open Contact", group: "Pages", icon: "fa-envelope", run: () => openPage("contact") },
    { id: "page-settings", label: "Open Settings", group: "Pages", icon: "fa-gear", run: () => openPage("settings") },
    { id: "action-theme", label: "Toggle theme", group: "Actions", icon: "fa-moon", run: () => { applyTheme(settings.theme === "dark" ? "light" : "dark"); write(STORAGE.settings, settings); showToast("Theme updated."); } },
    { id: "action-new-project", label: "New project", group: "Actions", icon: "fa-folder-plus", run: () => { openPage("projects"); openProjectModal(); } },
    { id: "action-new-note", label: "New note", group: "Actions", icon: "fa-plus", run: () => { openPage("notepad"); createNote(); } },
    { id: "action-export", label: "Export workspace backup", group: "Actions", icon: "fa-download", run: () => exportBackup() },
    { id: "action-focus", label: "Open focus timer", group: "Actions", icon: "fa-clock", run: () => openFocusModal() },
    { id: "action-run-code", label: "Run Code Lab", group: "Actions", icon: "fa-play", run: () => { openPage("codelab"); runCode(); } }
  ];

  let commandIndex = 0;
  let filteredCommands = [];

  function openCommandPalette() {
    const modal = $("#commandPalette");
    if (!modal) return;
    modal.classList.remove("hidden");
    const input = $("#commandInput");
    if (input) {
      input.value = "";
      input.focus();
    }
    renderCommandResults("");
  }

  function closeCommandPalette() {
    $("#commandPalette")?.classList.add("hidden");
  }

  function renderCommandResults(query) {
    const box = $("#commandResults");
    if (!box) return;
    const q = (query || "").toLowerCase().trim();
    filteredCommands = COMMANDS.filter(
      (c) => !q || c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
    );
    // also include tools
    TOOLS.forEach((t) => {
      if (!q || t.name.toLowerCase().includes(q) || t.category.includes(q)) {
        filteredCommands.push({
          id: "tool-" + t.id,
          label: t.name,
          group: "Tools",
          icon: t.icon,
          run: () => { openPage("tools"); openTool(t.id); }
        });
      }
    });
    commandIndex = 0;
    if (!filteredCommands.length) {
      box.innerHTML = `<p class="empty-state">No matching commands.</p>`;
      return;
    }
    box.innerHTML = filteredCommands
      .map(
        (c, i) => `
      <button type="button" class="command-item ${i === 0 ? "active" : ""}" data-cmd-index="${i}">
        <i class="fa-solid ${c.icon}"></i>
        <span>${escapeHTML(c.label)}</span>
        <small>${escapeHTML(c.group)}</small>
      </button>`
      )
      .join("");
  }

  function runSelectedCommand(index) {
    const cmd = filteredCommands[index];
    if (!cmd) return;
    closeCommandPalette();
    cmd.run();
  }

  /* -------------------- FOCUS / POMODORO -------------------- */

  let focusSeconds = 25 * 60;
  let focusRemaining = focusSeconds;
  let focusTimerId = null;
  let focusRunning = false;

  function openFocusModal() {
    $("#focusModal")?.classList.remove("hidden");
    updateFocusDisplay();
  }

  function closeFocusModal() {
    $("#focusModal")?.classList.add("hidden");
  }

  function updateFocusDisplay() {
    const el = $("#focusDisplay");
    if (!el) return;
    const m = Math.floor(focusRemaining / 60);
    const s = focusRemaining % 60;
    el.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function setFocusMode(minutes) {
    focusSeconds = minutes * 60;
    focusRemaining = focusSeconds;
    focusRunning = false;
    clearInterval(focusTimerId);
    updateFocusDisplay();
    $$("[data-focus-mode]").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.focusMode) === minutes);
    });
  }

  function startFocus() {
    if (focusRunning) return;
    focusRunning = true;
    clearInterval(focusTimerId);
    focusTimerId = setInterval(() => {
      if (focusRemaining <= 0) {
        clearInterval(focusTimerId);
        focusRunning = false;
        showToast("Focus session complete!");
        pushActivity("Completed a focus session");
        return;
      }
      focusRemaining -= 1;
      updateFocusDisplay();
    }, 1000);
  }

  function pauseFocus() {
    focusRunning = false;
    clearInterval(focusTimerId);
  }

  function resetFocus() {
    pauseFocus();
    focusRemaining = focusSeconds;
    updateFocusDisplay();
  }

  function bindEvents() {
    document.addEventListener("click", async (event) => {
      const pageLink = event.target.closest("[data-page-link], [data-page]");
      if (pageLink && (pageLink.dataset.pageLink || pageLink.dataset.page)) {
        event.preventDefault();
        openPage(pageLink.dataset.pageLink || pageLink.dataset.page);
        return;
      }

      const actionButton = event.target.closest("[data-action]");
      if (actionButton) {
        const action = actionButton.dataset.action;
        const id = actionButton.dataset.id;

        switch (action) {
          case "open-tool":
            openTool(id);
            break;
          case "edit-project": {
            const project = projectsData.find((p) => p.id === id);
            if (project) openProjectModal(project);
            break;
          }
          case "delete-project":
            await deleteProject(id);
            break;
          case "open-note":
            openNote(id);
            break;
          case "open-game":
            openGame(id);
            break;
          case "check-guess": {
            const guess = Number($("#guessInput")?.value);
            const result = $("#guessResult");
            if (!guess || guess < 1 || guess > 100) {
              if (result) result.textContent = "Enter a number between 1 and 100.";
            } else if (result) {
              result.textContent =
                guess === secretNumber
                  ? "Correct! You won!"
                  : guess < secretNumber
                    ? "Too low. Try again!"
                    : "Too high. Try again!";
            }
            break;
          }
          case "restart-guess":
            secretNumber = Math.floor(Math.random() * 100) + 1;
            if ($("#guessResult")) $("#guessResult").textContent = "New number ready. Good luck!";
            if ($("#guessInput")) $("#guessInput").value = "";
            break;
          case "start-reaction": {
            const clickButton = $('[data-action="reaction-click"]');
            const result = $("#reactionResult");
            if (clickButton) {
              clickButton.disabled = true;
              clickButton.textContent = "Wait...";
            }
            if (result) result.textContent = "Wait for the signal...";
            clearTimeout(reactionTimer);
            reactionStarted = 0;
            reactionTimer = setTimeout(() => {
              if (clickButton) {
                clickButton.disabled = false;
                clickButton.textContent = "CLICK NOW!";
              }
              if (result) result.textContent = "GO!";
              reactionStarted = performance.now();
            }, 1200 + Math.random() * 2800);
            break;
          }
          case "reaction-click": {
            const result = $("#reactionResult");
            if (!reactionStarted) {
              if (result) result.textContent = "Too early! Press Start again.";
            } else {
              const elapsed = Math.round(performance.now() - reactionStarted);
              if (result) result.textContent = `Your reaction time: ${elapsed} ms`;
              reactionStarted = 0;
              actionButton.disabled = true;
              actionButton.textContent = "CLICK!";
            }
            break;
          }
          case "rps": {
            const choices = ["rock", "paper", "scissors"];
            const computer = choices[Math.floor(Math.random() * 3)];
            const player = actionButton.dataset.choice;
            let outcome = "It's a draw!";
            if (
              (player === "rock" && computer === "scissors") ||
              (player === "paper" && computer === "rock") ||
              (player === "scissors" && computer === "paper")
            )
              outcome = "You win!";
            else if (player !== computer) outcome = "Computer wins!";
            const result = $("#rpsResult");
            if (result) {
              result.textContent = `You: ${player} · Computer: ${computer}. ${outcome}`;
            }
            break;
          }
          case "check-math": {
            const answer = Number($("#mathAnswer")?.value);
            const result = $("#mathResult");
            if (result) {
              result.textContent =
                answer === mathAnswer ? "Correct! Great job!" : `Not quite. Answer was ${mathAnswer}.`;
            }
            break;
          }
          case "next-math":
            createMathQuestion();
            break;
          case "memory-card":
            handleMemoryCard(Number(id));
            break;
          case "restart-memory":
            createMemoryGame();
            break;
          case "ttt-move":
            handleTttMove(Number(id));
            break;
          case "restart-ttt":
            resetTtt();
            break;
          case "snake-dir":
            setSnakeDir(actionButton.dataset.dir);
            break;
          case "restart-snake":
            startSnake();
            break;
          case "check-scramble": {
            const guess = ($("#scrambleInput")?.value || "").trim().toLowerCase();
            const result = $("#scrambleResult");
            if (result) {
              result.textContent =
                guess === scrambleAnswer
                  ? "Correct! Well done."
                  : `Not quite. The word was "${scrambleAnswer}".`;
            }
            break;
          }
          case "restart-scramble":
            setupScramble();
            break;
          case "delete-review":
            await deleteReview(id);
            break;
          case "copy-chat": {
            const text = actionButton.parentElement?.querySelector(".chat-message-content")?.textContent || "";
            navigator.clipboard?.writeText(text).then(() => showToast("Message copied."));
            break;
          }
        }
        return;
      }

      if (event.target.closest("#themeToggle") || event.target.closest("#mobileThemeBtn")) {
        applyTheme(settings.theme === "dark" ? "light" : "dark");
        write(STORAGE.settings, settings);
        showToast("Theme updated.");
        return;
      }

      if (event.target.closest("#mobileMenuBtn")) {
        const sidebar = $("#sidebar");
        if (sidebar?.classList.contains("mobile-open")) closeMobileMenu();
        else openMobileMenu();
        return;
      }

      if (event.target.closest("#sidebarOverlay")) {
        closeMobileMenu();
        return;
      }

      if (event.target.closest("#addProjectBtn")) {
        openProjectModal();
        return;
      }

      if (event.target.closest("#closeProjectModal") || event.target.closest("#cancelProjectBtn")) {
        closeProjectModal();
        return;
      }

      if (event.target.closest("#runWorkspace")) {
        runActiveTool();
        return;
      }

      if (event.target.closest("#clearWorkspace")) {
        clearToolWorkspace();
        return;
      }

      if (event.target.closest("#copyWorkspaceOutput")) {
        copyToolOutput();
        return;
      }

      if (event.target.closest("#closeWorkspaceBtn")) {
        closeToolWorkspace();
        return;
      }

      if (event.target.closest("#newNoteBtn")) {
        createNote();
        return;
      }

      if (event.target.closest("#deleteNoteBtn")) {
        await deleteActiveNote();
        return;
      }

      if (event.target.closest("#downloadNoteBtn")) {
        downloadActiveNote();
        return;
      }

      if (event.target.closest("#runCodeBtn") || event.target.closest("#refreshPreviewBtn")) {
        runCode();
        return;
      }

      if (event.target.closest("#resetCodeBtn")) {
        await resetCode();
        return;
      }

      if (event.target.closest("#downloadCodeBtn")) {
        downloadCode();
        return;
      }

      if (event.target.closest("#newChatBtn")) {
        clearChatUI(true);
        showToast("New conversation started.");
        return;
      }

      if (event.target.closest("#clearChatBtn")) {
        clearChatUI(true);
        showToast("Chat cleared.");
        return;
      }

      if (event.target.closest("#closeGameBtn")) {
        closeGame();
        return;
      }

      if (event.target.closest("#newQuoteBtn")) {
        setRandomQuote();
        return;
      }

      if (event.target.closest("#saveSettingsBtn")) {
        saveSettings();
        return;
      }

      if (event.target.closest("#settingsExportBtn") || event.target.closest("#exportBackupBtn")) {
        exportBackup();
        return;
      }

      if (event.target.closest("#importBackupBtn")) {
        $("#backupImport")?.click();
        return;
      }

      if (event.target.closest("#clearDataBtn")) {
        await clearAllData();
        return;
      }

      if (event.target.closest("#resetAnalyticsBtn")) {
        const ok = await confirmAction("Reset analytics?", "Clear local analytics counters on this device?");
        if (!ok) return;
        analytics = {
          views: analytics.views,
          events: 0,
          pages: {},
          tools: {},
          games: {},
          started: new Date().toISOString()
        };
        activityLog = [];
        write(STORAGE.analytics, analytics);
        write(STORAGE.activity, activityLog);
        updateAnalyticsUI();
        renderRecentActivity();
        showToast("Local analytics reset.");
        return;
      }

      const settingsTab = event.target.closest("[data-settings-tab]");
      if (settingsTab) {
        openSettingsTab(settingsTab.dataset.settingsTab);
        return;
      }

      const aiMode = event.target.closest("[data-ai-mode]");
      if (aiMode) {
        $$(".ai-mode").forEach((btn) => btn.classList.remove("active"));
        aiMode.classList.add("active");
        return;
      }

      const promptChip = event.target.closest("[data-prompt]");
      if (promptChip) {
        const input = $("#chatInput");
        if (input) {
          input.value = promptChip.dataset.prompt;
          input.focus();
        }
        return;
      }

      const billingBtn = event.target.closest("[data-billing]");
      if (billingBtn) {
        setBilling(billingBtn.dataset.billing);
        return;
      }

      const planBtn = event.target.closest("[data-plan]");
      if (planBtn) {
        showToast(
          `${planBtn.dataset.plan} plan is a frontend demo. Payment requires a future provider integration.`,
          "success"
        );
        return;
      }

      const gameFilter = event.target.closest("[data-game-filter]");
      if (gameFilter) {
        $$("[data-game-filter]").forEach((btn) => btn.classList.remove("active"));
        gameFilter.classList.add("active");
        renderGames(gameFilter.dataset.gameFilter);
        return;
      }

      const starBtn = event.target.closest("#starRating button");
      if (starBtn) {
        selectedRating = Number(starBtn.dataset.rating) || 0;
        $$("#starRating button").forEach((btn) => {
          btn.classList.toggle("selected", Number(btn.dataset.rating) <= selectedRating);
        });
        return;
      }

      if (event.target.closest("#commandBtn")) {
        openCommandPalette();
        return;
      }

      if (event.target.closest("#focusTimerBtn") || event.target.closest("#closeFocusBtn") === null && event.target.closest("[data-focus-mode]")) {
        /* handled below */
      }

      if (event.target.closest("#focusTimerBtn")) {
        openFocusModal();
        return;
      }

      if (event.target.closest("#closeFocusBtn")) {
        closeFocusModal();
        return;
      }

      if (event.target.closest("#focusStartBtn")) {
        startFocus();
        return;
      }

      if (event.target.closest("#focusPauseBtn")) {
        pauseFocus();
        return;
      }

      if (event.target.closest("#focusResetBtn")) {
        resetFocus();
        return;
      }

      const focusMode = event.target.closest("[data-focus-mode]");
      if (focusMode) {
        setFocusMode(Number(focusMode.dataset.focusMode) || 25);
        return;
      }

      const cmdItem = event.target.closest("[data-cmd-index]");
      if (cmdItem) {
        runSelectedCommand(Number(cmdItem.dataset.cmdIndex));
        return;
      }

      if (event.target === $("#commandPalette")) {
        closeCommandPalette();
        return;
      }

      if (event.target === $("#focusModal")) {
        closeFocusModal();
        return;
      }

      if (event.target.closest("#notificationBtn")) {
        showToast("No new notifications in this local workspace.");
        return;
      }

      if (event.target === $("#projectModal")) closeProjectModal();
      if (event.target === $("#confirmModal")) closeConfirm(false);
      if (event.target === $("#gameModal")) closeGame();
    });

    $("#chatForm")?.addEventListener("submit", handleChatSubmit);
    $("#projectForm")?.addEventListener("submit", handleProjectSubmit);
    $("#reviewForm")?.addEventListener("submit", handleReviewSubmit);

    $("#confirmAccept")?.addEventListener("click", () => closeConfirm(true));
    $("#confirmCancel")?.addEventListener("click", () => closeConfirm(false));

    $("#backupImport")?.addEventListener("change", (event) => {
      importBackup(event.target.files?.[0]);
      event.target.value = "";
    });

    ["htmlCode", "cssCode", "jsCode"].forEach((id) => {
      $(`#${id}`)?.addEventListener("input", saveEditorCode);
    });

    $("#toolSearch")?.addEventListener("input", renderTools);
    $("#toolCategory")?.addEventListener("change", renderTools);
    $("#projectSearch")?.addEventListener("input", renderProjects);
    $("#projectSort")?.addEventListener("change", renderProjects);
    $("#notesSearch")?.addEventListener("input", (event) => {
      renderNotesList(event.target.value);
    });

    $("#noteTitle")?.addEventListener("input", scheduleNoteSave);
    $("#noteContent")?.addEventListener("input", () => {
      updateNoteMeta();
      scheduleNoteSave();
    });

    $("#chatInput")?.addEventListener("input", (event) => {
      event.target.style.height = "auto";
      event.target.style.height = `${Math.min(event.target.scrollHeight, 140)}px`;
    });

    document.addEventListener("keydown", (event) => {
      if (activeGame === "snake" && !snakeState?.over) {
        const keyMap = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
        if (keyMap[event.key]) {
          event.preventDefault();
          setSnakeDir(keyMap[event.key]);
        }
      }
      if (event.key === "Escape") {
        closeMobileMenu();
        closeGame();
        closeProjectModal();
        closeConfirm(false);
        closeToolWorkspace();
        closeCommandPalette();
        closeFocusModal();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const open = !$("#commandPalette")?.classList.contains("hidden");
        if (open) closeCommandPalette();
        else openCommandPalette();
      }
      if (!$("#commandPalette")?.classList.contains("hidden")) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          commandIndex = Math.min(commandIndex + 1, filteredCommands.length - 1);
          $$("#commandResults .command-item").forEach((el, i) => el.classList.toggle("active", i === commandIndex));
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          commandIndex = Math.max(commandIndex - 1, 0);
          $$("#commandResults .command-item").forEach((el, i) => el.classList.toggle("active", i === commandIndex));
        } else if (event.key === "Enter") {
          event.preventDefault();
          runSelectedCommand(commandIndex);
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        if (currentPage === "codelab") {
          event.preventDefault();
          runCode();
        }
      }
    });

    window.addEventListener("popstate", (event) => {
      const page = event.state?.page || location.hash.replace("#", "") || settings.startPage || "overview";
      openPage(page, false);
    });
  }

  /* -------------------- INIT -------------------- */

  function initializeApp() {
    analytics.views = (analytics.views || 0) + 1;
    write(STORAGE.analytics, analytics);

    projectsData = read(STORAGE.projects, []);
    notesData = read(STORAGE.notes, []);
    reviewsData = read(STORAGE.reviews, []);
    activityLog = read(STORAGE.activity, []);
    gamesPlayedCount = read(STORAGE.gamesPlayed, 0);
    settings = { ...DEFAULT_SETTINGS, ...read(STORAGE.settings, {}) };

    applySettings();
    loadEditorCode();
    bindEvents();

    renderTools();
    renderProjects();
    renderGames();
    renderReviews();
    renderNotesList();
    renderRecentActivity();
    updateAnalyticsUI();
    setRandomQuote();
    updateClock();
    setInterval(updateClock, 30000);

    const year = $("#currentYear");
    if (year) year.textContent = String(new Date().getFullYear());

    // Preserve Overview welcome section: open start page without wiping content
    const initial =
      (location.hash || "").replace("#", "") ||
      settings.startPage ||
      "overview";
    const valid = PAGE_TITLES[initial] ? initial : "overview";
    history.replaceState({ page: valid }, "", `#${valid}`);
    openPage(valid, false);

    if (notesData.length) openNote(notesData[0].id);

    // Ensure code preview has starter content
    if ($("#htmlCode") && !$("#htmlCode").value.trim()) {
      $("#htmlCode").value = DEFAULT_HTML;
      $("#cssCode").value = DEFAULT_CSS;
      $("#jsCode").value = DEFAULT_JS;
    }

    
    // Premium splash intro ~3.5s
    const splash = $("#splashScreen");
    if (splash) {
      setTimeout(() => {
        splash.classList.add("hide");
        setTimeout(() => splash.remove(), 800);
      }, 3500);
    }

    console.log("Wazir Aura v2.2 initialized successfully.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
  } else {
    initializeApp();
  }
})();


/*
 * WAZIR AURA — MODULAR CORE
 * Shared application system and automatic tool discovery.
 *
 * New tools belong in /tools/*.js
 * Each tool registers itself with:
 * window.WazirAura.registerTool({...})
 */

(() => {
  "use strict";

  const CONFIG = {
    owner: "waziraura",
    repository: "wazir-web",
    branch: "main",
    toolsPath: "tools",
    maxTextLength: 200000,
    freeUsageLimit: 10,
    premiumUsageLimit: 100,
    githubApi:
      "https://api.github.com/repos/waziraura/wazir-web/contents/tools?ref=main",
  };

  const state = {
    tools: new Map(),
    activeTool: null,
    search: "",
    category: "all",
    usage: {},
    isPremium: false,
  };

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);

  function notify(message, type = "info") {
    let toast = $("#wa-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "wa-toast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.dataset.type = type;
    toast.classList.add("is-visible");

    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 3200);
  }

  function registerTool(tool) {
    if (!tool || typeof tool !== "object") {
      console.error("Invalid tool registration:", tool);
      return false;
    }

    const required = ["id", "name", "description", "category"];

    for (const key of required) {
      if (!tool[key] || typeof tool[key] !== "string") {
        console.error(`Tool is missing a valid "${key}"`, tool);
        return false;
      }
    }

    if (state.tools.has(tool.id)) {
      console.warn(`Duplicate tool ignored: ${tool.id}`);
      return false;
    }

    state.tools.set(tool.id, {
      icon: "✦",
      status: "ready",
      premium: false,
      ...tool,
    });

    document.dispatchEvent(
      new CustomEvent("waziraura:tool-registered", {
        detail: { id: tool.id },
      })
    );

    return true;
  }

  function getTools() {
    return [...state.tools.values()];
  }

  function getTool(id) {
    return state.tools.get(id) || null;
  }

  function getUsageKey(id) {
    const day = new Date().toISOString().slice(0, 10);
    return `wa-usage:${day}:${id}`;
  }

  function getUsage(id) {
    try {
      return Number(localStorage.getItem(getUsageKey(id))) || 0;
    } catch {
      return 0;
    }
  }

  function getUsageLimit() {
    return state.isPremium
      ? CONFIG.premiumUsageLimit
      : CONFIG.freeUsageLimit;
  }

  function canUseTool(id) {
    const tool = getTool(id);

    if (!tool) return false;

    if (tool.premium && !state.isPremium) {
      notify("This tool requires a premium plan.", "warning");
      return false;
    }

    if (getUsage(id) >= getUsageLimit()) {
      notify(
        "Your local usage limit has been reached. Premium limits and billing need a connected backend.",
        "warning"
      );
      return false;
    }

    return true;
  }

  function recordUsage(id) {
    try {
      localStorage.setItem(
        getUsageKey(id),
        String(getUsage(id) + 1)
      );
    } catch {
      // Usage tracking may be unavailable in private browsing.
    }
  }

  function setPremium(enabled) {
    state.isPremium = Boolean(enabled);
    renderTools();
  }

  function setOutput(value, target = "#workspace-result") {
    const element = typeof target === "string" ? $(target) : target;
    if (!element) return;

    if (element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement) {
      element.value = String(value ?? "");
    } else {
      element.textContent = String(value ?? "");
    }
  }

  function field(label, options = {}) {
    const {
      name = "input",
      placeholder = "",
      type = "textarea",
      value = "",
      accept = "",
      help = "",
      required = false,
    } = options;

    const id = `wa-field-${name}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    let control;

    if (type === "file") {
      control = `<input id="${id}" name="${escapeHTML(name)}"
        type="file" ${accept ? `accept="${escapeHTML(accept)}"` : ""}
        ${required ? "required" : ""}>`;
    } else if (type === "text" || type === "number") {
      control = `<input id="${id}" name="${escapeHTML(name)}"
        type="${type}" value="${escapeHTML(value)}"
        placeholder="${escapeHTML(placeholder)}"
        ${required ? "required" : ""}>`;
    } else {
      control = `<textarea id="${id}" name="${escapeHTML(name)}"
        rows="5" maxlength="${CONFIG.maxTextLength}"
        placeholder="${escapeHTML(placeholder)}"
        ${required ? "required" : ""}>${escapeHTML(value)}</textarea>`;
    }

    return `
      <label class="workspace-field" for="${id}">
        <span class="field-label">${escapeHTML(label)}</span>
        ${control}
        ${help ? `<small class="field-help">${escapeHTML(help)}</small>` : ""}
      </label>`;
  }

  function button(label, options = {}) {
    const {
      action = "run",
      variant = "primary",
      type = "button",
      disabled = false,
    } = options;

    return `<button type="${type}"
      class="button button-${escapeHTML(variant)}"
      data-wa-action="${escapeHTML(action)}"
      ${disabled ? "disabled" : ""}>
      ${escapeHTML(label)}
    </button>`;
  }

  function openWorkspace(id) {
    const tool = getTool(id);
    if (!tool) {
      notify("This tool has not loaded yet.", "warning");
      return;
    }

    state.activeTool = id;

    const workspace = $("#workspace");
    const title = $("#workspace-title");
    const description = $("#workspace-description");
    const content = $("#workspace-content");
    const placeholder = $("#workspace-placeholder");

    if (title) title.textContent = tool.name;
    if (description) description.textContent = tool.description;
    if (placeholder) placeholder.hidden = true;

    if (content) {
      content.hidden = false;
      content.replaceChildren();

      if (typeof tool.render === "function") {
        const rendered = tool.render({ field, button, escapeHTML });

        if (typeof rendered === "string") {
          content.innerHTML = rendered;
        } else if (rendered instanceof Node) {
          content.appendChild(rendered);
        }
      } else {
        content.innerHTML = `
          <p>This tool is registered but has no interface yet.</p>`;
      }
    }

    if (workspace) {
      workspace.hidden = false;
      workspace.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    }

    $("#workspace-status")?.replaceChildren();
    renderTools();
  }

  function closeWorkspace() {
    state.activeTool = null;

    const workspace = $("#workspace");
    if (workspace) workspace.hidden = true;

    renderTools();
  }

  function renderTools() {
    const grid = $("#tools-grid");
    if (!grid) return;

    const tools = getTools().filter((tool) => {
      const matchesCategory =
        state.category === "all" ||
        tool.category.toLowerCase() === state.category.toLowerCase();

      const searchText =
        `${tool.name} ${tool.description} ${tool.category}`.toLowerCase();

      return matchesCategory && searchText.includes(state.search);
    });

    grid.innerHTML = tools.map((tool) => `
      <article class="tool-card"
        data-tool-id="${escapeHTML(tool.id)}">
        <div class="tool-card-top">
          <span class="tool-icon" aria-hidden="true">
            ${escapeHTML(tool.icon)}
          </span>
          <span class="tool-label">${escapeHTML(tool.category)}</span>
        </div>
        <h3>${escapeHTML(tool.name)}</h3>
        <p>${escapeHTML(tool.description)}</p>
        <button class="button button-ghost button-small"
          type="button" data-wa-open="${escapeHTML(tool.id)}">
          Open tool <span aria-hidden="true">→</span>
        </button>
        ${tool.premium
          ? '<span class="tool-premium-label">Premium</span>'
          : ""}
      </article>
    `).join("");

    const count = $("#tool-count");
    if (count) count.textContent = String(tools.length);

    const empty = $("#no-tools-message");
    if (empty) empty.hidden = tools.length > 0;
  }

  function setSearch(value) {
    state.search = String(value || "").trim().toLowerCase();
    renderTools();
  }

  function setCategory(value) {
    state.category = String(value || "all");
    renderTools();

    $$(".category-tab").forEach((tab) => {
      const active =
        (tab.dataset.category || "all") === state.category;

      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
  }

  async function runTool(id, formData, context = {}) {
    const tool = getTool(id);

    if (!tool || typeof tool.run !== "function") {
      notify("This tool is not ready yet.", "warning");
      return;
    }

    if (!canUseTool(id)) return;

    const runButton = context.submitter;
    if (runButton) runButton.disabled = true;

    const status = $("#workspace-status");
    if (status) status.textContent = "Working…";

    try {
      const result = await tool.run({
        input: formData,
        setOutput,
        notify,
        isPremium: state.isPremium,
        usage: getUsage(id),
        usageLimit: getUsageLimit(),
      });

      if (result !== undefined && result !== null) {
        if (typeof result === "string") {
          setOutput(result);
        } else if (result.text !== undefined) {
          setOutput(result.text);
        }
      }

      recordUsage(id);
      if (status) status.textContent = "Finished";
    } catch (error) {
      console.error(`Tool "${id}" failed:`, error);
      if (status) status.textContent = "Something went wrong";
      notify(error?.message || "Tool failed. Please try again.", "error");
    } finally {
      if (runButton) runButton.disabled = false;
    }
  }

  async function discoverAndLoadTools() {
    const status = $("#tools-loading-status");

    try {
      const response = await fetch(CONFIG.githubApi, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-cache",
      });

      if (!response.ok) {
        throw new Error(
          `Tool listing unavailable (${response.status}).`
        );
      }

      const files = await response.json();

      const modules = files.filter((file) =>
        file.type === "file" &&
        file.name.endsWith(".js") &&
        !file.name.startsWith("_")
      );

      const results = await Promise.allSettled(
        modules.map((file) => {
          const url =
            `https://raw.githubusercontent.com/` +
            `${CONFIG.owner}/${CONFIG.repository}/` +
            `${CONFIG.branch}/${CONFIG.toolsPath}/${file.name}`;

          return import(url);
        })
      );

      const failures = results.filter(
        (result) => result.status === "rejected"
      );

      if (failures.length) {
        console.warn("Some tool modules failed to load:", failures);
      }

      renderTools();

      if (status) {
        status.textContent = state.tools.size
          ? `${state.tools.size} tools loaded`
          : "No tools registered yet";
      }
    } catch (error) {
      console.error("Automatic tool discovery failed:", error);

      if (status) {
        status.textContent =
          "Tools could not load. Open this website through GitHub Pages or a local web server.";
      }

      notify("Could not load tool files. Check the repository and connection.", "error");
    }
  }

  function bindEvents() {
    $("#tool-search")?.addEventListener("input", (event) => {
      setSearch(event.target.value);
    });

    $("#category-tabs")?.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-category]");
      if (tab) setCategory(tab.dataset.category);
    });

    $("#tools-grid")?.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-wa-open]");
      if (trigger) openWorkspace(trigger.dataset.waOpen);
    });

    $("#close-workspace")?.addEventListener("click", closeWorkspace);

    $("#workspace-content")?.addEventListener("submit", async (event) => {
      const form = event.target.closest("[data-wa-tool-form]");
      if (!form) return;

      event.preventDefault();

      const id = form.dataset.waToolForm;
      const formData = new FormData(form);
      const values = {};

      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          values[key] = value;
        } else {
          values[key] = String(value).slice(0, CONFIG.maxTextLength);
        }
      }

      await runTool(id, values, { submitter: event.submitter });
    });

    $("#theme-toggle")?.addEventListener("click", () => {
      const light = document.body.classList.toggle("light-mode");
      try {
        localStorage.setItem("wa-theme", light ? "light" : "dark");
      } catch {}
    });

    $("#mobile-menu-toggle")?.addEventListener("click", () => {
      const nav = $("#mobile-nav");
      if (!nav) return;

      const open = nav.classList.toggle("is-open");
      $("#mobile-menu-toggle")?.setAttribute("aria-expanded", String(open));
    });

    $("#copy-result")?.addEventListener("click", async () => {
      const result = $("#workspace-result");
      const text = result?.value ?? result?.textContent ?? "";

      if (!text) {
        notify("There is no output to copy.", "warning");
        return;
      }

      try {
        await navigator.clipboard.writeText(text);
        notify("Copied to clipboard.");
      } catch {
        notify("Clipboard access is unavailable in this browser.", "error");
      }
    });

    $("#download-result")?.addEventListener("click", () => {
      const result = $("#workspace-result");
      const text = result?.value ?? result?.textContent ?? "";

      if (!text) {
        notify("There is no output to download.", "warning");
        return;
      }

      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = "wazir-aura-output.txt";
      anchor.click();

      URL.revokeObjectURL(url);
    });

    $("#current-year")?.replaceChildren(
      document.createTextNode(String(new Date().getFullYear()))
    );

    try {
      if (localStorage.getItem("wa-theme") === "light") {
        document.body.classList.add("light-mode");
      }
    } catch {}
  }

  window.WazirAura = Object.freeze({
    registerTool,
    getTools,
    getTool,
    openWorkspace,
    closeWorkspace,
    runTool,
    setOutput,
    notify,
    escapeHTML,
    field,
    button,
    getUsage,
    getUsageLimit,
    setPremium,
    config: Object.freeze({ ...CONFIG }),
  });

  function start() {
    bindEvents();
    renderTools();
    discoverAndLoadTools();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

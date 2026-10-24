
(() => {
  "use strict";

  const REPO_OWNER = "waziraura";
  const REPO_NAME = "wazir-web";
  const BRANCH = "main";
  const TOOLS_API =
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/tools?ref=${BRANCH}`;

  const tools = new Map();
  let activeCategory = "All";
  let activeTool = null;
  let toastTimer = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;

    toast.textContent = String(message);
    toast.classList.remove("is-hidden");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.add("is-hidden");
    }, 3200);
  }

  function setLoadingStatus(message) {
    const status = $("#tools-loading-status");
    if (status) status.textContent = message || "";
  }

  function field(label, options = {}) {
    const {
      name = "field",
      type = "text",
      placeholder = "",
      required = false,
      value = "",
      help = "",
      rows = 4
    } = options;

    const id = `wa-field-${String(name).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
    const safeName = escapeHTML(name);
    const safeLabel = escapeHTML(label);
    const safePlaceholder = escapeHTML(placeholder);
    const safeValue = escapeHTML(value);
    const requiredAttr = required ? " required" : "";

    let control;

    if (type === "textarea") {
      control = `<textarea id="${id}" name="${safeName}" rows="${Number(rows) || 4}" placeholder="${safePlaceholder}"${requiredAttr}>${safeValue}</textarea>`;
    } else {
      const safeType = ["text", "email", "number", "url", "password", "search"].includes(type)
        ? type
        : "text";

      control = `<input id="${id}" name="${safeName}" type="${safeType}" placeholder="${safePlaceholder}" value="${safeValue}"${requiredAttr}>`;
    }

    return `
      <div class="form-field">
        <label for="${id}">${safeLabel}</label>
        ${control}
        ${help ? `<small class="field-help">${escapeHTML(help)}</small>` : ""}
      </div>
    `;
  }

  function button(label, options = {}) {
    const {
      action = "run",
      type = "button",
      variant = "primary"
    } = options;

    const safeType = ["button", "submit", "reset"].includes(type)
      ? type
      : "button";

    const safeAction = escapeHTML(action);
    const safeLabel = escapeHTML(label);
    const safeVariant = escapeHTML(variant);

    return `
      <button
        type="${safeType}"
        class="btn btn-${safeVariant}"
        data-wa-action="${safeAction}"
      >${safeLabel}</button>
    `;
  }

  function setOutput(value) {
    const workspace = $("#workspace-content");
    if (!workspace) return;

    let output = $("#workspace-result", workspace);

    if (!output) {
      const wrap = document.createElement("div");
      wrap.className = "workspace-result-wrap";

      const heading = document.createElement("div");
      heading.className = "result-header";

      const title = document.createElement("strong");
      title.textContent = "Result";
      heading.appendChild(title);

      output = document.createElement("div");
      output.id = "workspace-result";
      output.className = "workspace-result";
      output.setAttribute("aria-live", "polite");

      wrap.append(heading, output);
      workspace.appendChild(wrap);
    }

    output.textContent =
      typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }

  function setStatus(message) {
    const status = $("#workspace-status");
    if (status) status.textContent = String(message || "");
  }

  const WazirAura = {
    registerTool(tool) {
      if (!tool || typeof tool !== "object") {
        console.error("Invalid Wazir Aura tool.");
        return;
      }

      if (!/^[a-z0-9_-]+$/i.test(String(tool.id || ""))) {
        console.error("A tool needs a valid id.");
        return;
      }

      if (!tool.name || typeof tool.render !== "function") {
        console.error(`Tool "${tool.id}" needs a name and render() function.`);
        return;
      }

      if (tools.has(tool.id)) {
        console.warn(`Duplicate tool ignored: ${tool.id}`);
        return;
      }

      tools.set(tool.id, {
        category: "AI",
        description: "",
        icon: "✦",
        premium: false,
        ...tool
      });
    },

    getTools() {
      return Array.from(tools.values());
    },

    getTool(id) {
      return tools.get(id);
    },

    field,
    button,
    setOutput,
    setStatus,
    showToast
  };

  // Make the tool API available before any tool file is imported.
  window.WazirAura = WazirAura;

  function renderTools() {
    const grid = $("#tools-grid");
    if (!grid) return;

    const search = ($("#tool-search")?.value || "").trim().toLowerCase();

    const filtered = WazirAura.getTools().filter(tool => {
      const matchesCategory =
        activeCategory === "All" || tool.category === activeCategory;

      const searchable =
        `${tool.name} ${tool.description} ${tool.category}`.toLowerCase();

      return matchesCategory && searchable.includes(search);
    });

    grid.replaceChildren();

    filtered.forEach(tool => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "tool-card";
      card.dataset.openTool = tool.id;
      card.setAttribute("aria-label", `Open ${tool.name}`);

      card.innerHTML = `
        <div class="tool-card-top">
          <span class="tool-icon">${escapeHTML(tool.icon)}</span>
          <span class="tool-label">${escapeHTML(tool.category)}</span>
        </div>
        <h3>${escapeHTML(tool.name)}</h3>
        <p>${escapeHTML(tool.description)}</p>
        <span class="tool-open">Open tool <span aria-hidden="true">→</span></span>
      `;

      grid.appendChild(card);
    });

    const count = $("#visible-tool-count");
    if (count) count.textContent = String(filtered.length);

    const total = $("#tool-count");
    if (total) total.textContent = String(tools.size);

    const empty = $("#no-tools-message");
    if (empty) {
      empty.classList.toggle("is-hidden", filtered.length > 0);
    }

    if (tools.size > 0) {
      setLoadingStatus("");
    }
  }

  function openTool(id) {
    const tool = WazirAura.getTool(id);
    if (!tool) {
      showToast("This tool could not be found.");
      return;
    }

    activeTool = tool;

    const section = $("#workspace");
    const title = $("#workspace-title");
    const description = $("#workspace-description");
    const content = $("#workspace-content");
    const placeholder = $("#workspace-placeholder");

    if (!section || !content) return;

    if (title) title.textContent = tool.name;
    if (description) description.textContent = tool.description;

    content.replaceChildren();
    setStatus("");

    if (placeholder) placeholder.classList.add("is-hidden");

    try {
      const rendered = tool.render({
        field,
        button,
        setOutput,
        setStatus,
        showToast
      });

      if (typeof rendered === "string") {
        content.innerHTML = rendered;
      } else if (rendered instanceof HTMLElement) {
        content.appendChild(rendered);
      } else {
        content.textContent = "This tool did not return a valid interface.";
      }
    } catch (error) {
      console.error("Tool render error:", error);
      content.textContent = "This tool could not be opened. Please check its JavaScript file.";
    }

    section.classList.remove("is-hidden");
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function runActiveTool(form) {
    if (!activeTool || typeof activeTool.run !== "function") {
      showToast("This tool is not ready yet.");
      return;
    }

    const submitButton = $('button[type="submit"]', form);
    const oldButtonText = submitButton?.textContent;

    const input = {};
    new FormData(form).forEach((value, key) => {
      input[key] = value;
    });

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Working...";
    }

    setStatus("Processing your request...");

    try {
      const result = await activeTool.run({
        input,
        tool: activeTool,
        setOutput,
        setStatus,
        showToast
      });

      if (result !== undefined && result !== null) {
        if (typeof result === "object" && "text" in result) {
          setOutput(result.text);
        } else if (typeof result === "string") {
          setOutput(result);
        } else {
          setOutput(JSON.stringify(result, null, 2));
        }
      }

      setStatus("Finished.");
    } catch (error) {
      console.error("Tool run error:", error);
      setOutput(`Something went wrong: ${error?.message || "Unknown error"}`);
      setStatus("Request failed.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = oldButtonText || "Run";
      }
    }
  }

  async function loadTools() {
    setLoadingStatus("Discovering tools...");

    try {
      const response = await fetch(TOOLS_API, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store"
      });

      if (response.status === 404) {
        setLoadingStatus("No tools folder found yet. Add your first file: tools/chat.js");
        renderTools();
        return;
      }

      if (response.status === 403) {
        throw new Error("GitHub API rate limit reached. Please try again later.");
      }

      if (!response.ok) {
        throw new Error(`GitHub returned status ${response.status}.`);
      }

      const files = await response.json();

      if (!Array.isArray(files)) {
        throw new Error("The tools folder could not be read.");
      }

      const jsFiles = files.filter(file =>
        file.type === "file" &&
        /\.js$/i.test(file.name) &&
        file.download_url
      );

      if (jsFiles.length === 0) {
        setLoadingStatus("No tool files found. Add a JavaScript file inside tools/.");
        renderTools();
        return;
      }

      let loaded = 0;
      const failed = [];

      for (const file of jsFiles) {
        try {
          const sourceResponse = await fetch(file.download_url, {
            cache: "no-store"
          });

          if (!sourceResponse.ok) {
            throw new Error(`Could not download ${file.name}.`);
          }

          const source = await sourceResponse.text();
          const blob = new Blob([source], { type: "text/javascript" });
          const moduleURL = URL.createObjectURL(blob);

          try {
            await import(moduleURL);
            loaded++;
          } finally {
            URL.revokeObjectURL(moduleURL);
          }
        } catch (error) {
          console.error(`Failed to load ${file.name}:`, error);
          failed.push(file.name);
        }
      }

      renderTools();

      if (loaded === 0) {
        setLoadingStatus(
          failed.length
            ? `No tools loaded. Check these files: ${failed.join(", ")}`
            : "No tools registered. Check that each file calls window.WazirAura.registerTool(...)."
        );
      } else if (failed.length) {
        setLoadingStatus(
          `${loaded} tool(s) loaded. Could not load: ${failed.join(", ")}`
        );
      } else {
        setLoadingStatus(`${loaded} tool(s) ready.`);
      }
    } catch (error) {
      console.error("Tool discovery error:", error);
      setLoadingStatus(
        `Could not load tools from GitHub. ${error.message} Check that the repository is public and the tools/ folder exists.`
      );
      renderTools();
    }
  }

  function setupTheme() {
    const toggle = $("#theme-toggle");

    try {
      if (localStorage.getItem("wazir-aura-theme") === "light") {
        document.body.classList.add("light-mode");
      }
    } catch (_) {}

    toggle?.addEventListener("click", () => {
      document.body.classList.toggle("light-mode");

      try {
        localStorage.setItem(
          "wazir-aura-theme",
          document.body.classList.contains("light-mode") ? "light" : "dark"
        );
      } catch (_) {}
    });
  }

  function setupMobileMenu() {
    const toggle = $("#mobile-menu-toggle");
    const nav = $("#mobile-nav");

    toggle?.addEventListener("click", () => {
      const isOpen = nav?.classList.toggle("open") || false;
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    $$("#mobile-nav a").forEach(link => {
      link.addEventListener("click", () => {
        nav?.classList.remove("open");
        toggle?.setAttribute("aria-expanded", "false");
      });
    });
  }

  function setupContactForm() {
    const form = $("#contact-form");
    if (!form) return;

    form.addEventListener("submit", event => {
      event.preventDefault();

      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const message = String(data.get("message") || "").trim();

      if (!name || !email || !message) {
        showToast("Please complete all fields.");
        return;
      }

      const subject = encodeURIComponent(`Website inquiry from ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
      );

      showToast("Opening your email app...");
      window.location.href =
        `mailto:wazirlab@proton.me?subject=${subject}&body=${body}`;
    });
  }

  function setupWorkspace() {
    $("#tools-grid")?.addEventListener("click", event => {
      const card = event.target.closest("[data-open-tool]");
      if (card) openTool(card.dataset.openTool);
    });

    $("#close-workspace")?.addEventListener("click", () => {
      $("#workspace")?.classList.add("is-hidden");
      activeTool = null;
    });

    $("#workspace-content")?.addEventListener("submit", event => {
      const form = event.target.closest("form");
      if (!form || !activeTool) return;

      event.preventDefault();
      runActiveTool(form);
    });

    $("#copy-result")?.addEventListener("click", async () => {
      const result = $("#workspace-result");
      const text = result?.textContent?.trim();

      if (!text) {
        showToast("There is no result to copy yet.");
        return;
      }

      try {
        await navigator.clipboard.writeText(text);
        showToast("Result copied.");
      } catch (_) {
        const area = document.createElement("textarea");
        area.value = text;
        document.body.appendChild(area);
        area.select();

        const copied = document.execCommand("copy");
        area.remove();

        showToast(copied ? "Result copied." : "Could not copy the result.");
      }
    });

    $("#download-result")?.addEventListener("click", () => {
      const text = $("#workspace-result")?.textContent?.trim();

      if (!text) {
        showToast("There is no result to download yet.");
        return;
      }

      const blobURL = URL.createObjectURL(
        new Blob([text], { type: "text/plain;charset=utf-8" })
      );

      const link = document.createElement("a");
      link.href = blobURL;
      link.download = `${(activeTool?.id || "wazir-aura")}-result.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobURL);
    });
  }

  function setupToolFilters() {
    $("#tool-search")?.addEventListener("input", renderTools);

    $("#category-tabs")?.addEventListener("click", event => {
      const tab = event.target.closest("[data-category]");
      if (!tab) return;

      activeCategory = tab.dataset.category || "All";

      $$("#category-tabs [data-category]").forEach(button => {
        const active = button === tab;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });

      renderTools();
    });
  }

  function init() {
    const year = $("#current-year");
    if (year) year.textContent = String(new Date().getFullYear());

    setupTheme();
    setupMobileMenu();
    setupContactForm();
    setupWorkspace();
    setupToolFilters();
    renderTools();
    loadTools();
  }

  init();
})();

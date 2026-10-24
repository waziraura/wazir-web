"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const toastContainer = $("#toast-container");
  const modal = $("#tool-modal");
  const modalTitle = $("#modal-title");
  const modalContent = $("#modal-content");
  const toolSearch = $("#tool-search");
  const toolCards = $$(".tool-card");
  const emptyState = $("#empty-state");

  let activeFilter = "all";
  let currentTool = "";
  let lastFocusedElement = null;
  let favorites = new Set();
  let qrInstance = null;

  try {
    favorites = new Set(JSON.parse(localStorage.getItem("wa-favorites") || "[]"));
  } catch {
    favorites = new Set();
  }

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast${type === "error" ? " error" : ""}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    window.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(6px)";
      window.setTimeout(() => toast.remove(), 220);
    }, 2800);
  }

  function safeCopy(text) {
    if (text == null || text === "") {
      showToast("There is no result to copy.", "error");
      return Promise.resolve(false);
    }

    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(String(text))
        .then(() => {
          showToast("Copied to clipboard!");
          return true;
        })
        .catch(() => fallbackCopy(text));
    }
    return fallbackCopy(text);
  }

  function fallbackCopy(text) {
    const area = document.createElement("textarea");
    area.value = String(text);
    area.style.position = "fixed";
    area.style.left = "-9999px";
    area.setAttribute("readonly", "");
    document.body.appendChild(area);
    area.select();

    let success = false;
    try {
      success = document.execCommand("copy");
    } catch {
      success = false;
    }

    area.remove();
    if (success) {
      showToast("Copied to clipboard!");
      return Promise.resolve(true);
    }
    showToast("Copy failed. Select the text and copy it manually.", "error");
    return Promise.resolve(false);
  }

  function saveFavorites() {
    try {
      localStorage.setItem("wa-favorites", JSON.stringify([...favorites]));
    } catch {
      showToast("Browser storage is unavailable.", "error");
    }
    updateFavoritesUI();
  }

  function updateFavoritesUI() {
    $$(".tool-card").forEach(card => {
      const button = $(".favorite-button", card);
      if (!button) return;
      const saved = favorites.has(card.dataset.tool);
      button.textContent = saved ? "♥" : "♡";
      button.setAttribute("aria-pressed", String(saved));
    });
    filterTools();
  }

  function filterTools() {
    const query = (toolSearch?.value || "").trim().toLowerCase();
    let visible = 0;

    toolCards.forEach(card => {
      const isFavorite = favorites.has(card.dataset.tool);
      const matchesCategory = activeFilter === "all"
        || activeFilter === card.dataset.category
        || (activeFilter === "favorites" && isFavorite);
      const searchable = [
        card.dataset.name,
        card.dataset.description,
        card.dataset.category
      ].join(" ").toLowerCase();
      const matchesQuery = !query || searchable.includes(query);
      const show = matchesCategory && matchesQuery;
      card.hidden = !show;
      if (show) visible++;
    });

    $("#tool-count").textContent = String(visible);
    emptyState.hidden = visible !== 0;
  }

  $("#tool-filters").addEventListener("click", event => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    activeFilter = button.dataset.filter;
    $$(".filter-button").forEach(item => item.classList.toggle("active", item === button));
    filterTools();
  });

  toolSearch.addEventListener("input", filterTools);

  $("#clear-search").addEventListener("click", () => {
    toolSearch.value = "";
    activeFilter = "all";
    $$(".filter-button").forEach(item => item.classList.toggle("active", item.dataset.filter === "all"));
    filterTools();
    toolSearch.focus();
  });

  $("#tools-grid").addEventListener("click", event => {
    const favoriteButton = event.target.closest(".favorite-button");
    if (favoriteButton) {
      const card = favoriteButton.closest(".tool-card");
      const id = card.dataset.tool;
      favorites.has(id) ? favorites.delete(id) : favorites.add(id);
      saveFavorites();
      showToast(favorites.has(id) ? "Added to saved tools." : "Removed from saved tools.");
      return;
    }

    const openButton = event.target.closest("[data-open-tool]");
    if (openButton) openTool(openButton.dataset.openTool);
  });

  function openModal(id, title) {
    lastFocusedElement = document.activeElement;
    currentTool = id;
    modalTitle.textContent = title;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    $("#modal-reset").hidden = false;
    modalContent.scrollTop = 0;

    requestAnimationFrame(() => {
      const focusable = $("textarea, input:not([type=hidden]), select, button", modalContent);
      if (focusable) focusable.focus();
    });
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    currentTool = "";
    qrInstance = null;
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  $("#modal-close").addEventListener("click", closeModal);
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
    if (event.key === "/" && modal.hidden && !/input|textarea/i.test(document.activeElement.tagName)) {
      event.preventDefault();
      toolSearch.focus();
    }
  });

  function actionsHTML() {
    return `
      <div class="form-actions">
        <button type="button" class="button button-primary" data-action="run">Run tool</button>
        <button type="button" class="button button-ghost" data-action="copy">Copy result</button>
        <button type="button" class="button button-ghost" data-action="download">Download result</button>
      </div>
      <div class="result-box">
        <div class="result-title"><span>OUTPUT</span><span data-output-status>Ready</span></div>
        <pre data-result aria-live="polite">Your result will appear here.</pre>
      </div>`;
  }

  function toolTemplate(id) {
    const templates = {
      "word-counter": `
        <div class="tool-form">
          <div><label for="wc-input">Your text</label><textarea id="wc-input" placeholder="Paste or type your text here..."></textarea></div>
          <div class="result-stats" id="wc-stats">
            <div class="result-stat"><strong>0</strong><small>Words</small></div>
            <div class="result-stat"><strong>0</strong><small>Characters</small></div>
            <div class="result-stat"><strong>0</strong><small>Sentences</small></div>
            <div class="result-stat"><strong>0</strong><small>Paragraphs</small></div>
          </div>
          <div class="inline-note" id="wc-reading">Estimated reading time: 0 min</div>
          <div class="form-actions"><button type="button" class="button button-ghost" data-action="clear">Clear text</button><button type="button" class="button button-primary" data-action="copy-input">Copy text</button></div>
        </div>`,
      "case-converter": `
        <div class="tool-form">
          <div><label for="case-input">Input text</label><textarea id="case-input" placeholder="Enter text to transform..."></textarea></div>
          <div class="form-actions">
            <button class="button button-ghost" data-case="upper" type="button">UPPERCASE</button>
            <button class="button button-ghost" data-case="lower" type="button">lowercase</button>
            <button class="button button-ghost" data-case="title" type="button">Title Case</button>
            <button class="button button-ghost" data-case="sentence" type="button">Sentence case</button>
            <button class="button button-ghost" data-case="alternating" type="button">aLtErNaTiNg</button>
          </div>
          <div><label for="case-output">Converted text</label><textarea id="case-output" placeholder="Your converted text will appear here..."></textarea></div>
          <div class="form-actions"><button class="button button-primary" data-action="copy-case" type="button">Copy output</button></div>
        </div>`,
      "json-formatter": `
        <div class="tool-form">
          <div><label for="json-input">JSON input</label><textarea class="code-area" id="json-input" spellcheck="false" placeholder='{"name":"Wazir Aura","active":true}'></textarea></div>
          <div class="form-actions"><button class="button button-primary" data-action="format-json" type="button">Format JSON</button><button class="button button-ghost" data-action="minify-json" type="button">Minify</button><button class="button button-ghost" data-action="validate-json" type="button">Validate</button></div>
          <div class="result-box"><div class="result-title"><span>OUTPUT</span><span data-output-status>Ready</span></div><pre data-result>Formatted JSON will appear here.</pre></div>
          <div class="form-actions"><button class="button button-ghost" data-action="copy" type="button">Copy result</button><button class="button button-ghost" data-action="download" type="button">Download JSON</button></div>
        </div>`,
      "password-generator": `
        <div class="tool-form">
          <div><label for="pw-length">Password length: <strong id="pw-length-value">20</strong></label><input id="pw-length" type="range" min="8" max="64" value="20"></div>
          <div class="check-options">
            <label><input id="pw-upper" type="checkbox" checked> Uppercase</label>
            <label><input id="pw-lower" type="checkbox" checked> Lowercase</label>
            <label><input id="pw-numbers" type="checkbox" checked> Numbers</label>
            <label><input id="pw-symbols" type="checkbox" checked> Symbols</label>
          </div>
          <div class="result-box"><div class="result-title"><span>GENERATED PASSWORD</span><span data-output-status>Ready</span></div><pre data-result>Click generate to create a password.</pre></div>
          <div class="form-actions"><button class="button button-primary" data-action="generate-password" type="button">Generate password</button><button class="button button-ghost" data-action="copy" type="button">Copy password</button></div>
          <p class="inline-note">Generate passwords locally in this browser. Do not share your passwords.</p>
        </div>`,
      "base64": `
        <div class="tool-form">
          <div><label for="b64-input">Input text</label><textarea class="code-area" id="b64-input" placeholder="Enter text or Base64 here..."></textarea></div>
          <div class="form-actions"><button class="button button-primary" data-action="base64-encode" type="button">Encode</button><button class="button button-ghost" data-action="base64-decode" type="button">Decode</button></div>
          <div><label for="b64-output">Output</label><textarea class="code-area" id="b64-output" readonly placeholder="Result will appear here..."></textarea></div>
          <div class="form-actions"><button class="button button-ghost" data-action="copy-b64" type="button">Copy output</button><button class="button button-ghost" data-action="clear-b64" type="button">Clear</button></div>
        </div>`,
      "qr-generator": `
        <div class="tool-form">
          <div><label for="qr-input">Text or URL</label><input id="qr-input" type="text" placeholder="https://example.com"></div>
          <div class="form-row"><div><label for="qr-size">QR code size</label><select id="qr-size"><option value="180">Small</option><option value="240" selected>Medium</option><option value="320">Large</option></select></div><div><label for="qr-color">Foreground color</label><input id="qr-color" type="color" value="#10152c"></div></div>
          <div class="form-actions"><button class="button button-primary" data-action="make-qr" type="button">Generate QR code</button><button class="button button-ghost" data-action="download-qr" type="button">Download PNG</button></div>
          <div id="qr-output"><span style="color:#777;font-size:12px">Your QR code will appear here.</span></div>
          <p class="inline-note">QR generation requires the QRCode library to load from its CDN.</p>
        </div>`,
      "color-picker": `
        <div class="tool-form">
          <div class="form-row"><div><label for="color-input">Choose a color</label><input id="color-input" type="color" value="#80f7ff"></div><div><label for="color-hex">HEX value</label><input id="color-hex" value="#80F7FF" spellcheck="false"></div></div>
          <div class="color-preview" id="color-preview" style="background:#80f7ff"></div>
          <div class="form-row"><div><label for="color-rgb">RGB</label><input id="color-rgb" readonly></div><div><label for="color-hsl">HSL</label><input id="color-hsl" readonly></div></div>
          <div class="form-actions"><button class="button button-primary" data-action="copy-hex" type="button">Copy HEX</button><button class="button button-ghost" data-action="copy-rgb" type="button">Copy RGB</button><button class="button button-ghost" data-action="copy-hsl" type="button">Copy HSL</button></div>
        </div>`,
      "unit-converter": `
        <div class="tool-form">
          <div class="form-row"><div><label for="unit-type">Category</label><select id="unit-type"><option value="length">Length</option><option value="weight">Weight</option><option value="temperature">Temperature</option><option value="volume">Volume</option></select></div><div><label for="unit-value">Value</label><input id="unit-value" type="number" value="1" step="any"></div></div>
          <div class="form-row"><div><label for="unit-from">From</label><select id="unit-from"></select></div><div><label for="unit-to">To</label><select id="unit-to"></select></div></div>
          <div class="result-box"><div class="result-title"><span>CONVERSION RESULT</span></div><pre data-result>1 m = 100 cm</pre></div>
          <div class="form-actions"><button class="button button-primary" data-action="convert-unit" type="button">Convert units</button><button class="button button-ghost" data-action="swap-units" type="button">⇄ Swap units</button><button class="button button-ghost" data-action="copy" type="button">Copy result</button></div>
        </div>`,
      "markdown-preview": `
        <div class="tool-form">
          <div><label for="md-input">Markdown source</label><textarea id="md-input" class="code-area" placeholder="# Hello world&#10;&#10;Write **bold** text, lists, links and code here."></textarea></div>
          <div class="result-title"><span>LIVE PREVIEW</span><span>Basic Markdown</span></div>
          <div class="markdown-preview" id="md-preview">Your preview will appear here.</div>
          <div class="form-actions"><button class="button button-ghost" data-action="copy-md" type="button">Copy source</button><button class="button button-ghost" data-action="download-md" type="button">Download .md</button></div>
          <p class="inline-note">Raw HTML is escaped for safety. Only basic Markdown formatting is supported.</p>
        </div>`,
      "text-diff": `
        <div class="tool-form">
          <div class="form-row"><div><label for="diff-a">Original text</label><textarea id="diff-a" placeholder="Original lines..."></textarea></div><div><label for="diff-b">New text</label><textarea id="diff-b" placeholder="Updated lines..."></textarea></div></div>
          <div class="form-actions"><button class="button button-primary" data-action="compare-text" type="button">Compare texts</button><button class="button button-ghost" data-action="copy-diff" type="button">Copy comparison</button></div>
          <div class="result-box"><div class="result-title"><span>COMPARISON</span><span data-output-status>Ready</span></div><div data-diff-result>No comparison yet.</div></div>
          <p class="inline-note"><span style="color:#9bffce">+ Added</span> · <span style="color:#ff9db9">− Removed</span></p>
        </div>`,
      "text-cleaner": `
        <div class="tool-form">
          <div><label for="clean-input">Input text</label><textarea id="clean-input" placeholder="Paste text with extra spaces or empty lines..."></textarea></div>
          <div class="check-options"><label><input type="checkbox" id="clean-spaces" checked> Remove extra spaces</label><label><input type="checkbox" id="clean-lines" checked> Remove empty lines</label><label><input type="checkbox" id="clean-trim" checked> Trim each line</label></div>
          <div><label for="clean-output">Cleaned text</label><textarea id="clean-output" readonly placeholder="Cleaned result..."></textarea></div>
          <div class="form-actions"><button class="button button-primary" data-action="clean-text" type="button">Clean text</button><button class="button button-ghost" data-action="copy-clean" type="button">Copy output</button><button class="button button-ghost" data-action="clear-clean" type="button">Clear</button></div>
        </div>`,
      "url-encoder": `
        <div class="tool-form">
          <div><label for="url-input">Text or URL component</label><textarea class="code-area" id="url-input" placeholder="Enter text to encode or decode..."></textarea></div>
          <div class="form-actions"><button class="button button-primary" data-action="url-encode" type="button">Encode component</button><button class="button button-ghost" data-action="url-decode" type="button">Decode component</button></div>
          <div><label for="url-output">Result</label><textarea class="code-area" id="url-output" readonly placeholder="Result appears here..."></textarea></div>
          <div class="form-actions"><button class="button button-ghost" data-action="copy-url" type="button">Copy result</button><button class="button button-ghost" data-action="clear-url" type="button">Clear</button></div>
        </div>`
    };
    return templates[id] || "<p>Tool unavailable.</p>";
  }

  const toolTitles = {
    "word-counter": "Word Counter",
    "case-converter": "Case Converter",
    "json-formatter": "JSON Formatter",
    "password-generator": "Password Generator",
    "base64": "Base64 Converter",
    "qr-generator": "QR Code Generator",
    "color-picker": "Color Studio",
    "unit-converter": "Unit Converter",
    "markdown-preview": "Markdown Preview",
    "text-diff": "Text Diff Checker",
    "text-cleaner": "Text Cleaner",
    "url-encoder": "URL Encoder / Decoder"
  };

  function openTool(id) {
    const card = $(`[data-tool="${id}"]`);
    if (!card || !toolTitles[id]) {
      showToast("That tool could not be found.", "error");
      return;
    }
    modalContent.innerHTML = toolTemplate(id);
    openModal(id, toolTitles[id]);
    initializeTool(id);
  }

  function initializeTool(id) {
    if (id === "word-counter") {
      $("#wc-input").addEventListener("input", updateWordCount);
      updateWordCount();
    }

    if (id === "password-generator") {
      $("#pw-length").addEventListener("input", () => {
        $("#pw-length-value").textContent = $("#pw-length").value;
      });
      generatePassword();
    }

    if (id === "color-picker") {
      $("#color-input").addEventListener("input", updateColor);
      $("#color-hex").addEventListener("change", () => {
        const hex = $("#color-hex").value.trim();
        if (/^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
          let normalized = hex.replace("#", "");
          if (normalized.length === 3) normalized = normalized.split("").map(c => c + c).join("");
          $("#color-input").value = `#${normalized}`;
          updateColor();
        } else {
          showToast("Enter a valid HEX color.", "error");
        }
      });
      updateColor();
    }

    if (id === "unit-converter") {
      $("#unit-type").addEventListener("change", populateUnitOptions);
      $("#unit-value").addEventListener("input", convertUnit);
      $("#unit-from").addEventListener("change", convertUnit);
      $("#unit-to").addEventListener("change", convertUnit);
      populateUnitOptions();
    }

    if (id === "markdown-preview") {
      $("#md-input").addEventListener("input", renderMarkdown);
      renderMarkdown();
    }

    if (id === "text-diff") {
      $("#diff-a").addEventListener("input", compareText);
      $("#diff-b").addEventListener("input", compareText);
    }
  }

  function updateWordCount() {
    const text = $("#wc-input").value;
    const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
    const characters = text.length;
    const sentences = (text.match(/[.!?]+(?=\s|$)/g) || []).length + (text.trim() && !/[.!?]\s*$/.test(text.trim()) ? 1 : 0);
    const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).filter(p => p.trim()).length : 0;
    const values = [words, characters, sentences, paragraphs];
    $$("#wc-stats .result-stat strong").forEach((el, index) => el.textContent = String(values[index]));
    $("#wc-reading").textContent = `Estimated reading time: ${words ? Math.max(1, Math.ceil(words / 200)) : 0} min`;
  }

  function generatePassword() {
    const length = Number($("#pw-length").value);
    let pool = "";
    const groups = [];
    if ($("#pw-upper").checked) groups.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    if ($("#pw-lower").checked) groups.push("abcdefghijklmnopqrstuvwxyz");
    if ($("#pw-numbers").checked) groups.push("0123456789");
    if ($("#pw-symbols").checked) groups.push("!@#$%^&*()-_=+[]{};:,.?");
    pool = groups.join("");

    if (!pool) {
      setResult("Select at least one character type.", "Choose options", true);
      return;
    }

    const cryptoObject = window.crypto;
    if (!cryptoObject || !cryptoObject.getRandomValues) {
      setResult("Secure random generation is unavailable in this browser.", "Unavailable", true);
      return;
    }

    const randomIndex = max => {
      const array = new Uint32Array(1);
      cryptoObject.getRandomValues(array);
      return array[0] % max;
    };

    const chars = groups.map(group => group[randomIndex(group.length)]);
    while (chars.length < length) chars.push(pool[randomIndex(pool.length)]);

    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomIndex(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    setResult(chars.join(""), "Generated");
  }

  function setResult(value, status = "Done", isError = false) {
    const output = $("[data-result]", modalContent);
    const statusEl = $("[data-output-status]", modalContent);
    if (output) output.textContent = String(value);
    if (statusEl) {
      statusEl.textContent = status;
      statusEl.className = isError ? "error-note" : "success-note";
    }
  }

  function getResult() {
    const output = $("[data-result]", modalContent);
    return output ? output.textContent : "";
  }

  function downloadFile(filename, content, type = "text/plain;charset=utf-8") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Downloading ${filename}`);
  }

  function safeDecodeBase64(value) {
    const binary = atob(value.trim());
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  }

  function encodeBase64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;
    if (max === min) h = s = 0;
    else {
      const d = max - min;
      s = l > .5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  function updateColor() {
    const hex = $("#color-input").value.toUpperCase();
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    $("#color-hex").value = hex;
    $("#color-rgb").value = `rgb(${r}, ${g}, ${b})`;
    $("#color-hsl").value = rgbToHsl(r, g, b);
    $("#color-preview").style.background = hex;
  }

  const unitDefinitions = {
    length: {
      m: ["Meters (m)", 1],
      km: ["Kilometers (km)", 1000],
      cm: ["Centimeters (cm)", .01],
      mm: ["Millimeters (mm)", .001],
      mi: ["Miles (mi)", 1609.344],
      yd: ["Yards (yd)", .9144],
      ft: ["Feet (ft)", .3048],
      in: ["Inches (in)", .0254]
    },
    weight: {
      kg: ["Kilograms (kg)", 1],
      g: ["Grams (g)", .001],
      mg: ["Milligrams (mg)", .000001],
      lb: ["Pounds (lb)", .45359237],
      oz: ["Ounces (oz)", .028349523125],
      t: ["Metric tonnes (t)", 1000]
    },
    temperature: {
      C: ["Celsius (°C)"],
      F: ["Fahrenheit (°F)"],
      K: ["Kelvin (K)"]
    },
    volume: {
      L: ["Liters (L)", 1],
      mL: ["Milliliters (mL)", .001],
      m3: ["Cubic meters (m³)", 1000],
      gal: ["US gallons (gal)", 3.785411784],
      cup: ["US cups", .2365882365],
      pt: ["US pints", .473176473]
    }
  };

  function populateUnitOptions() {
    const category = $("#unit-type").value;
    const definitions = unitDefinitions[category];
    const from = $("#unit-from");
    const to = $("#unit-to");
    from.replaceChildren();
    to.replaceChildren();

    Object.entries(definitions).forEach(([key, value]) => {
      from.add(new Option(value[0], key));
      to.add(new Option(value[0], key));
    });

    if (category === "length") { from.value = "m"; to.value = "cm"; }
    if (category === "weight") { from.value = "kg"; to.value = "lb"; }
    if (category === "temperature") { from.value = "C"; to.value = "F"; }
    if (category === "volume") { from.value = "L"; to.value = "mL"; }
    convertUnit();
  }

  function convertTemperature(value, from, to) {
    let celsius;
    if (from === "C") celsius = value;
    else if (from === "F") celsius = (value - 32) * 5 / 9;
    else celsius = value - 273.15;

    if (to === "C") return celsius;
    if (to === "F") return celsius * 9 / 5 + 32;
    return celsius + 273.15;
  }

  function convertUnit() {
    const category = $("#unit-type").value;
    const value = Number($("#unit-value").value);
    const from = $("#unit-from").value;
    const to = $("#unit-to").value;

    if (!Number.isFinite(value)) {
      setResult("Enter a valid number.", "Invalid input", true);
      return;
    }

    let result;
    if (category === "temperature") {
      result = convertTemperature(value, from, to);
    } else {
      result = value * unitDefinitions[category][from][1] / unitDefinitions[category][to][1];
    }

    const formatted = Number(result.toPrecision(10)).toLocaleString("en-US", { maximumFractionDigits: 8 });
    setResult(`${value} ${from} = ${formatted} ${to}`, "Converted");
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function renderInlineMarkdown(text) {
    let escaped = escapeHTML(text);
    escaped = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    escaped = escaped.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    escaped = escaped.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    escaped = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
    return escaped;
  }

  function markdownToHTML(source) {
    const lines = source.split(/\r?\n/);
    const output = [];
    let listType = "";
    let inCode = false;
    let codeLines = [];

    const closeList = () => {
      if (listType) {
        output.push(`</${listType}>`);
        listType = "";
      }
    };

    for (const line of lines) {
      if (/^\s*```/.test(line)) {
        closeList();
        if (inCode) {
          output.push(`<pre><code>${escapeHTML(codeLines.join("\n"))}</code></pre>`);
          codeLines = [];
          inCode = false;
        } else {
          inCode = true;
        }
        continue;
      }

      if (inCode) {
        codeLines.push(line);
        continue;
      }

      if (!line.trim()) {
        closeList();
        continue;
      }

      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        closeList();
        const level = heading[1].length;
        output.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
        continue;
      }

      const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
      const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
      if (unordered || ordered) {
        const nextType = unordered ? "ul" : "ol";
        if (listType !== nextType) {
          closeList();
          listType = nextType;
          output.push(`<${listType}>`);
        }
        output.push(`<li>${renderInlineMarkdown((unordered || ordered)[1])}</li>`);
        continue;
      }

      closeList();
      output.push(`<p>${renderInlineMarkdown(line)}</p>`);
    }

    closeList();
    if (inCode) output.push(`<pre><code>${escapeHTML(codeLines.join("\n"))}</code></pre>`);
    return output.join("\n") || "Your preview will appear here.";
  }

  function renderMarkdown() {
    $("#md-preview").innerHTML = markdownToHTML($("#md-input").value);
  }

  function compareText() {
    const a = $("#diff-a").value.split("\n");
    const b = $("#diff-b").value.split("\n");
    const result = [];
    const max = Math.max(a.length, b.length);

    for (let i = 0; i < max; i++) {
      if (i >= a.length) {
        result.push({ type: "added", text: `+ ${b[i]}` });
      } else if (i >= b.length) {
        result.push({ type: "removed", text: `− ${a[i]}` });
      } else if (a[i] === b[i]) {
        result.push({ type: "same", text: `  ${a[i]}` });
      } else {
        result.push({ type: "removed", text: `− ${a[i]}` });
        result.push({ type: "added", text: `+ ${b[i]}` });
      }
    }

    const container = $("[data-diff-result]");
    container.replaceChildren();

    result.forEach(item => {
      const line = document.createElement("div");
      line.className = `diff-line diff-${item.type}`;
      line.textContent = item.text;
      container.appendChild(line);
    });

    const status = $("[data-output-status]");
    if (status) status.textContent = `${result.length} lines`;
  }

  function currentDiffText() {
    return $$(".diff-line", modalContent).map(line => line.textContent).join("\n");
  }

  modalContent.addEventListener("click", async event => {
    const caseButton = event.target.closest("[data-case]");
    if (caseButton) {
      const input = $("#case-input").value;
      const mode = caseButton.dataset.case;
      let result = input;

      if (mode === "upper") result = input.toUpperCase();
      if (mode === "lower") result = input.toLowerCase();
      if (mode === "title") {
        result = input.toLowerCase().replace(/\b[\p{L}\p{N}]/gu, char => char.toUpperCase());
      }
      if (mode === "sentence") {
        result = input.toLowerCase().replace(/(^\s*[a-z]|[.!?]\s+[a-z])/g, match => match.toUpperCase());
      }
      if (mode === "alternating") {
        let index = 0;
        result = [...input].map(char => {
          if (!/[a-z]/i.test(char)) return char;
          return index++ % 2 === 0 ? char.toLowerCase() : char.toUpperCase();
        }).join("");
      }

      $("#case-output").value = result;
      showToast("Text converted.");
      return;
    }

    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;

    try {
      switch (action) {
        case "run":
          showToast("This tool is ready.");
          break;

        case "copy":
          await safeCopy(getResult());
          break;

        case "download":
          downloadFile(currentTool === "json-formatter" ? "formatted.json" : `${currentTool || "result"}.txt`, getResult());
          break;

        case "clear": {
          $("#wc-input").value = "";
          updateWordCount();
          showToast("Text cleared.");
          break;
        }

        case "copy-input":
          await safeCopy($("#wc-input").value);
          break;

        case "copy-case":
          await safeCopy($("#case-output").value);
          break;

        case "format-json":
        case "minify-json":
        case "validate-json": {
          const source = $("#json-input").value.trim();
          if (!source) {
            setResult("Enter JSON first.", "No input", true);
            break;
          }
          try {
            const parsed = JSON.parse(source);
            const output = action === "minify-json" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
            setResult(action === "validate-json" ? "Valid JSON ✓" : output, "Valid JSON");
          } catch (error) {
            setResult(`Invalid JSON: ${error.message}`, "Validation failed", true);
          }
          break;
        }

        case "generate-password":
          generatePassword();
          break;

        case "base64-encode":
          $("#b64-output").value = encodeBase64($("#b64-input").value);
          break;

        case "base64-decode":
          try {
            $("#b64-output").value = safeDecodeBase64($("#b64-input").value);
          } catch {
            $("#b64-output").value = "";
            showToast("Invalid Base64 or unsupported text encoding.", "error");
          }
          break;

        case "copy-b64":
          await safeCopy($("#b64-output").value);
          break;

        case "clear-b64":
          $("#b64-input").value = "";
          $("#b64-output").value = "";
          break;

        case "make-qr": {
          const value = $("#qr-input").value.trim();
          if (!value) {
            showToast("Enter text or a URL first.", "error");
            break;
          }
          if (typeof QRCode === "undefined") {
            showToast("QR library failed to load. Check your internet connection.", "error");
            break;
          }
          const output = $("#qr-output");
          output.replaceChildren();
          qrInstance = new QRCode(output, {
            text: value,
            width: Number($("#qr-size").value),
            height: Number($("#qr-size").value),
            colorDark: $("#qr-color").value,
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
          });
          showToast("QR code generated.");
          break;
        }

        case "download-qr": {
          const qr = $("#qr-output");
          const canvas = $("canvas", qr);
          const image = $("img", qr);
          let dataURL = "";
          if (canvas) dataURL = canvas.toDataURL("image/png");
          else if (image && image.src.startsWith("data:image")) dataURL = image.src;
          if (!dataURL) {
            showToast("Generate a QR code first.", "error");
            break;
          }
          const anchor = document.createElement("a");
          anchor.href = dataURL;
          anchor.download = "wazir-aura-qr.png";
          anchor.click();
          showToast("QR code downloaded.");
          break;
        }

        case "copy-hex":
          await safeCopy($("#color-hex").value);
          break;
        case "copy-rgb":
          await safeCopy($("#color-rgb").value);
          break;
        case "copy-hsl":
          await safeCopy($("#color-hsl").value);
          break;

        case "convert-unit":
          convertUnit();
          break;

        case "swap-units": {
          const from = $("#unit-from");
          const to = $("#unit-to");
          const oldFrom = from.value;
          from.value = to.value;
          to.value = oldFrom;
          convertUnit();
          break;
        }

        case "copy-md":
          await safeCopy($("#md-input").value);
          break;
        case "download-md":
          downloadFile("wazir-aura-notes.md", $("#md-input").value, "text/markdown;charset=utf-8");
          break;

        case "compare-text":
          compareText();
          break;
        case "copy-diff":
          await safeCopy(currentDiffText());
          break;

        case "clean-text": {
          let result = $("#clean-input").value;
          if ($("#clean-trim").checked) result = result.split("\n").map(line => line.trim()).join("\n");
          if ($("#clean-spaces").checked) result = result.replace(/[ \t]{2,}/g, " ");
          if ($("#clean-lines").checked) result = result.split("\n").filter(line => line.trim()).join("\n");
          $("#clean-output").value = result;
          showToast("Text cleaned.");
          break;
        }

        case "copy-clean":
          await safeCopy($("#clean-output").value);
          break;

        case "clear-clean":
          $("#clean-input").value = "";
          $("#clean-output").value = "";
          break;

        case "url-encode":
          $("#url-output").value = encodeURIComponent($("#url-input").value);
          break;

        case "url-decode":
          try {
            $("#url-output").value = decodeURIComponent($("#url-input").value);
          } catch {
            $("#url-output").value = "";
            showToast("Invalid encoded URL text.", "error");
          }
          break;

        case "copy-url":
          await safeCopy($("#url-output").value);
          break;

        case "clear-url":
          $("#url-input").value = "";
          $("#url-output").value = "";
          break;
      }
    } catch (error) {
      console.error(error);
      showToast("Something went wrong. Check your input and try again.", "error");
    }
  });

  $("#modal-reset").addEventListener("click", () => {
    if (!currentTool) return;
    const id = currentTool;
    modalContent.innerHTML = toolTemplate(id);
    initializeTool(id);
    showToast("Tool reset.");
  });

  const themeToggle = $("#theme-toggle");
  let savedTheme = "dark";
  try {
    savedTheme = localStorage.getItem("wa-theme") || "dark";
  } catch {
    savedTheme = "dark";
  }

  function applyTheme(theme) {
    document.body.classList.toggle("light-theme", theme === "light");
    themeToggle.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");
    themeToggle.title = theme === "light" ? "Switch to dark theme" : "Switch to light theme";
    const icon = $("svg", themeToggle);
    if (icon) {
      icon.innerHTML = theme === "light"
        ? '<path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z"/>'
        : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41m0-14.14-1.41 1.41M6.34 17.66l-1.41 1.41"/>';
    }
  }

  applyTheme(savedTheme);
  themeToggle.addEventListener("click", () => {
    const theme = document.body.classList.contains("light-theme") ? "dark" : "light";
    applyTheme(theme);
    try {
      localStorage.setItem("wa-theme", theme);
    } catch {
      // Theme still works for the current session.
    }
    showToast(`${theme === "light" ? "Light" : "Dark"} theme enabled.`);
  });

  const menuToggle = $("#menu-toggle");
  const mainNav = $("#main-nav");

  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  $$(".nav-link", mainNav).forEach(link => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });

  const backToTop = $("#back-to-top");
  window.addEventListener("scroll", () => {
    backToTop.classList.toggle("visible", window.scrollY > 500);

    const sections = ["home", "tools", "features", "about"];
    let current = "home";
    sections.forEach(id => {
      const section = document.getElementById(id);
      if (section && window.scrollY >= section.offsetTop - 160) current = id;
    });
    $$(".nav-link").forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${current}`));
  }, { passive: true });

  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  $("#current-year").textContent = String(new Date().getFullYear());

  function setupStarfield() {
    const canvas = $("#starfield");
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let stars = [];
    let animationFrame = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const count = Math.min(260, Math.max(90, Math.floor(width * height / 5200)));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.25 + .25,
        alpha: Math.random() * .65 + .25,
        twinkle: Math.random() * .015 + .002,
        direction: Math.random() > .5 ? 1 : -1,
        tint: Math.random() > .91 ? "128,247,255" : Math.random() > .95 ? "255,142,232" : "220,229,255"
      }));
      draw();
    }

    function draw() {
      context.clearRect(0, 0, width, height);

      stars.forEach(star => {
        if (!reducedMotion) {
          star.alpha += star.twinkle * star.direction;
          if (star.alpha > .95 || star.alpha < .2) star.direction *= -1;
        }

        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${star.tint},${star.alpha})`;
        context.fill();

        if (star.radius > 1.15) {
          context.fillStyle = `rgba(${star.tint},${star.alpha * .3})`;
          context.fillRect(star.x - 3, star.y, 6, .5);
          context.fillRect(star.x, star.y - 3, .5, 6);
        }
      });

      if (!reducedMotion) animationFrame = requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize);
    resize();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(animationFrame);
      else if (!reducedMotion) draw();
    });
  }

  setupStarfield();
  updateFavoritesUI();

  window.setTimeout(() => {
    $("#welcome-screen").classList.add("hide");
  }, 3000);
});

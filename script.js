"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const MAX_TEXT_LENGTH = 200000;
let activeTool = null;
let toastTimer = null;
let selectedCategory = "all";
let lastOutputFilename = "wazir-aura-output.txt";

function toast(message) {
  const element = $("#toast");
  if (!element) return;
  element.textContent = message;
  element.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("visible"), 3000);
}

function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function clampText(value) {
  return String(value ?? "").slice(0, MAX_TEXT_LENGTH);
}

function field(label, id, options = {}) {
  const { type = "textarea", placeholder = "", value = "", help = "", maxlength = MAX_TEXT_LENGTH } = options;
  if (type === "select") {
    const choices = options.choices || [];
    return `
      <div class="workspace-field">
        <label for="${id}">${escapeHTML(label)}</label>
        <select id="${id}">
          ${choices.map(choice => `<option value="${escapeHTML(choice.value)}">${escapeHTML(choice.label)}</option>`).join("")}
        </select>
        ${help ? `<span class="field-help">${escapeHTML(help)}</span>` : ""}
      </div>`;
  }

  if (type === "input") {
    return `
      <div class="workspace-field">
        <label for="${id}">${escapeHTML(label)}</label>
        <input id="${id}" maxlength="${Math.min(Number(maxlength) || MAX_TEXT_LENGTH, MAX_TEXT_LENGTH)}" placeholder="${escapeHTML(placeholder)}" value="${escapeHTML(value)}">
        ${help ? `<span class="field-help">${escapeHTML(help)}</span>` : ""}
      </div>`;
  }

  return `
    <div class="workspace-field">
      <label for="${id}">${escapeHTML(label)}</label>
      <textarea id="${id}" maxlength="${Math.min(Number(maxlength) || MAX_TEXT_LENGTH, MAX_TEXT_LENGTH)}" placeholder="${escapeHTML(placeholder)}" spellcheck="false">${escapeHTML(value)}</textarea>
      ${help ? `<span class="field-help">${escapeHTML(help)}</span>` : ""}
    </div>`;
}

function button(label, action, icon = "sparkles", variant = "primary") {
  return `<button type="button" class="button button-${variant}" data-action="${escapeHTML(action)}"><i data-lucide="${escapeHTML(icon)}"></i>${escapeHTML(label)}</button>`;
}

function openWorkspace(toolId) {
  const tool = TOOL_DEFINITIONS[toolId];
  if (!tool) {
    toast("This tool could not be opened.");
    return;
  }

  activeTool = toolId;
  $("#workspace-title").innerHTML = `${escapeHTML(tool.title)} <span class="gradient-text">workspace.</span>`;
  $("#workspace-description").textContent = tool.description;
  $("#workspace-placeholder").classList.add("hidden");
  $("#workspace-content").classList.remove("hidden");
  $("#workspace-result-wrap").classList.add("hidden");
  $("#workspace-result").value = "";
  $("#workspace-status").textContent = "";
  $("#workspace-controls").innerHTML = tool.render();
  lastOutputFilename = `${toolId}-output.txt`;
  refreshIcons();

  $("#workspace").scrollIntoView({ behavior: "smooth", block: "start" });
}

function setOutput(text, filename = "wazir-aura-output.txt") {
  const output = clampText(text);
  $("#workspace-result").value = output;
  $("#workspace-result-wrap").classList.remove("hidden");
  $("#workspace-status").textContent = `${output.length.toLocaleString()} characters`;
  lastOutputFilename = filename;
}

function readField(id) {
  const element = document.getElementById(id);
  return element ? clampText(element.value) : "";
}

function actionHandler(action) {
  const status = $("#workspace-status");

  switch (action) {
    case "make-prompt": {
      const idea = readField("prompt-idea").trim();
      const kind = readField("prompt-kind");
      const tone = readField("prompt-tone");
      const extra = readField("prompt-extra").trim();
      if (!idea) return toast("Pehle apna idea likho.");

      const result = `ROLE
You are a helpful ${kind} assistant.

GOAL
${idea}

STYLE
${tone}

REQUIREMENTS
- Understand the request before making assumptions.
- Be specific, practical and well structured.
- Explain important decisions.
- If information is missing, ask concise clarifying questions.
- Avoid inventing facts, sources or capabilities.
${extra ? `\nADDITIONAL REQUIREMENTS\n${extra}` : ""}

OUTPUT
Provide a clear, useful response that the user can refine.`;
      setOutput(result, "creative-prompt.txt");
      return;
    }

    case "make-image-prompt":
    case "make-video-prompt":
    case "make-logo-prompt":
    case "make-website-prompt":
    case "make-game-prompt":
    case "make-study-prompt": {
      const idea = readField("creative-idea").trim();
      const style = readField("creative-style");
      const details = readField("creative-details").trim();
      if (!idea) return toast("Pehle apna idea likho.");

      const recipes = {
        "make-image-prompt": {
          title: "Image generation prompt",
          output: `Create an image based on this concept: ${idea}\n\nVisual style: ${style}\nComposition: clear focal point, balanced framing, intentional lighting, refined details.\nQuality: polished, coherent, high-quality visual storytelling.\nAvoid: distorted details, unwanted text, watermarks and visual clutter.\nAdditional notes: ${details || "Use creative judgment while preserving the concept."}\n\nGenerate the image using an image-generation provider that supports your chosen model.`
        },
        "make-video-prompt": {
          title: "Short video prompt",
          output: `Create a short video about: ${idea}\n\nStyle: ${style}\nStructure:\n1. Hook in the opening seconds.\n2. Clear visual progression.\n3. Engaging middle scene.\n4. Memorable closing shot.\n\nCamera: deliberate framing and smooth transitions.\nAudio: appropriate ambience or music if supported.\nAdditional notes: ${details || "Keep the story concise and visually consistent."}\n\nGenerate the video using a compatible video-generation service.`
        },
        "make-logo-prompt": {
          title: "Logo and branding prompt",
          output: `Design a professional visual identity for: ${idea}\n\nStyle direction: ${style}\nRequirements:\n- Distinctive and recognizable silhouette.\n- Strong legibility at small sizes.\n- Balanced spacing and scalable composition.\n- Deliberate color palette and contrast.\n- Present a primary logo and a simplified icon concept.\n- Avoid generic stock imagery and unnecessary detail.\nAdditional notes: ${details || "Show the design on a clean neutral background."}\n\nUse a design or image-generation tool to render the final artwork.`
        },
        "make-website-prompt": {
          title: "Website development prompt",
          output: `Build a responsive website for: ${idea}\n\nVisual direction: ${style}\nTechnology: semantic HTML, modern CSS and vanilla JavaScript unless otherwise specified.\nRequirements:\n- Responsive desktop, tablet and mobile layouts.\n- Accessible navigation and keyboard interactions.\n- Clear visual hierarchy and consistent spacing.\n- Working forms and buttons with validation.\n- Loading, empty, success and error states where relevant.\n- Secure handling of user input and API credentials.\n- Keep components organized and provide setup instructions.\nAdditional notes: ${details || "Include a polished landing page, about section, features and contact area."}\n\nReturn complete, runnable files and explain any external dependencies. Do not claim backend features work unless implemented.`
        },
        "make-game-prompt": {
          title: "2D game development prompt",
          output: `Create a playable 2D game based on: ${idea}\n\nArt direction: ${style}\nRequirements:\n- Responsive game canvas or game engine layout.\n- Clear movement and interaction controls.\n- Collision detection and game state management.\n- Start, pause, restart and game-over states.\n- Score display and increasing challenge.\n- Keyboard controls plus touch controls where practical.\n- Clean, commented code and setup instructions.\nAdditional notes: ${details || "Begin with a complete small playable prototype."}\n\nUse a suitable engine such as Phaser or a browser canvas implementation. Include all required code and assets or explain how to obtain them.`
        },
        "make-study-prompt": {
          title: "Study assistant prompt",
          output: `Help me learn: ${idea}\n\nLearning style: ${style}\nPlease provide:\n1. A beginner-friendly explanation.\n2. Key concepts and definitions.\n3. A worked example where relevant.\n4. Common mistakes and how to avoid them.\n5. Short revision notes.\n6. Five practice questions, with answers separated at the end.\nAdditional notes: ${details || "Adapt the difficulty to the learner and explain unfamiliar terminology."}\n\nBe accurate, distinguish facts from uncertainty and do not invent citations.`
        }
      };

      const item = recipes[action];
      setOutput(item.output, `${action.replace("make-", "")}.txt`);
      return;
    }

    case "make-code-prompt": {
      const idea = readField("code-idea").trim();
      const language = readField("code-language");
      const purpose = readField("code-purpose");
      if (!idea) return toast("Describe the code you need first.");

      setOutput(
        `Act as a careful software developer.\n\nTask: ${idea}\nLanguage/stack: ${language}\nTarget: ${purpose}\n\nRequirements:\n- Return complete runnable code, not fragments, unless requested.\n- Include every required file and clear filenames.\n- Validate inputs and handle errors.\n- Avoid unsafe evaluation of untrusted code.\n- Explain setup, dependencies and execution.\n- Include a small test or usage example.\n- Do not hardcode secrets or API keys.\n- State any assumptions and limitations.\n\nIf this code will power a website or 2D game, include instructions for integrating and testing it.`,
        "code-generation-prompt.txt"
      );
      return;
    }

    case "save-note": {
      const note = readField("note-content");
      try {
        localStorage.setItem("wazir-aura-note", note);
        status.textContent = "Note saved in this browser.";
        toast("Note saved on this device.");
      } catch {
        toast("Browser storage is unavailable. Download your note instead.");
      }
      return;
    }

    case "load-note": {
      try {
        const note = localStorage.getItem("wazir-aura-note");
        if (note === null) return toast("No saved note found in this browser.");
        $("#note-content").value = note;
        toast("Saved note loaded.");
      } catch {
        toast("Could not access browser storage.");
      }
      return;
    }

    case "download-note":
      downloadText(readField("note-content"), "wazir-aura-note.txt");
      toast("Note downloaded.");
      return;

    case "clear-note":
      $("#note-content").value = "";
      toast("Note cleared from the editor.");
      return;

    case "count-words": {
      const text = readField("word-input");
      const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
      const sentences = text.trim() ? (text.match(/[.!?]+(?=\s|$)/g) || []).length : 0;
      const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
      $("#word-stats").innerHTML = `
        <div class="inline-stat"><strong>${words.toLocaleString()}</strong> words</div>
        <div class="inline-stat"><strong>${text.length.toLocaleString()}</strong> characters</div>
        <div class="inline-stat"><strong>${text.replace(/\s/g, "").length.toLocaleString()}</strong> no spaces</div>
        <div class="inline-stat"><strong>${sentences.toLocaleString()}</strong> sentences</div>
        <div class="inline-stat"><strong>${lines.toLocaleString()}</strong> lines</div>
        <div class="inline-stat"><strong>${Math.ceil(words / 200)}</strong> min reading</div>`;
      status.textContent = "Counts updated.";
      return;
    }

    case "format-json": {
      const raw = readField("json-input").trim();
      if (!raw) return toast("Paste JSON to format.");
      try {
        const parsed = JSON.parse(raw);
        setOutput(JSON.stringify(parsed, null, 2), "formatted.json");
        toast("Valid JSON formatted.");
      } catch (error) {
        status.textContent = `Invalid JSON: ${error.message}`;
        toast("JSON syntax error. Check the output status.");
      }
      return;
    }

    case "minify-json": {
      const raw = readField("json-input").trim();
      try {
        if (!raw) return toast("Paste JSON to minify.");
        setOutput(JSON.stringify(JSON.parse(raw)), "minified.json");
      } catch (error) {
        status.textContent = `Invalid JSON: ${error.message}`;
      }
      return;
    }

    case "encode-base64": {
      const value = readField("base64-input");
      try {
        setOutput(btoa(unescape(encodeURIComponent(value))), "encoded-base64.txt");
      } catch {
        toast("Could not encode this text.");
      }
      return;
    }

    case "decode-base64": {
      const value = readField("base64-input").trim();
      try {
        setOutput(decodeURIComponent(escape(atob(value))), "decoded-text.txt");
      } catch {
        toast("Invalid Base64 or unsupported encoded text.");
      }
      return;
    }

    case "convert-case": {
      const value = readField("case-input");
      const type = readField("case-type");
      let result = value;

      if (type === "upper") result = value.toLocaleUpperCase();
      if (type === "lower") result = value.toLocaleLowerCase();
      if (type === "title") {
        result = value.toLocaleLowerCase().replace(/(^|[\s([{])([\p{L}\p{N}])/gu, (_, prefix, character) => prefix + character.toLocaleUpperCase());
      }
      if (type === "sentence") {
        result = value.toLocaleLowerCase().replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, match => match.toLocaleUpperCase());
      }
      setOutput(result, "converted-text.txt");
      return;
    }

    case "generate-password": {
      const length = Math.min(128, Math.max(8, Number(readField("password-length")) || 20));
      const symbols = $("#password-symbols")?.checked ?? true;
      const numbers = $("#password-numbers")?.checked ?? true;
      const lowercase = "abcdefghijkmnopqrstuvwxyz";
      const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
      const digits = "23456789";
      const punctuation = "!@#$%^&*()-_=+[]{}?";
      let chars = lowercase + uppercase;
      if (numbers) chars += digits;
      if (symbols) chars += punctuation;

      if (!window.crypto || !window.crypto.getRandomValues) {
        toast("Secure random generation is not available in this browser.");
        return;
      }

      const random = new Uint32Array(length);
      window.crypto.getRandomValues(random);
      const password = Array.from(random, number => chars[number % chars.length]).join("");
      setOutput(password, "generated-password.txt");
      return;
    }

    case "render-markdown": {
      const raw = readField("markdown-input");
      const safePreview = markdownToSafeHTML(raw);
      $("#markdown-preview").innerHTML = safePreview;
      status.textContent = "Basic Markdown preview updated. HTML is escaped.";
      setOutput(raw, "notes.md");
      return;
    }

    case "speak-text": {
      const value = readField("tts-input").trim();
      if (!value) return toast("Enter some text to speak.");
      if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
        return toast("Text-to-speech is not supported in this browser.");
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(value);
      const voices = window.speechSynthesis.getVoices();
      const selectedName = readField("tts-voice");
      if (selectedName) {
        const selectedVoice = voices.find(voice => voice.name === selectedName);
        if (selectedVoice) utterance.voice = selectedVoice;
      }
      utterance.rate = Number(readField("tts-rate")) || 1;
      utterance.pitch = Number(readField("tts-pitch")) || 1;
      utterance.onstart = () => { status.textContent = "Speaking…"; };
      utterance.onend = () => { status.textContent = "Speech finished."; };
      utterance.onerror = () => { status.textContent = "Speech playback failed."; };
      window.speechSynthesis.speak(utterance);
      return;
    }

    case "stop-speech":
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      status.textContent = "Speech stopped.";
      return;

    case "copy-result":
      copyText($("#workspace-result").value);
      return;

    case "download-result":
      downloadText($("#workspace-result").value, lastOutputFilename);
      toast("Output downloaded.");
      return;

    default:
      toast("This action is not available yet.");
  }
}

function markdownToSafeHTML(markdown) {
  let html = escapeHTML(markdown);
  html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/^\s*-\s+(.*)$/gm, "• $1");
  html = html.replace(/\n/g, "<br>");
  return html;
}

function downloadText(text, filename) {
  const blob = new Blob([String(text ?? "")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      if (!copied) throw new Error("Copy failed");
    }
    toast("Copied to clipboard.");
  } catch {
    toast("Copy failed. Select the text and copy it manually.");
  }
}

const TOOL_DEFINITIONS = {
  assistant: {
    title: "AI Prompt Assistant",
    description: "Create a reusable prompt for an AI service. This tool prepares the prompt; it does not itself call an AI model.",
    render: () => `
      ${field("What do you want help with?", "prompt-idea", { placeholder: "Ask a question or describe your idea..." })}
      ${field("Task type", "prompt-kind", { type: "select", choices: [
        { value: "general-purpose AI", label: "General questions" },
        { value: "writing", label: "Writing and content" },
        { value: "research", label: "Research and analysis" },
        { value: "programming", label: "Programming" },
        { value: "learning and tutoring", label: "Study and learning" },
        { value: "creative brainstorming", label: "Creative brainstorming" }
      ]})}
      ${field("Response style", "prompt-tone", { type: "select", choices: [
        { value: "Clear, friendly and concise", label: "Clear and friendly" },
        { value: "Detailed and step-by-step", label: "Detailed step-by-step" },
        { value: "Professional and structured", label: "Professional" },
        { value: "Beginner-friendly", label: "Beginner-friendly" }
      ]})}
      ${field("Additional instructions", "prompt-extra", { placeholder: "Optional details, requirements or constraints..." })}
      <div class="workspace-toolbar">${button("Build prompt", "make-prompt", "sparkles")}</div>
      <p class="field-help">To receive a real AI answer, connect a secure server endpoint and an AI provider.</p>`
  },

  image: {
    title: "Image Generator",
    description: "Prepare an image prompt. Rendering images requires a connected image-generation service.",
    render: () => `
      ${field("Describe the image", "creative-idea", { placeholder: "A futuristic city floating above the clouds..." })}
      ${field("Visual style", "creative-style", { type: "select", choices: [
        { value: "Cinematic photorealism", label: "Cinematic realism" },
        { value: "3D illustration", label: "3D illustration" },
        { value: "Anime-inspired illustration", label: "Anime-inspired" },
        { value: "Minimal vector art", label: "Minimal vector" },
        { value: "Watercolor painting", label: "Watercolor" },
        { value: "Fantasy concept art", label: "Fantasy concept art" }
      ]})}
      ${field("Extra details", "creative-details", { placeholder: "Aspect ratio, colors, lighting, subject placement..." })}
      <div class="workspace-toolbar">${button("Build image prompt", "make-image-prompt", "image")}</div>`
  },

  video: {
    title: "Short Video Studio",
    description: "Build a video prompt and scene plan. Actual video rendering needs a video-generation provider.",
    render: () => `
      ${field("Video concept", "creative-idea", { placeholder: "A 20-second product reveal for a futuristic gadget..." })}
      ${field("Video style", "creative-style", { type: "select", choices: [
        { value: "Cinematic and dramatic", label: "Cinematic" },
        { value: "Fast-paced social media reel", label: "Social media reel" },
        { value: "Documentary", label: "Documentary" },
        { value: "Animated explainer", label: "Animated explainer" },
        { value: "3D product showcase", label: "3D product showcase" }
      ]})}
      ${field("Extra requirements", "creative-details", { placeholder: "Duration, aspect ratio, narration, audience..." })}
      <div class="workspace-toolbar">${button("Build video prompt", "make-video-prompt", "clapperboard")}</div>`
  },

  logo: {
    title: "Logo & Banner Lab",
    description: "Create a design brief for your brand or social media artwork.",
    render: () => `
      ${field("Brand or design idea", "creative-idea", { placeholder: "A modern tech brand named..." })}
      ${field("Visual direction", "creative-style", { type: "select", choices: [
        { value: "Premium modern minimalism", label: "Premium minimal" },
        { value: "Futuristic 3D", label: "Futuristic 3D" },
        { value: "Bold geometric branding", label: "Bold geometric" },
        { value: "Elegant luxury", label: "Elegant luxury" },
        { value: "Playful colorful illustration", label: "Playful and colorful" }
      ]})}
      ${field("Details", "creative-details", { placeholder: "Colors, initials, symbol, target audience, platform..." })}
      <div class="workspace-toolbar">${button("Build design prompt", "make-logo-prompt", "shapes")}</div>`
  },

  website: {
    title: "Website Builder",
    description: "Generate a development specification for a website. Real AI code generation needs an API backend.",
    render: () => `
      ${field("Website idea", "creative-idea", { placeholder: "A portfolio, business site, online tool..." })}
      ${field("Visual style", "creative-style", { type: "select", choices: [
        { value: "Premium dark interface with subtle 3D details", label: "Premium dark 3D" },
        { value: "Clean light SaaS interface", label: "Clean SaaS" },
        { value: "Colorful creative portfolio", label: "Creative portfolio" },
        { value: "Minimal editorial design", label: "Editorial minimal" }
      ]})}
      ${field("Features and requirements", "creative-details", { placeholder: "Pages, forms, accounts, data, integrations..." })}
      <div class="workspace-toolbar">${button("Build website prompt", "make-website-prompt", "panels-top-left")}</div>`
  },

  game: {
    title: "2D Game Creator",
    description: "Prepare a complete game-development prompt for a browser game or game engine.",
    render: () => `
      ${field("Game concept", "creative-idea", { placeholder: "A platform game where the player explores..." })}
      ${field("Art style", "creative-style", { type: "select", choices: [
        { value: "Pixel art", label: "Pixel art" },
        { value: "Cartoon 2D", label: "Cartoon 2D" },
        { value: "Neon cyberpunk", label: "Neon cyberpunk" },
        { value: "Minimal vector graphics", label: "Minimal vector" }
      ]})}
      ${field("Mechanics and features", "creative-details", { placeholder: "Movement, enemies, levels, controls, score..." })}
      <div class="workspace-toolbar">${button("Build game prompt", "make-game-prompt", "gamepad-2")}</div>`
  },

  code: {
    title: "Code Workbench",
    description: "Write, edit and download long code snippets locally. Code execution is intentionally not enabled here.",
    render: () => `
      ${field("What should the code do?", "code-idea", { placeholder: "Describe the feature or program..." })}
      ${field("Language or stack", "code-language", { type: "select", choices: [
        { value: "HTML, CSS and JavaScript", label: "HTML / CSS / JavaScript" },
        { value: "Python", label: "Python" },
        { value: "JavaScript", label: "JavaScript" },
        { value: "TypeScript", label: "TypeScript" },
        { value: "Phaser 3 with JavaScript", label: "Phaser 3 game" },
        { value: "C#", label: "C#" }
      ]})}
      ${field("Target project", "code-purpose", { type: "select", choices: [
        { value: "A web application", label: "Website or web app" },
        { value: "A 2D game", label: "2D game" },
        { value: "A reusable utility", label: "Utility or script" },
        { value: "A learning example", label: "Learning example" }
      ]})}
      ${field("Prompt details", "code-extra", { placeholder: "Optional requirements, files, libraries and constraints..." })}
      <div class="workspace-toolbar">${button("Build code prompt", "make-code-prompt", "code-2")}</div>
      <div class="workspace-field">
        <label for="code-pad">Your code / project notes</label>
        <textarea id="code-pad" maxlength="200000" placeholder="Paste or write up to 200,000 characters here..."></textarea>
      </div>
      <div class="workspace-toolbar">
        <button type="button" class="button button-ghost" data-action="download-code"><i data-lucide="download"></i> Download code</button>
        <button type="button" class="button button-ghost" data-action="copy-code"><i data-lucide="copy"></i> Copy code</button>
      </div>`
  },

  study: {
    title: "Study Companion",
    description: "Prepare a structured study prompt for a connected AI assistant or use it as a study outline.",
    render: () => `
      ${field("Subject or question", "creative-idea", { placeholder: "Explain photosynthesis, calculus, programming..." })}
      ${field("Level", "creative-style", { type: "select", choices: [
        { value: "Beginner-friendly", label: "Beginner" },
        { value: "School level", label: "School" },
        { value: "College and university", label: "College / university" },
        { value: "Advanced technical", label: "Advanced" }
      ]})}
      ${field("Learning preferences", "creative-details", { placeholder: "Examples, quizzes, notes, language, exam goals..." })}
      <div class="workspace-toolbar">${button("Build study prompt", "make-study-prompt", "graduation-cap")}</div>`
  },

  notepad: {
    title: "Long-form Notepad",
    description: "Write up to 200,000 characters in this browser. Saved notes remain on this device only.",
    render: () => `
      ${field("Your notes", "note-content", { placeholder: "Start writing notes, ideas, code, drafts or plans...", help: "Up to 200,000 characters. Browser storage capacity may be lower than the editor limit." })}
      <div class="workspace-toolbar">
        ${button("Save locally", "save-note", "save")}
        ${button("Load saved note", "load-note", "folder-open", "ghost")}
        ${button("Download TXT", "download-note", "download", "ghost")}
        ${button("Clear editor", "clear-note", "trash-2", "ghost")}
      </div>`
  },

  wordcount: {
    title: "Word Counter",
    description: "Count words and characters instantly. Your text stays in your browser.",
    render: () => `
      ${field("Paste or type text", "word-input", { placeholder: "Enter your text here..." })}
      <div id="word-stats" class="inline-stats">
        <div class="inline-stat"><strong>0</strong> words</div>
        <div class="inline-stat"><strong>0</strong> characters</div>
      </div>
      <div class="workspace-toolbar">${button("Update counts", "count-words", "calculator")}</div>`
  },

  json: {
    title: "JSON Formatter",
    description: "Format or minify JSON in your browser. Invalid JSON is reported without sending data anywhere.",
    render: () => `
      ${field("JSON input", "json-input", { placeholder: '{"name":"Wazir Aura","active":true}' })}
      <div class="workspace-toolbar">
        ${button("Format JSON", "format-json", "braces")}
        ${button("Minify JSON", "minify-json", "minimize-2", "ghost")}
      </div>`
  },

  base64: {
    title: "Base64 Converter",
    description: "Encode or decode text locally. Base64 is encoding, not encryption.",
    render: () => `
      ${field("Text or Base64", "base64-input", { placeholder: "Paste text or a Base64 string..." })}
      <div class="workspace-toolbar">
        ${button("Encode", "encode-base64", "lock")}
        ${button("Decode", "decode-base64", "unlock", "ghost")}
      </div>`
  },

  case: {
    title: "Case Converter",
    description: "Convert text capitalization in your browser.",
    render: () => `
      ${field("Input text", "case-input", { placeholder: "Type or paste text..." })}
      ${field("Conversion", "case-type", { type: "select", choices: [
        { value: "upper", label: "UPPERCASE" },
        { value: "lower", label: "lowercase" },
        { value: "title", label: "Title Case" },
        { value: "sentence", label: "Sentence case" }
      ]})}
      <div class="workspace-toolbar">${button("Convert text", "convert-case", "case-sensitive")}</div>`
  },

  password: {
    title: "Password Generator",
    description: "Generate a random password using the browser's cryptographic random generator.",
    render: () => `
      ${field("Password length (8–128)", "password-length", { type: "input", value: "24" })}
      <div class="workspace-field">
        <label><input id="password-numbers" type="checkbox" checked> Include numbers</label>
        <label><input id="password-symbols" type="checkbox" checked> Include symbols</label>
      </div>
      <div class="workspace-toolbar">${button("Generate password", "generate-password", "shield-check")}</div>
      <p class="field-help">Store generated passwords securely. Do not share passwords in chat or email.</p>`
  },

  markdown: {
    title: "Markdown Helper",
    description: "Write Markdown and preview basic headings, emphasis and inline code. Preview content is HTML-escaped.",
    render: () => `
      ${field("Markdown source", "markdown-input", { placeholder: "# My notes\n\nWrite **bold text**, *emphasis* and \`inline code\`..." })}
      <div class="workspace-toolbar">${button("Preview Markdown", "render-markdown", "eye")}</div>
      <div class="workspace-field">
        <label>Basic preview</label>
        <div id="markdown-preview" style="padding:16px;border:1px solid var(--border);border-radius:12px;min-height:100px;overflow-wrap:anywhere;background:var(--bg-soft);font-size:12px;"></div>
      </div>`
  },

  tts: {
    title: "Text-to-Speech Studio",
    description: "Uses voices installed in your browser/device. This does not provide a guaranteed 100+ voice library or downloadable studio-quality audio.",
    render: () => `
      ${field("Text to speak", "tts-input", { placeholder: "Type up to 200,000 characters. Long passages may need to be split for playback." })}
      ${field("Available voice", "tts-voice", { type: "select", choices: [{ value: "", label: "Loading browser voices..." }] })}
      ${field("Speech speed", "tts-rate", { type: "select", choices: [
        { value: "0.7", label: "Slow" },
        { value: "1", label: "Normal" },
        { value: "1.2", label: "Fast" },
        { value: "1.5", label: "Very fast" }
      ]})}
      ${field("Voice pitch", "tts-pitch", { type: "select", choices: [
        { value: "0.7", label: "Lower pitch" },
        { value: "1", label: "Normal pitch" },
        { value: "1.3", label: "Higher pitch" }
      ]})}
      <div class="workspace-toolbar">
        ${button("Speak text", "speak-text", "volume-2")}
        ${button("Stop", "stop-speech", "square", "ghost")}
      </div>
      <p class="field-help">Voice availability depends on your operating system, browser and installed speech engines. Premium voice services require a provider integration.</p>`
  }
};

function filterTools() {
  const query = ($("#tool-search")?.value || "").trim().toLowerCase();
  let visibleCount = 0;

  $$(".tool-card").forEach(card => {
    const matchesCategory = selectedCategory === "all" || card.dataset.category === selectedCategory;
    const matchesQuery = !query || card.textContent.toLowerCase().includes(query);
    const visible = matchesCategory && matchesQuery;
    card.classList.toggle("hidden", !visible);
    if (visible) visibleCount++;
  });

  $("#no-tools-message").classList.toggle("hidden", visibleCount > 0);
}

function setupTheme() {
  const saved = localStorage.getItem("wazir-aura-theme");
  if (saved === "light") document.body.classList.add("light-mode");

  $("#theme-toggle")?.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    const theme = document.body.classList.contains("light-mode") ? "light" : "dark";
    try { localStorage.setItem("wazir-aura-theme", theme); } catch {}
  });
}

function setupSpace() {
  const canvas = $("#space-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let stars = [];
  let animationFrame = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.min(220, Math.max(70, Math.floor(width * height / 6500)));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.25 + 0.25,
      alpha: Math.random() * 0.6 + 0.2,
      speed: Math.random() * 0.16 + 0.02,
      phase: Math.random() * Math.PI * 2
    }));
    draw(0);
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    for (const star of stars) {
      const pulse = reducedMotion ? 1 : 0.72 + Math.sin(time * 0.001 + star.phase) * 0.24;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(222, 222, 255, ${star.alpha * pulse})`;
      ctx.fill();

      if (!reducedMotion) {
        star.y -= star.speed;
        if (star.y < -2) {
          star.y = height + 2;
          star.x = Math.random() * width;
        }
      }
    }

    if (!reducedMotion) animationFrame = requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();
  if (reducedMotion) cancelAnimationFrame(animationFrame);
}

function setupSpeechVoices() {
  if (!("speechSynthesis" in window)) return;

  const populate = () => {
    if (activeTool !== "tts") return;
    const select = $("#tts-voice");
    if (!select) return;

    const voices = window.speechSynthesis.getVoices();
    const previous = select.value;
    select.innerHTML = "";

    if (!voices.length) {
      select.add(new Option("No browser voices available", ""));
      return;
    }

    select.add(new Option("Default browser voice", ""));
    voices.forEach(voice => {
      const option = new Option(`${voice.name} — ${voice.lang}${voice.default ? " (default)" : ""}`, voice.name);
      select.add(option);
    });

    if (previous && voices.some(voice => voice.name === previous)) select.value = previous;
  };

  window.speechSynthesis.onvoiceschanged = populate;
  populate();
}

function setupContactForm() {
  $("#contact-form")?.addEventListener("submit", event => {
    event.preventDefault();

    const name = $("#contact-name").value.trim();
    const email = $("#contact-email").value.trim();
    const subject = $("#contact-subject").value.trim();
    const message = $("#contact-message").value.trim();

    if (!name || !email || !subject || !message) {
      toast("Please fill in all contact fields.");
      return;
    }

    if (!$("#contact-email").checkValidity()) {
      toast("Enter a valid email address.");
      return;
    }

    const body = `Name: ${name}\nReply email: ${email}\n\n${message}`;
    const mailto = `mailto:wazirlab@proton.me?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  });
}

function setupNavigation() {
  $("#mobile-menu-toggle")?.addEventListener("click", () => {
    const menu = $("#mobile-nav");
    menu.classList.toggle("open");
    const isOpen = menu.classList.contains("open");
    $("#mobile-menu-toggle").setAttribute("aria-expanded", String(isOpen));
  });

  $$("#mobile-nav a").forEach(link => {
    link.addEventListener("click", () => {
      $("#mobile-nav").classList.remove("open");
      $("#mobile-menu-toggle")?.setAttribute("aria-expanded", "false");
    });
  });

  const navLinks = $$(".desktop-nav .nav-link");
  const sections = ["home", "tools", "about", "contact", "pricing"]
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`));
    }, { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.15, 0.4] });

    sections.forEach(section => observer.observe(section));
  }
}

function setupEventDelegation() {
  document.addEventListener("click", event => {
    const toolButton = event.target.closest("[data-open-tool]");
    if (toolButton) {
      openWorkspace(toolButton.dataset.openTool);
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
      const action = actionButton.dataset.action;

      if (action === "download-code") {
        downloadText(readField("code-pad"), "wazir-aura-code.txt");
        toast("Code downloaded.");
        return;
      }
      if (action === "copy-code") {
        copyText(readField("code-pad"));
        return;
      }
      actionHandler(action);
      return;
    }

    const planButton = event.target.closest("[data-plan]");
    if (planButton) {
      toast(`${planButton.dataset.plan}: payment is not configured yet.`);
      return;
    }
  });

  $("#category-tabs")?.addEventListener("click", event => {
    const tab = event.target.closest("[data-category]");
    if (!tab) return;
    selectedCategory = tab.dataset.category;
    $$(".category-tab").forEach(item => item.classList.toggle("selected", item === tab));
    filterTools();
  });

  $("#tool-search")?.addEventListener("input", filterTools);

  $("#close-workspace")?.addEventListener("click", () => {
    activeTool = null;
    $("#workspace-content").classList.add("hidden");
    $("#workspace-placeholder").classList.remove("hidden");
    $("#workspace-title").textContent = "Make something amazing.";
    $("#workspace-description").textContent = "Choose a tool above to get started.";
  });

  $("#copy-result")?.addEventListener("click", () => copyText($("#workspace-result").value));
  $("#download-result")?.addEventListener("click", () => {
    downloadText($("#workspace-result").value, lastOutputFilename);
    toast("Output downloaded.");
  });

  $("#workspace-controls")?.addEventListener("input", event => {
    if (event.target.id === "word-input") actionHandler("count-words");
  });
}

function setupWelcome() {
  const welcome = $("#welcome-screen");
  if (!welcome) return;
  const alreadySeen = false;

  if (alreadySeen) {
    welcome.classList.add("is-hidden");
    return;
  }

  // Welcome screen duration: exactly 3 seconds before fade-out begins.
  window.setTimeout(() => {
    welcome.classList.add("is-hidden");
  }, 3000);
}

function setupYear() {
  const year = $("#current-year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function init() {
  setupWelcome();
  setupSpace();
  setupTheme();
  setupNavigation();
  setupContactForm();
  setupEventDelegation();
  setupYear();
  setupSpeechVoices();
  filterTools();
  refreshIcons();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}

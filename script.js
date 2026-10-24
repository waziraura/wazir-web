
"use strict";

/* WAZIR AURA — standalone browser edition.
   Real AI, authentication, payments and secure quotas require a backend. */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const STORAGE = {
  notes: "wazirAura.notes.v1",
  projects: "wazirAura.projects.v1",
  theme: "wazirAura.theme.v1"
};

const tools = [
  { id: 1, name: "General AI Chat", category: "AI & Chat", icon: "✧", description: "Explore questions, ideas and general topics.", type: "ai" },
  { id: 2, name: "Study Assistant", category: "AI & Chat", icon: "▤", description: "Organize study topics and learning questions.", type: "ai" },
  { id: 3, name: "Text Writer", category: "AI & Chat", icon: "✎", description: "Prepare drafts for articles, emails and posts.", type: "ai" },
  { id: 4, name: "Summarizer", category: "AI & Chat", icon: "≡", description: "Prepare concise summaries from supplied text.", type: "ai" },
  { id: 5, name: "Translator", category: "AI & Chat", icon: "文", description: "Submit text for translation workflows.", type: "ai" },
  { id: 6, name: "Prompt Generator", category: "AI & Chat", icon: "✦", description: "Develop a clearer prompt for a creative task.", type: "ai" },
  { id: 7, name: "Research Assistant", category: "AI & Chat", icon: "⌕", description: "Organize research questions and source notes.", type: "ai" },
  { id: 8, name: "Quiz & Flashcards", category: "AI & Chat", icon: "▣", description: "Plan quiz questions and flashcard content.", type: "ai" },

  { id: 9, name: "Image Generator", category: "Image & Design", icon: "▧", description: "Prepare an image-generation brief.", type: "ai" },
  { id: 10, name: "Image Editor", category: "Image & Design", icon: "◩", description: "Describe edits you want to make to an image.", type: "ai" },
  { id: 11, name: "Background Removal", category: "Image & Design", icon: "◌", description: "Prepare a background-removal workflow.", type: "ai" },
  { id: 12, name: "Image Upscaler", category: "Image & Design", icon: "⤢", description: "Plan image enhancement requirements.", type: "ai" },
  { id: 13, name: "Image Variations", category: "Image & Design", icon: "▦", description: "Describe alternate visual concepts.", type: "ai" },
  { id: 14, name: "Logo Studio", category: "Image & Design", icon: "◈", description: "Develop a logo brief and brand direction.", type: "ai" },
  { id: 15, name: "Banner Designer", category: "Image & Design", icon: "▰", description: "Plan social and promotional banner designs.", type: "ai" },
  { id: 16, name: "Thumbnail Designer", category: "Image & Design", icon: "▣", description: "Prepare a thumbnail concept and layout.", type: "ai" },
  { id: 17, name: "Color Palette Studio", category: "Image & Design", icon: "◉", description: "Create and copy a useful color palette.", type: "palette" },
  { id: 18, name: "Image-to-Prompt Assistant", category: "Image & Design", icon: "◎", description: "Write a visual description for prompt development.", type: "ai" },

  { id: 19, name: "Short Video Generator", category: "Video & Audio", icon: "▶", description: "Prepare a short-video production brief.", type: "ai" },
  { id: 20, name: "Storyboard Creator", category: "Video & Audio", icon: "▤", description: "Outline scenes and camera directions.", type: "ai" },
  { id: 21, name: "Video Caption Generator", category: "Video & Audio", icon: "T", description: "Prepare captions from supplied content.", type: "ai" },
  { id: 22, name: "Video Editing Assistant", category: "Video & Audio", icon: "✂", description: "Plan editing steps and visual transitions.", type: "ai" },
  { id: 23, name: "Text-to-Speech", category: "Video & Audio", icon: "♫", description: "Prepare a text-to-speech request.", type: "ai" },
  { id: 24, name: "Speech-to-Text", category: "Video & Audio", icon: "♬", description: "Prepare an audio transcription workflow.", type: "ai" },
  { id: 25, name: "Voiceover Studio", category: "Video & Audio", icon: "◖", description: "Prepare voiceover scripts and delivery notes.", type: "ai" },
  { id: 26, name: "Music & Soundtrack Studio", category: "Video & Audio", icon: "♫", description: "Plan music mood, tempo and sound effects.", type: "ai" },

  { id: 27, name: "Website Builder", category: "Web & Code", icon: "⌘", description: "Draft a website brief and build a live preview in Code Lab.", type: "website" },
  { id: 28, name: "Frontend Code Generator", category: "Web & Code", icon: "</>", description: "Prepare a frontend code specification.", type: "ai" },
  { id: 29, name: "Code Explainer", category: "Web & Code", icon: "{ }", description: "Review code and prepare explanation questions.", type: "ai" },
  { id: 30, name: "Debugging Assistant", category: "Web & Code", icon: "⌁", description: "Organize error messages and debugging context.", type: "ai" },
  { id: 31, name: "HTML/CSS/JS Playground", category: "Web & Code", icon: "▣", description: "Write code and run a sandboxed preview.", type: "codelab" },
  { id: 32, name: "JSON Formatter & Validator", category: "Web & Code", icon: "{ }", description: "Format, validate and copy JSON locally.", type: "json" },
  { id: 33, name: "API Request Builder", category: "Web & Code", icon: "⇄", description: "Draft an API request. No request is sent automatically.", type: "api" },
  { id: 34, name: "Code-to-Project Workspace", category: "Web & Code", icon: "▧", description: "Save code notes and project specifications.", type: "project" },

  { id: 35, name: "2D Game Builder", category: "Game Development", icon: "▣", description: "Plan a playable game prototype and mechanics.", type: "ai" },
  { id: 36, name: "Game Character Designer", category: "Game Development", icon: "♙", description: "Develop character concepts and abilities.", type: "ai" },
  { id: 37, name: "Game Level Designer", category: "Game Development", icon: "⌖", description: "Plan levels, objectives and difficulty.", type: "ai" },
  { id: 38, name: "Game Audio Planner", category: "Game Development", icon: "♫", description: "Plan game music, ambience and sound effects.", type: "ai" },

  { id: 39, name: "Notepad & Long-Form Editor", category: "Productivity", icon: "▤", description: "Write, save and download notes locally.", type: "notepad" },
  { id: 40, name: "Business Content & Ad Copy", category: "Productivity", icon: "◈", description: "Prepare a brief for marketing and advertising copy.", type: "ai" }
];

const state = {
  currentPage: "home",
  currentTool: tools[0],
  output: "",
  editorTab: "html",
  code: {
    html: '<main class="welcome"><h1>Hello, Wazir Aura!</h1><p>Your first web preview is running.</p><button id="hello">Click me</button><p id="message"></p></main>',
    css: 'body { font-family: Arial, sans-serif; background: #f4f1ff; color: #211b3a; padding: 30px; }\n.welcome { max-width: 600px; margin: 35px auto; padding: 28px; background: white; border-radius: 18px; box-shadow: 0 8px 30px #29204b18; }\nbutton { padding: 10px 15px; border: 0; border-radius: 8px; background: #7961dc; color: white; cursor: pointer; }',
    js: 'document.getElementById("hello").addEventListener("click", () => {\n  document.getElementById("message").textContent = "Your preview works!";\n});'
  }
};

let toastTimer;
let lastFocusedElement = null;

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3000);
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    showToast("Browser storage unavailable. Please check your browser settings.");
    return false;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function getProjects() {
  const projects = readStorage(STORAGE.projects, []);
  return Array.isArray(projects) ? projects : [];
}

function getPageFromHash() {
  const hash = location.hash.replace("#", "") || "home";
  const valid = ["home", "tools", "projects", "notepad", "codelab", "pricing", "about"];
  return valid.includes(hash) ? hash : "home";
}

function navigate(page) {
  const knownPages = ["home", "tools", "projects", "notepad", "codelab", "pricing", "about", "workspace"];
  if (!knownPages.includes(page)) page = "home";

  state.currentPage = page;
  $$(".page").forEach(section => section.classList.remove("active-page"));
  const pageElement = $(`#page-${page}`);
  if (pageElement) pageElement.classList.add("active-page");

  $$(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === page);
  });

  const titles = {
    home: "Overview", tools: "All tools", projects: "Projects",
    notepad: "Notepad", codelab: "Code Lab", pricing: "Plans & pricing",
    about: "About", workspace: state.currentTool?.name || "Workspace"
  };
  $("#pageTitle").textContent = titles[page] || "Overview";
  $("#sidebar").classList.remove("open");

  if (page === "projects") renderProjects();
  if (page === "tools") renderTools();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function routeTo(page) {
  if (location.hash === `#${page}`) navigate(page);
  else location.hash = page;
}

function renderTools() {
  const search = ($("#toolSearch").value || "").trim().toLowerCase();
  const category = $("#categoryFilter").value;

  const filtered = tools.filter(tool => {
    const matchesSearch = `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(search);
    const matchesCategory = category === "all" || tool.category === category;
    return matchesSearch && matchesCategory;
  });

  $("#resultsCount").textContent = `${filtered.length} of ${tools.length} tools`;
  $("#noTools").classList.toggle("hidden", filtered.length > 0);

  $("#toolsGrid").innerHTML = filtered.map(tool => `
    <article class="tool-card">
      <span class="tool-icon ${iconClass(tool.category)}">${escapeHTML(tool.icon)}</span>
      <h3>${escapeHTML(tool.name)}</h3>
      <p>${escapeHTML(tool.description)}</p>
      <div class="tool-card-bottom">
        <span class="category-tag">${escapeHTML(tool.category)}</span>
        <button class="open-tool" data-open-tool="${tool.id}" aria-label="Open ${escapeHTML(tool.name)}">Open ↗</button>
      </div>
    </article>
  `).join("");
}

function iconClass(category) {
  if (category === "Image & Design") return "pink";
  if (category === "Video & Audio") return "cyan";
  if (category === "Web & Code") return "purple";
  if (category === "Game Development") return "orange";
  if (category === "Productivity") return "cyan";
  return "purple";
}

function openTool(id) {
  const tool = tools.find(item => item.id === Number(id));
  if (!tool) return;

  state.currentTool = tool;
  state.output = "";
  $("#workspaceIcon").textContent = tool.icon;
  $("#workspaceIcon").className = `tool-icon ${iconClass(tool.category)}`;
  $("#workspaceCategory").textContent = tool.category.toUpperCase();
  $("#workspaceTitle").textContent = tool.name;
  $("#workspaceDescription").textContent = tool.description;
  $("#promptLabel").textContent = promptLabel(tool);
  $("#workspacePrompt").value = "";
  $("#outputFormat").value = "text";
  $("#outputTitle").textContent = "Ready when you are";
  $("#workspaceOutput").innerHTML = `
    <div class="output-placeholder">
      <span>✧</span><strong>Your workspace output appears here</strong>
      <p>${escapeHTML(tool.description)} Connect a suitable backend for AI processing.</p>
    </div>`;
  $("#outputIndicator").style.background = "";
  navigate("workspace");
  $("#workspacePrompt").focus({ preventScroll: true });
}

function promptLabel(tool) {
  if (tool.type === "json") return "Paste JSON to format and validate";
  if (tool.type === "api") return "Describe the API request you want to prepare";
  if (tool.type === "website") return "Describe the website you want to build";
  if (tool.type === "codelab") return "Describe your coding task, or open Code Lab";
  if (tool.type === "palette") return "Optional: describe a color mood or brand";
  if (tool.type === "project") return "Describe the code project you want to organize";
  return `Describe your ${tool.name.toLowerCase()} request`;
}

function setOutput(text, title = "Output") {
  state.output = String(text);
  $("#outputTitle").textContent = title;
  $("#workspaceOutput").innerHTML = "";
  const pre = document.createElement("pre");
  pre.className = "output-text";
  pre.textContent = state.output;
  $("#workspaceOutput").appendChild(pre);
}

function runWorkspace() {
  const tool = state.currentTool;
  const prompt = $("#workspacePrompt").value.trim();

  if (!prompt && tool.type !== "palette") {
    showToast("Pehle apna text ya request likho.");
    $("#workspacePrompt").focus();
    return;
  }

  if (tool.type === "json") {
    try {
      const parsed = JSON.parse(prompt);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutput(formatted, "Valid JSON");
      showToast("JSON valid hai aur format ho gaya.");
    } catch (error) {
      setOutput(`JSON validation failed:\n${error.message}`, "Invalid JSON");
      showToast("JSON mein error hai. Output mein details dekho.");
    }
    return;
  }

  if (tool.type === "palette") {
    const palette = [
      { name: "Aura Violet", hex: "#A18AFF" },
      { name: "Electric Cyan", hex: "#67E6FF" },
      { name: "Cosmic Blue", hex: "#536DFA" },
      { name: "Nebula Pink", hex: "#E68CFF" },
      { name: "Deep Space", hex: "#090817" }
    ];
    const result = palette.map(color => `${color.name}: ${color.hex}`).join("\n");
    setOutput(`${prompt ? `Mood: ${prompt}\n\n` : ""}${result}`, "Wazir Aura color palette");
    showToast("Palette ready. Copy kar sakte ho.");
    return;
  }

  if (tool.type === "codelab") {
    routeTo("codelab");
    showToast("Code Lab open ho gaya.");
    return;
  }

  if (tool.type === "notepad") {
    routeTo("notepad");
    showToast("Notepad open ho gaya.");
    return;
  }

  if (tool.type === "project") {
    createProjectFromPrompt(tool.name, prompt);
    return;
  }

  if (tool.type === "website") {
    const brief = [
      "WEBSITE PROJECT BRIEF",
      "",
      `Project request: ${prompt}`,
      "",
      "Suggested next steps:",
      "1. Define the target audience and main goal.",
      "2. List the required pages and sections.",
      "3. Choose the visual style, colors and typography.",
      "4. Open Code Lab to write HTML, CSS and JavaScript.",
      "5. Test the preview at desktop and mobile sizes.",
      "",
      "Note: This is a planning brief, not an AI-generated website."
    ].join("\n");
    setOutput(brief, "Website brief prepared");
    showToast("Website brief tayar hai. Code Lab mein preview bana sakte ho.");
    return;
  }

  if (tool.type === "api") {
    const request = [
      "API REQUEST DRAFT",
      "",
      "Request description:",
      prompt,
      "",
      "Before sending a real request, configure:",
      "- Exact API URL and HTTP method",
      "- Authentication handled securely by an appropriate backend",
      "- Required headers and request body",
      "- Timeout, error handling and rate limits",
      "",
      "No network request was sent by this demo."
    ].join("\n");
    setOutput(request, "API draft prepared");
    showToast("API request ka draft tayar hai; request send nahi hui.");
    return;
  }

  setOutput(
    [
      `${tool.name} — Setup required`,
      "",
      "Tumhari request:",
      prompt,
      "",
      "Is tool ko real AI result dene ke liye secure backend aur compatible AI provider configure karna hoga.",
      "Abhi koi AI request send nahi hui aur koi generated result claim nahi kiya ja raha.",
      "",
      "Required setup:",
      "1. Suitable provider aur model choose karo.",
      "2. API key sirf server-side environment mein rakho.",
      "3. Server endpoint, input validation aur error handling implement karo.",
      "4. Usage limits aur permissions server par enforce karo.",
      "5. Real provider response ke saath is interface ko connect aur test karo."
    ].join("\n"),
    "Provider connection required"
  );
  showToast("Is feature ke liye AI backend configure karna hoga.");
}

function createProjectFromPrompt(name, description) {
  const title = name || "New project";
  openProjectModal(title, description);
}

function renderProjects() {
  const projects = getProjects();
  $("#projectsEmpty").classList.toggle("hidden", projects.length > 0);

  $("#projectsGrid").innerHTML = projects.map(project => `
    <article class="project-card">
      <span class="tool-icon purple">▧</span>
      <h3>${escapeHTML(project.name)}</h3>
      <p>${escapeHTML(project.description || "No description provided.")}</p>
      <p class="project-date">${escapeHTML(project.updatedAt || "Saved locally")}</p>
      <div class="project-card-actions">
        <button class="secondary-button" data-open-project="${escapeHTML(project.id)}">Open</button>
        <button class="secondary-button danger-button" data-delete-project="${escapeHTML(project.id)}">Delete</button>
      </div>
    </article>
  `).join("");
}

function openProjectModal(prefillName = "", prefillDescription = "") {
  lastFocusedElement = document.activeElement;
  $("#projectName").value = prefillName;
  $("#projectDescription").value = prefillDescription;
  $("#modalBackdrop").classList.remove("hidden");
  $("#projectName").focus();
}

function closeProjectModal() {
  $("#modalBackdrop").classList.add("hidden");
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

function createProject(name, description) {
  const projects = getProjects();
  const project = {
    id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    description: description.trim(),
    updatedAt: new Date().toLocaleString()
  };

  projects.unshift(project);
  if (!writeStorage(STORAGE.projects, projects)) return;
  renderProjects();
  closeProjectModal();
  showToast("Project is browser mein save ho gaya.");
}

function deleteProject(id) {
  const projects = getProjects().filter(project => project.id !== id);
  if (!writeStorage(STORAGE.projects, projects)) return;
  renderProjects();
  showToast("Project delete ho gaya.");
}

function openSavedProject(id) {
  const project = getProjects().find(item => item.id === id);
  if (!project) {
    showToast("Project nahi mila.");
    return;
  }

  openTool(34);
  $("#workspacePrompt").value =
    `Project: ${project.name}\n\nDescription:\n${project.description || "(No description)"}\n\nUpdated: ${project.updatedAt}`;
  showToast("Project details workspace mein khul gayi hain.");
}

function saveOutputAsProject() {
  if (!state.output.trim()) {
    showToast("Save karne ke liye pehle output tayar karo.");
    return;
  }
  openProjectModal(`${state.currentTool.name} output`, state.output);
}

function downloadText(filename, text, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
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
  if (!text) {
    showToast("Copy karne ke liye koi text nahi hai.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast("Text copy ho gaya.");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    let copied = false;
    try { copied = document.execCommand("copy"); } catch {}
    textarea.remove();
    showToast(copied ? "Text copy ho gaya." : "Copy nahi hua. Text select karke manually copy karo.");
  }
}

function loadNotes() {
  const notes = readStorage(STORAGE.notes, {});
  $("#noteTitle").value = typeof notes.title === "string" ? notes.title : "";
  $("#noteBody").value = typeof notes.body === "string" ? notes.body : "";
  updateWordCount();
}

let noteSaveTimer;
function saveNotes() {
  $("#noteStatus").textContent = "Saving...";
  clearTimeout(noteSaveTimer);

  noteSaveTimer = setTimeout(() => {
    const saved = writeStorage(STORAGE.notes, {
      title: $("#noteTitle").value,
      body: $("#noteBody").value,
      updatedAt: new Date().toISOString()
    });
    $("#noteStatus").textContent = saved ? "All changes saved locally" : "Save failed";
    updateWordCount();
  }, 200);
}

function updateWordCount() {
  const text = $("#noteBody").value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  $("#noteWordCount").textContent = `${words} word${words === 1 ? "" : "s"}`;
}

function clearNote() {
  if (!$("#noteTitle").value && !$("#noteBody").value) {
    showToast("Note pehle se khali hai.");
    return;
  }
  if (!confirm("Kya tum waqai current note clear karna chahte ho?")) return;
  $("#noteTitle").value = "";
  $("#noteBody").value = "";
  saveNotes();
  showToast("Note clear ho gaya.");
}

function downloadNote() {
  const title = $("#noteTitle").value.trim() || "Wazir Aura Note";
  const body = `${title}\n${"=".repeat(Math.min(title.length, 70))}\n\n${$("#noteBody").value}`;
  downloadText("wazir-aura-note.txt", body);
}

function switchEditor(tab) {
  if (!Object.hasOwn(state.code, tab)) return;
  state.editorTab = tab;
  $$(".editor-tab").forEach(button => button.classList.toggle("active", button.dataset.editor === tab));
  $("#codeEditor").value = state.code[tab];
}

function saveCurrentEditor() {
  state.code[state.editorTab] = $("#codeEditor").value;
}

function runCodePreview() {
  saveCurrentEditor();

  const html = state.code.html;
  const css = state.code.css;
  const js = state.code.js;

  // The sandboxed iframe has scripts enabled but does not receive same-origin access.
  // The generated source is intentionally executed only inside this isolated preview.
  const srcdoc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${css.replace(/<\/style/gi, "<\\/style")}</style>
</head>
<body>
${html.replace(/<\/body/gi, "<\\/body")}
<script>
try {
${js.replace(/<\/script/gi, "<\\/script")}
} catch (error) {
  const message = document.createElement("pre");
  message.textContent = "JavaScript error: " + error.message;
  document.body.appendChild(message);
}
<\/script>
</body>
</html>`;

  $("#codePreview").srcdoc = srcdoc;
  showToast("Preview update ho gaya.");
}

function resetCode() {
  if (!confirm("Code Lab ko default example par reset karna hai?")) return;

  state.code.html = '<main class="welcome"><h1>Hello, Wazir Aura!</h1><p>Your first web preview is running.</p><button id="hello">Click me</button><p id="message"></p></main>';
  state.code.css = 'body { font-family: Arial, sans-serif; background: #f4f1ff; color: #211b3a; padding: 30px; }\n.welcome { max-width: 600px; margin: 35px auto; padding: 28px; background: white; border-radius: 18px; box-shadow: 0 8px 30px #29204b18; }\nbutton { padding: 10px 15px; border: 0; border-radius: 8px; background: #7961dc; color: white; cursor: pointer; }';
  state.code.js = 'document.getElementById("hello").addEventListener("click", () => {\n  document.getElementById("message").textContent = "Your preview works!";\n});';

  switchEditor(state.editorTab);
  runCodePreview();
}

function downloadEditorFile() {
  saveCurrentEditor();
  const filenames = { html: "index.html", css: "style.css", js: "script.js" };
  const mime = { html: "text/html;charset=utf-8", css: "text/css;charset=utf-8", js: "text/javascript;charset=utf-8" };
  downloadText(filenames[state.editorTab], state.code[state.editorTab], mime[state.editorTab]);
}

function initTheme() {
  const theme = readStorage(STORAGE.theme, "dark");
  document.body.classList.toggle("light-mode", theme === "light");
  $("#themeToggle").innerHTML = theme === "light" ? "☾ <span>Switch to dark</span>" : "☼ <span>Switch appearance</span>";
}

function toggleTheme() {
  const isLight = document.body.classList.toggle("light-mode");
  writeStorage(STORAGE.theme, isLight ? "light" : "dark");
  $("#themeToggle").innerHTML = isLight ? "☾ <span>Switch to dark</span>" : "☼ <span>Switch appearance</span>";
}

function bindEvents() {
  window.addEventListener("hashchange", () => navigate(getPageFromHash()));

  document.addEventListener("click", event => {
    const toolButton = event.target.closest("[data-tool], [data-open-tool]");
    if (toolButton) {
      openTool(toolButton.dataset.tool || toolButton.dataset.openTool);
      return;
    }

    const categoryButton = event.target.closest("[data-category]");
    if (categoryButton) {
      $("#categoryFilter").value = categoryButton.dataset.category;
      $("#toolSearch").value = "";
      renderTools();
      routeTo("tools");
      return;
    }

    const goButton = event.target.closest("[data-go]");
    if (goButton) {
      event.preventDefault();
      routeTo(goButton.dataset.go);
      return;
    }

    const openProjectButton = event.target.closest("[data-open-project]");
    if (openProjectButton) {
      openSavedProject(openProjectButton.dataset.openProject);
      return;
    }

    const deleteProjectButton = event.target.closest("[data-delete-project]");
    if (deleteProjectButton) {
      deleteProject(deleteProjectButton.dataset.deleteProject);
    }
  });

  $$(".nav-link").forEach(link => link.addEventListener("click", event => {
    event.preventDefault();
    routeTo(link.dataset.page);
  }));

  $("#exploreTools").addEventListener("click", () => routeTo("tools"));
  $("#newProject").addEventListener("click", () => openProjectModal());
  $("#heroNewProject").addEventListener("click", () => openProjectModal());
  $("#projectCreateButton").addEventListener("click", () => openProjectModal());
  $("#emptyCreateProject").addEventListener("click", () => openProjectModal());
  $("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

  $("#toolSearch").addEventListener("input", renderTools);
  $("#categoryFilter").addEventListener("change", renderTools);

  $("#runWorkspace").addEventListener("click", runWorkspace);
  $("#clearWorkspace").addEventListener("click", () => {
    $("#workspacePrompt").value = "";
    state.output = "";
    $("#workspaceOutput").innerHTML = `<div class="output-placeholder"><span>✧</span><strong>Your workspace output appears here</strong><p>Enter a new request to continue.</p></div>`;
    $("#outputTitle").textContent = "Ready when you are";
  });
  $("#backToTools").addEventListener("click", () => routeTo("tools"));
  $("#copyOutput").addEventListener("click", () => copyText(state.output));
  $("#downloadOutput").addEventListener("click", () => {
    if (!state.output) return showToast("Download karne ke liye output nahi hai.");
    downloadText("wazir-aura-output.txt", state.output);
  });
  $("#saveOutput").addEventListener("click", saveOutputAsProject);

  $("#projectForm").addEventListener("submit", event => {
    event.preventDefault();
    const name = $("#projectName").value.trim();
    const description = $("#projectDescription").value.trim();
    if (!name) return showToast("Project ka naam likho.");
    createProject(name, description);
  });

  $("#closeModal").addEventListener("click", closeProjectModal);
  $("#cancelModal").addEventListener("click", closeProjectModal);
  $("#modalBackdrop").addEventListener("click", event => {
    if (event.target === $("#modalBackdrop")) closeProjectModal();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (!$("#modalBackdrop").classList.contains("hidden")) closeProjectModal();
      $("#sidebar").classList.remove("open");
    }
  });

  $("#noteTitle").addEventListener("input", saveNotes);
  $("#noteBody").addEventListener("input", saveNotes);
  $("#clearNote").addEventListener("click", clearNote);
  $("#downloadNote").addEventListener("click", downloadNote);

  $$(".editor-tab").forEach(button => button.addEventListener("click", () => {
    saveCurrentEditor();
    switchEditor(button.dataset.editor);
  }));
  $("#codeEditor").addEventListener("input", saveCurrentEditor);
  $("#runCode").addEventListener("click", runCodePreview);
  $("#resetCode").addEventListener("click", resetCode);
  $("#downloadCode").addEventListener("click", downloadEditorFile);
  $("#themeToggle").addEventListener("click", toggleTheme);

  $("#premiumInfo").addEventListener("click", () => {
    alert(
      "Premium enable karne ke liye secure backend, authentication, payment provider integration, server-side payment verification, usage quotas aur environment configuration chahiye. Is demo mein checkout active nahi hai."
    );
  });
}

function init() {
  $("#year").textContent = new Date().getFullYear();

  // Show the welcome animation once per browser tab session.
  try {
    if (sessionStorage.getItem("wazirAura.introSeen") === "1") {
      $("#intro").classList.add("finished");
    } else {
      setTimeout(() => {
        $("#intro").classList.add("finished");
        try { sessionStorage.setItem("wazirAura.introSeen", "1"); } catch {}
      }, 3000);
    }
  } catch {
    setTimeout(() => $("#intro").classList.add("finished"), 3000);
  }

  initTheme();
  loadNotes();
  renderTools();
  renderProjects();
  bindEvents();
  switchEditor("html");
  runCodePreview();
  navigate(getPageFromHash());
}

document.addEventListener("DOMContentLoaded", init);

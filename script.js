"use strict";

/* WAZIR AURA — FRONTEND WORKSPACE */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const KEYS = {
  projects: "wa_projects_v2",
  notes: "wa_notes_v2",
  theme: "wa_theme_v2",
  analytics: "wa_analytics_v2",
  code: "wa_code_v2"
};

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
  } catch {
    toast("Browser storage full ya unavailable hai.");
    return false;
  }
};

const uid = () =>
  window.crypto?.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const escapeHTML = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

const tools = [
  ["ai-chat", "AI Chat", "Prepare ideas, prompts and content briefs.", "✧", "creative", "AI"],
  ["logo-studio", "Logo Studio", "Plan a memorable brand identity.", "◈", "creative", "Design"],
  ["website-builder", "Website Builder", "Create a detailed website project brief.", "⌘", "development", "Web"],
  ["game-builder", "2D Game Builder", "Plan a playable 2D game concept.", "♧", "development", "Games"],
  ["image-prompt", "Image Prompt Studio", "Write detailed prompts for image generators.", "▧", "creative", "Design"],
  ["story-writer", "Story Writer", "Organize characters, plots and story ideas.", "✎", "creative", "Writing"],
  ["caption-maker", "Caption Maker", "Prepare social media captions.", "＠", "creative", "Social"],
  ["bio-maker", "Bio Generator", "Draft a personal or professional bio.", "◉", "creative", "Writing"],
  ["name-generator", "Name Generator", "Brainstorm names for brands and projects.", "✦", "creative", "Ideas"],
  ["color-palette", "Color Palette", "Generate a random color palette.", "◉", "creative", "Design"],
  ["gradient-maker", "Gradient Maker", "Create CSS gradient backgrounds.", "◒", "creative", "Design"],
  ["logo-brief", "Brand Brief", "Organize your branding requirements.", "◇", "creative", "Brand"],
  ["slogan-maker", "Slogan Maker", "Develop slogan ideas for your brand.", "❝", "creative", "Writing"],
  ["post-planner", "Post Planner", "Outline a social media content plan.", "▦", "productivity", "Social"],
  ["hashtag-helper", "Hashtag Planner", "Organize relevant hashtags.", "#", "creative", "Social"],
  ["email-drafter", "Email Drafter", "Draft a structured email.", "✉", "productivity", "Writing"],
  ["resume-helper", "Resume Helper", "Organize your resume information.", "▤", "productivity", "Career"],
  ["todo-planner", "Task Planner", "Break an idea into manageable tasks.", "☑", "productivity", "Planning"],
  ["project-planner", "Project Planner", "Create a project outline and milestones.", "▦", "productivity", "Planning"],
  ["meeting-notes", "Meeting Notes", "Structure agendas and meeting notes.", "▧", "productivity", "Notes"],
  ["text-counter", "Text Counter", "Count words, characters and lines.", "≡", "data", "Utility"],
  ["json-formatter", "JSON Formatter", "Format and validate JSON.", "{ }", "development", "Code"],
  ["html-starter", "HTML Starter", "Create a basic HTML starter document.", "〈/〉", "development", "Code"],
  ["css-starter", "CSS Starter", "Create a CSS starter template.", "▧", "development", "Code"],
  ["js-starter", "JavaScript Starter", "Create a JavaScript starter.", "JS", "development", "Code"],
  ["regex-helper", "Regex Notes", "Document a regular expression and its purpose.", ".*", "development", "Code"],
  ["api-planner", "API Planner", "Draft an API endpoint specification.", "⇄", "development", "Development"],
  ["sql-helper", "SQL Planner", "Draft a database query or schema idea.", "▤", "development", "Database"],
  ["markdown-helper", "Markdown Helper", "Organize content using Markdown.", "M↓", "productivity", "Writing"],
  ["data-table", "Data Organizer", "Structure information as a JSON table.", "▦", "data", "Data"],
  ["budget-planner", "Budget Planner", "Draft a simple budget breakdown.", "$", "data", "Finance"],
  ["study-planner", "Study Planner", "Build a study schedule outline.", "▣", "productivity", "Learning"],
  ["idea-board", "Idea Board", "Turn rough thoughts into organized ideas.", "✧", "productivity", "Ideas"],
  ["feedback-helper", "Feedback Form", "Draft questions for a feedback form.", "♡", "productivity", "Forms"],
  ["faq-builder", "FAQ Builder", "Prepare a frequently asked questions outline.", "?", "productivity", "Writing"],
  ["launch-planner", "Launch Planner", "Plan the steps for a product launch.", "↗", "productivity", "Planning"],
  ["portfolio-planner", "Portfolio Planner", "Outline your portfolio sections.", "▣", "creative", "Portfolio"],
  ["seo-brief", "SEO Brief", "Prepare a checklist for page SEO.", "◎", "development", "Web"],
  ["privacy-checklist", "Privacy Checklist", "Draft a privacy and security checklist.", "⌑", "development", "Security"],
  ["notepad-tool", "Quick Notepad", "Open your saved workspace notes.", "▤", "productivity", "Notes"]
];

let projects = read(KEYS.projects, []);
let notes = read(KEYS.notes, { title: "", content: "" });
let analytics = read(KEYS.analytics, null);

if (!analytics || typeof analytics !== "object") {
  analytics = {
    pageViews: {},
    toolViews: {},
    projectViews: {},
    likes: {},
    ratings: {},
    saves: 0,
    comments: [],
    events: [],
    feedback: []
  };
}

for (const key of [
  "pageViews", "toolViews", "projectViews", "likes",
  "ratings", "events", "comments", "feedback"
]) {
  if (!analytics[key]) analytics[key] =
    ["events", "comments", "feedback"].includes(key) ? [] : {};
}

if (typeof analytics.saves !== "number") analytics.saves = 0;

let currentPage = "overview";
let currentTool = null;
let currentOutput = "";
let currentCodeTab = "html";
let toastTimer;

const defaultCode = {
  html: '<main class="card">\n  <h1>Hello, Wazir Aura!</h1>\n  <p>Your creative universe starts here.</p>\n  <button onclick="this.textContent=\'It works! ✦\'">Click me</button>\n</main>',
  css: 'body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background: #101020;\n  color: white;\n  font-family: sans-serif;\n}\n.card {\n  padding: 30px;\n  border: 1px solid #a78bfa;\n  border-radius: 20px;\n  text-align: center;\n}\nbutton {\n  padding: 10px 16px;\n  border: 0;\n  border-radius: 8px;\n  cursor: pointer;\n}',
  js: 'console.log("Wazir Aura Code Lab is ready!");'
};

let code = read(KEYS.code, { ...defaultCode });

function saveAnalytics() {
  write(KEYS.analytics, analytics);
}

function recordEvent(type, name, extra = {}) {
  analytics.events.unshift({
    id: uid(),
    type,
    name,
    extra,
    at: new Date().toISOString()
  });

  analytics.events = analytics.events.slice(0, 200);
  saveAnalytics();
  renderAnalytics();
}

function toast(message) {
  const element = $("#toast");
  if (!element) return;

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    element.classList.remove("show");
  }, 2600);
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

function showPage(page) {
  const target = $(`#page-${page}`);
  if (!target) return;

  currentPage = page;

  $$(".page").forEach(element => {
    element.classList.toggle("active", element.id === `page-${page}`);
  });

  $$(".nav-link[data-page]").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const titles = {
    overview: "Overview",
    tools: "AI Tools",
    workspace: "Creative Workspace",
    projects: "Projects",
    analytics: "Analytics",
    notepad: "Notepad",
    codelab: "Code Lab",
    pricing: "Pricing",
    about: "About"
  };

  $("#pageTitle").textContent = titles[page] || "Workspace";
  $("#sidebar").classList.remove("open");

  if (page === "overview") renderOverview();
  if (page === "tools") renderTools();
  if (page === "projects") renderProjects();
  if (page === "analytics") renderAnalytics();

  recordEvent("page", page);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderOverview() {
  $("#overviewViews").textContent = Object.values(analytics.pageViews)
    .reduce((sum, value) => sum + value, 0);

  $("#overviewProjects").textContent = projects.length;
  $("#overviewTools").textContent = Object.keys(analytics.toolViews).length;

  $("#overviewLikes").textContent = Object.values(analytics.likes)
    .reduce((sum, value) => sum + value, 0);

  const activity = $("#recentActivity");
  const events = analytics.events.slice(0, 5);

  activity.innerHTML = events.length
    ? events.map(event => `
      <div class="activity-row">
        <span class="activity-dot"></span>
        <div>${escapeHTML(event.type)} — ${escapeHTML(event.name)}
          <small>${escapeHTML(formatDate(event.at))}</small>
        </div>
      </div>
    `).join("")
    : '<p class="muted">Your recent activity will appear here.</p>';
}

function renderTools() {
  const query = ($("#toolSearch")?.value || "").trim().toLowerCase();
  const category = $("#toolCategory")?.value || "all";

  const filtered = tools.filter(tool => {
    const matchesQuery = tool.slice(1, 3).join(" ").toLowerCase().includes(query);
    return matchesQuery && (category === "all" || tool[4] === category);
  });

  $("#toolsGrid").innerHTML = filtered.length
    ? filtered.map(tool => {
      const [id, name, description, icon, group, label] = tool;
      const views = analytics.toolViews[id] || 0;
      const liked = analytics.likes[id] ? "♥" : "♡";

      return `
        <article class="tool-card panel">
          <div class="tool-card-top">
            <span class="tool-icon">${escapeHTML(icon)}</span>
            <span class="eyebrow">${escapeHTML(label)}</span>
          </div>
          <h3>${escapeHTML(name)}</h3>
          <p>${escapeHTML(description)}</p>
          <div class="tool-meta">
            <span>${escapeHTML(group)}</span>
            <span>${views} views · ${liked} ${analytics.likes[id] || 0}</span>
          </div>
          <button class="btn secondary" data-tool="${escapeHTML(id)}">Open tool ↗</button>
        </article>`;
    }).join("")
    : '<div class="empty-state">No tools match your search.</div>';
}

function openTool(id) {
  const tool = tools.find(item => item[0] === id);
  if (!tool) return;

  currentTool = tool;
  analytics.toolViews[id] = (analytics.toolViews[id] || 0) + 1;

  $("#workspaceTitle").textContent = tool[1];
  $("#workspaceDescription").textContent = tool[2];
  $("#workspacePrompt").value = "";
  $("#workspaceOutput").textContent = "Your result will appear here.";
  currentOutput = "";

  const rating = analytics.ratings[id] || 0;
  $$("#workspaceRating button").forEach(button => {
    button.classList.toggle("selected", Number(button.dataset.rating) <= rating);
  });

  $("#workspaceLike").textContent = analytics.likes[id] ? "♥ Liked" : "♡ Like";

  recordEvent("tool", tool[1]);
  saveAnalytics();
  showPage("workspace");
}

function processWorkspace() {
  if (!currentTool) {
    toast("Pehle koi tool open karo.");
    return;
  }

  const prompt = $("#workspacePrompt").value.trim();
  const format = $("#outputFormat").value;

  if (!prompt) {
    toast("Pehle apni idea ya content likho.");
    $("#workspacePrompt").focus();
    return;
  }

  const id = currentTool[0];
  let result;

  if (id === "json-formatter") {
    try {
      result = JSON.stringify(JSON.parse(prompt), null, 2);
    } catch (error) {
      result = `Invalid JSON: ${error.message}`;
    }
  } else if (id === "text-counter") {
    result = JSON.stringify({
      characters: prompt.length,
      charactersWithoutSpaces: prompt.replace(/\s/g, "").length,
      words: (prompt.match(/\S+/g) || []).length,
      lines: prompt.split(/\r\n|\r|\n/).length
    }, null, 2);
  } else if (id === "color-palette") {
    const colors = Array.from({ length: 5 }, () =>
      "#" + Math.floor(Math.random() * 16777215)
        .toString(16).padStart(6, "0")
    );
    result = JSON.stringify(colors, null, 2);
  } else if (id === "gradient-maker") {
    const first = "#" + Math.floor(Math.random() * 16777215)
      .toString(16).padStart(6, "0");
    const second = "#" + Math.floor(Math.random() * 16777215)
      .toString(16).padStart(6, "0");
    result = `background: linear-gradient(135deg, ${first}, ${second});`;
  } else if (id === "html-starter") {
    result = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
</head>
<body>
  <h1>${escapeHTML(prompt)}</h1>
</body>
</html>`;
  } else if (id === "css-starter") {
    result = `/* Project styles */\n:root {\n  --accent: #a78bfa;\n}\n\nbody {\n  margin: 0;\n  font-family: sans-serif;\n}\n\n/* Requirements:\n${prompt.replace(/\*\//g, "* /")}\n*/`;
  } else if (id === "js-starter") {
    result = `// Project: ${prompt.replace(/\n/g, " ")}\n"use strict";\n\nfunction init() {\n  console.log("Project initialized");\n}\n\ninit();`;
  } else if (id === "markdown-helper") {
    result = `# ${prompt.split("\n")[0]}\n\n${prompt.split("\n").slice(1).join("\n") || "## Notes\n\nAdd your content here."}`;
  } else if (id === "api-planner") {
    result = JSON.stringify({
      project: prompt,
      endpoints: [{
        method: "GET",
        path: "/api/example",
        description: "Replace with your endpoint purpose",
        authentication: "Define before deployment"
      }],
      note: "Planning draft only; no API is created."
    }, null, 2);
  } else if (id === "data-table") {
    result = JSON.stringify({
      title: "Data draft",
      items: prompt.split("\n").filter(Boolean).map((item, index) => ({
        id: index + 1,
        value: item
      }))
    }, null, 2);
  } else if (id === "todo-planner" || id === "project-planner" || id === "study-planner" || id === "launch-planner") {
    result = `# ${currentTool[1]}\n\nGoal: ${prompt}\n\n## Tasks\n- [ ] Define the objective\n- [ ] Break work into smaller tasks\n- [ ] Set priorities and deadlines\n- [ ] Review progress\n- [ ] Complete and evaluate`;
  } else if (id === "notepad-tool") {
    notes.content = prompt;
    notes.title = "Quick note";
    write(KEYS.notes, notes);
    result = "Your note has been saved in this browser.\n\n" + prompt;
  } else {
    result = `${currentTool[1]} — Planning draft\n\nYour input:\n${prompt}\n\nNext steps:\n1. Define your requirements.\n2. Refine the concept and desired outcome.\n3. Choose the tools or services required.\n4. Test the result and improve it.\n\nNote: This frontend demo organizes your input. Connected AI generation requires a configured AI backend.`;
  }

  if (format === "json" && id !== "json-formatter") {
    result = JSON.stringify({ tool: currentTool[1], input: prompt, result }, null, 2);
  } else if (format === "markdown" && !String(result).startsWith("#")) {
    result = `# ${currentTool[1]}\n\n${result}`;
  } else if (format === "html" && id !== "html-starter") {
    result = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${escapeHTML(currentTool[1])}</title></head>
<body><main><h1>${escapeHTML(currentTool[1])}</h1><pre>${escapeHTML(result)}</pre></main></body></html>`;
  }

  currentOutput = String(result);
  $("#workspaceOutput").textContent = currentOutput;
  recordEvent("process", currentTool[1]);
  toast("Result tayyar hai.");
}

function openModal() {
  $("#projectModal").classList.add("open");
  $("#projectModal").setAttribute("aria-hidden", "false");
  $("#projectName").focus();
}

function closeModal() {
  $("#projectModal").classList.remove("open");
  $("#projectModal").setAttribute("aria-hidden", "true");
}

function createProject(name, description) {
  const project = {
    id: uid(),
    name: name.trim(),
    description: description.trim(),
    createdAt: new Date().toISOString(),
    views: 0,
    comments: []
  };

  projects.unshift(project);
  write(KEYS.projects, projects);
  analytics.saves++;
  recordEvent("save", project.name);
  renderProjects();
  renderOverview();
  return project;
}

function renderProjects() {
  $("#projectCount").textContent = `${projects.length} project${projects.length === 1 ? "" : "s"}`;

  $("#projectsGrid").innerHTML = projects.length
    ? projects.map(project => `
      <article class="project-card panel">
        <div class="tool-card-top">
          <span class="tool-icon">▦</span>
          <span class="eyebrow">${escapeHTML(new Date(project.createdAt).toLocaleDateString())}</span>
        </div>
        <h3>${escapeHTML(project.name)}</h3>
        <p>${escapeHTML(project.description || "No description provided.")}</p>
        <div class="tool-meta"><span>${project.views || 0} opens</span><span>${(project.comments || []).length} comments</span></div>
        <div class="project-actions">
          <button class="mini-button" data-project-open="${escapeHTML(project.id)}">Open</button>
          <button class="mini-button" data-project-comment="${escapeHTML(project.id)}">Comment</button>
          <button class="mini-button" data-project-delete="${escapeHTML(project.id)}">Delete</button>
        </div>
      </article>
    `).join("")
    : '<div class="empty-state">Abhi koi project nahi. “New project” par click karke shuru karo.</div>';
}

function openProject(id) {
  const project = projects.find(item => item.id === id);
  if (!project) return;

  project.views = (project.views || 0) + 1;
  analytics.projectViews[id] = (analytics.projectViews[id] || 0) + 1;
  write(KEYS.projects, projects);
  recordEvent("project", project.name);

  currentOutput = project.description || "";
  currentTool = null;
  $("#workspaceTitle").textContent = project.name;
  $("#workspaceDescription").textContent = "Saved project";
  $("#workspacePrompt").value = project.description || "";
  $("#workspaceOutput").textContent = project.description || "This project has no saved content.";
  showPage("workspace");
}

function saveOutputAsProject() {
  if (!currentOutput.trim()) {
    toast("Save karne se pehle output tayyar karo.");
    return;
  }

  const name = currentTool ? currentTool[1] : "Saved output";
  createProject(`${name} — ${new Date().toLocaleDateString()}`, currentOutput);
  toast("Output project mein save ho gaya.");
}

function saveNote() {
  notes = {
    title: $("#noteTitle").value,
    content: $("#noteContent").value,
    updatedAt: new Date().toISOString()
  };

  if (write(KEYS.notes, notes)) {
    $("#noteStatus").textContent = `Saved at ${new Date().toLocaleTimeString()}`;
    recordEvent("note", notes.title || "Untitled note");
    toast("Note save ho gaya.");
  }
}

function loadNote() {
  $("#noteTitle").value = notes.title || "";
  $("#noteContent").value = notes.content || "";
}

function renderAnalytics() {
  const total = object => Object.values(object).reduce((sum, value) => sum + Number(value || 0), 0);
  const toolOpens = total(analytics.toolViews);
  const likes = total(analytics.likes);
  const ratings = Object.values(analytics.ratings);
  const comments = analytics.comments.length + analytics.feedback.length +
    projects.reduce((sum, project) => sum + (project.comments || []).length, 0);

  $("#statViews").textContent = total(analytics.pageViews);
  $("#statToolOpens").textContent = toolOpens;
  $("#statSaves").textContent = analytics.saves;
  $("#statLikes").textContent = likes;
  $("#statRatings").textContent = ratings.length;
  $("#statComments").textContent = comments;

  const maxViews = Math.max(1, ...tools.map(tool => analytics.toolViews[tool[0]] || 0));

  $("#toolAnalytics").innerHTML = tools
    .filter(tool => analytics.toolViews[tool[0]] || analytics.likes[tool[0]] || analytics.ratings[tool[0]])
    .sort((a, b) => (analytics.toolViews[b[0]] || 0) - (analytics.toolViews[a[0]] || 0))
    .map(tool => {
      const id = tool[0];
      const views = analytics.toolViews[id] || 0;
      const rating = analytics.ratings[id] || 0;
      const likeCount = analytics.likes[id] || 0;

      return `
        <div class="analytics-row">
          <div>${escapeHTML(tool[1])}
            <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, views / maxViews * 100)}%"></div></div>
            <small>Rating: ${rating ? `${rating}/5` : "Not rated"} · Likes: ${likeCount}</small>
          </div>
          <div class="analytics-numbers">${views} views</div>
        </div>`;
    }).join("") || '<p class="muted">Tools open karne ke baad statistics yahan dikhengi.</p>';

  $("#analyticsEvents").innerHTML = analytics.events.slice(0, 15).map(event => `
    <div class="analytics-row">
      <div>${escapeHTML(event.type)} — ${escapeHTML(event.name)}<small>${escapeHTML(formatDate(event.at))}</small></div>
    </div>
  `).join("") || '<p class="muted">Abhi koi event record nahi hua.</p>';

  $("#feedbackList").innerHTML = analytics.feedback.slice(0, 5).map(item => `
    <div class="feedback-item">${escapeHTML(item.text)}<br><small>${escapeHTML(formatDate(item.at))}</small></div>
  `).join("");
}

function toggleLike() {
  if (!currentTool) {
    toast("Like karne ke liye pehle tool open karo.");
    return;
  }

  const id = currentTool[0];
  analytics.likes[id] = analytics.likes[id] ? 0 : 1;
  saveAnalytics();

  $("#workspaceLike").textContent = analytics.likes[id] ? "♥ Liked" : "♡ Like";
  recordEvent("like", currentTool[1]);
  renderOverview();
}

function setRating(value) {
  if (!currentTool) {
    toast("Rating dene ke liye pehle tool open karo.");
    return;
  }

  analytics.ratings[currentTool[0]] = Number(value);
  saveAnalytics();

  $$("#workspaceRating button").forEach(button => {
    button.classList.toggle("selected", Number(button.dataset.rating) <= value);
  });

  recordEvent("rating", `${currentTool[1]} (${value}/5)`);
  toast(`Rating ${value}/5 save ho gayi.`);
}

function renderCodeEditor() {
  $("#codeEditor").value = code[currentCodeTab] || "";
  $$(".code-tabs button").forEach(button => {
    button.classList.toggle("active", button.dataset.codeTab === currentCodeTab);
  });
}

function saveCode() {
  code[currentCodeTab] = $("#codeEditor").value;
  write(KEYS.code, code);
}

function runCode() {
  saveCode();

  const html = code.html || "";
  const css = code.css || "";
  const js = code.js || "";

  // The iframe has allow-scripts only, not allow-same-origin.
  // Never place trusted secrets in user-authored preview code.
  const documentContent = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${css.replace(/<\/style/gi, "<\\/style")}</style></head>
<body>${html.replace(/<\/script/gi, "<\\/script")}
<script>
try {
${js.replace(/<\/script/gi, "<\\/script")}
} catch (error) {
  document.body.insertAdjacentHTML("beforeend",
    '<pre style="color:red;white-space:pre-wrap"></pre>');
  document.body.querySelector('pre').textContent = error.message;
}
<\/script>
</body></html>`;

  $("#codePreview").srcdoc = documentContent;
  recordEvent("code", "Run Code Lab");
  toast("Preview update ho gaya.");
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
}

function downloadCode() {
  saveCode();
  const combined = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${code.css || ""}</style></head><body>${code.html || ""}
<script>${(code.js || "").replace(/<\/script/gi, "<\\/script")}<\/script></body></html>`;

  downloadFile("wazir-aura-project.html", combined, "text/html;charset=utf-8");
}

function resetAnalytics() {
  if (!confirm("Kya tum is browser ki tamam local analytics delete karna chahte ho?")) return;

  analytics = {
    pageViews: {},
    toolViews: {},
    projectViews: {},
    likes: {},
    ratings: {},
    saves: 0,
    comments: [],
    events: [],
    feedback: []
  };

  saveAnalytics();
  renderAnalytics();
  renderOverview();
  renderTools();
  toast("Local analytics reset ho gayi.");
}

function initSpace() {
  const canvas = $("#spaceCanvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let stars = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    stars = Array.from({ length: Math.min(150, Math.floor(width / 8)) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.3 + 0.2,
      speed: Math.random() * 0.24 + 0.04,
      phase: Math.random() * Math.PI * 2
    }));
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);

    for (const star of stars) {
      const alpha = 0.3 + (Math.sin(time * 0.001 + star.phase) + 1) * 0.32;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(205,198,255,${alpha})`;
      ctx.fill();

      star.y += star.speed;
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
    }

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(draw);
}

function bindEvents() {
  document.addEventListener("click", event => {
    const pageButton = event.target.closest("[data-page]");
    if (pageButton) {
      event.preventDefault();
      showPage(pageButton.dataset.page);
      return;
    }

    const toolButton = event.target.closest("[data-tool]");
    if (toolButton) {
      openTool(toolButton.dataset.tool);
      return;
    }

    const projectOpen = event.target.closest("[data-project-open]");
    if (projectOpen) {
      openProject(projectOpen.dataset.projectOpen);
      return;
    }

    const projectDelete = event.target.closest("[data-project-delete]");
    if (projectDelete) {
      const project = projects.find(item => item.id === projectDelete.dataset.projectDelete);
      if (!project) return;
      if (!confirm(`"${project.name}" delete karna hai?`)) return;

      projects = projects.filter(item => item.id !== project.id);
      write(KEYS.projects, projects);
      recordEvent("delete", project.name);
      renderProjects();
      renderOverview();
      toast("Project delete ho gaya.");
      return;
    }

    const projectComment = event.target.closest("[data-project-comment]");
    if (projectComment) {
      const project = projects.find(item => item.id === projectComment.dataset.projectComment);
      if (!project) return;

      const comment = prompt("Project comment likho:");
      if (comment && comment.trim()) {
        project.comments ||= [];
        project.comments.push({
          text: comment.trim(),
          at: new Date().toISOString()
        });

        analytics.comments.push({
          text: comment.trim(),
          projectId: project.id,
          at: new Date().toISOString()
        });

        write(KEYS.projects, projects);
        saveAnalytics();
        renderProjects();
        renderAnalytics();
        toast("Comment save ho gaya.");
      }
      return;
    }

    const ratingButton = event.target.closest("[data-rating]");
    if (ratingButton) {
      setRating(ratingButton.dataset.rating);
      return;
    }

    const codeTab = event.target.closest("[data-code-tab]");
    if (codeTab) {
      saveCode();
      currentCodeTab = codeTab.dataset.codeTab;
      renderCodeEditor();
    }
  });

  $("#toolSearch").addEventListener("input", renderTools);
  $("#toolCategory").addEventListener("change", renderTools);

  $("#newProject").addEventListener("click", openModal);
  $("#closeModal").addEventListener("click", closeModal);
  $("#cancelProject").addEventListener("click", closeModal);

  $("#projectModal").addEventListener("click", event => {
    if (event.target.id === "projectModal") closeModal();
  });

  $("#createProject").addEventListener("click", () => {
    const name = $("#projectName").value.trim();
    const description = $("#projectDescription").value.trim();

    if (!name) {
      toast("Project ka naam likho.");
      $("#projectName").focus();
      return;
    }

    createProject(name, description);
    closeModal();
    $("#projectName").value = "";
    $("#projectDescription").value = "";
    toast("Project create ho gaya.");
  });

  $("#runWorkspace").addEventListener("click", processWorkspace);
  $("#clearWorkspace").addEventListener("click", () => {
    $("#workspacePrompt").value = "";
    $("#workspaceOutput").textContent = "Your result will appear here.";
    currentOutput = "";
  });

  $("#copyOutput").addEventListener("click", async () => {
    if (!currentOutput) {
      toast("Copy karne ke liye output nahi hai.");
      return;
    }

    try {
      await navigator.clipboard.writeText(currentOutput);
      toast("Output copy ho gaya.");
    } catch {
      const area = document.createElement("textarea");
      area.value = currentOutput;
      document.body.appendChild(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      toast(copied ? "Output copy ho gaya." : "Copy nahi ho saka.");
    }
  });

  $("#downloadOutput").addEventListener("click", () => {
    if (!currentOutput) return toast("Download karne ke liye output nahi hai.");
    downloadFile("wazir-aura-output.txt", currentOutput);
  });

  $("#saveOutput").addEventListener("click", saveOutputAsProject);
  $("#workspaceLike").addEventListener("click", toggleLike);

  $("#saveNote").addEventListener("click", saveNote);

  let noteTimer;
  $("#noteTitle").addEventListener("input", autoSaveNote);
  $("#noteContent").addEventListener("input", autoSaveNote);

  function autoSaveNote() {
    clearTimeout(noteTimer);
    $("#noteStatus").textContent = "Saving...";
    noteTimer = setTimeout(() => {
      notes = {
        title: $("#noteTitle").value,
        content: $("#noteContent").value,
        updatedAt: new Date().toISOString()
      };
      if (write(KEYS.notes, notes)) {
        $("#noteStatus").textContent = "Automatically saved";
      }
    }, 500);
  }

  $("#codeEditor").addEventListener("input", () => {
    code[currentCodeTab] = $("#codeEditor").value;
    write(KEYS.code, code);
  });

  $("#runCode").addEventListener("click", runCode);

  $("#resetCode").addEventListener("click", () => {
    if (!confirm("Code Lab ko default code par reset karna hai?")) return;
    code = { ...defaultCode };
    write(KEYS.code, code);
    renderCodeEditor();
    runCode();
  });

  $("#downloadCode").addEventListener("click", downloadCode);

  $("#submitFeedback").addEventListener("click", () => {
    const input = $("#feedbackInput");
    const value = input.value.trim();

    if (!value) {
      toast("Pehle feedback likho.");
      return;
    }

    analytics.feedback.unshift({
      text: value,
      at: new Date().toISOString()
    });

    analytics.feedback = analytics.feedback.slice(0, 100);
    saveAnalytics();
    recordEvent("feedback", "Website feedback");
    input.value = "";
    renderAnalytics();
    toast("Feedback is browser mein save ho gaya.");
  });

  $("#exportAnalytics").addEventListener("click", () => {
    downloadFile("wazir-aura-analytics.json", JSON.stringify({
      exportedAt: new Date().toISOString(),
      scope: "This browser only",
      analytics,
      projects
    }, null, 2), "application/json;charset=utf-8");
  });

  $("#resetAnalytics").addEventListener("click", resetAnalytics);

  const toggleTheme = () => {
    document.body.classList.toggle("light");
    write(KEYS.theme, document.body.classList.contains("light") ? "light" : "dark");
  };

  $("#themeToggle").addEventListener("click", toggleTheme);
  $("#quickTheme").addEventListener("click", toggleTheme);
  $("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

  $("#premiumInfo").addEventListener("click", () => {
    toast("Premium ke liye backend, authentication aur payment provider configure karna hoga.");
  });

  $("#workspacePrompt").addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") processWorkspace();
  });

  $("#projectDescription").addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") $("#createProject").click();
  });
}

function init() {
  document.body.classList.toggle("light", read(KEYS.theme, "dark") === "light");
  $("#currentYear").textContent = new Date().getFullYear();

  // Record this browser's initial page visit.
  analytics.pageViews.overview = (analytics.pageViews.overview || 0) + 1;
  recordEvent("page", "overview");

  renderOverview();
  renderTools();
  renderProjects();
  renderAnalytics();
  loadNote();
  renderCodeEditor();
  bindEvents();
  initSpace();

  setTimeout(() => {
    $("#intro").classList.add("done");
    $("#appShell").classList.add("ready");
  }, 1100);

  setTimeout(() => {
    $("#intro")?.remove();
  }, 1900);

  // Build an initial Code Lab preview.
  runCode();
}

document.addEventListener("DOMContentLoaded", init);

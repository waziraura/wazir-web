import * as THREE from "three";

/* ===== WELCOME AUTO 5s ===== */
const welcome = document.getElementById("welcome");
const countEl = document.getElementById("count");
let t = 5;
const timer = setInterval(() => {
  t--;
  if (countEl) countEl.textContent = t;
  if (t <= 0) {
    clearInterval(timer);
    welcome.classList.add("hide");
    setTimeout(() => welcome.style.display = "none", 1000);
  }
}, 1000);

/* ===== THEME ===== */
const themeBtn = document.getElementById("themeBtn");
const body = document.body;

function setTheme(mode) {
  if (mode === "light") {
    body.classList.add("light");
    body.classList.remove("dark");
    themeBtn.textContent = "☀";
  } else {
    body.classList.add("dark");
    body.classList.remove("light");
    themeBtn.textContent = "☾";
  }
  localStorage.setItem("theme", mode);
  updateBG(mode);
}

themeBtn?.addEventListener("click", () => {
  setTheme(body.classList.contains("light") ? "dark" : "light");
});

setTheme(localStorage.getItem("theme") || "dark");

/* ===== MOBILE MENU ===== */
const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");
menuBtn?.addEventListener("click", () => nav.classList.toggle("open"));
document.querySelectorAll("#nav a").forEach(a => {
  a.addEventListener("click", () => nav.classList.remove("open"));
});

/* ===== TOOL SWITCHER ===== */
document.querySelectorAll(".tool-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tool-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tool).classList.add("active");
  });
});

/* ===== WORD COUNTER ===== */
const wcInput = document.getElementById("wc-input");
wcInput?.addEventListener("input", () => {
  const text = wcInput.value;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const chars = text.length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const paras = text.split(/\n+/).filter(p => p.trim().length > 0).length;
  document.getElementById("wc-words").textContent = words;
  document.getElementById("wc-chars").textContent = chars;
  document.getElementById("wc-sentences").textContent = sentences;
  document.getElementById("wc-paras").textContent = paras;
});

/* ===== CASE CONVERTER ===== */
window.toUpper = () => {
  document.getElementById("case-output").value = document.getElementById("case-input").value.toUpperCase();
};
window.toLower = () => {
  document.getElementById("case-output").value = document.getElementById("case-input").value.toLowerCase();
};
window.toTitle = () => {
  const t = document.getElementById("case-input").value.toLowerCase();
  document.getElementById("case-output").value = t.replace(/\b\w/g, c => c.toUpperCase());
};
window.toCapitalize = () => {
  const t = document.getElementById("case-input").value;
  document.getElementById("case-output").value = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
};

/* ===== LOREM ===== */
window.genLorem = (n) => {
  const para = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
  document.getElementById("lorem-output").value = Array(n).fill(para).join("\n\n");
};

/* ===== BASE64 ===== */
window.encodeB64 = () => {
  try {
    document.getElementById("b64-output").value = btoa(document.getElementById("b64-input").value);
  } catch {
    document.getElementById("b64-output").value = "Error encoding";
  }
};
window.decodeB64 = () => {
  try {
    document.getElementById("b64-output").value = atob(document.getElementById("b64-input").value);
  } catch {
    document.getElementById("b64-output").value = "Invalid Base64";
  }
};

/* ===== JSON ===== */
window.formatJSON = () => {
  try {
    const obj = JSON.parse(document.getElementById("json-input").value);
    document.getElementById("json-output").value = JSON.stringify(obj, null, 2);
  } catch {
    document.getElementById("json-output").value = "Invalid JSON";
  }
};
window.minifyJSON = () => {
  try {
    const obj = JSON.parse(document.getElementById("json-input").value);
    document.getElementById("json-output").value = JSON.stringify(obj);
  } catch {
    document.getElementById("json-output").value = "Invalid JSON";
  }
};

/* ===== PASSWORD ===== */
window.genPass = (len) => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let pass = "";
  for (let i = 0; i < len; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  document.getElementById("pass-output").value = pass;
};
window.copyPass = () => {
  const el = document.getElementById("pass-output");
  el.select();
  document.execCommand("copy");
  alert("Password copied!");
};

/* ===== THREE.JS BACKGROUND ===== */
const canvas = document.getElementById("webgl");
let renderer, scene, camera, stars;

function initThree() {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 16;

  const count = 1600;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 80;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xc4b5fd, size: 0.06, transparent: true, opacity: 0.8 });
  stars = new THREE.Points(geo, mat);
  scene.add(stars);

  animate();
}

function updateBG(mode) {
  if (!stars) return;
  stars.material.color.set(mode === "light" ? 0x86efac : 0xc4b5fd);
  stars.material.opacity = mode === "light" ? 0.35 : 0.8;
}

function animate() {
  requestAnimationFrame(animate);
  if (stars) {
    stars.rotation.y += 0.0005;
    stars.rotation.x += 0.0002;
  }
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

initThree();

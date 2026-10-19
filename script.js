import * as THREE from "three";

/* ===================== WELCOME (Auto 5s) ===================== */
const welcome = document.getElementById("welcome");
const countdownEl = document.getElementById("countdown");
let timeLeft = 5;

const timer = setInterval(() => {
  timeLeft--;
  if (countdownEl) countdownEl.textContent = timeLeft;
  if (timeLeft <= 0) {
    clearInterval(timer);
    welcome.classList.add("hide");
    setTimeout(() => {
      welcome.style.display = "none";
    }, 1100);
  }
}, 1000);

/* ===================== THEME TOGGLE ===================== */
const themeBtn = document.getElementById("themeToggle");
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
  localStorage.setItem("wazir-theme", mode);
  updateThreeTheme(mode);
}

themeBtn?.addEventListener("click", () => {
  const next = body.classList.contains("light") ? "dark" : "light";
  setTheme(next);
});

// Load saved theme
const saved = localStorage.getItem("wazir-theme") || "dark";
setTheme(saved);

/* ===================== MOBILE MENU ===================== */
const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");

menuBtn?.addEventListener("click", () => {
  nav.classList.toggle("open");
});

document.querySelectorAll(".nav a").forEach(link => {
  link.addEventListener("click", () => nav.classList.remove("open"));
});

/* ===================== THREE.JS ===================== */
const canvas = document.getElementById("webgl");
let renderer, scene, camera;
let stars, starMaterial;
let flowers = [];
let mountains = [];
let isLight = false;
let animationId;

function initThree() {
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setClearColor(0x000000, 0);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 2, 18);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  const p1 = new THREE.PointLight(0x8b5cf6, 18, 50);
  p1.position.set(8, 10, 8);
  scene.add(p1);

  const p2 = new THREE.PointLight(0x22d3ee, 12, 40);
  p2.position.set(-10, 4, 6);
  scene.add(p2);

  createStars();
  createMeadow();

  animate();
}

function createStars() {
  const count = 1800;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    pos[i] = (Math.random() - 0.5) * 120;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

  starMaterial = new THREE.PointsMaterial({
    color: 0xc4b5fd,
    size: 0.07,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true
  });

  stars = new THREE.Points(geo, starMaterial);
  scene.add(stars);
}

function createMeadow() {
  // Ground
  const groundGeo = new THREE.PlaneGeometry(80, 80);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x3d6b4f,
    roughness: 0.9
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -3;
  ground.visible = false;
  scene.add(ground);
  mountains.push(ground);

  // Simple distant mountains
  for (let i = 0; i < 8; i++) {
    const h = 4 + Math.random() * 6;
    const mGeo = new THREE.ConeGeometry(3 + Math.random() * 4, h, 5);
    const mMat = new THREE.MeshStandardMaterial({
      color: 0x4a5d4e,
      roughness: 0.85
    });
    const m = new THREE.Mesh(mGeo, mMat);
    m.position.set((i - 4) * 9, -3 + h / 2 - 1, -25 - Math.random() * 8);
    m.visible = false;
    scene.add(m);
    mountains.push(m);
  }

  // Flowers
  const colors = [0xf9a8d4, 0xf472b6, 0xc084fc, 0x67e8f9, 0xfde68a, 0x86efac];
  for (let i = 0; i < 70; i++) {
    const group = new THREE.Group();

    // Stem
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.035, 0.9, 6),
      new THREE.MeshStandardMaterial({ color: 0x2f6b45 })
    );
    stem.position.y = 0.45;
    group.add(stem);

    // Petals
    const petalColor = colors[i % colors.length];
    const petalMat = new THREE.MeshStandardMaterial({
      color: petalColor,
      emissive: petalColor,
      emissiveIntensity: 0.15,
      roughness: 0.6
    });

    for (let p = 0; p < 6; p++) {
      const petal = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 8, 8),
        petalMat
      );
      const angle = (p / 6) * Math.PI * 2;
      petal.position.set(Math.cos(angle) * 0.2, 0.95, Math.sin(angle) * 0.2);
      petal.scale.set(1, 0.5, 0.8);
      group.add(petal);
    }

    // Center
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7 })
    );
    center.position.y = 0.95;
    group.add(center);

    group.position.set(
      (Math.random() - 0.5) * 50,
      -3,
      (Math.random() - 0.5) * 40 - 5
    );
    group.rotation.y = Math.random() * Math.PI;
    group.userData.phase = Math.random() * Math.PI * 2;
    group.visible = false;
    scene.add(group);
    flowers.push(group);
  }
}

function updateThreeTheme(mode) {
  isLight = mode === "light";

  if (stars) stars.visible = !isLight;
  flowers.forEach(f => f.visible = isLight);
  mountains.forEach(m => m.visible = isLight);

  if (starMaterial) {
    starMaterial.color.set(isLight ? 0x86efac : 0xc4b5fd);
  }

  if (renderer) {
    renderer.setClearColor(isLight ? 0xe8f0e9 : 0x05050f, isLight ? 0.3 : 0);
  }
}

function animate() {
  animationId = requestAnimationFrame(animate);
  const t = performance.now() * 0.001;

  if (stars && !isLight) {
    stars.rotation.y = t * 0.02;
    stars.rotation.x = Math.sin(t * 0.1) * 0.03;
  }

  if (isLight) {
    flowers.forEach(f => {
      f.rotation.z = Math.sin(t * 1.8 + f.userData.phase) * 0.12;
    });
  }

  renderer.render(scene, camera);
}

function onResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onResize);
initThree();

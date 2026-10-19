import * as THREE from "three";

/* ===== WELCOME SCREEN ===== */
const welcome = document.getElementById("welcome");
const enterBtn = document.getElementById("enterBtn");
const skipBtn = document.getElementById("skipBtn");

function hideWelcome() {
  welcome.classList.add("hide");
  setTimeout(() => {
    welcome.style.display = "none";
  }, 900);
}

enterBtn?.addEventListener("click", hideWelcome);
skipBtn?.addEventListener("click", hideWelcome);

/* ===== THREE.JS BACKGROUND ===== */
const canvas = document.getElementById("webgl-bg");
let renderer, scene, camera, particles;
let animationId;

function initThree() {
  if (!canvas) return;

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 20;

  // Particles
  const count = 1200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 60;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x8b5cf6,
    size: 0.08,
    transparent: true,
    opacity: 0.7
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Soft lights
  const light1 = new THREE.PointLight(0x8b5cf6, 15, 40);
  light1.position.set(10, 10, 10);
  scene.add(light1);

  const light2 = new THREE.PointLight(0x22d3ee, 10, 30);
  light2.position.set(-10, -5, 5);
  scene.add(light2);

  animate();
}

function animate() {
  animationId = requestAnimationFrame(animate);
  if (particles) {
    particles.rotation.y += 0.0006;
    particles.rotation.x += 0.0002;
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

/* ===== MOBILE MENU (basic) ===== */
const menuBtn = document.getElementById("menuBtn");
const nav = document.querySelector(".nav");

menuBtn?.addEventListener("click", () => {
  nav.style.display = nav.style.display === "flex" ? "none" : "flex";
  nav.style.flexDirection = "column";
  nav.style.position = "absolute";
  nav.style.top = "70px";
  nav.style.right = "5%";
  nav.style.background = "rgba(5,5,15,0.95)";
  nav.style.padding = "20px";
  nav.style.borderRadius = "12px";
  nav.style.border = "1px solid rgba(139,92,246,0.3)";
});

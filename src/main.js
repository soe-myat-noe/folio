import * as THREE from "three";
import "./style.scss";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import gsap from "gsap";

const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

// Modals
const modals = {
  info: document.querySelector(".modal.info"),
  projects: document.querySelector(".modal.projects"),
  contact: document.querySelector(".modal.contact")
};

let touchHappened = false;

const showModal = (modal) => {
  modal.style.display = "block";
  gsap.set(modal, { opacity: 0 });
  gsap.to(modal, { opacity: 1, duration: 0.5 });
};

const hideModal = (modal) => {
  gsap.to(modal, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      modal.style.display = "none";
    }
  });
};

document.querySelectorAll(".modal-exit-button").forEach((button) => {
  button.addEventListener("touchend", (e) => {
    touchHappened = true;
    e.preventDefault();
    const modal = e.target.closest(".modal");
    hideModal(modal);
  }, { passive: false });

  button.addEventListener("click", (e) => {
    if (touchHappened) return;
    e.preventDefault();
    const modal = e.target.closest(".modal");
    hideModal(modal);
  });
});

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
// remove the fog entirely or keep subtle:
scene.fog = new THREE.FogExp2(0x000000, 0.02);


// Objects
let fans = [];
let robot = null;
let raycasterObjects = [];
let currentIntersects = [];
let currentHoveredObject = null;

// Clock Canvas
const clockCanvas = document.createElement("canvas");
clockCanvas.width = 512;
clockCanvas.height = 512;
const ctx = clockCanvas.getContext("2d");
const clockTexture = new THREE.CanvasTexture(clockCanvas);
clockTexture.flipY = false;

// Camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(8, 18, 6);
scene.add(camera);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;
controls.enablePan = false;
// controls.panSpeed = 0.5;
controls.minDistance = 3;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI / 2;
// controls.zoomToCursor = true;

// controls.addEventListener("change", () => {
//   controls.target.x = Math.max(-3, Math.min(3, controls.target.x));
//   controls.target.y = Math.max(0, Math.min(4, controls.target.y));
//   controls.target.z = Math.max(-3, Math.min(3, controls.target.z));
// });

// Lighting
const dirLight = new THREE.DirectionalLight(0xfff5e0, 4);
dirLight.position.set(20, 10, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.bias = -0.0001;
scene.add(dirLight);

const dirLight2 = new THREE.DirectionalLight(0xc9d5ff, 1.5);
dirLight2.position.set(-5, 3, -5);
scene.add(dirLight2);

const hemiLight = new THREE.HemisphereLight(0xc9d5ff, 0x444433, 1.5);
scene.add(hemiLight);

// Loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// Raycaster
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// Project links
const projectLinks = {
  "screen_02_raycaster_pointer": "https://youtube.com/playlist?list=PLZRxFBpswuA8TuAoWTyXW9CL3AYknXZbu&si=tCsvZ-rcY98pNg7y"
};

// Fireflies
const fireflyCount = 80;
const fireflyGeometry = new THREE.BufferGeometry();
const fireflyPositions = new Float32Array(fireflyCount * 3);
const fireflySpeeds = new Float32Array(fireflyCount);
const fireflyOffsets = new Float32Array(fireflyCount);

for (let i = 0; i < fireflyCount; i++) {
  fireflyPositions[i * 3 + 0] = (Math.random() - 0.5) * 30;  // X
  fireflyPositions[i * 3 + 1] = Math.random() * 15;           // Y
  fireflyPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;  // Z
  fireflySpeeds[i] = Math.random() * 0.5 + 0.2;
  fireflyOffsets[i] = Math.random() * Math.PI * 2;
}

fireflyGeometry.setAttribute("position", new THREE.BufferAttribute(fireflyPositions, 3));

const fireflyMaterial = new THREE.PointsMaterial({
  size: 0.15,
  color: 0xffffff,
  transparent: true,
  opacity: 0.8,
  sizeAttenuation: true,
  depthWrite: false
});

const fireflies = new THREE.Points(fireflyGeometry, fireflyMaterial);
scene.add(fireflies);

// Video 1 - screen_02
const videoElement1 = document.createElement("video");
videoElement1.src = "/textures/video/screensaver4.mp4";
videoElement1.loop = true;
videoElement1.muted = true;
videoElement1.playsInline = true;
videoElement1.autoplay = true;
videoElement1.play();

const videoTexture1 = new THREE.VideoTexture(videoElement1);
videoTexture1.colorSpace = THREE.SRGBColorSpace;

// Video 2 - screen_03 & screen_04
const videoElement2 = document.createElement("video");
videoElement2.src = "/textures/video/static.mp4";
videoElement2.loop = true;
videoElement2.muted = true;
videoElement2.playsInline = true;
videoElement2.autoplay = true;
videoElement2.play();

const videoTexture2 = new THREE.VideoTexture(videoElement2);
videoTexture2.colorSpace = THREE.SRGBColorSpace;

// Events
window.addEventListener("mousemove", (e) => {
  touchHappened = false;
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("touchstart", (e) => {
  e.preventDefault();
  pointer.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
}, { passive: false });

window.addEventListener("touchend", (e) => {
  e.preventDefault();
  touchHappened = true;
  handleRaycasterInteraction();
}, { passive: false });

function handleRaycasterInteraction() {
  if (currentIntersects.length > 0) {
    const object = currentIntersects[0].object;

    Object.entries(projectLinks).forEach(([key, url]) => {
      if (object.name.includes(key)) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    });

    if (object.name.includes("plank_info")) {
      showModal(modals.info);
    } else if (object.name.includes("plank_projects")) {
      showModal(modals.projects);
    } else if (object.name.includes("plank_contact")) {
      showModal(modals.contact);
    }
  }
}

window.addEventListener("click", () => {
  if (touchHappened) return;
  handleRaycasterInteraction();
});

// Hover animation
function playHoverAnimation(object, isHovering) {
  gsap.killTweensOf(object.scale);
  gsap.killTweensOf(object.rotation);
  gsap.killTweensOf(object.position);

  if (isHovering) {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x * 1.2,
      y: object.userData.initialScale.y * 1.2,
      z: object.userData.initialScale.z * 1.2,
      duration: 0.5,
      ease: "back.out(1.8)"
    });
    gsap.to(object.rotation, {
      x: object.userData.initialRotation.x + Math.PI / 32,
      duration: 0.3,
      ease: "back.out(1.8)"
    });
  } else {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      y: object.userData.initialScale.y,
      z: object.userData.initialScale.z,
      duration: 0.5,
      ease: "back.out(1.8)"
    });
    gsap.to(object.rotation, {
      x: object.userData.initialRotation.x,
      duration: 0.5,
      ease: "back.out(1.8)"
    });
  }
}

// Load GLB
loader.load("/models/portfolio_v4.glb", (glb) => {
  scene.add(glb.scene);

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    transmission: 1,
    thickness: 0.5,
    roughness: 0,
    metalness: 0,
    transparent: true,
    ior: 1.5
  });

  glb.scene.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;

    // Spotlight
    if (child.material.name === "mat_spotlight") {
      child.material = new THREE.MeshStandardMaterial({
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 2,
        color: new THREE.Color(0xffffff)
      });
      const spot = new THREE.SpotLight(0xffffff, 10);
      spot.position.copy(child.position);
      spot.angle = Math.PI / 6;
      spot.penumbra = 0.3;
      spot.castShadow = true;
      const spotTarget = new THREE.Object3D();
      spotTarget.position.set(child.position.x, 0, child.position.z);
      scene.add(spotTarget);
      spot.target = spotTarget;
      scene.add(spot);
    }

    // Glass
    if (child.material.name === "mat_glass") {
      child.material = glassMaterial;
      child.castShadow = false;
      child.receiveShadow = false;
    }

    // Video screen 02
    if (child.name.includes("screen_02")) {
      child.material = new THREE.MeshBasicMaterial({
        map: videoTexture1,
        color: new THREE.Color(0xaaaaaa)
      });
    }

    // Video screen 03
    if (child.name.includes("screen_03")) {
      child.material = new THREE.MeshBasicMaterial({
        map: videoTexture2,
        color: new THREE.Color(0xaaaaaa)
      });
    }

    // Video screen 04
    if (child.name.includes("screen_04")) {
      child.material = new THREE.MeshBasicMaterial({
        map: videoTexture2,
        color: new THREE.Color(0xaaaaaa)
      });
    }

    // Fans
    if (child.name.startsWith("pc_fan")) {
      fans.push(child);
    }

    // Raycasting
    if (child.name.includes("raycaster") && !child.name.includes("screen_01")) {
      raycasterObjects.push(child);
    }

    // Hover — store data on parent
    if (child.name.includes("hover1")) {
      const hoverTarget = (child.parent && child.parent.name !== "Scene") ? child.parent : child;
      if (!hoverTarget.userData.hoverRegistered) {
        hoverTarget.userData.hoverRegistered = true;
        hoverTarget.userData.initialScale = new THREE.Vector3().copy(hoverTarget.scale);
        hoverTarget.userData.initialPosition = new THREE.Vector3().copy(hoverTarget.position);
        hoverTarget.userData.initialRotation = new THREE.Euler().copy(hoverTarget.rotation);
      }
    }

    // Robot
    if (child.name === "robot_raycaster_1") {
      robot = child.parent;
      robot.userData.initialPosition = { y: child.parent.position.y };
    }

    // Clock screen
    if (child.name === "screen_01") {
      child.material = new THREE.MeshBasicMaterial({ map: clockTexture });
    }
  });

  const box = new THREE.Box3().setFromObject(glb.scene);
  const center = box.getCenter(new THREE.Vector3());
  controls.target.copy(center);
  controls.target.y += -1;
  controls.update();
  camera.lookAt(center);

  gsap.to(camera.position, {
    x: 10,
    y: 9,
    z: -9.5,
    duration: 2.5,
    ease: "power2.inOut"
  });
});

// Clock
function drawClock() {
  const now = new Date();
  const w = 512, h = 512;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#050505";
  for (let y = 0; y < h; y += 8) {
    ctx.fillRect(0, y, w, 2);
  }

  const hours = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");
  const secs = String(now.getSeconds()).padStart(2, "0");
  const colon = now.getSeconds() % 2 === 0 ? ":" : " ";

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 86px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${hours}${colon}${mins}`, w / 2, 210);

  ctx.fillStyle = "#9f9f9f";
  ctx.font = "28px monospace";
  ctx.fillText(`${secs} SEC`, w / 2, 285);

  ctx.fillStyle = "#ffffff";
  ctx.font = "24px monospace";
  ctx.fillText("ONLINE", w / 2, 350);

  ctx.beginPath();
  ctx.arc(190, 350, 7, 0, Math.PI * 2);
  ctx.fillStyle = now.getSeconds() % 2 === 0 ? "#ffffff" : "#555555";
  ctx.fill();
}

// Resize
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Animation loop

const render = () => {
  controls.update();

  // fans
  fans.forEach((fan) => {
    fan.rotation.z -= 0.03;
  });

  // Robot
  if (robot) {
    robot.position.y = robot.userData.initialPosition.y + Math.sin(Date.now() * 0.001) * 0.08;
  }

  //Clock
  drawClock();
  clockTexture.needsUpdate = true;

  // Fireflies — must be inside render loop
  const positions = fireflies.geometry.attributes.position.array;
  const time = Date.now() * 0.001;

  for (let i = 0; i < fireflyCount; i++) {
    const offset = fireflyOffsets[i];
    const speed = fireflySpeeds[i];
    positions[i * 3 + 1] += Math.sin(time * speed + offset) * 0.003;
    positions[i * 3 + 0] += Math.cos(time * speed * 0.5 + offset) * 0.002;
    positions[i * 3 + 2] += Math.sin(time * speed * 0.3 + offset) * 0.002;
    if (positions[i * 3 + 0] > 15) positions[i * 3 + 0] = -15;
    if (positions[i * 3 + 0] < -15) positions[i * 3 + 0] = 15;
    if (positions[i * 3 + 2] > 15) positions[i * 3 + 2] = -15;
    if (positions[i * 3 + 2] < -15) positions[i * 3 + 2] = 15;
  }
  fireflies.geometry.attributes.position.needsUpdate = true;
  fireflyMaterial.opacity = 0.6 + Math.sin(time * 1.5) * 0.4;


  raycaster.setFromCamera(pointer, camera);
  currentIntersects = raycaster.intersectObjects(raycasterObjects);

  // Only clone materials for non-hover objects
  for (let i = 0; i < currentIntersects.length; i++) {
    const obj = currentIntersects[i].object;
    if (!obj.userData.originalMaterial && !obj.name.includes("hover1")) {
      obj.userData.originalMaterial = obj.material;
      obj.material = obj.material.clone();
    }
  }

  
  if (currentIntersects.length > 0) {
    const currentIntersectsObject = currentIntersects[0].object;
    document.body.style.cursor = "pointer";

    // Hover animation targets the parent group
    if (currentIntersectsObject.name.includes("hover1")) {
      const hoverTarget = (currentIntersectsObject.parent && currentIntersectsObject.parent.name !== "Scene") 
        ? currentIntersectsObject.parent 
        : currentIntersectsObject;

      if (hoverTarget !== currentHoveredObject) {
        if (currentHoveredObject) {
          playHoverAnimation(currentHoveredObject, false);
        }
        playHoverAnimation(hoverTarget, true);
        currentHoveredObject = hoverTarget;
      }
    }

  } else {
    document.body.style.cursor = "default";

    if (currentHoveredObject) {
      playHoverAnimation(currentHoveredObject, false);
      currentHoveredObject = null;
    }

    // Only reset materials for non-hover objects
    raycasterObjects.forEach((obj) => {
      if (obj.userData.originalMaterial && !obj.name.includes("hover1")) {
        obj.material = obj.userData.originalMaterial;
        obj.userData.originalMaterial = null;
      }
    });
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
};

render();
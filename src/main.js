import * as THREE from 'three';
import './style.scss'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap'

const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

// Scene
const scene = new THREE.Scene();

// Objects
let fans = []
let robot = null
let raycasterObjects = []
let currentIntersects = []

// Clock Canvas
const clockCanvas = document.createElement('canvas')
clockCanvas.width = 512
clockCanvas.height = 512
const ctx = clockCanvas.getContext('2d')
const clockTexture = new THREE.CanvasTexture(clockCanvas)
clockTexture.flipY = false

// Camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(8, 18, 6);
scene.add(camera);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

// Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.enablePan = false
controls.minDistance = 3
controls.maxDistance = 20
controls.maxPolarAngle = Math.PI / 2

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
}

// Video 1 - screen_02
const videoElement1 = document.createElement("video");
videoElement1.src = "/textures/video/screensaver4.mp4"
videoElement1.loop = true;
videoElement1.muted = true;
videoElement1.playsInline = true;
videoElement1.autoplay = true;
videoElement1.play()

const videoTexture1 = new THREE.VideoTexture(videoElement1)
videoTexture1.colorSpace = THREE.SRGBColorSpace;

//Video 2 - screen_03 & 04
const videoElement2 = document.createElement("video");
videoElement2.src = "/textures/video/static.mp4"
videoElement2.loop = true;
videoElement2.muted = true;
videoElement2.playsInline = true;
videoElement2.autoplay = true;
videoElement2.play()

const videoTexture2 = new THREE.VideoTexture(videoElement2)
videoTexture2.colorSpace = THREE.SRGBColorSpace;

// Events
window.addEventListener("mousemove", (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("click", () => {
  if (currentIntersects.length > 0) {
    const object = currentIntersects[0].object;
    Object.entries(projectLinks).forEach(([key, url]) => {
      if (object.name.includes(key)) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    })
  }
});

// Load GLB
loader.load('/models/portfolio_v2.glb', (glb) => {
  scene.add(glb.scene);

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    transmission: 1,
    thickness: 0.5,
    roughness: 0,
    metalness: 0,
    transparent: true,
    ior: 1.5,
  })

  glb.scene.traverse((child) => {
    if (!child.isMesh) return
    child.castShadow = true
    child.receiveShadow = true

    // Spotlight
    if (child.material.name === 'mat_spotlight') {
      child.material = new THREE.MeshStandardMaterial({
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 2,
        color: new THREE.Color(0xffffff)
      })
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
    if (child.material.name === 'mat_glass') {
      child.material = glassMaterial
      child.castShadow = false
      child.receiveShadow = false
    }

    // Video texture 1
    if (child.name.includes("screen_02")) {
      child.material = new THREE.MeshBasicMaterial({
        map: videoTexture1,
        color: new THREE.Color(0xaaaaaa)
      })
    }

    // Video texture 2
    if (child.name.includes("screen_03")) {
      child.material = new THREE.MeshBasicMaterial({
        map: videoTexture2,
        color: new THREE.Color(0xaaaaaa)
      })
    }

    // Video texture 2
    if (child.name.includes("screen_04")) {
      child.material = new THREE.MeshBasicMaterial({
        map: videoTexture2,
        color: new THREE.Color(0xaaaaaa)
      })
    }

    // Fans
    if (child.name.startsWith('pc_fan')) {
      fans.push(child)
    }

    // Raycasting
    if (child.name.includes('raycaster') && !child.name.includes('screen')) {
      raycasterObjects.push(child)
    }

    // Robot
    if (child.name === 'robot_raycaster_1') {
      robot = child.parent
      robot.userData.initialPosition = { y: child.parent.position.y }
    }

    // Clock screen
    if (child.name === 'screen_01') {
      child.material = new THREE.MeshBasicMaterial({ map: clockTexture })
    }
  })

  const box = new THREE.Box3().setFromObject(glb.scene);
  const center = box.getCenter(new THREE.Vector3());
  controls.target.copy(center);
  controls.target.y += -1
  controls.update();
  camera.lookAt(center);

  gsap.to(camera.position, {
    x: 10,
    y: 9,
    z: -9.5,
    duration: 2.5,
    ease: "power2.inOut"
  })
})

// Clock
function drawClock() {
  const now = new Date()
  const w = 512, h = 512

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = '#050505'
  for (let y = 0; y < h; y += 8) {
    ctx.fillRect(0, y, w, 2)
  }

  const hours = String(now.getHours()).padStart(2, '0')
  const mins = String(now.getMinutes()).padStart(2, '0')
  const secs = String(now.getSeconds()).padStart(2, '0')
  const colon = now.getSeconds() % 2 === 0 ? ':' : ' '

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 86px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${hours}${colon}${mins}`, w / 2, 210)

  ctx.fillStyle = '#9f9f9f'
  ctx.font = '28px monospace'
  ctx.fillText(`${secs} SEC`, w / 2, 285)

  ctx.fillStyle = '#ffffff'
  ctx.font = '24px monospace'
  ctx.fillText('ONLINE', w / 2, 350)

  ctx.beginPath()
  ctx.arc(190, 350, 7, 0, Math.PI * 2)
  ctx.fillStyle = now.getSeconds() % 2 === 0 ? '#ffffff' : '#555555'
  ctx.fill()
}

// Resize
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Animation loop
const render = () => {
  controls.update();

  fans.forEach((fan) => {
    fan.rotation.z -= 0.03
  })

  if (robot) {
    robot.position.y = robot.userData.initialPosition.y + Math.sin(Date.now() * 0.001) * 0.08
  }

  drawClock()
  clockTexture.needsUpdate = true

  raycaster.setFromCamera(pointer, camera);
  currentIntersects = raycaster.intersectObjects(raycasterObjects);

  for (let i = 0; i < currentIntersects.length; i++) {
    const obj = currentIntersects[i].object
    if (!obj.userData.originalMaterial) {
      obj.userData.originalMaterial = obj.material
      obj.material = obj.material.clone()
    }
  }

  if (currentIntersects.length > 0) {
    document.body.style.cursor = 'pointer'
  } else {
    document.body.style.cursor = 'default'
    raycasterObjects.forEach(obj => {
      if (obj.userData.originalMaterial) {
        obj.material = obj.userData.originalMaterial
        obj.userData.originalMaterial = null
      }
    })
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
};

render()
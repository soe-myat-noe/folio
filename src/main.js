import * as THREE from 'three';
import './style.scss'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap'


const canvas = document.querySelector("#experience-canvas");
const sizes ={
  width: window.innerWidth,
  height: window.innerHeight
}

//Scene
const scene = new THREE.Scene();

// Objects 
let fans = []
let robot = null
let clockScreen = null


//Clock Canvas Setup
const clockCanvas = document.createElement('canvas')
clockCanvas.width = 512
clockCanvas. height = 512 
const ctx = clockCanvas.getContext('2d')
const clockTexture = new THREE.CanvasTexture(clockCanvas)
clockTexture.flipY = false

//Camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(10, 9, -9.5);
scene.add(camera);

//Renderer
const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;



//Controls
const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5
controls.maxDistance = 20
controls.maxPolarAngle = Math.PI / 2
controls.enablePan = false


//Lighting
const dirLight = new THREE.DirectionalLight(0xfff5e0, 4);
dirLight.position.set(20, 10, 10);
dirLight.castShadow = true,
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.bias = -0.0001;
scene.add(dirLight);

const dirLight2 = new THREE.DirectionalLight(0xc9d5ff, 1.5);
dirLight2.position.set(-5, 3, -5);
scene.add(dirLight2);

const hemiLight = new THREE.HemisphereLight(0xc9d5ff, 0x444433, 1.5);
scene.add(hemiLight);

//Loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

//video material
const videoElement = document.createElement("video");
videoElement.src = "/textures/video/screensaver4.mp4"
videoElement.loop = true;
videoElement.muted = true;
videoElement.playsInline = true;
videoElement.autoplay = true;
videoElement.play()

const videoTexture = new THREE.VideoTexture(videoElement)
videoTexture.colorSpace = THREE.SRGBColorSpace;

//Load GLB
loader.load('/models/portfolio.glb', (glb) => {
  scene.add(glb.scene);


  //glass material
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    transmission: 1,
    thickness: 0.3,
    roughness: 0,
    metalness: 0,
    transparent: true,
    ior: 1.5,
  })

  //Traverse 
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

    if (child.material.name === 'mat_glass') {
      child.material = glassMaterial
      child.castShadow = false
      child.receiveShadow = false
    }

    if (child.name.includes("screen_02")) {
    child.material = new THREE.MeshBasicMaterial({
      map:videoTexture,
      color: new THREE.Color(0xaaaaaa)
    })
    }

    //Fans
     if (child.name.startsWith('pc_fan')) {
      fans.push(child)
    }

    

    //Robot
    if (child.name === 'robot_raycaster_1') {
      robot = child.parent
     robot.userData.initialPosition = { y: child.parent.position.y }
    }
    

    //Clock screen
    if (child.name === 'screen_01') {
      clockScreen = child
      clockScreen.material = new THREE.MeshBasicMaterial({ map: clockTexture })
    }
  })

  //bounding box
  const box = new THREE.Box3().setFromObject(glb.scene);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  //point orbit controls at the center
  controls.target.copy(center);
  controls.target.y += -1
  controls.update();

  //position camera based on the model size
  // camera.position.set(center.x + size.x, center.y + size.y, center.z + size.z * 2);
  camera.lookAt(center);
})

// Draw clock onto canvas
function drawClock() {
  const now = new Date()
  const w = 512, h = 512

  // Background
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, w, h)

  // Time
  const hours = String(now.getHours()).padStart(2, '0')
  const mins = String(now.getMinutes()).padStart(2, '0')
  const secs = String(now.getSeconds()).padStart(2, '0')

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 80px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${hours}:${mins}:${secs}`, w / 2, h / 2)
}

//Resize
window.addEventListener("resize", ()=> {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight;

  //Update Camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  //Update renderer
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Animation loop
const render = () => {
  controls.update();

  // Fans
  fans.forEach((fan) => {
    fan.rotation.z -= 0.03
  })

  // Robot float
  if (robot) {
    robot.position.y = robot.userData.initialPosition.y + Math.sin(Date.now() * 0.001) * 0.08
  }

  // Clock
  drawClock()
  clockTexture.needsUpdate = true

  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
};

render()

import "./style.css";

import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Water } from "three/examples/jsm/objects/Water";

// WINDOW EVENT LISTENER
window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

// SCENE
const scene = new THREE.Scene();

// CAMERA
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(70, 30, 80);

// RENDERER
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg"),
  antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x71BCE1, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

// CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
// controls.autoRotate = true;
// controls.autoRotate = 0.5;
// controls.enableDamping = true;
controls.minDistance = 50;
controls.maxDistance = 200;

// BACKGROUND

// GLTF
let mixer;
const gltfLoader = new GLTFLoader();
gltfLoader.load("./camping_buscraft_ambience/scene.gltf", (gltf) => {
  const model = gltf.scene;
  model.traverse((c) => {
    if (c.isMesh || c.isLight) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  model.position.y = 2;
  model.scale.set(5, 5, 5);
  scene.add(model);

  mixer = new THREE.AnimationMixer(model);
  const clips = gltf.animations;
  clips.forEach((clip) => {
    const action = mixer.clipAction(clip);
    action.play();
  });
});

//SHARK
let shark;
const loader = new GLTFLoader();
const sharky = null;
loader.load("./great_white_shark/scene.gltf", (gltf) => {
  const sharky = gltf.scene;
  sharky.traverse((c) => {
    if (c.isMesh || c.isLight) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  sharky.position.y = -5;
  sharky.position.x = 0;
  sharky.position.z = 85;
  sharky.rotateY(1.7);
  sharky.scale.set(0.02, 0.02, 0.02);

  scene.add(sharky);

  shark = new THREE.AnimationMixer(sharky);
  const sharkA = gltf.animations;
  sharkA.forEach((clip) => {
    const ac = shark.clipAction(clip);
    ac.play();
  });
});


// WATER
const water = new Water(new THREE.PlaneGeometry(2000, 2000), {
  textureWidth: 512,
  textureHeight: 512,
  waterNormals: new THREE.TextureLoader().load(
    "textures/water.jpeg",
    (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }
  ),
  sunDirection: new THREE.Vector3(),
  sunColor: 0xffffff,
  waterColor: 0x67C1CA,
  distortionScale: 3.7,
  fog: scene.fog !== undefined,
});
water.rotation.x = -Math.PI / 2;
scene.add(water);

// LIGHT
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 100, 100);
directionalLight.target.position.set(0, 0, 0);
directionalLight.castShadow = true;
scene.add(directionalLight);

// HELPER
const directionalLightHelper = new THREE.DirectionalLightHelper(
  directionalLight,
  15
);
const gridHelper = new THREE.GridHelper(300, 300);
scene.add(directionalLightHelper);

// CLOCK
const clock = new THREE.Clock();

function animate() {
  water.material.uniforms["time"].value += 1.0 / 60.0;
  // sharky.rotateY(0.002);
  if (mixer) {
    mixer.update(clock.getDelta());
  }

  if(shark){
    shark.update(clock.getDelta());
  }

  renderer.render(scene, camera);
  controls.update();
  requestAnimationFrame(animate);
}

animate();

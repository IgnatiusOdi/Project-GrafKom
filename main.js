import "./style.css";

import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FirstPersonControls } from "three/examples/jsm/controls/FirstPersonControls";
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
  110,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(0, 50, 50);

// RENDERER
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg"),
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x2b2f77, 1);
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.gammaFactor = 2.2;
renderer.outputEncoding = THREE.sRGBEncoding;
// renderer.toneMapping = THREE.ACESFilmicToneMapping;
// renderer.toneMappingExposure = 1.0;

// CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
// controls.autoRotate = true;
// controls.autoRotate = 0.5;
// controls.enableDamping = true;
// controls.minDistance = 50;
controls.maxDistance = 250;
// const controls = new FirstPersonControls(camera, renderer.domElement);
// controls.lookSpeed = 0.8;
// controls.movementSpeed = 5;

// CENTER SPHERE
const center = new THREE.Mesh(
  new THREE.SphereGeometry(2, 12, 12),
  new THREE.MeshStandardMaterial({
    transparent: true,
    opacity: 0,
  })
);
scene.add(center);

// MANAGER
const manager = new THREE.LoadingManager();
manager.onLoad = () => animate();

const gltfLoader = new GLTFLoader(manager);

// SHARK
let shark;
gltfLoader.load("./great_white_shark/scene.gltf", (gltf) => {
  let sharky = gltf.scene;
  sharky.traverse((c) => {
    if (c.isMesh || c.isLight) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });

  sharky.position.y = -5;
  sharky.position.x = 0;
  sharky.position.z = 80;
  sharky.rotateY(1.55);
  sharky.scale.set(0.02, 0.02, 0.02);

  center.add(sharky);

  shark = new THREE.AnimationMixer(sharky);
  let clip = THREE.AnimationClip.findByName(gltf.animations, "SwimFast");
  let action = shark.clipAction(clip);
  action.play();
});

// SHIP
let ship;
let shipModel;
gltfLoader.load("./ship/scene.gltf", (gltf) => {
  shipModel = gltf.scene;
  shipModel.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
      if (c.material.transparent) {
        shipModel.alphaMode = 'BLEND';
      } else if (c.material.alphaTest > 0.0 ) {
        shipModel.alphaMode = 'MASK';
        shipModel.alphaCutoff = c.material.alphaTest;
      }
    }
  });

  shipModel.position.y = 15;

  shipModel.scale.set(5, 5, 5);

  scene.add(shipModel);
});

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(150, 150),
  new THREE.MeshStandardMaterial({ color: 0x67c1ca })
);
floor.rotateX(- Math.PI / 2);
scene.add(floor);

// WATER
// const water = new Water(new THREE.BoxGeometry(100, 100, 5), {
//   textureWidth: 512,
//   textureHeight: 512,
//   waterNormals: new THREE.TextureLoader().load(
//     "textures/water.jpeg",
//     (texture) => {
//       texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
//     }
//   ),
//   sunDirection: new THREE.Vector3(),
//   sunColor: 0xffffff,
//   waterColor: 0x67c1ca,
//   distortionScale: 3.7,
//   fog: scene.fog !== undefined,
// });
// water.rotation.x = -Math.PI / 2;
// scene.add(water);

// LIGHT
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 100, 0);
directionalLight.target = center;
directionalLight.castShadow = true;
scene.add(directionalLight);

// HELPER
const directionalLightHelper = new THREE.DirectionalLightHelper(
  directionalLight,
  15
);
const gridHelper = new THREE.GridHelper(200, 200);
scene.add(directionalLightHelper);
scene.add(gridHelper);

// CLOCK
const clock = new THREE.Clock();

let sudutX = 0.001;
let sudutZ = 0.00025;

function animate() {
  center.rotateY(0.004);

  if (shark) {
    shark.update(clock.getDelta());
  }

  if (ship) {
    ship.update(clock.getDelta());
  }

  if (shipModel.rotation.x > 0.15 || shipModel.rotation.x < -0.02) {
    sudutX *= -1;
    console.log(shipModel.rotation.x);
  }

  if (shipModel.rotation.z > 0.03 || shipModel.rotation.z < -0.03) {
    sudutZ *= -1;
  }

  shipModel.rotateX(sudutX);
  shipModel.rotateY(sudutZ);
  shipModel.rotateZ(sudutZ);

  // water.material.uniforms["time"].value += 1.0 / 120.0;

  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// renderer.setAnimationLoop(animate);

animate();

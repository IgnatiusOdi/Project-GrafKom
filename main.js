import "./style.css";

import * as THREE from "three";
import { GUI } from "dat.gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Water } from "three/examples/jsm/objects/Water";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import Stats from 'three/examples/jsm/libs/stats.module.js';

// VARIABLES
let switchControls = 1;
let velocity = 0;
let sudutX = 0.001;
let sudutZ = 0.00025;
let goyang = 0.005;

// SCENE
const scene = new THREE.Scene();

// FOG
const fogger = new THREE.FogExp2(0xffffff, 0);
scene.fog = fogger;

// CAMERA
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 50, 50);

//STATS
const container = document.getElementById('kontainer');
const stats = new Stats();
stats.showPanel (0);
container.appendChild( stats.dom );


// RENDERER
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg"),
  powerPreference: "high-performance",
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
renderer.shadowMap.enabled = true;
renderer.outputEncoding = THREE.sRGBEncoding;

// CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.maxPolarAngle = Math.PI * 0.55;
controls.maxDistance = 100;
const pointerLockControls = new PointerLockControls(
  camera,
  renderer.domElement
);

const toggleButton = document.getElementById("control");
toggleButton.addEventListener("click", function () {
  if (switchControls == 1) {
    alert("Pointer Lock Controls Enabled");
    switchControls = 2;
    camera.position.y = 10;
    controls.enabled = false;
  } else {
    alert("Orbit Controls Enabled");
    switchControls = 1;
    controls.enabled = true;
  }
});

// CENTER SPHERE
const center = new THREE.Mesh(
  new THREE.SphereGeometry(2, 12, 12),
  new THREE.MeshStandardMaterial({
    transparent: true,
    opacity: 0,
  })
);
scene.add(center);

// LOADER MANAGER
const manager = new THREE.LoadingManager();
const gltfLoader = new GLTFLoader(manager);

// SHARK
let shark;
gltfLoader.load("./great_white_shark/scene.gltf", (gltf) => {
  let sharky = gltf.scene;
  sharky.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = false;
      c.receiveShadow = false;
    }
  });

  sharky.position.x = 0;
  sharky.position.y = -5;
  sharky.position.z = 45;
  sharky.rotateY(1.55);
  sharky.scale.set(0.02, 0.02, 0.02);

  center.add(sharky);

  shark = new THREE.AnimationMixer(sharky);
  let clip = THREE.AnimationClip.findByName(gltf.animations, "SwimFast");
  let action = shark.clipAction(clip);
  action.play();
});

// SHIP
let shipModel;
let sphereLampu;
let shipHullLantern;
let shipBowLantern;
let shipSternLantern;
const shipHullLight = new THREE.PointLight(0xc9343a, 5, 20, 5);
const shipBowLight = new THREE.PointLight(0xffbc3d, 5, 15, 5);
const shipSternLight = new THREE.PointLight(0xffffff, 5, 20, 5);
gltfLoader.load("./ship/scene.gltf", (gltf) => {
  shipModel = gltf.scene;
  shipModel.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });

  shipModel.position.y = 15;

  shipModel.scale.set(5, 5, 5);
  lanternLoader();
  scene.add(shipModel);
});

// SKY
let sun = new THREE.Vector3();
const parameters = { elevation: 0, azimuth: 0}
const sky = new Sky();
sky.scale.setScalar(250);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms["turbidity"].value = 0;
skyUniforms["rayleigh"].value = 1;
skyUniforms["mieCoefficient"].value = 0.1;
skyUniforms["mieDirectionalG"].value = 1;

// WATER
const waterNormal = new THREE.TextureLoader().load(
  "textures/water.jpeg",
  (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  }
);

const water = new Water(new THREE.BoxGeometry(250, 10, 250), {
  waterNormals: waterNormal,
  sunColor: 0xffffff,
  waterColor: 0x003851,
  distortionScale: 5,
  side: THREE.DoubleSide,
  fog: scene.fog !== undefined,
});
water.position.y = -5;
scene.add(water);

const pmremGenerator = new THREE.PMREMGenerator(renderer);

function updateSun() {
  const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
  const theta = THREE.MathUtils.degToRad(parameters.azimuth);

  sun.setFromSphericalCoords(1, phi, theta);

  skyUniforms["sunPosition"].value.copy(sun);
  water.material.uniforms["sunDirection"].value.copy(sun).normalize();
  scene.environment = pmremGenerator.fromScene(sky).texture;
}
updateSun();

// GUI
const gui = new GUI();
const lightFolder = gui.addFolder("Lighting");
lightFolder.open();
//SKY
const skyFolder = lightFolder.addFolder("Sky");
skyFolder.add(parameters, "elevation", 0, 90, 1).onChange(updateSun);
skyFolder.add(parameters, "azimuth", -180, 180, 1).onChange(updateSun);
skyFolder.open();
// LAMPU KAPAL
const shipLightFolder = lightFolder.addFolder("Lampu Kapal");
shipLightFolder.add(shipBowLight, "visible").name("Ship Bow Light");
shipLightFolder.add(shipBowLight,'intensity',0,5).name('Front Light Intensity');
shipLightFolder.add(shipHullLight, "visible").name("Ship Hull Light");
shipLightFolder.add(shipHullLight,'intensity',0,5).name('Middle Light Intensity');
shipLightFolder.add(shipSternLight, "visible").name("Ship Stern Light");
shipLightFolder.add(shipSternLight,'intensity',0,5).name('Back Light Intensity');


gui.add(fogger, "density", 0, 0.02, 0.001).name("Fog Density");

// CLOCK
const clock = new THREE.Clock();

function lanternLoader() {
  // SHIP HULL
  gltfLoader.load("./old_lantern/scene.gltf", (gltf) => {
    shipHullLantern = gltf.scene;
    shipHullLantern.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = false;
        c.receiveShadow = true;
      }
    });
    shipHullLantern.position.y = 0;
    shipHullLantern.position.z = 0.55;
    shipHullLantern.rotateY(1.55);
    shipHullLantern.scale.set(0.01, 0.01, 0.01);
    shipModel.add(shipHullLantern);

    // SHIP HULL LIGHT SOURCE
    shipHullLight.position.y = 4;
    shipHullLight.position.x = 4;
    shipHullLight.castShadow = true;
    shipHullLantern.add(shipHullLight);

  });

  // SHIP STERN
  gltfLoader.load("./old_street_lantern/scene.gltf", (gltf) => {
    shipSternLantern = gltf.scene;
    shipSternLantern.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = false;
        c.receiveShadow = true;
      }
    });
    shipSternLantern.position.x = -0.09;
    shipSternLantern.position.y = 0;
    shipSternLantern.position.z = 4.06;
    shipSternLantern.scale.set(0.03, 0.03, 0.03);
    shipModel.add(shipSternLantern);

    // SHIP STERN LIGHT SOURCE
    shipSternLight.position.x = -1;
    shipSternLight.position.y = 12;
    shipSternLight.position.z = 2;
    shipSternLight.castShadow = true;
    shipSternLantern.add(shipSternLight);

  });

  // SPHERE FOR SHIP BOW LANTERN PLACEMENT
  sphereLampu = new THREE.Mesh(
    new THREE.SphereGeometry(2, 12, 12),
    new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0,
    })
  );
  sphereLampu.position.x = 0.155;
  sphereLampu.position.y = 0.05;
  sphereLampu.position.z = -4.11;
  sphereLampu.scale.set(0.01, 0.01, 0.01);
  shipModel.add(sphereLampu);

  // SHIP BOW
  gltfLoader.load("./skull_lantern/scene.gltf", (gltf) => {
    shipBowLantern = gltf.scene;
    shipBowLantern.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = false;
        c.receiveShadow = true;
      }
    });
    shipBowLantern.position.y = -35;
    shipBowLantern.rotateY(3.1);
    shipBowLantern.scale.set(2, 2, 2);
    sphereLampu.add(shipBowLantern);

    // SHIP BOW LIGHT SOURCE
    shipBowLight.position.y = 5.5;
    shipBowLight.position.z = 0.2;
    shipBowLight.castShadow = true;
    shipBowLantern.add(shipBowLight);

  });
}

// EVENT LISTENER
window.addEventListener(
  "resize",
  () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  },
  false
);

document.addEventListener("click", () => {
  if (switchControls == 2) {
    pointerLockControls.lock();
  }
});

document.addEventListener("keydown", (e) => {
  if (pointerLockControls.isLocked) {
    if (e.key == "w") {
      pointerLockControls.moveForward(velocity);
    } else if (e.key == "a") {
      pointerLockControls.moveRight(-velocity);
    } else if (e.key == "s") {
      pointerLockControls.moveForward(-velocity);
    } else if (e.key == "d") {
      pointerLockControls.moveRight(velocity);
    }
  }
});

function animate() {
  water.material.uniforms["time"].value += 1.0 / 60.0;

  center.rotateY(0.01);

  stats.update();

  if (pointerLockControls.isLocked) {
    velocity = 300 * clock.getDelta();
    if (velocity > 50) {
      console.log(velocity);
    }
  }

  if (shark) {
    shark.update(clock.getDelta());
  }

  if (sphereLampu) {
    if (sphereLampu.rotation.z > 0.2 || sphereLampu.rotation.z < -0.2)
      goyang *= -1;
  }

  if (shipModel) {
    if (shipModel.rotation.x > 0.15 || shipModel.rotation.x < -0.02) {
      sudutX *= -1;
      // console.log(shipModel.rotation.x);
    }

    if (shipModel.rotation.z > 0.03 || shipModel.rotation.z < -0.03) {
      sudutZ *= -1;
    }

    shipModel.rotateX(sudutX);
    shipModel.rotateY(sudutZ);
    shipModel.rotateZ(sudutZ);
    sphereLampu.rotateZ(goyang);
  }

  if (switchControls == 1) {
    controls.update();
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

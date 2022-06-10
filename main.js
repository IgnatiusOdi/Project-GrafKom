import "./style.css";

import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Water } from "three/examples/jsm/objects/Water";

let switchControls = 1;

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
// controls.maxDistance = 250;

window.addEventListener("keydown", function(e) {
  if (e.defaultPrevented) {
    return;
  }

  if (e.key == "`") {
    if (switchControls == 1) {
      this.window.alert("Pointer Lock Controls Enabled");
      switchControls = 2;
      camera.position.y = 10;
      controls.enabled = false;
    } else {
      this.window.alert("Orbit Controls Enabled");
      switchControls = 1;
      controls.enabled = true;
    }
  }

  if (pointerLockControls.isLocked) {
    if (e.key == "w") {
      pointerLockControls.moveForward(2);
    } else if (e.key == "a") {
      pointerLockControls.moveRight(-2);
    } else if (e.key == "s") {
      pointerLockControls.moveForward(-2);
    } else if (e.key == "d") {
      pointerLockControls.moveRight(2);
    }
  }
});

const pointerLockControls = new PointerLockControls(
  camera,
  renderer.domElement
);
window.addEventListener("click", function () {
  if (switchControls == 2) {
    pointerLockControls.lock();
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
let shipModel;
let sphereLampu;
let lantern3OBJ;
gltfLoader.load("./ship/scene.gltf", (gltf) => {
  shipModel = gltf.scene;
  shipModel.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
      if (c.material.transparent) {
        shipModel.alphaMode = "BLEND";
      } else if (c.material.alphaTest > 0.0) {
        shipModel.alphaMode = "MASK";
        shipModel.alphaCutoff = c.material.alphaTest;
      }
    }
  });

  shipModel.position.y = 15;

  shipModel.scale.set(5, 5, 5);
  lanternLoader();
  scene.add(shipModel);
});

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(150, 150),
  new THREE.MeshStandardMaterial({ color: 0x67c1ca })
);
floor.rotateX(-Math.PI / 2);
scene.add(floor);

//WATER
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
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
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
let goyang = 0.005;



function animate() {
  center.rotateY(0.004);

  if (shark) {
    shark.update(clock.getDelta());
  }

  if(sphereLampu){
    if(sphereLampu.rotation.z > 0.2 || sphereLampu.rotation.z < -0.2)
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

  // water.material.uniforms["time"].value += 1.0 / 120.0;

  requestAnimationFrame(animate);
  if (switchControls == 1) {
    controls.update();
  }
  renderer.render(scene, camera);
}

function lanternLoader(){

  //lampu kapal #1
  let lantern1OBJ;
  gltfLoader.load("./old_lantern/scene.gltf", (gltf) => {
    lantern1OBJ = gltf.scene;
    lantern1OBJ.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = false;
        c.receiveShadow = true;
      }
    });
    lantern1OBJ.position.y = 0;
    lantern1OBJ.rotateY(1.55);
    lantern1OBJ.position.z = 0.55;
    lantern1OBJ.scale.set(0.01, 0.01, 0.01);
    shipModel.add(lantern1OBJ);
    //light source buat lampu abal
    const lsLant1 = new THREE.PointLight(0xc9343a, 8, 45, 5);
    lsLant1.position.y = 4;
    lsLant1.position.x = 4;
  
    lsLant1.castShadow = true;
    //light helper
    const lsHelper = new THREE.PointLightHelper(lsLant1, 10);
    lantern1OBJ.add(lsLant1);
    scene.add(lsHelper);
  });
  
  //lampu ke 2 (putih)
  let lantern2OBJ;
  gltfLoader.load("./old_street_lantern/scene.gltf", (gltf) => {
    lantern2OBJ = gltf.scene;
    lantern2OBJ.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = false;
        c.receiveShadow = true;
      }
    });
    lantern2OBJ.position.y = 0;
  
    lantern2OBJ.position.z = 4.06;
    lantern2OBJ.position.x = -0.09;
    lantern2OBJ.scale.set(0.03, 0.03, 0.03);
    shipModel.add(lantern2OBJ);
    //light source buat lampu putih
    const lsLant2 = new THREE.PointLight(0xffffff, 5, 45, 5);
    lsLant2.position.y = 12;
    lsLant2.position.x = -1;
    lsLant2.position.z = 2;
    lsLant2.castShadow = true;
    //light helper
    const lsHelper2 = new THREE.PointLightHelper(lsLant2, 1);
    lantern2OBJ.add(lsLant2);
    scene.add(lsHelper2);
  });
  //sphere buat pacuan lampu gantung
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
    sphereLampu.scale.set(0.01,0.01,0.01);
  
  shipModel.add(sphereLampu);
  //lampu ke 3 (kuning / terngkorak)
  gltfLoader.load("./skull_lantern/scene.gltf", (gltf) => {
  lantern3OBJ = gltf.scene;
  lantern3OBJ.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = false;
      c.receiveShadow = true;
    }
  });
  lantern3OBJ.rotateY(3.1);
  lantern3OBJ.position.y = -35;
  lantern3OBJ.scale.set(2, 2, 2);
  sphereLampu.add(lantern3OBJ);
  
  //light source buat lampu 3
  const lsLant3 = new THREE.PointLight(0xffbc3d, 5, 45, 5);
  lsLant3.position.y = 5.5;
  // lsLant3.position.x = -1;
  lsLant3.position.z = 0.2;
  lsLant3.castShadow = true;
  //light helper
  const lsHelper3 = new THREE.PointLightHelper(lsLant3, 1);
  lantern3OBJ.add(lsLant3);
  scene.add(lsHelper3);
  });
  }

animate();

import earthMtl from '$lib/assets/Earth/Earth.mtl?url';
import earthObj from '$lib/assets/Earth/Earth.obj?url';
import data from '$lib/state/data.svelte.js';
import points from '$lib/state/points.svelte.js';
import position from '$lib/state/position.svelte.js';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import Worker from '$lib/workers/points.js?worker';

let camera, scene, renderer, controls, locked = false;
let earth = null;
let direction = new Set();
let stars = null;
let worker = null;

const starFactor = 10000;
const rotation = { x: 0, y: 0, z: 0 };

const speed = 0.1;
const clock = new THREE.Clock();

$effect.root(() => {
  $effect(() => {
    if (!data.d || !stars || !scene) return;
    const geometry = new THREE.SphereGeometry(1, 4, 4);
    const material = new THREE.MeshBasicMaterial({ color: 0xFFF6E2 });
    const instancedMesh = new THREE.InstancedMesh(geometry, material, data.d.length);

    const dummy = new THREE.Object3D();
    data.d.forEach(({ x, y, z }, i) => {
      dummy.position.set(starFactor * x, starFactor * y, starFactor * z);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    });

    stars.add(instancedMesh);
  });

  $effect(() => {
    if (!data.d || !worker) return;
    worker.postMessage({ action: 'data', payload: JSON.stringify(data.d) });
  });
});

export const init = async () => {
  worker = new Worker();
  worker.onmessage = event => {
    points.p = JSON.parse(event.data);
  };

  camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 14, 0);

  scene = new THREE.Scene();

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0, 1);
  camera.add(pointLight);
  scene.add(camera);

  new MTLLoader()
    .load(earthMtl, materials => {
      materials.preload();

      new OBJLoader()
        .setMaterials(materials)
        .load(earthObj, object => {
          const factor = 0.0001;
          object.children[0].geometry.computeBoundingBox();
          object.children[0].geometry.center();
          object.scale.setScalar(factor);
          scene.add(object);

          earth = object;
        });
    });

  stars = new THREE.Group();
  scene.add(stars);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);

  controls = new PointerLockControls(camera, document.body);

  return renderer.domElement;
};

export const handleLock = () => {
  controls.lock();
  locked = true;
};

export const handleKeydown = e => {
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
      direction.add('up');
      break;
    case 'ArrowDown':
    case 's':
      direction.add('down');
      break;
    case 'ArrowLeft':
    case 'a':
      direction.add('left');
      break;
    case 'ArrowRight':
    case 'd':
      direction.add('right');
      break;
    default:
      break;
  }
};

export const handleKeyup = e => {
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
      direction.delete('up');
      break;
    case 'ArrowDown':
    case 's':
      direction.delete('down');
      break;
    case 'ArrowLeft':
    case 'a':
      direction.delete('left');
      break;
    case 'ArrowRight':
    case 'd':
      direction.delete('right');
      break;
    case 'Escape':
      controls.unlock();
      locked = false;
      break;
    default:
      break;
  }
};

export const handleMousemove = () => locked && worker.postMessage({ action: 'rotation', payload: JSON.stringify({ rotation, camera: camera.matrixWorld }) });

export const handleResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
};

const animate = () => {
  const delta = clock.getDelta();
  const rotationSpeed = speed * delta;

  if (direction.size) {
    const axis = new THREE.Vector3();
    if (direction.has('up')) {
      camera.getWorldDirection(axis);
      axis.cross(camera.up);
    }
    if (direction.has('down')) {
      camera.getWorldDirection(axis);
      axis.cross(camera.up).negate();
    }
    if (direction.has('left')) {
      camera.getWorldDirection(axis);
    }
    if (direction.has('right')) {
      camera.getWorldDirection(axis).negate();
    }

    if (axis.length() > 0) {
      earth.rotateOnWorldAxis(axis, rotationSpeed);
      stars.rotateOnWorldAxis(axis, rotationSpeed);

      rotation.x = stars.rotation.x;
      rotation.y = stars.rotation.y;
      rotation.z = stars.rotation.z;

      worker.postMessage({ action: 'rotation', payload: JSON.stringify(rotation) });
      position.p = camera.matrixWorld;
    }
  }

  renderer.render(scene, camera);
};

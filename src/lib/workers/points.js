import * as THREE from 'three';

let data = null;
const points = [];

// Assuming you already have a camera (camera) and a list of coordinates (coordinates)
// coordinates is an array of {x, y, z} objects

const toCameraBasis = (camera, coordinates) => {
  const cameraRotation = new THREE.Matrix4();
  cameraRotation.makeRotationFromEuler(camera);
  // Prepare a new array to store the transformed coordinates
  return coordinates.map(coord => {
    // Create a vector for the current coordinate
    const vec = new THREE.Vector3(coord.x, coord.y, coord.z);

    // Apply the inverse of the camera's rotation to get the coordinates in the camera's local basis
    vec.applyMatrix4(cameraRotation);

    return {
      x: vec.x,
      y: vec.y,
      z: vec.z
    };
  });
}

self.onmessage = async event => {
  const { action, payload } = event.data;

  switch (action) {
    case 'data':
      data = JSON.parse(payload);
      break;
    case 'rotation':
      const rotation = JSON.parse(payload);
      data.forEach(({ x, y, z }, i) => {
        const point = new THREE.Vector3(x, y, z);
        point.applyEuler(new THREE.Euler(rotation.x, rotation.y, rotation.z));
        points[i] ??= {};
        points[i].x = point.x;
        points[i].y = point.y;
        points[i].z = point.z;
      });
      self.postMessage(JSON.stringify(points));
      break;
  }

};

// === CONFIGURACIÓN BÁSICA DE THREE.JS ===
const container = document.getElementById("container");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Controles
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// === ILUMINACIÓN ===
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(3, 3, 3);
scene.add(light);

// === FUNCIONES PARA CREAR GEOMETRÍAS DESDE CERO ===
function createSphere(radius = 1, widthSegments = 50, heightSegments = 25) {
  const vertices = [];
  const indices = [];

  for (let i = 0; i <= widthSegments; i++) {
    const u = (i / widthSegments) * 2 * Math.PI;
    for (let j = 0; j <= heightSegments; j++) {
      const v = (j / heightSegments) * Math.PI;
      const x = radius * Math.sin(v) * Math.cos(u);
      const y = radius * Math.sin(v) * Math.sin(u);
      const z = radius * Math.cos(v);
      vertices.push(x, y, z);
    }
  }

  for (let i = 0; i < widthSegments; i++) {
    for (let j = 0; j < heightSegments; j++) {
      const a = i * (heightSegments + 1) + j;
      const b = (i + 1) * (heightSegments + 1) + j;
      const c = (i + 1) * (heightSegments + 1) + (j + 1);
      const d = i * (heightSegments + 1) + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function createPlane(size = 2, widthSegments = 10, heightSegments = 10) {
  const vertices = [];
  const indices = [];

  for (let i = 0; i <= widthSegments; i++) {
    const u = (i / widthSegments - 0.5) * size;
    for (let j = 0; j <= heightSegments; j++) {
      const v = (j / heightSegments - 0.5) * size;
      const x = u;
      const y = v;
      const z = 0;
      vertices.push(x, y, z);
    }
  }

  for (let i = 0; i < widthSegments; i++) {
    for (let j = 0; j < heightSegments; j++) {
      const a = i * (heightSegments + 1) + j;
      const b = (i + 1) * (heightSegments + 1) + j;
      const c = (i + 1) * (heightSegments + 1) + (j + 1);
      const d = i * (heightSegments + 1) + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
            /*
        a ---- d
        |    / |
        |  /   |
        b ---- c
      */
    }
  }

  const geometry = new THREE.BufferGeometry(); // box, sphere 
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

// === MATERIALES ===
const surfaceMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.1,
  roughness: 0.7,
  side: THREE.DoubleSide
});

const wireframeMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
  side: THREE.DoubleSide,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1
});

// === MALLAS ===
const sphereGeometry = createSphere(1, 50, 25);
const sphereSurface = new THREE.Mesh(sphereGeometry, surfaceMaterial);
const sphereWire = new THREE.Mesh(sphereGeometry, wireframeMaterial);

const planeGeometry = createPlane(2, 10, 10);
const planeSurface = new THREE.Mesh(planeGeometry, surfaceMaterial);
const planeWire = new THREE.Mesh(planeGeometry, wireframeMaterial);

// === NOISE CONFIG ===
let noiseActive = false;
let time = 0;
const originalPositions = {
  sphere: sphereGeometry.attributes.position.array.slice(),
  plane: planeGeometry.attributes.position.array.slice(),
};

const simplex = new SimplexNoise();
function noise3D(x, y, z) {
  return simplex.noise3D(x + time * 0.1, y + time * 0.1, z + time * 0.1);
}

// === AUDIO ===
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let oscillator;
let gainNode = audioCtx.createGain();
gainNode.gain.value = 0.1;
gainNode.connect(audioCtx.destination);
let soundActive = false;

function toggleSound() {
  if (!soundActive) {
    oscillator = audioCtx.createOscillator();
    oscillator.type = "sine";
    oscillator.connect(gainNode);
    oscillator.start();
    soundActive = true;
  } else {
    oscillator.stop();
    soundActive = false;
  }
}

// === PUNTO VISUALIZADOR ===
const pointGeometry = new THREE.SphereGeometry(0.03, 8, 8);
const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
scene.add(pointMesh);
let pointIndex = 0; // índice para recorrer vertices

// === ESTADO DE MODO ===
let currentMode = 1; // 1 = plano, 2 = esfera
scene.add(sphereSurface);
scene.add(sphereWire);

// === FUNCIONES DE TECLAS ===
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "n") noiseActive = !noiseActive;
  if (e.key === "1") switchMode(1);
  if (e.key === "2") switchMode(2);
  if (e.key.toLowerCase() === "a") toggleSound();
});

function switchMode(mode) {
  scene.remove(sphereSurface, sphereWire, planeSurface, planeWire);

  if (mode === 1) {
    scene.add(planeSurface);
    scene.add(planeWire);
  } else {
    scene.add(sphereSurface);
    scene.add(sphereWire);
  }

  currentMode = mode;
  pointIndex = 0; // reiniciar punto
}

// === ANIMACIÓN ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  const group = currentMode === 1
    ? { geom: planeGeometry, base: originalPositions.plane, isPlane: true }
    : { geom: sphereGeometry, base: originalPositions.sphere, isPlane: false };

  const pos = group.geom.attributes.position;
  const arr = pos.array;
  const base = group.base;

  if (noiseActive) {
    time += 0.02;
    let avgZ = 0;

    for (let i = 0; i < arr.length; i += 3) {
      const x = base[i];
      const y = base[i + 1];
      const z = base[i + 2];
      const n = noise3D(x * 1.5, y * 1.5, z * 1.5);

      if (group.isPlane) {
        arr[i + 2] = z + n * 0.2;
        avgZ += arr[i + 2];
      } else {
        const offset = n * 0.2;
        arr[i] = x + offset * x;
        arr[i + 1] = y + offset * y;
        arr[i + 2] = z + offset * z;
        avgZ += Math.sqrt(arr[i]**2 + arr[i+1]**2 + arr[i+2]**2);
      }
    }

    pos.needsUpdate = true;
    group.geom.computeVertexNormals();

    // Actualizar frecuencia del sintetizador
    if (soundActive && oscillator) {
      if (group.isPlane) {
        const zMean = avgZ / (arr.length / 3);
        oscillator.frequency.value = THREE.MathUtils.mapLinear(zMean, -0.2, 0.2, 200, 800);
      } else {
        const rMean = avgZ / (arr.length / 3);
        oscillator.frequency.value = THREE.MathUtils.mapLinear(rMean, 0.8, 1.2, 200, 800);
      }
    }

    // Actualizar posición del punto
    pointIndex = (pointIndex + 3) % arr.length;
    pointMesh.position.set(arr[pointIndex], arr[pointIndex + 1], arr[pointIndex + 2]);
  } else {
    pos.array.set(group.base);
    pos.needsUpdate = true;
    group.geom.computeVertexNormals();
  }

  renderer.render(scene, camera);
}

animate();

// === AJUSTE AL REDIMENSIONAR ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === MENSAJE DE AYUDA ===
console.log("Presiona '1' para plano, '2' para esfera, 'n' para noise, 'a' para sonido");

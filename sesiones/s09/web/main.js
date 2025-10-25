let cols = 40;   // cantidad de cubos en X
let rows = 30;   // cantidad de cubos en Y
let contador = 0;

// Escena y cámara
const container = document.getElementById('container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 800);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Control de cámara (similar a orbitControl() de p5)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Luz ambiental (similar a lights() de p5)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Simplex Noise
const noise = new SimplexNoise();

// Cubos
const cubos = [];
const intervaloX = 800 / cols;
const intervaloY = 600 / rows;

// Crear cubos - cada uno con tamaño relativo al espacio
for(let i = 0; i < cols; i++){
    cubos[i] = [];
    for(let j = 0; j < rows; j++){
        // El cubo ocupa casi todo el espacio disponible (90%)
        const geometry = new THREE.BoxGeometry(
            intervaloX * 0.9, 
            intervaloY * 0.9, 
            intervaloX * 0.9
        );
        
        const material = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(0xff0000) 
        });
        
        const cube = new THREE.Mesh(geometry, material);
        
        // Posición similar a p5.js (centrado en el grid)
        cube.position.set(
            i * intervaloX - 400 + intervaloX/2, 
            j * intervaloY - 300 + intervaloY/2, 
            0
        );
        
        scene.add(cube);
        cubos[i][j] = cube;
    }
}

// Animación
function animate(){
    requestAnimationFrame(animate);

    for(let i = 0; i < cols; i++){
        for(let j = 0; j < rows; j++){
            let x = i * 0.01;
            let y = j * 0.01;
            
            // Usar noise 3D con contador (como en p5.js)
            let n = noise.noise3D(x*5, y*5, contador); // -1 a 1
            
            // Mapear de -1,1 a 0,1 (como noise() de p5.js)
            let nNormalized = (n + 1) / 2; // 0 a 1
            
            // Mapear altura (-100 a 100) como en p5.js
            let nMap = THREE.MathUtils.mapLinear(nNormalized, 0, 1, -100, 100);
            cubos[i][j].position.z = nMap;

            // Color HSB (Hue de 0-1 basado en noise)
            let hue = nNormalized; // 0-1
            cubos[i][j].material.color.setHSL(hue, 1, 0.5);
        }
    }

    contador += 0.001; // Misma velocidad que p5.js
    controls.update();
    renderer.render(scene, camera);
}

animate();

// Ajuste al redimensionar ventana
window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
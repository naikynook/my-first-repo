// orbiting-grid-sphere.js
// Stationary Three.js sphere with a grid texture; OrbitControls move the camera

(function() {
  const WIDTH = 800;
  const HEIGHT = 400;

  // Scene + white backdrop
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 100);
  camera.position.set(0, 0.2, 5.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.getElementById('threejs-container-1').appendChild(renderer.domElement);

  // Drag to orbit, scroll to zoom - sphere itself stays still
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 2.8;
  controls.maxDistance = 10;

  // Soft key + fill lighting so the grid reads on the sphere
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.65);
  keyLight.position.set(4, 5, 6);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.25);
  fillLight.position.set(-4, -2, -3);
  scene.add(fillLight);

  // Draw a 2D grid on a canvas, then use it as the sphere’s texture map
  function createGridTexture() {
    const cols = 24;
    const rows = 12;
    const cellSize = 32;
    const spacing = 4;

    const canvas = document.createElement('canvas');
    canvas.width = cols * (cellSize + spacing);
    canvas.height = rows * (cellSize + spacing);

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * (cellSize + spacing);
        const y = j * (cellSize + spacing);
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    return texture;
  }

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 64, 64),
    new THREE.MeshPhongMaterial({
      map: createGridTexture(),
      shininess: 12,
      specular: 0x222222
    })
  );
  scene.add(globe);

  // Render loop - only controls.update() for damping; no object rotation
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
})();

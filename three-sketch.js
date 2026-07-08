// three-sketch.js
// Rotating sphere with a white cell grid on a white background

(function() {
  const WIDTH = 800;
  const HEIGHT = 400;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 100);
  camera.position.set(0, 0.2, 5.2);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.getElementById('threejs-container-1').appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.65);
  keyLight.position.set(4, 5, 6);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.25);
  fillLight.position.set(-4, -2, -3);
  scene.add(fillLight);

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

  function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.004;
    renderer.render(scene, camera);
  }

  animate();
})();

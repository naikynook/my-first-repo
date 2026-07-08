// zoom-pan.js
// Interactive Three.js sphere: grid texture, scroll zoom, density slider, click wave

(function() {
  const WIDTH = 800;
  const HEIGHT = 400;
  const SPHERE_RADIUS = 1.6;
  const SPACING = 4;
  const CELL_SIZE = 32;
  const WAVE_SPEED = 8;
  const WAVE_WIDTH = 100;

  const container = document.getElementById('canvas-container-3');
  container.innerHTML = '';

  const controls = document.createElement('div');
  controls.className = 'three-controls';
  controls.innerHTML =
    '<label for="grid-density-slider">Grid density: <span id="grid-density-value">24</span> columns</label>' +
    '<input id="grid-density-slider" type="range" min="8" max="48" step="2" value="24">';
  container.parentNode.insertBefore(controls, container);

  const slider = controls.querySelector('#grid-density-slider');
  const sliderValue = controls.querySelector('#grid-density-value');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 100);
  const initialCameraZ = 5.2;
  camera.position.set(0, 0.2, initialCameraZ);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.65);
  keyLight.position.set(4, 5, 6);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.25);
  fillLight.position.set(-4, -2, -3);
  scene.add(fillLight);

  const gridCanvas = document.createElement('canvas');
  const gridCtx = gridCanvas.getContext('2d');
  const texture = new THREE.CanvasTexture(gridCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;

  const globeMaterial = new THREE.MeshPhongMaterial({
    map: texture,
    shininess: 12,
    specular: 0x222222
  });

  const globe = new THREE.Mesh(new THREE.SphereGeometry(SPHERE_RADIUS, 64, 64), globeMaterial);
  scene.add(globe);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  let cols = 24;
  let rows = 12;
  let frameCount = 0;
  let waveRadius = 0;
  let isAnimating = false;
  let clickX = 0;
  let clickY = 0;

  function setGridDensity(value) {
    cols = value;
    rows = Math.max(6, Math.round(cols / 2));
    sliderValue.textContent = String(cols);
    gridCanvas.width = cols * (CELL_SIZE + SPACING);
    gridCanvas.height = rows * (CELL_SIZE + SPACING);
    isAnimating = false;
    waveRadius = 0;
    drawGridTexture();
  }

  function uvToGridPoint(u, v) {
    return {
      x: u * gridCanvas.width,
      y: (1 - v) * gridCanvas.height
    };
  }

  function gridDistance(x1, y1, x2, y2) {
    let dx = Math.abs(x1 - x2);
    dx = Math.min(dx, gridCanvas.width - dx);
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function setClickFromUv(u, v) {
    const point = uvToGridPoint(u, v);
    const cellI = Math.min(cols - 1, Math.max(0, Math.floor(point.x / (CELL_SIZE + SPACING))));
    const cellJ = Math.min(rows - 1, Math.max(0, Math.floor(point.y / (CELL_SIZE + SPACING))));
    clickX = cellI * (CELL_SIZE + SPACING) + CELL_SIZE / 2;
    clickY = cellJ * (CELL_SIZE + SPACING) + CELL_SIZE / 2;
  }

  function drawGridTexture() {
    gridCtx.fillStyle = '#000000';
    gridCtx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);

    let anySquareActive = false;
    const maxDistance = Math.sqrt(
      Math.pow(gridCanvas.width / 2, 2) + Math.pow(gridCanvas.height / 2, 2)
    );

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * (CELL_SIZE + SPACING);
        const y = j * (CELL_SIZE + SPACING);
        const centerX = x + CELL_SIZE / 2;
        const centerY = y + CELL_SIZE / 2;

        if (isAnimating) {
          const distance = gridDistance(clickX, clickY, centerX, centerY);

          if (distance < waveRadius && distance > waveRadius - WAVE_WIDTH) {
            anySquareActive = true;
            const hue = (Math.sin(frameCount * 0.12) * 180 + 180 + distance * 1.4) % 360;
            gridCtx.fillStyle = 'hsl(' + hue + ', 90%, 55%)';
          } else {
            gridCtx.fillStyle = '#ffffff';
          }
        } else {
          gridCtx.fillStyle = '#ffffff';
        }

        gridCtx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }

    texture.needsUpdate = true;

    if (isAnimating && !anySquareActive && waveRadius > maxDistance) {
      isAnimating = false;
      waveRadius = 0;
    }
  }

  function onPointerClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(globe);

    if (hits.length > 0) {
      setClickFromUv(hits[0].uv.x, hits[0].uv.y);
      waveRadius = 0;
      isAnimating = true;
    }
  }

  function onWheel(event) {
    event.preventDefault();
    camera.position.z += event.deltaY * 0.004;
    camera.position.z = Math.max(2.8, Math.min(10, camera.position.z));
  }

  renderer.domElement.addEventListener('click', onPointerClick);
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

  slider.addEventListener('input', function() {
    setGridDensity(parseInt(slider.value, 10));
  });

  setGridDensity(parseInt(slider.value, 10));

  function animate() {
    requestAnimationFrame(animate);
    frameCount++;

    if (isAnimating) {
      waveRadius += WAVE_SPEED;
    }

    drawGridTexture();
    globe.rotation.y += 0.004;
    renderer.render(scene, camera);
  }

  animate();
})();

// blank-canvas.js
// Empty Three.js canvas placeholder

(function() {
  const WIDTH = 800;
  const HEIGHT = 400;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.getElementById('threejs-container-0').appendChild(renderer.domElement);

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();
})();

// three-sketch.js
// Rotating lush earth globe with butterflies on a white background

(function() {
  const WIDTH = 800;
  const HEIGHT = 400;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 100);
  camera.position.set(0, 0.4, 5.2);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  document.getElementById('threejs-container-1').appendChild(renderer.domElement);

  const clock = new THREE.Clock();

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff8e7, 1.1);
  sunLight.position.set(4, 6, 5);
  sunLight.castShadow = true;
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(0xc8e6c9, 0.45);
  fillLight.position.set(-5, 2, -3);
  scene.add(fillLight);

  function createLushEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const ocean = ctx.createLinearGradient(0, 0, 0, 512);
    ocean.addColorStop(0, '#1f7aa8');
    ocean.addColorStop(0.5, '#2b95c4');
    ocean.addColorStop(1, '#1a6f96');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, 1024, 512);

    const forestGreens = ['#0d4f1c', '#1b5e20', '#2e7d32', '#388e3c', '#43a047', '#52b788', '#66bb6a'];
    const landMasses = [
      [180, 180, 220, 140], [520, 160, 280, 150], [760, 220, 180, 120],
      [300, 300, 200, 100], [620, 320, 240, 110], [100, 340, 160, 90]
    ];

    landMasses.forEach(function(mass) {
      ctx.fillStyle = forestGreens[Math.floor(Math.random() * forestGreens.length)];
      ctx.beginPath();
      ctx.ellipse(mass[0], mass[1], mass[2], mass[3], 0, 0, Math.PI * 2);
      ctx.fill();
    });

    for (let i = 0; i < 180; i++) {
      ctx.fillStyle = forestGreens[Math.floor(Math.random() * forestGreens.length)];
      ctx.globalAlpha = 0.55 + Math.random() * 0.45;
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const r = 8 + Math.random() * 45;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.5 + Math.random() * 0.4), Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    for (let i = 0; i < 55; i++) {
      ctx.fillStyle = 'rgba(120, 210, 235, 0.75)';
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const r = 4 + Math.random() * 18;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 30; i++) {
      ctx.strokeStyle = 'rgba(90, 190, 220, 0.7)';
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      let x = Math.random() * 1024;
      let y = Math.random() * 512;
      ctx.moveTo(x, y);
      for (let j = 0; j < 4; j++) {
        x += (Math.random() - 0.5) * 60;
        y += (Math.random() - 0.5) * 30;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = '#1b4332';
      ctx.globalAlpha = 0.35 + Math.random() * 0.4;
      ctx.beginPath();
      ctx.arc(Math.random() * 1024, Math.random() * 512, 2 + Math.random() * 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    return texture;
  }

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 64, 64),
    new THREE.MeshPhongMaterial({
      map: createLushEarthTexture(),
      shininess: 18,
      specular: 0x335544
    })
  );
  globe.castShadow = true;
  globe.receiveShadow = true;
  scene.add(globe);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.68, 48, 48),
    new THREE.MeshBasicMaterial({
      color: 0x81c784,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide
    })
  );
  scene.add(atmosphere);

  function createButterfly(wingColor, accentColor) {
    const group = new THREE.Group();

    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.bezierCurveTo(0.08, 0.06, 0.16, 0.04, 0.18, 0);
    wingShape.bezierCurveTo(0.16, -0.05, 0.08, -0.04, 0, 0);

    const wingGeometry = new THREE.ShapeGeometry(wingShape);
    const leftWing = new THREE.Mesh(
      wingGeometry,
      new THREE.MeshBasicMaterial({ color: wingColor, side: THREE.DoubleSide, transparent: true, opacity: 0.92 })
    );
    leftWing.position.set(-0.02, 0, 0);
    leftWing.scale.set(1.2, 1.2, 1.2);

    const rightWing = new THREE.Mesh(
      wingGeometry,
      new THREE.MeshBasicMaterial({ color: accentColor, side: THREE.DoubleSide, transparent: true, opacity: 0.92 })
    );
    rightWing.position.set(0.02, 0, 0);
    rightWing.rotation.y = Math.PI;
    rightWing.scale.set(1.2, 1.2, 1.2);

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.018, 0.1, 6),
      new THREE.MeshBasicMaterial({ color: 0x2d2d2d })
    );
    body.rotation.x = Math.PI / 2;

    const antennaL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.05, 4),
      new THREE.MeshBasicMaterial({ color: 0x2d2d2d })
    );
    antennaL.position.set(-0.015, 0.05, 0.02);
    antennaL.rotation.z = 0.4;

    const antennaR = antennaL.clone();
    antennaR.position.set(0.015, 0.05, 0.02);
    antennaR.rotation.z = -0.4;

    group.add(leftWing, rightWing, body, antennaL, antennaR);
    group.userData.leftWing = leftWing;
    group.userData.rightWing = rightWing;
    group.userData.flapOffset = Math.random() * Math.PI * 2;
    group.scale.set(1.4, 1.4, 1.4);

    return group;
  }

  const butterflyPalette = [
    [0xffb347, 0xff6b6b],
    [0xffd166, 0xf8961e],
    [0xc77dff, 0x7b4bb7],
    [0x90e0ef, 0x48cae4],
    [0xffafcc, 0xff4d6d],
    [0xb7e4c7, 0x52b788],
    [0xf9c74f, 0xf9844a],
    [0xa8dadc, 0x457b9d]
  ];

  const butterflies = [];

  for (let i = 0; i < 14; i++) {
    const colors = butterflyPalette[i % butterflyPalette.length];
    const butterfly = createButterfly(colors[0], colors[1]);
    scene.add(butterfly);

    butterflies.push({
      mesh: butterfly,
      radius: 2.1 + Math.random() * 0.9,
      speed: 0.25 + Math.random() * 0.35,
      inclination: (Math.random() - 0.5) * Math.PI * 0.9,
      phase: Math.random() * Math.PI * 2,
      bobAmount: 0.08 + Math.random() * 0.18,
      bobSpeed: 1.5 + Math.random() * 1.5,
      flapSpeed: 10 + Math.random() * 6
    });
  }

  function updateButterflies(time) {
    butterflies.forEach(function(b) {
      const angle = time * b.speed + b.phase;
      const x = Math.cos(angle) * b.radius * Math.cos(b.inclination);
      const z = Math.sin(angle) * b.radius * Math.cos(b.inclination);
      const y = Math.sin(b.inclination) * b.radius * 0.35 + Math.sin(time * b.bobSpeed + b.phase) * b.bobAmount;

      b.mesh.position.set(x, y, z);

      const nextAngle = angle + 0.05;
      const lookX = Math.cos(nextAngle) * b.radius * Math.cos(b.inclination);
      const lookZ = Math.sin(nextAngle) * b.radius * Math.cos(b.inclination);
      b.mesh.lookAt(lookX, y, lookZ);

      const flap = Math.abs(Math.sin(time * b.flapSpeed + b.mesh.userData.flapOffset)) * 0.55;
      b.mesh.userData.leftWing.rotation.y = 0.25 + flap;
      b.mesh.userData.rightWing.rotation.y = Math.PI - 0.25 - flap;
    });
  }

  function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();
    globe.rotation.y += 0.004;
    updateButterflies(time);

    renderer.render(scene, camera);
  }

  animate();
})();

// 2d-matrix-wave.js
// Flat p5 grid - click starts a rainbow wave that radiates cell by cell

var sketch2 = function(p) {
  const cols = 30;
  const rows = 15;
  const size = 30;
  const spacing = 4;
  const margin = spacing;

  let clickX = -1;          // Click origin in canvas coords
  let clickY = -1;
  let waveRadius = 0;       // Expanding ring radius
  let isAnimating = false;

  const waveSpeed = 12;     // How fast the ring grows each frame
  const waveWidth = 120;    // Thickness of the colored band

  p.setup = function() {
    const canvasWidth = (cols * size) + ((cols - 1) * spacing) + (margin * 2);
    const canvasHeight = (rows * size) + ((rows - 1) * spacing) + (margin * 2);
    const container = document.getElementById('canvas-container-2');
    container.innerHTML = '';

    const canvas = p.createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    p.colorMode(p.HSB, 360, 100, 100); // Hue-based rainbow fills
  };

  p.draw = function() {
    p.background(0);
    p.noStroke();

    if (isAnimating) {
      waveRadius += waveSpeed;
    }

    let anySquareActive = false;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        let x = margin + i * (size + spacing);
        let y = margin + j * (size + spacing);
        let centerX = x + size / 2;
        let fillY = y + size / 2;

        if (isAnimating) {
          // Distance from click to this cell’s center
          let d = p.dist(clickX, clickY, centerX, fillY);

          // Color only cells inside the moving wave front
          if (d < waveRadius && d > waveRadius - waveWidth) {
            anySquareActive = true;
            let hue = (p.sin(p.frameCount * 0.2) * 180 + 180 + d) % 360;
            p.fill(hue, 90, 100);
          } else {
            p.fill(0, 0, 100); // White when not in the band
          }
        } else {
          p.fill(0, 0, 100);
        }

        p.rect(x, y, size, size);
      }
    }

    // Stop once the wave has left the canvas and no cells are lit
    if (isAnimating && !anySquareActive && waveRadius > p.dist(0, 0, p.width, p.height)) {
      isAnimating = false;
      waveRadius = 0;
    }
  };

  // Start a new wave from the click point (only if inside the canvas)
  p.mousePressed = function() {
    if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
      clickX = p.mouseX;
      clickY = p.mouseY;
      waveRadius = 0;
      isAnimating = true;
    }
  };
};

new p5(sketch2);

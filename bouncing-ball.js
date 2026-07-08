// Interactive Grid Wave - using p5.js instance mode
var sketch2 = function(p) {
  const cols = 30;          // 30 columns for a wide grid
  const rows = 15;          // 15 rows
  const size = 30;          // Width and height of each square
  const spacing = 4;        // Width of the black lines between squares
  const margin = spacing;   // Outer margin matches inner spacing

  let clickX = -1;
  let clickY = -1;
  let waveRadius = 0;
  let isAnimating = false;

  const waveSpeed = 12;     // Speed of the radiating wave (pixels per frame)
  const waveWidth = 120;    // Thickness of the color wave front

  p.setup = function() {
    const canvasWidth = (cols * size) + ((cols - 1) * spacing) + (margin * 2);
    const canvasHeight = (rows * size) + ((rows - 1) * spacing) + (margin * 2);
    const container = document.getElementById('canvas-container-2');
    container.innerHTML = '';

    const canvas = p.createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    p.colorMode(p.HSB, 360, 100, 100);
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
          let d = p.dist(clickX, clickY, centerX, fillY);

          if (d < waveRadius && d > waveRadius - waveWidth) {
            anySquareActive = true;
            let hue = (p.sin(p.frameCount * 0.2) * 180 + 180 + d) % 360;
            p.fill(hue, 90, 100);
          } else {
            p.fill(0, 0, 100);
          }
        } else {
          p.fill(0, 0, 100);
        }

        p.rect(x, y, size, size);
      }
    }

    if (isAnimating && !anySquareActive && waveRadius > p.dist(0, 0, p.width, p.height)) {
      isAnimating = false;
      waveRadius = 0;
    }
  };

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

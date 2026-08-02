// static-grid-configuration.js
// Fixed 10×10 white grid on black — drawn once with p5 (noLoop)

var sketch1 = function(p) {
  const cols = 10;          // Number of columns
  const rows = 10;          // Number of rows
  const size = 40;          // Width and height of each square
  const spacing = 4;        // Gap between squares (shows as black lines)
  const margin = spacing;   // Outer margin matches the inner gap

  p.setup = function() {
    // Size the canvas from grid math so nothing is clipped
    const canvasWidth = (cols * size) + ((cols - 1) * spacing) + (margin * 2);
    const canvasHeight = (rows * size) + ((rows - 1) * spacing) + (margin * 2);

    const container = document.getElementById('canvas-container-1');
    container.innerHTML = '';

    const canvas = p.createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    p.noLoop();   // draw() runs only when we call redraw()
    p.redraw();
  };

  p.draw = function() {
    p.background(0); // Black fills gaps and outer margin

    p.fill(255);    // White cells
    p.noStroke();

    // Place each cell from its column/row index
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        let x = margin + i * (size + spacing);
        let y = margin + j * (size + spacing);
        p.rect(x, y, size, size);
      }
    }
  };
};

// Instance mode so this sketch does not fight other p5 sketches on the page
new p5(sketch1);

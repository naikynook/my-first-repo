// static-grid-configuration.js
var sketch1 = function(p) {
  const cols = 10;          // Number of columns
  const rows = 10;          // Number of rows
  const size = 40;          // Width and height of each square
  const spacing = 4;        // Width of the black lines between squares
  const margin = spacing;   // Outer margin now perfectly matches the inner spacing

  p.setup = function() {
    // Dynamically calculate canvas size based on grid parameters
    const canvasWidth = (cols * size) + ((cols - 1) * spacing) + (margin * 2);
    const canvasHeight = (rows * size) + ((rows - 1) * spacing) + (margin * 2);

    const container = document.getElementById('canvas-container-1');
    container.innerHTML = '';

    const canvas = p.createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    p.noLoop(); // Run draw() only once
    p.redraw();
  };

  p.draw = function() {
    p.background(0); // Black background fills the gaps and edges evenly

    // Style settings for the squares
    p.fill(255);   // Pure white fill for the squares
    p.noStroke();  // Removes individual outlines

    // Nested loops to calculate the X and Y coordinates for each cell
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {

        // Calculate position of the current square
        let x = margin + i * (size + spacing);
        let y = margin + j * (size + spacing);

        // Draw the white square
        p.rect(x, y, size, size);
      }
    }
  };
};

new p5(sketch1);

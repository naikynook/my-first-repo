// 2D Drawing Sketch - using p5.js instance mode
var sketch1 = function(p) {
  var canvasWidth = 800;
  var canvasHeight = 400;
  var gridSpacing = 40;

  p.setup = function() {
    var canvas = p.createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvas-container-1');
  };

  p.draw = function() {
    p.background(250);
    drawGrid();
    drawPrimitives();
  };

  function drawGrid() {
    p.stroke(200);
    p.strokeWeight(1);
    for (var x = 0; x <= p.width; x += gridSpacing) {
      p.line(x, 0, x, p.height);
    }
    for (var y = 0; y <= p.height; y += gridSpacing) {
      p.line(0, y, p.width, y);
    }
  }

  function drawPrimitives() {
    p.fill(255, 100, 100);
    p.rect(120, 80, 100, 60);

    p.fill(100, 180, 255);
    p.ellipse(350, 200, 90, 90);

    p.stroke(80, 200, 120);
    p.strokeWeight(4);
    p.line(500, 100, 700, 300);

    p.noStroke();
    p.fill(255, 220, 80);
    p.triangle(600, 80, 750, 60, 700, 200);
  }
};

new p5(sketch1);

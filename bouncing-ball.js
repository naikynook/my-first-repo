// Bouncing Ball Sketch - using p5.js instance mode
var sketch2 = function(p) {
  var x, y;
  var dx, dy;
  var radius = 30;

  p.setup = function() {
    var canvas = p.createCanvas(800, 400);
    canvas.parent('canvas-container-2');

    x = p.width / 2;
    y = p.height / 2;
    dx = 4;
    dy = 3;
  };

  p.draw = function() {
    p.background(240);

    p.fill(100, 180, 255);
    p.noStroke();
    p.ellipse(x, y, radius * 2);

    x += dx;
    y += dy;

    if (x - radius < 0 || x + radius > p.width) {
      dx *= -1;
    }
    if (y - radius < 0 || y + radius > p.height) {
      dy *= -1;
    }
  };
};

new p5(sketch2);

// Outline Canvas - using p5.js instance mode
var sketch4 = function(p) {
  var canvasWidth = 800;
  var canvasHeight = 400;

  p.setup = function() {
    var container = document.getElementById('canvas-container-4');
    container.innerHTML = '';

    var canvas = p.createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    p.noLoop();
    p.redraw();
  };

  p.draw = function() {
    p.background(255);
    p.noFill();
    p.stroke(0);
    p.strokeWeight(1);
    p.rect(0.5, 0.5, p.width - 1, p.height - 1);
  };
};

new p5(sketch4);

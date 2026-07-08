// Grid Sketch - using p5.js instance mode
var sketch1 = function(p) {
  var cols = 10;
  var rows = 10;
  var size = 40;
  var spacing = 4;
  var margin = spacing;

  p.setup = function() {
    var canvasWidth = (cols * size) + ((cols - 1) * spacing) + (margin * 2);
    var canvasHeight = (rows * size) + ((rows - 1) * spacing) + (margin * 2);
    var canvas = p.createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvas-container-1');
    p.noLoop();
  };

  p.draw = function() {
    p.background(0);

    p.fill(255);
    p.noStroke();

    for (var i = 0; i < cols; i++) {
      for (var j = 0; j < rows; j++) {
        var x = margin + i * (size + spacing);
        var y = margin + j * (size + spacing);
        p.rect(x, y, size, size);
      }
    }
  };
};

new p5(sketch1);

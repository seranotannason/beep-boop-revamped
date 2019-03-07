window.onload = function () {
  /*--------------------------------------------------------
                    N O D E  .  3  -  D
                             -
                    B A C K G R O U N D
  ---------------------------------------------------------*/

  var canvas, ctx, circ, 
      nodes, mouse, SENSITIVITY, 
      SIBLINGS_LIMIT, DENSITY, 
      NODES_QTY, ANCHOR_LENGTH, MOUSE_RADIUS;

  // how close next node must be to activate connection (in px)
  // shorter distance == better connection (line width)
  SENSITIVITY = 100;
  // note that siblings limit is not 'accurate' as the node can actually have more connections than this value that's because the node accepts sibling nodes with no regard to their current connections this is acceptable because potential fix would not result in significant visual difference 
  // more siblings == bigger node
  SIBLINGS_LIMIT = 7;
  // default node margin
  DENSITY = 50;
  // total number of nodes used (incremented after creation)
  NODES_QTY = 0;
  // avoid nodes spreading
  ANCHOR_LENGTH = 20;
  // highlight radius
  MOUSE_RADIUS = 300;

  // pink node
  NODE_COLOR_PINK = { r: 227, g: 27, b: 109 };
  // cyan node
  NODE_COLOR_CYAN = { r: 4, g: 194, b: 201 };
  // navy node
  NODE_COLOR_NAVY = { r: 27, g: 36, b: 47 };
  // lighter navy node
  NODE_COLOR_NAVY_LIGHT = { r: 49, g: 57, b: 67 };
  // burgundy node
  NODE_COLOR_BURGUNDY = { r: 153, g: 0, b: 51 };


  // dark mode
  node_dark_mode = NODE_COLOR_PINK;
  // light mode
  node_light_mode = NODE_COLOR_BURGUNDY;
  // cyan node


  circ = 2 * Math.PI;
  nodes = [];

  canvas = document.querySelector('canvas');
  resizeWindow();
  mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2
  };
  ctx = canvas.getContext('2d');
  if (!ctx) {
    alert("Ooops! Your browser does not support canvas :'(");
  }

  function Node(x, y) {
    this.anchorX = x;
    this.anchorY = y;
    this.x = Math.random() * (x - (x - ANCHOR_LENGTH)) + (x - ANCHOR_LENGTH);
    this.y = Math.random() * (y - (y - ANCHOR_LENGTH)) + (y - ANCHOR_LENGTH);
    this.vx = Math.random() * 2 - 1;
    this.vy = Math.random() * 2 - 1;
    this.energy = Math.random() * 100;
    this.radius = Math.random();
    this.siblings = [];
    this.brightness = 0;
  }

  Node.prototype.drawNode = function (color) {
    ctx.beginPath();
    var node_color = `rgba(${color.r}, ${color.g}, ${color.b}, ${this.brightness})`;
    ctx.arc(this.x, this.y, 2 * this.radius + 2 * this.siblings.length / SIBLINGS_LIMIT, 0, circ);
    ctx.fillStyle = node_color;
    ctx.fill();
  };

  Node.prototype.drawConnections = function (color) {
    for (var i = 0; i < this.siblings.length; i++) {
      var stroke_color = `rgba(${color.r}, ${color.g}, ${color.b}, ${this.brightness})`;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.siblings[i].x, this.siblings[i].y);
      ctx.lineWidth = 1 - calcDistance(this, this.siblings[i]) / SENSITIVITY;
      ctx.strokeStyle = stroke_color;
      ctx.stroke();
    }
  };

  Node.prototype.moveNode = function () {
    this.energy -= 2;
    if (this.energy < 1) {
      this.energy = Math.random() * 100;
      if (this.x - this.anchorX < -ANCHOR_LENGTH) {
        this.vx = Math.random() * 2;
      } else if (this.x - this.anchorX > ANCHOR_LENGTH) {
        this.vx = Math.random() * -2;
      } else {
        this.vx = Math.random() * 4 - 2;
      }
      if (this.y - this.anchorY < -ANCHOR_LENGTH) {
        this.vy = Math.random() * 2;
      } else if (this.y - this.anchorY > ANCHOR_LENGTH) {
        this.vy = Math.random() * -2;
      } else {
        this.vy = Math.random() * 4 - 2;
      }
    }
    this.x += this.vx * this.energy / 100;
    this.y += this.vy * this.energy / 100;
  };

  function initNodes() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nodes = [];
    for (var i = DENSITY; i < canvas.width; i += DENSITY) {
      for (var j = DENSITY; j < canvas.height; j += DENSITY) {
        nodes.push(new Node(i, j));
        NODES_QTY++;
      }
    }
  }

  function calcDistance(node1, node2) {
    return Math.sqrt(Math.pow(node1.x - node2.x, 2) + (Math.pow(node1.y - node2.y, 2)));
  }

  function findSiblings() {
    var node1, node2, distance;
    for (var i = 0; i < NODES_QTY; i++) {
      node1 = nodes[i];
      node1.siblings = [];
      for (var j = 0; j < NODES_QTY; j++) {
        node2 = nodes[j];
        if (node1 !== node2) {
          distance = calcDistance(node1, node2);
          if (distance < SENSITIVITY) {
            if (node1.siblings.length < SIBLINGS_LIMIT) {
              node1.siblings.push(node2);
            } else {
              var node_sibling_distance = 0;
              var max_distance = 0;
              var s;
              for (var k = 0; k < SIBLINGS_LIMIT; k++) {
                node_sibling_distance = calcDistance(node1, node1.siblings[k]);
                if (node_sibling_distance > max_distance) {
                  max_distance = node_sibling_distance;
                  s = k;
                }
              }
              if (distance < max_distance) {
                node1.siblings.splice(s, 1);
                node1.siblings.push(node2);
              }
            }
          }
        }
      }
    }
  }

  function redrawScene(color) {
    resizeWindow();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    findSiblings();
    var i, node, distance;
    for (i = 0; i < NODES_QTY; i++) {
      node = nodes[i];
      distance = calcDistance({
        x: mouse.x,
        y: mouse.y
      }, node);
      if (distance < MOUSE_RADIUS) {
        node.brightness = 1 - distance / MOUSE_RADIUS;
      } else {
        node.brightness = 0;
      }
    }
    for (i = 0; i < NODES_QTY; i++) {
      node = nodes[i];
      if (node.brightness) {
        node.drawNode(color);
        node.drawConnections(color);
      }
      node.moveNode();
    }
    requestAnimationFrame(function () { redrawScene(color); });
  }

  function initHandlers() {
    document.addEventListener('resize', resizeWindow, false);
    document.addEventListener('mousemove', mousemoveHandler, false);
    // var lightswitch = document.getElementById('myonoffswitch');
    // lightswitch.addEventListener('change', toggleLightSwitch, false);
  }

  function resizeWindow() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function changeColor(color) {
    resizeWindow();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    findSiblings();
    var i, node, distance;
    for (i = 0; i < NODES_QTY; i++) {
      node = nodes[i];
      distance = calcDistance({
        x: mouse.x,
        y: mouse.y
      }, node);
      if (distance < MOUSE_RADIUS) {
        node.brightness = 1 - distance / MOUSE_RADIUS;
      } else {
        node.brightness = 0;
      }
    }
    for (i = 0; i < NODES_QTY; i++) {
      node = nodes[i];
      if (node.brightness) {
        node.drawNode(color);
        node.drawConnections(color);
      }
    }
    requestAnimationFrame(function () { changeColor(color); });
  }

  function toggleLightSwitch() {
    if (this.checked) {
      // night mode: pink navy
      changeColor(node_dark_mode);
    } else {
      // day mode: cyan white
      changeColor(node_light_mode);
    }
  }

  function mousemoveHandler(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }

  initHandlers();
  initNodes();
  redrawScene(node_dark_mode);
};
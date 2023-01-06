const canvasSketch = require("canvas-sketch");
//const { geometry } = require("canvas-sketch-util");
const Tweakpane = require("tweakpane");
var geojson = require("./input/geojson.json");

var defaultProjectionMatrix;

//const scale=1;
var globalScale = 1;

//var color=['blue','red','yellow','green','black','gray'];
var colorindex = 0;

const settings = {
  name: "3dWorld",
  dimensions: [1080, 1080],
  animate: true //add to panel
};

const params = {
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  right: 1,
  left: -2,
  bottom: -2,
  top: 1,
  near: 8,
  far: 5
};

const sketch = () => {
  return ({ context, width, height, time }) => {
    //time=0;

    const w = width;
    const h = height;
    const ctx = context;
    ctx.globalAlpha = 1;

    const rotateZ = (params.rotateZ * Math.PI) / 180;
    const rotateX = (params.rotateX * Math.PI) / 180;
    const rotateY = (params.rotateY * Math.PI) / 180;
    const right = params.right;
    const left = params.left;
    const top = params.top;
    const bottom = params.bottom;
    const near = params.near;
    const far = params.far;

    //ctx.fillStyle = "#FF0000";
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, w, h);
    ctx.translate(w / 2, h / 2);

    ctx.lineWidth = w * 0.003;
    ctx.strokeStyle = "#3751b8";

    defaultProjectionMatrix = perspectiveProjection(
      right,
      left,
      bottom,
      top,
      far,
      near
    );

    ctx.globalAlpha = 0.25;

    var Sphere = new sphere(25, 15, new vector(0, 0, 0));
    //var Cube2 = new sphere(10,20,new vector(0,0,40));

    Sphere.rotateX(rotateX);
    Sphere.rotateY(rotateY);
    Sphere.rotateZ(rotateZ);

    Sphere.rotateY(0.1 * time);

    Sphere.rotateZ(Math.sin(0.7 * time));
    Sphere.rotateY(Math.sin(-0.3 * time));
    //Sphere.rotateX(Math.sin(-0.4*time));

    Sphere.drawEdges(ctx);
    ctx.globalAlpha = 0.5;

    var list2 = [];
    var num = 0.1;

    geojson.features.forEach((item, index) => {
      var list = [];

      item.geometry.coordinates.forEach((item) => {
        item.forEach((item2) => {
          //there are two different types, polygon and multipolygon.. 2 different data structures

          if (geojson.features[index].geometry.type == "Polygon") {
            let vector = latlonTovector(item2, 50);
            vector = vector.rotateY((258 * Math.PI) / 180);
            vector = vector.rotateZ((266 * Math.PI) / 180);

            vector = vector.rotateX(rotateX);
            vector = vector.rotateY(rotateY);
            vector = vector.rotateZ(rotateZ);
            vector = vector.rotateY(num * time);
            //vector=vector.rotateZ(2*num*time);

            list.push(vector);
          } else {
            item2.forEach((item3) => {
              //item3 are the coordinates
              //console.log(item3);

              let vector = latlonTovector(item3, 50);
              vector = vector.rotateY((258 * Math.PI) / 180);
              vector = vector.rotateZ((266 * Math.PI) / 180);

              vector = vector.rotateX(rotateX);
              vector = vector.rotateY(rotateY);
              vector = vector.rotateZ(rotateZ);
              vector = vector.rotateY(num * time);
              //vector=vector.rotateZ(2*num*time);

              list.push(vector);
            });

            list.push(list[0]);
            list2.push(list);
            list = [];
          }

          //console.log(geojson.features[index].geometry.type);
        });
        if (geojson.features[index].geometry.type == "Polygon") {
          list.push(list[0]);
          list2.push(list);
        }
      });
    });

    ctx.strokeStyle = "#ab1d1d";
    list2.forEach((item) => {
      //console.log(item);
      drawlines(item);
    });

    function drawlines(list) {
      for (a = 0; a < list.length - 1; a++) {
        TwoPointsLine(ctx, list[a].project(), list[a + 1].project());
      }
    }
  };
};

class vector {
  constructor(x = 0, y = 0, z = 0, w = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  scale(a) {
    this.x = this.x * a;
    this.y = this.y * a;
    this.z = this.z * a;
    this.w = this.w * a;
    return this;
  }

  makeUnit() {
    var magnitude = Math.sqrt(
      this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w
    );
    this.scale(1 / magnitude);
    return this;
  }

  add(vector) {
    this.x = this.x + vector.x;
    this.y = this.y + vector.y;
    this.z = this.z + vector.z;
    this.w = this.w + vector.w;
    return this;
  }

  linearT(matrix) {
    var x =
      this.x * matrix.v1.x +
      this.y * matrix.v2.x +
      this.z * matrix.v3.x +
      this.w * matrix.v4.x;

    var y =
      this.x * matrix.v1.y +
      this.y * matrix.v2.y +
      this.z * matrix.v3.y +
      this.w * matrix.v4.y;

    var z =
      this.x * matrix.v1.z +
      this.z * matrix.v2.z +
      this.z * matrix.v3.z +
      this.w * matrix.v4.z;

    var w =
      this.x * matrix.v1.w +
      this.w * matrix.v2.w +
      this.z * matrix.v3.z +
      this.w * matrix.v4.w;

    return new vector(x, y, z, w);
  }

  project(matrix = defaultProjectionMatrix) {
    var a = this.linearT(matrix);

    //this = a;
    return a;
  }

  rotateX(anglex) {
    var mx = new matrix(
      new vector(1, 0, 0),
      new vector(0, Math.cos(anglex), Math.sin(anglex)),
      new vector(0, -Math.sin(anglex), Math.cos(anglex))
    );

    return this.linearT(mx);
  }

  rotateY(angley) {
    var my = new matrix(
      new vector(Math.cos(angley), 0, -Math.sin(angley)),
      new vector(0, 1, 0),
      new vector(Math.sin(angley), 0, Math.cos(angley))
    );

    return this.linearT(my);
  }

  rotateZ(anglez) {
    var mz = new matrix(
      new vector(Math.cos(anglez), Math.sin(anglez), 0),
      new vector(-Math.sin(anglez), Math.cos(anglez), 0),
      new vector(0, 0, 1)
    );

    return this.linearT(mz);
  }
}

class matrix {
  constructor(
    v1 = new vector(),
    v2 = new vector(),
    v3 = new vector(),
    v4 = new vector()
  ) {
    this.v1 = v1;
    this.v2 = v2;
    this.v3 = v3;
    this.v4 = v4;
  }

  multiply(m) {
    this.v1 = this.v1.linearT(m);
    this.v2 = this.v2.linearT(m);
    this.v3 = this.v3.linearT(m);
    this.v4 = this.v4.linearT(m);
  }
}

class shape {
  constructor(size = 1, cx = 0, cy = 0, cz = 0) {
    this.cx = cx;
    this.cy = cy;
    this.cz = cz;
    this.size = size;
  }

  drawpoint(ctx, time) {
    this.vertices.forEach((item) => {
      //console.log(this.size/5,item.x,item.y,item.z);
      var form = new cube(0.03 * this.size, item.x, item.y, item.z);
      //form.rotateZ(time);
      form.rotateY(-time);
      //form.rotateX(-Math.sin(time));
      //console.log(this);
      form.drawSurfaces(ctx);
    });
  }

  drawEdges(ctx) {
    //we need to project 3d into 2d and then draw
    this.edges.forEach((item) => {
      TwoPointsLine(
        ctx,
        this.vertices[item[0]].project(),
        this.vertices[item[1]].project()
      );
    });
  }

  drawSurfaces(ctx) {
    this.faces.forEach((item) => {
      FourPointsRect(
        ctx,
        this.vertices[item[0] - 1].project(),
        this.vertices[item[1] - 1].project(),
        this.vertices[item[2] - 1].project(),
        this.vertices[item[3] - 1].project()
      );
    });
    colorindex = 0;
  }

  transform(m) {
    this.vertices.forEach((item, index) => {
      this.vertices[index] = item.linearT(m);
    });
  }

  rotateX(anglex, own = 0) {
    var m = this;

    if (own == 1) {
      this.vertices.forEach((item, index) => {
        var v = new vector(-this.cx, -this.cy, -this.cz);
        this.vertices[index] = item.add(v);
      });
    }

    this.vertices.forEach((item, index) => {
      this.vertices[index] = item.rotateX(anglex);
    });

    if (own == 1) {
      this.vertices.forEach((item, index) => {
        var v = new vector(m.cx, m.cy, m.cz);
        this.vertices[index] = item.add(v);
      });
    }
  }

  rotateY(angley, own = 0) {
    var m = this;

    if (own == 1) {
      this.vertices.forEach((item, index) => {
        var v = new vector(-this.cx, -this.cy, -this.cz);
        this.vertices[index] = item.add(v);
      });
    }

    this.vertices.forEach((item, index) => {
      this.vertices[index] = item.rotateY(angley);
    });

    if (own == 1) {
      this.vertices.forEach((item, index) => {
        var v = new vector(m.cx, m.cy, m.cz);
        this.vertices[index] = item.add(v);
      });
    }
  }

  rotateZ(anglez, own = 0) {
    var m = this;

    if (own == 1) {
      this.vertices.forEach((item, index) => {
        var v = new vector(-this.cx, -this.cy, -this.cz);
        this.vertices[index] = item.add(v);
      });
    }

    this.vertices.forEach((item, index) => {
      this.vertices[index] = item.rotateZ(anglez);
    });

    if (own == 1) {
      this.vertices.forEach((item, index) => {
        var v = new vector(m.cx, m.cy, m.cz);
        this.vertices[index] = item.add(v);
      });
    }
  }
}

class cube extends shape {
  constructor(size = 1, cx = 0, cy = 0, cz = 0) {
    super(size, cx, cy, cz);

    this.vertices = [
      new vector(cx - size, cy - size, cz - size),
      new vector(cx + size, cy - size, cz - size),
      new vector(cx + size, cy + size, cz - size),
      new vector(cx - size, cy + size, cz - size),
      new vector(cx - size, cy - size, cz + size),
      new vector(cx + size, cy - size, cz + size),
      new vector(cx + size, cy + size, cz + size),
      new vector(cx - size, cy + size, cz + size)
    ];
    this.edges = [
      //based on vertices
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0], // back face
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4], // front face
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7] // connecting sides
    ];
    this.faces = [
      //based on vertices
      //[0,1,2,3]
      [1, 2, 3, 4],
      [1, 5, 8, 4],
      [2, 6, 7, 3],
      [1, 2, 6, 5],
      [5, 6, 7, 8]
      //,[7,8,4,3]
    ];
  }
}

class sphere extends shape {
  constructor(radius = 10, num = 20, v = new vector()) {
    super();

    this.center = v;
    this.size = radius;

    this.vertices = [];
    this.edges = [];

    this.populate(num);

    this.vertices.forEach((item) => {
      item.add(v);
    });
  }

  populate(amount = 20) {
    //x2+y2+z2=1
    var a = new vector();

    var vx = new vector(1, 0, 0);

    var count1 = 0;
    var count2 = 0;
    var count = [];
    var temp = [];

    for (let z = -90; z <= 90; z = z + 90 / amount) {
      var a1 = vx.rotateZ((z * Math.PI) / 180);
      var temp2 = [];
      count1 = 0;
      for (let y = 0; y <= 360; y = y + 360 / amount) {
        var a2 = a1.rotateY((y * Math.PI) / 180);
        //this.vertices.push(a2.scale(this.size));
        temp2.push(a2.scale(this.size));
        count.push([count1, count2]);
        count1 = count1 + 1;
      }
      temp.push(temp2);
      count2 = count2 + 1;
    }
    var a = 1;
    temp.forEach((item, index) => {
      item.forEach((item2, index2) => {
        this.vertices.push(item2);
        // a%(amount) != 0 &&
        if (a % (amount + 1) != 0 && a < (amount + 1) * (amount * 2 + 1)) {
          var b = a + 1;
          //console.log('ab',a,b)
        } else {
          var b = a;
        }
        this.edges.push([a - 1, b - 1]);
        if (a < (amount + 1) * (amount * 2)) {
          this.edges.push([a, a + amount + 1]);
        }
        a = a + 1;
      });
    });
  }
}

function loopArray(array, num) {
  let a = num - array.lenght * Math.floor(num / array.lenght);
  return array[a];
}

function TwoPointsLine(ctx, p1, p2) {
  //p1 and p2 are vectors

  p1.scale(globalScale);
  p2.scale(globalScale);

  ctx.beginPath();
  ctx.moveTo(p1.x, -p1.y);
  ctx.lineTo(p2.x, -p2.y);
  ctx.stroke();

  p1.scale(1 / globalScale);
  p2.scale(1 / globalScale);
}
function FourPointsRect(ctx, p1, p2, p3, p4) {
  ctx.fillStyle = color[colorindex];
  colorindex = colorindex + 1;

  p1.scale(globalScale);
  p2.scale(globalScale);
  p3.scale(globalScale);
  p4.scale(globalScale);

  ctx.beginPath();
  ctx.moveTo(p1.x, -p1.y);
  ctx.lineTo(p2.x, -p2.y);
  ctx.lineTo(p3.x, -p3.y);
  ctx.lineTo(p4.x, -p4.y);
  ctx.fill();

  p1.scale(1 / globalScale);
  p2.scale(1 / globalScale);
  p3.scale(1 / globalScale);
  p4.scale(1 / globalScale);
}
function vectorFromArray(array) {
  var v = new vector();
  var arrayTemp = [0, 0, 0, 0];
  array.forEach((item, index) => {
    arrayTemp[index] = item;
  });
  v.x = arrayTemp[0];
  v.y = arrayTemp[1];
  v.z = arrayTemp[2];
  v.w = arrayTemp[3];
  return v;
}
function matrixFromArray(array) {
  var a = [new vector(), new vector(), new vector(), new vector()];
  array.forEach((item, index) => {
    a[index] = item;
  });
  array = a;
  return new matrix(
    vectorFromArray(array[0]),
    vectorFromArray(array[1]),
    vectorFromArray(array[2]),
    vectorFromArray(array[3])
  );
}
function perspectiveProjection(r, l, b, t, f, n) {
  var v1 = new vector((2 * n) / (r - l), 0, 0, 0);
  var v2 = new vector(0, (2 * n) / (t - b), 0, 0);
  var v3 = new vector(
    (r + l) / (r - l),
    (t + b) / (t - b),
    -(f + n) / (f - n),
    -1
  );
  var v4 = new vector(0, 0, (-2 * f * n) / (f - n), 0);
  return new matrix(v1, v2, v3, v4);
}

const createPane = () => {
  const pane = new Tweakpane.Pane();
  let folder;
  folder = pane.addFolder({ title: "Rotation" });
  folder.addInput(params, "rotateX", { min: 0, max: 360, step: 1 });
  folder.addInput(params, "rotateY", { min: 0, max: 360, step: 1 });
  folder.addInput(params, "rotateZ", { min: 0, max: 360, step: 1 });

  folder = pane.addFolder({ title: "Projection" });
  folder.addInput(params, "right", { min: -15, max: 15, step: 1 });
  folder.addInput(params, "left", { min: -15, max: 15, step: 1 });
  folder.addInput(params, "bottom", { min: -15, max: 15, step: 1 });
  folder.addInput(params, "top", { min: -15, max: 15, step: 1 });
  folder.addInput(params, "near", { min: 0, max: 100, step: 1 });
  folder.addInput(params, "far", { min: 0, max: 100, step: 1 });
};
createPane();

var a = new sphere();

function latlonTovector(array, R) {
  let lat = array[1];
  let lon = array[0];

  let x = R * Math.cos((lat * Math.PI) / 180) * Math.cos((lon * Math.PI) / 180);

  let y = R * Math.cos((lat * Math.PI) / 180) * Math.sin((lon * Math.PI) / 180);

  let z = R * Math.sin((lat * Math.PI) / 180);

  return new vector(x, y, z);
}

canvasSketch(sketch, settings);

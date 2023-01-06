const canvasSketch = require('canvas-sketch');
const Tweakpane = require('tweakpane');
const scale=1;
var globalScale;

var color=['blue','red','yellow','green','black','gray'];
var colorindex=0;

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true  //add to panel
};

const params = {
	rotateX: 0,
    rotateY:0,
    rotateZ:0,
    right:4,
    left:-1,
    bottom:-0,
    top: 4,
    near: 7,
    far:5
};

const sketch = () => {
  return ({ context, width, height, time }) => {

    const w   = width;
    const h   = height;
    const ctx = context;
    ctx.globalAlpha = 0.8;

    const rotateZ = params.rotateZ*Math.PI/180;
    const rotateX = params.rotateX*Math.PI/180;
    const rotateY = params.rotateY*Math.PI/180;
    const right = params.right;
    const left = params.left;
    const top = params.top;
    const bottom = params.bottom;
    const near = params.near;
    const far = params.far;

    //globalScale=1*w/scale;
    globalScale=1;
	
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, w, h);
    ctx.translate(w/2,h/2);
    //ctx.rotate(Math.PI);

    //grid init
    ctx.lineWidth = w*0.0003;
    var Grid= new grid();
    //Grid.draw(ctx,projected);

    ctx.lineWidth = w*0.001;
    ctx.strokeStyle = "#316b3d";

    defaultProjectionMatrix = perspectiveProjection(right,left,bottom,top,far,near);

    var v1=new vector(3,1,0);
    var v2 = new vector(-3,1,0);
    var v3=new vector(0,1,0);

    //defaultProjectionMatrix = new matrix(v1.makeUnit().scale(2),v2.makeUnit().scale(2),v3.scale(2));

    ctx.globalAlpha = 0.3;

    cubes.forEach(item=>{
        
        item.rotate(rotateX,(1+Math.sin(time/2))*Math.PI/180,(1+Math.sin(time))*Math.PI/180,0);

        item.rotate(rotateX,(-1+Math.sin(time))*Math.PI/180,(-1+Math.sin(time*2))/Math.PI/180,1);

        item.drawEdges(ctx);
        item.drawSurfaces(ctx);
    })

           

  };
};

class vector{
    constructor(x=0,y=0,z=0, w=0){
        this.x=x;
        this.y=y;
        this.z=z;
        this.w=w;
    }

    scale(a){
        this.x=this.x*a;
        this.y=this.y*a;
        this.z=this.z*a;
        this.w=this.w*a;
        return this;
    }

    makeUnit(){
        var magnitude = Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w);
        this.scale(1/magnitude);
        return this;
    }

    add(vector){
        this.x=this.x+vector.x;
        this.y=this.y+vector.y;
        this.z=this.z+vector.z;
        this.w=this.w+vector.w;
        return this;
    };

    linearT(matrix){
        var x=this.x*matrix.v1.x+this.y*matrix.v2.x+this.z*matrix.v3.x+this.w*matrix.v4.x;

        var y=this.x*matrix.v1.y+this.y*matrix.v2.y+this.z*matrix.v3.y+this.w*matrix.v4.y;

        var z=this.x*matrix.v1.z+this.z*matrix.v2.z+this.z*matrix.v3.z+this.w*matrix.v4.z;

        var w=this.x*matrix.v1.w+this.w*matrix.v2.w+this.z*matrix.v3.z+this.w*matrix.v4.w;

        return new vector(x,y,z,w);
    }

    project(matrix=defaultProjectionMatrix){
        var a = this.linearT(matrix);

        //this = a;
        return a;
    }
}

class matrix{
    constructor(v1=new vector(),v2=new vector(),v3=new vector(), v4=new vector()){
        this.v1=v1;
        this.v2=v2;
        this.v3=v3;
        this.v4=v4;
    }

    multiply(m){
        this.v1 = this.v1.linearT(m);
        this.v2 = this.v2.linearT(m);
        this.v3 = this.v3.linearT(m);
        this.v4 = this.v4.linearT(m);
    }
}

class cube{

    constructor(size=1,cx=0,cy=0,cz=0){

        this.cx=cx;
        this.cy=cy;
        this.cz=cz;
        
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
        this.edges = [ //based on vertices
            [0, 1], [1, 2], [2, 3], [3, 0], // back face
            [4, 5], [5, 6], [6, 7], [7, 4], // front face
            [0, 4], [1, 5], [2, 6], [3, 7] // connecting sides
        ];
        this.faces = [ //based on vertices
            //[0,1,2,3]
            [1,2,3,4],[1,5,8,4],[2,6,7,3],[1,2,6,5]
            ,[5,6,7,8]
            //,[7,8,4,3]
        ];
    }

    drawEdges(ctx){
        //we need to project 3d into 2d and then draw
        this.edges.forEach(item=>{
            
            TwoPointsLine(ctx,this.vertices[item[0]].project(),this.vertices[item[1]].project());
            
        });
    }

    drawSurfaces(ctx){

        this.faces.forEach(item=>{

            FourPointsRect(ctx,this.vertices[item[0]-1].project(),this.vertices[item[1]-1].project(),this.vertices[item[2]-1].project(),this.vertices[item[3]-1].project());

        });
        colorindex=0;
    }

    transform(m){
        this.vertices.forEach((item,index)=>{
            this.vertices[index]=item.linearT(m);
        })
    }

    rotate(anglex,angley,anglez,own){
        var mz= new matrix(new vector(Math.cos(anglez),Math.sin(anglez),0), new vector(-Math.sin(anglez),Math.cos(anglez),0),new vector(0,0,1));
        var mx= new matrix(new vector(1,0,0), new vector(0,Math.cos(anglex),Math.sin(anglex)), new vector(0,-Math.sin(anglex),Math.cos(anglex)));
        var my= new matrix(new vector(Math.cos(angley),0,-Math.sin(angley)),new vector(0,1,0), new vector(Math.sin(angley),0,Math.cos(angley)));

        var m=this;

        if(own==1){
            this.vertices.forEach((item,index)=>{
                var v = new vector(-this.cx,-this.cy,-this.cz);
                this.vertices[index]=item.add(v);
            })
        }

        this.transform(mx);
        this.transform(my);
        this.transform(mz);


        if(own==1){
            this.vertices.forEach((item,index)=>{
                var v = new vector(m.cx,m.cy,m.cz);
                this.vertices[index]=item.add(v);
            })
        }

        

    }
}

class grid{
    constructor(){
        var spaces = scale/2;
        this.points=[];
        for(let a=-spaces;a<=spaces; a++){
            //x lines (verticales)
            this.points.push([new vector(a,-spaces), new vector(a,spaces)]);
    
            //console.log(new vector(a,-spaces));
            //y lines
            this.points.push([new vector(-spaces,a), new vector(spaces,a)]);
        }
    }

    draw(ctx,a=0){
        this.points.forEach(item=>{
            if(a==1){
                TwoPointsLine(ctx,item[0].project(),item[1].project());
            }else{TwoPointsLine(ctx,item[0],item[1]);}
        });
    }
}

function TwoPointsLine(ctx,p1,p2){ //p1 y p2 are vectors


        p1.scale(globalScale);
        p2.scale(globalScale);

        ctx.beginPath();
        ctx.moveTo(p1.x,-p1.y);
        ctx.lineTo(p2.x,-p2.y);
        ctx.stroke();

        p1.scale(1/globalScale);
        p2.scale(1/globalScale);
}
function FourPointsRect(ctx,p1,p2,p3,p4){

    ctx.fillStyle = color[colorindex];
    colorindex=colorindex+1;

    p1.scale(globalScale);
    p2.scale(globalScale);
    p3.scale(globalScale);
    p4.scale(globalScale);

    
    ctx.beginPath();
    ctx.moveTo(p1.x,-p1.y);
    ctx.lineTo(p2.x,-p2.y);
    ctx.lineTo(p3.x,-p3.y);
    ctx.lineTo(p4.x,-p4.y);
    ctx.fill();

    p1.scale(1/globalScale);
    p2.scale(1/globalScale);
    p3.scale(1/globalScale);
    p4.scale(1/globalScale);

}
function vectorFromArray(array){
    var v = new vector();
    var arrayTemp = [0,0,0,0];
    array.forEach((item,index)=>{
        arrayTemp[index]=item;
    })
    v.x=arrayTemp[0];
    v.y=arrayTemp[1];
    v.z=arrayTemp[2];
    v.w=arrayTemp[3];
    return v;
}
function matrixFromArray(array){
    var a=[new vector(),new vector(),new vector(),new vector()];
    array.forEach((item, index)=>{
        a[index]=item;
    });
    array=a;
    return new matrix(vectorFromArray(array[0]),vectorFromArray(array[1]),vectorFromArray(array[2]),vectorFromArray(array[3]));
}
function perspectiveProjection(r,l,b,t,f,n){

    var v1 = new vector(2*n/(r-l),0,0,0);
    var v2 = new vector(0,2*n/(t-b),0,0);
    var v3 = new vector((r+l)/(r-l),(t+b)/(t-b),-(f+n)/(f-n),-1);
    var v4 = new vector(0,0,-2*f*n/(f-n),0);
    return new matrix(v1,v2,v3,v4);
}


var defaultProjectionMatrix = perspectiveProjection(1,-5,3,-2,1,5);


const createPane = () => {
	const pane = new Tweakpane.Pane();
	let folder;
    folder = pane.addFolder({ title: 'Rotation'});
    folder.addInput(params, 'rotateX', { min: 0, max: 360, step: 1 });
    folder.addInput(params, 'rotateY', { min: 0, max: 360, step: 1 });
    folder.addInput(params, 'rotateZ', { min: 0, max: 360, step: 1 });

    folder = pane.addFolder({ title: 'Projection'});
    folder.addInput(params, 'right', { min: -15, max: 15, step: 1 });
    folder.addInput(params, 'left', { min: -15, max: 15, step: 1 });
    folder.addInput(params, 'bottom', { min: -15, max: 15, step: 1 });
    folder.addInput(params, 'top', { min: -15, max: 15, step: 1 });
    folder.addInput(params, 'near', { min: 0, max: 20, step: 1 });
    folder.addInput(params, 'far', { min: 0, max: 100, step: 1 });
};

var e=5;
var cubes=[];
for(var c=1;c<e;c++){
    for(var b=1;b<e;b++){
        for(var a=1;a<e;a++){
            if(Math.random()<1){
                cubes.push(new cube(8,(-e/2+b)*55,(-e/2+a)*55,(-e/2+c)*55));            
            } 
        }
    }
}

createPane();
canvasSketch(sketch, settings);



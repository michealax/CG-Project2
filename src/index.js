// Vertex shader program
const VSHADER_SOURCE =
    `attribute vec4 a_Position;
     attribute vec4 a_Color;
     uniform mat4 u_ModelMatrix;
     varying vec4 v_Color;
     void main() {
        gl_Position = u_ModelMatrix * a_Position;
        v_Color = a_Color;
     }`;

// Fragment shader program
const FSHADER_SOURCE =
    `#ifdef GL_ES
     precision mediump float;
     #endif
     varying vec4 v_Color;
     void main() {
         gl_FragColor = v_Color;
     }`;

const LINE_VSHADER_SOURCE =
    `attribute vec4 a_Position;
     uniform mat4 u_ModelMatrix;
     void main(){
        gl_Position = u_ModelMatrix * a_Position;
     }`;

const LINE_FSHADER_SOURCE =
    `#ifdef GL_ES
     precision mediump float;
     #endif
     void main(){
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
     }`;

// Retrieve <canvas> element
const myCanvas = document.getElementById("myCanvas");

// Declare the WebGL programs
let program;
let lineProgram;


// Set the rotating and scaling factor
const ANGLE = 45.0;
const SCALE = 100;
let scale = 100;

// Set the signs of rotation and visibility
let rotate = false;
let visible = true;

// Get time
let g_last = Date.now();

// Store the original vertex_pos
const POS = [];
let pos_temp = [];
for (let i in vertex_pos) {
    pos_temp.push(vertex_pos[i].slice(0));
    POS.push(vertex_pos[i].slice(0));
}


// Initialize the size of <canvas> element
function init() {
    let width = canvasSize.maxX;
    let height = canvasSize.maxY;
    myCanvas.setAttribute("width", width);
    myCanvas.setAttribute("height", height);
}

// Initialize the buffer, vertices and colors
function initVertexBuffers(gl, i) {
    // Get the storage location of a_Position, assign and enable buffer
    let a_Position = gl.getAttribLocation(program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position.');
        return -1;
    }

    // Get the storage location of a_Color, assign and enable buffer
    let a_Color = gl.getAttribLocation(program, 'a_Color');
    if (a_Color < 0) {
        console.log("Failed to get the storage location of a_Color.");
        return -1;
    }

    // Vertex coordinates and color
    let pointsColors = getVerticesColors(i);
    let verticesColors = new Float32Array(pointsColors);
    let n = pointsColors.length / 5;

    // Create a buffer object
    let vertexColorBuffer = gl.createBuffer();
    if (!vertexColorBuffer) {
        console.log("Failed to create the buffer object.");
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);


    let FSIZE = verticesColors.BYTES_PER_ELEMENT;
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);
    gl.enableVertexAttribArray(a_Color);

    return n;
}

function initFrame(gl, i) {
    // Get the storage location of a_Position, assign and enable buffer
    let a_Position1 = gl.getAttribLocation(lineProgram, 'a_Position');
    if (a_Position1 < 0) {
        console.log('Failed to get the storage location of a_Position.');
        return -1;
    }

    // Vertex coordinates and color
    let points = getVerticesColors(i);
    let vertices = new Float32Array(points);
    let n = points.length / 5;

    // Create a buffer object
    let vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log("Failed to create the buffer object.");
        return -1;
    }
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    let FSIZE = vertices.BYTES_PER_ELEMENT;
    gl.vertexAttribPointer(a_Position1, 2, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position1);

    return n;
}

/** Get the vertex coordinates and color according to the config.js, [x, y, r, g, b]
 * The function is valid in this project.
 * */
function getVerticesColors(i) {
    let pointsColors = [];

    let vc1 = stdVerticesColors(vertex_pos[polygon[i][0]], vertex_color[polygon[i][0]]);
    let vc2 = stdVerticesColors(vertex_pos[polygon[i][1]], vertex_color[polygon[i][1]]);
    let vc3 = stdVerticesColors(vertex_pos[polygon[i][2]], vertex_color[polygon[i][2]]);
    let vc4 = stdVerticesColors(vertex_pos[polygon[i][3]], vertex_color[polygon[i][3]]);

    // The sequence of vertices is [1, 2, 3, 1, 4, 3]
    pointsColors.push(vc1[0], vc1[1], vc1[2], vc1[3], vc1[4]);
    pointsColors.push(vc2[0], vc2[1], vc2[2], vc2[3], vc2[4]);
    pointsColors.push(vc3[0], vc3[1], vc3[2], vc3[3], vc3[4]);
    pointsColors.push(vc1[0], vc1[1], vc1[2], vc1[3], vc1[4]);
    pointsColors.push(vc4[0], vc4[1], vc4[2], vc4[3], vc4[4]);
    pointsColors.push(vc3[0], vc3[1], vc3[2], vc3[3], vc3[4]);

    return pointsColors;
}

//Convert a vertex to a standard coordination [x, y] and color [r, g, b]
function stdVerticesColors(v, c) {
    // The range of coordinate is [-1, 1]
    let x = (v[0] - myCanvas.height / 2) / (myCanvas.height / 2);
    let y = (myCanvas.width / 2 - v[1]) / (myCanvas.width / 2);

    // The range of color is [0, 1]
    let r = c[0] / 255;
    let g = c[1] / 255;
    let b = c[2] / 255;

    return [x, y, r, g, b];
}


function draw(gl, currentAngle, modelMatrix, u_ModelMatrix, u_ModelMatrix1) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawPolygon(gl, currentAngle, modelMatrix, u_ModelMatrix);
    drawLine(gl, currentAngle, modelMatrix, u_ModelMatrix1);
}

// Draw polygon according to points
function drawPolygon(gl, currentAngle, modelMatrix, u_ModelMatrix) {
    for (let i = 0; i < 4; i++) {
        // Write the positions of vertices and colors to corresponding shaders
        let n = initVertexBuffers(gl, i);
        if (n < 0) {
            console.log("Failed to set the position of the vertices.");
            return;
        }
        gl.useProgram(program);

        // Pass the matrix to the vertex shader
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

        // Draw the polygon
        gl.drawArrays(gl.TRIANGLES, 0, n);
    }

}

// Draw the framework of polygon
function drawLine(gl, currentAngle, modelMatrix, u_ModelMatrix1) {
    if (visible) {
        for (let i = 0; i < 4; i++) {
            let n = initFrame(gl, i);
            //drawLine(gl, n, currentAngle, modelMatrix,u_ModelMatrix1);
            gl.useProgram(lineProgram);

            //Pass the matrix to the line shader
            gl.uniformMatrix4fv(u_ModelMatrix1, false, modelMatrix.elements);

            // If it is visible, draw a line_loop
            if (visible)
                gl.drawArrays(gl.LINE_LOOP, 0, n);
        }
    }

}

// Get next angle and scale
function animate(angle) {
    // Calculate the elapsed time
    let now = Date.now();
    let elapsed = now - g_last;
    g_last = now;

    // Update the current rotation angle according to the elapsed time
    let newAngle = angle + (ANGLE * elapsed) / 1000.0;
    newAngle %= 360;

    //Calculate and update the scale factor
    if (newAngle <= 180) {
        scale = SCALE * (1 - (newAngle / 180 * 0.8));
    } else {
        scale = SCALE * (0.2 + (newAngle - 180) / 180 * 0.8);
    }

    return newAngle;
}

// Get distance of two points
function getDistance(p1, p2) {
    return Math.sqrt(Math.pow((p1[0] - p2[0]), 2) + Math.pow((p1[1] - p2[1]), 2));
}

//The launch function
function main() {

    //Initialize the canvas, such as width and height
    init();

    //Get the rendering context for WebGL
    let gl = getWebGLContext(myCanvas);
    if (!gl) {
        console.log("Failed to get the rendering context for WebGL");
        return;
    }

    //Initialize the shaders
    program = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    lineProgram = createProgram(gl, LINE_VSHADER_SOURCE, LINE_FSHADER_SOURCE);

    // Get the storage location of u_ModelMatrix
    let u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
    let u_ModelMatrix1 = gl.getUniformLocation(lineProgram, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get storage location of u_ModelMatrix.');
        return;
    }

    // Current rotation angle
    let currentAngle = 0.0;
    // Model matrix according to the ../lib/cuon-matrix.js
    let modelMatrix = new Matrix4();

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);


    // Draw the initial polygons
    draw(gl, currentAngle, modelMatrix, u_ModelMatrix, u_ModelMatrix1);

    // The rotating and scaling function
    let tick = function () {
        currentAngle = animate(currentAngle);
        draw(gl, currentAngle, modelMatrix, u_ModelMatrix, u_ModelMatrix1);

        // Set the rotation and scale matrix
        if (rotate) {
            modelMatrix.setRotate(currentAngle, 0, 0, 1);
            modelMatrix.scale(scale / 100, scale / 100, 1.0);
            requestAnimationFrame(tick);
        }

    };

    let addMouseEvents = function () {
        let movingVertex = undefined;

        myCanvas.addEventListener("mousedown", function (e) {
            let position = [event.offsetX, event.offsetY];

            for (let j = 0; j < vertex_pos.length; j++) {
                let x = vertex_pos[j][0] - myCanvas.width / 2;
                let y = myCanvas.height / 2 - vertex_pos[j][1];
                let beta = Math.PI * currentAngle / 180;
                pos_temp[j][0] = (x * Math.cos(beta) - y * Math.sin(beta)) * scale / 100 + myCanvas.width / 2;
                pos_temp[j][1] = myCanvas.height / 2 - (x * Math.sin(beta) + y * Math.cos(beta)) * scale / 100;
            }
            for (let i = 0; i < vertex_pos.length; i++) {
                if (!rotate && visible && getDistance(position, pos_temp[i]) <= 10) {
                    movingVertex = i;
                    return;
                }
            }
        });

        myCanvas.addEventListener("mouseup", function () {
            movingVertex = undefined;
        });

        myCanvas.addEventListener("mousemove", function () {
            if (movingVertex === undefined)
                return;
            let x = (event.offsetX - myCanvas.width / 2) * 100 / scale;
            let y = (myCanvas.height / 2 - event.offsetY) * 100 / scale;
            let beta = Math.PI * currentAngle / 180;
            vertex_pos[movingVertex][0] = x * Math.cos(beta) + y * Math.sin(beta) + myCanvas.width / 2;
            vertex_pos[movingVertex][1] = myCanvas.height / 2 - y * Math.cos(beta) + x * Math.sin(beta);

            draw(gl, currentAngle, modelMatrix, u_ModelMatrix, u_ModelMatrix1);

        });

        myCanvas.addEventListener("mouseleave", function () {
            movingVertex = undefined;
        });
    };
    addMouseEvents();

    // Key events
    window.document.onkeydown = function (event) {
        let e = event || window.event || arguments.callee.caller.arguments;
        if (e && e.keyCode === 84) {
            rotate = !rotate;

            if (rotate) {
                g_last = Date.now();
                requestAnimationFrame(tick);
            }
        } else if (e && e.keyCode === 69) {
            // Restore the signs and factors
            currentAngle = 0;
            scale = SCALE;
            visible = true;
            rotate = false;
            vertex_pos = [];
            for (let i in POS) {
                vertex_pos.push(POS[i].slice(0));
            }

            modelMatrix.setRotate(currentAngle, 0, 0, 1);
            draw(gl, currentAngle, modelMatrix, u_ModelMatrix, u_ModelMatrix1);
        } else if (e && e.keyCode === 66) {
            visible = !visible;
            draw(gl, currentAngle, modelMatrix, u_ModelMatrix, u_ModelMatrix1);
        }
    };
}

main();


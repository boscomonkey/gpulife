var gpu = new GPU();

const WIDTH = 7;
const HEIGHT = 4;

const RADIUS = 13;
const DIAMETER = 30;
const START_ANGLE = 0;
const END_ANGLE = 2 * Math.PI;

// returns a blank matrix
//
function initBlankMatrix(width, height) {
    var matrix = [];
    for (var ii = 0 ; ii < width ; ii++) {
        var row = new Float32Array(height);
        for (var jj = 0 ; jj < height ; jj++) {
            row[jj] = 0.0;
        }
        matrix.push(row);
    }
    return matrix;
}

// returns a width x height matrix of random 1's and 0's
//
function initRandomMatrix(width, height) {
    var rnd = function() {
        return Math.floor( 2 * Math.random() );
    };

    var matrix = [];
    for (var ii = 0 ; ii < width ; ii++) {
        var row = new Float32Array(height);
        for (var jj = 0 ; jj < height; jj++) {
            row[jj] = rnd();
        }
        matrix.push(row);
    }
    return matrix;
}

// returns a width x height matrix of random 1's and 0's
//
function initXyCodedMatrix(width, height) {
    var rnd = function() {
        return Math.floor( 2 * Math.random() );
    };

    var matrix = [];
    for (var ii = 0 ; ii < width ; ii++) {
        var row = new Float32Array(height);
        for (var jj = 0 ; jj < height; jj++) {
            row[jj] = ii * 10 + jj;
        }
        matrix.push(row);
    }
    return matrix;
}

function addGlider(mm, x, y) {
    var bitmap = [
        [0, 1, 0],
        [0, 0, 1],
        [1, 1, 1],
    ];
    for (var ii = 0 ; ii < bitmap.length ; ii++) {
        var row = bitmap[ii];
        for (var jj = 0 ; jj < row.length ; jj++) {
            mm[x+jj][y+ii] = row[jj] * 1.0;

            // console.log(ii, jj, 'x+ii', x+ii, 'y+jj', y+jj, 'row[jj]', row[jj]);
        }
    }
}

// init a matrix with the GPU
var gameboard = initXyCodedMatrix(WIDTH, HEIGHT);
//addGlider(gameboard, 0, 0);

var canvas = document.getElementById("myCanvas");
var maxDimension = Math.max(WIDTH, HEIGHT);
canvas['width'] = maxDimension * DIAMETER;
canvas['height'] = maxDimension * DIAMETER;

var ctx = canvas.getContext("2d");

// draw the matrix
//
function render(matrix) {
    /*
    */
    console.log('matrix', matrix);
    // console.log('lengths', matrix.map(function(itm) { return itm.length }));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var width = matrix.length;
    for (var ii = 0 ; ii < width ; ii++) {
        var height = matrix[ii].length;
        var x = ii * DIAMETER + RADIUS;
        for (var jj = 0 ; jj < height ; jj++) {
            var y = jj * DIAMETER + RADIUS;
            var cell = matrix[ii][jj];
            if (cell > 0.5) {
                ctx.fillStyle = "#0f0";

                ctx.beginPath();
                ctx.arc(x, y, RADIUS, START_ANGLE, END_ANGLE);
                ctx.fill();

                ctx.fillStyle = "black";
                ctx.fillText(""+cell, x-RADIUS/2, y);
            }
            else {
                ctx.fillStyle = "#EEE";

                ctx.beginPath();
                ctx.arc(x, y, RADIUS, START_ANGLE, END_ANGLE);
                ctx.fill();

                ctx.fillStyle = "black";
                ctx.fillText(""+cell, x-RADIUS/2, y);
            }
        }
    }
}
render(gameboard);

// one step
var calcNextBoard = gpu.createKernel(
    function(board) {
        function binary(cell) {
            if (cell > 0.5) {
                return 1;
            }
            else {
                return 0;
            }
        }

        var x = this.thread.x;
        var y = this.thread.y;

        var prevX;
        if (x == 0) {
            prevX = this.dimensions.x - 1;
        }
        else {
            prevX = x - 1;
        }
        var prevY;
        if (y == 0) {
            prevY = this.dimensions.y - 1;
        }
        else {
            prevY = y - 1;
        }

        var nextX;
        if (x == (this.dimensions.x - 1)) {
            nextX = 0;
        }
        else {
            nextX = x + 1;
        }
        var nextY;
        if (y == (this.dimensions.y - 1)) {
            nextY = 0;
        }
        else {
            nextY = y + 1;
        }

        //// Conway's rules

        var numNeighborsAlive =
            binary(board[prevY][prevX])	  + binary(board[y][prevX]) + binary(board[nextY][prevX])
            + binary(board[prevY][x])				    + binary(board[nextY][x])
            + binary(board[prevY][nextX]) + binary(board[y][nextX]) + binary(board[nextY][nextX]);

        // live cell
        if (board[y][x] > 0.5) {
            if (numNeighborsAlive >= 1.9 && numNeighborsAlive <= 3.1) {
                return 1;
            } else {
                return 0;
            }
        }
        // dead cell
        else {
            if (numNeighborsAlive >= 2.9 && numNeighborsAlive <= 3.1) {
                return 1;
            } else {
                return 0;
            }
        }
    })
    .dimensions([HEIGHT, WIDTH]);

var copyMatrix = gpu.createKernel(
    function(A) {
        return A[this.thread.y][this.thread.x];
        /*
        var cell = A[this.thread.y][this.thread.x];
        if (cell > 0.75) {
            return 1;
        }
        else if (cell > -1) {
            return 0;
        }
        else {
            return 999;
        }
         */
    }
).dimensions([HEIGHT, WIDTH]);

var dimensionsMatrix = gpu.createKernel(
    function(matrix) {
        return this.dimensions.y + this.dimensions.x/10;
    }
).dimensions([HEIGHT, WIDTH]);

var invertMatrix = gpu.createKernel(
    function(board) {
        if (board[this.thread.y][this.thread.x] > 0.8) {
            return 0;
        } else {
            // return this.thread.y*10 + this.thread.x;
            return 1;
        }
    }).dimensions([HEIGHT, WIDTH]);

var yxCodeMatrix = gpu.createKernel(
    function(matrix) {
        return this.thread.y + this.thread.x/10;
    }
).dimensions([HEIGHT, WIDTH]);

function stepEvent(evt) {
    var newboard = copyMatrix(gameboard);

    /*
    var oldX = gameboard.length
    var oldY = gameboard[0].length;
    var newX = newboard.length;
    var newY = newboard[0].length;
    console.log(oldX, oldY, ' -> ', newX, newY);
    */

    render(newboard, WIDTH, HEIGHT);

    gameboard = newboard;
}

// init step button
var btnStep = document.getElementById("btnStep");
btnStep.addEventListener("click", stepEvent);

// init run button
var runForever = function() {
    stepEvent();
    setTimeout(runForever, 0);
}
var btnRun = document.getElementById("btnRun");
btnRun.addEventListener("click", runForever);

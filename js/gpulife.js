var gpu = new GPU();

const WIDTH = 100;
const HEIGHT = 75;

const RADIUS = 4;
const DIAMETER = 8;
const START_ANGLE = 0;
const END_ANGLE = 2 * Math.PI;

function initMatrix(width, height) {
    var rnd = function() {
        return Math.floor( 2 * Math.random() );
    };

    var matrix = [];
    for (var ii = 0 ; ii < width ; ii++) {
        var row = [];
        for (var jj = 0 ; jj < height; jj++) {
            row.push(rnd());
        }
        matrix.push(row);
    }
    return matrix;
}

// init a matrix with the GPU
var gameboard = initMatrix(WIDTH, HEIGHT);

var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// draw the matrix
//
function render(matrix, width, height) {
    /*
    console.log(matrix);
    console.log(matrix.length);
    console.log(matrix[0].length);
    */

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var ii = 0 ; ii < width ; ii++) {
        var x = ii * DIAMETER + RADIUS;
        for (var jj = 0 ; jj < height ; jj++) {
            var y = jj * DIAMETER + RADIUS;
            if (matrix[ii][jj]) {
                ctx.fillStyle = "green";

                ctx.beginPath();
                ctx.arc(x, y, RADIUS, START_ANGLE, END_ANGLE);
                ctx.fill();
                // ctx.stroke();
            }
            /*
            else {
                ctx.fillStyle = "lightgray";
            }
            */
        }
    }
}
render(gameboard, WIDTH, HEIGHT);

// one step
var calcNextBoard = gpu.createKernel(
    function(board, width, height) {
        var x = this.thread.x;
        var y = this.thread.y;

        var preX;
        if (x == 0) {
            preX = width - 1 /* WIDTH - 1 */;
        }
        else {
            preX = x - 1;
        }
        var preY;
        if (y == 0) {
            preY = height - 1 /* HEIGHT - 1 */;
        }
        else {
            preY = y - 1;
        }

        var postX;
        if (x == width - 1 /* WIDTH - 1 */) {
            postX = 0;
        }
        else {
            postX = x + 1;
        }
        var postY;
        if (y == height - 1 /* HEIGHT - 1 */) {
            postY = 0;
        }
        else {
            postY = y + 1;
        }

        //// Conway's rules

        var numNeighborsAlive =
              board[preX][preY]		+ board[x][preY]	+ board[postX][preY]
            + board[preX][y]					+ board[postX][y]
            + board[preX][postY]	+ board[x][postY]	+ board[postX][postY];

        // live cell
        if (board[x][y] == 1) {
            if (numNeighborsAlive == 2 || numNeighborsAlive == 3) {
                return 1;
            } else {
                return 0;
            }
        }
        // dead cell
        else {
            if (numNeighborsAlive == 3) {
                return 1;
            } else {
                return 0;
            }
        }
    })
    .dimensions([HEIGHT, WIDTH]);

function stepEvent(evt) {
    var newboard = calcNextBoard(gameboard, WIDTH, HEIGHT);
    render(newboard, WIDTH, HEIGHT);

    // gameboard = newboard;
    for (var ii = 0 ; ii < WIDTH ; ii++) {
        for (var jj = 0 ; jj < HEIGHT ; jj++) {
            gameboard[ii][jj] = newboard[jj][ii];
        }
    }
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

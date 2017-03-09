/*
  Superimpose a Gosper Glider Gun on a 2D matrix at (x,y)
 */
function gosperGliderGun(matrix, x, y, optionalArg) {
    var value = (typeof optionalArg === "undefined") ? 1 : optionalArg;

    matrix[x][y+2] = value;
    matrix[x][y+3] = value;
    matrix[x+1][y+2] = value;
    matrix[x+1][y+3] = value;
    matrix[x+8][y+3] = value;
    matrix[x+8][y+4] = value;
    matrix[x+9][y+2] = value;
    matrix[x+9][y+4] = value;
    matrix[x+10][y+2] = value;
    matrix[x+10][y+3] = value;
    matrix[x+16][y+4] = value;
    matrix[x+16][y+5] = value;
    matrix[x+16][y+6] = value;
    matrix[x+17][y+4] = value;
    matrix[x+18][y+5] = value;
    matrix[x+22][y+1] = value;
    matrix[x+22][y+2] = value;
    matrix[x+23][y+0] = value;
    matrix[x+23][y+2] = value;
    matrix[x+24][y+0] = value;
    matrix[x+24][y+1] = value;
    matrix[x+24][y+12] = value;
    matrix[x+24][y+13] = value;
    matrix[x+25][y+12] = value;
    matrix[x+25][y+14] = value;
    matrix[x+26][y+12] = value;
    matrix[x+34][y] = value;
    matrix[x+34][y+1] = value;
    matrix[x+35][y] = value;
    matrix[x+35][y+1] = value;
    matrix[x+35][y+7] = value;
    matrix[x+35][y+8] = value;
    matrix[x+35][y+9] = value;
    matrix[x+36][y+7] = value;
    matrix[x+37][y+8] = value;
}

function gosperGliderGunMatrix() {
    let gunWidth = 38;
    let gunHeight = 15;

    var bitmap = new Array(gunWidth);
    for (var ii = 0 ; ii < gunWidth ; ii++) {
        var column = new Array(gunHeight).fill(0);
        bitmap[ii] = column;
    }

    gosperGliderGun(bitmap, 0, 0, 1);
    return bitmap;
}

function leftRightReverse(bitmap) {
    return bitmap.map(
        function(column) { return column.reverse() }
    );
}

function upDownReverse(bitmap) {
    return bitmap.reverse();
}

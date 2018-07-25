import Point from './Point';

/**
 * The JC Matrix class as an object, which makes it a lot faster,
 * here is a representation of it :
 * | a | b | tx|
 * | c | d | ty|
 * | 0 | 0 | 1 |
 *
 * @class
 * @memberof JC
 */
function Matrix() {
  /**
   * @member {number}
   * @default 1
   */
  this.a = 1;

  /**
   * @member {number}
   * @default 0
   */
  this.b = 0;

  /**
   * @member {number}
   * @default 0
   */
  this.c = 0;

  /**
   * @member {number}
   * @default 1
   */
  this.d = 1;

  /**
   * @member {number}
   * @default 0
   */
  this.tx = 0;

  /**
   * @member {number}
   * @default 0
   */
  this.ty = 0;
}

Matrix.prototype.constructor = Matrix;

/**
 * Creates a Matrix object based on the given array. The Element to Matrix mapping order is as follows:
 *
 * a = array[0]
 * b = array[1]
 * c = array[3]
 * d = array[4]
 * tx = array[2]
 * ty = array[5]
 *
 * @param {number[]} array The array that the matrix will be populated from.
 */
Matrix.prototype.fromArray = function(array) {
  this.a = array[0];
  this.b = array[1];
  this.c = array[3];
  this.d = array[4];
  this.tx = array[2];
  this.ty = array[5];
};

/**
 * Creates an array from the current Matrix object.
 *
 * @param {boolean} transpose Whether we need to transpose the matrix or not
 * @return {number[]} the newly created array which contains the matrix
 */
Matrix.prototype.toArray = function(transpose) {
  if (!this.array) {
    this.array = new Float32Array(9);
  }

  const array = this.array;

  if (transpose) {
    array[0] = this.a;
    array[1] = this.b;
    array[2] = 0;
    array[3] = this.c;
    array[4] = this.d;
    array[5] = 0;
    array[6] = this.tx;
    array[7] = this.ty;
    array[8] = 1;
  } else {
    array[0] = this.a;
    array[1] = this.c;
    array[2] = this.tx;
    array[3] = this.b;
    array[4] = this.d;
    array[5] = this.ty;
    array[6] = 0;
    array[7] = 0;
    array[8] = 1;
  }

  return array;
};

/**
 * Get a new position with the current transformation applied.
 * Can be used to go from a child's coordinate space to the world coordinate space. (e.g. rendering)
 *
 * @param {Point} pos The origin
 * @param  {Point} [newPos] The point that the new position is assigned to (allowed to be same as input)
 * @return {Point} The new point, transformed through this matrix
 */
Matrix.prototype.apply = function(pos, newPos) {
  newPos = newPos || new Point();

  const x = pos.x;
  const y = pos.y;

  newPos.x = this.a * x + this.c * y + this.tx;
  newPos.y = this.b * x + this.d * y + this.ty;

  return newPos;
};

/**
 * Get a new position with the inverse of the current transformation applied.
 * Can be used to go from the world coordinate space to a child's coordinate space. (e.g. input)
 *
 * @param {Point} pos The origin
 * @param {Point} [newPos] The point that the new position is assigned to (allowed to be same as input)
 * @return {Point} The new point, inverse-transformed through this matrix
 */
Matrix.prototype.applyInverse = function(pos, newPos) {
  newPos = newPos || new Point();

  const id = 1 / (this.a * this.d + this.c * -this.b);

  const x = pos.x;
  const y = pos.y;

  newPos.x = this.d * id * x + -this.c * id * y + (this.ty * this.c - this.tx * this.d) * id;
  newPos.y = this.a * id * y + -this.b * id * x + (-this.ty * this.a + this.tx * this.b) * id;

  return newPos;
};

/**
 * Translates the matrix on the x and y.
 *
 * @param {number} x
 * @param {number} y
 * @return {Matrix} This matrix. Good for chaining method calls.
 */
Matrix.prototype.translate = function(x, y) {
  this.tx += x;
  this.ty += y;

  return this;
};

/**
 * Applies a scale transformation to the matrix.
 *
 * @param {number} x The amount to scale horizontally
 * @param {number} y The amount to scale vertically
 * @return {Matrix} This matrix. Good for chaining method calls.
 */
Matrix.prototype.scale = function(x, y) {
  this.a *= x;
  this.d *= y;
  this.c *= x;
  this.b *= y;
  this.tx *= x;
  this.ty *= y;

  return this;
};


/**
 * Applies a rotation transformation to the matrix.
 *
 * @param {number} angle - The angle in radians.
 * @return {Matrix} This matrix. Good for chaining method calls.
 */
Matrix.prototype.rotate = function(angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const a1 = this.a;
  const c1 = this.c;
  const tx1 = this.tx;

  this.a = a1 * cos - this.b * sin;
  this.b = a1 * sin + this.b * cos;
  this.c = c1 * cos - this.d * sin;
  this.d = c1 * sin + this.d * cos;
  this.tx = tx1 * cos - this.ty * sin;
  this.ty = tx1 * sin + this.ty * cos;

  return this;
};

/**
 * Appends the given Matrix to this Matrix.
 *
 * @param {Matrix} matrix
 * @return {Matrix} This matrix. Good for chaining method calls.
 */
Matrix.prototype.append = function(matrix) {
  const a1 = this.a;
  const b1 = this.b;
  const c1 = this.c;
  const d1 = this.d;

  this.a = matrix.a * a1 + matrix.b * c1;
  this.b = matrix.a * b1 + matrix.b * d1;
  this.c = matrix.c * a1 + matrix.d * c1;
  this.d = matrix.c * b1 + matrix.d * d1;

  this.tx = matrix.tx * a1 + matrix.ty * c1 + this.tx;
  this.ty = matrix.tx * b1 + matrix.ty * d1 + this.ty;

  return this;
};

/**
 * Prepends the given Matrix to this Matrix.
 *
 * @param {Matrix} matrix
 * @return {Matrix} This matrix. Good for chaining method calls.
 */
Matrix.prototype.prepend = function(matrix) {
  const tx1 = this.tx;

  if (matrix.a !== 1 || matrix.b !== 0 || matrix.c !== 0 || matrix.d !== 1) {
    const a1 = this.a;
    const c1 = this.c;
    this.a = a1 * matrix.a + this.b * matrix.c;
    this.b = a1 * matrix.b + this.b * matrix.d;
    this.c = c1 * matrix.a + this.d * matrix.c;
    this.d = c1 * matrix.b + this.d * matrix.d;
  }

  this.tx = tx1 * matrix.a + this.ty * matrix.c + matrix.tx;
  this.ty = tx1 * matrix.b + this.ty * matrix.d + matrix.ty;

  return this;
};

/**
 * Inverts this matrix
 *
 * @return {Matrix} This matrix. Good for chaining method calls.
 */
Matrix.prototype.invert = function() {
  const a1 = this.a;
  const b1 = this.b;
  const c1 = this.c;
  const d1 = this.d;
  const tx1 = this.tx;
  const n = a1 * d1 - b1 * c1;

  this.a = d1 / n;
  this.b = -b1 / n;
  this.c = -c1 / n;
  this.d = a1 / n;
  this.tx = (c1 * this.ty - d1 * tx1) / n;
  this.ty = -(a1 * this.ty - b1 * tx1) / n;

  return this;
};

/**
 * 快速设置矩阵各个分量
 * @param {Point} position
 * @param {Point} pivot
 * @param {Point} scale
 * @param {number} rotation
 * @param {Point} skew
 * @param {Point} origin
 * @return {Matrix}
 */
Matrix.prototype.setTransform = function(
  position,
  pivot,
  scale,
  rotation,
  skew,
  origin
) {
  const rs = Math.sin(rotation);
  const rc = Math.cos(rotation);
  const sy = Math.tan(skew.y);
  const sx = Math.tan(skew.x);

  const a = rc * scale.x;
  const b = rs * scale.x;
  const c = -rs * scale.y;
  const d = rc * scale.y;

  const pox = pivot.x + origin.x;
  const poy = pivot.y + origin.y;

  this.a = a + sy * c;
  this.b = b + sy * d;
  this.c = sx * a + c;
  this.d = sx * b + d;

  this.tx = position.x - pox * this.a - poy * this.c + origin.x;
  this.ty = position.y - pox * this.b - poy * this.d + origin.y;

  return this;
};

/**
 * Resets this Matix to an identity (default) matrix.
 *
 * @return {Matrix} This matrix. Good for chaining method calls.
 */
Matrix.prototype.identity = function() {
  this.a = 1;
  this.b = 0;
  this.c = 0;
  this.d = 1;
  this.tx = 0;
  this.ty = 0;

  return this;
};

/**
 * Creates a new Matrix object with the same values as this one.
 *
 * @return {Matrix} A copy of this matrix. Good for chaining method calls.
 */
Matrix.prototype.clone = function() {
  const matrix = new Matrix();
  matrix.a = this.a;
  matrix.b = this.b;
  matrix.c = this.c;
  matrix.d = this.d;
  matrix.tx = this.tx;
  matrix.ty = this.ty;

  return matrix;
};

/**
 * Changes the values of the given matrix to be the same as the ones in this matrix
 * @param {Matrix} matrix origin matrix
 * @return {Matrix} The matrix given in parameter with its values updated.
 */
Matrix.prototype.copy = function(matrix) {
  matrix.a = this.a;
  matrix.b = this.b;
  matrix.c = this.c;
  matrix.d = this.d;
  matrix.tx = this.tx;
  matrix.ty = this.ty;

  return matrix;
};

/**
 * A default (identity) matrix
 */
Matrix.IDENTITY = new Matrix();

/**
 * A temp matrix
 */
Matrix.TEMP_MATRIX = new Matrix();

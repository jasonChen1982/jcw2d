/**
 * 矩阵对象，用来描述和记录对象的tansform 状态信息
 *
 * @class
 * @memberof JC
 */
function Matrix() {
  this.a = 1;
  this.b = 0;
  this.c = 0;
  this.d = 1;
  this.tx = 0;
  this.ty = 0;
}
JC.Matrix = Matrix;
Matrix.prototype.constructor = JC.Matrix;

/**
 * 从数组设置一个矩阵
 *
 * @param array {number[]}
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
 * 将对象的数据以数组的形式导出
 *
 * @param transpose {boolean} 是否对矩阵进行转置
 * @return {number[]} 返回数组
 */
Matrix.prototype.toArray = function(transpose) {
  if (!this.array) this.array = new Float32Array(9);
  let array = this.array;

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
 * 将坐标点与矩阵左乘
 *
 * @param pos {object} 原始点
 * @param newPos {object} 变换之后的点
 * @return {object} 返回数组
 */
Matrix.prototype.apply = function(pos, newPos) {
  newPos = newPos || {};
  newPos.x = this.a * pos.x + this.c * pos.y + this.tx;
  newPos.y = this.b * pos.x + this.d * pos.y + this.ty;
  return newPos;
};
/**
 * 将坐标点与转置矩阵左乘
 *
 * @param pos {object} 原始点
 * @param newPos {object} 变换之后的点
 * @return {object} 变换之后的点
 */
Matrix.prototype.applyInverse = function(pos, newPos) {
  let id = 1 / (this.a * this.d + this.c * -this.b);
  newPos.x = this.d * id * pos.x + -this.c * id * pos.y + (this.ty * this.c - this.tx * this.d) * id;
  newPos.y = this.a * id * pos.y + -this.b * id * pos.x + (-this.ty * this.a + this.tx * this.b) * id;
  return newPos;
};
/**
 * 位移操作
 *
 * @return {this}
 */
Matrix.prototype.translate = function(x, y) {
  this.tx += x;
  this.ty += y;
  return this;
};
/**
 * 缩放操作
 *
 * @return {this}
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
 * 旋转操作
 *
 * @return {this}
 */
Matrix.prototype.rotate = function(angle) {
  let cos = Math.cos(angle);
  let sin = Math.sin(angle);
  let a1 = this.a;
  let c1 = this.c;
  let tx1 = this.tx;
  this.a = a1 * cos - this.b * sin;
  this.b = a1 * sin + this.b * cos;
  this.c = c1 * cos - this.d * sin;
  this.d = c1 * sin + this.d * cos;
  this.tx = tx1 * cos - this.ty * sin;
  this.ty = tx1 * sin + this.ty * cos;
  return this;
};
/**
 * 矩阵相乘
 *
 * @return {this}
 */
Matrix.prototype.append = function(matrix) {
  let a1 = this.a;
  let b1 = this.b;
  let c1 = this.c;
  let d1 = this.d;
  this.a = matrix.a * a1 + matrix.b * c1;
  this.b = matrix.a * b1 + matrix.b * d1;
  this.c = matrix.c * a1 + matrix.d * c1;
  this.d = matrix.c * b1 + matrix.d * d1;
  this.tx = matrix.tx * a1 + matrix.ty * c1 + this.tx;
  this.ty = matrix.tx * b1 + matrix.ty * d1 + this.ty;
  return this;
};
/**
 * 单位矩阵
 *
 * @return {this}
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
 * 快速设置矩阵各个分量
 *
 * @return {this}
 */
Matrix.prototype.setTransform = function(x, y, pivotX, pivotY, scaleX, scaleY, rotation, skewX, skewY) {
  let a, b, c, d, sr, cr, cy, sy, nsx, cx;

  sr = Math.sin(rotation);
  cr = Math.cos(rotation);
  cy = Math.cos(skewY);
  sy = Math.sin(skewY);
  nsx = -Math.sin(skewX);
  cx = Math.cos(skewX);

  a = cr * scaleX;
  b = sr * scaleX;
  c = -sr * scaleY;
  d = cr * scaleY;

  this.a = cy * a + sy * c;
  this.b = cy * b + sy * d;
  this.c = nsx * a + cx * c;
  this.d = nsx * b + cx * d;

  this.tx = x + (pivotX * a + pivotY * c);
  this.ty = y + (pivotX * b + pivotY * d);

  return this;
};
JC.IDENTITY = new Matrix();
JC.TEMP_MATRIX = new Matrix();

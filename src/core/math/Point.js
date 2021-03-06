/**
 * The Point object represents a location in a two-dimensional coordinate system, where x represents
 * the horizontal axis and y represents the vertical axis.
 *
 * @class
 * @memberof PIXI
 * @param {number} [x=0] position of the point on the x axis
 * @param {number} [y=0] position of the point on the y axis
 */
function Point(x, y) {
  /**
   * @member {number}
   * @default 0
   */
  this.x = x || 0;

  /**
   * @member {number}
   * @default 0
   */
  this.y = y || 0;
}

Point.prototype.constructor = Point;

/**
 * Creates a clone of this point
 *
 * @return {Point} a copy of the point
 */
Point.prototype.clone = function() {
  return new Point(this.x, this.y);
};

/**
 * Copies x and y from the given point
 *
 * @param {Point} p
 */
Point.prototype.copy = function(p) {
  this.set(p.x, p.y);
};

/**
 * Returns true if the given point is equal to this point
 *
 * @param {Point} p
 * @return {boolean}
 */
Point.prototype.equals = function(p) {
  return (p.x === this.x) && (p.y === this.y);
};

/**
 * Sets the point to a new x and y position.
 * If y is omitted, both x and y will be set to x.
 *
 * @param {number} [x=0] position of the point on the x axis
 * @param {number} [y=0] position of the point on the y axis
 */
Point.prototype.set = function(x, y) {
  this.x = x || 0;
  this.y = y || ((y !== 0) ? this.x : 0);
};

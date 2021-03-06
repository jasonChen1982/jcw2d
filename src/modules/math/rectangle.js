function Rectangle(x, y, width, height) {
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

  /**
     * @member {number}
     * @default 0
     */
  this.width = width || 0;

  /**
     * @member {number}
     * @default 0
     */
  this.height = height || 0;
}
JC.Rectangle = Rectangle;
Rectangle.prototype.constructor = JC.Rectangle;

/**
 * A constant empty rectangle.
 *
 * @static
 * @constant
 */
Rectangle.EMPTY = new Rectangle(0, 0, 0, 0);


/**
 * Creates a clone of this Rectangle
 *
 * @return {PIXI.Rectangle} a copy of the rectangle
 */
Rectangle.prototype.clone = function() {
  return new Rectangle(this.x, this.y, this.width, this.height);
};

/**
 * Checks whether the x and y coordinates given are contained within this Rectangle
 *
 * @param x {number} The X coordinate of the point to test
 * @param y {number} The Y coordinate of the point to test
 * @return {boolean} Whether the x/y coordinates are within this Rectangle
 */
Rectangle.prototype.contains = function(x, y) {
  if (this.width <= 0 || this.height <= 0) {
    return false;
  }

  if (x >= this.x && x < this.x + this.width) {
    if (y >= this.y && y < this.y + this.height) {
      return true;
    }
  }

  return false;
};

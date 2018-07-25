import Rectangle from './Rectangle';
import CONST from '../../const';

/**
 * The Ellipse object can be used to specify a hit area for displayObjects
 *
 * @class
 * @memberof PIXI
 * @param {number} x The X coordinate of the center of the ellipse
 * @param {number} y The Y coordinate of the center of the ellipse
 * @param {number} width The half width of this ellipse
 * @param {number} height The half height of this ellipse
 */
function Ellipse(x, y, width, height) {
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

  /**
     * The type of the object, mainly used to avoid `instanceof` checks
     *
     * @member {number}
     */
  this.type = CONST.SHAPES.ELIP;
}

Ellipse.prototype.constructor = Ellipse;

/**
 * Creates a clone of this Ellipse instance
 *
 * @return {Ellipse} a copy of the ellipse
 */
Ellipse.prototype.clone = function() {
  return new Ellipse(this.x, this.y, this.width, this.height);
};

/**
 * Checks whether the x and y coordinates given are contained within this ellipse
 *
 * @param {number} x The X coordinate of the point to test
 * @param {number} y The Y coordinate of the point to test
 * @return {boolean} Whether the x/y coords are within this ellipse
 */
Ellipse.prototype.contains = function(x, y) {
  if (this.width <= 0 || this.height <= 0) {
    return false;
  }

  // normalize the coords to an ellipse with center 0,0
  let normx = ((x - this.x) / this.width);
  let normy = ((y - this.y) / this.height);

  normx *= normx;
  normy *= normy;

  return (normx + normy <= 1);
};

/**
 * Returns the framing rectangle of the ellipse as a Rectangle object
 *
 * @return {Rectangle} the framing rectangle
 */
Ellipse.prototype.getBounds = function() {
  return new Rectangle(this.x - this.width, this.y - this.height, this.width, this.height);
};

export default Ellipse;

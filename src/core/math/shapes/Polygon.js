import Point from '../Point';
import CONST from '../../const';

/**
 * @class
 * @param {Array} points This can be an array of Points that form the polygon
 */
function Polygon(points) {
  // if this is an array of points, convert it to a flat array of numbers
  if (points[0] instanceof Point) {
    let p = [];
    for (let i = 0, il = points.length; i < il; i++) {
      p.push(points[i].x, points[i].y);
    }

    points = p;
  }

  this.closed = true;

  /**
     * An array of the points of this polygon
     *
     * @member {number[]}
     */
  this.points = points;

  /**
     * The type of the object, mainly used to avoid `instanceof` checks
     *
     * @member {number}
     */
  this.type = CONST.SHAPES.POLY;
}

Polygon.prototype.constructor = Polygon;

/**
 * Creates a clone of this polygon
 *
 * @return {Polygon} a copy of the polygon
 */
Polygon.prototype.clone = function() {
  return new Polygon(this.points.slice());
};

/**
 * Checks whether the x and y coordinates passed to this function are contained within this polygon
 *
 * @param {number} x The X coordinate of the point to test
 * @param {number} y The Y coordinate of the point to test
 * @return {boolean} Whether the x/y coordinates are within this polygon
 */
Polygon.prototype.contains = function(x, y) {
  let inside = false;

  // use some raycasting to test hits
  // https://github.com/substack/point-in-polygon/blob/master/index.js
  let length = this.points.length / 2;

  for (let i = 0, j = length - 1; i < length; j = i++) {
    let xi = this.points[i * 2];
    let yi = this.points[i * 2 + 1];
    let xj = this.points[j * 2];
    let yj = this.points[j * 2 + 1];
    let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
};

export default Polygon;

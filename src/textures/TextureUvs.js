
/**
 * A standard object to store the Uvs of a texture
 *
 * @class
 * @private
 * @memberof PIXI
 */
function TextureUvs() {
  this.x0 = 0;
  this.y0 = 0;

  this.x1 = 1;
  this.y1 = 0;

  this.x2 = 1;
  this.y2 = 1;

  this.x3 = 0;
  this.y3 = 1;
}

module.exports = TextureUvs;

let GroupD8 = require('../math/GroupD8');

/**
 * Sets the texture Uvs based on the given frame information
 * @param frame {PIXI.Rectangle}
 * @param baseFrame {PIXI.Rectangle}
 * @param rotate {number} Rotation of frame, see {@link PIXI.GroupD8}
 * @private
 */
TextureUvs.prototype.set = function(frame, baseFrame, rotate) {
  let tw = baseFrame.width;
  let th = baseFrame.height;

  if (rotate) {
    // width and height div 2 div baseFrame size
    let swapWidthHeight = GroupD8.isSwapWidthHeight(rotate);
    let w2 = (swapWidthHeight ? frame.height : frame.width) / 2 / tw;
    let h2 = (swapWidthHeight ? frame.width : frame.height) / 2 / th;
    // coordinates of center
    let cX = frame.x / tw + w2;
    let cY = frame.y / th + h2;
    rotate = GroupD8.add(rotate, GroupD8.NW); // NW is top-left corner
    this.x0 = cX + w2 * GroupD8.uX(rotate);
    this.y0 = cY + h2 * GroupD8.uY(rotate);
    rotate = GroupD8.add(rotate, 2); // rotate 90 degrees clockwise
    this.x1 = cX + w2 * GroupD8.uX(rotate);
    this.y1 = cY + h2 * GroupD8.uY(rotate);
    rotate = GroupD8.add(rotate, 2);
    this.x2 = cX + w2 * GroupD8.uX(rotate);
    this.y2 = cY + h2 * GroupD8.uY(rotate);
    rotate = GroupD8.add(rotate, 2);
    this.x3 = cX + w2 * GroupD8.uX(rotate);
    this.y3 = cY + h2 * GroupD8.uY(rotate);
  } else {
    this.x0 = frame.x / tw;
    this.y0 = frame.y / th;

    this.x1 = (frame.x + frame.width) / tw;
    this.y1 = frame.y / th;

    this.x2 = (frame.x + frame.width) / tw;
    this.y2 = (frame.y + frame.height) / th;

    this.x3 = frame.x / tw;
    this.y3 = (frame.y + frame.height) / th;
  }
};

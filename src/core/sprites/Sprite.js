import Container from '../display/Container';
import Texture from '../../textures/Texture';
import Point from '../math/Point';
import {BLEND_MODES} from '../../constants/index';
import {utils} from '../../util/utils';

const tempPoint = new Point();

/**
 * The Sprite object is the base for all textured objects that are rendered to the screen
 *
 * A sprite can be created directly from an image like this:
 *
 * ```js
 * var sprite = new Sprite.fromImage('assets/image.png');
 * ```
 *
 * @class
 * @extends Container
 * @memberof PIXI
 * @param {Texture} texture The texture for this sprite
 */
function Sprite(texture) {
  Container.call(this);

  /**
   * The anchor sets the origin point of the texture.
   * The default is 0,0 this means the texture's origin is the top left
   * Setting the anchor to 0.5,0.5 means the texture's origin is centered
   * Setting the anchor to 1,1 would mean the texture's origin point will be the bottom right corner
   *
   * @member {Point}
   */
  this.anchor = new Point();

  /**
   * The texture that the sprite is using
   *
   * @member {Texture}
   * @private
   */
  this._texture = null;

  /**
   * The width of the sprite (this is initially set by the texture)
   *
   * @member {number}
   * @private
   */
  this._width = 0;

  /**
   * The height of the sprite (this is initially set by the texture)
   *
   * @member {number}
   * @private
   */
  this._height = 0;

  /**
   * The tint applied to the sprite. This is a hex value. A value of 0xFFFFFF will remove any tint effect.
   *
   * @member {number}
   * @default 0xFFFFFF
   */
  this.tint = 0xFFFFFF;

  /**
   * The blend mode to be applied to the sprite. Apply a value of `BLEND_MODES.NORMAL` to reset the blend mode.
   *
   * @member {number}
   * @default BLEND_MODES.NORMAL
   * @see BLEND_MODES
   */
  this.blendMode = BLEND_MODES.NORMAL;

  /**
   * The shader that will be used to render the sprite. Set to null to remove a current shader.
   *
   * @member {AbstractFilter|Shader}
   */
  this.shader = null;

  /**
   * An internal cached value of the tint.
   *
   * @member {number}
   * @default 0xFFFFFF
   */
  this.cachedTint = 0xFFFFFF;

  // call texture setter
  this.texture = texture || Texture.EMPTY;
}

// constructor
Sprite.prototype = Object.create(Container.prototype);
Sprite.prototype.constructor = Sprite;

Object.defineProperties(Sprite.prototype, {
  /**
   * The width of the sprite, setting this will actually modify the scale to achieve the value set
   *
   * @member {number}
   * @memberof Sprite#
   */
  width: {
    get: function() {
      return Math.abs(this.scale.x) * this.texture._frame.width;
    },
    set: function(value) {
      const sign = utils.sign(this.scale.x) || 1;
      this.scale.x = sign * value / this.texture._frame.width;
      this._width = value;
    },
  },

  /**
   * The height of the sprite, setting this will actually modify the scale to achieve the value set
   *
   * @member {number}
   * @memberof Sprite#
   */
  height: {
    get: function() {
      return Math.abs(this.scale.y) * this.texture._frame.height;
    },
    set: function(value) {
      const sign = utils.sign(this.scale.y) || 1;
      this.scale.y = sign * value / this.texture._frame.height;
      this._height = value;
    },
  },

  /**
   * The texture that the sprite is using
   *
   * @member {Texture}
   * @memberof Sprite#
   */
  texture: {
    get: function() {
      return this._texture;
    },
    set: function(value) {
      if (this._texture === value) {
        return;
      }

      this._texture = value;
      this.cachedTint = 0xFFFFFF;

      if (value) {
        // wait for the texture to load
        if (value.baseTexture.hasLoaded) {
          this._onTextureUpdate();
        } else {
          value.once('update', this._onTextureUpdate, this);
        }
      }
    },
  },
});

/**
 * When the texture is updated, this event will fire to update the scale and frame
 *
 * @private
 */
Sprite.prototype._onTextureUpdate = function() {
  // so if _width is 0 then width was not set..
  if (this._width) {
    this.scale.x = utils.sign(this.scale.x) * this._width / this.texture.frame.width;
  }

  if (this._height) {
    this.scale.y = utils.sign(this.scale.y) * this._height / this.texture.frame.height;
  }
};

/**
 *
 * Renders the object using the WebGL renderer
 *
 * @param {WebGLRenderer} renderer
 * @private
 */
Sprite.prototype._renderWebGL = function(renderer) {
  renderer.setObjectRenderer(renderer.plugins.sprite);
  renderer.plugins.sprite.render(this);
};

/**
 * Returns the bounds of the Sprite as a rectangle. The bounds calculation takes the worldTransform into account.
 *
 * @param {Matrix} matrix the transformation matrix of the sprite
 * @return {Rectangle} the framing rectangle
 */
Sprite.prototype.getBounds = function(matrix) {
  if (!this._currentBounds) {
    const width = this._texture._frame.width;
    const height = this._texture._frame.height;

    let w0 = width * (1 - this.anchor.x);
    let w1 = width * -this.anchor.x;

    let h0 = height * (1 - this.anchor.y);
    let h1 = height * -this.anchor.y;

    const worldTransform = matrix || this.worldTransform;

    const a = worldTransform.a;
    const b = worldTransform.b;
    const c = worldTransform.c;
    const d = worldTransform.d;
    const tx = worldTransform.tx;
    const ty = worldTransform.ty;

    let minX;
    let maxX;
    let minY;
    let maxY;

    const x1 = a * w1 + c * h1 + tx;
    const y1 = d * h1 + b * w1 + ty;

    const x2 = a * w0 + c * h1 + tx;
    const y2 = d * h1 + b * w0 + ty;

    const x3 = a * w0 + c * h0 + tx;
    const y3 = d * h0 + b * w0 + ty;

    const x4 = a * w1 + c * h0 + tx;
    const y4 = d * h0 + b * w1 + ty;

    minX = x1;
    minX = x2 < minX ? x2 : minX;
    minX = x3 < minX ? x3 : minX;
    minX = x4 < minX ? x4 : minX;

    minY = y1;
    minY = y2 < minY ? y2 : minY;
    minY = y3 < minY ? y3 : minY;
    minY = y4 < minY ? y4 : minY;

    maxX = x1;
    maxX = x2 > maxX ? x2 : maxX;
    maxX = x3 > maxX ? x3 : maxX;
    maxX = x4 > maxX ? x4 : maxX;

    maxY = y1;
    maxY = y2 > maxY ? y2 : maxY;
    maxY = y3 > maxY ? y3 : maxY;
    maxY = y4 > maxY ? y4 : maxY;

    if (this.children.length) {
      const childBounds = this.containerGetBounds();

      w0 = childBounds.x;
      w1 = childBounds.x + childBounds.width;
      h0 = childBounds.y;
      h1 = childBounds.y + childBounds.height;

      minX = (minX < w0) ? minX : w0;
      minY = (minY < h0) ? minY : h0;

      maxX = (maxX > w1) ? maxX : w1;
      maxY = (maxY > h1) ? maxY : h1;
    }

    const bounds = this._bounds;

    bounds.x = minX;
    bounds.width = maxX - minX;

    bounds.y = minY;
    bounds.height = maxY - minY;

    // store a reference so that if this function gets called again in the render cycle we do not have to recalculate
    this._currentBounds = bounds;
  }

  return this._currentBounds;
};

/**
 * Gets the local bounds of the sprite object.
 * @return {Bounds}
 */
Sprite.prototype.getLocalBounds = function() {
  this._bounds.x = -this._texture._frame.width * this.anchor.x;
  this._bounds.y = -this._texture._frame.height * this.anchor.y;
  this._bounds.width = this._texture._frame.width;
  this._bounds.height = this._texture._frame.height;
  return this._bounds;
};

/**
 * Tests if a point is inside this sprite
 *
 * @param {Point} point the point to test
 * @return {boolean} the result of the test
 */
Sprite.prototype.containsPoint = function(point) {
  this.worldTransform.applyInverse(point, tempPoint);

  const width = this._texture._frame.width;
  const height = this._texture._frame.height;
  const x1 = -width * this.anchor.x;
  let y1;

  if (tempPoint.x > x1 && tempPoint.x < x1 + width) {
    y1 = -height * this.anchor.y;

    if (tempPoint.y > y1 && tempPoint.y < y1 + height) {
      return true;
    }
  }

  return false;
};

/**
 * Destroys this sprite and optionally its texture
 *
 * @param {boolean} [destroyTexture=false] Should it destroy the current texture of the sprite as well
 * @param {boolean} [destroyBaseTexture=false] Should it destroy the base texture of the sprite as well
 */
Sprite.prototype.destroy = function(destroyTexture, destroyBaseTexture) {
  Container.prototype.destroy.call(this);

  this.anchor = null;

  if (destroyTexture) {
    this._texture.destroy(destroyBaseTexture);
  }

  this._texture = null;
  this.shader = null;
};

// some helper functions..

/**
 * Helper function that creates a sprite that will contain a texture from the TextureCache based on the frameId
 * The frame ids are created when a Texture packer file has been loaded
 *
 * @static
 * @param {string} frameId The frame Id of the texture in the cache
 * @param {boolean} [crossorigin=(auto)] if you want to specify the cross-origin parameter
 * @param {number} [scaleMode=SCALE_MODES.DEFAULT] if you want to specify the scale mode, see {@link SCALE_MODES} for possible values
 * @return {Sprite} A new Sprite using a texture from the texture cache matching the frameId
 */
Sprite.fromFrame = function(frameId) {
  const texture = utils.TextureCache[frameId];

  if (!texture) {
    throw new Error('The frameId "' + frameId + '" does not exist in the texture cache');
  }

  return new Sprite(texture);
};

/**
 * Helper function that creates a sprite that will contain a texture based on an image url
 * If the image is not in the texture cache it will be loaded
 *
 * @static
 * @param {string} imageId The image url of the texture
 * @param {string} crossorigin The image crossorigin param
 * @param {string} scaleMode The image scaleMode
 * @return {Sprite} A new Sprite using a texture from the texture cache matching the image id
 */
Sprite.fromImage = function(imageId, crossorigin, scaleMode) {
  return new Sprite(Texture.fromImage(imageId, crossorigin, scaleMode));
};

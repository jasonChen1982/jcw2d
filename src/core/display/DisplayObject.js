import Matrix, {TEMP_MATRIX} from '../math/Matrix';
import Point from '../math/Point';
import Rectangle from '../math/shapes/Rectangle';
import RenderTexture from '../textures/RenderTexture';
import Eventer from '../../eventer/Eventer';
import {PI_2} from '../../constants/index';

/**
 * The base class for all objects that are rendered on the screen.
 * This is an abstract class and should not be used on its own rather it should be extended.
 *
 * @class
 * @extends Eventer
 * @memberof JC
 */
function DisplayObject() {
  Eventer.call(this);

  /**
   * The coordinate of the object relative to the local coordinates of the parent.
   *
   * @member {Point}
   */
  this.position = new Point();

  /**
   * The scale factor of the object.
   *
   * @member {Point}
   */
  this.scale = new Point(1, 1);

  /**
   * 物体的旋转中心，pivot的值`会`改变物体的位置，单位为px
   *
   * @member {Point}
   */
  this.pivot = new Point(0, 0);

  /**
   * The skew factor for the object in radians.
   *
   * @member {Point}
   */
  this.skew = new Point(0, 0);

  /**
   * 物体的旋转中心，origin的值`不会`改变物体的位置，单位为px
   *
   * @member {Point}
   */
  this.origin = new Point(0, 0);

  /**
   * The rotation of the object in radians.
   *
   * @member {number}
   */
  this.rotation = 0;

  /**
   * The opacity of the object.
   *
   * @member {number}
   */
  this.opacity = 1;

  /**
   * The visibility of the object. If false the object will not be drawn, and
   * the updateTransform function will not be called.
   *
   * @member {boolean}
   */
  this.visible = true;

  /**
   * Can this object be rendered, if false the object will not be drawn but the updateTransform
   * methods will still be called.
   *
   * @member {boolean}
   */
  this.renderable = true;

  /**
   * The display object container that contains this display object.
   *
   * @member {Container}
   * @readOnly
   */
  this.parent = null;

  /**
   * The multiplied opacity of the displayObject
   *
   * @member {number}
   * @readOnly
   */
  this.worldOpacity = 1;

  /**
   * Current transform of the object based on world (parent) factors
   *
   * @member {Matrix}
   * @readOnly
   */
  this.worldTransform = new Matrix();

  /**
   * The area the filter is applied to. This is used as more of an optimisation
   * rather than figuring out the dimensions of the displayObject each frame you can set this rectangle
   *
   * @member {Rectangle}
   */
  this.filterArea = null;

  /**
   * cached sin rotation
   *
   * @member {number}
   * @private
   */
  this._sr = 0;

  /**
   * cached cos rotation
   *
   * @member {number}
   * @private
   */
  this._cr = 1;

  /**
   * The original, cached bounds of the object
   *
   * @member {Rectangle}
   * @private
   */
  this._bounds = new Rectangle(0, 0, 1, 1);

  /**
   * The most up-to-date bounds of the object
   *
   * @member {Rectangle}
   * @private
   */
  this._currentBounds = null;

  /**
   * The original, cached mask of the object
   *
   * @member {Rectangle}
   * @private
   */
  this._mask = null;

  // TODO: rename to _isMask
  // this.isMask = false;

  /**
   * Cached internal flag.
   *
   * @member {boolean}
   * @private
   */
  this._cacheAsBitmap = false;
  this._cachedObject = null;
}

DisplayObject.prototype = Object.create(Eventer.prototype);
DisplayObject.prototype.constructor = DisplayObject;

Object.defineProperties(DisplayObject.prototype, {
  /**
   * The position of the displayObject on the x axis relative to the local coordinates of the parent.
   *
   * @member {number}
   * @memberof DisplayObject#
   */
  x: {
    get: function() {
      return this.position.x;
    },
    set: function(value) {
      this.position.x = value;
    },
  },

  /**
   * The position of the displayObject on the y axis relative to the local coordinates of the parent.
   *
   * @member {number}
   * @memberof DisplayObject#
   */
  y: {
    get: function() {
      return this.position.y;
    },
    set: function(value) {
      this.position.y = value;
    },
  },

  /**
   * Indicates if the sprite is globally visible.
   *
   * @member {boolean}
   * @memberof JC.DisplayObject#
   * @readonly
   */
  worldVisible: {
    get: function() {
      let item = this;

      do {
        if (!item.visible) {
          return false;
        }

        item = item.parent;
      } while (item);

      return true;
    },
  },

  /**
   * Sets a mask for the displayObject. A mask is an object that limits the visibility of an object to the shape of the mask applied to it.
   * In JC a regular mask must be a JC.Graphics object. This allows for much faster masking in canvas as it utilises shape clipping.
   * To remove a mask, set this property to null.
   *
   * @member {Graphics}
   * @property {Graphics}
   * @memberof JC.DisplayObject#
   */
  mask: {
    get: function() {
      return this._mask;
    },
    set: function(value) {
      if (this._mask) {
        this._mask.renderable = true;
      }

      this._mask = value;

      if (this._mask) {
        this._mask.renderable = false;
      }
    },
  },

  /**
   * Sets the filters for the displayObject.
   * * IMPORTANT: This is a webGL only feature and will be ignored by the canvas renderer.
   * To remove filters simply set this property to 'null'
   *
   * @member {Filter[]}
   * @memberof JC.DisplayObject#
   */
  filters: {
    get: function() {
      return this._filters && this._filters.slice();
    },
    set: function(value) {
      this._filters = value && value.slice();
    },
  },

});

/*
 * Updates the object transform for rendering
 *
 * TODO - Optimization pass!
 */
DisplayObject.prototype.updateTransform = function() {
  const pt = this.parent.worldTransform;
  const wt = this.worldTransform;

  let a;
  let b;
  let c;
  let d;
  let tx;
  let ty;

  const pox = this.pivot.x + this.origin.x;
  const poy = this.pivot.y + this.origin.y;

  if (this.skew.x || this.skew.y) {
    TEMP_MATRIX.setTransform(
      this.position,
      this.pivot,
      this.scale,
      this.rotation,
      this.skew,
      this.origin
    );

    wt.a = TEMP_MATRIX.a * pt.a + TEMP_MATRIX.b * pt.c;
    wt.b = TEMP_MATRIX.a * pt.b + TEMP_MATRIX.b * pt.d;
    wt.c = TEMP_MATRIX.c * pt.a + TEMP_MATRIX.d * pt.c;
    wt.d = TEMP_MATRIX.c * pt.b + TEMP_MATRIX.d * pt.d;
    wt.tx = TEMP_MATRIX.tx * pt.a + TEMP_MATRIX.ty * pt.c + pt.tx;
    wt.ty = TEMP_MATRIX.tx * pt.b + TEMP_MATRIX.ty * pt.d + pt.ty;
  } else {
    if (this.rotation % PI_2) {
      if (this.rotation !== this.rotationCache) {
        this.rotationCache = this.rotation;
        this._sr = Math.sin(this.rotation);
        this._cr = Math.cos(this.rotation);
      }

      a = this._cr * this.scale.x;
      b = this._sr * this.scale.x;
      c = -this._sr * this.scale.y;
      d = this._cr * this.scale.y;
      tx = this.position.x;
      ty = this.position.y;

      if (this.pivot.x || this.pivot.y || this.origin.x || this.origin.y) {
        tx -= pox * a + poy * c - this.origin.x;
        ty -= pox * b + poy * d - this.origin.y;
      }

      wt.a = a * pt.a + b * pt.c;
      wt.b = a * pt.b + b * pt.d;
      wt.c = c * pt.a + d * pt.c;
      wt.d = c * pt.b + d * pt.d;
      wt.tx = tx * pt.a + ty * pt.c + pt.tx;
      wt.ty = tx * pt.b + ty * pt.d + pt.ty;
    } else {
      a = this.scale.x;
      d = this.scale.y;

      tx = this.position.x - pox * a + this.origin.x;
      ty = this.position.y - poy * d + this.origin.y;

      wt.a = a * pt.a;
      wt.b = a * pt.b;
      wt.c = d * pt.c;
      wt.d = d * pt.d;
      wt.tx = tx * pt.a + ty * pt.c + pt.tx;
      wt.ty = tx * pt.b + ty * pt.d + pt.ty;
    }
  }

  // multiply the opacitys..
  this.worldOpacity = this.opacity * this.parent.worldOpacity;

  // reset the bounds each time this is called!
  this._currentBounds = null;
};

// performance increase to avoid using call.. (10x faster)
DisplayObject.prototype.displayObjectUpdateTransform = DisplayObject.prototype.updateTransform;

/**
 *
 *
 * Retrieves the bounds of the displayObject as a rectangle object
 *
 * @param {Matrix} matrix
 * @return {Rectangle} the rectangular bounding area
 */
DisplayObject.prototype.getBounds = function(matrix) {
  return Rectangle.EMPTY;
};

/**
 * Retrieves the local bounds of the displayObject as a rectangle object
 *
 * @return {Rectangle} the rectangular bounding area
 */
DisplayObject.prototype.getLocalBounds = function() {
  return this.getBounds(Matrix.IDENTITY);
};

/**
 * Calculates the global position of the display object
 *
 * @param {Point} position The world origin to calculate from
 * @return {Point} A point object representing the position of this object
 */
DisplayObject.prototype.toGlobal = function(position) {
  // don't need to update the lot
  this.displayObjectUpdateTransform();
  return this.worldTransform.apply(position);
};

/**
 * Calculates the local position of the display object relative to another point
 *
 * @param {Point} position The world origin to calculate from
 * @param {DisplayObject} [from] The DisplayObject to calculate the global position from
 * @return {Point} A point object representing the position of this object
 */
DisplayObject.prototype.toLocal = function(position, from) {
  if (from) {
    position = from.toGlobal(position);
  }

  // don't need to update the lot
  this.displayObjectUpdateTransform();
  return this.worldTransform.applyInverse(position);
};

/**
 * Renders the object using the WebGL renderer
 *
 * @param {WebGLRenderer} renderer The renderer
 * @private
 */
DisplayObject.prototype.renderWebGL = function(renderer) {
  // OVERWRITE;
};

/**
 * Useful function that returns a texture of the display object that can then be used to create sprites
 * This can be quite useful if your displayObject is static / complicated and needs to be reused multiple times.
 *
 * @param {CanvasRenderer|WebGLRenderer} renderer The renderer used to generate the texture.
 * @param {Number} scaleMode See {@link SCALE_MODES} for possible values
 * @param {Number} resolution The resolution of the texture being generated
 * @return {Texture} a texture of the display object
 */
DisplayObject.prototype.generateTexture = function(renderer, scaleMode, resolution) {
  const bounds = this.getLocalBounds();

  const renderTexture = new RenderTexture(renderer, bounds.width | 0, bounds.height | 0, scaleMode, resolution);

  renderTexture.render(this);

  return renderTexture;
};

/**
 * Base destroy method for generic display objects
 *
 */
DisplayObject.prototype.destroy = function() {
  this.position = null;
  this.scale = null;
  this.pivot = null;

  this.parent = null;

  this._bounds = null;
  this._currentBounds = null;
  this._mask = null;

  this.worldTransform = null;
  this.filterArea = null;
};

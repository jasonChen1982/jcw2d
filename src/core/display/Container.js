// var math = require('../math'),
//   utils = require('../utils'),
//   RenderTexture = require('../textures/RenderTexture'),
//   _tempMatrix = new math.Matrix();
import Rectangle from '../math/shapes/Rectangle';
import DisplayObject from './DisplayObject';
import Matrix from '../math/Matrix';

/**
 * A Container represents a collection of display objects.
 * It is the base class of all display objects that act as a container for other objects.
 *
 *```js
 * var container = new Container();
 * container.addChild(sprite);
 * ```
 * @class
 * @extends DisplayObject
 * @memberof PIXI
 */
function Container() {
  DisplayObject.call(this);

  /**
   * The array of children of this container.
   *
   * @member {DisplayObject[]}
   * @readonly
   */
  this.children = [];
}

// constructor
Container.prototype = Object.create(DisplayObject.prototype);
Container.prototype.constructor = Container;

Object.defineProperties(Container.prototype, {
  /**
   * The width of the Container, setting this will actually modify the scale to achieve the value set
   *
   * @member {number}
   * @memberof Container#
   */
  width: {
    get: function() {
      return this.scale.x * this.getLocalBounds().width;
    },
    set: function(value) {
      const width = this.getLocalBounds().width;

      if (width !== 0) {
        this.scale.x = value / width;
      } else {
        this.scale.x = 1;
      }

      this._width = value;
    },
  },

  /**
   * The height of the Container, setting this will actually modify the scale to achieve the value set
   *
   * @member {number}
   * @memberof Container#
   */
  height: {
    get: function() {
      return this.scale.y * this.getLocalBounds().height;
    },
    set: function(value) {
      const height = this.getLocalBounds().height;

      if (height !== 0) {
        this.scale.y = value / height;
      } else {
        this.scale.y = 1;
      }

      this._height = value;
    },
  },
});

/**
 * Overridable method that can be used by Container subclasses whenever the children array is modified
 *
 * @private
 */
Container.prototype.onChildrenChange = function() {};

/**
 * Adds a child to the container.
 *
 * You can also add multple items like so: myContainer.addChild(thinkOne, thingTwo, thingThree)
 * @param {DisplayObject} child The DisplayObject to add to the container
 * @return {DisplayObject} The child that was added.
 */
Container.prototype.addChild = function(child) {
  const argumentsLength = arguments.length;

  if (argumentsLength > 1) {
    for (let i = 0; i < argumentsLength; i++) {
      /* eslint prefer-rest-params: 0 */
      this.addChild(arguments[i]);
    }
  } else {
    if (child.parent) {
      child.parent.removeChild(child);
    }

    child.parent = this;
    this.children.push(child);
  }

  return child;
};

/**
 * Adds a child to the container at a specified index. If the index is out of bounds an error will be thrown
 *
 * @param {DisplayObject} child The child to add
 * @param {number} index The index to place the child in
 * @return {DisplayObject} The child that was added.
 */
Container.prototype.addChildAt = function(child, index) {
  if (index >= 0 && index <= this.children.length) {
    if (child.parent) {
      child.parent.removeChild(child);
    }

    child.parent = this;

    this.children.splice(index, 0, child);

    return child;
  } else {
    throw new Error(child + 'addChildAt: The index ' + index + ' supplied is out of bounds ' + this.children.length);
  }
};

/**
 * Swaps the position of 2 Display Objects within this container.
 *
 * @param {DisplayObject} child
 * @param {DisplayObject} child2
 */
Container.prototype.swapChildren = function(child, child2) {
  if (child === child2) {
    return;
  }

  const index1 = this.getChildIndex(child);
  const index2 = this.getChildIndex(child2);

  if (index1 < 0 || index2 < 0) {
    throw new Error('swapChildren: Both the supplied DisplayObjects must be children of the caller.');
  }

  this.children[index1] = child2;
  this.children[index2] = child;
};

/**
 * Returns the index position of a child DisplayObject instance
 *
 * @param {DisplayObject} child The DisplayObject instance to identify
 * @return {number} The index position of the child display object to identify
 */
Container.prototype.getChildIndex = function(child) {
  const index = this.children.indexOf(child);

  if (index === -1) {
    throw new Error('The supplied DisplayObject must be a child of the caller');
  }

  return index;
};

/**
 * Returns the child at the specified index
 *
 * @param {number} index The index to get the child at
 * @return {DisplayObject} The child at the given index, if any.
 */
Container.prototype.getChildAt = function(index) {
  if (index < 0 || index >= this.children.length) {
    throw new Error('getChildAt: Supplied index ' + index + ' does not exist in the child list, or the supplied DisplayObject is not a child of the caller');
  }

  return this.children[index];
};

/**
 * Removes a child from the container.
 *
 * @param {DisplayObject} child The DisplayObject to remove
 * @return {DisplayObject} The child that was removed.
 */
Container.prototype.removeChild = function(child) {
  const argumentsLength = arguments.length;

  if (argumentsLength > 1) {
    for (let i = 0; i < argumentsLength; i++) {
      this.removeChild(arguments[i]);
    }
  } else {
    const index = this.children.indexOf(child);

    if (index === -1) {
      return;
    }

    child.parent = null;
    this.children.splice(index, 1);
  }

  return child;
};

/**
 * Removes a child from the specified index position.
 *
 * @param {number} index The index to get the child from
 * @return {DisplayObject} The child that was removed.
 */
Container.prototype.removeChildAt = function(index) {
  const child = this.getChildAt(index);

  return this.removeChild(child);
};

/**
 * Removes all children from this container that are within the begin and end indexes.
 *
 * @param {number} beginIndex The beginning position. Default value is 0.
 * @param {number} endIndex The ending position. Default value is size of the container.
 * @return {array} removed child
 */
Container.prototype.removeChildren = function(beginIndex, endIndex) {
  const begin = beginIndex || 0;
  const end = typeof endIndex === 'number' ? endIndex : this.children.length;
  const range = end - begin;
  let removed;
  let i;

  if (range > 0 && range <= end) {
    removed = this.children.splice(begin, range);

    for (i = 0; i < removed.length; ++i) {
      removed[i].parent = null;
    }

    return removed;
  } else if (range === 0 && this.children.length === 0) {
    return [];
  } else {
    throw new RangeError('removeChildren: numeric values are outside the acceptable range.');
  }
};

/**
 * Useful function that returns a texture of the display object that can then be used to create sprites
 * This can be quite useful if your displayObject is static / complicated and needs to be reused multiple times.
 *
 * @param {WebGLRenderer} renderer The renderer used to generate the texture.
 * @param {number} resolution The resolution of the texture being generated
 * @param {number} scaleMode See {@link SCALE_MODES} for possible values
 * @return {Texture} a texture of the display object
 */
// Container.prototype.generateTexture = function(renderer, resolution, scaleMode) {
//   const bounds = this.getLocalBounds();

//   const renderTexture = new RenderTexture(renderer, bounds.width | 0, bounds.height | 0, scaleMode, resolution);

//   return renderTexture;
// };

/*
 * Updates the transform on all children of this container for rendering
 *
 * @private
 */
Container.prototype.updateTransform = function() {
  if (!this.visible) {
    return;
  }

  this.displayObjectUpdateTransform();

  for (let i = 0, j = this.children.length; i < j; ++i) {
    this.children[i].updateTransform();
  }
};

// performance increase to avoid using call.. (10x faster)
Container.prototype.containerUpdateTransform = Container.prototype.updateTransform;

/**
 * Retrieves the bounds of the Container as a rectangle. The bounds calculation takes all visible children into consideration.
 *
 * @return {Rectangle} The rectangular bounding area
 */
Container.prototype.getBounds = function() {
  if (!this._currentBounds) {
    if (this.children.length === 0) {
      return Rectangle.EMPTY;
    }

    // TODO the bounds have already been calculated this render session so return what we have

    let minX = Infinity;
    let minY = Infinity;

    let maxX = -Infinity;
    let maxY = -Infinity;

    let childBounds;
    let childMaxX;
    let childMaxY;

    let childVisible = false;

    for (let i = 0, j = this.children.length; i < j; ++i) {
      const child = this.children[i];

      if (!child.visible) {
        continue;
      }

      childVisible = true;

      childBounds = this.children[i].getBounds();

      minX = minX < childBounds.x ? minX : childBounds.x;
      minY = minY < childBounds.y ? minY : childBounds.y;

      childMaxX = childBounds.width + childBounds.x;
      childMaxY = childBounds.height + childBounds.y;

      maxX = maxX > childMaxX ? maxX : childMaxX;
      maxY = maxY > childMaxY ? maxY : childMaxY;
    }

    if (!childVisible) {
      return Rectangle.EMPTY;
    }

    const bounds = this._bounds;

    bounds.x = minX;
    bounds.y = minY;
    bounds.width = maxX - minX;
    bounds.height = maxY - minY;

    this._currentBounds = bounds;
  }

  return this._currentBounds;
};

Container.prototype.containerGetBounds = Container.prototype.getBounds;

/**
 * Retrieves the non-global local bounds of the Container as a rectangle.
 * The calculation takes all visible children into consideration.
 *
 * @return {Rectangle} The rectangular bounding area
 */
Container.prototype.getLocalBounds = function() {
  const matrixCache = this.worldTransform;

  this.worldTransform = Matrix.IDENTITY;

  for (let i = 0, j = this.children.length; i < j; ++i) {
    this.children[i].updateTransform();
  }

  this.worldTransform = matrixCache;

  this._currentBounds = null;

  return this.getBounds(Matrix.IDENTITY);
};

/**
 * Renders the object using the WebGL renderer
 *
 * @param {WebGLRenderer} renderer The renderer
 */
Container.prototype.renderWebGL = function(renderer) {
  // if the object is not visible or the alpha is 0 then no need to render this element
  if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
    return;
  }

  let i;
  let j;

  // do a quick check to see if this element has a mask or a filter.
  if (this._mask || this._filters) {
    renderer.currentRenderer.flush();

    // push filter first as we need to ensure the stencil buffer is correct for any masking
    if (this._filters && this._filters.length) {
      renderer.filterManager.pushFilter(this, this._filters);
    }

    if (this._mask) {
      renderer.maskManager.pushMask(this, this._mask);
    }

    renderer.currentRenderer.start();

    // add this object to the batch, only rendered if it has a texture.
    this._renderWebGL(renderer);

    // now loop through the children and make sure they get rendered
    for (i = 0, j = this.children.length; i < j; i++) {
      this.children[i].renderWebGL(renderer);
    }

    renderer.currentRenderer.flush();

    if (this._mask) {
      renderer.maskManager.popMask(this, this._mask);
    }

    if (this._filters) {
      renderer.filterManager.popFilter();
    }
    renderer.currentRenderer.start();
  } else {
    this._renderWebGL(renderer);

    // simple render children!
    for (i = 0, j = this.children.length; i < j; ++i) {
      this.children[i].renderWebGL(renderer);
    }
  }
};

/**
 * To be overridden by the subclass
 *
 * @param {WebGLRenderer} renderer The renderer
 * @private
 */
Container.prototype._renderWebGL = function(renderer) {
  // this is where content itself gets rendered...
};

/**
 * Destroys the container
 * @param {boolean} [destroyChildren=false] if set to true, all the children will have their destroy method called as well
 */
Container.prototype.destroy = function(destroyChildren) {
  DisplayObject.prototype.destroy.call(this);

  if (destroyChildren) {
    for (let i = 0, j = this.children.length; i < j; ++i) {
      this.children[i].destroy(destroyChildren);
    }
  }

  this.removeChildren();

  this.children = null;
};

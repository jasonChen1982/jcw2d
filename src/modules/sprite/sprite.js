function Sprite(texture) {
    JC.Container.call(this);

    this.anchor = new JC.Point();

    this._texture = null;

    this._width = 0;

    this._height = 0;

    this.tint = 0xFFFFFF;

    this.blendMode = JC.CONST.BLEND_MODES.NORMAL;

    this.shader = null;

    this.cachedTint = 0xFFFFFF;

    this.texture = texture;
}

// constructor
JC.Sprite = Sprite;
Sprite.prototype = Object.create(JC.Container.prototype);
Sprite.prototype.constructor = JC.Sprite;

Object.defineProperties(Sprite.prototype, {
    /**
     * The width of the sprite, setting this will actually modify the scale to achieve the value set
     *
     * @member {number}
     * @memberof PIXI.Sprite#
     */
    width: {
        get: function() {
            return Math.abs(this.scale.x) * this.texture._frame.width;
        },
        set: function(value) {
            var sign = utils.sign(this.scale.x) || 1;
            this.scale.x = sign * value / this.texture._frame.width;
            this._width = value;
        }
    },

    /**
     * The height of the sprite, setting this will actually modify the scale to achieve the value set
     *
     * @member {number}
     * @memberof PIXI.Sprite#
     */
    height: {
        get: function() {
            return Math.abs(this.scale.y) * this.texture._frame.height;
        },
        set: function(value) {
            var sign = utils.sign(this.scale.y) || 1;
            this.scale.y = sign * value / this.texture._frame.height;
            this._height = value;
        }
    },

    /**
     * The texture that the sprite is using
     *
     * @member {PIXI.Texture}
     * @memberof PIXI.Sprite#
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
                    this.upTexture();
                } else {
                    var This = this;
                    value.on('load', function() {
                        This.upTexture(opts);
                        This._ready = true;
                    });
                }
            }
        }
    }
});

/**
 * When the texture is updated, this event will fire to update the scale and frame
 *
 * @private
 */
Sprite.prototype.upTexture = function() {
    this._textureW = opts.texture.width;
    this._textureH = opts.texture.height;
    this.width = opts.width || this._textureW;
    this.height = opts.height || this._textureH;
    this.regX = this.width >> 1;
    this.regY = this.height >> 1;
    this.setBound(null, true);
};

/**
 *
 * Renders the object using the WebGL renderer
 *
 * @param renderer {PIXI.WebGLRenderer}
 * @private
 */
Sprite.prototype.render = function(session) {
    renderer.setObjectRenderer(renderer.plugins.sprite);
    renderer.plugins.sprite.render(this);
};

/**
 * Returns the bounds of the Sprite as a rectangle. The bounds calculation takes the worldTransform into account.
 *
 * @param matrix {PIXI.Matrix} the transformation matrix of the sprite
 * @return {PIXI.Rectangle} the framing rectangle
 */
Sprite.prototype.getBounds = function(matrix) {

};

/**
 * Gets the local bounds of the sprite object.
 *
 */
Sprite.prototype.getLocalBounds = function() {};

/**
 * Tests if a point is inside this sprite
 *
 * @param point {PIXI.Point} the point to test
 * @return {boolean} the result of the test
 */
Sprite.prototype.containsPoint = function(point) {};

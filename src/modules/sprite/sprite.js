
function Sprite(texture)
{
    Container.call(this);

    /**
     * The anchor sets the origin point of the texture.
     * The default is 0,0 this means the texture's origin is the top left
     * Setting the anchor to 0.5,0.5 means the texture's origin is centered
     * Setting the anchor to 1,1 would mean the texture's origin point will be the bottom right corner
     *
     * @member {PIXI.Point}
     */
    this.anchor = new math.Point();

    /**
     * The texture that the sprite is using
     *
     * @member {PIXI.Texture}
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
     * The blend mode to be applied to the sprite. Apply a value of `PIXI.BLEND_MODES.NORMAL` to reset the blend mode.
     *
     * @member {number}
     * @default PIXI.BLEND_MODES.NORMAL
     * @see PIXI.BLEND_MODES
     */
    this.blendMode = JC.BLEND_MODES.NORMAL;

    /**
     * The shader that will be used to render the sprite. Set to null to remove a current shader.
     *
     * @member {PIXI.AbstractFilter|PIXI.Shader}
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
JC.Sprite = Sprite;
Sprite.prototype = Object.create(Container.prototype);
Sprite.prototype.constructor = Sprite;

Object.defineProperties(Sprite.prototype, {
    /**
     * The width of the sprite, setting this will actually modify the scale to achieve the value set
     *
     * @member {number}
     * @memberof PIXI.Sprite#
     */
    width: {
        get: function ()
        {
            return Math.abs(this.scale.x) * this.texture._frame.width;
        },
        set: function (value)
        {
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
        get: function ()
        {
            return  Math.abs(this.scale.y) * this.texture._frame.height;
        },
        set: function (value)
        {
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
        get: function ()
        {
            return  this._texture;
        },
        set: function (value)
        {
            if (this._texture === value)
            {
                return;
            }

            this._texture = value;
            this.cachedTint = 0xFFFFFF;

            if (value)
            {
                // wait for the texture to load
                if (value.baseTexture.hasLoaded)
                {
                    this._onTextureUpdate();
                }
                else
                {
                    value.once('update', this._onTextureUpdate, this);
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
Sprite.prototype.upTexture = function ()
{
    this._textureW = opts.texture.width;
    this._textureH = opts.texture.height;
    this.width = opts.width||this._textureW;
    this.height = opts.height||this._textureH;
    this.regX = this.width>>1;
    this.regY = this.height>>1;
    this.setBound(null,true);
};

/**
*
* Renders the object using the WebGL renderer
*
* @param renderer {PIXI.WebGLRenderer}
* @private
*/
Sprite.prototype._renderWebGL = function (renderer){
    renderer.setObjectRenderer(renderer.plugins.sprite);
    renderer.plugins.sprite.render(this);
};

/**
 * Returns the bounds of the Sprite as a rectangle. The bounds calculation takes the worldTransform into account.
 *
 * @param matrix {PIXI.Matrix} the transformation matrix of the sprite
 * @return {PIXI.Rectangle} the framing rectangle
 */
Sprite.prototype.getBounds = function (matrix){

};

/**
 * Gets the local bounds of the sprite object.
 *
 */
Sprite.prototype.getLocalBounds = function ()
{
};

/**
* Tests if a point is inside this sprite
*
* @param point {PIXI.Point} the point to test
* @return {boolean} the result of the test
*/
Sprite.prototype.containsPoint = function( point )
{
};

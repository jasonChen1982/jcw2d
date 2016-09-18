function Renderer(view, options){
    options = options || {};

    // prepare options
    if (options)
    {
        for (var i in JC.DEFAULT_RENDER_OPTIONS)
        {
            if (typeof options[i] === 'undefined')
            {
                options[i] = JC.DEFAULT_RENDER_OPTIONS[i];
            }
        }
    }
    else
    {
        options = JC.DEFAULT_RENDER_OPTIONS;
    }

    /**
     * The canvas element that everything is drawn to
     *
     * @member {HTMLCanvasElement}
     */
    this.view = typeof view !== 'string' ? view : document.getElementById(view);

    /**
     * The resolution of the renderer
     *
     * @member {number}
     * @default 1
     */
    this.resolution = options.resolution;

    /**
     * Whether the render view is transparent
     *
     * @member {boolean}
     */
    this.transparent = options.transparent;

    /**
     * Whether the render view should be resized automatically
     *
     * @member {boolean}
     */
    this.autoResize = options.autoResize || false;

    /**
     * Tracks the blend modes useful for this renderer.
     *
     * @member {object<string, mixed>}
     */
    this.blendModes = null;

    /**
     * The value of the preserveDrawingBuffer flag affects whether or not the contents of the stencil buffer is retained after rendering.
     *
     * @member {boolean}
     */
    this.preserveDrawingBuffer = options.preserveDrawingBuffer;

    /**
     * This sets if the CanvasRenderer will clear the canvas or not before the new render pass.
     * If the scene is NOT transparent Pixi will use a canvas sized fillRect operation every frame to set the canvas background color.
     * If the scene is transparent Pixi will use clearRect to clear the canvas every frame.
     * Disable this by setting this to false. For example if your game has a canvas filling background image you often don't need this set.
     *
     * @member {boolean}
     * @default
     */
    this.autoClear = options.autoClear;

    /**
     * The background color as a number.
     *
     * @member {number}
     * @private
     */
    this._backgroundColor = 0x000000;

    /**
     * The background color as an [R, G, B] array.
     *
     * @member {number[]}
     * @private
     */
    this._backgroundColorRgb = [0, 0, 0];

    /**
     * The background color as a string.
     *
     * @member {string}
     * @private
     */
    this._backgroundColorString = '#000000';

    this.backgroundColor = options.backgroundColor || this._backgroundColor; // run bg color setter

    /**
     * This temporary display object used as the parent of the currently being rendered item
     *
     * @member {PIXI.DisplayObject}
     * @private
     */
    // this._tempDisplayObjectParent = {worldTransform:new math.Matrix(), worldAlpha:1, children:[]};

    /**
     * The last root object that the renderer tried to render.
     *
     * @member {PIXI.DisplayObject}
     * @private
     */
    // this._lastObjectRendered = this._tempDisplayObjectParent;

    this.handleContextLost = this.handleContextLost.bind(this);
    this.handleContextRestored = this.handleContextRestored.bind(this);

    this.view.addEventListener('webglcontextlost', this.handleContextLost, false);
    this.view.addEventListener('webglcontextrestored', this.handleContextRestored, false);

    /**
     * The options passed in to create a new webgl context.
     *
     * @member {object}
     * @private
     */
    this._contextOptions = {
        alpha: this.transparent,
        antialias: options.antialias,
        premultipliedAlpha: this.transparent && this.transparent !== 'notMultiplied',
        stencil: true,
        preserveDrawingBuffer: options.preserveDrawingBuffer
    };

    /**
     * Counter for the number of draws made each frame
     *
     * @member {number}
     */
    this.drawCount = 0;

    /**
     * Deals with managing the shader programs and their attribs.
     *
     * @member {PIXI.ShaderManager}
     */
    this.shaderManager = new ShaderManager(this);

    /**
     * Manages the masks using the stencil buffer.
     *
     * @member {PIXI.MaskManager}
     */
    this.maskManager = new MaskManager(this);

    /**
     * Manages the stencil buffer.
     *
     * @member {PIXI.StencilManager}
     */
    this.stencilManager = new StencilManager(this);

    /**
     * Manages the filters.
     *
     * @member {PIXI.FilterManager}
     */
    // this.filterManager = new FilterManager(this);


    /**
     * Manages the blendModes
     *
     * @member {PIXI.BlendModeManager}
     */
    this.blendModeManager = new BlendModeManager(this);

    /**
     * Holds the current render target
     *
     * @member {PIXI.RenderTarget}
     */
    // this.currentRenderTarget = null;

    /**
     * The currently active ObjectRenderer.
     *
     * @member {PIXI.ObjectRenderer}
     */
    // this.currentRenderer = new ObjectRenderer(this);

    // this.initPlugins();

    // initialize the context so it is ready for the managers.
    this._createContext();
    this._initContext();

    // map some webGL blend modes..
    this._mapGlModes();

    // track textures in the renderer so we can no longer listen to them on destruction.
    this._managedTextures = [];

    /**
     * An array of render targets
     * @member {PIXI.RenderTarget[]}
     * @private
     */
    // this._renderTargetStack = [];
}

// constructor
JC.Renderer = Renderer;
Renderer.prototype = Object.create(SystemRenderer.prototype);
Renderer.prototype.constructor = Renderer;

Renderer.glContextId = 0;

/**
 * Creates the gl context.
 *
 * @private
 */
Renderer.prototype._createContext = function () {
    var gl = this.view.getContext('webgl', this._contextOptions) || this.view.getContext('experimental-webgl', this._contextOptions);
    this.gl = gl;

    if (!gl)
    {
        // fail, not able to get a context
        throw new Error('This browser does not support webGL. Try using the canvas renderer');
    }

    this.glContextId = Renderer.glContextId++;
    gl.id = this.glContextId;
    gl.renderer = this;
};

/**
 * Creates the WebGL context
 *
 * @private
 */
Renderer.prototype._initContext = function (){
    var gl = this.gl;

    // set up the default pixi settings..
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);

    // this.renderTarget = new RenderTarget(gl, this.width, this.height, null, this.resolution, true);

    // this.setRenderTarget(this.renderTarget);

    this.emit('context', gl);

    // setup the width/height properties and gl viewport
    this.resize(this.width, this.height);

};

/**
 * Renders the object to its webGL view
 *
 * @param object {PIXI.DisplayObject} the object to be rendered
 */
Renderer.prototype.render = function (object){

    this.emit('prerender');

    // no point rendering if our context has been blown up!
    if (this.gl.isContextLost())
    {
        return;
    }

    this.drawCount = 0;

    // this._lastObjectRendered = object;

    var cacheParent = object.parent;
    object.parent = this._tempDisplayObjectParent;

    // update the scene graph
    object.updateTransform();

    object.parent = cacheParent;

    var gl = this.gl;

    // make sure we are bound to the main frame buffer
    // this.setRenderTarget(this.renderTarget);

    if (this.clearBeforeRender)
    {
        if (this.transparent)
        {
            gl.clearColor(0, 0, 0, 0);
        }
        else
        {
            gl.clearColor(this._backgroundColorRgb[0], this._backgroundColorRgb[1], this._backgroundColorRgb[2], 1);
        }

        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    this.renderDisplayObject(object);//, this.renderTargetthis.projection);

    this.emit('postrender');
};

/**
 * Renders a Display Object.
 *
 * @param displayObject {PIXI.DisplayObject} The DisplayObject to render
 * @param renderTarget {PIXI.RenderTarget} The render target to use to render this display object
 *
 */
Renderer.prototype.renderDisplayObject = function (displayObject){//, renderTarget, clearprojection, buffer)
    // TODO is this needed...
    //this.blendModeManager.setBlendMode(JC.BLEND_MODES.NORMAL);
    // this.setRenderTarget(renderTarget);

    // if(clear)
    // {
    //     renderTarget.clear();
    // }

    // start the filter manager
    // this.filterManager.setFilterStack( renderTarget.filterStack );

    // render the scene!
    displayObject.renderWebGL(this);

    // finish the current renderer..
    // this.currentRenderer.flush();
};

/**
 * Changes the current renderer to the one given in parameter
 *
 * @param objectRenderer {PIXI.ObjectRenderer} The object renderer to use.
 */
// Renderer.prototype.setObjectRenderer = function (objectRenderer){
//     if (this.currentRenderer === objectRenderer)
//     {
//         return;
//     }

//     this.currentRenderer.stop();
//     this.currentRenderer = objectRenderer;
//     this.currentRenderer.start();
// };

/**
 * Changes the current render target to the one given in parameter
 *
 * @param renderTarget {PIXI.RenderTarget} the new render target
 */
// Renderer.prototype.setRenderTarget = function (renderTarget){
//     if( this.currentRenderTarget === renderTarget)
//     {
//         return;
//     }
//     // TODO - maybe down the line this should be a push pos thing? Leaving for now though.
//     this.currentRenderTarget = renderTarget;
//     this.currentRenderTarget.activate();
//     this.stencilManager.setMaskStack( renderTarget.stencilMaskStack );
// };


/**
 * Resizes the webGL view to the specified width and height.
 *
 * @param width {number} the new width of the webGL view
 * @param height {number} the new height of the webGL view
 */
Renderer.prototype.resize = function (width, height){
    SystemRenderer.prototype.resize.call(this, width, height);

    this.filterManager.resize(width, height);
    this.renderTarget.resize(width, height);

    if(this.currentRenderTarget === this.renderTarget)
    {
        this.renderTarget.activate();
        this.gl.viewport(0, 0, this.width, this.height);
    }
};

/**
 * Updates and/or Creates a WebGL texture for the renderer's context.
 *
 * @param texture {PIXI.BaseTexture|PIXI.Texture} the texture to update
 */
Renderer.prototype.updateTexture = function (texture){
    texture = texture.baseTexture || texture;

    if (!texture.hasLoaded)
    {
        return;
    }

    var gl = this.gl;

    if (!texture._glTextures[gl.id])
    {
        texture._glTextures[gl.id] = gl.createTexture();
        texture.on('update', this.updateTexture, this);
        texture.on('dispose', this.destroyTexture, this);
        this._managedTextures.push(texture);
    }


    gl.bindTexture(gl.TEXTURE_2D, texture._glTextures[gl.id]);

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture.premultipliedAlpha);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.source);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, texture.scaleMode === JC.SCALE_MODES.LINEAR ? gl.LINEAR : gl.NEAREST);


    if (texture.mipmap && texture.isPowerOfTwo)
    {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texture.scaleMode === JC.SCALE_MODES.LINEAR ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
    else
    {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texture.scaleMode === JC.SCALE_MODES.LINEAR ? gl.LINEAR : gl.NEAREST);
    }

    if (!texture.isPowerOfTwo)
    {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    else
    {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }

    return  texture._glTextures[gl.id];
};

/**
 * Deletes the texture from WebGL
 *
 * @param texture {PIXI.BaseTexture|PIXI.Texture} the texture to destroy
 */
Renderer.prototype.destroyTexture = function (texture, _skipRemove){
    texture = texture.baseTexture || texture;

    if (!texture.hasLoaded)
    {
        return;
    }

    if (texture._glTextures[this.gl.id])
    {
        this.gl.deleteTexture(texture._glTextures[this.gl.id]);
        delete texture._glTextures[this.gl.id];

        if (!_skipRemove)
        {
            var i = this._managedTextures.indexOf(texture);
            if (i !== -1) {
                utils.removeItems(this._managedTextures, i, 1);
            }
        }
    }
};

/**
 * Handles a lost webgl context
 *
 * @private
 */
Renderer.prototype.handleContextLost = function (event){
    event.preventDefault();
};

/**
 * Handles a restored webgl context
 *
 * @private
 */
Renderer.prototype.handleContextRestored = function (){
    this._initContext();

    // empty all the old gl textures as they are useless now
    for (var i = 0; i < this._managedTextures.length; ++i)
    {
        var texture = this._managedTextures[i];
        if (texture._glTextures[this.gl.id])
        {
            delete texture._glTextures[this.gl.id];
        }
    }
};

/**
 * Removes everything from the renderer (event listeners, spritebatch, etc...)
 *
 * @param [removeView=false] {boolean} Removes the Canvas element from the DOM.
 */
Renderer.prototype.destroy = function (removeView){
    this.destroyPlugins();

    // remove listeners
    this.view.removeEventListener('webglcontextlost', this.handleContextLost);
    this.view.removeEventListener('webglcontextrestored', this.handleContextRestored);

    // destroy managed textures
    for (var i = 0; i < this._managedTextures.length; ++i)
    {
        var texture = this._managedTextures[i];
        this.destroyTexture(texture, true);
        texture.off('update', this.updateTexture, this);
        texture.off('dispose', this.destroyTexture, this);
    }

    // call base destroy
    SystemRenderer.prototype.destroy.call(this, removeView);

    this.uid = 0;

    // destroy the managers
    this.shaderManager.destroy();
    this.maskManager.destroy();
    this.stencilManager.destroy();
    this.filterManager.destroy();
    this.blendModeManager.destroy();

    this.shaderManager = null;
    this.maskManager = null;
    this.filterManager = null;
    this.blendModeManager = null;
    this.currentRenderer = null;

    this.handleContextLost = null;
    this.handleContextRestored = null;

    this._contextOptions = null;

    this._managedTextures = null;

    this.drawCount = 0;

    this.gl.useProgram(null);

    this.gl.flush();

    this.gl = null;
};

/**
 * Maps Pixi blend modes to WebGL blend modes. It works only for pre-multiplied textures.
 *
 * @private
 */
Renderer.prototype._mapGlModes = function (){
    var gl = this.gl;

    if (!this.blendModes)
    {
        this.blendModes = {};

        this.blendModes[JC.BLEND_MODES.NORMAL]        = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[JC.BLEND_MODES.ADD]           = [gl.ONE,       gl.DST_ALPHA];
        this.blendModes[JC.BLEND_MODES.MULTIPLY]      = [gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[JC.BLEND_MODES.SCREEN]        = [gl.ONE,       gl.ONE_MINUS_SRC_COLOR];
        this.blendModes[JC.BLEND_MODES.OVERLAY]       = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[JC.BLEND_MODES.DARKEN]        = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[JC.BLEND_MODES.LIGHTEN]       = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[JC.BLEND_MODES.COLOR_DODGE]   = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[JC.BLEND_MODES.COLOR_BURN]    = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[JC.BLEND_MODES.HARD_LIGHT]    = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[JC.BLEND_MODES.SOFT_LIGHT]    = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[JC.BLEND_MODES.DIFFERENCE]    = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[JC.BLEND_MODES.EXCLUSION]     = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[JC.BLEND_MODES.HUE]           = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[JC.BLEND_MODES.SATURATION]    = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[JC.BLEND_MODES.COLOR]         = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[JC.BLEND_MODES.LUMINOSITY]    = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
    }

    if (!this.drawModes)
    {
        this.drawModes = {};

        this.drawModes[JC.DRAW_MODES.POINTS]         = gl.POINTS;
        this.drawModes[JC.DRAW_MODES.LINES]          = gl.LINES;
        this.drawModes[JC.DRAW_MODES.LINE_LOOP]      = gl.LINE_LOOP;
        this.drawModes[JC.DRAW_MODES.LINE_STRIP]     = gl.LINE_STRIP;
        this.drawModes[JC.DRAW_MODES.TRIANGLES]      = gl.TRIANGLES;
        this.drawModes[JC.DRAW_MODES.TRIANGLE_STRIP] = gl.TRIANGLE_STRIP;
        this.drawModes[JC.DRAW_MODES.TRIANGLE_FAN]   = gl.TRIANGLE_FAN;
    }
};

Object.defineProperties(SystemRenderer.prototype, {
    /**
     * The background color to fill if not transparent
     *
     * @member {number}
     * @memberof PIXI.SystemRenderer#
     */
    backgroundColor:
    {
        get: function ()
        {
            return this._backgroundColor;
        },
        set: function (val)
        {
            this._backgroundColor = val;
            this._backgroundColorString = utils.hex2string(val);
            utils.hex2rgb(val, this._backgroundColorRgb);
        }
    }
});

Renderer.prototype.resize = function (width, height) {
    this.width = width * this.resolution;
    this.height = height * this.resolution;

    this.view.width = this.width;
    this.view.height = this.height;

    if (this.autoResize)
    {
        this.view.style.width = this.width / this.resolution + 'px';
        this.view.style.height = this.height / this.resolution + 'px';
    }
};

Renderer.prototype.destroy = function (removeView) {
    if (removeView && this.view.parentNode)
    {
        this.view.parentNode.removeChild(this.view);
    }

    this.type = JC.RENDERER_TYPE.UNKNOWN;

    this.width = 0;
    this.height = 0;

    this.view = null;

    this.resolution = 0;

    this.transparent = false;

    this.autoResize = false;

    this.blendModes = null;

    this.preserveDrawingBuffer = false;
    this.clearBeforeRender = false;

    this.roundPixels = false;

    this._backgroundColor = 0;
    this._backgroundColorRgb = null;
    this._backgroundColorString = null;
};

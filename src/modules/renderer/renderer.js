function Renderer(view, options) {
    options = options || {};

    if (options) {
        for (var i in JC.CONST.DEFAULT_RENDER_OPTIONS) {
            if (typeof options[i] === 'undefined') {
                options[i] = JC.CONST.DEFAULT_RENDER_OPTIONS[i];
            }
        }
    } else {
        options = JC.CONST.DEFAULT_RENDER_OPTIONS;
    }

    this.view = typeof view !== 'string' ? view : document.getElementById(view);

    this.width = this.view.width;
    this.height = this.view.height;

    this.projection = new Float32Array([this.width >> 1, this.width >> 1]);

    this.resolution = options.resolution;

    this.transparent = options.transparent;

    this.autoResize = options.autoResize || false;

    this.blendModes = null;

    this.preserveDrawingBuffer = options.preserveDrawingBuffer;

    this.autoClear = options.autoClear;

    this._backgroundColor = 0x000000;

    this._backgroundColorRgb = [0, 0, 0];

    this._backgroundColorString = '#000000';

    this.backgroundColor = options.backgroundColor || this._backgroundColor;


    this.handleContextLost = this.handleContextLost.bind(this);
    this.handleContextRestored = this.handleContextRestored.bind(this);

    this.view.addEventListener('webglcontextlost', this.handleContextLost, false);
    this.view.addEventListener('webglcontextrestored', this.handleContextRestored, false);

    this._contextOptions = {
        alpha: this.transparent,
        antialias: options.antialias,
        premultipliedAlpha: this.transparent && this.transparent !== 'notMultiplied',
        stencil: true,
        preserveDrawingBuffer: options.preserveDrawingBuffer
    };

    this.drawCount = 0;

    this.shaderManager = new ShaderManager(this);

    this.blendModeManager = new BlendModeManager(this);

    this._createContext();
    this._initContext();

    this._mapGlModes();

}

// constructor
JC.Renderer = Renderer;
Renderer.prototype = Object.create(SystemRenderer.prototype);
Renderer.prototype.constructor = Renderer;

Renderer.glContextId = 0;

Renderer.prototype._createContext = function() {
    var gl = this.view.getContext('webgl', this._contextOptions) || this.view.getContext('experimental-webgl', this._contextOptions);
    this.gl = gl;

    if (!gl) {
        throw new Error('This browser does not support webGL. Try using the canvas renderer');
    }

    this.glContextId = Renderer.glContextId++;
    gl.id = this.glContextId;
    gl.renderer = this;
};

Renderer.prototype._initContext = function() {
    var gl = this.gl;

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);

    this.emit('context', gl);

    this.resize(this.width, this.height);

};

Renderer.prototype.render = function(object) {

    this.emit('prerender');

    if (this.gl.isContextLost()) {
        return;
    }

    this.drawCount = 0;

    var cacheParent = object.parent;
    object.parent = this._tempDisplayObjectParent;

    object.updateTransform();

    object.parent = cacheParent;

    var gl = this.gl;


    if (this.clearBeforeRender) {
        if (this.transparent) {
            gl.clearColor(0, 0, 0, 0);
        } else {
            gl.clearColor(this._backgroundColorRgb[0], this._backgroundColorRgb[1], this._backgroundColorRgb[2], 1);
        }

        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    this.renderDisplayObject(object);

    this.emit('postrender');
};

Renderer.prototype.renderDisplayObject = function(displayObject) {
    displayObject.renderWebGL(this);
};

Renderer.prototype.handleContextLost = function(event) {
    event.preventDefault();
};

Renderer.prototype.handleContextRestored = function() {
    this._initContext();
};

Renderer.prototype._mapGlModes = function() {
    var gl = this.gl;

    if (!this.blendModes) {
        this.blendModes = {};

        this.blendModes[JC.CONST.BLEND_MODES.NORMAL] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[JC.CONST.BLEND_MODES.ADD] = [gl.ONE, gl.DST_ALPHA];
        this.blendModes[JC.CONST.BLEND_MODES.MULTIPLY] = [gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[JC.CONST.BLEND_MODES.SCREEN] = [gl.ONE, gl.ONE_MINUS_SRC_COLOR];
    }

    if (!this.drawModes) {
        this.drawModes = {};

        this.drawModes[JC.CONST.DRAW_MODES.POINTS] = gl.POINTS;
        this.drawModes[JC.CONST.DRAW_MODES.LINES] = gl.LINES;
        this.drawModes[JC.CONST.DRAW_MODES.LINE_LOOP] = gl.LINE_LOOP;
        this.drawModes[JC.CONST.DRAW_MODES.LINE_STRIP] = gl.LINE_STRIP;
        this.drawModes[JC.CONST.DRAW_MODES.TRIANGLES] = gl.TRIANGLES;
        this.drawModes[JC.CONST.DRAW_MODES.TRIANGLE_STRIP] = gl.TRIANGLE_STRIP;
        this.drawModes[JC.CONST.DRAW_MODES.TRIANGLE_FAN] = gl.TRIANGLE_FAN;
    }
};

Object.defineProperties(Renderer.prototype, {
    backgroundColor: {
        get: function() {
            return this._backgroundColor;
        },
        set: function(val) {
            this._backgroundColor = val;
            this._backgroundColorString = utils.hex2string(val);
            utils.hex2rgb(val, this._backgroundColorRgb);
        }
    }
});

Renderer.prototype.resize = function(width, height) {
    this.width = width * this.resolution;
    this.height = height * this.resolution;

    this.view.width = this.width;
    this.view.height = this.height;

    this.projection = new Float32Array([this.width >> 1, this.width >> 1]);

    if (this.autoResize) {
        this.view.style.width = this.width / this.resolution + 'px';
        this.view.style.height = this.height / this.resolution + 'px';
    }
};

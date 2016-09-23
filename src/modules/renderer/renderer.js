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

    this.projection = new Float32Array([this.width >> 1, this.height >> 1]);

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

    // this.drawCount = 0;
    this.event = new JC.Eventer();

    this._createContext();
    this._initContext();

    this._mapGlModes();


    this.shaderManager = new JC.ShaderManager(this);

    this.blendModeManager = new JC.BlendModeManager(this);

    this.renderSession = {};
    this.renderSession.gl = this.gl;
    this.renderSession.drawCount = 0;
    this.renderSession.shaderManager = this.shaderManager;
    this.renderSession.blendModeManager = this.blendModeManager;
    this.renderSession.renderer = this;
    this.renderSession.resolution = this.resolution;

    this._tempDisplayObjectParent = {worldTransform: JC.IDENTITY, worldAlpha:1, children:[]};

    this.pt = -1;
    this.timeScale = 1;
}

// constructor
JC.Renderer = Renderer;
Renderer.prototype.constructor = JC.Renderer;

Renderer.prototype._createContext = function() {
    var gl = this.view.getContext('webgl', this._contextOptions) || this.view.getContext('experimental-webgl', this._contextOptions);
    this.gl = gl;

    if (!gl) {
        throw new Error('This browser does not support webGL. Try using the canvas renderer');
    }

    gl.renderer = this;
};

Renderer.prototype._initContext = function() {
    var gl = this.gl;

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);

    this.event.emit({type: 'context'}, gl);

    this.resize(this.width, this.height);

};

Renderer.prototype.render = function(object) {
    if(this.pt<=0||Date.now()-this.pt>200)this.pt = Date.now();
    var snippet = Date.now()-this.pt;
    this.pt += snippet;

    this.event.emit({type: 'prerender'});

    if (this.gl.isContextLost()) {
        return;
    }

    // this.drawCount = 0;
    this.renderSession.projection = this.projection;
    var cacheParent = object.parent;
    object.parent = this._tempDisplayObjectParent;
    object.updateTransform(this.timeScale*snippet);
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

    this.event.emit({type: 'postrender'});
};

Renderer.prototype.renderDisplayObject = function(displayObject) {
    displayObject.render(this.renderSession);
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
            this._backgroundColorString = JC.UTILS.hex2string(val);
            JC.UTILS.hex2rgb(val, this._backgroundColorRgb);
        }
    }
});

Renderer.prototype.resize = function(width, height) {
    this.width = width * this.resolution;
    this.height = height * this.resolution;

    this.view.width = this.width;
    this.view.height = this.height;
    this.gl.viewport(0, 0, this.width, this.height);

    this.projection = new Float32Array([this.width >> 1, this.height >> 1]);

    if (this.autoResize) {
        this.view.style.width = this.width / this.resolution + 'px';
        this.view.style.height = this.height / this.resolution + 'px';
    }
};

(function(window) {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
            window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }

    window.requestAnimFrame = window.requestAnimationFrame;
})(this);

(function() {

    var root = this;

    var PIXI = PIXI || {};

    PIXI.VERSION = "v0.0.5";

    PIXI.blendModes = {
        NORMAL: 0,
        ADD: 1,
        MULTIPLY: 2,
        SCREEN: 3
    };

    PIXI.scaleModes = {
        DEFAULT: 0,
        LINEAR: 0,
        NEAREST: 1
    };

    PIXI._UID = 0;

    if (typeof(Float32Array) != 'undefined') {
        PIXI.Float32Array = Float32Array;
        PIXI.Uint16Array = Uint16Array;

        PIXI.Uint32Array = Uint32Array;
        PIXI.ArrayBuffer = ArrayBuffer;
    } else {
        console.log('%c not support', 'color: #fff;background: #f00;');
    }

    PIXI.PI_2 = Math.PI * 2;

    PIXI.RTD = 180 / Math.PI;

    PIXI.DTR = Math.PI / 180;

    PIXI.dontSpeek = false;

    PIXI.defaultRenderOptions = {
        view: null,
        transparent: false,
        antialias: false,
        preserveDrawingBuffer: false,
        resolution: 1,
        clearBeforeRender: true,
        autoResize: false
    };

    PIXI.sayHello = function(type) {
        if (PIXI.dontSpeek) return;

        if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
            var args = [
                '%c %c %c Pixi.js ' + PIXI.VERSION + ' - ' + type + '  %c ' + ' %c ' + ' http://www.pixijs.com/  %c %c ♥%c♥%c♥ ',
                'background: #ff66a5',
                'background: #ff66a5',
                'color: #ff66a5; background: #030307;',
                'background: #ff66a5',
                'background: #ffc3dc',
                'background: #ff66a5',
                'color: #ff2424; background: #fff',
                'color: #ff2424; background: #fff',
                'color: #ff2424; background: #fff'
            ];

            console.log.apply(console, args);
        }

        PIXI.dontSpeek = true;
    };


    PIXI.Point = function(x, y) {
        this.x = x || 0;

        this.y = y || 0;
    };
    PIXI.Point.prototype.clone = function() {
        return new PIXI.Point(this.x, this.y);
    };
    PIXI.Point.prototype.set = function(x, y) {
        this.x = x || 0;
        this.y = y || ((y !== 0) ? this.x : 0);
    };
    PIXI.Point.prototype.constructor = PIXI.Point;


    /**
     * The Matrix class is now an object, which makes it a lot faster, 
     * here is a representation of it : 
     * | a | b | tx|
     * | c | d | ty|
     * | 0 | 0 | 1 |
     *
     * @class Matrix
     * @constructor
     */
    PIXI.Matrix = function() {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.tx = 0;
        this.ty = 0;
    };
    PIXI.Matrix.prototype.fromArray = function(array) {
        this.a = array[0];
        this.b = array[1];
        this.c = array[3];
        this.d = array[4];
        this.tx = array[2];
        this.ty = array[5];
    };
    PIXI.Matrix.prototype.toArray = function(transpose) {
        if (!this.array) this.array = new PIXI.Float32Array(9);
        var array = this.array;

        if (transpose) {
            array[0] = this.a;
            array[1] = this.b;
            array[2] = 0;
            array[3] = this.c;
            array[4] = this.d;
            array[5] = 0;
            array[6] = this.tx;
            array[7] = this.ty;
            array[8] = 1;
        } else {
            array[0] = this.a;
            array[1] = this.c;
            array[2] = this.tx;
            array[3] = this.b;
            array[4] = this.d;
            array[5] = this.ty;
            array[6] = 0;
            array[7] = 0;
            array[8] = 1;
        }

        return array;
    };
    PIXI.Matrix.prototype.apply = function(pos, newPos) {
        newPos = newPos || new PIXI.Point();

        newPos.x = this.a * pos.x + this.c * pos.y + this.tx;
        newPos.y = this.b * pos.x + this.d * pos.y + this.ty;

        return newPos;
    };
    PIXI.Matrix.prototype.applyInverse = function(pos, newPos) {
        newPos = newPos || new PIXI.Point();

        var id = 1 / (this.a * this.d + this.c * -this.b);

        newPos.x = this.d * id * pos.x + -this.c * id * pos.y + (this.ty * this.c - this.tx * this.d) * id;
        newPos.y = this.a * id * pos.y + -this.b * id * pos.x + (-this.ty * this.a + this.tx * this.b) * id;

        return newPos;
    };
    PIXI.Matrix.prototype.translate = function(x, y) {
        this.tx += x;
        this.ty += y;

        return this;
    };
    PIXI.Matrix.prototype.scale = function(x, y) {
        this.a *= x;
        this.d *= y;
        this.c *= x;
        this.b *= y;
        this.tx *= x;
        this.ty *= y;

        return this;
    };
    PIXI.Matrix.prototype.rotate = function(angle) {
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);

        var a1 = this.a;
        var c1 = this.c;
        var tx1 = this.tx;

        this.a = a1 * cos - this.b * sin;
        this.b = a1 * sin + this.b * cos;
        this.c = c1 * cos - this.d * sin;
        this.d = c1 * sin + this.d * cos;
        this.tx = tx1 * cos - this.ty * sin;
        this.ty = tx1 * sin + this.ty * cos;

        return this;
    };
    PIXI.Matrix.prototype.append = function(matrix) {
        var a1 = this.a;
        var b1 = this.b;
        var c1 = this.c;
        var d1 = this.d;

        this.a = matrix.a * a1 + matrix.b * c1;
        this.b = matrix.a * b1 + matrix.b * d1;
        this.c = matrix.c * a1 + matrix.d * c1;
        this.d = matrix.c * b1 + matrix.d * d1;

        this.tx = matrix.tx * a1 + matrix.ty * c1 + this.tx;
        this.ty = matrix.tx * b1 + matrix.ty * d1 + this.ty;

        return this;
    };
    PIXI.Matrix.prototype.identity = function() {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.tx = 0;
        this.ty = 0;

        return this;
    };

    PIXI.identityMatrix = new PIXI.Matrix();



    PIXI.DisplayObject = function() {
        this.position = new PIXI.Point();
        this.scale = new PIXI.Point(1, 1);
        this.pivot = new PIXI.Point();
        this.rotation = 0;
        this.alpha = 1;
        this.visible = true;
        // this.hitArea = null;
        this.renderable = false;
        this.parent = null;
        // this.stage = null;
        this.worldAlpha = 1;
        this.worldTransform = new PIXI.Matrix();
        this._sr = 0;
        this._cr = 1;

        this._mask = null;

        this._cacheAsBitmap = false;

        this._cacheIsDirty = false;
    };

    PIXI.DisplayObject.prototype.constructor = PIXI.DisplayObject;

    // Object.defineProperty(PIXI.DisplayObject.prototype, 'worldVisible', {
    //     get: function() {
    //         var item = this;

    //         do {
    //             if (!item.visible) return false;
    //             item = item.parent;
    //         }
    //         while (item);

    //         return true;
    //     }
    // });

    Object.defineProperty(PIXI.DisplayObject.prototype, 'mask', {
        get: function() {
            return this._mask;
        },
        set: function(value) {

            if (this._mask) this._mask.isMask = false;
            this._mask = value;
            if (this._mask) this._mask.isMask = true;
        }
    });

    Object.defineProperty(PIXI.DisplayObject.prototype, 'cacheAsBitmap', {

        get: function() {
            return this._cacheAsBitmap;
        },

        set: function(value) {

            if (this._cacheAsBitmap === value) return;

            if (value) {
                this._generateCachedSprite();
            } else {
                this._destroyCachedSprite();
            }

            this._cacheAsBitmap = value;
        }
    });

    PIXI.DisplayObject.prototype.updateTransform = function() {
        var pt = this.parent.worldTransform;
        var wt = this.worldTransform;

        var a, b, c, d, tx, ty;

        if (this.rotation % PIXI.PI_2) {
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

            if (this.pivot.x || this.pivot.y) {
                tx -= this.pivot.x * a + this.pivot.y * c;
                ty -= this.pivot.x * b + this.pivot.y * d;
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

            tx = this.position.x - this.pivot.x * a;
            ty = this.position.y - this.pivot.y * d;

            wt.a = a * pt.a;
            wt.b = a * pt.b;
            wt.c = d * pt.c;
            wt.d = d * pt.d;
            wt.tx = tx * pt.a + ty * pt.c + pt.tx;
            wt.ty = tx * pt.b + ty * pt.d + pt.ty;
        }

        this.worldAlpha = this.alpha * this.parent.worldAlpha;
    };

    PIXI.DisplayObject.prototype.displayObjectUpdateTransform = PIXI.DisplayObject.prototype.updateTransform;

    PIXI.DisplayObject.prototype.getBounds = function(matrix) {
        matrix = matrix; //just to get passed js hinting (and preserve inheritance)
        return PIXI.EmptyRectangle;
    };

    PIXI.DisplayObject.prototype.getLocalBounds = function() {
        return this.getBounds(PIXI.identityMatrix);
    };

    PIXI.DisplayObject.prototype.generateTexture = function(resolution, scaleMode, renderer) {
        var bounds = this.getLocalBounds();

        var renderTexture = new PIXI.RenderTexture(bounds.width | 0, bounds.height | 0, renderer, scaleMode, resolution);

        PIXI.DisplayObject._tempMatrix.tx = -bounds.x;
        PIXI.DisplayObject._tempMatrix.ty = -bounds.y;

        renderTexture.render(this, PIXI.DisplayObject._tempMatrix);

        return renderTexture;
    };

    PIXI.DisplayObject.prototype.updateCache = function() {
        this._generateCachedSprite();
    };

    PIXI.DisplayObject.prototype._renderCachedSprite = function(renderSession) {
        this._cachedSprite.worldAlpha = this.worldAlpha;

        if (renderSession.gl) PIXI.Sprite.prototype.render.call(this._cachedSprite, renderSession);
    };

    PIXI.DisplayObject.prototype._generateCachedSprite = function() {
        this._cacheAsBitmap = false;
        var bounds = this.getLocalBounds();

        if (!this._cachedSprite) {
            var renderTexture = new PIXI.RenderTexture(bounds.width | 0, bounds.height | 0);
            this._cachedSprite = new PIXI.Sprite(renderTexture);
            this._cachedSprite.worldTransform = this.worldTransform;
        } else {
            this._cachedSprite.texture.resize(bounds.width | 0, bounds.height | 0);
        }

        this._cacheAsBitmap = true;
    };

    PIXI.DisplayObject.prototype._destroyCachedSprite = function() {
        if (!this._cachedSprite) return;

        this._cachedSprite.texture.destroy(true);

        this._cachedSprite = null;
    };

    PIXI.DisplayObject.prototype.render = function(renderSession) {
        // OVERWRITE;
        // this line is just here to pass jshinting :)
        renderSession = renderSession;
    };

    PIXI.DisplayObject._tempMatrix = new PIXI.Matrix();

    Object.defineProperty(PIXI.DisplayObject.prototype, 'x', {
        get: function() {
            return this.position.x;
        },
        set: function(value) {
            this.position.x = value;
        }
    });

    Object.defineProperty(PIXI.DisplayObject.prototype, 'y', {
        get: function() {
            return this.position.y;
        },
        set: function(value) {
            this.position.y = value;
        }
    });



    PIXI.DisplayObjectContainer = function() {
        PIXI.DisplayObject.call(this);

        this.children = [];
    };

    PIXI.DisplayObjectContainer.prototype = Object.create(PIXI.DisplayObject.prototype);
    PIXI.DisplayObjectContainer.prototype.constructor = PIXI.DisplayObjectContainer;

    Object.defineProperty(PIXI.DisplayObjectContainer.prototype, 'width', {
        get: function() {
            return this.scale.x * this.getLocalBounds().width;
        },
        set: function(value) {

            var width = this.getLocalBounds().width;

            if (width !== 0) {
                this.scale.x = value / width;
            } else {
                this.scale.x = 1;
            }

            this._width = value;
        }
    });

    Object.defineProperty(PIXI.DisplayObjectContainer.prototype, 'height', {
        get: function() {
            return this.scale.y * this.getLocalBounds().height;
        },
        set: function(value) {

            var height = this.getLocalBounds().height;

            if (height !== 0) {
                this.scale.y = value / height;
            } else {
                this.scale.y = 1;
            }

            this._height = value;
        }
    });

    PIXI.DisplayObjectContainer.prototype.addChild = function(child) {
        return this.addChildAt(child, this.children.length);
    };

    PIXI.DisplayObjectContainer.prototype.addChildAt = function(child, index) {
        if (index >= 0 && index <= this.children.length) {
            if (child.parent) {
                child.parent.removeChild(child);
            }

            child.parent = this;

            this.children.splice(index, 0, child);

            if (this.stage) child.setStageReference(this.stage);

            return child;
        } else {
            throw new Error(child + 'addChildAt: The index ' + index + ' supplied is out of bounds ' + this.children.length);
        }
    };

    PIXI.DisplayObjectContainer.prototype.swapChildren = function(child, child2) {
        if (child === child2) {
            return;
        }

        var index1 = this.getChildIndex(child);
        var index2 = this.getChildIndex(child2);

        if (index1 < 0 || index2 < 0) {
            throw new Error('swapChildren: Both the supplied DisplayObjects must be a child of the caller.');
        }

        this.children[index1] = child2;
        this.children[index2] = child;

    };

    PIXI.DisplayObjectContainer.prototype.getChildIndex = function(child) {
        var index = this.children.indexOf(child);
        if (index === -1) {
            throw new Error('The supplied DisplayObject must be a child of the caller');
        }
        return index;
    };

    PIXI.DisplayObjectContainer.prototype.setChildIndex = function(child, index) {
        if (index < 0 || index >= this.children.length) {
            throw new Error('The supplied index is out of bounds');
        }
        var currentIndex = this.getChildIndex(child);
        this.children.splice(currentIndex, 1); //remove from old position
        this.children.splice(index, 0, child); //add at new position
    };

    PIXI.DisplayObjectContainer.prototype.getChildAt = function(index) {
        if (index < 0 || index >= this.children.length) {
            throw new Error('getChildAt: Supplied index ' + index + ' does not exist in the child list, or the supplied DisplayObject must be a child of the caller');
        }
        return this.children[index];

    };

    PIXI.DisplayObjectContainer.prototype.removeChild = function(child) {
        var index = this.children.indexOf(child);
        if (index === -1) return;

        return this.removeChildAt(index);
    };

    PIXI.DisplayObjectContainer.prototype.removeChildAt = function(index) {
        var child = this.getChildAt(index);
        if (this.stage)
            child.removeStageReference();

        child.parent = undefined;
        this.children.splice(index, 1);
        return child;
    };

    PIXI.DisplayObjectContainer.prototype.removeChildren = function(beginIndex, endIndex) {
        var begin = beginIndex || 0;
        var end = typeof endIndex === 'number' ? endIndex : this.children.length;
        var range = end - begin;

        if (range > 0 && range <= end) {
            var removed = this.children.splice(begin, range);
            for (var i = 0; i < removed.length; i++) {
                var child = removed[i];
                if (this.stage)
                    child.removeStageReference();
                child.parent = undefined;
            }
            return removed;
        } else if (range === 0 && this.children.length === 0) {
            return [];
        } else {
            throw new Error('removeChildren: Range Error, numeric values are outside the acceptable range');
        }
    };

    PIXI.DisplayObjectContainer.prototype.updateTransform = function() {
        if (!this.visible) return;

        this.displayObjectUpdateTransform();

        for (var i = 0, j = this.children.length; i < j; i++) {
            this.children[i].updateTransform();
        }
    };

    PIXI.DisplayObjectContainer.prototype.displayObjectContainerUpdateTransform = PIXI.DisplayObjectContainer.prototype.updateTransform;

    PIXI.DisplayObjectContainer.prototype.render = function(renderSession) {
        if (!this.visible || this.alpha <= 0) return;

        if (this._cacheAsBitmap) {
            this._renderCachedSprite(renderSession);
            return;
        }

        var i, j;

        if (this._mask) {

            if (this._mask) {
                renderSession.maskManager.pushMask(this.mask, renderSession);
            }

            // simple render children!
            for (i = 0, j = this.children.length; i < j; i++) {
                this.children[i].render(renderSession);
            }

            if (this._mask) renderSession.maskManager.popMask(this._mask, renderSession);

        } else {
            // simple render children!
            for (i = 0, j = this.children.length; i < j; i++) {
                this.children[i].render(renderSession);
            }
        }
    };




    PIXI.Sprite = function(texture) {
        PIXI.DisplayObjectContainer.call(this);

        this.anchor = new PIXI.Point();

        this.texture = texture || PIXI.Texture.emptyTexture;

        this._width = 0;

        this._height = 0;

        this.tint = 0xFFFFFF;

        this.blendMode = PIXI.blendModes.NORMAL;

        this.shader = null;

        if (this.texture.baseTexture.hasLoaded) {
            this.onTextureUpdate();
        } else {
            this.texture.on('update', this.onTextureUpdate.bind(this));
        }

        this.renderable = true;

    };

    PIXI.Sprite.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
    PIXI.Sprite.prototype.constructor = PIXI.Sprite;

    Object.defineProperty(PIXI.Sprite.prototype, 'width', {
        get: function() {
            return this.scale.x * this.texture.frame.width;
        },
        set: function(value) {
            this.scale.x = value / this.texture.frame.width;
            this._width = value;
        }
    });

    Object.defineProperty(PIXI.Sprite.prototype, 'height', {
        get: function() {
            return this.scale.y * this.texture.frame.height;
        },
        set: function(value) {
            this.scale.y = value / this.texture.frame.height;
            this._height = value;
        }
    });

    PIXI.Sprite.prototype.setTexture = function(texture) {
        this.texture = texture;
        this.cachedTint = 0xFFFFFF;
    };

    PIXI.Sprite.prototype.onTextureUpdate = function() {
        if (this._width) this.scale.x = this._width / this.texture.frame.width;
        if (this._height) this.scale.y = this._height / this.texture.frame.height;
    };

    PIXI.Sprite.prototype.render = function(renderSession) {
        if (!this.visible || this.alpha <= 0) return;

        var i, j;

        // do a quick check to see if this element has a mask or a filter.
        if (this._mask) {

            if (this._mask) {
                renderSession.maskManager.pushMask(this.mask, renderSession);
            }

            // add this sprite to the batch
            renderSession.spriteBatch.render(this);

            // now loop through the children and make sure they get rendered
            for (i = 0, j = this.children.length; i < j; i++) {
                this.children[i].render(renderSession);
            }

            // time to stop the sprite batch as either a mask element or a filter draw will happen next

            if (this._mask) renderSession.maskManager.popMask(this._mask, renderSession);
        } else {
            renderSession.spriteBatch.render(this);

            // simple render children!
            for (i = 0, j = this.children.length; i < j; i++) {
                this.children[i].render(renderSession);
            }

        }
    };

    PIXI.Sprite.fromFrame = function(frameId) {
        var texture = PIXI.TextureCache[frameId];
        if (!texture) throw new Error('The frameId "' + frameId + '" does not exist in the texture cache' + this);
        return new PIXI.Sprite(texture);
    };

    PIXI.Sprite.fromImage = function(imageId, crossorigin, scaleMode) {
        var texture = PIXI.Texture.fromImage(imageId, crossorigin, scaleMode);
        return new PIXI.Sprite(texture);
    };




    PIXI.Stage = function(backgroundColor) {
        PIXI.DisplayObjectContainer.call(this);

        this.worldTransform = new PIXI.Matrix();

        this.interactive = true;

        this.dirty = true;

        this.stage = this;

        this.setBackgroundColor(backgroundColor);
    };

    PIXI.Stage.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
    PIXI.Stage.prototype.constructor = PIXI.Stage;

    PIXI.Stage.prototype.updateTransform = function() {
        this.worldAlpha = 1;

        for (var i = 0, j = this.children.length; i < j; i++) {
            this.children[i].updateTransform();
        }
    };

    PIXI.Stage.prototype.setBackgroundColor = function(bgc) {
        if (typeof bgc === 'number') return;
        this.backgroundColor = PIXI.hex2rgb(bgc);
    };



    PIXI.hex2rgb = function(hex) {
        return [(hex >> 16 & 0xFF) / 255, (hex >> 8 & 0xFF) / 255, (hex & 0xFF) / 255];
    };

    PIXI.rgb2hex = function(rgb) {
        return ((rgb[0] * 255 << 16) + (rgb[1] * 255 << 8) + rgb[2] * 255);
    };

    /**
     * A polyfill for Function.prototype.bind
     *
     * @method bind
     */
    if (typeof Function.prototype.bind !== 'function') {
        Function.prototype.bind = (function() {
            return function(thisArg) {
                var target = this,
                    i = arguments.length - 1,
                    boundArgs = [];
                if (i > 0) {
                    boundArgs.length = i;
                    while (i--) boundArgs[i] = arguments[i + 1];
                }

                if (typeof target !== 'function') throw new TypeError();

                function bound() {
                    var i = arguments.length,
                        args = new Array(i);
                    while (i--) args[i] = arguments[i];
                    args = boundArgs.concat(args);
                    return target.apply(this instanceof bound ? this : thisArg, args);
                }

                bound.prototype = (function F(proto) {
                    if (proto) F.prototype = proto;
                    if (!(this instanceof F)) return new F();
                })(target.prototype);

                return bound;
            };
        })();
    }

    PIXI.getNextPowerOfTwo = function(number) {
        if (number > 0 && (number & (number - 1)) === 0) // see: http://goo.gl/D9kPj
            return number;
        else {
            var result = 1;
            while (result < number) result <<= 1;
            return result;
        }
    };

    PIXI.isPowerOfTwo = function(width, height) {
        return (width > 0 && (width & (width - 1)) === 0 && height > 0 && (height & (height - 1)) === 0);

    };



    PIXI.CompileVertexShader = function(gl, shaderSrc) {
        return PIXI._CompileShader(gl, shaderSrc, gl.VERTEX_SHADER);
    };

    PIXI.CompileFragmentShader = function(gl, shaderSrc) {
        return PIXI._CompileShader(gl, shaderSrc, gl.FRAGMENT_SHADER);
    };

    PIXI._CompileShader = function(gl, shaderSrc, shaderType) {
        var src = shaderSrc.join("\n");
        var shader = gl.createShader(shaderType);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            window.console.log(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    };

    PIXI.compileProgram = function(gl, vertexSrc, fragmentSrc) {
        var fragmentShader = PIXI.CompileFragmentShader(gl, fragmentSrc);
        var vertexShader = PIXI.CompileVertexShader(gl, vertexSrc);

        var shaderProgram = gl.createProgram();

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            window.console.log("Could not initialise shaders");
        }

        return shaderProgram;
    };



    PIXI.SpriteShader = function(gl) {
        this._UID = PIXI._UID++;

        this.gl = gl;

        this.program = null;

        this.fragmentSrc = [
            'precision lowp float;',
            'varying vec2 vTextureCoord;',
            'varying float vColor;',
            'uniform sampler2D uSampler;',
            'void main(void) {',
            '   gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor ;',
            '}'
        ];

        this.vertexSrc = [
            'attribute vec2 aVertexPosition;',
            'attribute vec2 aPositionCoord;',
            'attribute vec2 aScale;',
            'attribute float aRotation;',
            'attribute vec2 aTextureCoord;',
            'attribute float aColor;',

            'uniform vec2 projectionVector;',
            'uniform vec2 offsetVector;',
            'uniform mat3 uMatrix;',

            'varying vec2 vTextureCoord;',
            'varying float vColor;',

            'const vec2 center = vec2(-1.0, 1.0);',

            'void main(void) {',
            '   vec2 v;',
            '   vec2 sv = aVertexPosition * aScale;',
            '   v.x = (sv.x) * cos(aRotation) - (sv.y) * sin(aRotation);',
            '   v.y = (sv.x) * sin(aRotation) + (sv.y) * cos(aRotation);',
            '   v = ( uMatrix * vec3(v + aPositionCoord , 1.0) ).xy ;',
            '   gl_Position = vec4( ( v / projectionVector) + center , 0.0, 1.0);',
            '   vTextureCoord = aTextureCoord;',
            //  '   vec3 color = mod(vec3(aColor.y/65536.0, aColor.y/256.0, aColor.y), 256.0) / 256.0;',
            '   vColor = aColor;',
            '}'
        ];

        this.textureCount = 0;

        this.init();
    };

    PIXI.SpriteShader.prototype.constructor = PIXI.SpriteShader;

    PIXI.SpriteShader.prototype.init = function() {
        var gl = this.gl;

        var program = PIXI.compileProgram(gl, this.vertexSrc, this.fragmentSrc);

        gl.useProgram(program);

        this.uSampler = gl.getUniformLocation(program, 'uSampler');

        this.projectionVector = gl.getUniformLocation(program, 'projectionVector');
        this.offsetVector = gl.getUniformLocation(program, 'offsetVector');
        this.dimensions = gl.getUniformLocation(program, 'dimensions');
        this.uMatrix = gl.getUniformLocation(program, 'uMatrix');

        this.aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
        this.aPositionCoord = gl.getAttribLocation(program, 'aPositionCoord');

        this.aScale = gl.getAttribLocation(program, 'aScale');
        this.aRotation = gl.getAttribLocation(program, 'aRotation');

        this.aTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');
        this.colorAttribute = gl.getAttribLocation(program, 'aColor');



        if (this.colorAttribute === -1) {
            this.colorAttribute = 2;
        }

        this.attributes = [this.aVertexPosition, this.aPositionCoord, this.aScale, this.aRotation, this.aTextureCoord, this.colorAttribute];

        // End worst hack eva //

        this.program = program;
    };

    PIXI.SpriteShader.prototype.destroy = function() {
        this.gl.deleteProgram(this.program);
        this.uniforms = null;
        this.gl = null;

        this.attributes = null;
    };



    PIXI.WebGLRenderer = function(width, height, options) {
        if (options) {
            for (var i in PIXI.defaultRenderOptions) {
                if (typeof options[i] === 'undefined') options[i] = PIXI.defaultRenderOptions[i];
            }
        } else {
            options = PIXI.defaultRenderOptions;
        }

        // PIXI.sayHello('webGL');

        this.resolution = options.resolution || window.devicePixelRatio;

        this.transparent = options.transparent;

        this.autoResize = options.autoResize || false;

        this.clearBeforeRender = options.clearBeforeRender || true;

        this.width = width || 800;

        this.height = height || 600;

        this.view = options.view || document.createElement('canvas');

        this.contextLostBound = this.handleContextLost.bind(this);

        this.contextRestoredBound = this.handleContextRestored.bind(this);

        this.view.addEventListener('webglcontextlost', this.contextLostBound, false);
        this.view.addEventListener('webglcontextrestored', this.contextRestoredBound, false);

        this._contextOptions = {
            alpha: this.transparent,
            antialias: options.antialias, // SPEED UP??
            premultipliedAlpha: this.transparent && this.transparent !== 'notMultiplied',
            stencil: true,
            preserveDrawingBuffer: options.preserveDrawingBuffer
        };

        this.projection = new PIXI.Point();

        this.offset = new PIXI.Point(0, 0);

        this.shaderManager = new PIXI.WebGLShaderManager();

        this.maskManager = new PIXI.WebGLMaskManager();

        // this.stencilManager = new PIXI.WebGLStencilManager();

        this.blendModeManager = new PIXI.WebGLBlendModeManager();

        this.renderSession = {};
        this.renderSession.gl = this.gl;
        this.renderSession.shaderManager = this.shaderManager;
        this.renderSession.maskManager = this.maskManager;
        this.renderSession.blendModeManager = this.blendModeManager;
        // this.renderSession.stencilManager = this.stencilManager;
        this.renderSession.renderer = this;
        this.renderSession.resolution = this.resolution;

        // time init the context..
        this.initContext();

        // map some webGL blend modes..
        this.mapBlendModes();
    };

    // constructor
    PIXI.WebGLRenderer.prototype.constructor = PIXI.WebGLRenderer;

    /**
     * @method initContext
     */
    PIXI.WebGLRenderer.prototype.initContext = function() {
        var gl = this.view.getContext('webgl', this._contextOptions) || this.view.getContext('experimental-webgl', this._contextOptions);
        this.gl = gl;

        if (!gl) {
            // fail, not able to get a context
            throw new Error('This browser does not support webGL. Try using the canvas renderer');
        }

        // set up the default pixi settings..
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.enable(gl.BLEND);

        // need to set the context for all the managers...
        this.shaderManager.setContext(gl);
        this.maskManager.setContext(gl);
        this.blendModeManager.setContext(gl);

        this.renderSession.gl = this.gl;

        // now resize and we are good to go!
        this.resize(this.width, this.height);

    };

    PIXI.WebGLRenderer.prototype.render = function(stage) {
        // no point rendering if our context has been blown up!
        if (this.contextLost) return;

        // update the scene graph
        stage.updateTransform();

        var gl = this.gl;

        // make sure we are bound to the main frame buffer
        // gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        if (this.clearBeforeRender) {
            if (this.transparent) {
                gl.clearColor(0, 0, 0, 0);
            } else {
                gl.clearColor(stage.backgroundColor[0], stage.backgroundColor[1], stage.backgroundColor[2], 1);
            }

            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        this.renderDisplayObject(stage, this.projection);
    };

    PIXI.WebGLRenderer.prototype.renderDisplayObject = function(displayObject, projection, buffer) {
        this.renderSession.blendModeManager.setBlendMode(PIXI.blendModes.NORMAL);

        // set the default projection
        this.renderSession.projection = projection;

        //set the default offset
        this.renderSession.offset = this.offset;

        // start the sprite batch
        this.spriteBatch.begin(this.renderSession);

        // render the scene!
        displayObject.render(this.renderSession);

        // finish the sprite batch
        this.spriteBatch.end();
    };

    PIXI.WebGLRenderer.prototype.resize = function(width, height) {
        this.width = width * this.resolution;
        this.height = height * this.resolution;

        this.view.width = this.width;
        this.view.height = this.height;

        if (this.autoResize) {
            this.view.style.width = this.width / this.resolution + 'px';
            this.view.style.height = this.height / this.resolution + 'px';
        }

        this.gl.viewport(0, 0, this.width, this.height);

        this.projection.x = this.width / 2 / this.resolution;
        this.projection.y = -this.height / 2 / this.resolution;
    };

    PIXI.WebGLRenderer.prototype.updateTexture = function(texture) {
        if (!texture.hasLoaded) return;

        var gl = this.gl;

        if (!texture._glTextures[gl.id]) texture._glTextures[gl.id] = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture._glTextures[gl.id]);

        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture.premultipliedAlpha);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.source);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, texture.scaleMode === PIXI.scaleModes.LINEAR ? gl.LINEAR : gl.NEAREST);


        if (texture.mipmap && PIXI.isPowerOfTwo(texture.width, texture.height)) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texture.scaleMode === PIXI.scaleModes.LINEAR ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST_MIPMAP_NEAREST);
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texture.scaleMode === PIXI.scaleModes.LINEAR ? gl.LINEAR : gl.NEAREST);
        }

        // reguler...
        if (!texture._powerOf2) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        }

        texture._dirty[gl.id] = false;

        return texture._glTextures[gl.id];
    };

    PIXI.WebGLRenderer.prototype.handleContextLost = function(event) {
        event.preventDefault();
        this.contextLost = true;
    };

    PIXI.WebGLRenderer.prototype.handleContextRestored = function() {
        this.initContext();

        for (var key in PIXI.TextureCache) {
            var texture = PIXI.TextureCache[key].baseTexture;
            texture._glTextures = [];
        }

        this.contextLost = false;
    };

    PIXI.WebGLRenderer.prototype.mapBlendModes = function() {
        var gl = this.gl;

        if (!PIXI.blendModesWebGL) {
            PIXI.blendModesWebGL = [];

            PIXI.blendModesWebGL[PIXI.blendModes.NORMAL]      = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
            PIXI.blendModesWebGL[PIXI.blendModes.ADD]         = [gl.SRC_ALPHA, gl.DST_ALPHA];
            PIXI.blendModesWebGL[PIXI.blendModes.MULTIPLY]    = [gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA];
            PIXI.blendModesWebGL[PIXI.blendModes.SCREEN]      = [gl.SRC_ALPHA, gl.ONE];
        }
    };

    PIXI.WebGLBlendModeManager = function() {
        this.currentBlendMode = 99999;
    };

    PIXI.WebGLBlendModeManager.prototype.constructor = PIXI.WebGLBlendModeManager;

    PIXI.WebGLBlendModeManager.prototype.setContext = function(gl) {
        this.gl = gl;
    };

    PIXI.WebGLBlendModeManager.prototype.setBlendMode = function(blendMode) {
        if (this.currentBlendMode === blendMode) return false;

        this.currentBlendMode = blendMode;

        var blendModeWebGL = PIXI.blendModesWebGL[this.currentBlendMode];
        this.gl.blendFunc(blendModeWebGL[0], blendModeWebGL[1]);

        return true;
    };

    PIXI.WebGLBlendModeManager.prototype.destroy = function() {
        this.gl = null;
    };




    PIXI.WebGLMaskManager = function() {};

    PIXI.WebGLMaskManager.prototype.constructor = PIXI.WebGLMaskManager;

    PIXI.WebGLMaskManager.prototype.setContext = function(gl) {
        this.gl = gl;
    };

    PIXI.WebGLMaskManager.prototype.pushMask = function(maskData, renderSession) {
        var gl = renderSession.gl;


        gl.enable(gl.STENCIL_TEST);
        gl.depthMask(false);
        gl.colorMask(false, false, false, false);
        gl.stencilFunc(gl.ALWAYS, 1, ~0);
        gl.stencilOp(gl.KEEP, gl.REPLACE, gl.REPLACE);

        // maskData.render();

        gl.depthMask(true);
        gl.colorMask(true, true, true, true);
        gl.stencilFunc(gl.EQUAL, 1, ~0);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    };

    PIXI.WebGLMaskManager.prototype.popMask = function() {
        var gl = this.gl;
        gl.disable(gl.STENCIL_TEST);
    };

    PIXI.WebGLMaskManager.prototype.destroy = function() {
        this.gl = null;
    };


    /**
     * @author Mat Groves http://matgroves.com/ @Doormat23
     */

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = PIXI;
        }
        exports.PIXI = PIXI;
    } else if (typeof define !== 'undefined' && define.amd) {
        define(PIXI);
    } else {
        root.PIXI = PIXI;
    }

})(this);

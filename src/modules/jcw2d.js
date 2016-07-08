(function() {

    var root = this;

    var JC = JC || {};

    JC.VERSION = "v0.0.3";

    JC.blendModes = {
        NORMAL: 0,
        ALPHA: 1,
        ADD: 2,
        MULTIPLY: 3,
        SCREEN: 4
    };

    JC.scaleModes = {
        DEFAULT: 0,
        LINEAR: 0,
        NEAREST: 1
    };

    if (typeof(Float32Array) != 'undefined') {
        JC.Float32Array = Float32Array;
        JC.Uint16Array = Uint16Array;

        JC.Uint32Array = Uint32Array;
        JC.ArrayBuffer = ArrayBuffer;
    } else {
        JC.Float32Array = Array;
        JC.Uint16Array = Array;

        JC.Uint32Array = Array;
        JC.ArrayBuffer = Array;
        console.log('%c not type array ', 'color: #fff;background: #f00;');
    }

    JC.PI_2 = Math.PI * 2;

    JC.RTD = 180 / Math.PI;

    JC.DTR = Math.PI / 180;

    JC.dontSpeek = false;

    JC.defaultRenderOptions = {
        view: null,
        transparent: false,
        antialias: false,
        preserveDrawingBuffer: false,
        resolution: 1,
        clearBeforeRender: true,
        autoResize: false
    };

    function noop(){}

    JC.sayHello = function(type) {
        if (JC.dontSpeek) return;

        if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
            var args = [
                '%c  %c jcw2d.js ' + JC.VERSION + '  %c ' + ' %c ' + ' http://www.jason82.com/ %c  ',
                'background: #80a89e',
                'color: #f98165; background: #cad9d5;',
                'background: #80a89e',
                'background: #cad9d5',
                'background: #80a89e'
            ];

            console.log.apply(console, args);
        }else{
            console.log(' jcw2d.js ' + JC.VERSION + '  http://www.jason82.com/  ');
        }

        JC.dontSpeek = true;
    };


    JC.Point = function(x, y) {
        this.x = x || 0;

        this.y = y || 0;
    };
    JC.Point.prototype.clone = function() {
        return new JC.Point(this.x, this.y);
    };
    JC.Point.prototype.set = function(x, y) {
        this.x = x || 0;
        this.y = y || ((y !== 0) ? this.x : 0);
    };
    JC.Point.prototype.constructor = JC.Point;


    JC.Matrix = function() {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.tx = 0;
        this.ty = 0;
    };
    JC.Matrix.prototype.fromArray = function(array) {
        this.a = array[0];
        this.b = array[1];
        this.c = array[3];
        this.d = array[4];
        this.tx = array[2];
        this.ty = array[5];
    };
    JC.Matrix.prototype.toArray = function(transpose) {
        if (!this.array) this.array = new JC.Float32Array(9);
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
    JC.Matrix.prototype.apply = function(pos, newPos) {
        newPos = newPos || new JC.Point();

        newPos.x = this.a * pos.x + this.c * pos.y + this.tx;
        newPos.y = this.b * pos.x + this.d * pos.y + this.ty;

        return newPos;
    };
    JC.Matrix.prototype.applyInverse = function(pos, newPos) {
        newPos = newPos || new JC.Point();

        var id = 1 / (this.a * this.d + this.c * -this.b);

        newPos.x = this.d * id * pos.x + -this.c * id * pos.y + (this.ty * this.c - this.tx * this.d) * id;
        newPos.y = this.a * id * pos.y + -this.b * id * pos.x + (-this.ty * this.a + this.tx * this.b) * id;

        return newPos;
    };
    JC.Matrix.prototype.translate = function(x, y) {
        this.tx += x;
        this.ty += y;

        return this;
    };
    JC.Matrix.prototype.scale = function(x, y) {
        this.a *= x;
        this.d *= y;
        this.c *= x;
        this.b *= y;
        this.tx *= x;
        this.ty *= y;

        return this;
    };
    JC.Matrix.prototype.rotate = function(angle) {
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
    JC.Matrix.prototype.append = function(matrix) {
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
    JC.Matrix.prototype.identity = function() {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.tx = 0;
        this.ty = 0;

        return this;
    };

    JC.identityMatrix = new JC.Matrix();


    function Animate(){
        this.MST = 0;
        this.MAT = 300;
        this.fx = 'easeBoth';
        this.complete = noop;
        this.moving = false;
        this.infinity = false;
        this.alternate = false;
        this.repeats = 0;
    }
    Animate.prototype.moveTween = function(opts){
        this.MST = Date.now();
        this.MATR = opts.attr||this.MATR;
        this.MAT = opts.time||this.MAT;
        this.fx = opts.fx||this.fx;
        this.complete = opts.complete||this.complete;
        this.infinity = opts.infinity||this.infinity;
        this.alternate = opts.alternate||this.alternate;
        this.repeats = opts.repeats||this.repeats;
        this.moving = true;
        this.MATRC = {};
        for(var i in this.MATR){
            this.MATRC[i] = this[i];
        }
    };
    Animate.prototype.manager = function(){
        if(!this.moving)return;
        var now = Date.now();
        if(now < this.MST+this.MAT){
            this.nextPose();
        }else{
            this.setVal(this.MATR);
            if(this.repeats>0||this.infinity){
                this.repeats>0&&--this.repeats;
                if(this.alternate){
                    this.moveTween({attr: this.MATRC});
                }else{
                    this.setVal(this.MATRC);
                    this.moveTween({attr: this.MATR});
                }
            }else{
                this.moving = false;
                this.complete();
                if(now>this.MST)this.complete = noop;
            }
        }
    };
    Animate.prototype.nextPose = function(){
        var now=Date.now()-this.MST;
        for(var i in this.MATR){
            this[i] = JC.TWEEN[this.fx]( now , this.MATRC[i] , this.MATR[i] - this.MATRC[i] , this.MAT );
        }
    };

    JC.DisplayObject = function() {
        Animate.call( this );
        this.visible = true;
        this.worldAlpha = 1;
        this.alpha = 1;

        this.scaleX = 1;
        this.scaleY = 1;

        this.skewX = 0;
        this.skewY = 0;

        this.rotation = 0;
        this.rotationCache = 0;
        this._sr = 0;
        this._cr = 1;
        
        this.x = 0;
        this.y = 0;
        
        this.pivotX = 0;
        this.pivotY = 0;

        this._mask = null;

        this.parent = null;
        this.worldTransform = new JC.Matrix();

        this.renderable = false;

        this._cacheAsBitmap = false;

        this._cacheIsDirty = false;
    };

    JC.DisplayObject.prototype = Object.create( Animate.prototype );
    JC.DisplayObject.prototype.constructor = JC.DisplayObject;

    Object.defineProperty(JC.DisplayObject.prototype, 'mask', {
        get: function() {
            return this._mask;
        },
        set: function(value) {

            if (this._mask) this._mask.isMask = false;
            this._mask = value;
            if (this._mask) this._mask.isMask = true;
        }
    });

    Object.defineProperty(JC.DisplayObject.prototype, 'cacheAsBitmap', {

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

    JC.DisplayObject.prototype.setVal = function(vals){
        if(vals===undefined)return;
        for(var key in vals){
            if(this[key]===undefined){
                continue;
            }else{
                this[key] = vals[key];
            }
        }
    };

    JC.DisplayObject.prototype.upDate = function(renderSession) {
        renderSession.texturesManager.setTexture(this.texture);
        renderSession.shaderManager.setShader(this.shaderType);
        renderSession.blendModeManager.setBlendMode(this.blendMode);
        this.dirty&&this.createBuffer(renderSession.gl);
        this.syncAttribute(renderSession);
        this.syncUniforms(renderSession);
    };

    JC.DisplayObject.prototype.updateTransform = function() {
        var pt = this.parent.worldTransform;
        var wt = this.worldTransform;

        var a, b, c, d, tx, ty;

        if (this.rotation % JC.PI_2) {
            if (this.rotation !== this.rotationCache) {
                this.rotationCache = this.rotation;
                this._sr = Math.sin(this.rotation);
                this._cr = Math.cos(this.rotation);
            }

            a = this._cr * this.scaleX;
            b = this._sr * this.scaleX;
            c = -this._sr * this.scaleY;
            d = this._cr * this.scaleY;
            tx = this.x;
            ty = this.y;

            if (this.pivotX || this.pivotY) {
                tx -= this.pivotX * a + this.pivotY * c;
                ty -= this.pivotX * b + this.pivotY * d;
            }

            wt.a = a * pt.a + b * pt.c;
            wt.b = a * pt.b + b * pt.d;
            wt.c = c * pt.a + d * pt.c;
            wt.d = c * pt.b + d * pt.d;
            wt.tx = tx * pt.a + ty * pt.c + pt.tx;
            wt.ty = tx * pt.b + ty * pt.d + pt.ty;


        } else {
            a = this.scaleX;
            d = this.scaleY;

            tx = this.x - this.pivotX * a;
            ty = this.y - this.pivotY * d;

            wt.a = a * pt.a;
            wt.b = a * pt.b;
            wt.c = d * pt.c;
            wt.d = d * pt.d;
            wt.tx = tx * pt.a + ty * pt.c + pt.tx;
            wt.ty = tx * pt.b + ty * pt.d + pt.ty;
        }

        this.worldAlpha = this.alpha * this.parent.worldAlpha;

        this.manager();
    };

    JC.DisplayObject.prototype.displayObjectUpdateTransform = JC.DisplayObject.prototype.updateTransform;

    JC.DisplayObject.prototype.render = function(renderSession) {
        // OVERWRITE;
        // this line is just here to pass jshinting :)
        renderSession = renderSession;
    };



    JC.DisplayObjectContainer = function() {
        JC.DisplayObject.call(this);

        this.children = [];
    };

    JC.DisplayObjectContainer.prototype = Object.create(JC.DisplayObject.prototype);
    JC.DisplayObjectContainer.prototype.constructor = JC.DisplayObjectContainer;

    JC.DisplayObjectContainer.prototype.addChilds = function() {
        var l = arguments.length;
        if(l>0){
            for(var i=0;i<l;i++){
                this.addChildAt(arguments[i], this.children.length);
            }
            return arguments[l-1];
        }
    };

    JC.DisplayObjectContainer.prototype.addChildAt = function(child, index) {
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

    JC.DisplayObjectContainer.prototype.swapChildren = function(child, child2) {
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

    JC.DisplayObjectContainer.prototype.getChildIndex = function(child) {
        var index = this.children.indexOf(child);
        if (index === -1) {
            throw new Error('The supplied DisplayObject must be a child of the caller');
        }
        return index;
    };

    JC.DisplayObjectContainer.prototype.setChildIndex = function(child, index) {
        if (index < 0 || index >= this.children.length) {
            throw new Error('The supplied index is out of bounds');
        }
        var currentIndex = this.getChildIndex(child);
        this.children.splice(currentIndex, 1); //remove from old position
        this.children.splice(index, 0, child); //add at new position
    };

    JC.DisplayObjectContainer.prototype.getChildAt = function(index) {
        if (index < 0 || index >= this.children.length) {
            throw new Error('getChildAt: Supplied index ' + index + ' does not exist in the child list, or the supplied DisplayObject must be a child of the caller');
        }
        return this.children[index];

    };

    JC.DisplayObjectContainer.prototype.removeChild = function(child) {
        var index = this.children.indexOf(child);
        if (index === -1) return;

        return this.removeChildAt(index);
    };

    JC.DisplayObjectContainer.prototype.removeChildAt = function(index) {
        var child = this.getChildAt(index);
        if (this.stage)
            child.removeStageReference();

        child.parent = undefined;
        this.children.splice(index, 1);
        return child;
    };

    JC.DisplayObjectContainer.prototype.removeChildren = function(beginIndex, endIndex) {
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

    JC.DisplayObjectContainer.prototype.updateTransform = function() {
        if (!this.visible) return;

        this.displayObjectUpdateTransform();

        for (var i = 0, j = this.children.length; i < j; i++) {
            this.children[i].updateTransform();
        }
    };

    JC.DisplayObjectContainer.prototype.displayObjectContainerUpdateTransform = JC.DisplayObjectContainer.prototype.updateTransform;

    JC.DisplayObjectContainer.prototype.render = function(renderSession) {
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




    JC.Sprite = function(opts) {
        JC.DisplayObjectContainer.call(this);

        this.texture = opts.texture;

        this.width = opts.width||this.texture.width;

        this.height = opts.height||this.texture.height;

        this.sH = opts.sH||0;

        this.sW = opts.sW||0;

        this.tint = opts.tint||0xFFFFFF;

        this.blendMode = opts.blendModes||JC.blendModes.ALPHA;

        this.shader = null;
        this.shaderType = 'sprite';

        this.repeatX = opts.repeatX||false;
        this.repeatY = opts.repeatY||false;

        this.renderable = true;

        this.buildMesh();

    };

    JC.Sprite.prototype = Object.create(JC.DisplayObjectContainer.prototype);
    JC.Sprite.prototype.constructor = JC.Sprite;


    JC.Sprite.prototype.buildMesh = function() {
        var w = this.texture.width,
            h = this.texture.height;
        this.vertices = new JC.Float32Array([
                -this.width/2,this.height/2,
                -this.width/2,-this.height/2,
                this.width/2,-this.height/2,
                this.width/2,this.height/2
            ]);
        this.indices = new JC.Uint16Array([
                0,1,2,
                0,2,3
            ]);
        if(this.repeatX || this.repeatY){
            var rX = this.repeatX?2:1,
                rY = this.repeatY?2:1;
            this.uvs = new JC.Float32Array([
                0*rX, 0*rY,
                0*rX, 1*rY,
                1*rX, 1*rY,
                1*rX, 0*rY
            ]);
        }else{
            this.uvs = new JC.Float32Array([
                this.sW/w, this.sH/h,
                this.sW/w, (this.sH+this.height)/h,
                (this.sW+this.width)/w, (this.sH+this.height)/h,
                (this.sW+this.width)/w, this.sH/h
            ]);
        }
        this.cachedTint = JC.hex2rgb(this.tint);
        this.dirty = true;
    };
    
    JC.Sprite.prototype.createBuffer = function(gl){
        this.vertexBuffer = gl.createBuffer();
        this.uvsBuffer = gl.createBuffer();
        this.indicesBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        this.dirty = false;
    };

    JC.Sprite.prototype.syncUniforms = function(renderSession){
        var gl = renderSession.gl,
            shader = renderSession.shaderManager.shader,
            projection = renderSession.projection;

        gl.uniform1i(shader.uSampler, 0);
        gl.uniform1f(shader.uAlpha, this.worldAlpha);
        gl.uniform2f(shader.projectionVector, projection.x, projection.y);
        gl.uniformMatrix3fv(shader.uMatrix, false, this.worldTransform.toArray(true));
        gl.uniform3fv(shader.uTint, this.cachedTint);

    };

    JC.Sprite.prototype.syncAttribute = function(renderSession){
        var gl = renderSession.gl,
            shader = renderSession.shaderManager.shader;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(shader.aVertexPosition);
        gl.vertexAttribPointer(shader.aVertexPosition, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvsBuffer);
        gl.enableVertexAttribArray(shader.aTextureCoord);
        gl.vertexAttribPointer(shader.aTextureCoord, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
    };

    JC.Sprite.prototype.render = function(renderSession) {
        if (!this.visible || this.alpha <= 0) return;
        this.upDate(renderSession);
        var i, j, gl = renderSession.gl;

        // do a quick check to see if this element has a mask or a filter.
        if (this._mask) {

            if (this._mask) {
                renderSession.maskManager.pushMask(this.mask, renderSession);
            }

            // add this sprite to the batch
            gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);

            // now loop through the children and make sure they get rendered
            for (i = 0, j = this.children.length; i < j; i++) {
                this.children[i].render(renderSession);
            }

            // time to stop the sprite batch as either a mask element or a filter draw will happen next

            if (this._mask) renderSession.maskManager.popMask(this._mask, renderSession);
        } else {

            gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);

            // simple render children!
            for (i = 0, j = this.children.length; i < j; i++) {
                this.children[i].render(renderSession);
            }

        }
    };

    JC.Sprite.fromFrame = function(frameId) {
        var texture = JC.TextureCache[frameId];
        if (!texture) throw new Error('The frameId "' + frameId + '" does not exist in the texture cache' + this);
        return new JC.Sprite(texture);
    };

    JC.Sprite.fromImage = function(imageId, crossorigin, scaleMode) {
        var texture = JC.Texture.fromImage(imageId, crossorigin, scaleMode);
        return new JC.Sprite(texture);
    };




    // JC.Point = function(opts) {
    //     this.x = opts.x;
    //     this.y = opts.y;

    //     this.radius = opts.radius || 10;
    //     this.color = opts.color;
    //     this.alpha = opts.alpha;

    //     this.alive = true;

    //     this.wander = JC.Math.randIn( 0.5, 2.0 );
    //     this.theta = JC.Math.randIn( 0, Math.PI*2 );
    //     this.drag = 0.92;

    //     this.vx = 0.0;
    //     this.vy = 0.0;
    // };
    // JC.Point.prototype.move = function() {
    //     this.x += this.vx;
    //     this.y += this.vy;

    //     this.vx *= this.drag;
    //     this.vy *= this.drag;

    //     this.theta += JC.Math.randIn( -0.5, 0.5 ) * this.wander;
    //     this.vx += Math.sin( this.theta ) * 0.1;
    //     this.vy += Math.cos( this.theta ) * 0.1;

    //     this.radius *= 0.96;
    //     this.alive = this.radius > 0.5;
    // };
    // JC.Point.prototype.revive = function() {
    //     var theta = JC.Math.randIn( 0, Math.PI*2 ),
    //         force = JC.Math.randIn( 2, 8 );
    //     this.x = JC.Math.randIn( -20, 20 );
    //     this.y = JC.Math.randIn( -20, 20 );

    //     this.vx = Math.sin( theta ) * force;
    //     this.vy = Math.cos( theta ) * force;

    //     this.drag = JC.Math.randIn( 0.9, 0.99 );
    //     this.wander = JC.Math.randIn( 0.5, 2.0 );


    //     this.radius = JC.Math.randIn(4,20);
    // };



    // JC.Particles = function(opts) {
    //     JC.DisplayObjectContainer.call(this);

    //     this.points = [];

    //     this.texture = opts.texture;

    //     this.tint = opts.tint||0xFFFFFF;

    //     this.blendMode = opts.blendModes||JC.blendModes.ALPHA;

    //     this.shader = null;

    //     this.renderable = true;

    //     this.buildMesh();

    // };

    // JC.Particles.prototype = Object.create(JC.DisplayObjectContainer.prototype);
    // JC.Particles.prototype.constructor = JC.Particles;
    // JC.Particles.prototype.buildMesh = function() {
    //     this.vertices = new JC.Float32Array(this.points.length*2);
    //     this.sizes = new JC.Uint16Array(this.points.length);
    //     this.point_colors = new JC.Float32Array(this.points.length*4);
    //     var ct;
    //     for(var i=0;i<this.points.length;i++){
    //         this.vertices[2*i] = this.points[i].x;
    //         this.vertices[2*i+1] = this.points[i].y;
    //         this.sizes[i] = this.points[i].radius;
    //         ct = JC.hex2rgb(this.points[i].color);
    //         this.point_colors[4*i] = ct[0];
    //         this.point_colors[4*i+1] = ct[1];
    //         this.point_colors[4*i+2] = ct[2];
    //         this.point_colors[4*i+3] = this.points[i].alpha;
    //     }
    // };
    // JC.Particles.prototype.createBuffer = function(gl){
    //     this.vertexBuffer = gl.createBuffer();
    //     this.sizesBuffer = gl.createBuffer();
    //     this.colorsBuffer = gl.createBuffer();

    //     gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    //     gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);
    //     gl.bindBuffer(gl.ARRAY_BUFFER, null);

    //     gl.bindBuffer(gl.ARRAY_BUFFER, this.sizesBuffer);
    //     gl.bufferData(gl.ARRAY_BUFFER, this.sizes, gl.DYNAMIC_DRAW);
    //     gl.bindBuffer(gl.ARRAY_BUFFER, null);

    //     gl.bindBuffer(gl.ARRAY_BUFFER, this.colorsBuffer);
    //     gl.bufferData(gl.ARRAY_BUFFER, this.point_colors, gl.DYNAMIC_DRAW);
    //     gl.bindBuffer(gl.ARRAY_BUFFER, null);

    //     this.dirty = false;
    // };
    // JC.Particles.prototype.syncUniforms = function(renderSession){
    //     var gl = renderSession.gl,
    //         shader = renderSession.shaderManager.shader,
    //         projection = renderSession.projection;

    //     gl.uniform1i(shader.uSampler, 0);
    //     gl.uniform1f(shader.uAlpha, this.worldAlpha);
    //     gl.uniform2f(shader.projectionVector, projection.x, projection.y);
    //     gl.uniformMatrix3fv(shader.uMatrix, false, this.worldTransform.toArray(true));
    //     gl.uniform3fv(shader.uTint, this.cachedTint);

    // };

    // JC.Particles.prototype.syncAttribute = function(renderSession){
    //     var gl = renderSession.gl,
    //         shader = renderSession.shaderManager.shader;

    //     gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    //     gl.enableVertexAttribArray(shader.aVertexPosition);
    //     gl.vertexAttribPointer(shader.aVertexPosition, 2, gl.FLOAT, false, 0, 0);

    //     gl.bindBuffer(gl.ARRAY_BUFFER, this.sizesBuffer);
    //     gl.enableVertexAttribArray(shader.aPointSize);
    //     gl.vertexAttribPointer(shader.aPointSize, 2, gl.FLOAT, false, 0, 0);

    //     gl.bindBuffer(gl.ARRAY_BUFFER, this.colorsBuffer);
    //     gl.enableVertexAttribArray(shader.aPointColors);
    //     gl.vertexAttribPointer(shader.aPointColors, 4, gl.FLOAT, false, 0, 0);

    // };




    JC.Stage = function(backgroundColor) {
        JC.DisplayObjectContainer.call(this);

        this.worldTransform = new JC.Matrix();

        this.stage = this;

        this.setBackgroundColor(backgroundColor);
    };

    JC.Stage.prototype = Object.create(JC.DisplayObjectContainer.prototype);
    JC.Stage.prototype.constructor = JC.Stage;

    JC.Stage.prototype.updateTransform = function() {
        this.worldAlpha = 1;

        for (var i = 0, j = this.children.length; i < j; i++) {
            this.children[i].updateTransform();
        }
    };

    JC.Stage.prototype.setBackgroundColor = function(bgc) {
        if (typeof bgc === 'number') return;
        this.backgroundColor = JC.hex2rgb(bgc);
    };



    JC.hex2rgb = function(hex) {
        return [(hex >> 16 & 0xFF) / 255, (hex >> 8 & 0xFF) / 255, (hex & 0xFF) / 255];
    };

    JC.rgb2hex = function(rgb) {
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

    JC.getNextPowerOfTwo = function(number) {
        if (number > 0 && (number & (number - 1)) === 0) // see: http://goo.gl/D9kPj
            return number;
        else {
            var result = 1;
            while (result < number) result <<= 1;
            return result;
        }
    };

    JC.isPowerOfTwo = function(width, height) {
        return (width > 0 && (width & (width - 1)) === 0 && height > 0 && (height & (height - 1)) === 0);

    };



    JC.CompileVertexShader = function(gl, shaderSrc) {
        return JC._CompileShader(gl, shaderSrc, gl.VERTEX_SHADER);
    };

    JC.CompileFragmentShader = function(gl, shaderSrc) {
        return JC._CompileShader(gl, shaderSrc, gl.FRAGMENT_SHADER);
    };

    JC._CompileShader = function(gl, shaderSrc, shaderType) {
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

    JC.compileProgram = function(gl, vertexSrc, fragmentSrc) {
        var fragmentShader = JC.CompileFragmentShader(gl, fragmentSrc);
        var vertexShader = JC.CompileVertexShader(gl, vertexSrc);

        var shaderProgram = gl.createProgram();

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            window.console.log("Could not initialise shaders");
        }

        return shaderProgram;
    };



    JC.SpriteShader = function(gl) {
        this.gl = gl;

        this.program = null;

        this.fragmentSrc = [
            'precision lowp float;',
            'varying vec2 vTextureCoord;',

            'uniform sampler2D uSampler;',
            'uniform vec3 uTint;',
            'uniform float uAlpha;',

            'void main(void) {',
            '   vec4 smpColor = texture2D(uSampler, vTextureCoord);',
            '   gl_FragColor = vec4(uTint,uAlpha) * smpColor;',
            '}'
        ];

        this.vertexSrc = [
            'attribute vec2 aVertexPosition;',
            'attribute vec2 aTextureCoord;',

            'uniform vec2 projectionVector;',
            'uniform mat3 uMatrix;',

            'varying vec2 vTextureCoord;',

            'void main(void) {',
            '   vec2 v = ( uMatrix * vec3(aVertexPosition , 1.0) ).xy ;',
            '   gl_Position = vec4( v / projectionVector , 0.0, 1.0);',
            '   vTextureCoord = aTextureCoord;',
            '}'
        ];

        this.textureCount = 0;

        this.init();
    };

    JC.SpriteShader.prototype.constructor = JC.SpriteShader;

    JC.SpriteShader.prototype.init = function() {
        var gl = this.gl;

        var program = JC.compileProgram(gl, this.vertexSrc, this.fragmentSrc);

        gl.useProgram(program);

        this.uSampler = gl.getUniformLocation(program, 'uSampler');
        this.projectionVector = gl.getUniformLocation(program, 'projectionVector');
        this.uMatrix = gl.getUniformLocation(program, 'uMatrix');
        this.uTint = gl.getUniformLocation(program, 'uTint');
        this.uAlpha = gl.getUniformLocation(program, 'uAlpha');

        this.aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
        this.aTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');

        this.program = program;
    };

    JC.SpriteShader.prototype.destroy = function() {
        this.gl.deleteProgram(this.program);
        this.gl = null;
    };




    JC.PointShader = function(gl) {
        this.gl = gl;

        this.program = null;

        this.fragmentSrc = [
            'precision lowp float;',
            'varying vec2 vTextureCoord;',

            'uniform sampler2D uSampler;',
            'uniform vec3 uTint;',
            'uniform float uAlpha;',

            'varying vec4 vPointColor;',

            'void main(void) {',
            '   vec4 smpColor = texture2D(uSampler, vTextureCoord);',
            '   gl_FragColor = vec4(uTint,uAlpha) * smpColor;',
            '}'
        ];

        this.vertexSrc = [
            'attribute vec2 aVertexPosition;',
            'attribute vec2 aTextureCoord;',
            'attribute float aPointColor;',

            'uniform vec2 projectionVector;',
            'uniform mat3 uMatrix;',

            'varying vec4 vPointColor;',

            'void main(void) {',
            '   vec2 v = ( uMatrix * vec3(aVertexPosition , 1.0) ).xy ;',
            '   gl_Position = vec4( v / projectionVector , 0.0, 1.0);',
            '   vPointColor = aPointColor;',
            '}'
        ];

        this.textureCount = 0;

        this.init();
    };

    JC.PointShader.prototype.constructor = JC.PointShader;

    JC.PointShader.prototype.init = function() {
        var gl = this.gl;

        var program = JC.compileProgram(gl, this.vertexSrc, this.fragmentSrc);

        gl.useProgram(program);

        this.uSampler = gl.getUniformLocation(program, 'uSampler');
        this.projectionVector = gl.getUniformLocation(program, 'projectionVector');
        this.uMatrix = gl.getUniformLocation(program, 'uMatrix');
        this.uTint = gl.getUniformLocation(program, 'uTint');
        this.uAlpha = gl.getUniformLocation(program, 'uAlpha');

        this.aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
        this.aTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');

        this.program = program;
    };

    JC.PointShader.prototype.destroy = function() {
        this.gl.deleteProgram(this.program);
        this.gl = null;
    };



    JC.Renderer = function(width, height, options) {
        if (options) {
            for (var i in JC.defaultRenderOptions) {
                if (typeof options[i] === 'undefined') options[i] = JC.defaultRenderOptions[i];
            }
        } else {
            options = JC.defaultRenderOptions;
        }

        JC.sayHello();

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

        this.projection = new JC.Point();

        this.offset = new JC.Point(0, 0);

        this.shaderManager = new JC.ShaderManager();

        this.texturesManager = new JC.TexturesManager();

        this.maskManager = new JC.WebGLMaskManager();

        this.blendModeManager = new JC.WebGLBlendModeManager();

        this.renderSession = {};
        this.renderSession.gl = this.gl;
        this.renderSession.shaderManager = this.shaderManager;
        this.renderSession.texturesManager = this.texturesManager;
        this.renderSession.maskManager = this.maskManager;
        this.renderSession.blendModeManager = this.blendModeManager;
        this.renderSession.renderer = this;
        this.renderSession.resolution = this.resolution;

        // time init the context..
        this.initContext();

        // map some webGL blend modes..
        this.mapBlendModes();
    };

    JC.Renderer.prototype.constructor = JC.Renderer;

    JC.Renderer.prototype.initContext = function() {
        var gl = this.view.getContext('webgl', this._contextOptions) || this.view.getContext('experimental-webgl', this._contextOptions);
        this.gl = gl;

        if (!gl) {
            throw new Error('This browser does not support webGL. Try using the canvas renderer');
        }

        // set up the default JC settings..
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.enable(gl.BLEND);

        // need to set the context for all the managers...
        this.shaderManager.setContext(gl);
        this.texturesManager.setContext(gl);
        this.maskManager.setContext(gl);
        this.blendModeManager.setContext(gl);

        this.renderSession.gl = this.gl;

        // now resize and we are good to go!
        this.resize(this.width, this.height);

    };

    JC.Renderer.prototype.render = function(stage) {
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

    JC.Renderer.prototype.renderDisplayObject = function(displayObject, projection, buffer) {
        this.renderSession.blendModeManager.setBlendMode(JC.blendModes.ALPHA);

        // set the default projection
        this.renderSession.projection = projection;

        //set the default offset
        this.renderSession.offset = this.offset;

        // render the scene!
        displayObject.render(this.renderSession);

    };

    JC.Renderer.prototype.resize = function(width, height) {
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
        this.projection.y = this.height / 2 / this.resolution;
    };

    JC.Renderer.prototype.handleContextLost = function(event) {
        event.preventDefault();
        this.contextLost = true;
    };

    JC.Renderer.prototype.handleContextRestored = function() {
        this.initContext();

        this.contextLost = false;
    };

    JC.Renderer.prototype.mapBlendModes = function() {
        var gl = this.gl;

        if (!JC.blendModesWebGL) {
            JC.blendModesWebGL = [];

            JC.blendModesWebGL[JC.blendModes.NORMAL]      = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
            JC.blendModesWebGL[JC.blendModes.ALPHA]       = [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA];
            JC.blendModesWebGL[JC.blendModes.ADD]         = [gl.SRC_ALPHA, gl.DST_ALPHA];
            JC.blendModesWebGL[JC.blendModes.MULTIPLY]    = [gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA];
            JC.blendModesWebGL[JC.blendModes.SCREEN]      = [gl.SRC_ALPHA, gl.ONE];
        }
    };





    JC.TexturesManager = function() {
        this.textures = {};
    };

    JC.TexturesManager.prototype.constructor = JC.TexturesManager;

    JC.TexturesManager.prototype.setContext = function(gl) {
        this.gl = gl;
    };

    JC.TexturesManager.prototype.setTexture = function(texture) {
        var gl = this.gl;
        if (this.currentId === texture.id) return false;

        if(this.textures[texture.id]===undefined){
            this.setPara(texture);
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textures[texture.id].texture);
        
        this.currentId = texture.id;

        return true;
    };

    JC.TexturesManager.prototype.setPara = function(texture) {
        var gl = this.gl;

        texture.texture = gl.createTexture();

        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        
        gl.bindTexture(gl.TEXTURE_2D, texture.texture);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.img);
        
        if(texture.isPowerOfTwo)gl.generateMipmap(gl.TEXTURE_2D);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        this.textures[texture.id] = texture;

        gl.bindTexture(gl.TEXTURE_2D, null);
    };

    JC.TexturesManager.prototype.destroy = function() {
        this.gl = null;
    };




    JC.WebGLBlendModeManager = function() {
        this.currentBlendMode = 99999;
    };

    JC.WebGLBlendModeManager.prototype.constructor = JC.WebGLBlendModeManager;

    JC.WebGLBlendModeManager.prototype.setContext = function(gl) {
        this.gl = gl;
    };

    JC.WebGLBlendModeManager.prototype.setBlendMode = function(blendMode) {
        if (this.currentBlendMode === blendMode) return false;

        this.currentBlendMode = blendMode;

        var blendModeWebGL = JC.blendModesWebGL[this.currentBlendMode];
        
        this.gl.blendEquation( this.gl.FUNC_ADD );
        this.gl.blendFunc(blendModeWebGL[0], blendModeWebGL[1]);

        return true;
    };

    JC.WebGLBlendModeManager.prototype.destroy = function() {
        this.gl = null;
    };


    JC.ShaderManager = function()
    {

        this.shaders = {};

    };

    JC.ShaderManager.prototype.constructor = JC.ShaderManager;

    JC.ShaderManager.prototype.setContext = function(gl)
    {
        this.gl = gl;

        // this shader is used for the default sprite rendering
        this.shaders['sprite'] = new JC.SpriteShader(gl);

        // this shader is used for the particle rendering
        this.shaders['particle'] = new JC.PointShader(gl);

        this.setShader('sprite');
    };


    JC.ShaderManager.prototype.setShader = function(type)
    {
        if(this._curShaderType === type)return false;
        
        this._curShaderType = type;

        this.shader = this.shaders[type];

        this.gl.useProgram(this.shader.program);

        return true;
    };

    JC.ShaderManager.prototype.destroy = function()
    {
        this.gl = null;
    };




    JC.WebGLMaskManager = function() {};

    JC.WebGLMaskManager.prototype.constructor = JC.WebGLMaskManager;

    JC.WebGLMaskManager.prototype.setContext = function(gl) {
        this.gl = gl;
    };

    JC.WebGLMaskManager.prototype.pushMask = function(maskData, renderSession) {
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

    JC.WebGLMaskManager.prototype.popMask = function() {
        var gl = this.gl;
        gl.disable(gl.STENCIL_TEST);
    };

    JC.WebGLMaskManager.prototype.destroy = function() {
        this.gl = null;
    };


    /**
     * @author Mat Groves http://matgroves.com/ @Doormat23
     */

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = JC;
        }
        exports.JC = JC;
    } else if (typeof define !== 'undefined' && define.amd) {
        define(JC);
    } else {
        root.JC = JC;
    }

})(this);

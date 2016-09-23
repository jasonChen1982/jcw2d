function Sprite(texture) {
    JC.Container.call(this);

    this.regX = 0;

    this.regY = 0;

    this._texture = null;

    this.tint = 0xFFFFFF;

    this.blendMode = JC.CONST.BLEND_MODES.NORMAL;

    this.shaderType = 'sprite';

    this.cachedTint = 0xFFFFFF;

    this.cachedAlpha = this.alpha;

    this.texture = texture;

    this.vertices = null;

    this.indices = new Uint16Array([0,1,2,0,2,3]);

    this.colors = null;

    this.dynamicStride = 0;
    this.dynamicBuffer = null;
    this.dynamicData = null;

    this.indexBuffer = null;

}

JC.Sprite = Sprite;
Sprite.prototype = Object.create(JC.Container.prototype);
Sprite.prototype.constructor = JC.Sprite;

Object.defineProperties(Sprite.prototype, {
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
    },
    aColor: {
        get: function() {
            if (this.tint === this.cachedTint && this.cachedAlpha === this.alpha && this.colors) return this.colors;
            this.cachedTint = this.tint;
            this.cachedAlpha = this.alpha;
            this.colors = new Float32Array(JC.UTILS.hex2rgb(this.tint).push(this.alpha));
            return this.colors;
        }
    }
});

Sprite.prototype.upTexture = function() {
    this.width = this.texture.width;
    this.height = this.texture.height;
    this.regX = this.width >> 1;
    this.regY = this.height >> 1;

    this.vertices = new Float32Array([-this.regX, this.regY, this.width - this.regX, this.regY, this.width - this.regX, this.regY - this.height, -this.regX, this.regY - this.height]);
    this.setBounds(null, true);
};

Sprite.prototype.setBounds = function(points, needless) {
    var l = this.bounds.length;
    if (l > 4 && needless) return;
    points = points || this.vertices;
    this.bounds = points;
};

Sprite.prototype.render = function(session) {
    session.blendModeManager.setBlendMode(this.blendMode);
    session.shaderManager.setShader(this.shaderType);
    var shader = session.shaderManager.currentShader;
    shader.uniforms.projectionMatrix.value = this.worldTransform.toArray(true);
    shader.uniforms.projectionVector.value = session.projection;
    shader.uniforms.uSampler.value = this.texture;
    var gl = session.gl;

    this.initBuffers(gl,shader);
    this.uploadDynamic(gl,shader);
    this.bindBuffers(gl,shader);

    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);

};
Sprite.prototype.initBuffers = function(gl, shader) {
    var i;
    var property;

    var dynamicOffset = 0;
    this.dynamicStride = 0;

    for (i in shader.attributes) {
        property = shader.attributes[i];

        property.offset = dynamicOffset;
        dynamicOffset += property.size;
        this.dynamicStride += property.size;
    }

    this.dynamicData = new Float32Array(this.dynamicStride * 4);
    this.dynamicBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.dynamicBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.dynamicData, gl.DYNAMIC_DRAW);



    this.indexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
};

Sprite.prototype.bindBuffers = function(gl,shader) {
    var i,property;
        
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dynamicBuffer);

    for (i in shader.attributes) {
        property = shader.attributes[i];
        gl.enableVertexAttribArray(property.attribute._location);
        gl.vertexAttribPointer(property.attribute._location, property.size, gl.FLOAT, false, this.dynamicStride * 4, property.offset * 4);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
};
Sprite.prototype.uploadDynamic = function() {

    var uvs = this.texture._uvs.get();
    for(var i = 0;i<4;i++){
        this.dynamicData[i*this.dynamicStride] = this.vertices[i*2];
        this.dynamicData[i*this.dynamicStride+1] = this.vertices[i*2+1];

        this.dynamicData[i*this.dynamicStride+2] = this.uvs[i*2];
        this.dynamicData[i*this.dynamicStride+3] = this.uvs[i*2+1];


        this.dynamicData[i*this.dynamicStride+4] = this.aColor[0];
        this.dynamicData[i*this.dynamicStride+5] = this.aColor[1];
        this.dynamicData[i*this.dynamicStride+6] = this.aColor[2];
        this.dynamicData[i*this.dynamicStride+7] = this.aColor[3];
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.dynamicBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.dynamicData);

};

Sprite.prototype.getBounds = function() {

};


Sprite.prototype.containsPoint = function(point) {
    return true;
};

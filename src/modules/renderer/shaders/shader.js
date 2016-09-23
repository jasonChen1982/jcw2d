function Shader(gl, vertexSrc, fragmentSrc, uniforms, attributes) {
    if (!vertexSrc || !fragmentSrc) {
        throw new Error('jcw2d.js Error. Shader requires vertexSrc and fragmentSrc');
    }

    this.type = '';

    this.gl = gl;

    this.program = null;

    this.uniforms = uniforms || {};

    this.attributes = attributes || {};

    this.textureCount = 1;

    this.MAX_TEXTURE_UNITS = gl.getParameter(MAX_TEXTURE_IMAGE_UNITS);

    this.vertexSrc = vertexSrc;

    this.fragmentSrc = fragmentSrc;

    this.init();
}

Shader.prototype.constructor = Shader;

Shader.prototype.init = function() {
    this.compile();

    this.gl.useProgram(this.program);

    this.cacheUniformLocations(Object.keys(this.uniforms));
    this.cacheAttributeLocations(Object.keys(this.attributes));
};

Shader.prototype.cacheUniformLocations = function(keys) {
    for (var i = 0; i < keys.length; ++i) {
        this.uniforms[keys[i]]._location = this.gl.getUniformLocation(this.program, keys[i]);
    }
};

Shader.prototype.cacheAttributeLocations = function(keys) {
    for (var i = 0; i < keys.length; ++i) {
        this.attributes[keys[i]]._location = this.gl.getAttribLocation(this.program, keys[i]);
    }
};

Shader.prototype.compile = function() {
    var gl = this.gl;

    var glVertShader = this._glCompile(gl.VERTEX_SHADER, this.vertexSrc);
    var glFragShader = this._glCompile(gl.FRAGMENT_SHADER, this.fragmentSrc);

    var program = gl.createProgram();

    gl.attachShader(program, glVertShader);
    gl.attachShader(program, glFragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('jcw2d.js Error: Could not initialize shader.');
        console.error('gl.VALIDATE_STATUS', gl.getProgramParameter(program, gl.VALIDATE_STATUS));
        console.error('gl.getError()', gl.getError());

        if (gl.getProgramInfoLog(program) !== '') {
            console.warn('jcw2d.js Warning: gl.getProgramInfoLog()', gl.getProgramInfoLog(program));
        }

        gl.deleteProgram(program);
        program = null;
    }

    // clean up some shaders
    gl.deleteShader(glVertShader);
    gl.deleteShader(glFragShader);

    return (this.program = program);
};

Shader.prototype.syncUniform = function(uniform) {
    var location = uniform._location,
        value = uniform.value,
        gl = this.gl,
        i, il;

    switch (uniform.type) {
        case 'b':
        case 'bool':
        case 'boolean':
            gl.uniform1i(location, value ? 1 : 0);
            break;

            // single int value
        case 'i':
        case '1i':
            gl.uniform1i(location, value);
            break;

            // single float value
        case 'f':
        case '1f':
            gl.uniform1f(location, value);
            break;

            // Float32Array(2) or JS Arrray
        case '2f':
            gl.uniform2f(location, value[0], value[1]);
            break;

            // Float32Array(3) or JS Arrray
        case '3f':
            gl.uniform3f(location, value[0], value[1], value[2]);
            break;

            // Float32Array(4) or JS Arrray
        case '4f':
            gl.uniform4f(location, value[0], value[1], value[2], value[3]);
            break;

            // a 2D Point object
        case 'v2':
            gl.uniform2f(location, value.x, value.y);
            break;

            // a 3D Point object
        case 'v3':
            gl.uniform3f(location, value.x, value.y, value.z);
            break;

            // a 4D Point object
        case 'v4':
            gl.uniform4f(location, value.x, value.y, value.z, value.w);
            break;

            // Int32Array or JS Array
        case '1iv':
            gl.uniform1iv(location, value);
            break;

            // Int32Array or JS Array
        case '2iv':
            gl.uniform2iv(location, value);
            break;

            // Int32Array or JS Array
        case '3iv':
            gl.uniform3iv(location, value);
            break;

            // Int32Array or JS Array
        case '4iv':
            gl.uniform4iv(location, value);
            break;

            // Float32Array or JS Array
        case '1fv':
            gl.uniform1fv(location, value);
            break;

            // Float32Array or JS Array
        case '2fv':
            gl.uniform2fv(location, value);
            break;

            // Float32Array or JS Array
        case '3fv':
            gl.uniform3fv(location, value);
            break;

            // Float32Array or JS Array
        case '4fv':
            gl.uniform4fv(location, value);
            break;

            // Float32Array or JS Array
        case 'm2':
        case 'mat2':
        case 'Matrix2fv':
            gl.uniformMatrix2fv(location, uniform.transpose||false, value);
            break;

            // Float32Array or JS Array
        case 'm3':
        case 'mat3':
        case 'Matrix3fv':

            gl.uniformMatrix3fv(location, uniform.transpose||false, value);
            break;

            // Float32Array or JS Array
        case 'm4':
        case 'mat4':
        case 'Matrix4fv':
            gl.uniformMatrix4fv(location, uniform.transpose||false, value);
            break;

            // a Color Value
        case 'c':
            if (typeof value === 'number') {
                value = utils.hex2rgb(value);
            }

            gl.uniform3f(location, value[0], value[1], value[2]);
            break;

            // flat array of integers (JS or typed array)
        case 'iv1':
            gl.uniform1iv(location, value);
            break;

            // flat array of integers with 3 x N size (JS or typed array)
        case 'iv':
            gl.uniform3iv(location, value);
            break;

            // flat array of floats (JS or typed array)
        case 'fv1':
            gl.uniform1fv(location, value);
            break;

            // flat array of floats with 3 x N size (JS or typed array)
        case 'fv':
            gl.uniform3fv(location, value);
            break;

            // array of 2D Point objects
        case 'v2v':
            if (!uniform._array) {
                uniform._array = new Float32Array(2 * value.length);
            }

            for (i = 0, il = value.length; i < il; ++i) {
                uniform._array[i * 2] = value[i].x;
                uniform._array[i * 2 + 1] = value[i].y;
            }

            gl.uniform2fv(location, uniform._array);
            break;

            // array of 3D Point objects
        case 'v3v':
            if (!uniform._array) {
                uniform._array = new Float32Array(3 * value.length);
            }

            for (i = 0, il = value.length; i < il; ++i) {
                uniform._array[i * 3] = value[i].x;
                uniform._array[i * 3 + 1] = value[i].y;
                uniform._array[i * 3 + 2] = value[i].z;

            }

            gl.uniform3fv(location, uniform._array);
            break;

            // array of 4D Point objects
        case 'v4v':
            if (!uniform._array) {
                uniform._array = new Float32Array(4 * value.length);
            }

            for (i = 0, il = value.length; i < il; ++i) {
                uniform._array[i * 4] = value[i].x;
                uniform._array[i * 4 + 1] = value[i].y;
                uniform._array[i * 4 + 2] = value[i].z;
                uniform._array[i * 4 + 3] = value[i].w;

            }

            gl.uniform4fv(location, uniform._array);
            break;

            // PIXI.Texture
        case 't':
        case 'sampler2D':

            if (!uniform.value || !uniform.value.baseTexture.hasLoaded) {
                break;
            }

            // activate this texture
            gl.activeTexture(gl['TEXTURE' + this.textureCount]);

            var texture = uniform.value.baseTexture.texture;

            if (!texture) {
                this.initSampler2D(uniform);

                // set the textur to the newly created one..
                texture = uniform.value.baseTexture.texture;
            }

            // bind the texture
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // set uniform to texture index
            gl.uniform1i(uniform._location, this.textureCount);

            // increment next texture id
            this.textureCount++;

            break;

        default:
            console.warn('jcw2d.js Shader Warning: Unknown uniform type: ' + uniform.type);
    }
};

Shader.prototype.syncUniforms = function() {
    this.textureCount = 1;

    for (var key in this.uniforms) {
        this.syncUniform(this.uniforms[key]);
    }
};

Shader.prototype.initSampler2D = function(uniform) {
    var gl = this.gl;

    var texture = uniform.value.baseTexture;

    if (!texture.hasLoaded) {
        return;
    }

    this.updateTexture(texture);
};

Shader.prototype.updateTexture = function(texture) {
    texture = texture.baseTexture || texture;

    if (!texture.hasLoaded) {
        return;
    }

    var gl = this.gl;

    if (!texture.texture) {
        texture.texture = gl.createTexture();
        texture.on('update', this.updateTexture, this);
    }


    gl.bindTexture(gl.TEXTURE_2D, texture.texture);

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture.premultipliedAlpha);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.source);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, texture.scaleMode === JC.SCALE_MODES.LINEAR ? gl.LINEAR : gl.NEAREST);


    if (texture.mipmap && texture.isPowerOfTwo) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texture.scaleMode === JC.SCALE_MODES.LINEAR ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
    } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texture.scaleMode === JC.SCALE_MODES.LINEAR ? gl.LINEAR : gl.NEAREST);
    }

    if (!texture.isPowerOfTwo) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }

    return texture.texture;
};

Shader.prototype._glCompile = function(type, src) {
    var shader = this.gl.createShader(type);

    this.gl.shaderSource(shader, src);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        console.log(this.gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
};

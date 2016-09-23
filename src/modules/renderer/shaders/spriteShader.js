function SpriteShader(gl) {
    var uniforms = {
        uAlpha: { type: '1f', value: 1 },
        uSampler: { type: 'sampler2D', value: 0 },
        projectionMatrix: {
            type: 'mat3',
            value: new Float32Array([1, 0, 0,
                0, 1, 0,
                0, 0, 1
            ])
        },
        projectionVector: {
            type: '2fv',
            value: new Float32Array([1, 1])
        }
    };

    if (customUniforms) {
        for (var u in customUniforms) {
            uniforms[u] = customUniforms[u];
        }
    }


    var attributes = {
        aVertexPosition: 0,
        aTextureCoord: 0,
        aColor: 0
    };

    if (customAttributes) {
        for (var a in customAttributes) {
            attributes[a] = customAttributes[a];
        }
    }

    var vertexSrc = [
        'precision lowp float;',
        'attribute vec2 aVertexPosition;',
        'attribute vec2 aTextureCoord;',
        'attribute vec4 aColor;',

        'uniform mat3 projectionMatrix;',
        'uniform vec2 projectionVector;',

        'varying vec2 vTextureCoord;',
        'varying vec4 vColor;',

        'void main(void){',
        '   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy / projectionVector, 0.0, 1.0);',
        '   vTextureCoord = aTextureCoord;',
        '   vColor = vec4(aColor.rgb * aColor.a, aColor.a);',
        '}'
    ].join('\n');

    var fragmentSrc = [
        'precision lowp float;',

        'varying vec2 vTextureCoord;',
        'varying vec4 vColor;',

        'uniform sampler2D uSampler;',
        'uniform float uAlpha;',

        'void main(void){',
        '   gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor * uAlpha;',
        '}'
    ].join('\n');


    Shader.call(this, gl, vertexSrc, fragmentSrc, uniforms, attributes);
}

// constructor
SpriteShader.prototype = Object.create(Shader.prototype);
SpriteShader.prototype.constructor = SpriteShader;

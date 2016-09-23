function ParticleShader(shaderManager) {
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
        aAlpha: 0,
        aPositionCoord: 0,
        aRotation: 0
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
        'attribute float aAlpha;',

        'attribute vec2 aPositionCoord;',
        'attribute float aRotation;',

        'uniform mat3 projectionMatrix;',
        'uniform vec2 projectionVector;',

        'varying vec2 vTextureCoord;',
        'varying float vAlpha;',

        'void main(void){',
        '   vec2 v = aVertexPosition;',

        '   v.x = (aVertexPosition.x) * cos(aRotation) - (aVertexPosition.y) * sin(aRotation);',
        '   v.y = (aVertexPosition.x) * sin(aRotation) + (aVertexPosition.y) * cos(aRotation);',
        '   v = v + aPositionCoord;',

        '   gl_Position = vec4((projectionMatrix * vec3(v, 1.0)).xy / projectionVector, 0.0, 1.0);',

        '   vTextureCoord = aTextureCoord;',
        '   vAlpha = aAlpha;',
        '}'
    ].join('\n');

    var fragmentSrc = [
        'precision lowp float;',

        'varying vec2 vTextureCoord;',
        'varying float vAlpha;',

        'uniform sampler2D uSampler;',
        'uniform float uAlpha;',

        'void main(void){',
        '  vec4 color = texture2D(uSampler, vTextureCoord) * vAlpha * uAlpha;',
        '  if (color.a == 0.0) discard;',
        '  gl_FragColor = color;',
        '}'
    ].join('\n');


    Shader.call(this, gl, vertexSrc, fragmentSrc, uniforms, attributes);

}

ParticleShader.prototype = Object.create(TextureShader.prototype);
ParticleShader.prototype.constructor = ParticleShader;

module.exports = ParticleShader;

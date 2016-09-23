function GraphicsShader(shaderManager) {
    Shader.call(this,
        shaderManager,
        // vertex shader
        [
            'attribute vec2 aVertexPosition;',
            'attribute vec4 aColor;',

            'uniform mat3 projectionMatrix;',
            'uniform vec2 projectionVector;',

            'uniform float alpha;',
            'uniform vec3 tint;',

            'varying vec4 vColor;',

            'void main(void){',
            '   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy / projectionVector, 0.0, 1.0);',
            '   vColor = aColor * vec4(tint * alpha, alpha);',
            '}'
        ].join('\n'),
        // fragment shader
        [
            'precision mediump float;',

            'varying vec4 vColor;',

            'void main(void){',
            '   gl_FragColor = vColor;',
            '}'
        ].join('\n'),
        // custom uniforms
        {
            tint: { type: '3f', value: [0, 0, 0] },
            alpha: { type: '1f', value: 0 },
            projectionMatrix: { type: 'mat3', value: new Float32Array(9) },
            projectionVector: {
                type: '2fv',
                value: new Float32Array([1, 1])
            }
        },
        // custom attributes
        {
            aVertexPosition: 0,
            aColor: 0
        }
    );
}

GraphicsShader.prototype = Object.create(Shader.prototype);
GraphicsShader.prototype.constructor = GraphicsShader;


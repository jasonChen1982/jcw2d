import Shader from './Shader';

/**
 * @class
 * @memberof PIXI
 * @extends PIXI.Shader
 * @param {PIXI.ShaderManager} shaderManager The webgl shader manager this shader works for.
 * @param {string} [vertexSrc] The source of the vertex shader.
 * @param {string} [fragmentSrc] The source of the fragment shader.
 * @param {object} [customUniforms] Custom uniforms to use to augment the built-in ones.
 * @param {string} [customAttributes] The source of the fragment shader.
 */
function TextureShader(shaderManager, vertexSrc, fragmentSrc, customUniforms, customAttributes) {
  let uniforms = {

    uSampler: {type: 'sampler2D', value: 0},
    projectionMatrix: {type: 'mat3', value: new Float32Array([1, 0, 0,
      0, 1, 0,
      0, 0, 1])},
  };

  if (customUniforms) {
    for (let u in customUniforms) {
      uniforms[u] = customUniforms[u];
    }
  }


  let attributes = {
    aVertexPosition: 0,
    aTextureCoord: 0,
    aColor: 0,
  };

  if (customAttributes) {
    for (let a in customAttributes) {
      attributes[a] = customAttributes[a];
    }
  }

  /**
     * The vertex shader.
     *
     * @member {string}
     */
  vertexSrc = vertexSrc || TextureShader.defaultVertexSrc;

  /**
     * The fragment shader.
     *
     * @member {string}
     */
  fragmentSrc = fragmentSrc || TextureShader.defaultFragmentSrc;

  Shader.call(this, shaderManager, vertexSrc, fragmentSrc, uniforms, attributes);
}

// constructor
TextureShader.prototype = Object.create(Shader.prototype);
TextureShader.prototype.constructor = TextureShader;

/**
 * The default vertex shader source
 *
 * @static
 * @constant
 */
TextureShader.defaultVertexSrc = [
  'precision lowp float;',
  'attribute vec2 aVertexPosition;',
  'attribute vec2 aTextureCoord;',
  'attribute vec4 aColor;',

  'uniform mat3 projectionMatrix;',

  'varying vec2 vTextureCoord;',
  'varying vec4 vColor;',

  'void main(void){',
  '   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);',
  '   vTextureCoord = aTextureCoord;',
  '   vColor = vec4(aColor.rgb * aColor.a, aColor.a);',
  '}',
].join('\n');

/**
 * The default fragment shader source
 *
 * @static
 * @constant
 */
TextureShader.defaultFragmentSrc = [
  'precision lowp float;',

  'varying vec2 vTextureCoord;',
  'varying vec4 vColor;',

  'uniform sampler2D uSampler;',

  'void main(void){',
  '   gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor ;',
  '}',
].join('\n');

export default TextureShader;

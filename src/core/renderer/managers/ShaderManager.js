import WebGLManager from './WebGLManager';
import TextureShader from '../shaders/TextureShader';
import ComplexPrimitiveShader from '../shaders/ComplexPrimitiveShader';
import PrimitiveShader from '../shaders/PrimitiveShader';
import utils from '../../../utils';

/**
 * @class
 * @memberof PIXI
 * @extends PIXI.WebGLManager
 * @param {PIXI.WebGLRenderer} renderer The renderer this manager works for.
 */
function ShaderManager(renderer) {
  WebGLManager.call(this, renderer);

  /**
     * @member {number}
     */
  this.maxAttibs = 10;

  /**
     * @member {any[]}
     */
  this.attribState = [];

  /**
     * @member {any[]}
     */
  this.tempAttribState = [];

  for (let i = 0; i < this.maxAttibs; i++) {
    this.attribState[i] = false;
  }

  /**
     * @member {any[]}
     */
  this.stack = [];

  /**
     * @member {number}
     * @private
     */
  this._currentId = -1;

  /**
     * @member {PIXI.Shader}
     * @private
     */
  this.currentShader = null;

//    this.initPlugins();
}

ShaderManager.prototype = Object.create(WebGLManager.prototype);
ShaderManager.prototype.constructor = ShaderManager;
utils.pluginTarget.mixin(ShaderManager);

/**
 * Called when there is a WebGL context change.
 *
 */
ShaderManager.prototype.onContextChange = function() {
  this.initPlugins();

  let gl = this.renderer.gl;

  // get the maximum number of attribute correctly as this tends to vary
  this.maxAttibs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);

  this.attribState = [];

  for (let i = 0; i < this.maxAttibs; i++) {
    this.attribState[i] = false;
  }

  // TODO - Why are these not plugins? We can't decouple primitives unless they are....
  this.defaultShader = new TextureShader(this);
  this.primitiveShader = new PrimitiveShader(this);
  this.complexPrimitiveShader = new ComplexPrimitiveShader(this);
};

/**
 * Takes the attributes given in parameters and uploads them.
 *
 * @param {any[]} attribs attribs
 */
ShaderManager.prototype.setAttribs = function(attribs) {
  // reset temp state
  let i;

  for (i = 0; i < this.tempAttribState.length; i++) {
    this.tempAttribState[i] = false;
  }

  // set the new attribs
  for (let a in attribs) {
    this.tempAttribState[attribs[a]] = true;
  }

  let gl = this.renderer.gl;

  for (i = 0; i < this.attribState.length; i++) {
    if (this.attribState[i] !== this.tempAttribState[i]) {
      this.attribState[i] = this.tempAttribState[i];

      if (this.attribState[i]) {
        gl.enableVertexAttribArray(i);
      } else {
        gl.disableVertexAttribArray(i);
      }
    }
  }
};

/**
 * Sets the current shader.
 *
 * @param {PIXI.Shader} shader the shader to upload
 * @return {boolean}
 */
ShaderManager.prototype.setShader = function(shader) {
  if (this._currentId === shader.uid) {
    return false;
  }

  this._currentId = shader.uid;

  this.currentShader = shader;

  this.renderer.gl.useProgram(shader.program);
  this.setAttribs(shader.attributes);

  return true;
};

/**
 * Destroys this object.
 *
 */
ShaderManager.prototype.destroy = function() {
  this.primitiveShader.destroy();
  this.complexPrimitiveShader.destroy();
  WebGLManager.prototype.destroy.call(this);

  this.destroyPlugins();

  this.attribState = null;

  this.tempAttribState = null;
};

export default ShaderManager;

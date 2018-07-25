import WebGLManager from './WebGLManager';

/**
 * @class
 * @memberof PIXI
 * @extends PIXI.WebGlManager
 * @param {PIXI.WebGLRenderer} renderer The renderer this manager works for.
 */
function BlendModeManager(renderer) {
  WebGLManager.call(this, renderer);

  /**
   * @member {number}
   */
  this.currentBlendMode = 99999;
}

BlendModeManager.prototype = Object.create(WebGLManager.prototype);
BlendModeManager.prototype.constructor = BlendModeManager;

/**
 * Sets-up the given blendMode from WebGL's point of view.
 *
 * @param {number} blendMode the blendMode, should be a Pixi const, such as `PIXI.BLEND_MODES.ADD`. See {@link PIXI.BLEND_MODES} for possible values.
 * @return {boolean}
 */
BlendModeManager.prototype.setBlendMode = function(blendMode) {
  if (this.currentBlendMode === blendMode) {
    return false;
  }

  this.currentBlendMode = blendMode;

  let mode = this.renderer.blendModes[this.currentBlendMode];
  this.renderer.gl.blendFunc(mode[0], mode[1]);

  return true;
};

export default BlendModeManager;

function ParticleContainer(maxSize, properties, batchSize) {
  JC.Container.call(this);

  batchSize = batchSize || 15000; // CONST.SPRITE_BATCH_SIZE; // 2000 is a nice balance between mobile / desktop
  maxSize = maxSize || 15000;

  // Making sure the batch size is valid
  // 65535 is max vertex index in the index buffer (see ParticleRenderer)
  // so max number of particles is 65536 / 4 = 16384
  let maxBatchSize = 16384;
  if (batchSize > maxBatchSize) {
    batchSize = maxBatchSize;
  }

  if (batchSize > maxSize) {
    batchSize = maxSize;
  }

  /**
     * Set properties to be dynamic (true) / static (false)
     *
     * @member {boolean[]}
     * @private
     */
  this._properties = [false, true, false, false, false];

  /**
     * @member {number}
     * @private
     */
  this._maxSize = maxSize;

  /**
     * @member {number}
     * @private
     */
  this._batchSize = batchSize;

  /**
     * @member {WebGLBuffer}
     * @private
     */
  this._buffers = null;

  /**
     * @member {number}
     * @private
     */
  this._bufferToUpdate = 0;

  /**
     * @member {boolean}
     *
     */
  this.interactiveChildren = false;

  /**
     * The blend mode to be applied to the sprite. Apply a value of `PIXI.BLEND_MODES.NORMAL` to reset the blend mode.
     *
     * @member {number}
     * @default PIXI.BLEND_MODES.NORMAL
     * @see PIXI.BLEND_MODES
     */
  this.blendMode = JC.CONST.BLEND_MODES.NORMAL;

  this.setProperties(properties);
}

JC.ParticleContainer = ParticleContainer;
ParticleContainer.prototype = Object.create(JC.Container.prototype);
ParticleContainer.prototype.constructor = JC.ParticleContainer;

/**
 * Sets the private properties array to dynamic / static based on the passed properties object
 *
 * @param properties {object} The properties to be uploaded
 */
ParticleContainer.prototype.setProperties = function(properties) {
  if (properties) {
    this._properties[0] = 'scale' in properties ? !!properties.scale : this._properties[0];
    this._properties[1] = 'position' in properties ? !!properties.position : this._properties[1];
    this._properties[2] = 'rotation' in properties ? !!properties.rotation : this._properties[2];
    this._properties[3] = 'uvs' in properties ? !!properties.uvs : this._properties[3];
    this._properties[4] = 'alpha' in properties ? !!properties.alpha : this._properties[4];
  }
};

ParticleContainer.prototype.updateTransform = function() {
  this.displayObjectUpdateTransform();
};

ParticleContainer.prototype.render = function(session) {
  if (!this.visible || this.worldAlpha <= 0 || !this.children.length || !this.renderable) {
    return;
  }

  renderer.setObjectRenderer(renderer.plugins.particle);
  renderer.plugins.particle.render(this);
};

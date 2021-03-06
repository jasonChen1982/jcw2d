import ObjectRenderer from '../../renderers/webgl/utils/ObjectRenderer';
import WebGLRenderer from '../../renderers/webgl/WebGLRenderer';
import CONST from '../../const';

/**
 * @author Mat Groves
 *
 * Big thanks to the very clever Matt DesLauriers <mattdesl> https://github.com/mattdesl/
 * for creating the original pixi version!
 * Also a thanks to https://github.com/bchevalier for tweaking the tint and alpha so that they now share 4 bytes on the vertex buffer
 *
 * Heavily inspired by LibGDX's SpriteRenderer:
 * https://github.com/libgdx/libgdx/blob/master/gdx/src/com/badlogic/gdx/graphics/g2d/SpriteRenderer.java
 */

/**
 *
 * @class
 * @private
 * @memberof PIXI
 * @extends PIXI.ObjectRenderer
 * @param {WebGLRenderer} renderer The renderer this sprite batch works for.
 */
function SpriteRenderer(renderer) {
  ObjectRenderer.call(this, renderer);

  /**
   *
   *
   * @member {number}
   */
  this.vertSize = 5;

  /**
   *
   *
   * @member {number}
   */
  this.vertByteSize = this.vertSize * 4;

  /**
   * The number of images in the SpriteBatch before it flushes.
   *
   * @member {number}
   */
  this.size = CONST.SPRITE_BATCH_SIZE; // 2000 is a nice balance between mobile / desktop

  // the total number of bytes in our batch
  let numVerts = this.size * 4 * this.vertByteSize;
  // the total number of indices in our batch
  let numIndices = this.size * 6;

  /**
   * Holds the vertices
   *
   * @member {ArrayBuffer}
   */
  this.vertices = new ArrayBuffer(numVerts);

  /**
   * View on the vertices as a Float32Array
   *
   * @member {Float32Array}
   */
  this.positions = new Float32Array(this.vertices);

  /**
   * Holds the color components
   *
   * @member {Uint32Array}
   */
  this.colors = new Uint32Array(this.vertices);

  /**
   * Holds the indices
   *
   * @member {Uint16Array}
   */
  this.indices = new Uint16Array(numIndices);

  /**
   *
   *
   * @member {number}
   */
  this.lastIndexCount = 0;

  for (let i = 0, j = 0; i < numIndices; i += 6, j += 4) {
    this.indices[i + 0] = j + 0;
    this.indices[i + 1] = j + 1;
    this.indices[i + 2] = j + 2;
    this.indices[i + 3] = j + 0;
    this.indices[i + 4] = j + 2;
    this.indices[i + 5] = j + 3;
  }

  /**
   *
   *
   * @member {boolean}
   */
  this.drawing = false;

  /**
   *
   *
   * @member {number}
   */
  this.currentBatchSize = 0;

  /**
   *
   *
   * @member {BaseTexture}
   */
  this.currentBaseTexture = null;

  /**
   *
   *
   * @member {Array}
   */
  this.textures = [];

  /**
   *
   *
   * @member {Array}
   */
  this.blendModes = [];

  /**
   *
   *
   * @member {Array}
   */
  this.shaders = [];

  /**
   *
   *
   * @member {Array}
   */
  this.sprites = [];

  /**
   * The default shader that is used if a sprite doesn't have a more specific one.
   *
   * @member {Shader}
   */
  this.shader = null;
}

SpriteRenderer.prototype = Object.create(ObjectRenderer.prototype);
SpriteRenderer.prototype.constructor = SpriteRenderer;

WebGLRenderer.registerPlugin('sprite', SpriteRenderer);

/**
 * Sets up the renderer context and necessary buffers.
 *
 * @private
 * @param {WebGLRenderingContext} gl the current WebGL drawing context
 */
SpriteRenderer.prototype.onContextChange = function() {
  let gl = this.renderer.gl;

  // setup default shader
  this.shader = this.renderer.shaderManager.defaultShader;

  // create a couple of buffers
  this.vertexBuffer = gl.createBuffer();
  this.indexBuffer = gl.createBuffer();

  // 65535 is max index, so 65535 / 6 = 10922.

  // upload the index data
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);

  this.currentBlendMode = 99999;
};

/**
 * Renders the sprite object.
 *
 * @param {Sprite} sprite the sprite to render when using this spritebatch
 */
SpriteRenderer.prototype.render = function(sprite) {
  let texture = sprite._texture;

  // TODO set blend modes..
  // check texture..
  if (this.currentBatchSize >= this.size) {
    this.flush();
    this.currentBaseTexture = texture.baseTexture;
  }

  // get the uvs for the texture
  let uvs = texture._uvs;

  // if the uvs have not updated then no point rendering just yet!
  if (!uvs) {
    return;
  }

  // TODO trim??
  let aX = sprite.anchor.x;
  let aY = sprite.anchor.y;

  let w0;
  let w1;
  let h0;
  let h1;

  if (texture.trim) {
    // if the sprite is trimmed then we need to add the extra space before transforming the sprite coords..
    let trim = texture.trim;

    w1 = trim.x - aX * trim.width;
    w0 = w1 + texture.crop.width;

    h1 = trim.y - aY * trim.height;
    h0 = h1 + texture.crop.height;
  } else {
    w0 = (texture._frame.width) * (1 - aX);
    w1 = (texture._frame.width) * -aX;

    h0 = texture._frame.height * (1 - aY);
    h1 = texture._frame.height * -aY;
  }

  let index = this.currentBatchSize * this.vertByteSize;

  let worldTransform = sprite.worldTransform;

  let a = worldTransform.a;
  let b = worldTransform.b;
  let c = worldTransform.c;
  let d = worldTransform.d;
  let tx = worldTransform.tx;
  let ty = worldTransform.ty;

  let colors = this.colors;
  let positions = this.positions;

  if (this.renderer.roundPixels) {
    // xy
    positions[index] = a * w1 + c * h1 + tx | 0;
    positions[index + 1] = d * h1 + b * w1 + ty | 0;

    // xy
    positions[index + 5] = a * w0 + c * h1 + tx | 0;
    positions[index + 6] = d * h1 + b * w0 + ty | 0;

    // xy
    positions[index + 10] = a * w0 + c * h0 + tx | 0;
    positions[index + 11] = d * h0 + b * w0 + ty | 0;

    // xy
    positions[index + 15] = a * w1 + c * h0 + tx | 0;
    positions[index + 16] = d * h0 + b * w1 + ty | 0;
  } else {
    // xy
    positions[index] = a * w1 + c * h1 + tx;
    positions[index + 1] = d * h1 + b * w1 + ty;

    // xy
    positions[index + 5] = a * w0 + c * h1 + tx;
    positions[index + 6] = d * h1 + b * w0 + ty;

    // xy
    positions[index + 10] = a * w0 + c * h0 + tx;
    positions[index + 11] = d * h0 + b * w0 + ty;

    // xy
    positions[index + 15] = a * w1 + c * h0 + tx;
    positions[index + 16] = d * h0 + b * w1 + ty;
  }

  // uv
  positions[index + 2] = uvs.x0;
  positions[index + 3] = uvs.y0;

  // uv
  positions[index + 7] = uvs.x1;
  positions[index + 8] = uvs.y1;

  // uv
  positions[index + 12] = uvs.x2;
  positions[index + 13] = uvs.y2;

  // uv
  positions[index + 17] = uvs.x3;
  positions[index + 18] = uvs.y3;

  // color and alpha
  let tint = sprite.tint;
  colors[index + 4] = colors[index + 9] = colors[index + 14] = colors[index + 19] = (tint >> 16) + (tint & 0xff00) + ((tint & 0xff) << 16) + (sprite.worldAlpha * 255 << 24);

  // increment the batchsize
  this.sprites[this.currentBatchSize++] = sprite;
};

/**
 * Renders the content and empties the current batch.
 *
 */
SpriteRenderer.prototype.flush = function() {
  // If the batch is length 0 then return as there is nothing to draw
  if (this.currentBatchSize === 0) {
    return;
  }

  let gl = this.renderer.gl;
  let shader;

  // upload the verts to the buffer
  if (this.currentBatchSize > (this.size * 0.5)) {
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
  } else {
    let view = this.positions.subarray(0, this.currentBatchSize * this.vertByteSize);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);
  }

  let nextTexture;
  let nextBlendMode;
  let nextShader;
  let batchSize = 0;
  let start = 0;

  let currentBaseTexture = null;
  let currentBlendMode = this.renderer.blendModeManager.currentBlendMode;
  let currentShader = null;

  let blendSwap = false;
  let shaderSwap = false;
  let sprite;

  for (let i = 0, j = this.currentBatchSize; i < j; i++) {
    sprite = this.sprites[i];

    nextTexture = sprite._texture.baseTexture;
    nextBlendMode = sprite.blendMode;
    nextShader = sprite.shader || this.shader;

    blendSwap = currentBlendMode !== nextBlendMode;
    shaderSwap = currentShader !== nextShader; // should I use uuidS???

    if (currentBaseTexture !== nextTexture || blendSwap || shaderSwap) {
      this.renderBatch(currentBaseTexture, batchSize, start);

      start = i;
      batchSize = 0;
      currentBaseTexture = nextTexture;

      if (blendSwap) {
        currentBlendMode = nextBlendMode;
        this.renderer.blendModeManager.setBlendMode(currentBlendMode);
      }

      if (shaderSwap) {
        currentShader = nextShader;


        shader = currentShader.shaders ? currentShader.shaders[gl.id] : currentShader;

        if (!shader) {
          shader = currentShader.getShader(this.renderer);
        }

        // set shader function???
        this.renderer.shaderManager.setShader(shader);

        // TODO - i KNOW this can be optimised! Once v3 is stable il look at this next...
        shader.uniforms.projectionMatrix.value = this.renderer.currentRenderTarget.projectionMatrix.toArray(true);
        // Make this a little more dynamic / intelligent!
        shader.syncUniforms();

        // TODO investigate some kind of texture state managment??
        // need to make sure this texture is the active one for all the batch swaps..
        gl.activeTexture(gl.TEXTURE0);

        // both thease only need to be set if they are changing..
        // set the projection
        // gl.uniformMatrix3fv(shader.uniforms.projectionMatrix._location, false, this.renderer.currentRenderTarget.projectionMatrix.toArray(true));
      }
    }

    batchSize++;
  }

  this.renderBatch(currentBaseTexture, batchSize, start);

  // then reset the batch!
  this.currentBatchSize = 0;
};

/**
 * Draws the currently batches sprites.
 *
 * @private
 * @param {Texture} texture
 * @param {number} size
 * @param {number} startIndex
 */
SpriteRenderer.prototype.renderBatch = function(texture, size, startIndex) {
  if (size === 0) {
    return;
  }

  let gl = this.renderer.gl;

  if (!texture._glTextures[gl.id]) {
    this.renderer.updateTexture(texture);
  } else {
    // bind the current texture
    gl.bindTexture(gl.TEXTURE_2D, texture._glTextures[gl.id]);
  }

  // now draw those suckas!
  gl.drawElements(gl.TRIANGLES, size * 6, gl.UNSIGNED_SHORT, startIndex * 6 * 2);

  // increment the draw count
  this.renderer.drawCount++;
};

/**
 * Starts a new sprite batch.
 *
 */
SpriteRenderer.prototype.start = function() {
  let gl = this.renderer.gl;

  // bind the main texture


  // bind the buffers
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

  // this is the same for each shader?
  let stride = this.vertByteSize;
  gl.vertexAttribPointer(this.shader.attributes.aVertexPosition, 2, gl.FLOAT, false, stride, 0);
  gl.vertexAttribPointer(this.shader.attributes.aTextureCoord, 2, gl.FLOAT, false, stride, 2 * 4);

  // color attributes will be interpreted as unsigned bytes and normalized
  gl.vertexAttribPointer(this.shader.attributes.aColor, 4, gl.UNSIGNED_BYTE, true, stride, 4 * 4);
};

/**
 * Destroys the SpriteBatch.
 *
 */
SpriteRenderer.prototype.destroy = function() {
  this.renderer.gl.deleteBuffer(this.vertexBuffer);
  this.renderer.gl.deleteBuffer(this.indexBuffer);

  this.shader.destroy();

  this.renderer = null;

  this.vertices = null;
  this.positions = null;
  this.colors = null;
  this.indices = null;

  this.vertexBuffer = null;
  this.indexBuffer = null;

  this.currentBaseTexture = null;

  this.drawing = false;

  this.textures = null;
  this.blendModes = null;
  this.shaders = null;
  this.sprites = null;
  this.shader = null;
};

export default SpriteRenderer;

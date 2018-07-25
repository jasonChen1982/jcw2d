import WebGLManager from './WebGLManager';
import RenderTarget from '../utils/RenderTarget';
import CONST from '../../../const';
import Quad from '../utils/Quad';
import math from '../../../math';

/**
 * @class
 * @memberof PIXI
 * @extends PIXI.WebGLManager
 * @param {PIXI.WebGLRenderer} renderer The renderer this manager works for.
 */
function FilterManager(renderer) {
  WebGLManager.call(this, renderer);

  /**
     * @member {object[]}
     */
  this.filterStack = [];

  this.filterStack.push({
    renderTarget: renderer.currentRenderTarget,
    filter: [],
    bounds: null,
  });

  /**
     * @member {PIXI.RenderTarget[]}
     */
  this.texturePool = [];

  /**
     * The size of the texture
     *
     * @member {PIXI.Rectangle}
     */
  // listen for context and update necessary buffers
  // TODO make this dynamic!
  // TODO test this out by forces power of two?
  this.textureSize = new math.Rectangle(0, 0, renderer.width, renderer.height);

  /**
   * The current frame
   *
   * @member {PIXI.Rectangle}
   */
  this.currentFrame = null;
}

FilterManager.prototype = Object.create(WebGLManager.prototype);
FilterManager.prototype.constructor = FilterManager;


/**
 * Called when there is a WebGL context change.
 *
 */
FilterManager.prototype.onContextChange = function() {
  this.texturePool.length = 0;

  let gl = this.renderer.gl;
  this.quad = new Quad(gl);
};

/**
 * @param {PIXI.WebGLRenderer} filterStack
 */
FilterManager.prototype.setFilterStack = function( filterStack ) {
  this.filterStack = filterStack;
};

/**
 * Applies the filter and adds it to the current filter stack.
 *
 * @param {PIXI.DisplayObject} target
 * @param {PIXI.AbstractFiler[]} filters the filters that will be pushed to the current filter stack
 */
FilterManager.prototype.pushFilter = function(target, filters) {
  // get the bounds of the object..
  // TODO replace clone with a copy to save object creation
  let bounds = target.filterArea ? target.filterArea.clone() : target.getBounds();

  // bounds = bounds.clone();

  // round off the rectangle to get a nice smoooooooth filter :)
  bounds.x = bounds.x | 0;
  bounds.y = bounds.y | 0;
  bounds.width = bounds.width | 0;
  bounds.height = bounds.height | 0;


  // padding!
  let padding = filters[0].padding | 0;
  bounds.x -= padding;
  bounds.y -= padding;
  bounds.width += padding * 2;
  bounds.height += padding * 2;


  if (this.renderer.currentRenderTarget.transform) {
    // TODO this will break if the renderTexture transform is anything other than a translation.
    // Will need to take the full matrix transform into acount..
    let transform = this.renderer.currentRenderTarget.transform;

    bounds.x += transform.tx;
    bounds.y += transform.ty;

    this.capFilterArea( bounds );

    bounds.x -= transform.tx;
    bounds.y -= transform.ty;
  } else {
    this.capFilterArea( bounds );
  }

  if (bounds.width > 0 && bounds.height > 0) {
    this.currentFrame = bounds;

    let texture = this.getRenderTarget();

    this.renderer.setRenderTarget(texture);

    // clear the texture..
    texture.clear();

    // TODO get rid of object creation!
    this.filterStack.push({
      renderTarget: texture,
      filter: filters,
    });
  } else {
    // push somthing on to the stack that is empty
    this.filterStack.push({
      renderTarget: null,
      filter: filters,
    });
  }
};

FilterManager.prototype.popFilter = function() {
  let filterData = this.filterStack.pop();
  let previousFilterData = this.filterStack[this.filterStack.length-1];

  let input = filterData.renderTarget;

  // if the renderTarget is null then we don't apply the filter as its offscreen
  if (!filterData.renderTarget) {
    return;
  }

  let output = previousFilterData.renderTarget;

  // use program
  let gl = this.renderer.gl;


  this.currentFrame = input.frame;

  this.quad.map(this.textureSize, input.frame);


  // TODO.. this probably only needs to be done once!
  gl.bindBuffer(gl.ARRAY_BUFFER, this.quad.vertexBuffer);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.quad.indexBuffer);

  let filters = filterData.filter;

  // assuming all filters follow the correct format??
  gl.vertexAttribPointer(this.renderer.shaderManager.defaultShader.attributes.aVertexPosition, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribPointer(this.renderer.shaderManager.defaultShader.attributes.aTextureCoord, 2, gl.FLOAT, false, 0, 2 * 4 * 4);
  gl.vertexAttribPointer(this.renderer.shaderManager.defaultShader.attributes.aColor, 4, gl.FLOAT, false, 0, 4 * 4 * 4);

  // restore the normal blendmode!
  this.renderer.blendModeManager.setBlendMode(CONST.BLEND_MODES.NORMAL);

  if (filters.length === 1) {
    // TODO (cengler) - There has to be a better way then setting this each time?
    if (filters[0].uniforms.dimensions) {
      filters[0].uniforms.dimensions.value[0] = this.renderer.width;
      filters[0].uniforms.dimensions.value[1] = this.renderer.height;
      filters[0].uniforms.dimensions.value[2] = this.quad.vertices[0];
      filters[0].uniforms.dimensions.value[3] = this.quad.vertices[5];
    }

    filters[0].applyFilter( this.renderer, input, output );
    this.returnRenderTarget( input );
  } else {
    let flipTexture = input;
    let flopTexture = this.getRenderTarget(true);

    for (let i = 0; i < filters.length-1; i++) {
      let filter = filters[i];

      // TODO (cengler) - There has to be a better way then setting this each time?
      if (filter.uniforms.dimensions) {
        filter.uniforms.dimensions.value[0] = this.renderer.width;
        filter.uniforms.dimensions.value[1] = this.renderer.height;
        filter.uniforms.dimensions.value[2] = this.quad.vertices[0];
        filter.uniforms.dimensions.value[3] = this.quad.vertices[5];
      }

      filter.applyFilter( this.renderer, flipTexture, flopTexture );

      let temp = flipTexture;
      flipTexture = flopTexture;
      flopTexture = temp;
    }

    filters[filters.length-1].applyFilter( this.renderer, flipTexture, output );

    this.returnRenderTarget( flipTexture );
    this.returnRenderTarget( flopTexture );
  }

  return filterData.filter;
};

/**
 * Grabs an render target from the internal pool
 *
 * @param {boolean} clear Whether or not we need to clear the RenderTarget
 * @return {RenderTarget}
 */
FilterManager.prototype.getRenderTarget = function( clear ) {
  let renderTarget = this.texturePool.pop() || new RenderTarget(this.renderer.gl, this.textureSize.width, this.textureSize.height, CONST.SCALE_MODES.LINEAR, this.renderer.resolution * CONST.FILTER_RESOLUTION);
  renderTarget.frame = this.currentFrame;

  if (clear) {
    renderTarget.clear(true);
  }

  return renderTarget;
};

/*
 * Returns a RenderTarget to the internal pool
 * @param renderTarget {RenderTarget} The RenderTarget we want to return to the pool
 */
FilterManager.prototype.returnRenderTarget = function(renderTarget) {
  this.texturePool.push( renderTarget );
};

/*
 * Applies the filter
 * @param shader {Shader} The shader to upload
 * @param inputTarget {RenderTarget}
 * @param outputTarget {RenderTarget}
 * @param clear {boolean} Whether or not we want to clear the outputTarget
 */
FilterManager.prototype.applyFilter = function(shader, inputTarget, outputTarget, clear) {
  let gl = this.renderer.gl;

  this.renderer.setRenderTarget(outputTarget);

  if (clear) {
    outputTarget.clear();
  }

  // set the shader
  this.renderer.shaderManager.setShader(shader);

  // TODO (cengler) - Can this be cached and not `toArray`ed each frame?
  shader.uniforms.projectionMatrix.value = this.renderer.currentRenderTarget.projectionMatrix.toArray(true);

  // TODO can this be optimised?
  shader.syncUniforms();
  /*
    gl.vertexAttribPointer(shader.attributes.aVertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(shader.attributes.aTextureCoord, 2, gl.FLOAT, false, 0, 2 * 4 * 4);
    gl.vertexAttribPointer(shader.attributes.aColor, 4, gl.FLOAT, false, 0, 4 * 4 * 4);
*/

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, inputTarget.texture);

  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0 );
  this.renderer.drawCount++;
};

/*
 * Calculates the mapped matrix
 * @param filterArea {Rectangle} The filter area
 * @param sprite {Sprite} the target sprite
 * @param outputMatrix {Matrix} @alvin
 */
FilterManager.prototype.calculateMappedMatrix = function(filterArea, sprite, outputMatrix) {
  const worldTransform = sprite.worldTransform.copy(math.Matrix.TEMP_MATRIX);
  const texture = sprite._texture.baseTexture;

  let mappedMatrix = outputMatrix.identity();

  // scale..
  let ratio = this.textureSize.height / this.textureSize.width;

  mappedMatrix.translate(filterArea.x / this.textureSize.width, filterArea.y / this.textureSize.height );

  mappedMatrix.scale(1, ratio);

  let translateScaleX = (this.textureSize.width / texture.width);
  let translateScaleY = (this.textureSize.height / texture.height);

  worldTransform.tx /= texture.width * translateScaleX;
  worldTransform.ty /= texture.width * translateScaleX;

  worldTransform.invert();

  mappedMatrix.prepend(worldTransform);

  // apply inverse scale..
  mappedMatrix.scale(1, 1/ratio);

  mappedMatrix.scale( translateScaleX, translateScaleY );

  mappedMatrix.translate(sprite.anchor.x, sprite.anchor.y);

  return mappedMatrix;

  // Keeping the orginal as a reminder to me on how this works!
  //
  // var m = new math.Matrix();

  // // scale..
  // var ratio = this.textureSize.height / this.textureSize.width;

  // m.translate(filterArea.x / this.textureSize.width, filterArea.y / this.textureSize.height);


  // m.scale(1 , ratio);


  // var transform = wt.clone();

  // var translateScaleX = (this.textureSize.width / 620);
  // var translateScaleY = (this.textureSize.height / 380);

  // transform.tx /= 620 * translateScaleX;
  // transform.ty /= 620 * translateScaleX;

  // transform.invert();

  // transform.append(m);

  // // apply inverse scale..
  // transform.scale(1 , 1/ratio);

  // transform.scale( translateScaleX , translateScaleY );

  // return transform;
};

/*
 * Constrains the filter area to the texture size
 * @param filterArea {Rectangle} The filter area we want to cap
 */
FilterManager.prototype.capFilterArea = function(filterArea) {
  if (filterArea.x < 0) {
    filterArea.width += filterArea.x;
    filterArea.x = 0;
  }

  if (filterArea.y < 0) {
    filterArea.height += filterArea.y;
    filterArea.y = 0;
  }

  if ( filterArea.x + filterArea.width > this.textureSize.width ) {
    filterArea.width = this.textureSize.width - filterArea.x;
  }

  if ( filterArea.y + filterArea.height > this.textureSize.height ) {
    filterArea.height = this.textureSize.height - filterArea.y;
  }
};

/*
 * Resizes all the render targets in the pool
 * @param width {number} the new width
 * @param height {number} the new height
 */
FilterManager.prototype.resize = function( width, height ) {
  this.textureSize.width = width;
  this.textureSize.height = height;

  for (let i = 0; i < this.texturePool.length; i++) {
    this.texturePool[i].resize( width, height );
  }
};

/**
 * Destroys the filter and removes it from the filter stack.
 *
 */
FilterManager.prototype.destroy = function() {
  this.quad.destroy();

  WebGLManager.prototype.destroy.call(this);

  this.filterStack = null;
  this.offsetY = 0;

  // destroy textures
  for (let i = 0; i < this.texturePool.length; i++) {
    this.texturePool[i].destroy();
  }

  this.texturePool = null;
};

export default FilterManager;

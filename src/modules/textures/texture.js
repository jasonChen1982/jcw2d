function Texture(baseTexture, frame) {
  JC.Eventer.call(this);

  this.noFrame = false;

  if (!frame) {
    this.noFrame = true;
    frame = new JC.Rectangle(0, 0, 1, 1);
  }

  if (baseTexture instanceof Texture) {
    baseTexture = baseTexture.baseTexture;
  }

  this.baseTexture = baseTexture;

  this._frame = frame;

  this.valid = false;

  this.requiresUpdate = false;

  this._uvs = null;

  this.width = 0;

  this.height = 0;

  if (baseTexture.hasLoaded) {
    if (this.noFrame) {
      frame = new JC.Rectangle(0, 0, baseTexture.width, baseTexture.height);

      // if there is no frame we should monitor for any base texture changes..
      baseTexture.on('update', this.onBaseTextureUpdated.bind(this));
    }
    this.frame = frame;
  } else {
    baseTexture.once('loaded', this.onBaseTextureLoaded.bind(this));
  }
}
JC.Texture = Texture;
Texture.prototype = Object.create(JC.Eventer.prototype);
Texture.prototype.constructor = Texture;

Object.defineProperties(Texture.prototype, {
  frame: {
    get: function() {
      return this._frame;
    },
    set: function(frame) {
      this._frame = frame;

      this.noFrame = false;

      this.width = frame.width;
      this.height = frame.height;

      this.valid = frame && frame.width && frame.height && this.baseTexture.hasLoaded;
      if (this.valid) {
        this._updateUvs();
      }
    },
  },
});

Texture.prototype.update = function() {
  this.baseTexture.update();
};

Texture.prototype.onBaseTextureLoaded = function() {
  // TODO this code looks confusing.. boo to abusing getters and setterss!
  if (this.noFrame) {
    this.frame = new JC.Rectangle(0, 0, this.baseTexture.width, this.baseTexture.height);
  } else {
    this.frame = this._frame;
  }

  this.emit({type: 'loaded'});
};

Texture.prototype.onBaseTextureUpdated = function() {
  this._frame.width = this.baseTexture.width;
  this._frame.height = this.baseTexture.height;

  this.emit({type: 'update'});
};

Texture.prototype._updateUvs = function() {
  if (!this._uvs) {
    this._uvs = new TextureUvs();
  }
  this._uvs.set(this.frame, this.baseTexture);
};

Texture.fromImage = function(imageUrl, crossorigin, scaleMode) {
  let texture = JC.UTILS.TextureCache[imageUrl];

  if (!texture) {
    texture = new Texture(BaseTexture.fromImage(imageUrl, crossorigin, scaleMode));
    JC.UTILS.TextureCache[imageUrl] = texture;
  }

  return texture;
};

Texture.fromCanvas = function(canvas, scaleMode) {
  return new Texture(BaseTexture.fromCanvas(canvas, scaleMode));
};

function BaseTexture(source, scaleMode) {
    JC.Eventer.call(this);

    this.width = 100;

    this.height = 100;

    this.realWidth = 100;

    this.realHeight = 100;

    this.scaleMode = scaleMode || JC.CONST.SCALE_MODES.DEFAULT;

    this.hasLoaded = false;

    this.isLoading = false;

    this.source = null; // set in loadSource, if at all

    this.resolution = 1;

    this.premultipliedAlpha = true;

    this.imageUrl = null;

    this.isPowerOfTwo = false;

    this.mipmap = false;

    // this._glTextures = {};

    // if no source passed don't try to load
    if (source) {
        this.loadSource(source);
    }

}

BaseTexture.prototype = Object.create(JC.Eventer.prototype);
BaseTexture.prototype.constructor = BaseTexture;

BaseTexture.prototype.update = function() {
    this.realWidth = this.source.naturalWidth || this.source.width;
    this.realHeight = this.source.naturalHeight || this.source.height;

    this.width = this.realWidth / this.resolution;
    this.height = this.realHeight / this.resolution;

    this.isPowerOfTwo = JC.UTILS.isPowerOfTwo(this.realWidth, this.realHeight);

    this.emit({ type: 'update' });
};

BaseTexture.prototype.loadSource = function(source) {
    var wasLoading = this.isLoading;
    this.hasLoaded = false;
    this.isLoading = false;

    this.source = source;

    if ((this.source.complete || this.source.getContext) && this.source.width && this.source.height) {
        this._sourceLoaded();
    } else if (!source.getContext) {
        this.isLoading = true;

        var This = this;

        source.onload = function() {
            source.onload = null;
            source.onerror = null;

            This.isLoading = false;
            This._sourceLoaded();
            This.emit({ type: 'loaded' });
        };

        source.onerror = function() {
            source.onload = null;
            source.onerror = null;

            This.isLoading = false;
            This.emit({ type: 'error' });
        };

        if (source.complete && source.src) {
            this.isLoading = false;

            source.onload = null;
            source.onerror = null;

            if (source.width && source.height) {
                this._sourceLoaded();

                // If any previous subscribers possible
                if (wasLoading) {
                    this.emit({ type: 'loaded' });
                }
            } else {
                // If any previous subscribers possible
                if (wasLoading) {
                    this.emit({ type: 'error' });
                }
            }
        }
    }
};

BaseTexture.prototype._sourceLoaded = function() {
    this.hasLoaded = true;
    this.update();
};
BaseTexture.fromImage = function(imageUrl, crossorigin, scaleMode) {
    var baseTexture = JC.UTILS.BaseTextureCache[imageUrl];

    if (crossorigin === undefined && imageUrl.indexOf('data:') !== 0) {
        crossorigin = true;
    }

    if (!baseTexture) {
        var image = new Image();
        if (crossorigin) {
            image.crossOrigin = '';
        }

        baseTexture = new BaseTexture(image, scaleMode);
        baseTexture.imageUrl = imageUrl;

        image.src = imageUrl;

        JC.UTILS.BaseTextureCache[imageUrl] = baseTexture;

    }

    return baseTexture;
};

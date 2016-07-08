(function(){
    window.JC = window.JC||{};
    JC.Texture = function(id, img)
    {
        this.id = id;
        this.img = img;
        this.width = img.width;
        this.height = img.height;
        this.isPowerOfTwo = JC.isPowerOfTwo(this.width,this.height);
    };


    JC.TextureUvs = function()
    {
        this.x0 = 0;
        this.y0 = 0;

        this.x1 = 0;
        this.y1 = 0;

        this.x2 = 0;
        this.y2 = 0;

        this.x3 = 0;
        this.y3 = 0;
    };



    JC.TextureCache = {};


    JC.ImageLoader = function(sources, crossorigin){
        this.receiveNum = 0;
        this.failNum = 0;
        this.requestNum = 0;
        this.crossorigin = crossorigin;
        this.sources = sources||{};
        this.imgs = {};

        this.loading();
    };
    JC.ImageLoader.prototype.constructor = JC.ImageLoader;
    JC.ImageLoader.prototype.loading = function(){
        var This = this;

        function ears(source,img){
            img.onload = function(){
                This.receiveNum++;
                JC.TextureCache[source] = new JC.Texture(source,img);
                if((This.receiveNum+This.failNum)>=This.requestNum){
                    This.onLoaded();
                    This.failNum>0&&This.onFailed();
                }
            };
            img.onerror = function (){
                This.failNum++;
            };
        }

        for(var source in this.sources){
            this.imgs[source] = new Image();

            ears(source,this.imgs[source]);

            if(this.crossorigin){
                this.imgs[source].crossOrigin = '';
            }
            this.imgs[source].src = this.sources[source];
            this.requestNum++;
        }
    };
    JC.ImageLoader.prototype.getTexture = function(id){
        return JC.TextureCache[id];
    };
    JC.ImageLoader.prototype.onLoaded = function(){};
    JC.ImageLoader.prototype.onFailed = function(){};


















})();
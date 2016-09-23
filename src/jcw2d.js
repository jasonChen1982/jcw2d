(function (root, factory) {
  if (typeof exports === 'object') {
    // CommonJS
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(function () {
      return (root.JC = factory());
    });
  } else {
    // Global Variables
    root.JC = factory();
  }
}(this, function () {

    var JC = window.JC||{};

    //=include modules/RAF.js

    //=include modules/const.js

    //=include modules/utils.js

    //=include modules/tween.js

    //=include modules/event.js

    //=include modules/animation.js

    //=include modules/math/point.js
    //=include modules/math/matrix.js

    //=include modules/textures/baseTexture.js
    //=include modules/textures/texture.js
    //=include modules/textures/textureUvs.js

    //=include modules/display/display.js
    //=include modules/display/container.js

    //=include modules/sprite/sprite.js

    //=include modules/particles/particleContainer.js

    //=include modules/text/text.js

    //=include modules/renderer/renderer.js
    //=include modules/renderer/manager/shaderManager.js
    //=include modules/renderer/shaders/shader.js
    //=include modules/renderer/shaders/spriteShader.js
    //=include modules/renderer/shaders/particleShader.js
    //=include modules/renderer/shaders/graphicsShader.js

    return JC;

}));
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

    //=include modules/texture.js

    //=include modules/jcw2d.js

    return JC;

}));
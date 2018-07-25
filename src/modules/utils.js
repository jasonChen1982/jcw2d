/**
 * 简单拷贝json对象
 *
 * @name copyJSON
 * @memberof JC
 * @property {JC.copyJSON}
 */

// JC.copyJSON = ;

/**
 * 将角度转化成弧度
 *
 * @name DTR
 * @memberof JC
 * @property {JC.DTR}
 */

// JC.DTR = Math.PI/180;


/**
 * 是否为数组
 *
 * @name isArray
 * @memberof JC
 * @property {JC.isArray}
 */
// JC.isArray = ;

/**
 * 是否为对象
 *
 * @name isObject
 * @memberof JC
 * @property {JC.isObject}
 */
// JC.isObject = (function(){
//     var ks = _rt({});
//     return function(object){
//         return Object.prototype.toString.call(object) === ks;
//     };
// })();

/**
 * 是否为数字
 *
 * @name isNumber
 * @memberof JC
 * @property {JC.isNumber}
 */
// JC.isNumber = (function(){
//     var ks = _rt(1);
//     return function(object){
//         return Object.prototype.toString.call(object) === ks;
//     };
// })();

/**
 * 是否为函数
 *
 * @name isFunction
 * @memberof JC
 * @property {JC.isFunction}
 */
// JC.isFunction = (function(){
//     var ks = _rt(function(){});
//     return function(object){
//         return Object.prototype.toString.call(object) === ks;
//     };
// })();

/**
 * 强化的随机数
 *
 * @name random
 * @memberof JC
 * @property {JC.random}
 */

// JC.random = function(min, max){
//     if (JC.isArray(min))
//         return min[~~(Math.random() * min.length)];
//     if (!JC.isNumber(max))
//         max = min || 1, min = 0;
//     return min + Math.random() * (max - min);
// };


/**
 * 阿基米德求模
 *
 * @name euclideanModulo
 * @memberof JC
 * @property {JC.euclideanModulo}
 */

// JC.euclideanModulo = function(n, m){
//     return ((n % m) + m) % m;
// };

function _rt(val) {
  return Object.prototype.toString.call(val);
}

JC.UTILS = {

  hex2rgb: function(hex, out) {
    out = out || [];

    out[0] = (hex >> 16 & 0xFF) / 255;
    out[1] = (hex >> 8 & 0xFF) / 255;
    out[2] = (hex & 0xFF) / 255;

    return out;
  },

  hex2string: function(hex) {
    hex = hex.toString(16);
    hex = '000000'.substr(0, 6 - hex.length) + hex;

    return '#' + hex;
  },

  rgb2hex: function(rgb) {
    return ((rgb[0] * 255 << 16) + (rgb[1] * 255 << 8) + rgb[2] * 255);
  },

  getNextPowerOfTwo: function(number) {
    // see: http://en.wikipedia.org/wiki/Power_of_two#Fast_algorithm_to_check_if_a_positive_number_is_a_power_of_two
    if (number > 0 && (number & (number - 1)) === 0) {
      return number;
    } else {
      let result = 1;

      while (result < number) {
        result <<= 1;
      }

      return result;
    }
  },

  isPowerOfTwo: function(width, height) {
    return (width > 0 && (width & (width - 1)) === 0 && height > 0 && (height & (height - 1)) === 0);
  },

  sayHi: function(type) {
    if (this._saidHi) {
      return;
    }

    if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
      let args = [
        '\n %c %c %c jcw2d.js ' + JC.CONST.VERSION + ' - ✰ ' + type + ' ✰  %c ' + ' %c ' + ' http://www.jason82.com/  %c %c ♥%c♥%c♥ \n\n',
        'background: #ff66a5; padding:5px 0;',
        'background: #ff66a5; padding:5px 0;',
        'color: #ff66a5; background: #030307; padding:5px 0;',
        'background: #ff66a5; padding:5px 0;',
        'background: #ffc3dc; padding:5px 0;',
        'background: #ff66a5; padding:5px 0;',
        'color: #ff2424; background: #fff; padding:5px 0;',
        'color: #ff2424; background: #fff; padding:5px 0;',
        'color: #ff2424; background: #fff; padding:5px 0;',
      ];

      window.console.log.apply(console, args); // jshint ignore:line
    } else if (window.console) {
      window.console.log('jcw2d.js ' + JC.CONST.VERSION + ' - ' + type + ' - http://www.jason82.com/'); // jshint ignore:line
    }

    this._saidHi = true;
  },

  isWebGLSupported: function() {
    let contextOptions = {stencil: true};
    try {
      if (!window.WebGLRenderingContext) {
        return false;
      }

      let canvas = document.createElement('canvas'),
        gl = canvas.getContext('webgl', contextOptions) || canvas.getContext('experimental-webgl', contextOptions);

      return !!(gl && gl.getContextAttributes().stencil);
    } catch (e) {
      return false;
    }
  },

  sign: function(n) {
    return n ? (n < 0 ? -1 : 1) : 0;
  },

  removeItems: function(arr, startIdx, removeCount) {
    let length = arr.length;

    if (startIdx >= length || removeCount === 0) {
      return;
    }

    removeCount = (startIdx + removeCount > length ? length - startIdx : removeCount);
    for (var i = startIdx, len = length - removeCount; i < len; ++i) {
      arr[i] = arr[i + removeCount];
    }

    arr.length = len;
  },

  copyJSON: function(json) {
    return JSON.parse(JSON.stringify(json));
  },

  isArray: (function() {
    let ks = _rt('s');
    return function(object) {
      return Object.prototype.toString.call(object) === ks;
    };
  })(),

  isObject: (function() {
    let ks = _rt({});
    return function(object) {
      return Object.prototype.toString.call(object) === ks;
    };
  })(),

  isNumber: (function() {
    let ks = _rt(1);
    return function(object) {
      return Object.prototype.toString.call(object) === ks;
    };
  })(),

  /**
     * 是否为函数
     *
     * @name isFunction
     * @memberof JC
     * @property {JC.isFunction}
     */
  isFunction: (function() {
    let ks = _rt(function() {});
    return function(object) {
      return Object.prototype.toString.call(object) === ks;
    };
  })(),

  /**
     * 强化的随机数
     *
     * @name random
     * @memberof JC
     * @property {JC.random}
     */
  random: function(min, max) {
    if (this.isArray(min)) {
      return min[~~(Math.random() * min.length)];
    }
    if (!this.isNumber(max)) {
      max = min || 1, min = 0;
    }
    return min + Math.random() * (max - min);
  },

  /**
     * 阿基米德求模
     *
     * @name euclideanModulo
     * @memberof JC
     * @property {JC.euclideanModulo}
     */
  euclideanModulo: function(n, m) {
    return ((n % m) + m) % m;
  },

  clamp: function(x, a, b) {
    return (x < a) ? a : ((x > b) ? b : x);
  },

  TextureCache: {},

  BaseTextureCache: {},

};

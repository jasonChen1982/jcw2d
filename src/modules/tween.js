JC.TWEEN = {
  easeBoth: function(t, b, c, d) { // 加速减速曲线
    if ((t /= d / 2) < 1) {
      return c / 2 * t * t + b;
    }
    return -c / 2 * ((--t) * (t - 2) - 1) + b;
  },
  extend: function(opts) {
    if (!opts) return;
    for (let key in opts) {
      if (key !== 'extend' && opts[key]) this[key] = opts[key];
    }
  },
};

/**
 * 显示对象的基类
 *
 * @class
 * @memberof JC
 */
function DisplayObject() {
    this._ready = true;

    this.visible = true;
    this.worldAlpha = 1;
    this.alpha = 1;

    this.scaleX = 1;
    this.scaleY = 1;

    this.skewX = 0;
    this.skewY = 0;

    this.rotation = 0;
    this.rotationCache = 0;
    this._sr = 0;
    this._cr = 1;

    this.x = 0;
    this.y = 0;

    this.pivotX = 0;
    this.pivotY = 0;

    this.mask = null;

    this.parent = null;
    this.worldTransform = new JC.Matrix();

    this.event = new JC.Eventer();
    this.passEvent = false;
    this.bounds = [];

    this.Animator = new JC.Animator();
}
JC.DisplayObject = DisplayObject;
DisplayObject.prototype.constructor = JC.DisplayObject;

Object.defineProperty(DisplayObject.prototype, 'scale', {
    get: function() {
        return this.scaleX;
    },
    set: function(scale) {
        this.scaleX = this.scaleY = scale;
    }
});

/**
 * fromTo动画，指定动画的启始位置和结束位置
 *
 * ```js
 * // 扩展缓动函数，缓动函数库详见目录下的util/tween.js
 * JC.TWEEN.extend({    
 *    bounceOut: function(t, b, c, d){
 *        if ((t/=d) < (1/2.75)) {
 *            return c*(7.5625*t*t) + b;
 *        } else if (t < (2/2.75)) {
 *            return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
 *        } else if (t < (2.5/2.75)) {
 *            return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
 *        }
 *        return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
 *    }
 * });
 * var dispayObj = new JC.Text('Hello JC','bold 36px Arial','#c32361');
 * dispayObj.fromTo({
 *   from: {x: 100},
 *   to: {x: 200},
 *   ease: 'bounceOut', // 执行动画使用的缓动函数 默认值为 easeBoth
 *   repeats: 10, // 动画运动完后再重复10次
 *   infinity: true, // 无限循环动画
 *   alternate: true, // 偶数次的时候动画回放
 *   duration: 1000, // 动画时长 ms单位 默认 300ms
 *   onUpdate: function(state,rate){},
 *   onCompelete: function(){ console.log('end'); } // 动画执行结束回调
 * });
 * ```
 *
 * @param opts {object} 配置
 * @param clear {boolean} 是否去掉之前的动画
 */
DisplayObject.prototype.fromTo = function(opts, clear) {
    opts.element = this;
    this.setVal(opts.from);
    if (clear) this.Animator.animates.length = 0;
    return this.Animator.fromTo(opts);
};

/**
 * to动画，物体当前位置为动画的启始位置，只需制定动画的结束位置
 *
 * @param opts {object} 配置
 * @param clear {boolean} 是否去掉之前的动画
 */
DisplayObject.prototype.to = function(opts, clear) {
    opts.element = this;
    opts.from = {};
    for (var i in opts.to) {
        opts.from[i] = this[i];
    }
    if (clear) this.Animator.animates.length = 0;
    return this.Animator.fromTo(opts);
};

/**
 * keyFrames动画，设置物体动画的keyframe，可以为相邻的两个keyFrames之前配置差值时间及时间函数
 *
 * @param opts {object} 配置
 * @param clear {boolean} 是否去掉之前的动画
 */
DisplayObject.prototype.keyFrames = function(opts, clear) {
    opts.element = this;
    if (clear) this.Animator.animates.length = 0;
    return this.Animator.keyFrames(opts);
};

/**
 * 检测是否可见
 *
 * @method isVisible
 * @private
 */
DisplayObject.prototype.isVisible = function() {
    return !!(this.visible && this.alpha > 0 && this.scaleX * this.scaleY > 0);
};

DisplayObject.prototype.setVal = function(vals) {
    if (vals === undefined) return;
    for (var key in vals) {
        if (this[key] === undefined) {
            continue;
        } else {
            this[key] = vals[key];
        }
    }
};
DisplayObject.prototype.updateMe = function() {
    var pt = this.parent.worldTransform;
    var wt = this.worldTransform;

    var a, b, c, d, tx, ty;

    if (this.skewX || this.skewY) {

        JC.TEMP_MATRIX.setTransform(
            this.x,
            this.y,
            this.pivotX,
            this.pivotY,
            this.scaleX,
            this.scaleY,
            this.rotation,
            this.skewX,
            this.skewY
        );

        wt.a = JC.TEMP_MATRIX.a * pt.a + JC.TEMP_MATRIX.b * pt.c;
        wt.b = JC.TEMP_MATRIX.a * pt.b + JC.TEMP_MATRIX.b * pt.d;
        wt.c = JC.TEMP_MATRIX.c * pt.a + JC.TEMP_MATRIX.d * pt.c;
        wt.d = JC.TEMP_MATRIX.c * pt.b + JC.TEMP_MATRIX.d * pt.d;
        wt.tx = JC.TEMP_MATRIX.tx * pt.a + JC.TEMP_MATRIX.ty * pt.c + pt.tx;
        wt.ty = JC.TEMP_MATRIX.tx * pt.b + JC.TEMP_MATRIX.ty * pt.d + pt.ty;
    } else {
        if (this.rotation % 360) {
            if (this.rotation !== this.rotationCache) {
                this.rotationCache = this.rotation;
                this._sr = Math.sin(this.rotation * JC.CONST.DTR);
                this._cr = Math.cos(this.rotation * JC.CONST.DTR);
            }

            a = this._cr * this.scaleX;
            b = this._sr * this.scaleX;
            c = -this._sr * this.scaleY;
            d = this._cr * this.scaleY;
            tx = this.x;
            ty = this.y;

            if (this.pivotX || this.pivotY) {
                tx -= this.pivotX * a + this.pivotY * c;
                ty -= this.pivotX * b + this.pivotY * d;
            }
            wt.a = a * pt.a + b * pt.c;
            wt.b = a * pt.b + b * pt.d;
            wt.c = c * pt.a + d * pt.c;
            wt.d = c * pt.b + d * pt.d;
            wt.tx = tx * pt.a + ty * pt.c + pt.tx;
            wt.ty = tx * pt.b + ty * pt.d + pt.ty;
        } else {
            a = this.scaleX;
            d = this.scaleY;

            tx = this.x - this.pivotX * a;
            ty = this.y - this.pivotY * d;

            wt.a = a * pt.a;
            wt.b = a * pt.b;
            wt.c = d * pt.c;
            wt.d = d * pt.d;
            wt.tx = tx * pt.a + ty * pt.c + pt.tx;
            wt.ty = tx * pt.b + ty * pt.d + pt.ty;
        }
    }
    this.worldAlpha = this.alpha * this.parent.worldAlpha;
};

DisplayObject.prototype.upAnimation = function(snippet) {
    this.Animator.update(snippet);
};
// DisplayObject.prototype.setTransform = function(ctx){
//     var matrix = this.worldTransform;
//     ctx.globalAlpha = this.worldAlpha;
//     ctx.setTransform(matrix.a,matrix.b,matrix.c,matrix.d,matrix.tx,matrix.ty);
// };
/**
 * 获取物体相对于canvas世界坐标系的坐标位置
 *
 * @return {object}
 */
DisplayObject.prototype.getGlobalPos = function() {
    return { x: this.worldTransform.tx, y: this.worldTransform.ty };
};
/**
 * 显示对象的事件绑定函数
 *
 * @param type {String} 事件类型
 * @param fn {Function} 回调函数
 */
DisplayObject.prototype.on = function(type, fn) {
    this.event.on(type, fn);
};
/**
 * 显示对象的事件解绑函数
 *
 * @param type {String} 事件类型
 * @param fn {Function} 注册时回调函数的引用
 */
DisplayObject.prototype.off = function(type, fn) {
    this.event.off(type, fn);
};
/**
 * 显示对象的一次性事件绑定函数
 *
 * @param type {String} 事件类型
 * @param fn {Function} 回调函数
 */
DisplayObject.prototype.once = function(type, fn) {
    this.event.once(type, cb);
};
/**
 * 获取当前坐标系下的监测区域
 *
 * @method getBounds
 * @private
 */
DisplayObject.prototype.getBounds = function() {
    var bounds = [],
        l = this.bounds.length >> 1;

    for (var i = 0; i < l; i++) {
        var p = this.worldTransform.apply({ x: this.bounds[i * 2], y: this.bounds[i * 2 + 1] });
        bounds[i * 2] = p.x;
        bounds[i * 2 + 1] = p.y;
    }
    return bounds;
};
/**
 * 设置显示对象的监测区域
 *
 * @param points {Array} 区域的坐标点 [x0,y0 ..... xn,yn]
 * @param needless {boolean} 当该值为true，当且仅当this.bounds为空时才会更新点击区域。默认为false，总是更新点击区域。
 * @return {Array}
 */
DisplayObject.prototype.setBounds = function(points, needless) {
};
DisplayObject.prototype.ContainsPoint = function(p, px, py) {
    var n = p.length >> 1;
    var ax, ay = p[2 * n - 3] - py,
        bx = p[2 * n - 2] - px,
        by = p[2 * n - 1] - py;

    //var lup = by > ay;
    for (var i = 0; i < n; i++) {
        ax = bx;
        ay = by;
        bx = p[2 * i] - px;
        by = p[2 * i + 1] - py;
        if (ay == by) continue;
        lup = by > ay;
    }

    var depth = 0;
    for (i = 0; i < n; i++) {
        ax = bx;
        ay = by;
        bx = p[2 * i] - px;
        by = p[2 * i + 1] - py;
        if (ay < 0 && by < 0) continue;
        if (ay > 0 && by > 0) continue;
        if (ax < 0 && bx < 0) continue;

        if (ay == by && Math.min(ax, bx) <= 0) return true;
        if (ay == by) continue;

        var lx = ax + (bx - ax) * (-ay) / (by - ay);
        if (lx === 0) return true;
        if (lx > 0) depth++;
        if (ay === 0 && lup && by > ay) depth--;
        if (ay === 0 && !lup && by < ay) depth--;
        lup = by > ay;
    }
    return (depth & 1) == 1;
};

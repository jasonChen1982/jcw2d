/**
 * 显示对象容器，继承至DisplayObject
 *
 * ```js
 * var container = new JC.Container();
 * container.addChilds(sprite);
 * ```
 *
 * @class
 * @extends JC.DisplayObject
 * @memberof JC
 */
function Container() {
  JC.DisplayObject.call(this);
  this.cds = [];
  this.timeScale = 1;
  this.paused = false;
}
JC.Container = Container;
Container.prototype = Object.create(JC.DisplayObject.prototype);
Container.prototype.constructor = JC.Container;

/**
 * 向容器添加一个物体
 *
 * ```js
 * container.addChilds(sprite,sprite2,text3,graphice);
 * ```
 *
 * @param child {JC.Container}
 * @return {JC.Container}
 */
Container.prototype.addChilds = function(cd) {
  if (cd === undefined) return cd;
  let l = arguments.length;
  if (l > 1) {
    for (let i = 0; i < l; i++) {
      this.addChilds(arguments[i]);
    }
    return arguments[l - 1];
  }
  if (cd.parent) {
    cd.parent.removeChilds(cd);
  }
  cd.parent = this;
  this.cds.push(cd);
  return cd;
};
/**
 * 从容器移除一个物体
 *
 * ```js
 * container.removeChilds(sprite,sprite2,text3,graphice);
 * ```
 *
 * @param child {JC.Container}
 * @return {JC.Container}
 */
Container.prototype.removeChilds = function() {
  let l = arguments.length;
  if (l > 1) {
    for (let i = 0; i < l; i++) {
      this.removeChilds(arguments[i]);
    }
  } else if (l === 1) {
    for (let a = 0; a < this.cds.length; a++) {
      if (this.cds[a] === arguments[0]) {
        this.cds.splice(a, 1);
        this.cds[a].parent = null;
        a--;
      }
    }
  }
};
Container.prototype.updateTransform = function(snippet) {
  if (!this._ready) return;
  snippet = this.timeScale * snippet;
  !this.paused && this.upAnimation(snippet);
  this.updateMe();
  this.cds.length > 0 && this.updateChilds(snippet);
};
Container.prototype.updateChilds = function(snippet) {
  for (let i = 0, l = this.cds.length; i < l; i++) {
    let cd = this.cds[i];
    cd.updateTransform(snippet);
  }
};
Container.prototype.render = function(session) {
  this.renderMe(session);
  this.cds.length > 0 && this.renderChilds(session);
};
Container.prototype.renderMe = function() {
  return true;
};
Container.prototype.renderChilds = function(session) {
  for (let i = 0, l = this.cds.length; i < l; i++) {
    let cd = this.cds[i];
    if (!cd.isVisible() || !cd._ready) continue;
    cd.render(session);
  }
};
Container.prototype.noticeEvent = function(ev) {
  let i = this.cds.length - 1;
  while (i >= 0) {
    let child = this.cds[i];
    if (child.visible) {
      child.noticeEvent(ev);
      if (ev.target) break;
    }
    i--;
  }
  this.upEvent(ev);
};
Container.prototype.upEvent = function(ev) {
  if (!this._ready) return;
  if (ev.target || (!this.passEvent && this.hitTest(ev))) {
    if (!ev.cancleBubble || ev.target === this) {
      if (!(this.event.listeners[ev.type] && this.event.listeners[ev.type].length > 0)) return;
      this.event.emit(ev);
    }
  }
};
Container.prototype.hitTest = function(ev) {
  if (ev.type === 'touchmove' || ev.type === 'touchend' || ev.type === 'mousemove' || ev.type === 'mouseup') {
    let re = this.event.touchstarted;
    if (re) ev.target = this;
    if (ev.type === 'touchend' || ev.type === 'mouseup') this.event.touchstarted = false;
    return re;
  }
  if (this.hitTestMe(ev)) {
    ev.target = this;
    if (ev.type === 'touchstart' || ev.type === 'mousedown') this.event.touchstarted = true;
    return true;
  }
  return false;
};
Container.prototype.hitTestMe = function(ev) {
  return this.ContainsPoint(this.getBound(), ev.global.x, ev.global.y);
};
Container.prototype.pause = function() {
  this.paused = true;
};
Container.prototype.start = function() {
  this.paused = false;
};
Container.prototype.cancle = function() {
  this.Animator.animates.length = 0;
};

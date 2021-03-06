function TextureUvs() {
  this.x0 = 0;
  this.y0 = 0;

  this.x1 = 1;
  this.y1 = 0;

  this.x2 = 1;
  this.y2 = 1;

  this.x3 = 0;
  this.y3 = 1;
}

TextureUvs.prototype.set = function(frame, baseFrame) {
  let tw = baseFrame.width;
  let th = baseFrame.height;

  this.x0 = frame.x / tw;
  this.y0 = frame.y / th;

  this.x1 = (frame.x + frame.width) / tw;
  this.y1 = frame.y / th;

  this.x2 = (frame.x + frame.width) / tw;
  this.y2 = (frame.y + frame.height) / th;

  this.x3 = frame.x / tw;
  this.y3 = (frame.y + frame.height) / th;
};
TextureUvs.prototype.get = function() {
  return new Float32Array([
    this.x0, this.y0, this.x1, this.y1,
    this.x2, this.y2, this.x3, this.y3,
  ]);
};

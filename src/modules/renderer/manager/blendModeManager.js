function BlendModeManager(renderer) {
    this.renderer = renderer;

    this.currentBlendMode = 99999;
}
JC.BlendModeManager = BlendModeManager;
BlendModeManager.prototype.constructor = JC.BlendModeManager;
BlendModeManager.prototype.setBlendMode = function(blendMode) {
    if (this.currentBlendMode === blendMode) {
        return false;
    }

    this.currentBlendMode = blendMode;

    var mode = this.renderer.blendModes[this.currentBlendMode];
    this.renderer.gl.blendFunc(mode[0], mode[1]);

    return true;
};

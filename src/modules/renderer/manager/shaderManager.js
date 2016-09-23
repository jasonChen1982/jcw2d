function ShaderManager(renderer) {

    this.renderer = renderer;

    this.shaderType = '';

    this.currentShader = null;

    this.init();
}
JC.ShaderManager = ShaderManager;
ShaderManager.prototype.constructor = JC.ShaderManager;

ShaderManager.prototype.init = function() {

    var gl = this.renderer.gl;

    this.maxAttibs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);

    this.shaderPool = {
        particle: new ParticleShader(gl),
        sprite: new SpriteShader(gl),
        graphics: new GraphicsShader(gl),
        // text: new TextShader(gl)
    };
};

ShaderManager.prototype.setShader = function(shaderType) {
    if (this.shaderType === shaderType) {
        return false;
    }

    this.currentShader = this.shaderPool[shaderType];

    this.renderer.gl.useProgram(this.currentShader.program);

    this.shaderType = shaderType;

    return true;
};

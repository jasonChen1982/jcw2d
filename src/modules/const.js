
JC.CONST = {
    VERSION: '0.0.1',

    PI_2: Math.PI * 2,

    RTD: 180 / Math.PI,

    DTR: Math.PI / 180,


    /**
     *
     * @static
     * @constant
     * @property {object} BLEND_MODES
     * @property {number} BLEND_MODES.NORMAL
     * @property {number} BLEND_MODES.ADD
     * @property {number} BLEND_MODES.MULTIPLY
     * @property {number} BLEND_MODES.SCREEN
     */
    BLEND_MODES: {
        NORMAL:         0,
        ADD:            1,
        MULTIPLY:       2,
        SCREEN:         3
    },

    /**
     *
     * @static
     * @constant
     * @property {object} DRAW_MODES
     * @property {number} DRAW_MODES.POINTS
     * @property {number} DRAW_MODES.LINES
     * @property {number} DRAW_MODES.LINE_LOOP
     * @property {number} DRAW_MODES.LINE_STRIP
     * @property {number} DRAW_MODES.TRIANGLES
     * @property {number} DRAW_MODES.TRIANGLE_STRIP
     * @property {number} DRAW_MODES.TRIANGLE_FAN
     */
    DRAW_MODES: {
        POINTS:         0,
        LINES:          1,
        LINE_LOOP:      2,
        LINE_STRIP:     3,
        TRIANGLES:      4,
        TRIANGLE_STRIP: 5,
        TRIANGLE_FAN:   6
    },

    /**
     *
     * @static
     * @constant
     * @property {object} SCALE_MODES
     * @property {number} SCALE_MODES.DEFAULT=LINEAR
     * @property {number} SCALE_MODES.LINEAR Smooth scaling
     * @property {number} SCALE_MODES.NEAREST Pixelating scaling
     */
    SCALE_MODES: {
        DEFAULT:    0,
        LINEAR:     0,
        NEAREST:    1
    },

    DEFAULT_RENDER_OPTIONS: {
        view: null,
        resolution: 1,
        antialias: true,
        autoResize: false,
        transparent: false,
        backgroundColor: 0x000000,
        autoClear: true,
        preserveDrawingBuffer: false
    },

    SPRITE_BATCH_SIZE: 2000 //nice balance between mobile and desktop machines
};
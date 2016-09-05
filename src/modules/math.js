JC.Math = {
    clamp: function(x, a, b) {
        return (x < a) ? a : ((x > b) ? b : x);
    },
    random: function (min, max) {
        if (isArray(min))
            return min[~~(Math.random() * min.length)];
        if (!isNumber(max))
            max = min || 1, min = 0;
        return min + Math.random() * (max - min);
    }
};

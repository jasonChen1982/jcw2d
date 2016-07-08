JC.Math = {
    clamp: function(x, a, b) {

        return (x < a) ? a : ((x > b) ? b : x);

    },
    randIn: function(low, high) {

        return low + Math.random() * (high - low);

    }
};

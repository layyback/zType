ig.baked = true;
ig.module('game.ease').defines(function () {
  ig.ease = {
      inOutQuad: function (time, start, c, duration) {
          if ((time /= duration / 2) < 1) return c / 2 * time * time + start;
          return -c / 2 * ((--time) * (time - 2) - 1) + start;
      },
      inOutBack: function (t, b, c, d, s) {
          if (s == undefined) s = 1.70158;
          if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
          return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
      },
      inBounce: function (t, b, c, d) {
          return c - ig.ease.outBounce(d - t, 0, c, d) + b;
      },
      outBounce: function (t, b, c, d) {
          if ((t /= d) < (1 / 2.75)) {
              return c * (7.5625 * t * t) + b;
          } else if (t < (2 / 2.75)) {
              return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
          } else if (t < (2.5 / 2.75)) {
              return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
          } else {
              return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
          }
      },
      inOutBounce: function (t, b, c, d) {
          if (t < d / 2) return ig.ease.inBounce(t * 2, 0, c, d) * .5 + b;
          return ig.ease.outBounce(t * 2 - d, 0, c, d) * .5 + c * .5 + b;
      }
  };
});
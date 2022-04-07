ig.baked = true;
ig.module('plugins.silent-loader').requires('impact.loader').defines(function () {
  ig.SilentLoader = ig.Loader.extend({
      endTimer: 0,
      fadeToGameTime: 300,
      end: function () {
          this.parent();
          this.endTime = Date.now();
          ig.system.setDelegate(this);
      },
      run: function () {
          var t = Date.now() - this.endTime;
          var alpha = 1;
          if (t < this.fadeToGameTime) {
              ig.game.run();
              alpha = t.map(0, this.fadeToGameTime, 1, 0);
          }
          else {
              ig.system.setDelegate(ig.game);
              return;
          }
          ig.system.context.fillStyle = 'rgba(0,0,0,' + alpha + ')';
          ig.system.context.fillRect(0, 0, ig.system.realWidth, ig.system.realHeight);
      },
      draw: function () {
          return;
      }
  });
});
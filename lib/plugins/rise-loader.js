ig.baked = true;
ig.module('plugins.rise-loader').requires('impact.loader').defines(function () {
  ig.RiseLoader = ig.Loader.extend({
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
          ig.system.context.fillStyle = 'rgba(255,255,255,' + alpha + ')';
          ig.system.context.fillRect(0, 0, ig.system.realWidth, ig.system.realHeight);
      },
      draw: function () {
          this._drawStatus += (this.status - this._drawStatus) / 5;
          ig.system.context.fillStyle = '#000';
          ig.system.context.fillRect(0, 0, ig.system.realWidth, ig.system.realHeight);
          var h = this._drawStatus * ig.system.realHeight;
          ig.system.context.fillStyle = '#fff';
          ig.system.context.fillRect(0, ig.system.realHeight - h, ig.system.realWidth, h);
      }
  });
});
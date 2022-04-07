ig.baked = true;
ig.module('game.entities.emp').requires('impact.entity').defines(function () {
  "use strict";
  window.EntityEMP = ig.Entity.extend({
      lifetime: 1,
      fadetime: 1,
      alpha: 0,
      killedProjectiles: false,
      img: new ig.Image('media/sprites/emp.png'),
      sound: new ig.Sound('media/sounds/emp.ogg', false),
      init: function (x, y, settings) {
          this.parent(x, y, settings);
          this.idleTimer = new ig.Timer();
          this.sound.play();
          ig.game.screenShake(30);
      },
      update: function () {
          this.alpha = this.idleTimer.delta().map(this.lifetime - this.fadetime, this.lifetime, 1, 0);
          var scale = this.alpha.map(0, 1, 1.7, 0);
          scale = Math.pow(scale, 0.5) * 200;
          var ents = ig.game.entities;
          for (var i = 0; i < ents.length; i++) {
              var ent = ents[i];
              if (ent instanceof EntityEnemy) {
                  if (this.distanceTo(ent) < scale) {
                      ent.spawnExplosionParticles(true);
                      ent.kill();
                  }
              }
          }
          if (this.idleTimer.delta() > this.lifetime) {
              this.kill();
              return;
          }
      },
      draw: function () {
          var scale = Math.pow(this.alpha.map(0, 1, 1.7, 0), 0.5);
          var ctx = ig.system.context;
          ctx.save();
          ctx.translate(this.pos.x - ig.game._rscreen.x, this.pos.y - ig.game._rscreen.y);
          ctx.scale(scale * 2, scale * 2);
          ctx.rotate(Math.pow(scale, 0.5) * Math.PI * 2);
          ctx.globalAlpha = this.alpha;
          this.img.draw(-128, -128);
          ig.system.context.restore();
      }
  });
});
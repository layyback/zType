ig.baked = true;
ig.module('game.entities.explosion').requires('impact.entity', 'impact.entity-pool', 'game.entities.particle').defines(function () {
  window.EntityExplosionParticle = EntityParticle.extend({
      lifetime: 0.5,
      fadetime: 0.5,
      vel: {
          x: 60,
          y: 60
      },
      animSheet: new ig.AnimationSheet('media/sprites/explosion.png', 32, 32),
      init: function (x, y, settings) {
          this.addAnim('idle', 5, [0, 1, 2]);
          this.parent(x, y, settings);
      },
      update: function () {
          this.currentAnim.angle += 0.1 * ig.system.tick;
          this.parent();
      }
  });
  ig.EntityPool.enableFor(EntityExplosionParticle);
  window.EntityExplosionSpark = EntityParticle.extend({
      lifetime: 0.5,
      fadetime: 0.5,
      vel: {
          x: 60,
          y: 60
      },
      animSheet: new ig.AnimationSheet('media/sprites/spark.png', 48, 48),
      init: function (x, y, settings) {
          this.addAnim('idle', 1, [0]);
          this.parent(x, y, settings);
      },
      update: function () {
          this.currentAnim.angle += 0.1 * ig.system.tick;
          this.parent();
      }
  });
  ig.EntityPool.enableFor(EntityExplosionSpark);
  window.EntityExplosionHuge = ig.Entity.extend({
      lifetime: 1,
      fadetime: 1,
      alpha: 0,
      img: new ig.Image('media/sprites/explosion-huge.jpg', 512, 512),
      init: function (x, y, settings) {
          this.parent(x, y, settings);
          this.idleTimer = new ig.Timer();
      },
      update: function () {
          if (this.idleTimer.delta() > this.lifetime) {
              this.kill();
              return;
          }
          this.alpha = this.idleTimer.delta().map(this.lifetime - this.fadetime, this.lifetime, 1, 0);
      },
      draw: function () {
          var ctx = ig.system.context;
          ctx.save();
          var scale = this.alpha.map(0, 1, 10, 0);
          ctx.translate(this.pos.x - ig.game._rscreen.x, this.pos.y - ig.game._rscreen.y);
          ctx.scale(scale, scale);
          ctx.globalAlpha = this.alpha;
          this.img.draw(-256, -256);
          ctx.globalAlpha = 1;
          ig.system.context.restore();
      }
  });
  window.EntityExplosionHugeGlitch = EntityExplosionHuge.extend({
      img: new ig.Image('media/sprites/explosion-huge-glitch.jpg', 512, 512),
      glitchJPEG: new ig.Image('media/title/glitch-jpeg.png'),
      glitchStripe: new ig.Image('media/title/glitch-stripe.png'),
      draw: function () {
          this.parent();
          var d = this.idleTimer.delta();
          if (d < 0.1 || (d > 0.2 && d < 0.3)) {
              this.glitchJPEG.draw(this.pos.x - 240 + (200 - Math.random() * 400), Math.random() * ig.system.height);
          }
          if (d < 0.15 || (d > 0.25 && d < 0.35)) {
              this.glitchStripe.draw(0, Math.random() * ig.system.height);
          }
      },
      kill: function () {
          this.parent();
          ig.game.showGameOverScreen();
      }
  });
});
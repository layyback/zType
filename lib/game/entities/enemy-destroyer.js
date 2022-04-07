ig.baked = true;
ig.module('game.entities.enemy-destroyer').requires('game.entities.enemy', 'game.entities.explosion').defines(function () {
  EntityEnemyDestroyer = EntityEnemy.extend({
      size: {
          x: 24,
          y: 34
      },
      offset: {
          x: 10,
          y: 8
      },
      animSheet: new ig.AnimationSheet('media/sprites/destroyer.png', 43, 58),
      explosionSound: new ig.Sound('media/sounds/explosion-large.ogg'),
      health: 8,
      speed: 20,
      shootTimer: null,
      wordLength: {
          min: 7,
          max: 10
      },
      numKillParticles: 40,
      numHitParticles: 10,
      init: function (x, y, settings) {
          this.parent(x, y, settings);
          this.addAnim('idle', 1, [0]);
          this.shootTimer = new ig.Timer(ig.doc ? 12 : 5);
          this.angle = (Math.random().map(0, 1, 67, 90) + (this.pos.x > ig.system.width / 2 ? 22.5 : 0)) * Math.PI / 180;
          this.currentAnim.angle = this.angle - Math.PI / 2;
      },
      kill: function (silent) {
          this.parent(silent);
          if (!silent) {
              ig.game.spawnEntity(EntityExplosionHuge, this.pos.x + 12, this.pos.y + 22);
              ig.game.screenShake(10);
          }
      },
      update: function () {
          this.parent();
          if (this.shootTimer.delta() > 0) {
              this.shootTimer.reset();
              if (this.distanceTo(ig.game.player) > 100) {
                  ig.game.spawnEntity(EntityEnemyMissle, this.pos.x + 12, this.pos.y + 22, {
                      angle: this.angle
                  });
              }
          }
      }
  });
});
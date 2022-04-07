ig.baked = true;
ig.module('game.entities.enemy-missle').requires('game.entities.enemy').defines(function () {
  EntityEnemyMissle = EntityEnemy.extend({
      size: {
          x: 8,
          y: 15
      },
      offset: {
          x: 6,
          y: 7
      },
      animSheet: new ig.AnimationSheet('media/sprites/missle.png', 20, 26),
      explosionSound: new ig.Sound('media/sounds/explosion-small.ogg'),
      health: 4,
      speed: 35,
      targetTimer: null,
      wordLength: {
          min: 2,
          max: 5
      },
      numKillParticles: 10,
      numHitParticles: 2,
      init: function (x, y, settings) {
          if (ig.doc) {
              this.wordLength.min = 1;
              this.wordLength.max = 1;
          }
          this.parent(x, y, settings);
          this.addAnim('idle', 1, [0]);
          this.angle = settings.angle;
          this.currentAnim.angle = this.angle - Math.PI / 2;
          this.targetTimer = new ig.Timer(1);
      },
      update: function () {
          var d = this.targetTimer.delta();
          if (d > 0 && d < 0.7) {
              var ad = this.angle - this.angleTo(ig.game.player);
              this.angle -= ad * ig.system.tick * 2;
              this.currentAnim.angle = this.angle - Math.PI / 2;
          }
          this.parent();
      }
  });
});
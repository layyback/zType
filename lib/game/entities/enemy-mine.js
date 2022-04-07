ig.baked = true;
ig.module('game.entities.enemy-mine').requires('game.entities.enemy').defines(function () {
  EntityEnemyMine = EntityEnemy.extend({
      size: {
          x: 12,
          y: 12
      },
      offset: {
          x: 10,
          y: 10
      },
      animSheet: new ig.AnimationSheet('media/sprites/mine.png', 32, 32),
      explosionSound: new ig.Sound('media/sounds/explosion.ogg'),
      speed: 30,
      health: 6,
      wordLength: {
          min: 3,
          max: 6
      },
      init: function (x, y, settings) {
          this.parent(x, y, settings);
          this.addAnim('idle', 1, [0]);
      },
      kill: function (silent) {
          this.parent(silent);
          ig.game.screenShake(5);
      },
      update: function () {
          this.angle = this.angleTo(ig.game.player);
          this.parent();
          this.currentAnim.angle += 2 * ig.system.tick;
      }
  });
});
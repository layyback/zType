ig.baked = true;
ig.module('game.entities.player').requires('impact.entity', 'impact.entity-pool', 'game.entities.emp', 'game.entities.particle').defines(function () {
  EntityPlayer = ig.Entity.extend({
      animSheet: new ig.AnimationSheet('media/sprites/ship.png', 24, 24),
      targetAngle: 0,
      size: {
          x: 8,
          y: 8
      },
      offset: {
          x: 8,
          y: 8
      },
      angle: 0,
      targetAngle: 0,
      soundShoot: new ig.Sound('media/sounds/plasma.ogg'),
      soundMiss: new ig.Sound('media/sounds/click.ogg'),
      soundExplode: new ig.Sound('media/sounds/explosion-player.ogg'),
      type: ig.Entity.TYPE.A,
      init: function (x, y, settings) {
          this.parent(x, y, settings);
          this.addAnim('idle', 60, [0]);
          this.addAnim('shoot', 0.05, [3, 2, 1, 0], true);
          this.addAnim('miss', 0.05, [4, 5, 6], true);
      },
      update: function () {
          if (this.currentAnim.loopCount > 0) {
              this.currentAnim = this.anims.idle;
          }
          var ad = this.angle - this.targetAngle;
          if (Math.abs(ad) < 0.02) {
              this.angle = this.targetAngle;
          }
          else {
              this.angle -= ad * ig.system.tick * 10;
          }
          this.currentAnim.angle = this.angle;
          this.parent();
      },
      spawnEMP: function () {
          if (ig.game.emps) {
              ig.game.spawnEntity(EntityEMP, this.pos.x + this.size.x / 2, this.pos.y + this.size.y / 2);
              ig.game.emps--;
          }
      },
      kill: function () {
          ig.game.setGameOver();
          this.soundExplode.play();
          ig.game.spawnEntity(EntityExplosionHugeGlitch, this.pos.x + 12, this.pos.y + 22);
          ig.game.screenShake(10);
          this.pos.y = ig.system.height + 300;
          this.parent();
      },
      shoot: function (target) {
          this.currentAnim = this.anims.shoot.rewind();
          var ent = ig.game.spawnEntity(EntityPlasma, this.pos.x + 6, this.pos.y + 4);
          ent.target = target;
          var angle = this.angleTo(target);
          this.targetAngle = angle + Math.PI / 2;
          this.soundShoot.play();
      },
      miss: function () {
          this.currentAnim = this.anims.miss.rewind();
          this.soundMiss.play();
      }
  });
  EntityPlasma = ig.Entity.extend({
      speed: 800,
      maxVel: {
          x: 10000,
          y: 10000
      },
      animSheet: new ig.AnimationSheet('media/sprites/plasma.png', 96, 96),
      size: {
          x: 4,
          y: 4
      },
      offset: {
          x: 46,
          y: 46
      },
      distance: 100000,
      init: function (x, y, settings) {
          this.parent(x, y, settings);
          this.addAnim('idle', 1, [0]);
      },
      reset: function (x, y, settings) {
          this.parent(x, y, settings);
          this.distance = 100000;
      },
      update: function () {
          if (this.target) {
              var currentDistance = this.distanceTo(this.target);
              if (currentDistance > this.distance || currentDistance < this.target.size.y) {
                  this.target.hit(this);
                  this.kill();
                  return;
              }
              else {
                  var angle = this.angleTo(this.target);
                  this.currentAnim.angle = angle + Math.PI / 2;
                  this.vel.x = Math.cos(angle) * this.speed;
                  this.vel.y = Math.sin(angle) * this.speed;
              }
              this.distance = currentDistance;
              this.parent();
          }
          else {
              this.kill();
          }
      }
  });
  ig.EntityPool.enableFor(EntityPlasma);
});
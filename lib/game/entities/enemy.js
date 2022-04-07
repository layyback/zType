ig.baked = true;
ig.module('game.entities.enemy').requires('impact.entity', 'impact.font', 'game.avenir-next', 'game.entities.explosion').defines(function () {
  EntityEnemy = ig.Entity.extend({
      word: 'none',
      remainingWord: 'none',
      health: 8,
      currentLetter: 0,
      targeted: false,
      font: new ig.FontAvenirNext('media/fonts/avenir-22-white-v2.png'),
      fontActive: new ig.FontAvenirNext('media/fonts/avenir-22-orange-v2.png'),
      speed: 10,
      friction: {
          x: 100,
          y: 100
      },
      hitTimer: null,
      dead: false,
      angle: 0,
      wordLength: {
          min: 8,
          max: 8
      },
      numKillParticles: 20,
      numHitParticles: 5,
      soundHit: new ig.Sound('media/sounds/hit.ogg'),
      soundTarget: new ig.Sound('media/sounds/target.ogg'),
      reticleTimer: null,
      reticle: new ig.Image('media/ui/reticle.png'),
      type: ig.Entity.TYPE.B,
      checkAgainst: ig.Entity.TYPE.A,
      init: function (x, y, settings) {
          this.parent(x, y, settings);
          this.font.letterSpacing = 0.5;
          this.fontActive.letterSpacing = 0.5;
          var length = Math.random().map(0, 1, this.wordLength.min, this.wordLength.max).round();
          this.word = settings.word || this.getWordWithLength(length);
          this.health = this.word.length;
          this.remainingWord = this.word;
          this.hitTimer = new ig.Timer(0);
          this.dieTimer = new ig.Timer(0);
          ig.game.registerTarget(this.word.charAt(0), this);
          this.angle = this.angleTo(ig.game.player);
          if (!ig.ua.mobile) {
              this.speed *= ig.game.speedFactor;
          }
      },
      getWordWithLength: function (l) {
          var w = 'wtf';
          for (var i = 0; i < 20; i++) {
              if (l >= 2 && l <= 12) {
                  w = ig.game.wordlist[l].random();
              }
              else {
                  w = String.fromCharCode('a'.charCodeAt(0) + (Math.random() * 26).floor());
              }
              if (!ig.game.targets[w.charAt(0).toLowerCase()].length) {
                  return w;
              }
          }
          return w;
      },
      target: function () {
          this.targeted = true;
          ig.game.currentTarget = this;
          ig.game.unregisterTarget(this.remainingWord.charAt(0), this);
          ig.game.entities.erase(this);
          ig.game.entities.push(this);
          this.reticleTimer = new ig.Timer(0.5);
          this.soundTarget.play();
      },
      draw: function () {
          this.parent();
          if (this.reticleTimer) {
              var d = this.reticleTimer.delta().map(-0.5, 0, 0, 1);
              var ctx = ig.system.context;
              ctx.save();
              var scale = (1 - d) * (1 - d) * 4;
              ctx.translate(this.pos.x + this.size.x / 2 - ig.game._rscreen.x, this.pos.y + this.size.y / 2 - ig.game._rscreen.y);
              ctx.scale(scale, scale);
              ctx.globalAlpha = Math.sqrt(d);
              ctx.rotate(d * Math.PI * 1);
              this.reticle.draw(-128, -128);
              ctx.globalAlpha = 1;
              ig.system.context.restore();
          }
      },
      drawLabel: function () {
          if (!this.remainingWord.length) {
              return;
          }
          var w = this.font.widthForString(this.word);
          var x = (this.pos.x - 6).limit(w + 2, ig.system.width - 1) + ig.game._rscreen.x;
          var y = (this.pos.y + this.size.y - 10).limit(2, ig.system.height - 19) + ig.game._rscreen.y;
          var bx = ig.system.getDrawPos(x - w - 2);
          var by = ig.system.getDrawPos(y - 1);
          ig.system.context.fillStyle = 'rgba(0,0,0,0.75)';
          ig.system.context.fillRect(bx, by + 5, w + 8, 24);
          if (this.targeted) {
              this.fontActive.draw(this.remainingWord, x + 2, y + 6, ig.Font.ALIGN.RIGHT);
          }
          else {
              this.font.draw(this.remainingWord, x + 2, y + 6, ig.Font.ALIGN.RIGHT);
          }
      },
      kill: function (silent) {
          if (this.remainingWord.length) {
              ig.game.unregisterTarget(this.remainingWord.charAt(0), this);
          }
          if (ig.game.currentTarget == this) {
              ig.game.currentTarget = null;
          }
          this.parent();
          if (this.explosionSound && !silent) {
              this.explosionSound.play();
          }
          if (!silent) {
              ig.game.lastKillTimer.set(0.3);
              var px = this.pos.x - this.size.x / 2,
                  py = this.pos.y - this.size.y / 2;
              for (var i = 0; i < this.wordLength.max; i++) {
                      ig.game.spawnEntity(EntityExplosionSpark, px, py, {
                          vel: {
                              x: 360,
                              y: 360
                          }
                      });
                  }
          }
      },
      cancel: function () {
          ig.game.currentTarget = null;
          this.targeted = false;
          ig.game.registerTarget(this.remainingWord.charAt(0), this);
      },
      update: function () {
          if (this.hitTimer.delta() > 0) {
              this.vel.x = Math.cos(this.angle) * this.speed;
              this.vel.y = Math.sin(this.angle) * this.speed;
          }
          this.parent();
          if (this.pos.x < -this.animSheet.width || this.pos.x > ig.system.width + 10 || this.pos.y > ig.system.height + 10 || this.pos.y < -this.animSheet.height - 30) {
              this.kill(true);
          }
          if (this.reticleTimer && this.reticleTimer.delta() > 0) {
              this.reticleTimer = null;
          }
      },
      hit: function (other) {
          this.spawnExplosionParticles((this.health <= 1));
          this.vel.x = -Math.cos(this.angle) * 20 + Math.random() * 20;
          this.vel.y = -Math.sin(this.angle) * 20 + Math.random() * 20;
          this.hitTimer.set(0.3);
          ig.game.lastKillTimer.set(0.2);
          this.receiveDamage(1);
          this.soundHit.play();
      },
      spawnExplosionParticles: function (killed) {
          var numParticles = killed ? this.numKillParticles : this.numHitParticles;
          for (var i = 0; i < numParticles; i++) {
              ig.game.spawnEntity(EntityExplosionParticle, this.pos.x, this.pos.y);
          }
          var numSparks = numParticles / 2;
          for (var i = 0; i < numSparks; i++) {
              ig.game.spawnEntity(EntityExplosionSpark, this.pos.x, this.pos.y);
          }
      },
      isHitBy: function (letter) {
          var expected = ig.game.translateUmlaut(this.remainingWord.charAt(0).toLowerCase());
          if (expected == letter.toLowerCase()) {
              this.remainingWord = this.remainingWord.substr(1);
              if (this.remainingWord.length == 0) {
                  ig.game.currentTarget = null;
                  this.dead = true;
              }
              return true;
          }
          else {
              return false;
          }
      },
      check: function (other) {
          other.kill();
          this.kill();
      }
  });
});
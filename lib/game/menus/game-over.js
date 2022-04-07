ig.baked = true;
ig.module('game.menus.game-over').requires('game.menus.base', 'game.menus.interstitial', 'game.menus.stats').defines(function () {
  MenuItemInterstitial = MenuItem.extend({
      getText: function () {
          return 'back to title';
      },
      ok: function () {
          ig.game.menu = new MenuInterstitial();
      }
  });
  MenuItemContinue = MenuItem.extend({
      getText: function () {
          return 'continue';
      },
      ok: function () {
          ig.game.
          continue ();
      }
  });
  MenuGameOver = Menu.extend({
      itemClasses: [MenuItemBack],
      scale: 0.75,
      personalBestBadge: new ig.Image('media/ui/personal-best-badge.png'),
      fontTitle: new ig.Font('media/fonts/avenir-36-blue.png'),
      separatorBar: new ig.Image('media/ui/bar-blue.png'),
      init: function () {
          if (ig.doc) {
              this.itemClasses.unshift(MenuItemContinue);
          }
          this.parent();
          this.y = (ig.system.height - 130) / this.scale;
          this.width = ig.system.width / this.scale;
          this.stats = new StatsView(432, ig.system.height - 500);
          this.stats.submit({
              score: ig.game.score,
              wave: ig.game.wave.wave,
              streak: ig.game.longestStreak,
              accuracy: ig.game.hits ? ig.game.hits / (ig.game.hits + ig.game.misses) * 100 : 0
          });
          this.timer = new ig.Timer();
      },
      update: function () {
          if (this.timer.delta() > 1.5) {
              this.parent();
          }
      },
      draw: function () {
          this.parent();
          var xs = ig.system.width / 2;
          var ys = 25;
          var acc = ig.game.hits ? ig.game.hits / (ig.game.hits + ig.game.misses) * 100 : 0;
          var ctx = ig.system.context;
          if (ig.game.isPersonalBest) {
              ctx.save();
              ctx.scale(0.5, 0.5);
              this.personalBestBadge.draw(24 / 0.5, 275 / 0.5);
              this.font.draw('NEW PERSONAL BEST', 60 / 0.5, 280 / 0.5, ig.Font.ALIGN.LEFT);
              ctx.restore();
          }
          var ss = 0.5;
          ctx.save();
          ctx.scale(ss, ss);
          ctx.globalAlpha = 0.5;
          this.font.draw('FINAL SCORE', 24 / ss, (ys + 0) / ss);
          this.font.draw('YOU REACHED', 252 / ss, (ys + 0) / ss);
          this.font.draw('ACCURACY', 24 / ss, (ys + 140) / ss);
          this.font.draw('LONGEST STREAK', 252 / ss, (ys + 140) / ss);
          ctx.restore();
          this.fontTitle.draw(ig.game.score.zeroFill(6), 24, ys + 25);
          this.fontTitle.draw('WAVE ' + ig.game.wave.wave.zeroFill(3), 252, ys + 25);
          ig.system.context.drawImage(this.separatorBar.data, 24, ys + 70, 432, 2);
          this.fontTitle.draw(acc.round(1) + '%', 24, ys + 165);
          this.fontTitle.draw(ig.game.longestStreak, 252, ys + 165);
          ig.system.context.drawImage(this.separatorBar.data, 24, ys + 210, 432, 2);
          if (this.stats) {
              this.stats.draw(24, ys + 300);
          }
      }
  });
});
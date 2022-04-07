ig.baked = true;
ig.module('game.menus.about').requires('game.menus.base').defines(function () {
  MenuItemRestoreIAP = MenuItem.extend({
      getText: function () {
          return 'Restore In-App Purchases';
      },
      ok: function () {
          ig.game.restoreIAP();
      }
  });
  MenuAbout = Menu.extend({
      background: new ig.Image('media/background/stars.jpg'),
      credits: new ig.Image('media/title/credits.png'),
      scale: 0.75,
      scroll: 0,
      itemClasses: [MenuItemRestoreIAP, MenuItemBack],
      init: function () {
          if (!window.Ejecta) {
              this.itemClasses.shift();
          }
          this.parent();
          this.current = 1;
          this.width = ig.system.width / this.scale;
          this.items[0].y = (ig.system.height - 130) / this.scale;
          if (this.items.length > 1) {
              this.items[1].y = (ig.system.height - 80) / this.scale;
          }
      },
      draw: function () {
          var ctx = ig.system.context;
          ctx.save();
          ctx.scale(this.scale, this.scale);
          this.scroll += ig.system.tick * 10;
          this.scroll = this.scroll % this.background.height;
          this.background.draw(0, this.scroll - this.background.height);
          this.background.draw(0, this.scroll);
          ctx.restore();
          this.credits.draw(32, 32);
          this.parent();
      }
  });
});
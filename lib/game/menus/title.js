ig.baked = true;
ig.module('game.menus.title').requires('game.menus.base', 'game.menus.settings', 'game.menus.detailed-stats', 'game.ease').defines(function () {
  MenuItemNormalMode = MenuItem.extend({
      getText: function () {
          return 'new game';
      },
      ok: function () {
          ig.game.setGame();
      },
  });
  MenuItemSettingsMenu = MenuItem.extend({
      getText: function () {
          return 'settings';
      },
      ok: function () {
          ig.game.menu = new MenuSettings();
      },
  });
  MenuItemChangeURL = MenuItem.extend({
      getText: function () {
          return (ig.doc ? 'try a different text' : 'load your own text');
      },
      ok: function () {
          document.location.href = '/?load'
      },
  });
  MenuItemRemoveAds = MenuItem.extend({
      getText: function () {
          return 'remove ads';
      },
      ok: function () {
          ig.game.purchaseRemoveAds();
      }
  });
  MenuItemGameCenter = MenuItem.extend({
      getText: function () {
          return 'gamecenter';
      },
      ok: function () {
          ig.game.gameCenter.showLeaderboard('score');
      }
  });
  MenuItemStats = MenuItem.extend({
      getText: function () {
          return 'my stats';
      },
      ok: function () {
          ig.game.detailedStats = ig.game.detailedStats || new DetailedStats();
          ig.game.detailedStats.show();
          ig.input.delayedKeyup.click = true;
      }
  });
  MenuItemAppStore = MenuItem.extend({
      getText: function () {
          return 'download as app';
      },
      ok: function () {
          window.location.href = ig.ua.iOS ? 'https://goo.gl/qSntlx' : 'https://goo.gl/cg7rmI';
      }
  });
  MenuTitle = Menu.extend({
      itemClasses: [MenuItemNormalMode, MenuItemRemoveAds, MenuItemGameCenter],
      scale: 0.75,
      y: 0,
      init: function () {
          this.itemClasses = [];
          this.itemClasses.push(MenuItemNormalMode);
          this.itemClasses.push(MenuItemSettingsMenu);
          if (window.Ejecta && !localStorage.getItem('removeAds')) {
              this.itemClasses.push(MenuItemRemoveAds);
          }
          if (window.Ejecta) {
              this.itemClasses.push(MenuItemGameCenter);
          }
        //   if (window.Cocoon || window.Ejecta) {} else if (ig.ua.iOS || ig.ua.android) {
        //       this.itemClasses.push(MenuItemAppStore);
        //   }
        //   else if (!ig.ua.mobile) {
        //       this.itemClasses.push(MenuItemStats);
        //   }
        //   if (!window.Cocoon && !window.Ejecta) {
        //       this.itemClasses.push(MenuItemChangeURL);
        //   }
          this.parent();
          this.items[0].y = 740;
          this.items[0].alpha = 0.9;
          if (this.items.length > 1) {
              this.items[1].y = ig.system.height / this.scale - 140;
              this.items[1].alpha = 0.4;
              if (this.items.length > 2) {
                  this.items[2].y = ig.system.height / this.scale - 90;
                  this.items[2].alpha = 0.4;
              }
          }
          this.width = ig.system.width / this.scale;
          this.playerPos.x = (ig.system.width - this.ship.width) / 2;
          this.playerPos.y = 400;
      },
      scroll: 0,
      background: new ig.Image('media/background/stars.jpg'),
      ztype: new ig.Image('media/title/ztype.png'),
      phoboslab: new ig.Image('media/title/phoboslab.png'),
      ship: new ig.Image('media/title/ship.png'),
      exhaust: new ig.Image('media/title/exhaust.png'),
      infoIcon: new ig.Image('media/ui/information.png'),
      glitchStripe: new ig.Image('media/title/glitch-stripe.png'),
      glitchCode: new ig.Image('media/title/glitch-code.png'),
      glitchJPEG: new ig.Image('media/title/glitch-jpeg.png'),
      glitchGraph: new ig.Image('media/title/glitch-graph.png'),
      glitchLog: new ig.Image('media/title/glitch-log.png'),
      playerPos: {
          x: 200,
          y: 400
      },
      transition: 0,
      draw: function () {
          var ctx = ig.system.context;
          ctx.globalAlpha = this.alpha + Math.sin(this.transition * Math.PI) * (1 - Math.random() * 0.5);
          ctx.save();
          ctx.scale(this.scale, this.scale);
          this.scroll += ig.system.tick * 10;
          this.scroll = this.scroll % this.background.height;
          this.background.draw(0, this.scroll - this.background.height);
          this.background.draw(0, this.scroll);
          this.phoboslab.draw((ig.system.width / this.scale - this.phoboslab.width) / 2, 80 - ig.ease.inOutQuad(this.transition, 0, 2800, 1));
          this.ztype.draw((ig.system.width / this.scale - this.ztype.width) / 2, 150 - ig.ease.inOutQuad(this.transition, 0, 1000, 1));
          ctx.globalAlpha = Math.sin(this.transition * Math.PI);
          ctx.globalCompositeOperation = 'lighter';
          this.glitchStripe.draw(0, 4000 - this.transition * 4200);
          ctx.restore();
          var i0y = Math.min(740, ig.system.height / this.scale - 270);
          this.items[0].y = ig.ease.inOutQuad(this.transition, i0y, 1600, 1);
          if (this.items.length > 1) {
              this.items[1].y = ig.ease.inOutQuad(this.transition, ig.system.height / this.scale - 200, 1900, 1);
          }
          if (this.items.length > 2) {
              this.items[2].y = ig.ease.inOutQuad(this.transition, ig.system.height / this.scale - 140, 2100, 1);
          }
          if (this.items.length > 3) {
              this.items[3].y = ig.ease.inOutQuad(this.transition, ig.system.height / this.scale - 80, 2200, 1);
          }
          this.ship.draw(this.playerPos.x - 1, this.playerPos.y - 7);
          for (var i = 0; i < 10; i++) {
              var ey = (i * 139 + ig.Timer.time * 53 * (1 + i / 30)) % 400;
              ig.system.context.globalAlpha = (ey < 20 ? (ey / 20) * 0.7 : Math.max(0, 0.7 - (ey / 400))) * 0.3;
              this.exhaust.draw(this.playerPos.x - 1 + Math.sin(ig.Timer.time + ey / 30) * 0.7, this.playerPos.y + ey);
          }
          ig.system.context.globalAlpha = 1;
          this.parent();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = Math.random();
          if (this.transition > 0.55 && this.transition < 0.62) {
              this.glitchGraph.draw(ig.system.width - this.glitchGraph.width - Math.random() * 10, 10);
          }
          if ((this.transition > 0.6 && this.transition < 0.7) || (this.transition > 0.3 && this.transition < 0.33)) {
              this.glitchCode.draw(0 + Math.random() * 20, 0);
          }
          if (this.transition > 0.65 && this.transition < 0.75) {
              this.glitchLog.draw(20 + Math.random() * 20, 400);
          }
          if (this.transition > 0.8 && this.transition < 0.85) {
              this.glitchJPEG.draw(ig.system.width - this.glitchJPEG.width, 300 + Math.random() * 100);
          }
          ctx.globalAlpha = Math.max(0.4 - this.transition, 0) + (this.infoIcon.hovered ? 0.3 : 0);
          this.infoIcon.draw(ig.system.width - 48, ig.system.height - 48);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
      },
      update: function () {
          if (ig.game.gameTransitionTimer) {
              return;
          }
          if (ig.input.mouse.y < 104 && ig.input.pressed('click')) {
              if (window.ejecta) {
                  ejecta.openURL('https://itunes.apple.com/us/artist/phoboslab/id312666931');
              }
              else {
                  window.open('https://itunes.apple.com/us/artist/phoboslab/id312666931');
              }
              return;
          }
          this.parent();
          if (ig.input.mouse.x > ig.system.width - 64 && ig.input.mouse.y > ig.system.height - 64) {
              if (ig.input.pressed('click')) {
                  ig.game.menu = new MenuAbout();
                  ig.game.menu.scroll = this.scroll;
                  return;
              }
              this.infoIcon.hovered = true;
              ig.system.canvas.style.cursor = 'pointer';
          }
          else {
              this.infoIcon.hovered = false;
          }
      }
  });
});
ig.baked = true;
ig.module('game.menus.interstitial').requires('game.menus.base').defines(function () {
  MenuItemSkip = MenuItem.extend({
      getText: function () {
          return 'skip';
      },
      ok: function () {
          ig.game.setTitle();
      }
  });
  MenuInterstitial = Menu.extend({
      itemClasses: [MenuItemSkip],
      scale: 0.75,
      banner: new ig.Image('media/nfn-phoboslab-works.png'),
      init: function () {
          this.parent();
          this.y = (ig.system.height - 130) / this.scale;
          this.width = ig.system.width / this.scale;
          this.timer = new ig.Timer();
          if (!MenuInterstitial.onclickInstalled) {
              MenuInterstitial.onclickInstalled = true;
              ig.system.canvas.addEventListener('click', function (event) {
                  if (ig.game && ig.game.menu && ig.game.menu.onclick) {
                      ig.game.menu.onclick(event);
                  }
              });
          }
      },
      update: function () {
          this.parent();
          var bx = ((ig.system.width - this.banner.width) / 2),
              by = 64,
              bw = this.banner.width,
              bh = this.banner.height;
          if (ig.input.mouse.x > bx && ig.input.mouse.x < bx + bw && ig.input.mouse.y > by && ig.input.mouse.y < by + bh) {
                  ig.system.canvas.style.cursor = 'pointer';
              }
      },
      onclick: function (event) {
          var internalWidth = parseInt(ig.system.canvas.offsetWidth) || ig.system.realWidth;
          var scale = ig.system.scale * (internalWidth / ig.system.realWidth);
          var pos = {
              left: 0,
              top: 0
          };
          if (ig.system.canvas.getBoundingClientRect) {
              pos = ig.system.canvas.getBoundingClientRect();
          }
          var ev = event.touches ? event.touches[0] : event;
          var x = (ev.clientX - pos.left) / scale;
          var y = (ev.clientY - pos.top) / scale;
          var bx = ((ig.system.width - this.banner.width) / 2),
              by = 64,
              bw = this.banner.width,
              bh = this.banner.height;
          if (x > bx && x < bx + bw && y > by && y < by + bh) {
                  window.open('http://nofatenetmusic.bandcamp.com/album/the-phoboslab-works');
              }
      },
      draw: function () {
          this.parent();
          var x = (ig.system.width - this.banner.width) / 2,
              y = 64;
          this.banner.draw(x, y);
          var d = this.timer.delta();
          if (d < 0.3) {
                  ig.system.context.globalAlpha = d.map(0, 0.3, 1, 0);
                  ig.system.context.fillStyle = '#fff';
                  ig.system.context.fillRect(x, y, this.banner.width, this.banner.height);
                  ig.system.context.globalAlpha = 1;
              }
      }
  });
});
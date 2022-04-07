ig.baked = true;
ig.module('game.menus.base').requires('impact.font').defines(function () {
  MenuItem = ig.Class.extend({
      getText: function () {
          return 'none'
      },
      left: function () {},
      right: function () {},
      ok: function () {},
      click: function () {
          this.ok();
          ig.system.canvas.style.cursor = 'auto';
      }
  });
  MenuItemBack = MenuItem.extend({
      getText: function () {
          return 'back to title';
      },
      ok: function () {
          ig.game.setTitle();
      }
  });
  Menu = ig.Class.extend({
      clearColor: null,
      name: null,
      font: new ig.Font('media/fonts/avenir-36-white.png'),
      fontSelected: new ig.Font('media/fonts/avenir-36-orange.png'),
      current: 0,
      itemClasses: [],
      items: [],
      scale: 1,
      alpha: 1,
      init: function () {
          this.width = ig.system.width;
          this.y = ig.system.height / 4 + 160;
          this.font.letterSpacing = -2;
          this.fontSelected.letterSpacing = -2;
          for (var i = 0; i < this.itemClasses.length; i++) {
              this.items.push(new this.itemClasses[i]());
          }
      },
      update: function () {
          if (ig.input.pressed('up')) {
              this.current--;
          }
          if (ig.input.pressed('down')) {
              this.current++;
          }
          this.current = this.current.limit(0, this.items.length - 1);
          if (ig.input.pressed('left')) {
              this.items[this.current].left();
          }
          if (ig.input.pressed('right')) {
              this.items[this.current].right();
          }
          if (ig.input.pressed('ok')) {
              this.items[this.current].ok();
          }
          var ys = this.y;
          var xs = ig.system.width / 2;
          var hoverItem = null;
          for (var i = 0; i < this.items.length; i++) {
              var item = this.items[i];
              var w = (this.font.widthForString(item.getText()) / 2) * this.scale;
              if (item.y) {
                  ys = item.y;
              }
              if ((item.wide || ig.input.mouse.x > xs - w && ig.input.mouse.x < xs + w) && ig.input.mouse.y > (ys - 10) * this.scale && ig.input.mouse.y < (ys + this.font.height * 1.2) * this.scale) {
                  hoverItem = item;
                  this.current = i;
              }
              ys += this.font.height * 1.5;
          }
          if (hoverItem) {
              ig.system.canvas.style.cursor = 'pointer';
              if (ig.input.pressed('click')) {
                  hoverItem.click();
              }
          }
          else {
              ig.system.canvas.style.cursor = 'auto';
          }
      },
      draw: function () {
          ig.system.context.save();
          if (this.clearColor) {
              ig.system.context.fillStyle = this.clearColor;
              ig.system.context.fillRect(0, 0, ig.system.width, ig.system.height);
          }
          ig.system.context.globalAlpha = this.alpha;
          ig.system.context.scale(this.scale, this.scale);
          var xs = this.width / 2;
          var ys = this.y;
          if (this.name) {
              this.fontTitle.draw(this.name, xs, ys - 160, ig.Font.ALIGN.CENTER);
          }
          for (var i = 0; i < this.items.length; i++) {
              var item = this.items[i];
              var t = item.getText();
              if (item.y) {
                  ys = item.y;
              }
              if (item.alpha) {
                  ig.system.context.globalAlpha = item.alpha * this.alpha;
              }
              if (i == this.current) {
                  this.fontSelected.draw(t, xs, ys, ig.Font.ALIGN.CENTER);
              }
              else {
                  this.font.draw(t, xs, ys, ig.Font.ALIGN.CENTER);
              }
              ys += this.font.height * 1.5;
              ig.system.context.globalAlpha = 1;
          }
          ig.system.context.restore();
      }
  });
});
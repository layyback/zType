ig.baked = true;
ig.module('game.menus.settings', 'game.keyboard').requires('game.menus.base').defines(function () {
  MenuItemSoundVolume = MenuItem.extend({
      wide: true,
      getText: function () {
          return (ig.soundManager.volume * 100).round() + '%';
      },
      left: function () {
          ig.soundManager.volume = (ig.soundManager.volume - 0.1).limit(0, 1);
      },
      right: function () {
          ig.soundManager.volume = (ig.soundManager.volume + 0.1).limit(0, 1);
      },
      click: function () {
          if (ig.input.mouse.x > 240) {
              this.right();
          } else {
              this.left();
          }
          localStorage.setItem('soundVolume', ig.soundManager.volume);
      }
  });
  MenuItemMusicVolume = MenuItem.extend({
      wide: true,
      getText: function () {
          return (ig.music.volume * 100).round() + '%';
      },
      left: function () {
          ig.music.volume = (ig.music.volume - 0.1).limit(0, 1);
      },
      right: function () {
          ig.music.volume = (ig.music.volume + 0.1).limit(0, 1);
      },
      click: function () {
          if (ig.input.mouse.x > 240) {
              this.right();
          } else {
              this.left();
          }
          localStorage.setItem('musicVolume', ig.music.volume);
      }
  });
  MenuItemKeyboardLayout = MenuItem.extend({
      wide: true,
      init: function () {
          this.layouts = [];
          this.current = 0;
          var selected = localStorage.getItem('keyboardLayout');
          var i = 0;
          for (var k in ig.Keyboard.LAYOUT) {
              var layout = ig.Keyboard.LAYOUT[k];
              this.layouts.push({
                  name: layout.name,
                  layout: layout,
                  key: k
              });
              if (selected === k) {
                  this.current = this.layouts.length - 1;
              }
          }
      },
      getText: function () {
          return this.layouts[this.current].name;
      },
      left: function () {
          this.current--;
          if (this.current < 0) {
              this.current = this.layouts.length - 1;
          }
          if (ig.game && ig.game.keyboard) {
              ig.game.keyboard.setLayout(this.layouts[this.current].layout);
          }
      },
      right: function () {
          this.current++;
          if (this.current >= this.layouts.length) {
              this.current = 0;
          }
          if (ig.game && ig.game.keyboard) {
              ig.game.keyboard.setLayout(this.layouts[this.current].layout);
          }
      },
      click: function () {
          if (ig.input.mouse.x > 240) {
              this.right();
          } else {
              this.left();
          }
          localStorage.setItem('keyboardLayout', this.layouts[this.current].key);
      }
  });
  MenuItemResume = MenuItem.extend({
      getText: function () {
          return 'resume';
      },
      ok: function () {
          ig.game.menu = null;
      }
  });
  MenuSettings = Menu.extend({
      scale: 0.8,
      clearColor: 'rgba(0,0,0,0.8)',
      init: function () {
          if (ig.game.mode !== ZType.MODE.GAME) {
              this.itemClasses.erase(MenuItemResume);
          }
          if (!ig.ua.mobile) {
              this.itemClasses.erase(MenuItemKeyboardLayout);
          }
          this.parent();
          this.y = ig.system.height / 3;
          this.items[0].y = 190 / this.scale;
          this.items[1].y = 290 / this.scale;
          if (ig.ua.mobile) {
              this.items[2].y = 390 / this.scale;
              this.items[3].y = Math.max(ig.system.height - 220, 490) / this.scale;
          }
          else {
              this.items[2].y = Math.max(ig.system.height - 220, 490) / this.scale;
          }
      },
      itemClasses: [MenuItemSoundVolume, MenuItemMusicVolume, MenuItemKeyboardLayout, MenuItemResume, MenuItemBack],
      draw: function () {
          this.width = ig.system.width / this.scale;
          var ctx = ig.system.context;
          this.parent();
          var s = 0.85;
          ctx.save();
          ctx.scale(s, s);
          ctx.globalAlpha = 0.5;
          if (ig.game.mode !== ZType.MODE.GAME) {
              this.font.draw('SETTINGS', ig.system.width / 2 / s, 60 / s, ig.Font.ALIGN.CENTER);
          }
          else {
              this.font.draw('GAME PAUSED', ig.system.width / 2 / s, 60 / s, ig.Font.ALIGN.CENTER);
          }
          ctx.restore();
          ctx.save();
          s = 0.5;
          ctx.scale(s, s);
          ctx.globalAlpha = 0.5;
          this.font.draw('SOUND', ig.system.width / 2 / s, 160 / s, ig.Font.ALIGN.CENTER);
          this.font.draw('MUSIC', ig.system.width / 2 / s, 260 / s, ig.Font.ALIGN.CENTER);
          if (ig.ua.mobile) {
              this.font.draw('KEYBOARD  LAYOUT', ig.system.width / 2 / s, 360 / s, ig.Font.ALIGN.CENTER);
          }
          ctx.restore();
          var xs = this.width / 2;
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.scale(this.scale, this.scale);
          this.font.draw('-                +', xs, this.items[0].y, ig.Font.ALIGN.CENTER);
          this.font.draw('-                +', xs, this.items[1].y, ig.Font.ALIGN.CENTER);
          if (ig.ua.mobile) {
              this.font.draw('<                                                 >', xs, this.items[2].y, ig.Font.ALIGN.CENTER);
          }
          ctx.restore();
      }
  });
});
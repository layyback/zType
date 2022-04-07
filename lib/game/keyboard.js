ig.baked = true;
ig.module('game.keyboard').requires('impact.font').defines(function () {
  ig.Keyboard = ig.Class.extend({
      background: new ig.Image('media/ui/keyboard-background.png'),
      keyboard: null,
      empButton: new ig.Image('media/ui/emp-buttons.png'),
      pauseButton: new ig.Image('media/ui/pause.png'),
      font: new ig.Font('media/fonts/avenir-36-blue.png'),
      hoverImages: {
          leftEdge: new ig.Image('media/ui/key-edge-left.png'),
          rightEdge: new ig.Image('media/ui/key-edge-right.png'),
          normal: new ig.Image('media/ui/key.png')
      },
      multiBar: new ig.Image('media/ui/bar-blue.png'),
      multiIndicator: new ig.Image('media/ui/multi-indicator.png'),
      multiSounds: {
          2: new ig.Sound('media/sounds/multi-2.ogg'),
          3: new ig.Sound('media/sounds/multi-3.ogg')
      },
      width: 0,
      height: 0,
      hoverKey: null,
      expectedKeys: null,
      keyMetrics: {
          width: 64,
          height: 106,
          offsetTop: 32
      },
      init: function (callback, layout) {
          this.callback = callback;
          this.unsetHoverKeyTimer = null;
          this.width = this.background.width;
          this.height = (ig.ua.mobile ? this.background.height : 64);
          this.drawScale = ig.system.width / this.width;
          this.x = 0;
          this.y = ig.system.height / this.drawScale - this.height;
          if (ig.ua.mobile) {
              ig.system.canvas.addEventListener('touchstart', this.touchMove.bind(this), false);
              ig.system.canvas.addEventListener('touchmove', this.touchMove.bind(this), false);
              ig.system.canvas.addEventListener('touchend', this.touchEnd.bind(this), false);
              this.keyboardCanvas = ig.$new('canvas');
              this.keyboardCanvas.width = this.background.width;
              this.keyboardCanvas.height = this.background.height;
              this.keyboardContext = this.keyboardCanvas.getContext('2d');
              this.setLayout(layout || ig.Keyboard.LAYOUT.QWERTY);
          }
      },
      setLayout: function (layout) {
          this.layout = layout;
          var ctx = this.keyboardContext;
          ctx.clearRect(0, 0, this.background.width, this.background.height);
          ctx.drawImage(this.background.data, 0, 0);
          var oldSystemContext = ig.system.context;
          ig.system.context = ctx;
          this.keyPositions = {};
          for (var y = 0; y < this.layout.map.length; y++) {
              var row = this.layout.map[y];
              var offset = (10 - row.length) / 2;
              for (var x = 0; x < row.length; x++) {
                  var key = row[x];
                  this.keyPositions[key] = [x + offset, y];
                  this.font.draw(key.toUpperCase(), (x + offset + 0.5) * this.keyMetrics.width, y * this.keyMetrics.height + this.keyMetrics.offsetTop, ig.Font.ALIGN.CENTER);
              }
          }
          ig.system.context = oldSystemContext;
      },
      getCurrentKey: function (touches) {
          var touch = touches[touches.length - 1];
          var documentScale = (parseInt(ig.system.canvas.offsetWidth) || ig.system.realWidth) / ig.system.width;
          var touchX = (touch.clientX / documentScale) / this.drawScale,
              touchY = (touch.clientY / documentScale) / this.drawScale;
          if (touchX < 96 && touchY < 96) {
                  return 'ESC';
              }
          else if (touchY < this.y - 20) {
                  return 'BACKSPACE';
              }
          else if (touchY > this.y + 214 && touchX > this.x + 560) {
                  return 'ENTER';
              }
          var row = ((touchY - this.y) / this.keyMetrics.height) | 0;
          if (row < 0 || !this.layout.map[row]) {
                  return;
              }
          var offsetX = (this.background.width - this.layout.map[row].length * this.keyMetrics.width) / 2;
          var col = ((touchX - this.x - offsetX) / this.keyMetrics.width) | 0;
          var key = this.layout.map[row][col];
          if (this.expectedKeys) {
                  var closest = Infinity;
                  for (var i = 0; i < this.expectedKeys.length; i++) {
                      var kpos = this.keyPositions[this.expectedKeys[i]];
                      var keyX = kpos[0] * this.keyMetrics.width + this.keyMetrics.width / 2,
                          keyY = kpos[1] * this.keyMetrics.height + this.keyMetrics.height / 2;
                      var dx = touchX - this.x - keyX,
                          dy = touchY - this.y - keyY;
                      var distance = Math.sqrt(dx * dx + dy * dy);
                      if (distance < this.keyMetrics.width && distance < closest) {
                              closest = distance;
                              key = this.expectedKeys[i];
                          }
                  }
              }
          return key;
      },
      touchMove: function (ev) {
          var key = this.getCurrentKey(ev.touches);
          if (key !== 'ESC' && key !== 'ENTER' && key !== 'BACKSPACE') {
              this.hoverKey = key;
              this.unsetHoverKeyTimer = null;
          }
      },
      touchEnd: function (ev) {
          var key = this.getCurrentKey(ev.changedTouches);
          if (key) {
              this.callback(key);
          }
          this.unsetHoverKeyTimer = new ig.Timer();
      },
      showMultiplier: function (m) {
          this.multiplierTimer = new ig.Timer(2);
          this.multiplierIndex = m - 2;
          this.multiSounds[m].play();
      },
      draw: function () {
          if (ig.ua.mobile) {
              this.drawFull();
          }
          else {
              this.drawMinimal();
          }
      },
      drawFull: function () {
          var ctx = ig.system.context;
          ctx.save();
          ctx.globalAlpha = 1;
          ctx.scale(this.drawScale, this.drawScale);
          ctx.drawImage(this.keyboardCanvas, this.x, this.y);
          this.drawMultiplierBar(this.x, this.y);
          if (this.unsetHoverKeyTimer && this.unsetHoverKeyTimer.delta() > 0.25) {
              this.hoverKey = null;
              this.unsetHoverKeyTimer = null;
          }
          if (this.hoverKey) {
              var offsetX = 0;
              var hoverImage = this.hoverImages.normal;
              var kpos = this.keyPositions[this.hoverKey];
              if (kpos[0] < 0.5) {
                  hoverImage = this.hoverImages.leftEdge;
                  offsetX = 26;
              }
              else if (kpos[0] > 8.5) {
                  hoverImage = this.hoverImages.rightEdge;
                  offsetX = -26;
              }
              var x = (kpos[0] * this.keyMetrics.width - 19 + offsetX),
                  y = this.y + kpos[1] * this.keyMetrics.height - 112;
              var alpha = this.unsetHoverKeyTimer ? this.unsetHoverKeyTimer.delta().map(0, 0.25, 1, 0) : 1;
              ctx.globalAlpha = 0.9 * alpha;
              hoverImage.draw(x, y);
              this.font.draw(this.hoverKey.toUpperCase(), x + 51, y + 24, ig.Font.ALIGN.CENTER);
              ig.system.context.globalAlpha = 1;
          }
          if (!ig.game.emps) {
              ctx.globalAlpha = 0.7;
          }
          this.empButton.drawTile(this.x + 582, this.y + 250, ig.game.emps, 34, 40);
          ctx.globalAlpha = 0.15;
          this.pauseButton.draw(28, 28);
          ctx.restore();
      },
      drawMinimal: function () {
          var ctx = ig.system.context;
          ctx.save();
          ctx.globalAlpha = 1;
          ctx.scale(this.drawScale, this.drawScale);
          this.drawMultiplierBar(this.x, this.y + 62);
          if (!ig.game.emps) {
              ctx.globalAlpha = 0.7;
          }
          this.empButton.drawTile(this.x + 582, this.y, ig.game.emps, 34, 40);
          ctx.globalAlpha = 0.1;
          this.pauseButton.draw(28, 28);
          ctx.restore();
      },
      drawMultiplierBar: function (x, y) {
          if (ig.game.streak > 0) {
              var multiLength = 1 - (75 / (75 + ig.game.streak * 2));
              this.multiBar.draw(x, y, 0, 0, this.width * multiLength, 2);
          }
          var showMultiplierTime = this.multiplierTimer ? this.multiplierTimer.delta() : 0;
          if (showMultiplierTime < 0) {
              ig.system.context.globalAlpha = showMultiplierTime.map(-2, 0, 2, 0).limit(0, 1);
              this.multiIndicator.drawTile(x + this.width * multiLength - 30, y - 22, this.multiplierIndex, 32, 18);
              ig.system.context.globalAlpha = 1;
          }
      }
  });
  ig.Keyboard.LAYOUT = {};
  ig.Keyboard.LAYOUT.QWERTY = {
      name: 'QWERTY (us, uk)',
      map: [
          ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
          ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
          ['z', 'x', 'c', 'v', 'b', 'n', 'm']
      ]
  };
  ig.Keyboard.LAYOUT.QWERTZ = {
      name: 'QWERTZ (de, at, cz)',
      map: [
          ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p'],
          ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
          ['y', 'x', 'c', 'v', 'b', 'n', 'm']
      ]
  };
  ig.Keyboard.LAYOUT.AZERTY = {
      name: 'AZERTY (fr, be)',
      map: [
          ['a', 'z', 'e', 'r', 't', 'w', 'u', 'i', 'o', 'p'],
          ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'],
          ['y', 'x', 'c', 'v', 'b', 'n']
      ]
  };
  ig.Keyboard.LAYOUT.COLEMAK = {
      name: 'Colemak',
      map: [
          ['q', 'w', 'f', 'p', 'g', 'j', 'l', 'u', 'y'],
          ['a', 'r', 's', 't', 'd', 'h', 'n', 'e', 'i', 'o'],
          ['z', 'x', 'c', 'v', 'b', 'k', 'm']
      ]
  };
  ig.Keyboard.LAYOUT.DVORAK = {
      name: 'Dvorak',
      map: [
          ['p', 'y', 'f', 'g', 'c', 'r', 'l'],
          ['a', 'o', 'e', 'u', 'i', 'd', 'h', 't', 'n', 's'],
          ['q', 'j', 'k', 'x', 'b', 'm', 'w', 'v', 'z', '']
      ]
  };
});
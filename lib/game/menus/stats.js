ig.baked = true;
ig.module('game.menus.stats').requires('game.menus.base', 'game.xhr').defines(function () {
  StatsView = ig.Class.extend({
      data: null,
      workingIndicator: ['', '.', '..', '...'],
      font: new ig.Font('media/fonts/avenir-36-white.png'),
      timer: null,
      width: 432,
      height: 216,
      isExcerpt: false,
      totalGames: 0,
      init: function (width, height) {
          this.width = width;
          this.height = height;
          this.timer = new ig.Timer();
      },
      submit: function (data) {
          if (window.Cocoon || window.Ejecta) {
              var games = JSON.parse(localStorage.getItem('stats') || '[]');
              if (games.length > 30) {
                  games.shift();
              }
              data.created = (Date.now() / 1000) | 0;
              games.push(data);
              localStorage.setItem('stats', JSON.stringify(games));
              this.receivedData({
                  games: games
              });
          }
          else {
              ig.xhr('/api/', data, this.receivedData.bind(this));
          }
      },
      load: function () {
          if (window.Cocoon || window.Ejecta) {} else {
              ig.xhr('/api/', {
                  load: true
              }, this.receivedData.bind(this));
          }
      },
      receivedData: function (response) {
          this.data = response.games;
          this.maxScore = 0;
          for (var i = 0; i < this.data.length; i++) {
              var d = this.data[i];
              d.created = new Date(d.created * 1000);
              this.maxScore = Math.max(this.maxScore, d.score);
          }
          this.isExcerpt = response.isExcerpt;
          this.totalGames = response.totalGames;
          this.scoreScale = this.roundToMagnitude(this.maxScore);
          this.timer.reset();
      },
      roundToMagnitude: function (n) {
          var mag = this.magnitude(n);
          return Math.ceil((n * 10) / mag) * mag / 10;
      },
      magnitude: function (n) {
          return Math.pow(10, Math.floor(Math.log(n) / Math.LN10));
      },
      draw: function (x, y) {
          if (!this.data) {
              this.drawLoading(x, y);
          }
          else {
              this.drawGraph(x, y);
          }
      },
      drawLoading: function (x, y) {
          var scale = 0.5;
          var ctx = ig.system.context;
          ctx.save();
          ctx.scale(scale, scale);
          ctx.globalAlpha = 0.5;
          var indicator = this.workingIndicator[((this.timer.delta() * 4) | 0) % this.workingIndicator.length];
          this.font.draw('LOADING STATS  ' + indicator, x / scale, y / scale);
          ctx.restore();
      },
      drawGraph: function (x, y) {
          if (!this.data.length) {
              return;
          }
          var ctx = ig.system.context;
          var scale = 0.4;
          ctx.fillStyle = '#4dfed2';
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.lineWidth = 1;
          if (this.isExcerpt) {
              ctx.save();
              ctx.scale(scale, scale);
              ctx.globalAlpha = 0.5;
              this.font.draw(('(trend over ' + this.totalGames + ' games)'), x / scale, (y + this.height) / scale, ig.Font.ALIGN.LEFT);
              ctx.restore();
          }
          var numLabels = 3;
          var rw = this.width - 32;
          for (var i = 0; i < numLabels; i++) {
              ctx.save();
              ctx.scale(scale, scale);
              ctx.globalAlpha = 0.8;
              var v = 1 / (numLabels - 1) * i;
              var label = Math.round(v * this.scoreScale);
              var xp = x + this.width,
                  yp = y + this.height - this.height * v;
              this.font.draw(label, xp / scale, (yp - this.font.height * scale / 2) / scale, ig.Font.ALIGN.RIGHT);
              ctx.restore();
              ctx.beginPath();
              ctx.moveTo(x, yp);
              ctx.lineTo(x + rw, yp);
              ctx.stroke();
          }
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 2;
          var lastp = null;
          var max = Math.min((this.data.length * this.timer.delta()), this.data.length);
          for (var i = 0; i < max; i++) {
              var d = this.data[i];
              var v = 1 / (this.data.length - 1) * i || 0;
              var rx = x + (rw - 3) * v,
                  ry = y + this.height - (this.height - 3) * (d.score / this.scoreScale);
              ctx.fillRect(rx, ry, 3, 3);
              if (lastp) {
                      ctx.beginPath();
                      ctx.moveTo(lastp.x + 1.5, lastp.y + 1.5);
                      ctx.lineTo(rx + 1.5, ry + 1.5)
                      ctx.stroke();
                  }
              lastp = {
                      x: rx,
                      y: ry
                  };
          }
      }
  });
});
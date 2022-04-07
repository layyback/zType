ig.baked = true;
ig.module('game.menus.detailed-stats').requires('game.menus.base', 'game.xhr').defines(function () {
  DetailedStats = ig.Class.extend({
      container: null,
      closeButton: null,
      chart: null,
      maxScore: 0,
      games: [],
      scoreScale: 1,
      init: function () {
          this.container = ig.$('#ztype-stats');
          this.closeButton = ig.$('#ztype-stats-close');
          this.content = ig.$('#ztype-stats-content');
          this.canvas = ig.$('#ztype-stats-canvas');
          this.context = this.canvas.getContext('2d');
      },
      show: function () {
          this.container.style.height = ig.system.canvas.clientHeight + 'px';
          this.container.style.display = 'block';
          this.content.style.display = 'none';
          var that = this;
          setTimeout(function () {
              that.container.className = 'expanded';
              setTimeout(function () {
                  that.content.style.display = 'block';
                  ig.xhr('/api/', {
                      loadAll: true
                  }, that._initChart.bind(that));
              }, 400);
          }, 16);
          this.closeBound = this.close.bind(this);
          this.drawBound = this.draw.bind(this);
          this.closeButton.addEventListener('click', this.closeBound);
          this.shareFacebookBound = this.shareFacebook.bind(this);
          ig.$('#ztype-stats-share-facebook').addEventListener('click', this.shareFacebookBound);
          this.shareTwitterBound = this.shareTwitter.bind(this);
          ig.$('#ztype-stats-share-twitter').addEventListener('click', this.shareTwitterBound);
      },
      _initChart: function (response) {
          this.resize();
          for (var i = 0; i < response.games.length; i++) {
              var g = response.games[i];
              g.created = new Date(g.created * 1000);
              this.maxScore = Math.max(this.maxScore, g.score);
          }
          this.scoreScale = this.roundToMagnitude(this.maxScore);
          this.timer = new ig.Timer();
          this.data = response.games;
          ig.system.stopRunLoop();
          this.draw();
          this.canvas.addEventListener('mousemove', this.drawBound);
      },
      close: function () {
          ig.system.startRunLoop();
          ig.$('#ztype-stats-share-facebook').removeEventListener('click', this.shareFacebookBound);
          ig.$('#ztype-stats-share-twitter').removeEventListener('click', this.shareTwitterBound);
          this.closeButton.removeEventListener('click', this.closeBound);
          this.canvas.removeEventListener('mousemove', this.drawBound);
          this.container.className = '';
          this.content.style.display = 'none';
          var that = this;
          setTimeout(function () {
              that.container.style.display = 'none';
          }, 300);
      },
      resize: function () {
          var nw = this.content.clientWidth,
              nh = this.content.clientHeight - 64;
          if (this.canvas.width !== nw || this.canvas.height !== nh) {
                  this.canvas.width = nw;
                  this.canvas.height = nh;
              }
      },
      roundToMagnitude: function (n) {
          var mag = this.magnitude(n);
          return Math.ceil((n * 10) / mag) * mag / 10;
      },
      magnitude: function (n) {
          return Math.pow(10, Math.floor(Math.log(n) / Math.LN10));
      },
      draw: function (ev) {
          this.resize();
          var mx = -100,
              my = -100;
          if (ev) {
                  var pos = this.canvas.getBoundingClientRect();
                  mx = ev.clientX - pos.left;
                  my = ev.clientY - pos.top;
              }
          this.drawOnCanvas(this.canvas, mx, my);
      },
      drawOnCanvas: function (canvas, mx, my) {
          var width = canvas.width,
              height = canvas.height - 128;
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          if (!this.data.length) {
                  ctx.fillStyle = '#555';
                  ctx.font = '28px sans-serif';
                  ctx.textAlign = 'center';
                  ctx.fillText('NO STATS FOUND – PLAY SOME MORE', width / 2, height / 2);
                  ctx.textAlign = 'left';
                  return;
              }
          var x = 32,
              y = 64;
          var numLabels = 8;
          var rw = width - 84;
          ctx.fillStyle = '#555';
          ctx.font = '28px sans-serif';
          ctx.fillText('ZTYPE', 32, 38);
          ctx.fillStyle = '#ccc';
          ctx.fillText('SCORES OVER ' + this.data.length + ' GAMES', 140, 38);
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'right';
          ctx.strokeStyle = '#f0f0f0';
          ctx.lineWidth = 1;
          for (var i = 0; i < numLabels; i++) {
                  var v = 1 / (numLabels - 1) * i;
                  var label = Math.round(v * this.scoreScale);
                  var xp = x + rw + 32,
                      yp = y + height - height * v;
                  ctx.fillStyle = '#555';
                  ctx.fillText(label, xp, yp + 3)
                  ctx.beginPath();
                  ctx.moveTo(x, yp);
                  ctx.lineTo(x + rw, yp);
                  ctx.stroke();
              }
          ctx.textAlign = 'left';
          ctx.fillStyle = '#4dfed2';
          ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          ctx.lineWidth = 1;
          var lastp = null;
          var plot = null;
          var md = 15;
          for (var i = 0; i < this.data.length; i++) {
                  var g = this.data[i];
                  var v = 1 / (this.data.length - 1) * i || 0;
                  var rx = x + (rw - 3) * v,
                      ry = y + height - (height - 3) * (g.score / this.scoreScale);
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
                  if (mx < rx + md && mx > rx - md && my < ry + md && my > ry - md) {
                          var dx = Math.abs(mx - rx),
                              dy = Math.abs(my - ry);
                          var dist = dx * dx + dy * dy;
                          if (!plot || plot.dist > dist) {
                                  plot = {
                                      x: rx,
                                      y: ry,
                                      game: g,
                                      dist: dist
                                  };
                              }
                      }
              }
          if (plot) {
                  var pw = 290;
                  ctx.fillStyle = '#4dfed2';
                  ctx.fillRect(plot.x - 2, plot.y - 2, 7, 7);
                  var bx = plot.x > width - pw - 10 ? plot.x - pw - 7 : plot.x + 9,
                      by = plot.y - 32;
                  ctx.fillStyle = 'rgba(255,255,255,0.8)';
                  ctx.fillRect(bx, by, pw, 64);
                  var date = plot.game.created.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                      });
                  ctx.fillStyle = '#aaa';
                  ctx.font = '10px sans-serif'
                  ctx.fillText(date, bx + 16, by + 18);
                  var scdesc = 'SCORE ' + plot.game.score;
                  ctx.fillStyle = '#555';
                  ctx.font = '12px sans-serif'
                  ctx.fillText(scdesc, bx + 16, by + 36);
                  var desc = 'WAVE ' + plot.game.wave + ' / ACCURACY ' + plot.game.accuracy.toFixed(2) + '%' + ' / STREAK ' + plot.game.streak;
                  ctx.fillStyle = '#555';
                  ctx.font = '12px sans-serif'
                  ctx.fillText(desc, bx + 16, by + 52);
              }
      },
      saveScoresScreenshot: function (callback) {
          var offscreen = ig.$new('canvas');
          offscreen.width = 1280;
          offscreen.height = 720;
          this.drawOnCanvas(offscreen, -100, -100);
          var ctx = offscreen.getContext('2d');
          ctx.fillStyle = '#ccc';
          ctx.font = '28px sans-serif';
          ctx.fillText(' –  http://zty.pe/', 515, 38);
          var png = offscreen.toDataURL('image/png');
          ig.xhr('/api/', {
              saveScreenshot: true,
              data: png
          }, callback);
      },
      shareFacebook: function () {
          var shareWindow = window.open('about:blank', 'facebook-share', 'toolbar=0,status=0,width=626,height=436');
          this.saveScoresScreenshot(function (response) {
              var imageUrl = 'http://zty.pe/' + response.file;
              shareWindow.location.href = 'https://www.facebook.com/dialog/feed' + '?app_id=112268002182064' + '&display=popup' + '&caption=' + encodeURIComponent('My ZTYPE Scores') + '&link=' + encodeURIComponent('http://zty.pe/') + '&picture=' + encodeURIComponent(imageUrl);
          });
      },
      shareTwitter: function () {
          var shareWindow = window.open('about:blank', 'facebook-share', 'toolbar=0,status=0,width=575,height=400');
          this.saveScoresScreenshot(function (response) {
              var imageUrl = 'http://zty.pe/' + response.file;
              shareWindow.location.href = 'http://twitter.com/share' + '?text=' + encodeURIComponent('My #ZTYPE Scores: ' + imageUrl + ' - ')
          });
      }
  });
});
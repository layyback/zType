ig.baked = true;
ig.module('game.main').requires('impact.game', 'impact.font', 'game.menus.about', 'game.menus.game-over', 'game.menus.settings', 'game.menus.title', 'game.entities.enemy-missle', 'game.entities.enemy-mine', 'game.entities.enemy-destroyer', 'game.entities.enemy-oppressor', 'game.entities.player', 'game.keyboard', 'game.xhr', 'game.ease', 'plugins.silent-loader', 'plugins.rise-loader', 'game.document-scanner', 'game.words.en').defines(function () {
  Number.zeroes = '000000000000';
  Number.prototype.zeroFill = function (d) {
      var s = this.toString();
      return Number.zeroes.substr(0, d - s.length) + s;
  };
  ZType = ig.Game.extend({
      font: new ig.Font('media/fonts/avenir-18-white.png'),
      fontTitle: new ig.Font('media/fonts/avenir-36-blue.png'),
      separatorBar: new ig.Image('media/ui/bar-blue.png'),
      idleTimer: null,
      spawnTimer: null,
      targets: {},
      currentTarget: null,
      yScroll: 0,
      yScroll2: 0,
      gradient: new ig.Image('media/background/gradient.png'),
      stars: new ig.Image('media/background/stars.jpg'),
      grid: new ig.Image('media/background/grid.png'),
      music1: new ig.Sound('media/music/endure.ogg', false),
      music2: new ig.Sound('media/music/orientation.ogg', false),
      cancelSound: new ig.Sound('media/sounds/cancel.ogg'),
      spawnSound: new ig.Sound('media/sounds/spawn.ogg'),
      menu: null,
      mode: 0,
      score: 0,
      streak: 0,
      hits: 0,
      misses: 0,
      multiplier: 1,
      wave: {},
      gameTime: 0,
      kills: 0,
      emps: 0,
      personalBest: 0,
      isPersonalBest: false,
      waitingForItunes: false,
      adPage: null,
      difficulty: (ig.ua.mobile ? 'MOBILE' : 'DESKTOP'),
      keyboard: null,
      _screenShake: 0,
      wordlist: null,
      init: function () {
          if (ig.doc && ig.doc.fragments.length < 2) {
              ig.doc = null;
          }
          this.fontTitle.letterSpacing = -2;
          this.font.letterSpacing = -1;
          var bgmap = new ig.BackgroundMap(620, [
              [1]
          ], this.grid);
          bgmap.repeat = true;
          this.backgroundMaps.push(bgmap);
          ig.music.add(this.music1);
          ig.music.add(this.music2);
          ig.music.loop = true;
          ig.music.random = true;
          var soundVolume = localStorage.getItem('soundVolume');
          var musicVolume = localStorage.getItem('musicVolume');
          if (soundVolume !== null && musicVolume !== null) {
              ig.soundManager.volume = parseFloat(soundVolume);
              ig.music.volume = parseFloat(musicVolume);
          }
          else {
              ig.soundManager.volume = 0.5;
              ig.music.volume = 0.5;
          }
          window.addEventListener('keypress', this.keypress.bind(this), false);
          window.addEventListener('keydown', this.keydown.bind(this), false);
          var layoutKey = localStorage.getItem('keyboardLayout');
          var layout = layoutKey ? ig.Keyboard.LAYOUT[layoutKey] : null;
          this.keyboard = new ig.Keyboard(this.virtualKeydown.bind(this), layout);
          ig.input.bind(ig.KEY.ENTER, 'ok');
          ig.input.bind(ig.KEY.SPACE, 'ok');
          ig.input.bind(ig.KEY.MOUSE1, 'click');
          ig.input.bind(ig.KEY.ESC, 'menu');
          ig.input.bind(ig.KEY.UP_ARROW, 'up');
          ig.input.bind(ig.KEY.DOWN_ARROW, 'down');
          ig.input.bind(ig.KEY.LEFT_ARROW, 'left');
          ig.input.bind(ig.KEY.RIGHT_ARROW, 'right');
          ig.system.canvas.onclick = function () {
              window.focus();
          };
          this.personalBest = parseInt(localStorage.getItem('highscore')) | 0;
          if (window.Ejecta) {
              this.gameCenter = new Ejecta.GameCenter();
              this.gameCenter.authenticate();
              if (!localStorage.getItem('removeAds')) {
                  this.adPage = new Ejecta.AdMobPage("ca-app-pub-8533552145182353/1344920700");
              }
          }
          if (window.Cocoon && window.Cocoon.Ad) {
              Cocoon.Ad.configure({
                  android: {
                      interstitial: 'ca-app-pub-8533552145182353/1042008307'
                  }
              });
              this.cocoonInterstitial = Cocoon.Ad.createInterstitial();
          }
          this.setTitle();
          this.wordlist = ig.WORDS.EN;
          if (ig.doc) {
              this.reAllWordCharacter = /^[a-zßàáâãäåæçèéêëìíîïðñòóôõöøùúûüý]+$/i;
              this.reSplitNonWord = /[^0-9a-zßàáâãäåæçèéêëìíîïðñòóôõöøùúûüý]/i;
              ig.doc.fastForwardScanAnimation();
          }
      },
      reset: function () {
          this.entities = [];
          this.currentTarget = null;
          this.wave = ig.copy(ZType.WAVES[this.difficulty]);
          var first = 'a'.charCodeAt(0),
              last = 'z'.charCodeAt(0);
          for (var i = first; i <= last; i++) {
                  this.targets[String.fromCharCode(i)] = [];
              }
          for (var c in this._umlautTable) {
                  this.targets[c] = [];
              }
          this.score = 0;
          this.rs = 0;
          this.streak = 0;
          this.longestStreak = 0;
          this.hits = 0;
          this.misses = 0;
          this.kills = 0;
          this.multiplier = 1;
          this.gameTime = 0;
          this.isPersonalBest = false;
          this.speedFactor = 1;
          this.lastKillTimer = new ig.Timer();
          this.spawnTimer = new ig.Timer();
          this.idleTimer = new ig.Timer();
          this.waveEndTimer = null;
      },
      nextWave: function () {
          this.wave.wave++;
          this.wave.spawnWait = (this.wave.spawnWait * 0.97).limit(0.2, 1);
          this.wave.currentSpawnWait = this.wave.spawnWait;
          this.wave.spawn = [];
          this.speedFactor *= this.wave.speedIncrease;
          if (ig.doc) {
              for (var i = 0; i < 10 && this.wave.spawn.length < 2; i++) {
                  this.nextDocFragment();
              }
              this.wave.spawn.reverse();
          }
          else {
              var dec = 0;
              for (var t = 0; t < this.wave.types.length; t++) {
                  var type = this.wave.types[t];
                  type.count -= dec;
                  if (this.wave.wave % type.incEvery == 0) {
                      type.count++;
                      dec++;
                  }
                  for (var s = 0; s < type.count; s++) {
                      this.wave.spawn.push(type);
                  }
              }
              this.wave.spawn.sort(function () {
                  return Math.random() - 0.5;
              });
          }
      },
      nextDocFragment: function () {
          this.wave.fragment++;
          var fragment = ig.doc.fragments[(this.wave.fragment - 1) % ig.doc.fragments.length];
          if (!ig.ua.mobile) {
              ig.doc.highlightFragment(fragment);
          }
          for (var t = 0; t < this.wave.types.length; t++) {
              var type = this.wave.types[t];
              if (this.wave.wave % type.incEvery == 0) {
                  type.count++;
              }
          }
          var words = fragment.text.replace(/['’‘’’]/g, '').split(this.reSplitNonWord);
          var filteredWords = [];
          for (var i = 0; i < words.length; i++) {
              var w = words[i].trim();
              if (w.match(this.reAllWordCharacter)) {
                  filteredWords.push(w);
              }
          }
          var wordsByLength = filteredWords.slice().sort(function (a, b) {
              return b.length - a.length;
          });
          var bigShipChance = (this.wave.types[0].count + this.wave.types[1].count) / this.wave.types[2].count;
          var wordLengthForBigShip = wordsByLength[Math.floor(wordsByLength.length * bigShipChance * 0.75)].length;
          var longSentenceFactor = (filteredWords.length / 8).limit(1, 1.5);
          for (var i = 0; i < filteredWords.length; i++) {
              var w = filteredWords[i];
              var wait = (w.length / 5).limit(0.7, 3) * 1.2 * longSentenceFactor;
              var type = (w.length > wordLengthForBigShip) ? (Math.random() > 0.75 ? EntityEnemyOppressor : EntityEnemyDestroyer) : EntityEnemyMine;
              this.wave.spawn.push({
                  type: type,
                  word: w,
                  wait: wait
              });
          }
      },
      spawnCurrentWave: function () {
          if (!this.wave.spawn.length) {
              if (this.entities.length <= 1 && !this.waveEndTimer) {
                  this.waveEndTimer = new ig.Timer(2);
              }
              else if (this.waveEndTimer && this.waveEndTimer.delta() > 0) {
                  this.waveEndTimer = null;
                  this.nextWave();
              }
          }
          else if (this.spawnTimer.delta() > this.wave.currentSpawnWait) {
              this.spawnTimer.reset();
              var spawn = this.wave.spawn.pop();
              var x = Math.random().map(0, 1, 10, ig.system.width - 10);
              var y = -30;
              this.spawnEntity(spawn.type, x, y, {
                  healthBoost: this.wave.healthBoost,
                  word: spawn.word
              }, true);
              this.wave.currentSpawnWait = spawn.wait ? this.wave.spawnWait * spawn.wait : this.wave.spawnWait;
          }
      },
      spawnEntity: function (type, x, y, settings, atBeginning) {
          var ent = new(type)(x, y, settings || {});
          if (atBeginning) {
              this.entities.unshift(ent);
          }
          else {
              this.entities.push(ent);
          }
          if (ent.name) {
              this.namedEntities[ent.name] = ent;
          }
          return ent;
      },
      registerTarget: function (letter, ent) {
          var c = this.translateUmlaut(letter.toLowerCase());
          this.targets[c].push(ent);
          if (!this.currentTarget) {
              this.setExpectedKeys();
          }
      },
      unregisterTarget: function (letter, ent) {
          var c = this.translateUmlaut(letter.toLowerCase());
          this.targets[c].erase(ent);
          if (!this.currentTarget) {
              this.setExpectedKeys();
          }
      },
      setExpectedKeys: function () {
          this.keyboard.expectedKeys = [];
          for (var k in this.targets) {
              if (this.targets[k].length) {
                  this.keyboard.expectedKeys.push(k);
              }
          }
      },
      _umlautTable: {
          'ß': 's',
          'à': 'a',
          'á': 'a',
          'â': 'a',
          'ã': 'a',
          'ä': 'a',
          'å': 'a',
          'æ': 'a',
          'ç': 'c',
          'è': 'e',
          'é': 'e',
          'ê': 'e',
          'ë': 'e',
          'ì': 'i',
          'í': 'i',
          'î': 'i',
          'ï': 'i',
          'ð': 'd',
          'ñ': 'n',
          'ò': 'o',
          'ó': 'o',
          'ô': 'o',
          'õ': 'o',
          'ö': 'o',
          'ø': 'o',
          'ù': 'u',
          'ú': 'u',
          'û': 'u',
          'ü': 'u',
          'ý': 'y'
      },
      translateUmlaut: function (k) {
          if (ig.ua.mobile || (ig.doc && ig.doc.looksLikeEnglish)) {
              return this._umlautTable[k] || k;
          }
          else {
              return k;
          }
      },
      keypress: function (ev) {
          if (ev.target.tagName == 'INPUT' || ev.ctrlKey || ev.altKey || this.mode != ZType.MODE.GAME || this.menu) {
              return true;
          }
          var c = ev.charCode;
          if (c < 64) {
              return true;
          }
          ev.stopPropagation();
          ev.preventDefault();
          var letter = String.fromCharCode(c).toLowerCase();
          this.shoot(letter);
          return false;
      },
      keydown: function (ev) {
          if (ev.target.tagName == 'INPUT' || ev.ctrlKey || ev.altKey || this.mode != ZType.MODE.GAME || this.menu) {
              return true;
          }
          var c = ev.which;
          if (c === ig.KEY.ENTER) {
              this.player.spawnEMP();
              return false;
          }
          if (c == ig.KEY.BACKSPACE) {
              if (this.currentTarget) {
                  this.currentTarget.cancel();
                  this.cancelSound.play();
              }
              ev.preventDefault();
              return false;
          }
          return true;
      },
      virtualKeydown: function (letter) {
          if (this.mode != ZType.MODE.GAME || this.menu) {
              return true;
          }
          if (letter == 'ENTER') {
              this.player.spawnEMP();
              return true;
          }
          if (letter == 'ESC') {
              this.menu = new MenuSettings();
              return true;
          }
          if (letter == 'BACKSPACE') {
              if (this.currentTarget) {
                  this.currentTarget.cancel();
                  this.cancelSound.play();
              }
              return true;
          }
          this.shoot(letter);
      },
      shoot: function (letter) {
          this.idleTimer.reset();
          if (!this.currentTarget) {
              var potentialTargets = this.targets[letter];
              var nearestDistance = -1;
              var nearestTarget = null;
              for (var i = 0; i < potentialTargets.length; i++) {
                  var distance = this.player.distanceTo(potentialTargets[i]);
                  if (distance < nearestDistance || !nearestTarget) {
                      nearestDistance = distance;
                      nearestTarget = potentialTargets[i];
                  }
              }
              if (nearestTarget) {
                  nearestTarget.target();
              }
              else {
                  this.player.miss();
                  this.multiplier = 1;
                  this.streak = 0;
                  this.misses++;
              }
          }
          if (this.currentTarget) {
              var target = this.currentTarget;
              var hit = this.currentTarget.isHitBy(letter);
              if (hit) {
                  this.player.shoot(target);
                  this.score += this.multiplier;
                  this.hits++;
                  this.streak++;
                  this.longestStreak = Math.max(this.streak, this.longestStreak);
                  if (ZType.MULTIPLIER_TIERS[this.streak]) {
                      this.multiplier = ZType.MULTIPLIER_TIERS[this.streak];
                      this.keyboard.showMultiplier(this.multiplier);
                  }
                  if (target.dead) {
                      this.kills++;
                      this.setExpectedKeys();
                  }
                  else {
                      var translated = this.translateUmlaut(target.remainingWord.charAt(0).toLowerCase());
                      if (this.keyboard) {
                          this.keyboard.expectedKeys = [translated];
                      }
                  }
              }
              else {
                  this.player.miss();
                  this.multiplier = 1;
                  this.streak = 0;
                  this.misses++;
              }
          }
      },
      setGame: function () {
          this.setGameState();
          this.gameTransitionTimer = new ig.Timer(2);
          this.nextWave();
      },
      setGameState: function () {
          this.reset();
          var sx = ig.system.width / 2 - 6,
              sy = ig.system.height - this.keyboard.height * this.keyboard.drawScale - 30;
          this.player = this.spawnEntity(EntityPlayer, sx, sy);
          this.mode = ZType.MODE.GAME;
          ig.music.next();
          this.spawnSound.play();
          this.emps = 3;
      },
      continue: function () {
          var fragment = this.wave.fragment;
          this.setGameState();
          this.wave.fragment = Math.max(0, fragment - 1);
          this.nextWave();
          this.menu = null;
      },
      setGameOver: function () {
          if (this.score > this.personalBest) {
              this.isPersonalBest = true;
              this.personalBest = this.score;
              localStorage.setItem('highscore', this.personalBest);
          }
          if (this.gameCenter && this.score > 5) {
              this.gameCenter.reportScore('score', this.score);
          }
          this.mode = ZType.MODE.GAME_OVER;
          ig.music.fadeOut(1);
      },
      showGameOverScreen: function () {
          this.menu = new MenuGameOver();
          if (this.adPage && !localStorage.getItem('removeAds')) {
              this.adPage.show();
          }
          if (this.cocoonInterstitial) {
              this.cocoonInterstitial.show();
          }
      },
      setTitle: function () {
          if (this.adPage) {
              setTimeout(function () {
                  ig.game.adPage.load();
              }, 3000);
          }
          if (this.cocoonInterstitial) {
              this.cocoonInterstitial.load();
          }
          this.reset();
          this.mode = ZType.MODE.TITLE;
          this.menu = new MenuTitle();
          this.emps = 0;
      },
      update: function () {
          if (ig.input.pressed('menu')) {
              if (this.menu && this.menu instanceof MenuSettings) {
                  this.menu = null;
              }
              else if (!this.menu) {
                  this.menu = new MenuSettings();
              }
          }
          if (this.menu) {
              this.backgroundMaps[0].scroll.y -= 100 * ig.system.tick;
              if (this.waitingForItunes) {
                  return;
              }
              this.menu.update();
              if (!(this.menu instanceof MenuGameOver)) {
                  return;
              }
          }
          this.parent();
          if (this.mode === ZType.MODE.GAME) {
              this.spawnCurrentWave();
              if (!this.menu && !ig.ua.mobile && ig.input.pressed('click') && ig.input.mouse.x < 64 && ig.input.mouse.y < 64) {
                  this.menu = new MenuSettings();
              }
          }
          else if (ig.input.pressed('ok')) {
              if (this.mode === ZType.MODE.TITLE) {
                  this.setGame();
              }
              else if ((this.mode === ZType.MODE.GAME_OVER && this.menu && this.menu.timer.delta() > 1.5) || this.mode !== ZType.MODE.GAME_OVER) {
                  this.setTitle();
              }
          }
          var scrollSpeed = 100;
          if (this.waveEndTimer) {
              this.player.targetAngle = 0;
              var dt = Math.sin((this.waveEndTimer.delta() * -0.5) * Math.PI);
              scrollSpeed = 100 + dt * dt * 300;
              this.idleTimer.reset();
          }
          this.yScroll2 += ig.system.tick * scrollSpeed * 0.1;
          this.yScroll2 = this.yScroll2 % this.stars.height;
          this.yScroll -= scrollSpeed * ig.system.tick;
          this.backgroundMaps[0].scroll.y = this.yScroll;
          if (this.entities.length > 1 && this.mode == ZType.MODE.GAME) {
              this.gameTime += ig.system.tick;
          }
          if (this.score - this.rs > 100 || ig.Timer.timeScale != 1) {
              this.score = 0;
          }
          this.rs = this.score;
          this._screenShake /= 1.1;
          if (this._screenShake < 0.5) {
              this._screenShake = 0;
          }
          this._rscreen.x = Math.random() * this._screenShake;
          this._rscreen.y = Math.random() * this._screenShake;
      },
      screenShake: function (strength) {
          this._screenShake = Math.max(strength, this._screenShake);
      },
      draw: function () {
          if (this.mode == ZType.MODE.GAME || this.mode === ZType.MODE.GAME_OVER) {
              this.drawGame();
          }
          if (this.menu) {
              this.menu.draw();
              if (typeof(this.menu.scroll) != 'undefined') {
                  this.yScroll2 = this.menu.scroll;
              }
              if (this.gameTransitionTimer) {
                  var dt = 2 - (this.gameTransitionTimer.delta() * -1);
                  this.menu.transition = (dt / 2);
                  var sy = ig.system.height - this.keyboard.height * this.keyboard.drawScale - 30;
                  var move = sy - MenuTitle.prototype.playerPos.y;
                  this.menu.playerPos.y = ig.ease.inOutBack(dt, MenuTitle.prototype.playerPos.y, move, 2);
                  this.menu.alpha = 1 - (dt / 2);
                  this.player.pos.y = this.menu.playerPos.y;
                  if (dt > 2) {
                      this.gameTransitionTimer = null;
                      this.menu = null;
                  }
              }
          }
          if (this.waitingForItunes) {
              this.drawSpinner();
          }
      },
      drawSpinner: function () {
          ig.system.context.fillStyle = 'rgba(0,0,0,0.7)';
          ig.system.context.fillRect(0, 0, ig.system.width, ig.system.height);
          var spinner = ['', '.', '..', '...'];
          var tt = ((ig.Timer.time * 5) % spinner.length) | 0;
          this.fontTitle.draw(spinner[tt], ig.system.width / 2 - 16, ig.system.height / 2);
      },
      drawGame: function () {
          var ctx = ig.system.context;
          ctx.save();
          ctx.scale(0.75, 0.75);
          this.stars.draw(0, this.yScroll2 - this.stars.height);
          this.stars.draw(0, this.yScroll2);
          ctx.restore();
          ig.system.context.globalAlpha = 0.8;
          ig.system.context.drawImage(this.gradient.data, 0, 0, ig.system.width, ig.system.height);
          var d = this.lastKillTimer.delta();
          ig.system.context.globalAlpha = d < 0 ? d * -1 + 0.1 : 0.1;
          this.backgroundMaps[0].draw();
          ig.system.context.globalAlpha = 1;
          ig.system.context.globalCompositeOperation = 'lighter';
          for (var i = 0; i < this.entities.length; i++) {
              this.entities[i].draw();
          }
          ig.system.context.globalCompositeOperation = 'source-over';
          for (var i = 0; i < this.entities.length; i++) {
              this.entities[i].drawLabel && this.entities[i].drawLabel();
          }
          if (this.mode == ZType.MODE.GAME) {
              this.drawUI();
          }
      },
      drawUI: function () {
          if (this.waveEndTimer) {
              var d = -this.waveEndTimer.delta();
              var a = d > 1.7 ? d.map(2, 1.7, 0, 1) : d < 1 ? d.map(1, 0, 1, 0) : 1;
              var ys = 276 + (d < 1 ? Math.cos(1 - d).map(1, 0, 0, 250) : 0);
              var w = this.wave.wave.zeroFill(3);
              ig.system.context.globalAlpha = a;
              this.fontTitle.draw('WAVE ' + w + ' CLEAR', 32, ys, ig.Font.ALIGN.LEFT);
              ig.system.context.drawImage(this.separatorBar.data, 32, ys + 48, 276, 2);
              this.font.draw('SCORE: ' + this.score.zeroFill(6), 32, (ys * 1.2) + 10, ig.Font.ALIGN.LEFT);
              ig.system.context.globalAlpha = 1;
          }
          if (!ig.ua.mobile && this.idleTimer.delta() > 8) {
              var aa = this.idleTimer.delta().map(8, 9, 0, 1).limit(0, 1);
              ig.system.context.globalAlpha = (Math.sin(this.idleTimer.delta() * 4) * 0.25 + 0.75) * aa;
              this.font.draw('Type the words to shoot!\nENTER for EMP', ig.system.width / 2, ig.system.height - 180, ig.Font.ALIGN.CENTER);
              ig.system.context.globalAlpha = 1;
          }
          this.keyboard.draw();
      },
      purchaseRemoveAds: function () {
          this.iap = this.iap || new Ejecta.IAPManager();
          ig.game.waitingForItunes = true;
          this.iap.getProducts(['removeAds'], function (error, products) {
              if (error) {
                  ig.game.waitingForItunes = false;
                  ig.game.setTitle();
              }
              else if (products.length) {
                  products[0].purchase(1, function (error, transaction) {
                      ig.game.waitingForItunes = false;
                      if (error) {
                          console.log(error);
                      }
                      else {
                          localStorage.setItem('removeAds', true);
                      }
                      ig.game.setTitle();
                  });
              }
          });
      },
      restoreIAP: function () {
          this.iap = this.iap || new Ejecta.IAPManager();
          ig.game.waitingForItunes = true;
          this.iap.restoreTransactions(function (error, transactions) {
              ig.game.waitingForItunes = false;
              if (error) {
                  console.log(error);
              }
              else {
                  for (var i = 0; i < transactions.length; i++) {
                      if (transactions[i].productId == 'removeAds') {
                          localStorage.setItem('removeAds', true);
                          ig.game.setTitle();
                          return;
                      }
                  }
              }
              ig.game.setTitle();
          });
      }
  });
  ZType.MODE = {
      TITLE: 0,
      GAME: 1,
      GAME_OVER: 2
  };
  ZType.MULTIPLIER_TIERS = {
      20: 2,
      50: 3
  };
  ZType.WAVES = {
      MOBILE: {
          fragment: 0,
          wave: 0,
          spawn: [],
          spawnWait: 1,
          healthBoost: 0,
          speedIncrease: 1.01,
          types: [{
              type: EntityEnemyOppressor,
              count: 0,
              incEvery: 9
          },
          {
              type: EntityEnemyDestroyer,
              count: 0,
              incEvery: 4
          },
          {
              type: EntityEnemyMine,
              count: 3,
              incEvery: 1
          }]
      },
      DESKTOP: {
          fragment: 0,
          wave: 0,
          spawn: [],
          spawnWait: 0.7,
          healthBoost: 0,
          speedIncrease: 1.05,
          types: [{
              type: EntityEnemyOppressor,
              count: 0,
              incEvery: 7
          },
          {
              type: EntityEnemyDestroyer,
              count: 0,
              incEvery: 3
          },
          {
              type: EntityEnemyMine,
              count: 3,
              incEvery: 1
          }]
      }
  };
  var canvas = ig.$('#ztype-game-canvas') || ig.$('#canvas');
  var width = 480;
  var height = 720;
  if (ig.ua.mobile) {
      if (ig.$('#ztype-gsense') && ig.$('#ztype-byline')) {
          ig.$('#ztype-gsense').style.display = 'none';
          ig.$('#ztype-byline').style.display = 'none';
      }
      var resize = function () {
          height = Math.min((window.innerHeight / (window.innerWidth)) * width, 852);
          canvas.style.position = 'absolute';
          canvas.style.display = 'block';
          canvas.style.width = window.innerWidth + 'px';
          canvas.style.height = (window.innerWidth / width) * height + 'px';
          canvas.style.bottom = 'auto';
          canvas.style.right = 'auto';
          if (ig.game && ig.system) {
              ig.system.resize(width, height);
          }
      }
      window.addEventListener('resize', function () {
          setTimeout(resize, 500);
      });
      resize();
  }
  if (window !== window.top || window.location.href.match(/\?gp=1/)) {
      var ad = ig.$('#ztype-gsense');
      if (ad) {
          ad.className = 'ztype-gsense-full';
      }
  }
  if (window.ZTypeDocumentMode) {
      ig.doc = new ig.DocumentScanner(document.body);
      if (!ig.ua.mobile) {
          ig.doc.playScanAnimation(function () {
              if (!ig.ua.mobile) {
                  (adsbygoogle = window.adsbygoogle || []).push({});
              }
          });
      }
  }
  document.body.className += ig.ua.mobile ? 'ztype-mobile' : 'ztype-desktop';
  ig.System.drawMode = ig.System.DRAW.SUBPIXEL;
  ig.Sound.use = [ig.Sound.FORMAT.OGG, ig.Sound.FORMAT.MP3];
  if (window.Ejecta || window.Cocoon) {
      ig.main('#canvas', ZType, 60, width, height, 1, ig.SilentLoader);
  }
  else {
      ig.main('#ztype-game-canvas', ZType, 60, width, height, 1, ig.RiseLoader);
  }
});
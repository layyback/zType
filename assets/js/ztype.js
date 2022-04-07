(function (window) {
  "use strict";
  Number.prototype.map = function (istart, istop, ostart, ostop) {
      return ostart + (ostop - ostart) * ((this - istart) / (istop - istart));
  };
  Number.prototype.limit = function (min, max) {
      return Math.min(max, Math.max(min, this));
  };
  Number.prototype.round = function (precision) {
      precision = Math.pow(10, precision || 0);
      return Math.round(this * precision) / precision;
  };
  Number.prototype.floor = function () {
      return Math.floor(this);
  };
  Number.prototype.ceil = function () {
      return Math.ceil(this);
  };
  Number.prototype.toInt = function () {
      return (this | 0);
  };
  Number.prototype.toRad = function () {
      return (this / 180) * Math.PI;
  };
  Number.prototype.toDeg = function () {
      return (this * 180) / Math.PI;
  };
  Object.defineProperty(Array.prototype, 'erase', {
      value: function (item) {
          for (var i = this.length; i--;) {
              if (this[i] === item) {
                  this.splice(i, 1);
              }
          }
          return this;
      }
  });
  Object.defineProperty(Array.prototype, 'random', {
      value: function (item) {
          return this[Math.floor(Math.random() * this.length)];
      }
  });
  Function.prototype.bind = Function.prototype.bind ||
  function (oThis) {
      if (typeof this !== "function") {
          throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
      }
      var aArgs = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          fNOP = function () {},
          fBound = function () {
              return fToBind.apply((this instanceof fNOP && oThis ? this : oThis), aArgs.concat(Array.prototype.slice.call(arguments)));
          };
      fNOP.prototype = this.prototype;
      fBound.prototype = new fNOP();
      return fBound;
  };
  window.ig = {
      game: null,
      debug: null,
      version: '1.24',
      global: window,
      modules: {},
      resources: [],
      ready: false,
      baked: false,
      nocache: '',
      ua: {},
      prefix: (window.ImpactPrefix || ''),
      lib: 'lib/',
      _current: null,
      _loadQueue: [],
      _waitForOnload: 0,
      $: function (selector) {
          return selector.charAt(0) == '#' ? document.getElementById(selector.substr(1)) : document.getElementsByTagName(selector);
      },
      $new: function (name) {
          return document.createElement(name);
      },
      copy: function (object) {
          if (!object || typeof(object) != 'object' || object instanceof HTMLElement || object instanceof ig.Class) {
              return object;
          }
          else if (object instanceof Array) {
              var c = [];
              for (var i = 0, l = object.length; i < l; i++) {
                  c[i] = ig.copy(object[i]);
              }
              return c;
          }
          else {
              var c = {};
              for (var i in object) {
                  c[i] = ig.copy(object[i]);
              }
              return c;
          }
      },
      merge: function (original, extended) {
          for (var key in extended) {
              var ext = extended[key];
              if (typeof(ext) != 'object' || ext instanceof HTMLElement || ext instanceof ig.Class || ext === null) {
                  original[key] = ext;
              }
              else {
                  if (!original[key] || typeof(original[key]) != 'object') {
                      original[key] = (ext instanceof Array) ? [] : {};
                  }
                  ig.merge(original[key], ext);
              }
          }
          return original;
      },
      ksort: function (obj) {
          if (!obj || typeof(obj) != 'object') {
              return [];
          }
          var keys = [],
              values = [];
          for (var i in obj) {
                  keys.push(i);
              }
          keys.sort();
          for (var i = 0; i < keys.length; i++) {
                  values.push(obj[keys[i]]);
              }
          return values;
      },
      setVendorAttribute: function (el, attr, val) {
          var uc = attr.charAt(0).toUpperCase() + attr.substr(1);
          el[attr] = el['ms' + uc] = el['moz' + uc] = el['webkit' + uc] = el['o' + uc] = val;
      },
      getVendorAttribute: function (el, attr) {
          var uc = attr.charAt(0).toUpperCase() + attr.substr(1);
          return el[attr] || el['ms' + uc] || el['moz' + uc] || el['webkit' + uc] || el['o' + uc];
      },
      normalizeVendorAttribute: function (el, attr) {
          var prefixedVal = ig.getVendorAttribute(el, attr);
          if (!el[attr] && prefixedVal) {
              el[attr] = prefixedVal;
          }
      },
      getImagePixels: function (image, x, y, width, height) {
          var canvas = ig.$new('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          var ctx = canvas.getContext('2d');
          ig.System.SCALE.CRISP(canvas, ctx);
          var ratio = ig.getVendorAttribute(ctx, 'backingStorePixelRatio') || 1;
          ig.normalizeVendorAttribute(ctx, 'getImageDataHD');
          var realWidth = image.width / ratio,
              realHeight = image.height / ratio;
          canvas.width = Math.ceil(realWidth);
          canvas.height = Math.ceil(realHeight);
          ctx.drawImage(image, 0, 0, realWidth, realHeight);
          return (ratio === 1) ? ctx.getImageData(x, y, width, height) : ctx.getImageDataHD(x, y, width, height);
      },
      module: function (name) {
          if (ig._current) {
              throw ("Module '" + ig._current.name + "' defines nothing");
          }
          if (ig.modules[name] && ig.modules[name].body) {
              throw ("Module '" + name + "' is already defined");
          }
          ig._current = {
              name: name,
              requires: [],
              loaded: false,
              body: null
          };
          ig.modules[name] = ig._current;
          ig._loadQueue.push(ig._current);
          return ig;
      },
      requires: function () {
          ig._current.requires = Array.prototype.slice.call(arguments);
          return ig;
      },
      defines: function (body) {
          ig._current.body = body;
          ig._current = null;
          ig._initDOMReady();
      },
      addResource: function (resource) {
          ig.resources.push(resource);
      },
      setNocache: function (set) {
          ig.nocache = set ? '?' + Date.now() : '';
      },
      log: function () {},
      assert: function (condition, msg) {},
      show: function (name, number) {},
      mark: function (msg, color) {},
      _loadScript: function (name, requiredFrom) {
          ig.modules[name] = {
              name: name,
              requires: [],
              loaded: false,
              body: null
          };
          ig._waitForOnload++;
          var path = ig.prefix + ig.lib + name.replace(/\./g, '/') + '.js' + ig.nocache;
          var script = ig.$new('script');
          script.type = 'text/javascript';
          script.src = path;
          script.onload = function () {
              ig._waitForOnload--;
              ig._execModules();
          };
          script.onerror = function () {
              throw ('Failed to load module ' + name + ' at ' + path + ' ' + 'required from ' + requiredFrom);
          };
          ig.$('head')[0].appendChild(script);
      },
      _execModules: function () {
          var modulesLoaded = false;
          for (var i = 0; i < ig._loadQueue.length; i++) {
              var m = ig._loadQueue[i];
              var dependenciesLoaded = true;
              for (var j = 0; j < m.requires.length; j++) {
                  var name = m.requires[j];
                  if (!ig.modules[name]) {
                      dependenciesLoaded = false;
                      ig._loadScript(name, m.name);
                  }
                  else if (!ig.modules[name].loaded) {
                      dependenciesLoaded = false;
                  }
              }
              if (dependenciesLoaded && m.body) {
                  ig._loadQueue.splice(i, 1);
                  m.loaded = true;
                  m.body();
                  modulesLoaded = true;
                  i--;
              }
          }
          if (modulesLoaded) {
              ig._execModules();
          }
          else if (!ig.baked && ig._waitForOnload == 0 && ig._loadQueue.length != 0) {
              var unresolved = [];
              for (var i = 0; i < ig._loadQueue.length; i++) {
                  var unloaded = [];
                  var requires = ig._loadQueue[i].requires;
                  for (var j = 0; j < requires.length; j++) {
                      var m = ig.modules[requires[j]];
                      if (!m || !m.loaded) {
                          unloaded.push(requires[j]);
                      }
                  }
                  unresolved.push(ig._loadQueue[i].name + ' (requires: ' + unloaded.join(', ') + ')');
              }
              throw ("Unresolved (or circular?) dependencies. " + "Most likely there's a name/path mismatch for one of the listed modules " + "or a previous syntax error prevents a module from loading:\n" + unresolved.join('\n'));
          }
      },
      _DOMReady: function () {
          if (!ig.modules['dom.ready'].loaded) {
              if (!document.body) {
                  return setTimeout(ig._DOMReady, 13);
              }
              ig.modules['dom.ready'].loaded = true;
              ig._waitForOnload--;
              ig._execModules();
          }
          return 0;
      },
      _boot: function () {
          if (document.location.href.match(/\?nocache/)) {
              ig.setNocache(true);
          }
          ig.ua.pixelRatio = window.devicePixelRatio || 1;
          ig.ua.viewport = {
              width: window.innerWidth,
              height: window.innerHeight
          };
          ig.ua.screen = {
              width: window.screen.availWidth * ig.ua.pixelRatio,
              height: window.screen.availHeight * ig.ua.pixelRatio
          };
          ig.ua.iPhone = /iPhone|iPod/i.test(navigator.userAgent);
          ig.ua.iPhone4 = (ig.ua.iPhone && ig.ua.pixelRatio == 2);
          ig.ua.iPad = /iPad/i.test(navigator.userAgent);
          ig.ua.android = /android/i.test(navigator.userAgent);
          ig.ua.winPhone = /Windows Phone/i.test(navigator.userAgent);
          ig.ua.iOS = ig.ua.iPhone || ig.ua.iPad;
          ig.ua.mobile = ig.ua.iOS || ig.ua.android || ig.ua.winPhone || /mobile/i.test(navigator.userAgent);
          ig.ua.touchDevice = (('ontouchstart' in window) || (window.navigator.msMaxTouchPoints));
      },
      _initDOMReady: function () {
          if (ig.modules['dom.ready']) {
              ig._execModules();
              return;
          }
          ig._boot();
          ig.modules['dom.ready'] = {
              requires: [],
              loaded: false,
              body: null
          };
          ig._waitForOnload++;
          if (document.readyState === 'complete') {
              ig._DOMReady();
          }
          else {
              document.addEventListener('DOMContentLoaded', ig._DOMReady, false);
              window.addEventListener('load', ig._DOMReady, false);
          }
      }
  };
  ig.normalizeVendorAttribute(window, 'requestAnimationFrame');
  if (window.requestAnimationFrame) {
      var next = 1,
          anims = {};
      window.ig.setAnimation = function (callback, element) {
              var current = next++;
              anims[current] = true;
              var animate = function () {
                  if (!anims[current]) {
                      return;
                  }
                  window.requestAnimationFrame(animate, element);
                  callback();
              };
              window.requestAnimationFrame(animate, element);
              return current;
          };
      window.ig.clearAnimation = function (id) {
              delete anims[id];
          };
  }
  else {
      window.ig.setAnimation = function (callback, element) {
          return window.setInterval(callback, 1000 / 60);
      };
      window.ig.clearAnimation = function (id) {
          window.clearInterval(id);
      };
  }
  var initializing = false,
      fnTest = /xyz/.test(function () {
          xyz;
      }) ? /\bparent\b/ : /.*/;
  var lastClassId = 0;
  window.ig.Class = function () {};
  var inject = function (prop) {
          var proto = this.prototype;
          var parent = {};
          for (var name in prop) {
              if (typeof(prop[name]) == "function" && typeof(proto[name]) == "function" && fnTest.test(prop[name])) {
                  parent[name] = proto[name];
                  proto[name] = (function (name, fn) {
                      return function () {
                          var tmp = this.parent;
                          this.parent = parent[name];
                          var ret = fn.apply(this, arguments);
                          this.parent = tmp;
                          return ret;
                      };
                  })(name, prop[name]);
              }
              else {
                  proto[name] = prop[name];
              }
          }
      };
  window.ig.Class.extend = function (prop) {
          var parent = this.prototype;
          initializing = true;
          var prototype = new this();
          initializing = false;
          for (var name in prop) {
              if (typeof(prop[name]) == "function" && typeof(parent[name]) == "function" && fnTest.test(prop[name])) {
                  prototype[name] = (function (name, fn) {
                      return function () {
                          var tmp = this.parent;
                          this.parent = parent[name];
                          var ret = fn.apply(this, arguments);
                          this.parent = tmp;
                          return ret;
                      };
                  })(name, prop[name]);
              }
              else {
                  prototype[name] = prop[name];
              }
          }

          function Class() {
              if (!initializing) {
                  if (this.staticInstantiate) {
                      var obj = this.staticInstantiate.apply(this, arguments);
                      if (obj) {
                          return obj;
                      }
                  }
                  for (var p in this) {
                      if (typeof(this[p]) == 'object') {
                          this[p] = ig.copy(this[p]);
                      }
                  }
                  if (this.init) {
                      this.init.apply(this, arguments);
                  }
              }
              return this;
          }
          Class.prototype = prototype;
          Class.prototype.constructor = Class;
          Class.extend = window.ig.Class.extend;
          Class.inject = inject;
          Class.classId = prototype.classId = ++lastClassId;
          return Class;
      };
  if (window.ImpactMixin) {
          ig.merge(ig, window.ImpactMixin);
      }
})(window);

ig.module('impact.game').requires('impact.impact', 'impact.entity', 'impact.collision-map', 'impact.background-map').defines(function () {
  "use strict";
  ig.Game = ig.Class.extend({
      clearColor: '#000000',
      gravity: 0,
      screen: {
          x: 0,
          y: 0
      },
      _rscreen: {
          x: 0,
          y: 0
      },
      entities: [],
      namedEntities: {},
      collisionMap: ig.CollisionMap.staticNoCollision,
      backgroundMaps: [],
      backgroundAnims: {},
      autoSort: false,
      sortBy: null,
      cellSize: 64,
      _deferredKill: [],
      _levelToLoad: null,
      _doSortEntities: false,
      staticInstantiate: function () {
          this.sortBy = this.sortBy || ig.Game.SORT.Z_INDEX;
          ig.game = this;
          return null;
      },
      loadLevel: function (data) {
          this.screen = {
              x: 0,
              y: 0
          };
          this.entities = [];
          this.namedEntities = {};
          for (var i = 0; i < data.entities.length; i++) {
              var ent = data.entities[i];
              this.spawnEntity(ent.type, ent.x, ent.y, ent.settings);
          }
          this.sortEntities();
          this.collisionMap = ig.CollisionMap.staticNoCollision;
          this.backgroundMaps = [];
          for (var i = 0; i < data.layer.length; i++) {
              var ld = data.layer[i];
              if (ld.name == 'collision') {
                  this.collisionMap = new ig.CollisionMap(ld.tilesize, ld.data);
              }
              else {
                  var newMap = new ig.BackgroundMap(ld.tilesize, ld.data, ld.tilesetName);
                  newMap.anims = this.backgroundAnims[ld.tilesetName] || {};
                  newMap.repeat = ld.repeat;
                  newMap.distance = ld.distance;
                  newMap.foreground = !! ld.foreground;
                  newMap.preRender = !! ld.preRender;
                  newMap.name = ld.name;
                  this.backgroundMaps.push(newMap);
              }
          }
          for (var i = 0; i < this.entities.length; i++) {
              this.entities[i].ready();
          }
      },
      loadLevelDeferred: function (data) {
          this._levelToLoad = data;
      },
      getMapByName: function (name) {
          if (name == 'collision') {
              return this.collisionMap;
          }
          for (var i = 0; i < this.backgroundMaps.length; i++) {
              if (this.backgroundMaps[i].name == name) {
                  return this.backgroundMaps[i];
              }
          }
          return null;
      },
      getEntityByName: function (name) {
          return this.namedEntities[name];
      },
      getEntitiesByType: function (type) {
          var entityClass = typeof(type) === 'string' ? ig.global[type] : type;
          var a = [];
          for (var i = 0; i < this.entities.length; i++) {
              var ent = this.entities[i];
              if (ent instanceof entityClass && !ent._killed) {
                  a.push(ent);
              }
          }
          return a;
      },
      spawnEntity: function (type, x, y, settings) {
          var entityClass = typeof(type) === 'string' ? ig.global[type] : type;
          if (!entityClass) {
              throw ("Can't spawn entity of type " + type);
          }
          var ent = new(entityClass)(x, y, settings || {});
          this.entities.push(ent);
          if (ent.name) {
              this.namedEntities[ent.name] = ent;
          }
          return ent;
      },
      sortEntities: function () {
          this.entities.sort(this.sortBy);
      },
      sortEntitiesDeferred: function () {
          this._doSortEntities = true;
      },
      removeEntity: function (ent) {
          if (ent.name) {
              delete this.namedEntities[ent.name];
          }
          ent._killed = true;
          ent.type = ig.Entity.TYPE.NONE;
          ent.checkAgainst = ig.Entity.TYPE.NONE;
          ent.collides = ig.Entity.COLLIDES.NEVER;
          this._deferredKill.push(ent);
      },
      run: function () {
          this.update();
          this.draw();
      },
      update: function () {
          if (this._levelToLoad) {
              this.loadLevel(this._levelToLoad);
              this._levelToLoad = null;
          }
          this.updateEntities();
          this.checkEntities();
          for (var i = 0; i < this._deferredKill.length; i++) {
              this._deferredKill[i].erase();
              this.entities.erase(this._deferredKill[i]);
          }
          this._deferredKill = [];
          if (this._doSortEntities || this.autoSort) {
              this.sortEntities();
              this._doSortEntities = false;
          }
          for (var tileset in this.backgroundAnims) {
              var anims = this.backgroundAnims[tileset];
              for (var a in anims) {
                  anims[a].update();
              }
          }
      },
      updateEntities: function () {
          for (var i = 0; i < this.entities.length; i++) {
              var ent = this.entities[i];
              if (!ent._killed) {
                  ent.update();
              }
          }
      },
      draw: function () {
          if (this.clearColor) {
              ig.system.clear(this.clearColor);
          }
          this._rscreen.x = ig.system.getDrawPos(this.screen.x) / ig.system.scale;
          this._rscreen.y = ig.system.getDrawPos(this.screen.y) / ig.system.scale;
          var mapIndex;
          for (mapIndex = 0; mapIndex < this.backgroundMaps.length; mapIndex++) {
              var map = this.backgroundMaps[mapIndex];
              if (map.foreground) {
                  break;
              }
              map.setScreenPos(this.screen.x, this.screen.y);
              map.draw();
          }
          this.drawEntities();
          for (mapIndex; mapIndex < this.backgroundMaps.length; mapIndex++) {
              var map = this.backgroundMaps[mapIndex];
              map.setScreenPos(this.screen.x, this.screen.y);
              map.draw();
          }
      },
      drawEntities: function () {
          for (var i = 0; i < this.entities.length; i++) {
              this.entities[i].draw();
          }
      },
      checkEntities: function () {
          var hash = {};
          for (var e = 0; e < this.entities.length; e++) {
              var entity = this.entities[e];
              if (entity.type == ig.Entity.TYPE.NONE && entity.checkAgainst == ig.Entity.TYPE.NONE && entity.collides == ig.Entity.COLLIDES.NEVER) {
                  continue;
              }
              var checked = {},
                  xmin = Math.floor(entity.pos.x / this.cellSize),
                  ymin = Math.floor(entity.pos.y / this.cellSize),
                  xmax = Math.floor((entity.pos.x + entity.size.x) / this.cellSize) + 1,
                  ymax = Math.floor((entity.pos.y + entity.size.y) / this.cellSize) + 1;
              for (var x = xmin; x < xmax; x++) {
                      for (var y = ymin; y < ymax; y++) {
                          if (!hash[x]) {
                              hash[x] = {};
                              hash[x][y] = [entity];
                          }
                          else if (!hash[x][y]) {
                              hash[x][y] = [entity];
                          }
                          else {
                              var cell = hash[x][y];
                              for (var c = 0; c < cell.length; c++) {
                                  if (entity.touches(cell[c]) && !checked[cell[c].id]) {
                                      checked[cell[c].id] = true;
                                      ig.Entity.checkPair(entity, cell[c]);
                                  }
                              }
                              cell.push(entity);
                          }
                      }
                  }
          }
      }
  });
  ig.Game.SORT = {
      Z_INDEX: function (a, b) {
          return a.zIndex - b.zIndex;
      },
      POS_X: function (a, b) {
          return (a.pos.x + a.size.x) - (b.pos.x + b.size.x);
      },
      POS_Y: function (a, b) {
          return (a.pos.y + a.size.y) - (b.pos.y + b.size.y);
      }
  };
});


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


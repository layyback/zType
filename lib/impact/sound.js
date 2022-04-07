ig.baked = true;
ig.module('impact.sound').defines(function () {
  "use strict";
  ig.SoundManager = ig.Class.extend({
      clips: {},
      volume: 1,
      format: null,
      init: function () {
          if (!ig.Sound.enabled || !window.Audio) {
              ig.Sound.enabled = false;
              return;
          }
          var probe = new Audio();
          for (var i = 0; i < ig.Sound.use.length; i++) {
              var format = ig.Sound.use[i];
              if (probe.canPlayType(format.mime)) {
                  this.format = format;
                  break;
              }
          }
          if (!this.format) {
              ig.Sound.enabled = false;
          }
          if (ig.Sound.enabled && ig.Sound.useWebAudio) {
              this.audioContext = new AudioContext();
              this.boundWebAudioUnlock = this.unlockWebAudio.bind(this);
              document.addEventListener('touchend', this.boundWebAudioUnlock, false);
              document.addEventListener('click', this.boundWebAudioUnlock, false);
          }
      },
      unlockWebAudio: function () {
          if (this.audioContext.resume) {
              this.audioContext.resume();
          }
          var buffer = this.audioContext.createBuffer(1, 1, 44100);
          var source = this.audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(this.audioContext.destination);
          source.start(0);
          document.removeEventListener('touchend', this.boundWebAudioUnlock, false);
          document.removeEventListener('click', this.boundWebAudioUnlock, false);
      },
      load: function (path, multiChannel, loadCallback) {
          if (multiChannel && ig.Sound.useWebAudio) {
              return this.loadWebAudio(path, multiChannel, loadCallback);
          }
          else {
              return this.loadHTML5Audio(path, multiChannel, loadCallback);
          }
      },
      loadWebAudio: function (path, multiChannel, loadCallback) {
          var realPath = ig.prefix + path.replace(/[^\.]+$/, this.format.ext) + ig.nocache;
          if (this.clips[path]) {
              return this.clips[path];
          }
          var audioSource = new ig.Sound.WebAudioSource()
          this.clips[path] = audioSource;
          var request = new XMLHttpRequest();
          request.open('GET', realPath, true);
          request.responseType = 'arraybuffer';
          var that = this;
          request.onload = function (ev) {
              that.audioContext.decodeAudioData(request.response, function (buffer) {
                  audioSource.buffer = buffer;
                  loadCallback(path, true, ev);
              }, function (ev) {
                  loadCallback(path, false, ev);
              });
          };
          request.onerror = function (ev) {
              loadCallback(path, false, ev);
          };
          request.send();
          return audioSource;
      },
      loadHTML5Audio: function (path, multiChannel, loadCallback) {
          var realPath = ig.prefix + path.replace(/[^\.]+$/, this.format.ext) + ig.nocache;
          if (this.clips[path]) {
              if (this.clips[path] instanceof ig.Sound.WebAudioSource) {
                  return this.clips[path];
              }
              if (multiChannel && this.clips[path].length < ig.Sound.channels) {
                  for (var i = this.clips[path].length; i < ig.Sound.channels; i++) {
                      var a = new Audio(realPath);
                      a.load();
                      this.clips[path].push(a);
                  }
              }
              return this.clips[path][0];
          }
          var clip = new Audio(realPath);
          if (loadCallback) {
              if (ig.ua.mobile) {
                  setTimeout(function () {
                      loadCallback(path, true, null);
                  }, 0);
              }
              else {
                  clip.addEventListener('canplaythrough', function cb(ev) {
                      clip.removeEventListener('canplaythrough', cb, false);
                      loadCallback(path, true, ev);
                  }, false);
                  clip.addEventListener('error', function (ev) {
                      loadCallback(path, true, ev);
                  }, false);
              }
          }
          clip.preload = 'auto';
          clip.load();
          this.clips[path] = [clip];
          if (multiChannel) {
              for (var i = 1; i < ig.Sound.channels; i++) {
                  var a = new Audio(realPath);
                  a.load();
                  this.clips[path].push(a);
              }
          }
          return clip;
      },
      get: function (path) {
          var channels = this.clips[path];
          if (channels && channels instanceof ig.Sound.WebAudioSource) {
              return channels;
          }
          for (var i = 0, clip; clip = channels[i++];) {
              if (clip.paused || clip.ended) {
                  if (clip.ended) {
                      clip.currentTime = 0;
                  }
                  return clip;
              }
          }
          channels[0].pause();
          channels[0].currentTime = 0;
          return channels[0];
      }
  });
  ig.Music = ig.Class.extend({
      tracks: [],
      namedTracks: {},
      currentTrack: null,
      currentIndex: 0,
      random: false,
      _volume: 1,
      _loop: true,
      _fadeInterval: 0,
      _fadeTimer: null,
      _endedCallbackBound: null,
      init: function () {
          this._endedCallbackBound = this._endedCallback.bind(this);
          Object.defineProperty(this, "volume", {
              get: this.getVolume.bind(this),
              set: this.setVolume.bind(this)
          });
          Object.defineProperty(this, "loop", {
              get: this.getLooping.bind(this),
              set: this.setLooping.bind(this)
          });
      },
      add: function (music, name) {
          if (!ig.Sound.enabled) {
              return;
          }
          var path = music instanceof ig.Sound ? music.path : music;
          var track = ig.soundManager.load(path, false);
          if (track instanceof ig.Sound.WebAudioSource) {
              ig.system.stopRunLoop();
              throw ("Sound '" + path + "' loaded as Multichannel but used for Music. " + "Set the multiChannel param to false when loading, e.g.: new ig.Sound(path, false)");
          }
          track.loop = this._loop;
          track.volume = this._volume;
          track.addEventListener('ended', this._endedCallbackBound, false);
          this.tracks.push(track);
          if (name) {
              this.namedTracks[name] = track;
          }
          if (!this.currentTrack) {
              this.currentTrack = track;
          }
      },
      next: function () {
          if (!this.tracks.length) {
              return;
          }
          this.stop();
          this.currentIndex = this.random ? Math.floor(Math.random() * this.tracks.length) : (this.currentIndex + 1) % this.tracks.length;
          this.currentTrack = this.tracks[this.currentIndex];
          this.play();
      },
      pause: function () {
          if (!this.currentTrack) {
              return;
          }
          this.currentTrack.pause();
      },
      stop: function () {
          if (!this.currentTrack) {
              return;
          }
          this.currentTrack.pause();
          this.currentTrack.currentTime = 0;
      },
      play: function (name) {
          if (name && this.namedTracks[name]) {
              var newTrack = this.namedTracks[name];
              if (newTrack != this.currentTrack) {
                  this.stop();
                  this.currentTrack = newTrack;
              }
          }
          else if (!this.currentTrack) {
              return;
          }
          this.currentTrack.volume = this.volume;
          this.currentTrack.play();
      },
      getLooping: function () {
          return this._loop;
      },
      setLooping: function (l) {
          this._loop = l;
          for (var i in this.tracks) {
              this.tracks[i].loop = l;
          }
      },
      getVolume: function () {
          return this._volume;
      },
      setVolume: function (v) {
          this._volume = v.limit(0, 1);
          for (var i in this.tracks) {
              this.tracks[i].volume = this._volume;
          }
      },
      fadeToTrack: function (time, name) {
          if (this._fadeInterval) {
              clearInterval(this._fadeInterval);
          }
          if (name && this.namedTracks[name] == this.currentTrack) {
              this.currentTrack.volume = this._volume;
              return;
          }
          this._nextTrack = this.namedTracks[name];
          this._nextTrack.volume = 0;
          this._nextTrack.play();
          clearInterval(this._fadeInterval);
          this.fadeTimer = new ig.Timer(time);
          this._fadeInterval = setInterval(this._fadeStepNext.bind(this), 50);
      },
      _fadeStepNext: function () {
          var v = this.fadeTimer.delta().map(-this.fadeTimer.target, 0, 1, 0).limit(0, 1);
          if (v <= 0.01) {
              clearInterval(this._fadeInterval);
              if (this.currentTrack) {
                  this.currentTrack.pause();
                  this.currentTrack.volume = this._volume;
              }
              this.currentTrack = this._nextTrack;
              this.currentTrack.volume = this._volume;
          }
          else {
              if (this.currentTrack) {
                  this.currentTrack.volume = v * this._volume;
              }
              this._nextTrack.volume = (1 - v) * this._volume;
          }
      },
      fadeOut: function (time) {
          if (!this.currentTrack) {
              return;
          }
          clearInterval(this._fadeInterval);
          this.fadeTimer = new ig.Timer(time);
          this._fadeInterval = setInterval(this._fadeStep.bind(this), 50);
      },
      _fadeStep: function () {
          var v = this.fadeTimer.delta().map(-this.fadeTimer.target, 0, 1, 0).limit(0, 1) * this._volume;
          if (v <= 0.01) {
              this.stop();
              this.currentTrack.volume = this._volume;
              clearInterval(this._fadeInterval);
          }
          else {
              this.currentTrack.volume = v;
          }
      },
      _endedCallback: function () {
          if (this._loop) {
              this.play();
          }
          else {
              this.next();
          }
      }
  });
  ig.Sound = ig.Class.extend({
      path: '',
      volume: 1,
      currentClip: null,
      multiChannel: true,
      _loop: false,
      _fadeInterval: 0,
      init: function (path, multiChannel) {
          this.path = path;
          this.multiChannel = (multiChannel !== false);
          Object.defineProperty(this, "loop", {
              get: this.getLooping.bind(this),
              set: this.setLooping.bind(this)
          });
          this.load();
      },
      fadeIn: function (time) {
          this.currentClip = ig.soundManager.get(this.path);
          this.currentClip.loop = this._loop;
          this.currentClip.volume = 0;
          this.currentClip.play();
          clearInterval(this._fadeInterval);
          this.fadeTimer = new ig.Timer(time);
          this._fadeInterval = setInterval(this._fadeStep.bind(this), 100);
      },
      _fadeStep: function () {
          var v = this.fadeTimer.delta().map(-this.fadeTimer.target, 0, 0, 1).limit(0, 1) * this.volume;
          if (v <= 0.01) {
              this.stop();
              this.currentClip.volume = this.volume;
              clearInterval(this._fadeInterval);
          }
          else {
              this.currentClip.volume = v;
          }
      },
      getLooping: function () {
          return this._loop;
      },
      setLooping: function (loop) {
          this._loop = loop;
          if (this.currentClip) {
              this.currentClip.loop = loop;
          }
      },
      load: function (loadCallback) {
          if (!ig.Sound.enabled) {
              if (loadCallback) {
                  loadCallback(this.path, true);
              }
              return;
          }
          if (ig.ready) {
              ig.soundManager.load(this.path, this.multiChannel, loadCallback);
          }
          else {
              ig.addResource(this);
          }
      },
      play: function () {
          if (!ig.Sound.enabled) {
              return;
          }
          this.currentClip = ig.soundManager.get(this.path);
          this.currentClip.loop = this._loop;
          this.currentClip.volume = ig.soundManager.volume * this.volume;
          this.currentClip.play();
      },
      stop: function () {
          if (this.currentClip) {
              try {
                  this.currentClip.pause();
                  this.currentClip.currentTime = 0;
              } catch (err) {}
          }
      }
  });
  ig.Sound.WebAudioSource = ig.Class.extend({
      sources: [],
      gain: null,
      buffer: null,
      _loop: false,
      init: function () {
          this.gain = ig.soundManager.audioContext.createGain();
          this.gain.connect(ig.soundManager.audioContext.destination);
          Object.defineProperty(this, "loop", {
              get: this.getLooping.bind(this),
              set: this.setLooping.bind(this)
          });
          Object.defineProperty(this, "volume", {
              get: this.getVolume.bind(this),
              set: this.setVolume.bind(this)
          });
      },
      play: function () {
          if (!this.buffer) {
              return;
          }
          var source = ig.soundManager.audioContext.createBufferSource();
          source.buffer = this.buffer;
          source.connect(this.gain);
          source.loop = this._loop;
          var that = this;
          this.sources.push(source);
          source.onended = function () {
              that.sources.erase(source);
          }
          source.start(0);
      },
      pause: function () {
          for (var i = 0; i < this.sources.length; i++) {
              try {
                  this.sources[i].stop();
              } catch (err) {}
          }
      },
      getLooping: function () {
          return this._loop;
      },
      setLooping: function (loop) {
          this._loop = loop;
          for (var i = 0; i < this.sources.length; i++) {
              this.sources[i].loop = loop;
          }
      },
      getVolume: function () {
          return this.gain.gain.value;
      },
      setVolume: function (volume) {
          this.gain.gain.value = volume;
      }
  });
  ig.Sound.FORMAT = {
      MP3: {
          ext: 'mp3',
          mime: 'audio/mpeg'
      },
      M4A: {
          ext: 'm4a',
          mime: 'audio/mp4; codecs=mp4a'
      },
      OGG: {
          ext: 'ogg',
          mime: 'audio/ogg; codecs=vorbis'
      },
      WEBM: {
          ext: 'webm',
          mime: 'audio/webm; codecs=vorbis'
      },
      CAF: {
          ext: 'caf',
          mime: 'audio/x-caf'
      }
  };
  ig.Sound.use = [ig.Sound.FORMAT.OGG, ig.Sound.FORMAT.MP3];
  ig.Sound.channels = 4;
  ig.Sound.enabled = true;
  ig.normalizeVendorAttribute(window, 'AudioContext');
  ig.Sound.useWebAudio = !! window.AudioContext && !window.nwf;
});
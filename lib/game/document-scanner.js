ig.baked = true;
ig.module('game.document-scanner').defines(function () {
  "use strict";
  ig.chunkify = function (a, n, balanced) {
      if (n < 2) {
          return [a];
      }
      var len = a.length,
          out = [],
          i = 0,
          size;
      if (len % n === 0) {
              size = Math.floor(len / n);
              while (i < len) {
                  out.push(a.slice(i, i += size));
              }
          }
      else if (balanced) {
              while (i < len) {
                  size = Math.ceil((len - i) / n--);
                  out.push(a.slice(i, i += size));
              }
          }
      else {
              n--;
              size = Math.floor(len / n);
              if (len % size === 0) {
                  size--;
              }
              while (i < size * n) {
                  out.push(a.slice(i, i += size));
              }
              out.push(a.slice(size * n));
          }
      return out;
  }
  ig.DocumentScanner = ig.Class.extend({
      _reSkipNode: null,
      _reSkipClass: null,
      _reTextNode: null,
      _reHasWords: null,
      _reSplitSentences: null,
      _currentFragment: null,
      _animationDoneCallback: null,
      _hurry: false,
      _scrollAnimationId: 0,
      looksLikeEnglish: false,
      fragments: [],
      highlightMarginTop: 32,
      highlightClass: 'ztype-current-text-fragment',
      init: function (rootElement) {
          this._reSkipNode = /^(script|style|head|link|meta|button|input|nav|label|img|svg|canvas|ins)$/i;
          this._reSkipClass = /head|mw-jump-link|foot|links|menu|nav|pagetop|subtext|side|notice|overlay|siteSub|infobox|hatnote|abstract|caption|disclaimer|byline/i;
          this._reTextNode = /^(em|strong|b|i|mark|cite|dfn|small|del|ins|sub|sup|a|#text|span|code)$/i;
          this._reHasWords = /\b[^\d\W]{2,}\b/g;
          this._reSplitSentences = /([.?!:]+[\s\[\]]+)(?=\w)/g;
          this._reHasEnglishWords = /\b(the|be|to|of|and|that|have|it|for|not|on|with|he|as|you|do|at)\b/i;
          this.$scanOverlay = ig.$('#ztype-overlay');
          this.$scanProgress = ig.$('#ztype-scan-progress');
          this.$scanOverlay.className = 'ztype-scanning';
          var elements = this.traverse(rootElement);
          this.fragments = [];
          for (var i = 0; i < elements.length; i++) {
              this.splitIntoFragments(elements[i], this.fragments, elements.length);
          }
      },
      traverse: function (element, elements) {
          if (!elements) {
              elements = [];
          }
          var style = element instanceof HTMLElement ? window.getComputedStyle(element) : null;
          if (element.nodeName.match(this._reSkipNode) || (element.id && element.id.match(this._reSkipClass)) || (element.className && element.className.match(this._reSkipClass)) || (style && (style.display == 'hidden' || style.opacity === "0"))) {
              if (element.textContent.length < 3000) {
                  return elements;
              }
          }
          var allChildrenAreLinks = element.childNodes.length > 0;
          for (var i = 0; i < element.childNodes.length; i++) {
              var child = element.childNodes[i]
              if (child.nodeName !== 'A' && (!child.nodeName.match(this._reTextNode) || child.textContent.match(this._reHasWords))) {
                  allChildrenAreLinks = false;
              }
          }
          if (allChildrenAreLinks) {
              return elements;
          }
          if (this.childrenAreText(element)) {
              var text = element.textContent;
              var tm = text.match(this._reHasWords);
              if (element.offsetParent !== null && (element.nodeName === '#text' || element.offsetHeight > 0) && tm && tm.length > 0) {
                  elements.push(element);
                  return elements;
              }
          }
          else {
              for (var i = 0; i < element.childNodes.length; i++) {
                  this.traverse(element.childNodes[i], elements);
              }
          }
          return elements;
      },
      splitIntoFragments: function (element, fragments, totalElements) {
          var parent = element.parentNode;
          var text = element.textContent;
          var sentences = text.replace(this._reSplitSentences, '$1%%ZT%%').split('%%ZT%%');
          if (totalElements === 1 && sentences.length < 2) {
              var words = text.trim().split(/\s+/);
              var wordCount = words.length;
              var sentenceLength = 2;
              if (wordCount > 30) {
                  sentenceLength = 10;
              }
              else if (wordCount > 10) {
                  sentenceLength = 5;
              }
              else {
                  sentenceLength = Math.ceil(wordCount / 2);
              }
              var chunks = Math.ceil(wordCount / sentenceLength);
              var wordChunks = ig.chunkify(words, chunks, true);
              sentences = [];
              for (var i = 0; i < wordChunks.length; i++) {
                  sentences.push(wordChunks[i].join(' ') + ' ');
              }
          }
          var spans = [];
          for (var i = 0; i < sentences.length; i++) {
              var span = document.createElement('span');
              span.textContent = sentences[i];
              spans.push(span);
              fragments.push({
                  text: sentences[i],
                  element: span
              });
          }
          if (element.nodeName === '#text') {
              for (var i = 0; i < spans.length; i++) {
                  if (i > 0) {
                      parent.insertBefore(spans[i], spans[i - 1].nextSibling);
                  }
                  else {
                      parent.replaceChild(spans[i], element);
                  }
              }
          }
          else {
              element.innerHTML = '';
              for (var i = 0; i < spans.length; i++) {
                  element.appendChild(spans[i]);
              }
          }
      },
      childrenAreText: function (element) {
          for (var i = 0; i < element.childNodes.length; i++) {
              if (!element.childNodes[i].nodeName.match(this._reTextNode) || (element.id && element.id.match(this._reSkipClass)) || (element.className && element.className.match(this._reSkipClass)) || !this.childrenAreText(element.childNodes[i])) {
                  return false;
              }
          }
          return true;
      },
      _detectEnglishText: function () {
          var count = 0;
          for (var i = 0; i < this.fragments.length; i++) {
              if (this.fragments[i].text.match(this._reHasEnglishWords)) {
                  count++;
              }
          }
          this.looksLikeEnglish = count > (this.fragments.length / 4);
          this._lleCount = count;
      },
      highlightFragment: function (fragment, margin, dontDeHighlight) {
          if (this._currentFragment && !dontDeHighlight) {
              this._currentFragment.className = '';
          }
          this._currentFragment = fragment.element;
          if (this._currentFragment) {
              this._currentFragment.className = this.highlightClass;
              var target = (document.documentElement.scrollTop || document.body.scrollTop) + this._currentFragment.getBoundingClientRect().top - (margin || this.highlightMarginTop);
              this.scrollTo(target);
          }
      },
      scrollTo: function (y) {
          this._scrollTarget = y;
          if (!this._scrollAnimationId) {
              this._scrollAnimationId = setInterval(this._animateScroll.bind(this), 5);
          }
      },
      _animateScroll: function () {
          var current = document.documentElement.scrollTop = document.body.scrollTop;
          var diff = (this._scrollTarget - current);
          var pos = current + diff / 10;
          if (Math.abs(diff) > 1024) {
              pos = this._scrollTarget;
          }
          document.documentElement.scrollTop = document.body.scrollTop = pos;
          if (Math.abs(diff) < 10) {
              clearInterval(this._scrollAnimationId);
              this._scrollAnimationId = 0;
          }
      },
      playScanAnimation: function (doneCallback) {
          setTimeout(this.nextAnimationStep.bind(this, 0), 300);
          this._animationDoneCallback = doneCallback;
      },
      fastForwardScanAnimation: function () {
          this._hurry = true;
      },
      nextAnimationStep: function (current) {
          if (this.fragments[current]) {
              this.highlightFragment(this.fragments[current], window.innerHeight / 3, true);
              var cc = current + 1;
              if (this._hurry) {
                  cc = cc * cc;
              }
              if (this._hurry && current > 75) {
                  this.scanComplete();
                  return;
              }
              var t = Math.max((500 / (Math.pow(cc, 0.7))), 16);
              setTimeout(this.nextAnimationStep.bind(this, current + 1), t);
          }
          else {
              this.scanComplete();
          }
          this.$scanProgress.style.width = Math.min(1, current / this.fragments.length) * 100 + '%';
      },
      scanComplete: function () {
          this._currentFragment = null;
          this.$scanProgress.style.width = '100%';
          this.$scanOverlay.className = 'ztype-scan-done';
          this._detectEnglishText();
          setTimeout((function () {
              this.scrollTo(0);
              for (var i = 0; i < this.fragments.length; i++) {
                  this.fragments[i].element.className = '';
              }
              this.$scanOverlay.className = 'ztype-playing';
              if (this._animationDoneCallback) {
                  this._animationDoneCallback();
              }
          }).bind(this), 300);
      }
  });
});
ig.baked = true;
ig.module("impact.impact")
  .requires(
    "dom.ready",
    "impact.loader",
    "impact.system",
    "impact.input",
    "impact.sound"
  )
  .defines(function () {
    "use strict";
    ig.main = function (
      canvasId,
      gameClass,
      fps,
      width,
      height,
      scale,
      loaderClass
    ) {
      ig.system = new ig.System(canvasId, fps, width, height, scale || 1);
      ig.input = new ig.Input();
      ig.soundManager = new ig.SoundManager();
      ig.music = new ig.Music();
      ig.ready = true;
      var loader = new (loaderClass || ig.Loader)(gameClass, ig.resources);
      loader.load();
    };
  });

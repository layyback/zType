ig.baked = true;
ig.module('game.xhr').defines(function () {
  ig.xhr = function (url, data, callback) {
      var post = [];
      if (data) {
          for (var key in data) {
              post.push(key + '=' + encodeURIComponent(data[key]));
          }
      }
      var postString = post.join('&');
      var xhr = new XMLHttpRequest();
      if (callback) {
          xhr.onreadystatechange = function () {
              if (xhr.readyState == 4) {
                  callback(JSON.parse(xhr.responseText));
              }
          };
      }
      xhr.open('POST', url);
      xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhr.send(postString);
  };
});
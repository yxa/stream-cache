var stream = require('stream');
var util = require('util');
var Duplex = stream.Duplex || require('readable-stream').Duplex;


function StreamCache(options) {
  if (!(this instanceof StreamCache)) {
    return new StreamCache(options);
  }
  Duplex.call(this, options);

  this._chunks = [];
  this._sinks = [];
  this._ended = false;
}

util.inherits(StreamCache, Duplex);

StreamCache.prototype._read = function() {
    for(var i = 0; i < this._chunks.length; i++) {
        this.push(this._chunks[i]);
    }
    this.push(null);
};

StreamCache.prototype._write = function (chunk, enc) {
    this._chunks.push(chunk);
    this._sinks.forEach(function(sink) {
        sink.write(chunk);
    });
};


StreamCache.prototype.pipe = function(sink, options) {
    if(options) throw Error("options not supported");
    this._chunks.forEach(function(chunk) {
        sink.write(chunk);
    });

    if(this._ended) {
        sink.end();
        return sink;
    }
    this._sinks.push(sink);
    return sink;
};

StreamCache.prototype.end = function() {
    this._sinks.forEach(function(sink) {
         console.log(sink);
        //sink.end();
    });

    this._ended = true;
    this._sinks = [];
};

StreamCache.prototype.getLength = function() {
  return this._chunks.reduce(function(totalLength, chunk) {
    return totalLength + chunk.length;
  }, 0);
};



var fs          = require('fs');

var cache = new StreamCache();
fs.createReadStream('data.txt').pipe(cache);

// Cache can now be piped anywhere, even before the readable stream finishes.
cache.pipe(process.stdout);


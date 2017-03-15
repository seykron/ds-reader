module.exports = function SequentialFileReader(file, options) {

  const iterator = this;
  const debug = require("debug")("sequential_file_reader");
  const fs = require("fs");
  const stats = fs.statSync(file);

  const {
    // Default buffer size: 256MB
    bufferSize = 0xFA00000,
    chunk = -1,
    resume = false
  } = options;

  const chunks = Math.ceil(stats.size / bufferSize);

  var fd = options && options.fd;
  var currentChunk = 0;

  var sequentialReader = function* () {
    var buffer = Buffer.alloc(chunks == 1 ? stats.size : bufferSize);
    var startChunk = 0;
    var endChunk = chunks;
    var startPosition = null;

    if (!fd) {
      debug("opening file");
      fd = fs.openSync(file, "r");
    } else {
      debug("using existing file descriptor: %s", fd);
    }

    if (chunk > -1 && chunk < chunks) {
      debug("reading chunk %s from %s", chunk + 1, chunks);
      startChunk = chunk;

      if (!resume && chunk < chunks) {
        debug("resume mode off, reading only chunk %s", chunk);
        endChunk = chunk + 1;
      }
    } else {
      debug("reading entire file in %s chunk(s)", chunks);
    }

    if (startChunk > 0) {
      startPosition = bufferSize * startChunk;
    }

    for (currentChunk = startChunk; currentChunk < endChunk; currentChunk++) {
      if (currentChunk == chunks - 1) {
        buffer = Buffer.alloc(stats.size % bufferSize);
      }

      debug("buffering chunk %s", currentChunk + 1);

      startPosition += fs.readSync(fd, buffer, 0, buffer.length, startPosition);

      yield buffer;
    }

    fs.closeSync(fd);

    return null;
  };

  (function __init() {
    iterator[Symbol.iterator] = sequentialReader;
  }());

  return Object.assign(iterator, {
    iterator: () => sequentialReader(),
    serialize: () => ({
      fd: fd,
      chunk: currentChunk + 1,
      resume: currentChunk < chunks,
      bufferSize: bufferSize
    })
  });
};

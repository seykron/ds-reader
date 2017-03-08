module.exports = function SequentialFileReader(file, options) {

  // Default buffer size: 256MB
  const BUFFER_SIZE = (options && options.bufferSize) || 0xFA00000;
  const debug = require("debug")("sequential_file_reader");
  const fs = require("fs");

  var sequentialReader = function* () {
    var stats = fs.statSync(file);
    var chunks = Math.ceil(stats.size / BUFFER_SIZE);
    var buffer = Buffer.alloc(chunks == 1 ? stats.size : BUFFER_SIZE);
    var fd = fs.openSync(file, "r");
    var i;

    debug("reading file in %s chunk(s)", chunks);

    for (i = 0; i < chunks; i++) {
      if (i == chunks) {
        buffer = buffer.alloc(stats.size % BUFFER_SIZE);
      }

      debug("buffering chunk %s", i + 1);

      fs.readSync(fd, buffer, 0, buffer.length, null);

      yield buffer;
    }

    fs.closeSync(fd);

    return null;
  };

  return {
    iterator: () => sequentialReader()
  };
};

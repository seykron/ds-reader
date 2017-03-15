module.exports = function BufferedFileReader(file, options) {

  const iterator = this;
  const debug = require("debug")("buffered_file_reader");
  const SequentialFileReader = require("./SequentialFileReader");
  const RangeFileReader = require("./RangeFileReader");

  (function __init() {
    iterator[Symbol.iterator] = new SequentialFileReader(file, options);
  }());

  return Object.assign({
    sequentialReader: () => {
      debug("creating sequential file reader for %s", file);
      return new SequentialFileReader(file, options);
    },
    rangeReader: () => {
      debug("creating range file reader for %s", file);
      return new RangeFileReader(file, options);
    }
  });
};

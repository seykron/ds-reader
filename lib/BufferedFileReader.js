module.exports = function BufferedFileReader(file, options) {

  const debug = require("debug")("buffered_file_reader");
  const SequentialFileReader = require("./SequentialFileReader");
  const RangeFileReader = require("./RangeFileReader");

  return {
    iterator: () => {
      debug("creating sequential file reader for %s", file);
      return new SequentialFileReader(file, options).iterator();
    },
    rangeReader: () => {
      debug("creating range file reader for %s", file);
      return new RangeFileReader(file, options);
    }
  };
};

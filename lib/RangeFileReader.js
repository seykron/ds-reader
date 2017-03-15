module.exports = function RangeFileReader(file, options) {

  const debug = require("debug")("range_file_reader");
  const co = require("co");
  const fs = require("fs");

  /** File descriptor for reading. */
  const fd = (options && options.fd) || fs.openSync(file, "r");

  // Default buffer size: 256MB
  const BUFFER_SIZE = (function () {
    var bufferConfig = (options && options.bufferSize) || 0xFA00000;
    var stats = fs.statSync(file);

    return stats.size > bufferConfig ? bufferConfig : stats.size;
  }());

  /** Raw data loaded from the bundle file. */
  const buffer = Buffer.alloc(BUFFER_SIZE);

  /** Absolute positions in the data file that's currently
   * loaded in the memory buffer.
   */
  var currentRange = {
    start: 0,
    end: 0
  };

  var validateRange = function (start, end) {
    if (end - start > BUFFER_SIZE) {
      throw new Error("Range exceeds the max buffer size");
    }
  };

  /** Asynchrounously updates the cache with a new range of data if the required
   * range is not within the current cache.
   * @param {Number} start Start position of the required range. Cannot be null.
   * @param {Number} end End position of the required range. Cannot be null.
   */
  var asyncLoadBufferIfRequired = (start, end) => new Promise((resolve, reject) => {
    var bytesRead;

    if (start < currentRange.start || (start > currentRange.end)) {
      debug("buffering new range: %s to %s (%s bytes)", start, end, BUFFER_SIZE);

      fs.read(fd, buffer, 0, BUFFER_SIZE, start, (err, bytesRead) => {
        if (err) {
          return reject(new Error(err));
        }

        currentRange.start = start;
        currentRange.end = start + bytesRead;

        resolve();
      });
    }

    resolve();
  });

  /** Synchrounously updates the cache with a new range of data if the required
   * range is not within the current cache.
   * @param {Number} start Start position of the required range. Cannot be null.
   * @param {Number} end End position of the required range. Cannot be null.
   */
  var loadBufferIfRequired = function (start, end) {
    var bytesRead;

    if (start < currentRange.start || (start > currentRange.end)) {
      debug("buffering new range: %s to %s (%s bytes)", start, end, BUFFER_SIZE);

      bytesRead = fs.readSync(fd, buffer, 0, BUFFER_SIZE, start);

      currentRange.start = start;
      currentRange.end = start + bytesRead;
    }
  };

  /** Reads data range from the file into the buffer.
   * @param {Number} start Absolute start position. Cannot be null.
   * @param {Number} end Absolute end position. Cannot be null.
   */
  var readEntry = function (start, end) {
    var offsetStart;
    var offsetEnd;

    offsetStart = start - currentRange.start;
    offsetEnd = offsetStart + (end - start);

    return buffer.slice(offsetStart, offsetEnd);
  };

  return {
    read: (start, end) => {
      validateRange(start, end);
      loadBufferIfRequired(start, end);
      return readEntry(start, end);
    },
    asyncRead: (start, end) => co(function* () {
      validateRange(start, end);
      yield asyncLoadBufferIfRequired(start, end);
      return readEntry(start, end);
    }),
    close: () => fs.closeSync(fd)
  };
};

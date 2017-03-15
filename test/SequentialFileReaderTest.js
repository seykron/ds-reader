process.env.DEBUG = "sequential_file_reader";

const debug = require("debug")("sequential_file_reader");
const SequentialFileReader = require("../lib/SequentialFileReader");
const BufferedFileReader = require("../lib/BufferedFileReader");
const assert = require("assert");
const fs = require("fs");

const bufferSize = 5120 // 5KB;
const file = __dirname + "/../LICENSE";

describe("SequentialFileReader", () => {
  it("should read entire file", () => {
    var chunks = 0;
    var reader = new SequentialFileReader(file, {
      bufferSize: bufferSize
    });

    for (var data of reader) {
      chunks += 1;
    }

    assert.equal(chunks, 4);
  });

  it("should resume reading", () => {
    var chunks = 0;
    var reader1 = new SequentialFileReader(file, {
      bufferSize: bufferSize
    });
    var reader2 = new BufferedFileReader(file, {
      bufferSize: bufferSize
    });
    var iterator = reader1.iterator();

    iterator.next();
    iterator.next();

    debug(reader1.serialize());
    reader2 = new SequentialFileReader(file, reader1.serialize());

    for (var data of reader2) {
      chunks += 1;
    }

    assert.equal(chunks, 2);
  });

  it("should read a single chunk", () => {
    var chunks = 0;
    var reader = new SequentialFileReader(file, {
      bufferSize: bufferSize,
      chunk: 2
    });

    for (var data of reader) {
      chunks += 1;
    }

    assert.equal(chunks, 1);
  });

  it("should read the last chunk", () => {
    var chunks = 0;
    var reader = new SequentialFileReader(file, {
      bufferSize: bufferSize,
      chunk: 3
    });
    var data;
    var lastChunkSize = fs.statSync(file).size % bufferSize;

    for (data of reader) {
      chunks += 1;
    }

    assert.equal(chunks, 1);
    assert.equal(data.length, lastChunkSize);
  });
});

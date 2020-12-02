var chai = require("chai");
var validate = require("jsonschema").validate;
var rewire = require("rewire");
var fs = require("fs");

var assert = chai.assert;

var script = rewire("./uplink.js");
var defaultSchema = null;
var noiseSchema = null;
var consume = script.__get__("consume");

function expectEmit(callback) {
  script.__set__({
    emit: callback,
  });
}

before(function (done) {
  fs.readFile(__dirname + "/noise.schema.json", "utf8", function (
    err,
    fileContents
  ) {
    if (err) throw err;
    noiseSchema = JSON.parse(fileContents);
    done();
  });
});

before(function (done) {
  fs.readFile(__dirname + "/schema.json", "utf8", function (
    err,
    fileContents
  ) {
    if (err) throw err;
    defaultSchema = JSON.parse(fileContents);
    done();
  });
});

describe("Elsys Sound uplink", function () {
  describe("consume()", function () {
    it("should decode Elsys Sound payload", function (done) {
      var data = {
        data: {
          payload_hex: "0100ee02230400bd053c070df615402c",
        }
      };
      var sampleCount = 0;
      expectEmit(function (type, value) {
        assert.equal(type, "sample");
        assert.isNotNull(value);
        assert.typeOf(value.data, "object");

        if (value.topic == "noise") {
          assert.equal(value.data.soundPeak, 64);
          assert.equal(value.data.soundAvg, 44);

          validate(value.data, noiseSchema, { throwError: true });
          sampleCount++;
        }

        if (value.topic == "default") {
          assert.equal(value.data.vdd, 3574);
          assert.equal(value.data.light, 189);
          assert.equal(value.data.motion, 60);
          assert.equal(value.data.humidity, 35);
          assert.equal(value.data.temperature, 23.8);

          validate(value.data, defaultSchema, { throwError: true });
          sampleCount++;
        }

        if (sampleCount == 2) {
          done();
        }
      });

      consume(data);
    });
  });
});
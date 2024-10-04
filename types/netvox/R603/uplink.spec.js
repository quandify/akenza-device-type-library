const chai = require("chai");

const rewire = require("rewire");
const utils = require("test-utils");

const { assert } = chai;

describe("Netvox R603 Uplink", () => {
  let defaultSchema = null;
  let consume = null;
  before((done) => {
    const script = rewire("./uplink.js");
    consume = utils.init(script);
    utils
      .loadSchema(`${__dirname}/default.schema.json`)
      .then((parsedSchema) => {
        defaultSchema = parsedSchema;
        done();
      });
  });

  let lifecycleSchema = null;
  before((done) => {
    utils
      .loadSchema(`${__dirname}/lifecycle.schema.json`)
      .then((parsedSchema) => {
        lifecycleSchema = parsedSchema;
        done();
      });
  });

  let downlinkResponseSchema = null;
  before((done) => {
    utils
      .loadSchema(`${__dirname}/downlink_response.schema.json`)
      .then((parsedSchema) => {
        downlinkResponseSchema = parsedSchema;
        done();
      });
  });

  describe("consume()", () => {
    it("should decode Netvox R603 report payload", () => {
      const data = {
        data: {
          port: 6,
          payloadHex: "01DE012601010000000000",
        },
      };

      utils.expectEmits((type, value) => {
        assert.equal(type, "sample");
        assert.isNotNull(value);
        assert.typeOf(value.data, "object");

        assert.equal(value.topic, "lifecycle");
        assert.equal(value.data.version, 1);
        assert.equal(value.data.batteryVoltage, 3.8);

        utils.validateSchema(value.data, lifecycleSchema, { throwError: true });
      });

      utils.expectEmits((type, value) => {
        assert.equal(type, "sample");
        assert.isNotNull(value);
        assert.typeOf(value.data, "object");

        assert.equal(value.topic, "default");
        assert.equal(value.data.warning, true);

        utils.validateSchema(value.data, defaultSchema, { throwError: true });
      });

      consume(data);
    });

    it("should decode Netvox R603 report payload", () => {
      const data = {
        data: {
          port: 6,
          payloadHex: "01DE010000000000000000",
        },
      };

      utils.expectEmits((type, value) => {
        assert.equal(type, "sample");
        assert.isNotNull(value);
        assert.typeOf(value.data, "object");

        assert.equal(value.topic, "lifecycle");
        assert.equal(value.data.version, 1);
        assert.equal(value.data.contactSwitchStatus, false);

        utils.validateSchema(value.data, lifecycleSchema, { throwError: true });
      });

      utils.expectEmits((type, value) => {
        assert.equal(type, "sample");
        assert.isNotNull(value);
        assert.typeOf(value.data, "object");

        assert.equal(value.topic, "default");
        assert.equal(value.data.warning, false);

        utils.validateSchema(value.data, defaultSchema, { throwError: true });
      });

      consume(data);
    });

    it("should decode Netvox R603 downlink response payload", () => {
      const data = {
        data: {
          port: 7,
          payloadHex: "84DE000000000000000000",
        },
      };

      utils.expectEmits((type, value) => {
        assert.equal(type, "sample");
        assert.isNotNull(value);
        assert.typeOf(value.data, "object");

        assert.equal(value.topic, "downlink_response");
        assert.equal(value.data.configurationSuccess, true);

        utils.validateSchema(value.data, downlinkResponseSchema, {
          throwError: true,
        });
      });

      consume(data);
    });
  });
});
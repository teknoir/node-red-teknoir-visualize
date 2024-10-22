const isBase64 = require("is-base64");
module.exports = function (RED) {
  "use strict";

  function RegionEditor(config) {
    RED.nodes.createNode(this, config);
    let node = this;

    node.inclusionZonesJson = config.inclusionZonesJson;
    node.exclusionZonesJson = config.exclusionZonesJson;
    node.tripwiresJson = config.tripwiresJson;
    node.imageProp = config.imageProp;
    node.imagePropType = config.imagePropType;


    function getImageFromMsg(msg) {
      if (node.imagePropType === 'msg') {
        return getNestedProperty(msg, node.imageProp);
      } else if (node.imagePropType === 'msgPayload') {
        return getNestedProperty(msg.payload, node.imageProp);
      } else {
        return getNestedProperty(msg.payload.event, node.imageProp);
      }
    }

    // Utility function to get nested property
    function getNestedProperty(obj, path) {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    function validateImageFormat(data) {
      //if image is base64, convert it to a buffer
      let isString = typeof data === 'string';
      let hasMime = false, isBase64Image = false
      if (isString) {
        hasMime = data.startsWith("data:");
        isBase64Image = isBase64(data, {mimeRequired: hasMime});
      }
      if (isString && isBase64Image) {
        return true;
      }
      return false;
    }

    function sendDataToClient(data, msg) {
      let d = {
        id: node.id,
      };
      if (data) {
        d.data = data;
      }
      try {
        RED.comms.publish("region-editor", d);
      } catch (e) {
        node.error("Error sending image to region editor", msg);
      }
    }

    this.on("input", function (msg, send, done) {
      let image = getImageFromMsg(msg);
      if (image && validateImageFormat(image)) {
        sendDataToClient(image, msg);
        if (node.imagePropType === 'msg') {
          msg['inclusionZones'] = JSON.parse(node.inclusionZonesJson);
          msg['exclusionZones'] = JSON.parse(node.exclusionZonesJson);
          msg['tripwires'] = JSON.parse(node.tripwiresJson);
        } else {
          msg.payload['inclusionZones'] = JSON.parse(node.inclusionZonesJson);
          msg.payload['exclusionZones'] = JSON.parse(node.exclusionZonesJson);
          msg.payload['tripwires'] = JSON.parse(node.tripwiresJson);
        }
      } else {
        node.error("Image is not in mime base64 encoded format!", msg);
      }
      send(msg);
      done();
    });
  }

  RED.nodes.registerType("region-editor", RegionEditor);
}

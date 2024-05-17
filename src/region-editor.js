const isBase64 = require("is-base64");
module.exports = function (RED) {
    "use strict";

    function RegionEditor(config) {
        RED.nodes.createNode(this, config);
        let node = this;

        node.regionsJson = config.regionsJson;
        node.tripwiresJson = config.tripwiresJson;
        node.imageProp = config.imageProp;
        node.imagePropType = config.imagePropType;


        function getImageFromMsg(msg) {
            if (node.imagePropType === 'msg') {
                return msg[node.imageProp];
            } else if (node.imagePropType === 'msgPayload') {
                return msg.payload[node.imageProp];
            } else {
                return msg.payload.event[node.imageProp];
            }
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
                    msg['regions'] = JSON.parse(node.regionsJson);
                    msg['tripwires'] = JSON.parse(node.tripwiresJson);
                } else {
                    msg.payload['regions'] = JSON.parse(node.regionsJson);
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

module.exports = function(RED) {
    "use strict";

    function RegionEditor(n) {
        RED.nodes.createNode(this,n);
        let node = this;
        let json = n.json || '{}';
        node.imageProp = n.imageProp || 'image';
        node.imagePropType = n.imagePropType || 'msgPayload';


        function getImageFromMsg(msg) {
            if (node.imagePropType === 'msg') {
                return msg[node.imageProp];
            }
            else if (node.imagePropType === 'msgPayload') {
                return msg.payload[node.imageProp];
            }
            else {
                return msg.payload.event[node.imageProp];
            }
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

        this.on("input", function(msg, send, done) {
            // TODO: Validate payload is mime image
            let image = getImageFromMsg(msg);
            if (image) {
                sendDataToClient(image, msg);
            }
            msg.payload['regions'] = JSON.parse(json);
            send(msg);
            done();
        });
    }

    RED.nodes.registerType("region-editor",RegionEditor);
}

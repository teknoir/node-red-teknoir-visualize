// const { createCanvas, Image } = require('canvas')
// const isBase64 = require('is-base64');

// let COLORS = ['Aqua', 'Coral', 'Cyan', 'Yellow', 'GreenYellow'];
// let getColor = function colorCounter() {
//     let counter = 0;
//     return function () {
//         counter %= COLORS.length;
//         return COLORS[counter++];
//     };
// }();

module.exports = function init(RED) {

    function RegionEditor(config) {
        let node = this;
        this.json = config.json || '{}';

        function sendDataToClient(data, msg) {
            let d = {
                id: node.id,
            };
            if (data) {
                d.data = data;
            }
            try {
                RED.comms.publish("graph-plot", d);
            } catch (e) {
                node.error("Error sending data", msg);
            }
        }

        node.on("input", function (msg) {
            node.status({fill: "green", shape: "dot", text: ""});
            sendDataToClient(msg.payload, msg);
        });

        node.on("close", function () {
            // RED.comms.publish("data", {id: this.id});
            // node.status({});
        });
    }

    RED.nodes.registerType('region-editor', RegionEditor);
};

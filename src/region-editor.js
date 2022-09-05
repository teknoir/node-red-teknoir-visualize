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

module.exports = function(RED) {
    "use strict";

    function RegionEditor(n) {
        RED.nodes.createNode(this,n);
        let node = this;
        let json = n.json || '{}';

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
                node.error("Error sending data", msg);
            }
        }

        this.on("input", function(msg, send, done) {
            // TODO: Validate payload is mime image
            sendDataToClient(msg.payload, msg);
            msg.payload = {
                image: msg.payload,
                polygons: JSON.parse(json)
            }
            send(msg);
            done();
        });
    }

    RED.nodes.registerType("region-editor",RegionEditor);
}

// module.exports = function init(RED) {
//
//     function RegionEditor(config) {
//         let node = this;
//         this.json = config.json || '{}';
//
//         function sendDataToClient(data, msg) {
//             let d = {
//                 id: node.id,
//             };
//             if (data) {
//                 d.data = data;
//             }
//             try {
//                 RED.comms.publish("graph-plot", d);
//             } catch (e) {
//                 node.error("Error sending data", msg);
//             }
//         }
//
//         node.on("input", function (msg) {
//             node.status({fill: "green", shape: "dot", text: ""});
//             node.error("Error sending data", msg);
//             sendDataToClient(msg.payload, msg);
//         });
//
//         node.on("close", function () {
//             // RED.comms.publish("data", {id: this.id});
//             // node.status({});
//         });
//     }
//
//     RED.nodes.registerType('region-editor', RegionEditor);
// };

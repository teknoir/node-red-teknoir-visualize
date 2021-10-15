module.exports = function (RED) {

    function GraphPlot(config) {
        RED.nodes.createNode(this, config);
        this.active = (config.active === null || typeof config.active === "undefined") || config.active;
        this.property = config.property || 'payload';

        let node = this;
        let errorCondition = false;

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

        function handleError(err, msg, statusText) {
            if (!errorCondition) {
                node.status({fill: "red", shape: "dot", text: statusText});
                errorCondition = true;
            }
            node.error(err, msg);
        }

        function clearError() {
            if (errorCondition) {
                node.status({});
                errorCondition = false;
            }
        }

        function isValidDate(date) {
            return date && Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date);
        }

        function validDataPoint(v, idx) {
            if (typeof v === 'number') {
                v = {
                    label: `payload-${idx}`,
                    value: v,
                    time: Date.now()
                }
                return v;
            }

            if (typeof v !== 'object') {
                throw new Error(`Datapoint at index [${idx}] not a valid data point object`);
            }
            if (v.hasOwnProperty('label')) {
                if (typeof v.label !== 'string') {
                    throw new Error(`Datapoint at index [${idx}] label property is not of type string`);
                }
            } else {
                v.label = `payload-${idx}`
            }
            if (v.hasOwnProperty('time')) {
                if (typeof v.time === 'string') {
                    v.time = Date.parse(v.time);
                }
                if (typeof v.time === 'number') {
                    v.time = new Date(v.time);
                }
                if (!isValidDate(v.time)) {
                    throw new Error(`Datapoint at index [${idx}] time property is not of type Date`);
                }
            } else {
                v.time = Date.now();
            }

            if (!v.hasOwnProperty('value')) {
                throw new Error(`Datapoint at index [${idx}] is missing \"value\" property with datapoint value`);
            }

            if (typeof v.value !== 'number') {
                throw new Error(`Datapoint at index [${idx}] datapoint value is not a number`);
            }

            return v;
        }

        node.on("input", function (msg) {
            if (this.active !== true) {
                return;
            }
            let value = msg[node.property];
            clearError();

            if (value == null) {      // null or undefined
                sendDataToClient(null, msg);    // delete chart
                return;
            }
            if (typeof value === 'number') {
                let data = [validDataPoint(value, 0)]
                sendDataToClient(data, msg);
                return;
            }
            try {
                if (typeof value === 'object') {
                    let data;
                    if (Array.isArray(value)) {
                        data = value.map((v, idx) => validDataPoint(v, idx))
                    } else {
                        data = [];
                        for (const [key, val] of Object.entries(value)) {
                            data.push(validDataPoint({
                                label: key,
                                value: val
                            }, 0));
                        }
                    }
                    sendDataToClient(data, msg);
                    return;
                }
            } catch (e) {
                handleError(e, msg, `msg.${node.property} is not a valid datapoint`);
            }
            handleError(`msg.${node.property} is not a valid datapoint`, msg, `msg.${node.property} is not a valid datapoint`);
        });

        node.on("close", function () {
            // send empty data to close the view
            RED.comms.publish("data", {id: this.id});
            node.status({});
        });
    }

    RED.nodes.registerType("graph-plot", GraphPlot);

    // Via the button on the node (in the FLOW EDITOR), the image pushing can be enabled or disabled
    RED.httpAdmin.post("/graph-plot/:id/:state", RED.auth.needsPermission("image-output.write"), function (req, res) {
        let state = req.params.state;
        let node = RED.nodes.getNode(req.params.id);

        if (node === null || typeof node === "undefined") {
            res.sendStatus(404);
            return;
        }

        if (state === "enable") {
            node.active = true;
            res.send('activated');
        } else if (state === "disable") {
            node.active = false;
            res.send('deactivated');
        } else {
            res.sendStatus(404);
        }
    });
};

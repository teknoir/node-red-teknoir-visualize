const { createCanvas, Image } = require('canvas')
const isBase64 = require('is-base64');

let COLORS = ['Aqua', 'Coral', 'Cyan', 'Yellow', 'GreenYellow'];
let getColor = function colorCounter() {
    let counter = 0;
    return function () {
        counter %= COLORS.length;
        return COLORS[counter++];
    };
}();

module.exports = function init(RED) {
    let bBoxOverlay = (function () {
        function BBoxOverlay(config) {
            let _this = this;
            this.strokeWidth = 2;
            this.fontSize = 10;
            this.objectsProp = 'objects';
            this.imageProp = 'image';
            this.objectsPropType = 'msgPayload';
            this.imagePropType = 'msgPayload';
            if (config.strokeWidth) {
                try {
                    this.strokeWidth = parseInt(config.strokeWidth, 10);
                }
                catch (_a) { }
            }
            if (config.fontSize) {
                try {
                    this.fontSize = parseInt(config.fontSize, 10);
                }
                catch (_b) { }
            }
            if (config.objectsPropType) {
                this.objectsPropType = config.objectsPropType;
                this.objectsProp = config.objectsProp;
            }
            if (config.imagePropType) {
                this.imageProp = config.imageProp;
                this.imagePropType = config.imagePropType;
            }

            const getImageBuffer = function (data) {
                //if image is base64, convert it to a buffer
                let isString = typeof data === 'string';
                let hasMime = false, isBase64Image = false
                if (isString) {
                    hasMime = data.startsWith("data:");
                    isBase64Image = isBase64(data, { mimeRequired: hasMime });
                }
                if (isString && isBase64Image) {
                    //convert to buffer ready for loading in jimp
                    let b64Data;
                    if (hasMime) {
                        b64Data = data.replace(/^data:image\/\w+;base64,/, "");//get data part only
                    } else {
                        b64Data = data;
                    }
                    //data = new Buffer(b64Data, 'base64'); depreciated
                    data = Buffer.from(b64Data, 'base64');
                }
                return data;
            }
            RED.nodes.createNode(this, config);
            this.on('input', function (msg) {
                var bboxObjects;
                var bboxImage;
                if (_this.objectsPropType === 'msg') {
                    bboxObjects = msg[_this.objectsProp];
                }
                else if (_this.objectsPropType === 'msgPayload') {
                    bboxObjects = msg.payload[_this.objectsProp];
                }
                else {
                    bboxObjects = msg.payload.event[_this.objectsProp];
                }
                if (_this.imagePropType === 'msg') {
                    bboxImage = msg[_this.imageProp];
                }
                else if (_this.imagePropType === 'msgPayload') {
                    bboxObjects = msg.payload[_this.imageProp];
                }
                else {
                    bboxImage = msg.payload.event[_this.imageProp];
                }
                _this.handleRequest(getImageBuffer(bboxImage), bboxObjects, msg);
            });
            this.on('close', function (done) {
                _this.handleClose(done);
            });
        }
        BBoxOverlay.prototype.handleRequest = function (image, objects, origMsg) {
            var _this = this;
            if (image === undefined || !Buffer.isBuffer(image)) {
                this.error('Image is invalid');
                return;
            }
            if (objects === undefined) {
                this.error('Objects is invalid');
                return;
            }
            var img = new Image();
            img.onload = function () {
                var imgBuff = _this.drawBBox(img, objects);
                var newMsg = origMsg;
                newMsg.payload = imgBuff;
                _this.send(newMsg);
            };
            img.onerror = function (err) {
                _this.error(err.message);
            };
            img.src = image;
        };
        BBoxOverlay.prototype.handleClose = function (done) {
            done();
        };
        BBoxOverlay.prototype.drawBBox = function (image, objects) {
            var _this = this;
            var canvas = createCanvas(image.width, image.height);
            var ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            ctx.lineWidth = this.strokeWidth;
            objects.forEach(function (obj) {
                var color = getColor();
                var _a = obj.bbox, x = _a[0], y = _a[1], w = _a[2], h = _a[3];
                if (x < 1) {
                    x = Math.round(x * image.width);
                    y = Math.round(y * image.height);
                    w = Math.round(w * image.width);
                    h = Math.round(h * image.height);
                }
                ctx.font = _this.fontSize + "px sans-serif";
                let annotation = obj.className + " : " + obj.score.toFixed(3)
                var txtMet = ctx.measureText(annotation);
                var ty = y - _this.fontSize - 1;
                ty = ty < 0 ? 0 : ty;
                ctx.strokeStyle = color;
                ctx.strokeRect(x, y, w, h);
                ctx.fillStyle = color;
                ctx.fillRect(x - 1, ty, txtMet.width + 4, _this.fontSize + 1);
                ctx.fillStyle = 'Black';
                ctx.fillText(annotation, x + 1, ty + Math.round(txtMet.emHeightAscent));
            });
            return canvas.toBuffer();
        };
        return BBoxOverlay;
    }());
    RED.nodes.registerType('bbox-overlay', bBoxOverlay);
};

//version 1.1.0.0
//fix for IE 8
if (typeof String.prototype.trim != 'function') {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
}

var JSON = JSON || {};
// implement JSON.stringify serialization
JSON.stringify = JSON.stringify || function (obj) {

    var t = typeof (obj);
    if (t != "object" || obj === null) {

        // simple data type
        if (t == "string") obj = '"' + obj + '"';
        return String(obj);

    }
    else {

        // recurse array or object
        var n, v, json = [], arr = (obj && obj.constructor == Array);
        
        for (n in obj) {
            v = obj[n]; t = typeof (v);

            if (v !== undefined) {
                if (t == "string") v = '"' + v + '"';
                else if (t == "object" && v !== null) v = JSON.stringify(v);

                json.push((arr ? "" : '"' + n + '":') + String(v));
            }
        }

        return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
    }
};
// implement JSON.parse de-serialization
JSON.parse = JSON.parse || function (str) {
    if (str === "") str = '""';
    eval("var p=" + str + ";");
    return p;
};

(function (window) {
    var pFrame = function(postOptions) {
            return new pFrame.fn.init(postOptions);  
        }
        , pFrameData = function (d, o, op, url, s) {
            this.status = s;
            this.data = d;
            this.onload = o;
            this.operation = op;
            if(url)
            this.url = url.toLowerCase();
          };
    window.pFrame = window.$XIFrame = pFrame;
    pFrame.fn = pFrame.prototype = {
        version: "1.1.0",
        init: function(postOptions) {
            if (typeof this.postMessageSettings === "undefined")
                this.postMessageSettings = pFrame.clone(pFrame.postMessageDefault);
            if (typeof postOptions === "undefined")
                postOptions = {};
            this.postMessageSettings = pFrame.extend(this.postMessageSettings, postOptions);

            if (!this.postMessageSettings.data)
                this.postMessageSettings.data = new Object();

            if (this.postMessageSettings.iFrameId && this.postMessageSettings.targetUrl)
                this.postMessageSettings.data.url = this.postMessageSettings.targetUrl.toLowerCase();

            else
                this.postMessageSettings.data.url = window.location.href.toLowerCase();

            pFrame.globalStorage.postMsg[this.postMessageSettings.data.url] = this.postMessageSettings;

            return this;
        },
        send: function (postMessageOptions) {
            if(postMessageOptions)
                this.postMessageSettings = pFrame.extend(this.postMessageSettings, postMessageOptions);
            pFrame.send(this.postMessageSettings);
        },
        submit: function (postMessageOptions) {
            if (postMessageOptions)
                this.postMessageSettings = pFrame.extend(this.postMessageSettings, postMessageOptions);
            pFrame.submit(this.postMessageSettings);
        },
        onload: function (postMessageOptions) {
            if (postMessageOptions)
                this.postMessageSettings = pFrame.extend(this.postMessageSettings, postMessageOptions);
            pFrame.onload(this.postMessageSettings);
        },
        validate:function(postMessageOptions) {
            if(postMessageOptions)
                this.postMessageSettings = pFrame.extend(this.postMessageSettings, postMessageOptions);
            pFrame.validate(this.postMessageSettings);
        },
        getCardAmount:function() {
            return pFrame.getCardAmount(this.postMessageSettings);
        }
    };
    pFrame.fn.init.prototype = pFrame.fn;

    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function (fn, scope) {
            for (var i = 0, len = this.length; i < len; ++i) {
                fn.call(scope || this, this[i], i, this);
            }
        };
    }
    if (!Object.keys) {
        Object.keys = function (obj) {
            var keys = [];
            for (var i in obj) {
                keys.push(i);
            }

            return keys;
        };
    }
    pFrame.extend = function (obj, prop) {
        if (!prop) { prop = obj; obj = this; }
        Object.keys(prop).forEach(function (item) {
            obj[item] = prop[item];
        });
        return obj;
    };
    pFrame.extend({
        createIFrameDataPacket: function (d, o, op,url, s) {
            return new pFrameData(d, o, op,url, s);
        }
    });
    pFrame.extend({
        local: {
            inProgress: false
        }
    });
    pFrame.extend({
        postMessageDefault: {
            mainSource: window,
            data: null,
            onReceive: null,
            onReply: null,
            onSuccess: null,
            onLoadSuccess: null,
            onError: null,
            onCardTypeChange: null,
            onLoad: false,
            onValidate: null,
            onInvalidHandler: null,
            storeCardAmount: false,
            autosizeheight: false,
            autosizewidth: false,
            amount: -1,
            intcp3DSecure: null
        },
        singleFramePostMessage: {},
        internalValues: {
            clientVersion: 0,
            enableCardTypeChange: false,
            enableCardAmountChange: false,
            enableInvalidHandler: false
},
        globalStorage: {
            postMsg: {}
        },
        init: function (postMessageOptions) {
            postMessageOptions = pFrame.extend(pFrame.clone(pFrame.postMessageDefault), postMessageOptions);
            if (postMessageOptions.data == null)
                postMessageOptions.data = new Object();
            if (postMessageOptions.onCardTypeChange)
                postMessageOptions.data.enableCardTypeChange = postMessageOptions.onCardTypeChange ? true : false;
            if (postMessageOptions.storeCardAmount)
                postMessageOptions.data.enableCardAmountChange = postMessageOptions.storeCardAmount ? true : false;
            if (postMessageOptions.onInvalidHandler)
                postMessageOptions.data.enableInvalidHandler = postMessageOptions.onInvalidHandler ? true : false;
            postMessageOptions.data.cardAmount = null;
            postMessageOptions.data.clientVersion = pFrame.fn.version;

            //support version 1.0.0
            singleFramePostMessage = pFrame.clone(postMessageOptions);

            return new pFrame.fn.init(postMessageOptions);

        },
        validate: function (postMessageOptions) {
            postMessageOptions.data = new pFrameData(postMessageOptions.data, false,"validate");
            pFrame.send(postMessageOptions);
        },
        send: function (postMessageOptions) {
            var option = pFrame.init(postMessageOptions);
            if (postMessageOptions.targetUrl)
                postMessageOptions.targetUrl = postMessageOptions.targetUrl.toLowerCase();
            pFrame.globalStorage.postMsg[postMessageOptions.targetUrl] = option.postMessageSettings;

            var iFrame = pFrame.find(postMessageOptions.iFrameId);
            if (iFrame) {
                var data = pFrame.jsonSerialize(option.postMessageSettings.data);
                postMessageOptions.mainSource = iFrame;
                try {
                    iFrame.contentWindow.postMessage(data, postMessageOptions.targetUrl);
                } catch (ex) {
                    if (postMessageOptions.onError)
                        postMessageOptions.onError(ex);
                }
            }
                //no need for postMessage because it is not in DieComm yet
            else if (postMessageOptions.onError) {
                postMessageOptions.onReceive("fail :" + postMessageOptions.iFrameId + " cannot be found.", postMessageOptions);
            }
        },

        submit: function (postMessageOptions) {

            if (typeof singleFramePostMessage !== 'undefined') {
                postMessageOptions = pFrame.extend(singleFramePostMessage, postMessageOptions);
            }
            postMessageOptions.data = new pFrameData(postMessageOptions.data, false);
            postMessageOptions.data.amount = postMessageOptions.amount;
            if (postMessageOptions.onError || postMessageOptions.onSuccess) {
                postMessageOptions.onReceive = pFrame.splitSuccessError;
            }
            pFrame.send(postMessageOptions);
        },
        onload: function (postMessageOptions) {

            if (typeof singleFramePostMessage!=='undefined') {
                postMessageOptions = pFrame.extend(singleFramePostMessage, postMessageOptions);
            }

            postMessageOptions.data = new pFrameData(postMessageOptions.data, true);

            if (postMessageOptions.onError || postMessageOptions.onSuccess) {
                postMessageOptions.onReceive = pFrame.splitSuccessError;
            }
            pFrame.send(postMessageOptions);
        },
        splitSuccessError: function (e, post) {
            var postReply = post;
            if (!postReply)
                postReply = pFrame.postMessageDefault; 
            var result = pFrame.jsonDeserialize(e.data);
            if (result) {
                if (result.operation && result.operation == "done") {
                    if (postReply.onSuccess) {
                        var isOf3Ds = false;
                        if (result.data) {
                            if (result.data.UrlsAndPayloadsFor3Ds && postReply.intcp3DSecure) {
                                isOf3Ds = true;
                                postReply.intcp3DSecure(result.data);
                            } else {
                                if (result.data.UrlsAndPayloadsFor3Ds) {
                                    isOf3Ds = true;
                                    var form = window.document.createElement("form");
                                    form.setAttribute('method', "post");
                                    form.setAttribute('action', result.data.UrlsAndPayloadsFor3Ds.CentinelAcsUrl);
                                    window.document.body.appendChild(form);

                                    var centinelPayload = document.createElement('input');
                                    centinelPayload.type = 'hidden';
                                    centinelPayload.name = 'PaReq';
                                    centinelPayload.value = result.data.UrlsAndPayloadsFor3Ds.CentinelPayload;
                                    form.appendChild(centinelPayload);

                                    var centinelTermUrl = document.createElement('input');
                                    centinelTermUrl.type = 'hidden';
                                    centinelTermUrl.name = 'TermUrl';
                                    centinelTermUrl.value = result.data.UrlsAndPayloadsFor3Ds.CentinelTermUrl;
                                    form.appendChild(centinelTermUrl);

                                    var paymetricPayload = document.createElement('input');
                                    paymetricPayload.type = 'hidden';
                                    paymetricPayload.name = 'MD';
                                    paymetricPayload.value = result.data.UrlsAndPayloadsFor3Ds.PaymetricPayload;
                                    form.appendChild(paymetricPayload);

                                    form.submit();
                                }
                            }
                        }
                        if (!isOf3Ds) {
                            postReply.onSuccess(e.data || e);
                        }
                    }
                }
                else if (result.status && result.status == "loadSuccess") {
                    if (postReply.onLoadSuccess) {
                        postReply.onLoadSuccess(e.data || e);
                    }
                } else {
                    if (postReply.onError) {
                        postReply.onError(e.data || e);
                    }
                }
            } else {
                if (postReply.onError) {
                    postReply.onError(e.data || e);
                }
            }
        },
        resize: function (h, w) {
            var size = new Object();
            if (h) size.height = h;
            if (w) size.width = w;
            var response = new pFrameData(size, false, "resize",window.location.href.toLowerCase());
            window.parent.postMessage(pFrame.jsonSerialize(response), "*");
        },
        cardTypeChange: function (e) {
            var response = new pFrameData(e, false, "cardTypeChange", window.location.href.toLowerCase());
            window.parent.postMessage(pFrame.jsonSerialize(response), "*");
        },
        cardAmountChange: function (e) {
            var response = new pFrameData(e, false, "cardAmountChange", window.location.href.toLowerCase());
            window.parent.postMessage(pFrame.jsonSerialize(response), "*");
        },
        oninvalidhandler: function (elements) {
            var invalidData = new pFrameData(elements, false, "invalidhandler", window.location.href.toLowerCase());
            window.parent.postMessage(pFrame.jsonSerialize(invalidData), "*");
        },
        getCardAmount: function (postMessageOptions) {
            return postMessageOptions.data.cardAmount;
        },
        find: function (ctrlId) {
            return (window.document.getElementById(ctrlId) || window.document.getElementsByName(ctrlId)[0]);
        },
        clone: function (obj) {
            if (null == obj || "object" != typeof obj) return obj;
            var copy = obj.constructor();
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
            }
            return copy;
        },
        jsonSerialize: function (data) {
            if (!data) {
                return null;
            }
            if (typeof data === "string") {
                return data;
            }
            return JSON.stringify(data);
        },
        jsonDeserialize: function (data) {

            if (!data) {
                return null;
            }

            var deserialize = null;
            try { deserialize = JSON.parse(data); }
            catch(e){ return deserialize; }

            if (deserialize == data) return data;

            return deserialize;
        },
        listener: function (e) {
            if (e.data) {
                var result = pFrame.jsonDeserialize(e.data);
                var postReply = result && pFrame.findPostMessage(result.url);
                if (postReply) {
                    postReply.mainSource = pFrame.extend({}, e);
                    switch (result.operation) {
                    case "resize":
                        resizeIFrame(postReply.iFrameId, result.data.width, result.data.height, postReply);
                        break;
                    case "cardTypeChange":
                        if (postReply.onCardTypeChange) {
                            postReply.onCardTypeChange.apply(null, [result.data]);
                        }
                        break;
                        case "cardAmountChange":
                            postReply.data.cardAmount = result.data;
                        break;

                    case "postValidate":
                        if (postReply.onValidate) {
                            postReply.onValidate.apply(null, [result.data]);
                        }
                        break;

                    case "invalidhandler":
                        if (postReply.onInvalidHandler)
                            postReply.onInvalidHandler.apply(null, [result.data]);
                            break;
                    default:
                        if (postReply.onReceive) {
                            postReply.onReceive.apply(null, [e,postReply]);
                        }
                        break;
                    }
                }
            }
        },
        receiveMessage: function (e) {
            var postReply = pFrame.globalValues.lastSession;
            if (postReply.onReceive) {
                postReply.onReceive.apply(null, [e]);
            }
        },
        replyMessage: function (e, message, url) {
            var postReply = pFrame.findPostMessage(url);
            var event = (e != null && e.source != null) ? e : postReply.mainSource;
            if (event.source) {
                event.source.postMessage(pFrame.jsonSerialize(message), event.origin);
                if (postReply.onReply) {
                    postReply.onReply.apply(null, [e]);
                }
            }
        },
        errorMessage: function (e, message) {
            e.source.postMessage(message, e.origin);
        }

    });
    pFrame.extend({
        findPostMessage:function(url) {
            var key = url;
            if (!key && window.location.href)
                key = window.location.href.toLowerCase();
            return pFrame.globalStorage.postMsg[key];
        }
    });

    //multiple identical eventlisteners will be discarded.
    if (window.addEventListener) {
        window.addEventListener('message', pFrame.listener, false);
    } else {
        window.attachEvent('onmessage', pFrame.listener);
    }

    if (document.addEventListener) {
        document.addEventListener('touchstart', {});
    }

    function resizeIFrame(iFrameId, width, height,postMsg) {
        if (iFrameId) {
            var iFrame = pFrame.find(iFrameId);
            if (iFrame && pFrame.postMessageDefault) {
                if (pFrame.postMessageDefault.autosizeheight || (postMsg && postMsg.autosizeheight))
                    iFrame.style.height = height + "px";
                if (pFrame.postMessageDefault.autosizewidth || (postMsg && postMsg.autosizewidth))
                    iFrame.style.width = width + "px";
            }
        }
    }
})(window);


(function(f) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = f();
    } else if (typeof define === "function" && define.amd) {
        define([], f);
    } else {
        var g;
        if (typeof window !== "undefined") {
            g = window;
        } else if (typeof global !== "undefined") {
            g = global;
        } else if (typeof self !== "undefined") {
            g = self;
        } else {
            g = this;
        }
        g.StockG = f();
    }
})(function() {
    var define, module, exports;
    return function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw f.code = "MODULE_NOT_FOUND", f;
                }
                var l = n[o] = {
                    exports: {}
                };
                t[o][0].call(l.exports, function(e) {
                    var n = t[o][1][e];
                    return s(n ? n : e);
                }, l, l.exports, e, t, n, r);
            }
            return n[o].exports;
        }
        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s;
    }({
        1: [ function(require, module, exports) {
            // Copyright Joyent, Inc. and other Node contributors.
            //
            // Permission is hereby granted, free of charge, to any person obtaining a
            // copy of this software and associated documentation files (the
            // "Software"), to deal in the Software without restriction, including
            // without limitation the rights to use, copy, modify, merge, publish,
            // distribute, sublicense, and/or sell copies of the Software, and to permit
            // persons to whom the Software is furnished to do so, subject to the
            // following conditions:
            //
            // The above copyright notice and this permission notice shall be included
            // in all copies or substantial portions of the Software.
            //
            // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
            // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
            // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
            // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
            // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
            // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
            // USE OR OTHER DEALINGS IN THE SOFTWARE.
            function EventEmitter() {
                this._events = this._events || {};
                this._maxListeners = this._maxListeners || undefined;
            }
            module.exports = EventEmitter;
            // Backwards-compat with node 0.10.x
            EventEmitter.EventEmitter = EventEmitter;
            EventEmitter.prototype._events = undefined;
            EventEmitter.prototype._maxListeners = undefined;
            // By default EventEmitters will print a warning if more than 10 listeners are
            // added to it. This is a useful default which helps finding memory leaks.
            EventEmitter.defaultMaxListeners = 10;
            // Obviously not all Emitters should be limited to 10. This function allows
            // that to be increased. Set to zero for unlimited.
            EventEmitter.prototype.setMaxListeners = function(n) {
                if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError("n must be a positive number");
                this._maxListeners = n;
                return this;
            };
            EventEmitter.prototype.emit = function(type) {
                var er, handler, len, args, i, listeners;
                if (!this._events) this._events = {};
                // If there is no 'error' event listener then throw.
                if (type === "error") {
                    if (!this._events.error || isObject(this._events.error) && !this._events.error.length) {
                        er = arguments[1];
                        if (er instanceof Error) {
                            throw er;
                        }
                        throw TypeError('Uncaught, unspecified "error" event.');
                    }
                }
                handler = this._events[type];
                if (isUndefined(handler)) return false;
                if (isFunction(handler)) {
                    switch (arguments.length) {
                      // fast cases
                        case 1:
                        handler.call(this);
                        break;

                      case 2:
                        handler.call(this, arguments[1]);
                        break;

                      case 3:
                        handler.call(this, arguments[1], arguments[2]);
                        break;

                      // slower
                        default:
                        len = arguments.length;
                        args = new Array(len - 1);
                        for (i = 1; i < len; i++) args[i - 1] = arguments[i];
                        handler.apply(this, args);
                    }
                } else if (isObject(handler)) {
                    len = arguments.length;
                    args = new Array(len - 1);
                    for (i = 1; i < len; i++) args[i - 1] = arguments[i];
                    listeners = handler.slice();
                    len = listeners.length;
                    for (i = 0; i < len; i++) listeners[i].apply(this, args);
                }
                return true;
            };
            EventEmitter.prototype.addListener = function(type, listener) {
                var m;
                if (!isFunction(listener)) throw TypeError("listener must be a function");
                if (!this._events) this._events = {};
                // To avoid recursion in the case that type === "newListener"! Before
                // adding it to the listeners, first emit "newListener".
                if (this._events.newListener) this.emit("newListener", type, isFunction(listener.listener) ? listener.listener : listener);
                if (!this._events[type]) // Optimize the case of one listener. Don't need the extra array object.
                this._events[type] = listener; else if (isObject(this._events[type])) // If we've already got an array, just append.
                this._events[type].push(listener); else // Adding the second element, need to change to array.
                this._events[type] = [ this._events[type], listener ];
                // Check for listener leak
                if (isObject(this._events[type]) && !this._events[type].warned) {
                    var m;
                    if (!isUndefined(this._maxListeners)) {
                        m = this._maxListeners;
                    } else {
                        m = EventEmitter.defaultMaxListeners;
                    }
                    if (m && m > 0 && this._events[type].length > m) {
                        this._events[type].warned = true;
                        console.error("(node) warning: possible EventEmitter memory " + "leak detected. %d listeners added. " + "Use emitter.setMaxListeners() to increase limit.", this._events[type].length);
                        if (typeof console.trace === "function") {
                            // not supported in IE 10
                            console.trace();
                        }
                    }
                }
                return this;
            };
            EventEmitter.prototype.on = EventEmitter.prototype.addListener;
            EventEmitter.prototype.once = function(type, listener) {
                if (!isFunction(listener)) throw TypeError("listener must be a function");
                var fired = false;
                function g() {
                    this.removeListener(type, g);
                    if (!fired) {
                        fired = true;
                        listener.apply(this, arguments);
                    }
                }
                g.listener = listener;
                this.on(type, g);
                return this;
            };
            // emits a 'removeListener' event iff the listener was removed
            EventEmitter.prototype.removeListener = function(type, listener) {
                var list, position, length, i;
                if (!isFunction(listener)) throw TypeError("listener must be a function");
                if (!this._events || !this._events[type]) return this;
                list = this._events[type];
                length = list.length;
                position = -1;
                if (list === listener || isFunction(list.listener) && list.listener === listener) {
                    delete this._events[type];
                    if (this._events.removeListener) this.emit("removeListener", type, listener);
                } else if (isObject(list)) {
                    for (i = length; i-- > 0; ) {
                        if (list[i] === listener || list[i].listener && list[i].listener === listener) {
                            position = i;
                            break;
                        }
                    }
                    if (position < 0) return this;
                    if (list.length === 1) {
                        list.length = 0;
                        delete this._events[type];
                    } else {
                        list.splice(position, 1);
                    }
                    if (this._events.removeListener) this.emit("removeListener", type, listener);
                }
                return this;
            };
            EventEmitter.prototype.removeAllListeners = function(type) {
                var key, listeners;
                if (!this._events) return this;
                // not listening for removeListener, no need to emit
                if (!this._events.removeListener) {
                    if (arguments.length === 0) this._events = {}; else if (this._events[type]) delete this._events[type];
                    return this;
                }
                // emit removeListener for all listeners on all events
                if (arguments.length === 0) {
                    for (key in this._events) {
                        if (key === "removeListener") continue;
                        this.removeAllListeners(key);
                    }
                    this.removeAllListeners("removeListener");
                    this._events = {};
                    return this;
                }
                listeners = this._events[type];
                if (isFunction(listeners)) {
                    this.removeListener(type, listeners);
                } else {
                    // LIFO order
                    while (listeners.length) this.removeListener(type, listeners[listeners.length - 1]);
                }
                delete this._events[type];
                return this;
            };
            EventEmitter.prototype.listeners = function(type) {
                var ret;
                if (!this._events || !this._events[type]) ret = []; else if (isFunction(this._events[type])) ret = [ this._events[type] ]; else ret = this._events[type].slice();
                return ret;
            };
            EventEmitter.listenerCount = function(emitter, type) {
                var ret;
                if (!emitter._events || !emitter._events[type]) ret = 0; else if (isFunction(emitter._events[type])) ret = 1; else ret = emitter._events[type].length;
                return ret;
            };
            function isFunction(arg) {
                return typeof arg === "function";
            }
            function isNumber(arg) {
                return typeof arg === "number";
            }
            function isObject(arg) {
                return typeof arg === "object" && arg !== null;
            }
            function isUndefined(arg) {
                return arg === void 0;
            }
        }, {} ],
        2: [ function(require, module, exports) {
            "use strict";
            module.exports = "1.0.1";
        }, {} ],
        3: [ function(require, module, exports) {
            "use strict";
            if ("undefined" !== typeof window) {} else {
                throw "Unsupported runtime environment: could not find d3 or techanjs";
            }
            module.exports = function() {
                return {
                    version: require("../build/version"),
                    create: require("./stockg"),
                    panel: require("./panel"),
                    settings: require("./settings"),
                    remote: require("./remote")
                };
            }();
        }, {
            "../build/version": 2,
            "./panel": 4,
            "./remote": 5,
            "./settings": 6,
            "./stockg": 7
        } ],
        4: [ function(require, module, exports) {
            function Panel(selector, core, options) {
                var settings = require("./settings")(options);
                var defaultZoom = core.zoom();
                var x = core.xScale(), y = core.yScale();
                var container = d3.select(selector);
                var currentDraw, _p1, _p2;
                var buttons, buttonsOption, buttonsControl;
                function createSupstance(value) {
                    return {
                        value: value
                    };
                }
                function createTrendline(p1, p2) {
                    return {
                        start: p1,
                        end: p2
                    };
                }
                function cleanActions() {
                    buttons.selectAll("li").classed("active", false);
                    currentDraw = null;
                    _p1 = null;
                    _p2 = null;
                    core.zoom(defaultZoom);
                }
                core.on("update", function() {
                    // Re-obtains the scales given that has been reseted
                    x = core.xScale();
                    y = core.yScale();
                });
                core.on("point", function(point, element, event) {
                    if (currentDraw) {
                        if (currentDraw == "supstance") {
                            var value = y.invert(point[1]);
                            core.draws("supstances", createSupstance(value));
                            cleanActions();
                        } else if (currentDraw == "trendline") {
                            if (_p1) {
                                _p2 = {
                                    date: x.invert(point[0]),
                                    value: y.invert(point[1])
                                };
                                core.draws("trendlines", createTrendline(_p1, _p2));
                                cleanActions();
                            } else {
                                // First Point
                                _p1 = {
                                    date: x.invert(point[0]),
                                    value: y.invert(point[1])
                                };
                            }
                        } else if (currentDraw == "trade") {
                            var type = "buy";
                            if (event.ctrlKey) {
                                type = "sell";
                            }
                            core.draws("trades", {
                                date: element.date,
                                type: type,
                                price: element.close,
                                low: element.low,
                                high: element.high
                            });
                            cleanActions();
                        }
                    }
                });
                function buttonListener() {
                    var element = d3.select(this);
                    var elementClass = element.attr("class");
                    if (elementClass == "cancel") {
                        cleanActions();
                    } else if (elementClass == "clear") {
                        core.clearDraws();
                        cleanActions();
                    } else {
                        // Disables the movement of the chart
                        core.zoom(false);
                        core.reset();
                        // Removes all the active class
                        buttons.selectAll("li").classed("active", false);
                        element.classed("active", true);
                        currentDraw = elementClass;
                        _p1 = null;
                        _p2 = null;
                    }
                }
                function buttonOptionListener() {
                    var element = d3.select(this);
                    var actual;
                    if (element.classed("macd")) {
                        actual = core.macd();
                        if (actual) {
                            element.classed("active", false);
                        } else {
                            element.classed("active", true);
                        }
                        core.macd(!actual);
                    } else if (element.classed("rsi")) {
                        actual = core.rsi();
                        if (actual) {
                            element.classed("active", false);
                        } else {
                            element.classed("active", true);
                        }
                        core.rsi(!actual);
                    } else if (element.classed("sma0")) {
                        actual = core.sma0();
                        if (actual) {
                            element.classed("active", false);
                        } else {
                            element.classed("active", true);
                        }
                        core.sma0(!actual);
                    } else if (element.classed("sma1")) {
                        actual = core.sma1();
                        if (actual) {
                            element.classed("active", false);
                        } else {
                            element.classed("active", true);
                        }
                        core.sma1(!actual);
                    } else if (element.classed("ema2")) {
                        actual = core.ema2();
                        if (actual) {
                            element.classed("active", false);
                        } else {
                            element.classed("active", true);
                        }
                        core.ema2(!actual);
                    } else if (element.classed("pause")) {
                        actual = core.pause();
                        if (actual) {
                            element.classed("active", false);
                        } else {
                            element.classed("active", true);
                        }
                        core.pause(!actual);
                    } else if (element.classed("zoom")) {
                        actual = core.zoom();
                        if (actual) {
                            element.classed("active", false);
                        } else {
                            element.classed("active", true);
                        }
                        core.zoom(!actual);
                    }
                }
                function setup() {
                    container.html("");
                    // Static buttons
                    buttonsControl = container.append("g").attr("class", "buttons control").append("ul");
                    buttonsControl.append("li").attr("class", "pause").attr("data-hint", settings.lang.hint_pause).on("click", buttonOptionListener);
                    buttonsControl.append("li").attr("class", "zoom" + (core.zoom() ? " active" : "")).attr("data-hint", settings.lang.hint_zoom).on("click", buttonOptionListener);
                    buttons = container.append("g").attr("class", "buttons draw").append("ul");
                    buttons.append("li").attr("class", "supstance").attr("data-hint", settings.lang.hint_supstance).on("click", buttonListener);
                    buttons.append("li").attr("class", "trendline").attr("data-hint", settings.lang.hint_trendline).on("click", buttonListener);
                    buttons.append("li").attr("class", "trade").attr("data-hint", settings.lang.hint_trade).on("click", buttonListener);
                    buttons.append("li").attr("class", "cancel").attr("data-hint", settings.lang.hint_cancel).on("click", buttonListener);
                    buttons.append("li").attr("class", "clear").attr("data-hint", settings.lang.hint_clear).on("click", buttonListener);
                    buttonsOption = container.append("g").attr("class", "buttons options").append("ul");
                    buttonsOption.append("li").attr("class", "macd" + (core.macd() ? " active" : "")).attr("data-hint", settings.lang.hint_macd).on("click", buttonOptionListener);
                    buttonsOption.append("li").attr("class", "rsi" + (core.rsi() ? " active" : "")).attr("data-hint", settings.lang.hint_rsi).on("click", buttonOptionListener);
                    buttonsOption.append("li").attr("class", "sma0" + (core.sma0() ? " active" : "")).attr("data-hint", settings.lang.hint_sma0).on("click", buttonOptionListener);
                    buttonsOption.append("li").attr("class", "sma1" + (core.sma1() ? " active" : "")).attr("data-hint", settings.lang.hint_sma1).on("click", buttonOptionListener);
                    buttonsOption.append("li").attr("class", "ema2" + (core.ema2() ? " active" : "")).attr("data-hint", settings.lang.hint_ema2).on("click", buttonOptionListener);
                }
                setup();
            }
            module.exports = Panel;
        }, {
            "./settings": 6
        } ],
        5: [ function(require, module, exports) {
            /**
 * Adds some sort of interface to handle external operations over the stock-g chart
 * @param core
 * @param options
 * @constructor
 */
            function Remote(core, options) {
                // Creates one arrow at one point, if there is some then it removes them
                this.addSingleArrow = function(element, type) {
                    // The only things needed are the x (date) point, and the price to point out, but if you can send all the element, better
                    core.clearDraws("trades");
                    if (!element.price) {
                        element["price"] = element.low;
                    }
                    if (type) {
                        element["type"] = type;
                    }
                    core.draws("trades", element);
                };
                // This one its used when you want to display in the chart the trades maded, trades need to have a date, type and price
                this.addTrades = function(trades, clear) {
                    if (clear) {
                        core.clearDraws("trades");
                    }
                    trades.filter(function(a) {
                        if (a.date && a.type && a.price) {
                            core.draws("trades", a);
                            return true;
                        }
                        return false;
                    });
                };
            }
            module.exports = Remote;
        }, {} ],
        6: [ function(require, module, exports) {
            module.exports = function(options) {
                var settings = {
                    zoom: true,
                    pause: false,
                    margins: {
                        top: 20,
                        right: 50,
                        bottom: 30,
                        left: 50
                    },
                    draw: "ohlc",
                    macd: false,
                    macd_height: 25,
                    rsi: false,
                    rsi_height: 25,
                    sma0: false,
                    sma1: false,
                    ema2: false,
                    parser: function(d) {
                        return new Date(d);
                    },
                    padding: 10,
                    supstances: [],
                    preroll: 2,
                    nFormat: "%Y-%m-%d",
                    symbol: "",
                    sma0_period: 10,
                    sma1_period: 20,
                    ema2_period: 50,
                    draws: {
                        id: 0,
                        trendlines: [],
                        supstances: [],
                        trades: [],
                        vlines: []
                    },
                    lang: {
                        no_data: "No se ha proporcionado información por favor selecciona una fuente de datos para graficar",
                        hint_pause: "Detiene la actualizacion",
                        hint_zoom: "Activa o desactiva la posibilidad de zoom",
                        hint_supstance: "Dibujar substancia",
                        hint_trendline: "Dibujar tendencia",
                        hint_trade: "Dibujar flecha en tick",
                        hint_cancel: "Cancela el dibujo pendiente",
                        hint_clear: "Limpia todos los dibujos de analisis",
                        hint_macd: "Activa o desactiva la grafica MACD",
                        hint_rsi: "Activa o desactiva la grafica RSI",
                        hint_sma0: "Muestra las medias moviles cortas",
                        hint_sma1: "Muestra las medias moviles medias",
                        hint_ema2: "Muestra las medias exponenciales moviles"
                    }
                };
                for (var key in options) {
                    settings[key] = options[key];
                }
                return settings;
            };
        }, {} ],
        7: [ function(require, module, exports) {
            "use strict";
            var events = require("events");
            function Core(selector, data, options) {
                var self = this;
                var settings = require("./settings")(options);
                var container = d3.select(selector);
                var initiated = false;
                var draws = settings.draws;
                function calculateDimensions() {
                    var d = {
                        width: parseInt(container.node().getBoundingClientRect().width),
                        height: parseInt(container.node().getBoundingClientRect().height),
                        margins: settings.margins,
                        padding: settings.padding
                    };
                    d["canvasWidth"] = d.width - (d.margins.left + d.margins.right);
                    d["canvasHeight"] = d.height - (d.margins.top + d.margins.bottom);
                    d["macd"] = settings.macd ? d.canvasHeight * (settings.macd_height / 100) + d.padding : 0;
                    d["rsi"] = settings.rsi ? d.canvasHeight * (settings.rsi_height / 100) + d.padding : 0;
                    d["macdHeight"] = d.canvasHeight * (settings.macd_height / 100);
                    d["rsiHeight"] = d.canvasHeight * (settings.rsi_height / 100);
                    d["chartHeight"] = d.canvasHeight - (d.macd + d.rsi);
                    d["ymacd"] = d.chartHeight + d.padding;
                    d["yrsi"] = d.chartHeight + d.padding + d.macd;
                    return d;
                }
                var dimensions;
                // Variables to the chart
                var parsedData = [], preroll = settings.preroll, accessor;
                var svg, dateParser, x, y, xAxis, yAxis, yPercent, volume, volumeAxis, yVolume, chartAnnotation, chartCrosshair, percentAnnotation, timeAnnotation, closeAnnotation, volumeAnnotation, percentAxis, charter, clips, chartSelection, indicatorSelection, analysisSelection;
                var zoom, zoomable, zoomPercent;
                var sma0, sma1, ema2;
                // Variables to MACD
                var macdData, macd, macdScale, macdAxis, macdAnnotation, macdAxisLeft, macdAnnotationLeft, macdCrosshair;
                // Variables to RSI
                var rsiData, rsi, rsiScale, rsiAxis, rsiAnnotation, rsiAxisLeft, rsiAnnotationLeft, rsiCrosshair;
                // Analysis variables
                var trendline, supstance, tradearrow;
                function dataParser(d) {
                    return {
                        date: dateParser(d.Date),
                        open: +d.Open,
                        high: +d.High,
                        low: +d.Low,
                        close: +d.Close,
                        volume: +d.Volume
                    };
                }
                function refresh() {
                    zoomPercent.translate(zoom.translate());
                    zoomPercent.scale(zoom.scale());
                    // Bar bottom X axis
                    svg.select("g.x.axis").call(xAxis);
                    // Price main Candle
                    svg.select("g.chart .axis").call(yAxis);
                    //
                    svg.select("g.volume.axis").call(volumeAxis);
                    svg.select("g.percent.axis").call(percentAxis);
                    svg.select("g.ohlc").call(charter.refresh);
                    svg.select("g.last-close.annotation").call(closeAnnotation.refresh);
                    svg.select("g.volume").call(volume.refresh);
                    svg.select("g.crosshair.chart").call(charter.refresh);
                    if (settings.macd) {
                        svg.select("g.macd .indicator-plot").call(macd.refresh);
                        svg.select("g.macd .axis.right").call(macdAxis);
                        svg.select("g.macd .axis.left").call(macdAxisLeft);
                        svg.select("g.crosshair.macd").call(macdCrosshair.refresh);
                    }
                    if (settings.rsi) {
                        svg.select("g.rsi .indicator-plot").call(rsi.refresh);
                        svg.select("g.rsi .axis.right").call(rsiAxis);
                        svg.select("g.rsi .axis.left").call(rsiAxisLeft);
                        svg.select("g.crosshair.rsi").call(rsiCrosshair.refresh);
                    }
                    if (settings.sma0) {
                        svg.select("g .sma.ma-0").call(sma0.refresh);
                    }
                    if (settings.sma1) {
                        svg.select("g .sma.ma-1").call(sma1.refresh);
                    }
                    if (settings.ema2) {
                        svg.select("g .ema.ma-2").call(ema2.refresh);
                    }
                    svg.select("g.analysis .supstances").datum(draws.supstances).call(supstance).call(supstance.drag);
                    svg.select("g.analysis .trendlines").datum(draws.trendlines).call(trendline).call(trendline.drag);
                    svg.select("g.analysis .trades").datum(draws.trades).call(tradearrow);
                }
                function draw() {
                    x.domain(techan.scale.plot.time(parsedData).domain());
                    y.domain(techan.scale.plot.ohlc(parsedData.slice(preroll)).domain());
                    yPercent.domain(techan.scale.plot.percent(y, accessor(parsedData[preroll])).domain());
                    yVolume.domain(techan.scale.plot.volume(parsedData).domain());
                    svg.select("g.ohlc").datum(parsedData).call(charter);
                    svg.select("g.last-close.annotation").datum([ parsedData[parsedData.length - 1] ]).call(closeAnnotation);
                    svg.select("g.volume").datum(parsedData).call(volume);
                    // Conditionals
                    if (settings.macd) {
                        macdData = techan.indicator.macd()(parsedData);
                        macdScale.domain(techan.scale.plot.macd(macdData).domain());
                        svg.select("g.macd .indicator-plot").datum(macdData).call(macd);
                        svg.select("g.crosshair.macd").call(macdCrosshair).call(zoom);
                    }
                    if (settings.rsi) {
                        rsiData = techan.indicator.rsi()(parsedData);
                        rsiScale.domain(techan.scale.plot.rsi(rsiData).domain());
                        svg.select("g.rsi .indicator-plot").datum(rsiData).call(rsi);
                        svg.select("g.crosshair.rsi").call(rsiCrosshair).call(zoom);
                    }
                    if (settings.sma0) {
                        svg.select("g.sma.ma-0").datum(techan.indicator.sma().period(settings.sma0_period)(parsedData)).call(sma0);
                    }
                    if (settings.sma1) {
                        svg.select("g.sma.ma-1").datum(techan.indicator.sma().period(settings.sma1_period)(parsedData)).call(sma1);
                    }
                    if (settings.ema2) {
                        svg.select("g.ema.ma-2").datum(techan.indicator.ema().period(settings.ema2_period)(parsedData)).call(ema2);
                    }
                    // Call the zoom HERE
                    svg.select("g.crosshair.chart").call(chartCrosshair).call(zoom);
                    zoomable = x.zoomable();
                    zoomable.domain([ preroll, parsedData.length ]);
                    zoom.x(zoomable).y(y);
                    zoomPercent.y(yPercent);
                    refresh();
                }
                function setup() {
                    if (!initiated) {
                        container.select("div").remove();
                        initiated = true;
                    }
                    dimensions = calculateDimensions();
                    // Creates the SVG to the full dimensions
                    self.svg = container.append("svg").attr("width", dimensions.width).attr("height", dimensions.height);
                    // Obtains the dateParser sended
                    dateParser = settings.parser;
                    // Zoomers and the action when zoom its applied
                    zoom = d3.behavior.zoom().scaleExtent([ 1, 20 ]).size([ dimensions.canvasWidth, dimensions.canvasHeight ]).on("zoom", function() {
                        if (settings.zoom) {
                            refresh();
                            return true;
                        }
                    });
                    zoomPercent = d3.behavior.zoom();
                    // Create the scales
                    x = techan.scale.financetime().range([ 0, dimensions.canvasWidth ]);
                    y = d3.scale.linear().range([ dimensions.chartHeight, 0 ]);
                    yPercent = y.copy();
                    yVolume = d3.scale.linear().range([ y(0), y(.2) ]);
                    // Create the drawer of the graph
                    charter = settings.draw == "ohlc" ? techan.plot.candlestick() : techan.plot.close();
                    charter.xScale(x).yScale(y);
                    volume = techan.plot.volume().accessor(charter.accessor()).xScale(x).yScale(yVolume);
                    // Axis
                    xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format(settings.nFormat));
                    yAxis = d3.svg.axis().scale(y).orient("right");
                    percentAxis = d3.svg.axis().scale(yPercent).orient("left").tickFormat(d3.format("+.1%"));
                    volumeAxis = d3.svg.axis().scale(yVolume).orient("right").ticks(3).tickFormat(d3.format(",.3s"));
                    // Annotations
                    timeAnnotation = techan.plot.axisannotation().axis(xAxis).format(d3.time.format(settings.nFormat)).width(70).translate([ 0, dimensions.canvasHeight ]);
                    chartAnnotation = techan.plot.axisannotation().axis(yAxis).format(d3.format(",.2fs")).translate([ x(1), 0 ]);
                    closeAnnotation = techan.plot.axisannotation().axis(yAxis).accessor(charter.accessor()).format(d3.format(",.2fs")).translate([ x(1), 0 ]);
                    percentAnnotation = techan.plot.axisannotation().axis(percentAxis);
                    volumeAnnotation = techan.plot.axisannotation().axis(volumeAxis).width(35);
                    // Crosshair
                    chartCrosshair = techan.plot.crosshair().xScale(timeAnnotation.axis().scale()).yScale(chartAnnotation.axis().scale()).xAnnotation(timeAnnotation).yAnnotation([ chartAnnotation, percentAnnotation, volumeAnnotation ]).verticalWireRange([ 0, dimensions.canvasHeight ]);
                    // Analysis variables instanciation
                    supstance = techan.plot.supstance().xScale(x).yScale(y);
                    trendline = techan.plot.trendline().xScale(x).yScale(y);
                    tradearrow = require("./tradearrow")().xScale(x).yScale(y);
                    // Clippers or masks to prevent the graphics overflow
                    clips = self.svg.append("defs");
                    clips.append("clipPath").attr("id", "chartClip").append("rect").attr("x", 0).attr("y", 0).attr("width", dimensions.canvasWidth).attr("height", dimensions.chartHeight);
                    clips.append("clipPath").attr("id", "fullClip").append("rect").attr("x", 0 - dimensions.margins.left).attr("y", 0).attr("width", dimensions.width).attr("height", dimensions.chartHeight);
                    // Now create the wrapper group, that will be the container of all the other groups
                    svg = self.svg.append("g").attr("transform", "translate(" + dimensions.margins.left + "," + dimensions.margins.top + ")");
                    // Create the text field that will contain the symbol name
                    svg.append("text").attr("class", "name").attr("x", 20).attr("y", dimensions.margins.top + 10).text(settings.symbol);
                    svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + dimensions.canvasHeight + ")");
                    chartSelection = svg.append("g").attr("class", "chart");
                    chartSelection.append("g").attr("class", "axis").attr("transform", "translate(" + x(1) + ",0)").append("text").attr("transform", "rotate(-90)").attr("y", -12).attr("dy", ".71em");
                    chartSelection.append("g").attr("class", "volume").attr("clip-path", "url(#chartClip)");
                    chartSelection.append("g").attr("class", "ohlc").attr("clip-path", "url(#chartClip)");
                    chartSelection.append("g").attr("class", "percent axis");
                    chartSelection.append("g").attr("class", "volume axis");
                    chartSelection.append("g").attr("class", "last-close annotation");
                    // Conditionals
                    if (settings.macd) {
                        macdScale = d3.scale.linear().range([ dimensions.ymacd + dimensions.macdHeight, dimensions.ymacd ]);
                        macd = techan.plot.macd().xScale(x).yScale(macdScale);
                        macdAxis = d3.svg.axis().scale(macdScale).ticks(3).orient("right");
                        macdAxisLeft = d3.svg.axis().scale(macdScale).ticks(3).orient("left");
                        macdAnnotation = techan.plot.axisannotation().axis(macdAxis).format(d3.format(",.2fs")).translate([ x(1), x(0) ]);
                        macdAnnotationLeft = techan.plot.axisannotation().axis(macdAxisLeft).format(d3.format(",.2fs"));
                        macdCrosshair = techan.plot.crosshair().xScale(timeAnnotation.axis().scale()).yScale(macdAnnotation.axis().scale()).xAnnotation(timeAnnotation).yAnnotation([ macdAnnotation, macdAnnotationLeft ]).verticalWireRange([ 0, dimensions.canvasHeight ]);
                        clips.append("clipPath").attr("id", "macdClip").append("rect").attr("x", 0).attr("y", dimensions.ymacd).attr("width", dimensions.canvasWidth).attr("height", dimensions.macd);
                        indicatorSelection = svg.append("g").attr("class", "indicator macd");
                        indicatorSelection.append("g").attr("class", "axis right").attr("transform", "translate(" + x(1) + ",0)");
                        indicatorSelection.append("g").attr("class", "axis left").attr("transform", "translate(" + x(0) + ",0)");
                        indicatorSelection.append("g").attr("class", "indicator-plot").attr("clip-path", "url(#macdClip)");
                        svg.append("g").attr("class", "crosshair macd");
                    }
                    if (settings.rsi) {
                        rsiScale = d3.scale.linear().range([ dimensions.yrsi + dimensions.rsiHeight, dimensions.yrsi ]);
                        rsi = techan.plot.rsi().xScale(x).yScale(rsiScale);
                        rsiAxis = d3.svg.axis().scale(rsiScale).ticks(3).orient("right");
                        rsiAxisLeft = d3.svg.axis().scale(rsiScale).ticks(3).orient("left");
                        rsiAnnotation = techan.plot.axisannotation().axis(rsiAxis).format(d3.format(",.2fs")).translate([ x(1), x(0) ]);
                        rsiAnnotationLeft = techan.plot.axisannotation().axis(rsiAxisLeft).format(d3.format(",.2fs"));
                        rsiCrosshair = techan.plot.crosshair().xScale(timeAnnotation.axis().scale()).yScale(rsiAnnotation.axis().scale()).xAnnotation(timeAnnotation).yAnnotation([ rsiAnnotation, rsiAnnotationLeft ]).verticalWireRange([ 0, dimensions.canvasHeight ]);
                        clips.append("clipPath").attr("id", "rsiClip").append("rect").attr("x", 0).attr("y", dimensions.yrsi).attr("width", dimensions.canvasWidth).attr("height", dimensions.rsi);
                        indicatorSelection = svg.append("g").attr("class", "indicator rsi");
                        indicatorSelection.append("g").attr("class", "axis right").attr("transform", "translate(" + x(1) + ",0)");
                        indicatorSelection.append("g").attr("class", "axis left").attr("transform", "translate(" + x(0) + ",0)");
                        indicatorSelection.append("g").attr("class", "indicator-plot").attr("clip-path", "url(#rsiClip)");
                        svg.append("g").attr("class", "crosshair rsi");
                    }
                    if (settings.sma0) {
                        sma0 = techan.plot.sma().xScale(x).yScale(y);
                        chartSelection.append("g").attr("class", "indicator sma ma-0").attr("clip-path", "url(#chartClip)");
                    }
                    if (settings.sma1) {
                        sma1 = techan.plot.sma().xScale(x).yScale(y);
                        chartSelection.append("g").attr("class", "indicator sma ma-1").attr("clip-path", "url(#chartClip)");
                    }
                    if (settings.ema2) {
                        ema2 = techan.plot.ema().xScale(x).yScale(y);
                        chartSelection.append("g").attr("class", "indicator ema ma-2").attr("clip-path", "url(#chartClip)");
                    }
                    // Crosshairs group at the bottom-ish to be displayed even on the indicators
                    svg.append("g").attr("class", "crosshair chart").on("click", function() {
                        var point = d3.mouse(this);
                        var xClicked = x.invert(point[0]);
                        var element = false;
                        parsedData.find(function(e, i) {
                            if (e.date == xClicked) {
                                e["index"] = i;
                                element = e;
                                return true;
                            }
                        });
                        self.emit("point", point, element, d3.event);
                    });
                    analysisSelection = svg.append("g").attr("class", "analysis");
                    analysisSelection.append("g").attr("class", "supstances").attr("clip-path", "url(#fullClip)");
                    analysisSelection.append("g").attr("class", "trendlines").attr("clip-path", "url(#chartClip)");
                    analysisSelection.append("g").attr("class", "trades").attr("clip-path", "url(#chartClip)");
                }
                function reset() {
                    if (self.svg) {
                        self.svg.remove();
                        setup();
                        draw();
                        self.emit("update");
                    }
                }
                function parseData(data) {
                    accessor = charter.accessor();
                    parsedData = data.map(dataParser).sort(function(a, b) {
                        return a.date - b.date;
                    });
                    return self;
                }
                this.options = function(options) {
                    if (arguments.length == 0) {
                        return settings;
                    }
                    for (var key in options) {
                        settings[key] = options[key];
                    }
                    reset();
                    return self;
                };
                this.setName = function(name) {
                    settings.symbol = name;
                    svg.select("text.name").text(name);
                    return self;
                };
                this.xScale = function() {
                    return x;
                };
                this.yScale = function() {
                    return y;
                };
                this.draws = function(type, d) {
                    if (arguments.length == 0) {
                        return draws;
                    }
                    d["id"] = ++draws.id;
                    draws[type].push(d);
                    refresh();
                    return d;
                };
                this.clearDraws = function(type) {
                    var _draws = require("./settings")()["draws"];
                    // Obtains the default draws settings
                    if (type) {
                        draws[type] = _draws[type];
                        return true;
                    }
                    draws = _draws;
                    refresh();
                };
                this.macd = function(a, percent) {
                    if (arguments.length == 0) {
                        return settings.macd;
                    }
                    settings.macd = a;
                    if (percent) {
                        settings.macd_height = percent;
                    }
                    reset();
                };
                this.rsi = function(a, percent) {
                    if (arguments.length == 0) {
                        return settings.rsi;
                    }
                    settings.rsi = a;
                    if (percent) {
                        settings.rsi_height = percent;
                    }
                    reset();
                };
                this.sma0 = function(a, period) {
                    if (arguments.length == 0) {
                        return settings.sma0;
                    }
                    settings.sma0 = a;
                    if (period) {
                        settings.sma0_period = period;
                    }
                    reset();
                };
                this.sma1 = function(a, period) {
                    if (arguments.length == 0) {
                        return settings.sma1;
                    }
                    settings.sma1 = a;
                    if (period) {
                        settings.sma1_period = period;
                    }
                    reset();
                };
                this.ema2 = function(a, period) {
                    if (arguments.length == 0) {
                        return settings.ema2;
                    }
                    settings.ema2 = a;
                    if (period) {
                        settings.ema2_period = period;
                    }
                    reset();
                };
                this.setData = function(d) {
                    if (!initiated) {
                        setup();
                    }
                    parseData(d);
                    reset();
                    return self;
                };
                this.addTick = function(tick, shift) {
                    parsedData.push(dataParser(tick));
                    if (shift) {
                        parsedData.shift();
                    }
                    if (!settings.pause) {
                        reset();
                    }
                };
                this.zoom = function(a) {
                    if (arguments.length == 0) {
                        return settings.zoom;
                    }
                    settings.zoom = a;
                    return self;
                };
                this.pause = function(a) {
                    if (arguments.length == 0) {
                        return settings.pause;
                    }
                    settings.pause = a;
                    if (!a) {
                        reset();
                    }
                    return self;
                };
                this.reset = function() {
                    reset();
                    return self;
                };
                // Resets the dimensions if the window resizes
                window.onresize = function() {
                    reset();
                };
                function firstRun() {
                    container.html("");
                    if (data) {
                        initiated = true;
                        setup();
                        parseData(data);
                        draw();
                    } else {
                        container.append("div").attr("class", "no-data").append("div").attr("class", "no-data-content").append("p").text(settings.lang.no_data);
                    }
                }
                firstRun();
            }
            Core.prototype = new events.EventEmitter();
            module.exports = Core;
        }, {
            "./settings": 6,
            "./tradearrow": 8,
            events: 1
        } ],
        8: [ function(require, module, exports) {
            // Container function
            module.exports = function() {
                var _x;
                var _y;
                var _data;
                function pathDirection(a) {
                    if (a.type == "sell") {
                        return "M 0 0 l -6 -7.5 l 4 0 l 0 -7.5 l 4 0 l 0 7.5 l 4 0 z";
                    }
                    return "M 0 0 l -6 7.5 l 4 0 l 0 7.5 l 4 0 l 0 -7.5 l 4 0 z";
                }
                function translation(a) {
                    var price = a.price, mod = 0;
                    if (a.type && a.low && a.high) {
                        if (a.type == "sell") {
                            price = a.high;
                            mod = -5;
                        } else {
                            price = a.low;
                            mod = 5;
                        }
                    }
                    return "translate(" + _x(a.date) + "," + (_y(price) + mod) + ")";
                }
                function tradearrow(g) {
                    _data = g.data()[0];
                    var group = g.selectAll("g").data(_data);
                    // If exists, then translate it to the point
                    group.attr("transform", translation);
                    // If doesnt exist well, make it
                    group.enter().append("g").attr("class", function(a) {
                        return "tradearrow " + a.type;
                    }).attr("id", function(a) {
                        return "arrow_" + a.id;
                    }).attr("transform", translation).append("path").attr("d", pathDirection);
                    // If not needed anymore, remove it
                    group.exit().remove();
                }
                tradearrow.refresh = function(g) {};
                tradearrow.xScale = function(scale) {
                    _x = scale;
                    return this;
                };
                tradearrow.yScale = function(scale) {
                    _y = scale;
                    return this;
                };
                return tradearrow;
            };
        }, {} ]
    }, {}, [ 3 ])(3);
});
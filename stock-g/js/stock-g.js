var sele;

function StockG(container, options, data, symbolName) {

    var self = this;

    this.data = data;
    this.container = d3.select(container);
    this._symbol = symbolName;
    this.canZoom = true;
    this.totalWidth = parseInt(this.container.node().getBoundingClientRect().width);

    this.totalHeight = parseInt(this.container.node().getBoundingClientRect().height);

    this.opt = function (key, def) {
        if (options && options[key]) {
            return options[key];
        }
        return def || null;
    };
    this.margins = {
        top: 20,
        right: 50,
        bottom: 30,
        left: 50
    };

    this.mainDraw = this.opt("main", "ohlc");

    this.drawMACD = this.opt("macd", false);

    this.drawRSI = this.opt("rsi", false);

    this.drawSma0 = this.opt("sma0", false);
    this.drawSma1 = this.opt("sma1", false);
    this.drawEma2 = this.opt("ema2", false);

    this.parser = this.opt("parser", "mils");
    this.baseCounter = this.opt("base", 0);

    this.indicatorDimensions = {
        macd: {
            percent: self.opt("macdp", 25)
        },
        rsi: {
            percent: self.opt("rsip", 25)
        },
        padding: self.opt("padding", 10)
    };

    this.canvasWidth = function () {
        return self.totalWidth - self.margins.left - self.margins.right;
    };

    this.canvasHeight = function () {
        return self.totalHeight - self.margins.top - self.margins.bottom;
    };

    this.symbol = function () {
        return self._symbol;
    };

    this.supstances = this.opt("supstances", []);
    this.vline = this.opt("vline", false);

    this.ohlcHeight = function () {
        var height = self.canvasHeight();
        if (self.drawMACD) {
            height -= self.indicatorHeight("macd") + self.indicatorDimensions.padding;
        }
        if (self.drawRSI) {
            height -= self.indicatorHeight("rsi") + self.indicatorDimensions.padding;
        }
        return parseInt(height);
    };

    // Returns the y position for the indicator given
    this.indicatorTop = function (indicatorName) {
        var position = self.ohlcHeight() + self.indicatorDimensions.padding;
        if (indicatorName == "rsi" && self.drawMACD) {
            position += self.indicatorHeight("macd") + self.indicatorDimensions.padding;
        }
        return parseInt(position);
    };

    this.indicatorHeight = function (indicatorName) {
        return parseInt(self.canvasHeight() * (self.indicatorDimensions[indicatorName].percent / 100));
    };

    // Global variables used
    var parseDate;
    var zoom;
    var zoomPercent;
    var x;
    var y;
    var yPercent;
    var yVolume;
    var candlestick;
    var volume;
    var volumeAxis;
    var volumeAnnotation;
    var xAxis;
    var yAxis;
    var timeAnnotation;
    var ohlcAnnotation;
    var ohlcCrosshair;
    var percentAnnotation;
    var closeAnnotation;
    var percentAxis;
    var macdScale;
    var macd;
    var macdAxis;
    var macdAnnotation;
    var macdAxisLeft;
    var macdAnnotationLeft;
    var macdCrosshair;
    var rsiScale;
    var rsi;
    var rsiAxis;
    var rsiAnnotation;
    var rsiAxisLeft;
    var rsiAnnotationLeft;
    var rsiCrosshair;
    var defs;
    var svg;
    var ohlcSelection;

    var supstance;
    var vLineContainer;

    var sma0;
    var sma1;
    var ema2;

    var indicatorSelection;

    this.setup = function () {
        // Create the new SVG canvas
        self.svg = d3.select(container).append("svg")
            .attr("width", self.totalWidth)
            .attr("height", self.totalHeight);

        // Creation of elements base
        parseDate = function (d) {
            if (self.parser == "base") {
                return new Date((self.baseCounter + (+d)) * 1000);
            } else if (self.parser == "mils") {
                return new Date(+d);
            } else if (self.parser == "text") {
                return new Date(d);
            } else {
                return d3.time.format(self.parser).parse(d);
            }
        };

        zoom = d3.behavior.zoom()
            .scaleExtent([1, 20])
            .size([self.canvasWidth(), self.canvasHeight()])
            .on("zoom", function () {
                if (self.canZoom) {
                    self.draw();
                    return true;
                }
            });
        zoomPercent = d3.behavior.zoom();

        x = techan.scale.financetime()
            .range([0, self.canvasWidth()]);

        y = d3.scale.linear()
            .range([self.ohlcHeight(), 0]);

        yPercent = y.copy();
        yVolume = d3.scale.linear()
            .range([y(0), y(0.2)]);

        // Selects the kind of drawing ohlc or line
        if (self.mainDraw == "line") {
            candlestick = techan.plot.close()
                .xScale(x)
                .yScale(y);
        } else {
            candlestick = techan.plot.candlestick()
                .xScale(x)
                .yScale(y);
        }

        volume = techan.plot.volume()
            .accessor(candlestick.accessor())   // Set the accessor to a ohlc accessor so we get highlighted bars
            .xScale(x)
            .yScale(yVolume);

        xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        timeAnnotation = techan.plot.axisannotation()
            .axis(xAxis)
            .format(d3.time.format(self.opt("nFormat", '%Y-%m-%d')))
            .width(70)
            .translate([0, self.canvasHeight()]);

        yAxis = d3.svg.axis()
            .scale(y)
            .orient("right");

        ohlcAnnotation = techan.plot.axisannotation()
            .axis(yAxis)
            .format(d3.format(',.2fs'))
            .translate([x(1), 0]);

        closeAnnotation = techan.plot.axisannotation()
            .axis(yAxis)
            .accessor(candlestick.accessor())
            .format(d3.format(',.2fs'))
            .translate([x(1), 0]);

        percentAxis = d3.svg.axis()
            .scale(yPercent)
            .orient("left")
            .tickFormat(d3.format('+.1%'));

        percentAnnotation = techan.plot.axisannotation()
            .axis(percentAxis);

        volumeAxis = d3.svg.axis()
            .scale(yVolume)
            .orient("right")
            .ticks(3)
            .tickFormat(d3.format(",.3s"));

        volumeAnnotation = techan.plot.axisannotation()
            .axis(volumeAxis)
            .width(35);

        ohlcCrosshair = techan.plot.crosshair()
            .xScale(timeAnnotation.axis().scale())
            .yScale(ohlcAnnotation.axis().scale())
            .xAnnotation(timeAnnotation)
            .yAnnotation([ohlcAnnotation, percentAnnotation, volumeAnnotation])
            .verticalWireRange([0, self.canvasHeight()]);

        supstance = techan.plot.supstance()
            .xScale(x)
            .yScale(y)
            .annotation([ohlcAnnotation, percentAnnotation]);

        if (self.drawMACD) {
            macdScale = d3.scale.linear()
                .range([self.indicatorTop("macd") + self.indicatorHeight("macd"), self.indicatorTop("macd")]);

            macd = techan.plot.macd()
                .xScale(x)
                .yScale(macdScale);

            macdAxis = d3.svg.axis()
                .scale(macdScale)
                .ticks(3)
                .orient("right");

            macdAnnotation = techan.plot.axisannotation()
                .axis(macdAxis)
                .format(d3.format(',.2fs'))
                .translate([x(1), 0]);

            macdAxisLeft = d3.svg.axis()
                .scale(macdScale)
                .ticks(3)
                .orient("left");

            macdAnnotationLeft = techan.plot.axisannotation()
                .axis(macdAxisLeft)
                .format(d3.format(',.2fs'));

            macdCrosshair = techan.plot.crosshair()
                .xScale(timeAnnotation.axis().scale())
                .yScale(macdAnnotation.axis().scale())
                .xAnnotation(timeAnnotation)
                .yAnnotation([macdAnnotation, macdAnnotationLeft])
                .verticalWireRange([0, self.canvasHeight()]);
        }

        if (self.drawRSI) {
            rsiScale = d3.scale.linear()
                .range([self.indicatorTop("rsi") + self.indicatorHeight("rsi"), self.indicatorTop("rsi")]);

            rsi = techan.plot.rsi()
                .xScale(x)
                .yScale(rsiScale);

            rsiAxis = d3.svg.axis()
                .scale(rsiScale)
                .ticks(3)
                .orient("right");

            rsiAnnotation = techan.plot.axisannotation()
                .axis(rsiAxis)
                .format(d3.format(',.2fs'))
                .translate([x(1), 0]);

            rsiAxisLeft = d3.svg.axis()
                .scale(rsiScale)
                .ticks(3)
                .orient("left");

            rsiAnnotationLeft = techan.plot.axisannotation()
                .axis(rsiAxisLeft)
                .format(d3.format(',.2fs'));

            rsiCrosshair = techan.plot.crosshair()
                .xScale(timeAnnotation.axis().scale())
                .yScale(rsiAnnotation.axis().scale())
                .xAnnotation(timeAnnotation)
                .yAnnotation([rsiAnnotation, rsiAnnotationLeft])
                .verticalWireRange([0, self.canvasHeight()]);
        }

        // Creating the clips that masks the drawing so it doesnt falls out of the area
        defs = self.svg.append("defs");

        defs.append("clipPath")
            .attr("id", "ohlcClip")
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", self.canvasWidth())
            .attr("height", self.ohlcHeight());

        defs.selectAll("indicatorClip").data(["macd", "rsi"])
            .enter()
            .append("clipPath")
            .attr("id", function (d, i) {
                return "indicatorClip-" + i;
            })
            .append("rect")
            .attr("x", 0)
            .attr("y", function (d) {
                return self.indicatorTop(d);
            })
            .attr("width", self.canvasWidth())
            .attr("height", function (d) {
                return self.indicatorHeight(d);
            });

        svg = self.svg.append("g")
            .attr("transform", "translate(" + self.margins.left + "," + self.margins.top + ")");

        svg.append('text')
            .attr("class", "symbol")
            .attr("x", 20)
            .text(self.symbol());

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + self.canvasHeight() + ")");

        ohlcSelection = svg.append("g")
            .attr("class", "ohlc");

        ohlcSelection.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + x(1) + ",0)")
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -12)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Price ($)");

        ohlcSelection.append("g")
            .attr("class", "close annotation up");

        ohlcSelection.append("g")
            .attr("class", "volume")
            .attr("clip-path", "url(#ohlcClip)");

        ohlcSelection.append("g")
            .attr("class", "candlestick")
            .attr("clip-path", "url(#ohlcClip)");

        ohlcSelection.append("g")
            .attr("class", "percent axis");

        ohlcSelection.append("g")
            .attr("class", "volume axis");

        indicatorSelection = svg.selectAll("svg > g.indicator").data(["macd", "rsi"])
            .enter()
            .append("g")
            .attr("class", function (d) {
                return d + " indicator";
            });

        indicatorSelection.append("g")
            .attr("class", "axis right")
            .attr("transform", "translate(" + x(1) + ",0)");

        indicatorSelection.append("g")
            .attr("class", "axis left")
            .attr("transform", "translate(" + x(0) + ",0)");

        indicatorSelection.append("g")
            .attr("class", "indicator-plot")
            .attr("clip-path", function (d, i) {
                return "url(#indicatorClip-" + i + ")";
            });

        if (self.drawSma0) {
            sma0 = techan.plot.sma()
                .xScale(x)
                .yScale(y);

            ohlcSelection.append("g")
                .attr("class", "indicator sma ma-0")
                .attr("clip-path", "url(#ohlcClip)");
        }

        if (self.drawSma1) {
            sma1 = techan.plot.sma()
                .xScale(x)
                .yScale(y);

            ohlcSelection.append("g")
                .attr("class", "indicator sma ma-1")
                .attr("clip-path", "url(#ohlcClip)");
        }

        if (self.drawEma2) {
            ema2 = techan.plot.ema()
                .xScale(x)
                .yScale(y);

            ohlcSelection.append("g")
                .attr("class", "indicator ema ma-2")
                .attr("clip-path", "url(#ohlcClip)");
        }

        // Crosshairs last to allow display even over candlesticks

        svg.append('g')
            .attr("class", "crosshair ohlc")
            .on("click", function () {
                if(d3.event.ctrlKey) {
                    var point = d3.mouse(this);
                    var xClicked = x.invert(point[0]);

                    var index = false;
                    parsedData.find(function(e, i){
                        if(e.date == xClicked){
                            index = i;
                            return true;
                        }
                    });

                    self.emit("point", xClicked, y.invert(point[1]), point, index);
                }
            });

        svg.append('g')
            .attr("class", "crosshair macd");

        svg.append('g')
            .attr("class", "crosshair rsi");

        // Supstance, horizontal lines over everything

        svg.append('g')
            .attr("class", "supstances analysis");

        vLineContainer = svg.append('g')
            .attr("class", "vline analysis");
    };

    var accessor;
    var parsedData;
    var macdData;
    var rsiData;
    var indicatorPreRoll = self.opt("preroll", 1);

    var zoomable;

    this.setData = function (data) {
        accessor = candlestick.accessor();
        parsedData = data.map(function (d) {
            return {
                date: parseDate(d.Date),
                open: +d.Open,
                high: +d.High,
                low: +d.Low,
                close: +d.Close,
                volume: +d.Volume
            };
        }).sort(function (a, b) {
            return d3.ascending(accessor.d(a), accessor.d(b));
        });
        return self;
    };

    this.updateData = function (data) {
        self.setData(data);
        self.preDraw();
        return self;
    };

    this.changeData = function (data) {
        self.setData(data);
        self.reset();
        return self;
    };

    // Creating a new vline for the graph
    function vLine(){
        var exists = !vLineContainer.select("path").empty();
        if(self.vline) {
            if(!exists) {
                vLineContainer
                    .append("path")
                    .attr("d", function () {
                        return "M " + x(parseDate(self.vline)) + " 0 V " + self.canvasHeight();
                    });
            }else{
                vLine.refresh();
            }
        }else{
            if(exists){
                vLineContainer.select("path").remove();
            }
        }
    }
    vLine.refresh = function(){
        vLineContainer.select("path").attr("d", function(){
            return "M " + x(parseDate(self.vline)) + " 0 V " + self.canvasHeight();
        });
    };

    function vSupstances() {
        svg.select("g.supstances").datum(self.supstances).call(supstance).call(supstance.drag);
    }
    vSupstances.refresh = function(){
        if (self.supstances.length > 0) {
            svg.select("g.supstances").call(supstance.refresh);
        }
    };

    this.preDraw = function () {
        x.domain(techan.scale.plot.time(parsedData).domain());
        y.domain(techan.scale.plot.ohlc(parsedData.slice(indicatorPreRoll)).domain());

        yPercent.domain(techan.scale.plot.percent(y, accessor(parsedData[indicatorPreRoll])).domain());
        yVolume.domain(techan.scale.plot.volume(parsedData).domain());

        svg.select("g.candlestick").datum(parsedData).call(candlestick);
        svg.select("g.close.annotation").datum([parsedData[parsedData.length - 1]]).call(closeAnnotation);

        svg.select("g.volume").datum(parsedData).call(volume);

        if (self.drawMACD) {
            macdData = techan.indicator.macd()(parsedData);
            macdScale.domain(techan.scale.plot.macd(macdData).domain());
            svg.select("g.macd .indicator-plot").datum(macdData).call(macd);
            svg.select("g.crosshair.macd").call(macdCrosshair).call(zoom);
        }
        if (self.drawRSI) {
            rsiData = techan.indicator.rsi()(parsedData);
            rsiScale.domain(techan.scale.plot.rsi(rsiData).domain());
            svg.select("g.rsi .indicator-plot").datum(rsiData).call(rsi);
            svg.select("g.crosshair.rsi").call(rsiCrosshair).call(zoom);
        }
        if (self.drawSma0) {
            svg.select("g.sma.ma-0").datum(techan.indicator.sma().period(10)(parsedData)).call(sma0);
        }
        if (self.drawSma1) {
            svg.select("g.sma.ma-1").datum(techan.indicator.sma().period(20)(parsedData)).call(sma1);
        }
        if (self.drawEma2) {
            svg.select("g.ema.ma-2").datum(techan.indicator.ema().period(50)(parsedData)).call(ema2);
        }

        vSupstances();
        vLine();

        svg.select("g.crosshair.ohlc").call(ohlcCrosshair).call(zoom);

        zoomable = x.zoomable();
        zoomable.domain([indicatorPreRoll, parsedData.length]); // Zoom in a little to hide indicator preroll

        // Associate the zoom with the scale after a domain has been applied
        zoom.x(zoomable).y(y);
        zoomPercent.y(yPercent);

        self.draw();
    };

    this.draw = function () {
        zoomPercent.translate(zoom.translate());
        zoomPercent.scale(zoom.scale());

        // Bar bottom X axis
        svg.select("g.x.axis").call(xAxis);
        // Price main Candle
        svg.select("g.ohlc .axis").call(yAxis);
        //
        svg.select("g.volume.axis").call(volumeAxis);
        svg.select("g.percent.axis").call(percentAxis);

        // We know the data does not change, a simple refresh that does not perform data joins will suffice.
        svg.select("g.candlestick").call(candlestick.refresh);
        svg.select("g.close.annotation").call(closeAnnotation.refresh);
        svg.select("g.volume").call(volume.refresh);
        svg.select("g.crosshair.ohlc").call(ohlcCrosshair.refresh);

        if (self.drawMACD) {
            svg.select("g.macd .indicator-plot").call(macd.refresh);
            svg.select("g.macd .axis.right").call(macdAxis);
            svg.select("g.macd .axis.left").call(macdAxisLeft);
            svg.select("g.crosshair.macd").call(macdCrosshair.refresh);
        }
        if (self.drawRSI) {
            svg.select("g.rsi .indicator-plot").call(rsi.refresh);
            svg.select("g.rsi .axis.right").call(rsiAxis);
            svg.select("g.rsi .axis.left").call(rsiAxisLeft);
            svg.select("g.crosshair.rsi").call(rsiCrosshair.refresh);
        }
        if (self.drawSma0) {
            svg.select("g .sma.ma-0").call(sma0.refresh);
        }
        if (self.drawSma1) {
            svg.select("g .sma.ma-1").call(sma1.refresh);
        }
        if (self.drawEma2) {
            svg.select("g .ema.ma-2").call(ema2.refresh);
        }

        vSupstances.refresh();
        vLine.refresh();
    };

    this.parseDate = function(d){
        return parseDate(d);
    };

    this.reset = function () {
        self.svg.remove();
        self.setup();
        self.preDraw();
        return self;
    };

    this.setPercentTicks = function (number) {
        percentAxis.ticks(number);
        self.draw();
        return self;
    };

    this.setMACD = function (s, percent) {
        self.drawMACD = s;
        if (s && percent) {
            self.indicatorDimensions.macd.percent = percent;
        }
        self.reset();
        return self;
    };

    this.setRSI = function (s, percent) {
        self.drawRSI = s;
        if (s && percent) {
            self.indicatorDimensions.rsi.percent = percent;
        }
        self.reset();
        return self;
    };

    this.setSma0 = function (s) {
        if (self.drawSma0 != s) {
            self.drawSma0 = s;
            self.reset();
        }
        return self;
    };

    this.setSma1 = function (s) {
        if (self.drawSma1 != s) {
            self.drawSma1 = s;
            self.reset();
        }
        return self;
    };

    this.setEma2 = function (s) {
        if (self.drawEma2 != s) {
            self.drawEma2 = s;
            self.reset();
        }
        return self;
    };

    this.addSupstance = function (value) {
        self.supstances.push({
            value: value
        });
        vSupstances();
        return self;
    };

    this.setMainDraw = function (type) {
        if (type && type != self.mainDraw) {
            self.mainDraw = type;
            self.reset();
        }
        return self;
    };

    this.setSymbol = function (s) {
        self._symbol = s;
        self.svg.select(".symbol").text(s);
        return self;
    };

    this.setVLine = function(x){
        self.vline = x;
        vLine();
    };

    this.setZoom = function (bool) {
        self.canZoom = bool;
    };

    this.setup();

    if (data) {
        this.updateData(data);
    }

}

// --------------------------------------------------------------------------------


// EventEmmiter Part, to use it without node

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

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
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

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

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

StockG.prototype = new EventEmitter();

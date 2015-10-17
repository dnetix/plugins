function StockG(container, symbolName, data, options){

    var self = this;
    this.data = data;
    this.container = d3.select(container);
    this._symbol = symbolName;

    this.totalWidth = parseInt(this.container.node().getBoundingClientRect().width);
    this.totalHeight = parseInt(this.container.node().getBoundingClientRect().height);

    this.opt = function(key, def){
        if(options && options[key]){
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

    this.indicatorDimensions = {
        macd: {
            percent: self.opt("macdp", 25)
        },
        rsi: {
            percent: self.opt("rsip", 25)
        },
        padding: self.opt("padding", 10)
    };

    this.canvasWidth = function(){
        return self.totalWidth - self.margins.left - self.margins.right;
    };

    this.canvasHeight = function(){
        return self.totalHeight - self.margins.top - self.margins.bottom;
    };

    this.symbol = function(){
        return self._symbol;
    };

    this.ohlcHeight = function(){
        var height = self.canvasHeight();
        if(self.drawMACD){
            height -= self.indicatorHeight("macd") + self.indicatorDimensions.padding;
        }
        if(self.drawRSI){
            height -= self.indicatorHeight("rsi") + self.indicatorDimensions.padding;
        }
        return parseInt(height);
    };

    // Returns the y position for the indicator given
    this.indicatorTop = function(indicatorName){
        var position = self.ohlcHeight() + self.indicatorDimensions.padding;
        if(indicatorName == "rsi" && self.drawMACD){
            position += self.indicatorHeight("macd") + self.indicatorDimensions.padding;
        }
        return parseInt(position);
    };

    this.indicatorHeight = function(indicatorName){
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

    var indicatorSelection;

    this.setup = function(){
        // Create the new SVG canvas
        self.svg = d3.select(container).append("svg")
            .attr("width", self.totalWidth)
            .attr("height", self.totalHeight);

        // Creation of elements base
        //parseDate = d3.time.format("%d-%b-%y").parse;
        parseDate = function(mil){
            return new Date(mil);
        };

        zoom = d3.behavior.zoom()
            .scaleExtent([1, 20])
            .on("zoom", function(){
                self.draw();
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
        if(self.mainDraw == "line") {
            candlestick = techan.plot.close()
                .xScale(x)
                .yScale(y);
        }else{
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
            .format(d3.time.format('%Y-%m-%d'))
            .width(65)
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

        if(self.drawMACD){
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

        if(self.drawRSI){
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
            .attr("id", function(d, i) { return "indicatorClip-" + i; })
            .append("rect")
            .attr("x", 0)
            .attr("y", function(d) { return self.indicatorTop(d); })
            .attr("width", self.canvasWidth())
            .attr("height", function(d) { return self.indicatorHeight(d); });

        svg = self.svg.append("g")
            .attr("transform", "translate(" + self.margins.left + "," + self.margins.top + ")");

        svg.append('text')
            .attr("class", "symbol")
            .attr("x", 20)
            .text(self.symbol());

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + self.canvasHeight() + ")");

        svg.append("g")
            .attr("class", "trendlines analysis")
            .attr("clip-path", "url(#ohlcClip)");
        svg.append("g")
            .attr("class", "supstances analysis")
            .attr("clip-path", "url(#ohlcClip)");

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
            .attr("class", function(d) { return d + " indicator"; });

        indicatorSelection.append("g")
            .attr("class", "axis right")
            .attr("transform", "translate(" + x(1) + ",0)");

        indicatorSelection.append("g")
            .attr("class", "axis left")
            .attr("transform", "translate(" + x(0) + ",0)");

        indicatorSelection.append("g")
            .attr("class", "indicator-plot")
            .attr("clip-path", function(d, i) { return "url(#indicatorClip-" + i + ")"; });

        // Crosshairs last to allow display even over candlesticks

        svg.append('g')
            .attr("class", "crosshair ohlc");

        svg.append('g')
            .attr("class", "crosshair macd");

        svg.append('g')
            .attr("class", "crosshair rsi");
    };
    var accessor;
    var parsedData;
    var macdData;
    var rsiData;
    var indicatorPreRoll = 33;

    var zoomable;

    this.setData = function(data) {
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

    this.updateData = function(data){
        self.setData(data);
        self.preDraw();
        return self;
    };

    this.changeData = function(data){
        self.setData(data);
        self.reset();
        return self;
    };

    this.preDraw = function(){
        x.domain(techan.scale.plot.time(parsedData).domain());
        y.domain(techan.scale.plot.ohlc(parsedData.slice(indicatorPreRoll)).domain());

        yPercent.domain(techan.scale.plot.percent(y, accessor(parsedData[indicatorPreRoll])).domain());
        yVolume.domain(techan.scale.plot.volume(parsedData).domain());

        svg.select("g.candlestick").datum(parsedData).call(candlestick);
        svg.select("g.close.annotation").datum([parsedData[parsedData.length-1]]).call(closeAnnotation);

        svg.select("g.volume").datum(parsedData).call(volume);

        if(self.drawMACD){
            macdData = techan.indicator.macd()(parsedData);
            macdScale.domain(techan.scale.plot.macd(macdData).domain());
            svg.select("g.macd .indicator-plot").datum(macdData).call(macd);
            svg.select("g.crosshair.macd").call(macdCrosshair).call(zoom);
        }
        if(self.drawRSI){
            rsiData = techan.indicator.rsi()(parsedData);
            rsiScale.domain(techan.scale.plot.rsi(rsiData).domain());
            svg.select("g.rsi .indicator-plot").datum(rsiData).call(rsi);
            svg.select("g.crosshair.rsi").call(rsiCrosshair).call(zoom);
        }

        svg.select("g.crosshair.ohlc").call(ohlcCrosshair).call(zoom);

        zoomable = x.zoomable();
        zoomable.domain([indicatorPreRoll, parsedData.length]); // Zoom in a little to hide indicator preroll

        // Associate the zoom with the scale after a domain has been applied
        zoom.x(zoomable).y(y);
        zoomPercent.y(yPercent);

        self.draw();
    };

    this.draw = function(){
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
        //svg.select("g.candlestick").call(candlestick.refresh);
        svg.select("g.close.annotation").call(closeAnnotation.refresh);
        svg.select("g.volume").call(volume.refresh);
        svg.select("g.crosshair.ohlc").call(ohlcCrosshair.refresh);

        if(self.drawMACD){
            svg.select("g.macd .indicator-plot").call(macd.refresh);
            svg.select("g.macd .axis.right").call(macdAxis);
            svg.select("g.macd .axis.left").call(macdAxisLeft);
            svg.select("g.crosshair.macd").call(macdCrosshair.refresh);
        }
        if(self.drawRSI){
            svg.select("g.rsi .indicator-plot").call(rsi.refresh);
            svg.select("g.rsi .axis.right").call(rsiAxis);
            svg.select("g.rsi .axis.left").call(rsiAxisLeft);
            svg.select("g.crosshair.rsi").call(rsiCrosshair.refresh);
        }
    };

    this.reset = function(){
        self.svg.remove();
        self.setup();
        self.preDraw();
        return self;
    };

    this.setPercentTicks = function(number){
        percentAxis.ticks(number);
        self.draw();
        return self;
    };

    this.setMACD = function(s, percent){
        self.drawMACD = s;
        if(s && percent){
            self.indicatorDimensions.macd.percent = percent;
        }
        self.reset();
        return self;
    };

    this.setRSI = function(s, percent){
        self.drawRSI = s;
        if(s && percent){
            self.indicatorDimensions.rsi.percent = percent;
        }
        self.reset();
        return self;
    };

    this.setMainDraw = function(type){
        if(type && type != self.mainDraw){
            self.mainDraw = type;
            self.reset();
        }
        return self;
    };

    this.setSymbol = function(s){
        self._symbol = s;
        self.svg.select(".symbol").text(s);
        return self;
    };

    this.setup();

    if(data) {
        this.updateData(data);
    }

}
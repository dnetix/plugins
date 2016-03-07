'use strict';

var events = require('events');

function Core(selector, data, options) {
    var self = this;
    var settings = require('./settings')(options);

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

        d['canvasWidth'] = d.width - (d.margins.left + d.margins.right);
        d['canvasHeight'] = d.height - (d.margins.top + d.margins.bottom);

        d['macd'] = settings.macd ? ((d.canvasHeight * (settings.macd_height / 100)) + d.padding) : 0;
        d['rsi'] = settings.rsi ? ((d.canvasHeight * (settings.rsi_height / 100)) + d.padding) : 0;

        d['macdHeight'] = (d.canvasHeight * (settings.macd_height / 100));
        d['rsiHeight'] = (d.canvasHeight * (settings.rsi_height / 100));

        d['chartHeight'] = d.canvasHeight - (d.macd + d.rsi);

        d['ymacd'] = d.chartHeight + d.padding;
        d['yrsi'] = d.chartHeight + d.padding + d.macd;

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

    function dataParser(d){
        return {
            date: dateParser(d.Date),
            open: +d.Open,
            high: +d.High,
            low: +d.Low,
            close: +d.Close,
            volume: +d.Volume
        }
    }

    function refresh(){
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

        svg.select('g.analysis .supstances').datum(draws.supstances).call(supstance).call(supstance.drag);
        svg.select('g.analysis .trendlines').datum(draws.trendlines).call(trendline).call(trendline.drag);

        svg.select('g.analysis .trades').datum(draws.trades).call(tradearrow);
    }

    function draw(){
        x.domain(techan.scale.plot.time(parsedData).domain());
        y.domain(techan.scale.plot.ohlc(parsedData.slice(preroll)).domain());
        yPercent.domain(techan.scale.plot.percent(y, accessor(parsedData[preroll])).domain());
        yVolume.domain(techan.scale.plot.volume(parsedData).domain());

        svg.select('g.ohlc').datum(parsedData).call(charter);
        svg.select('g.last-close.annotation').datum([parsedData[parsedData.length - 1]]).call(closeAnnotation);
        svg.select('g.volume').datum(parsedData).call(volume);

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
        svg.select('g.crosshair.chart').call(chartCrosshair).call(zoom);

        zoomable = x.zoomable();
        zoomable.domain([preroll, parsedData.length]);
        zoom.x(zoomable).y(y);
        zoomPercent.y(yPercent);

        refresh();
    }

    function setup() {
        if(!initiated){
            container.select('div').remove();
            initiated = true;
        }

        dimensions = calculateDimensions();
        // Creates the SVG to the full dimensions
        self.svg = container.append('svg').attr('width', dimensions.width).attr('height', dimensions.height);
        // Obtains the dateParser sended
        dateParser = settings.parser;

        // Zoomers and the action when zoom its applied
        zoom = d3.behavior.zoom()
            .scaleExtent([1, 20])
            .size([dimensions.canvasWidth, dimensions.canvasHeight])
            .on('zoom', function(){
                if(settings.zoom){
                    refresh();
                    return true;
                }
            });
        zoomPercent = d3.behavior.zoom();

        // Create the scales
        x = techan.scale.financetime()
            .range([0, dimensions.canvasWidth]);
        y = d3.scale.linear()
            .range([dimensions.chartHeight, 0]);
        yPercent = y.copy();
        yVolume = d3.scale.linear()
            .range([y(0), y(0.2)]);
        // Create the drawer of the graph
        charter = (settings.draw == 'ohlc') ? techan.plot.candlestick() : techan.plot.close();
        charter.xScale(x).yScale(y);
        volume = techan.plot.volume()
            .accessor(charter.accessor())
            .xScale(x)
            .yScale(yVolume);
        // Axis
        xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom')
            .tickFormat(d3.time.format(settings.nFormat));
        yAxis = d3.svg.axis()
            .scale(y)
            .orient('right');
        percentAxis = d3.svg.axis()
            .scale(yPercent)
            .orient('left')
            .tickFormat(d3.format('+.1%'));
        volumeAxis = d3.svg.axis()
            .scale(yVolume)
            .orient('right')
            .ticks(3)
            .tickFormat(d3.format(',.3s'));
        // Annotations
        timeAnnotation = techan.plot.axisannotation()
            .axis(xAxis)
            .format(d3.time.format(settings.nFormat))
            .width(70)
            .translate([0, dimensions.canvasHeight]);
        chartAnnotation = techan.plot.axisannotation()
            .axis(yAxis)
            .format(d3.format(',.2fs'))
            .translate([x(1), 0]);
        closeAnnotation = techan.plot.axisannotation()
            .axis(yAxis)
            .accessor(charter.accessor())
            .format(d3.format(',.2fs'))
            .translate([x(1), 0]);
        percentAnnotation = techan.plot.axisannotation()
            .axis(percentAxis);
        volumeAnnotation = techan.plot.axisannotation()
            .axis(volumeAxis)
            .width(35);
        // Crosshair
        chartCrosshair = techan.plot.crosshair()
            .xScale(timeAnnotation.axis().scale())
            .yScale(chartAnnotation.axis().scale())
            .xAnnotation(timeAnnotation)
            .yAnnotation([chartAnnotation, percentAnnotation, volumeAnnotation])
            .verticalWireRange([0, dimensions.canvasHeight]);

        // Analysis variables instanciation
        supstance = techan.plot.supstance()
            .xScale(x)
            .yScale(y);
        trendline = techan.plot.trendline()
            .xScale(x)
            .yScale(y);
        tradearrow = require('./tradearrow')()
            .xScale(x)
            .yScale(y);

        // Clippers or masks to prevent the graphics overflow
        clips = self.svg.append('defs');
        clips.append('clipPath')
            .attr('id', 'chartClip')
            .append('rect')
                .attr('x', 0).attr('y', 0).attr('width', dimensions.canvasWidth).attr('height', dimensions.chartHeight);
        clips.append('clipPath')
            .attr('id', 'fullClip')
            .append('rect')
            .attr('x', 0 - dimensions.margins.left).attr('y', 0).attr('width', dimensions.width).attr('height', dimensions.chartHeight);

        // Now create the wrapper group, that will be the container of all the other groups
        svg = self.svg.append('g')
            .attr('transform', 'translate(' + dimensions.margins.left + ',' + dimensions.margins.top + ')');

        // Create the text field that will contain the symbol name
        svg.append('text').attr('class', 'name').attr('x', 20).attr('y', dimensions.margins.top + 10).text(settings.symbol);

        svg.append('g').attr('class', 'x axis')
            .attr('transform', 'translate(0,' + dimensions.canvasHeight + ')');

        chartSelection = svg.append('g').attr('class', 'chart');

        chartSelection.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(' + x(1) + ',0)')
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -12)
            .attr('dy', '.71em');

        chartSelection.append('g')
            .attr('class', 'volume')
            .attr('clip-path', 'url(#chartClip)');
        chartSelection.append('g')
            .attr('class', 'ohlc')
            .attr('clip-path', 'url(#chartClip)');
        chartSelection.append('g')
            .attr('class', 'percent axis');
        chartSelection.append('g')
            .attr('class', 'volume axis');
        chartSelection.append('g')
            .attr('class', 'last-close annotation');

        // Conditionals
        if(settings.macd){
            macdScale = d3.scale.linear()
                .range([(dimensions.ymacd + dimensions.macdHeight), dimensions.ymacd]);
            macd = techan.plot.macd()
                .xScale(x)
                .yScale(macdScale);
            macdAxis = d3.svg.axis()
                .scale(macdScale)
                .ticks(3)
                .orient('right');
            macdAxisLeft = d3.svg.axis()
                .scale(macdScale)
                .ticks(3)
                .orient('left');
            macdAnnotation = techan.plot.axisannotation()
                .axis(macdAxis)
                .format(d3.format(',.2fs'))
                .translate([x(1), x(0)]);
            macdAnnotationLeft = techan.plot.axisannotation()
                .axis(macdAxisLeft)
                .format(d3.format(',.2fs'));
            macdCrosshair = techan.plot.crosshair()
                .xScale(timeAnnotation.axis().scale())
                .yScale(macdAnnotation.axis().scale())
                .xAnnotation(timeAnnotation)
                .yAnnotation([macdAnnotation, macdAnnotationLeft])
                .verticalWireRange([0, dimensions.canvasHeight]);

            clips.append('clipPath')
                .attr('id', 'macdClip')
                .append('rect')
                .attr('x', 0).attr('y', dimensions.ymacd).attr('width', dimensions.canvasWidth).attr('height', dimensions.macd);

            indicatorSelection = svg.append('g').attr('class', 'indicator macd');
            indicatorSelection.append('g')
                .attr('class', 'axis right')
                .attr('transform', 'translate(' + x(1) + ',0)');
            indicatorSelection.append('g')
                .attr('class', 'axis left')
                .attr('transform', 'translate(' + x(0) + ',0)');
            indicatorSelection.append('g')
                .attr('class', 'indicator-plot')
                .attr('clip-path', 'url(#macdClip)');

            svg.append('g')
                .attr('class', 'crosshair macd');
        }

        if(settings.rsi){
            rsiScale = d3.scale.linear()
                .range([dimensions.yrsi + dimensions.rsiHeight, dimensions.yrsi]);
            rsi = techan.plot.rsi()
                .xScale(x)
                .yScale(rsiScale);
            rsiAxis = d3.svg.axis()
                .scale(rsiScale)
                .ticks(3)
                .orient('right');
            rsiAxisLeft = d3.svg.axis()
                .scale(rsiScale)
                .ticks(3)
                .orient('left');
            rsiAnnotation = techan.plot.axisannotation()
                .axis(rsiAxis)
                .format(d3.format(',.2fs'))
                .translate([x(1), x(0)]);
            rsiAnnotationLeft = techan.plot.axisannotation()
                .axis(rsiAxisLeft)
                .format(d3.format(',.2fs'));
            rsiCrosshair = techan.plot.crosshair()
                .xScale(timeAnnotation.axis().scale())
                .yScale(rsiAnnotation.axis().scale())
                .xAnnotation(timeAnnotation)
                .yAnnotation([rsiAnnotation, rsiAnnotationLeft])
                .verticalWireRange([0, dimensions.canvasHeight]);

            clips.append('clipPath')
                .attr('id', 'rsiClip')
                .append('rect')
                .attr('x', 0).attr('y', dimensions.yrsi).attr('width', dimensions.canvasWidth).attr('height', dimensions.rsi);

            indicatorSelection = svg.append('g').attr('class', 'indicator rsi');
            indicatorSelection.append('g')
                .attr('class', 'axis right')
                .attr('transform', 'translate(' + x(1) + ',0)');
            indicatorSelection.append('g')
                .attr('class', 'axis left')
                .attr('transform', 'translate(' + x(0) + ',0)');
            indicatorSelection.append('g')
                .attr('class', 'indicator-plot')
                .attr('clip-path', 'url(#rsiClip)');

            svg.append('g')
                .attr('class', 'crosshair rsi');
        }

        if (settings.sma0) {
            sma0 = techan.plot.sma()
                .xScale(x)
                .yScale(y);

            chartSelection.append("g")
                .attr("class", "indicator sma ma-0")
                .attr("clip-path", "url(#chartClip)");
        }

        if (settings.sma1) {
            sma1 = techan.plot.sma()
                .xScale(x)
                .yScale(y);

            chartSelection.append("g")
                .attr("class", "indicator sma ma-1")
                .attr("clip-path", "url(#chartClip)");
        }

        if (settings.ema2) {
            ema2 = techan.plot.ema()
                .xScale(x)
                .yScale(y);

            chartSelection.append("g")
                .attr("class", "indicator ema ma-2")
                .attr("clip-path", "url(#chartClip)");
        }

        // Crosshairs group at the bottom-ish to be displayed even on the indicators
        svg.append('g')
            .attr('class', 'crosshair chart')
            .on('click', function(){
                var point = d3.mouse(this);
                var xClicked = x.invert(point[0]);

                var element = false;
                parsedData.find(function(e, i){
                    if(e.date == xClicked){
                        e['index'] = i;
                        element = e;
                        return true;
                    }
                });
                self.emit('point', point, element, d3.event);
            });

        analysisSelection = svg.append('g')
            .attr('class', 'analysis');

        analysisSelection.append('g')
            .attr('class', 'supstances')
            .attr('clip-path', 'url(#fullClip)');
        analysisSelection.append('g')
            .attr('class', 'trendlines')
            .attr('clip-path', 'url(#chartClip)');
        analysisSelection.append('g')
            .attr('class', 'trades')
            .attr('clip-path', 'url(#chartClip)');
    }

    function reset(){
        self.svg.remove();
        setup();
        draw();
        self.emit('update');
    }

    function parseData(data){
        accessor = charter.accessor();
        parsedData = data.map(dataParser).sort(function(a, b){
            return a.date - b.date;
        });
        return self;
    }

    this.setName = function(name){
        settings.symbol = name;
        svg.select("text.name").text(name);
    };

    this.xScale = function(){
        return x;
    };

    this.yScale = function(){
        return y;
    };

    this.draws = function(){
        return draws;
    };

    this.addDraw = function(type, d){
        d['id'] = draws.id;
        draws.id++;
        draws[type].push(d);
        refresh();
        return d.id;
    };
    this.clearDraws = function(){
        draws = {
            id: 0,
            supstances: [],
            trendlines: [],
            trades: []
        };
        refresh();
    };

    this.macd = function(a, percent){
        if(arguments.length == 0){
            return settings.macd;
        }
        settings.macd = a;
        if(percent) { settings.macd_height = percent; }
        reset();
    };

    this.rsi = function(a, percent){
        if(arguments.length == 0){
            return settings.rsi;
        }
        settings.rsi = a;
        if(percent) { settings.rsi_height = percent; }
        reset();
    };

    this.sma0 = function(a, period){
        if(arguments.length == 0){
            return settings.sma0;
        }
        settings.sma0 = a;
        if(period) { settings.sma0_period = period; }
        reset();
    };
    this.sma1 = function(a, period){
        if(arguments.length == 0){
            return settings.sma1;
        }
        settings.sma1 = a;
        if(period) { settings.sma1_period = period; }
        reset();
    };
    this.ema2 = function(a, period){
        if(arguments.length == 0){
            return settings.ema2;
        }
        settings.ema2 = a;
        if(period) { settings.ema2_period = period; }
        reset();
    };

    this.setData = function(d){
        if(!initiated){ setup(); }
        parseData(d);
        reset();
    };
    this.addTick = function(tick, shift){
        parsedData.push(dataParser(tick));
        if(shift){
            parsedData.shift();
        }
        if(!settings.pause) {
            reset();
        }
    };

    this.zoom = function(a){
        if(arguments.length == 0){
            return settings.zoom;
        }
        settings.zoom = a;
    };
    this.pause = function(a){
        if(arguments.length == 0){
            return settings.pause;
        }
        settings.pause = a;
        if(!a){ reset() }
    };

    this.reset = function(){
        reset();
    };

    // Resets the dimensions if the window resizes
    window.onresize = function(){
        reset();
    };

    function firstRun(){
        container.html("");

        if(data){
            initiated = true;
            setup();
            parseData(data);
            draw();
        }else{
            container.append('div').attr('class', 'no-data').append('div').attr('class', 'no-data-content').append('p')
                .text(settings.lang.no_data);
        }
    }

    firstRun();
}

Core.prototype = new events.EventEmitter;

module.exports = Core;
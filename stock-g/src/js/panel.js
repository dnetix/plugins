function Panel(selector, core, options){
    var settings = require('./settings')(options);
    var defaultZoom = core.zoom();
    var x = core.xScale(), y = core.yScale();

    var container = d3.select(selector);
    var currentDraw, _p1, _p2;
    var buttons, buttonsOption, buttonsControl;

    function createSupstance(value){
        return {
            value: value
        };
    }
    function createTrendline(p1, p2){
        return {
            start: p1,
            end: p2
        };
    }

    function cleanActions(){
        buttons.selectAll('li').classed('active', false);
        currentDraw = null;
        _p1 = null;
        _p2 = null;

        core.zoom(defaultZoom);
    }

    core.on('update', function(){
        // Re-obtains the scales given that has been reseted
        x = core.xScale();
        y = core.yScale();
    });

    core.on('point', function(point, element, event){
        if(currentDraw){
            if(currentDraw == 'supstance'){
                var value = y.invert(point[1]);
                core.draws('supstances', createSupstance(value));
                cleanActions();
            }else if(currentDraw == 'trendline'){
                var a = point[0] - 50;
                var b = point[0] + 50;

                _p1 = {
                    date: x.invert(a < 0 ? 0 : a),
                    value: y.invert(point[1])
                };

                _p2 = {
                    date: x.invert(b > core.dimensions().canvasWidth ? core.dimensions().canvasWidth : b),
                    value: y.invert(point[1])
                };
                core.draws('trendlines', createTrendline(_p1, _p2));
                cleanActions();
            }else if(currentDraw == 'trade'){
                var type = 'buy';

                if(event.ctrlKey) {
                    type = 'sell';
                }

                core.draws('trades', {
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

    function buttonListener(){
        var element = d3.select(this);
        var elementClass = element.attr('class');
        if(elementClass == 'reset'){
            core.reset();
        }else if(elementClass == 'clear') {
            core.clearDraws();
            cleanActions();
        } else {
            if(element.classed('active')){
                cleanActions();
            }else {
                // Disables the movement of the chart
                core.zoom(false);
                // Removes all the active class
                buttons.selectAll('li').classed('active', false);
                element.classed('active', true);

                currentDraw = elementClass;
                _p1 = null;
                _p2 = null;
            }
        }
    }

    function buttonOptionListener(){
        var element = d3.select(this);
        var actual;

        if(element.classed('macd')){
            actual = core.macd();
            if(actual){
                element.classed('active', false);
            }else{
                element.classed('active', true);
            }
            core.macd(!actual);
        } else if(element.classed('rsi')){
            actual = core.rsi();
            if(actual){
                element.classed('active', false);
            }else{
                element.classed('active', true);
            }
            core.rsi(!actual);
        } else if(element.classed('sma0')){
            actual = core.sma0();
            if(actual){
                element.classed('active', false);
            }else{
                element.classed('active', true);
            }
            core.sma0(!actual);
        } else if(element.classed('sma1')){
            actual = core.sma1();
            if(actual){
                element.classed('active', false);
            }else{
                element.classed('active', true);
            }
            core.sma1(!actual);
        } else if(element.classed('ema2')){
            actual = core.ema2();
            if(actual){
                element.classed('active', false);
            }else{
                element.classed('active', true);
            }
            core.ema2(!actual);
        } else if(element.classed('pause')){
            actual = core.pause();
            if(actual){
                element.classed('active', false);
            }else{
                element.classed('active', true);
            }
            core.pause(!actual);
        } else if(element.classed('zoom')){
            actual = core.zoom();
            if(actual){
                element.classed('active', false);
            }else{
                element.classed('active', true);
            }
            core.zoom(!actual);
        }
    }

    function setup(){
        container.html("");

        // Static buttons
        buttonsControl = container.append('g')
            .attr('class', 'buttons control')
            .append('ul');

        buttonsControl.append('li')
            .attr('class', 'pause')
            .attr('data-hint', settings.lang.hint_pause)
            .on('click', buttonOptionListener);
        buttonsControl.append('li')
            .attr('class', 'zoom' + (core.zoom() ? ' active' : ''))
            .attr('data-hint', settings.lang.hint_zoom)
            .on('click', buttonOptionListener);

        buttons = container.append("g")
            .attr("class", "buttons draw")
            .append('ul');

        buttons.append('li')
            .attr('class', 'supstance')
            .attr('data-hint', settings.lang.hint_supstance)
            .on('click', buttonListener);
        buttons.append('li')
            .attr('class', 'trendline')
            .attr('data-hint', settings.lang.hint_trendline)
            .on('click', buttonListener);
        buttons.append('li')
            .attr('class', 'trade')
            .attr('data-hint', settings.lang.hint_trade)
            .on('click', buttonListener);
        buttons.append('li')
            .attr('class', 'reset')
            .attr('data-hint', settings.lang.hint_reset)
            .on('click', buttonListener);
        buttons.append('li')
            .attr('class', 'clear')
            .attr('data-hint', settings.lang.hint_clear)
            .on('click', buttonListener);

        buttonsOption = container.append('g')
            .attr('class', 'buttons options')
            .append('ul');

        buttonsOption.append('li')
            .attr('class', 'macd' + (core.macd() ? ' active' : ''))
            .attr('data-hint', settings.lang.hint_macd)
            .on('click', buttonOptionListener);
        buttonsOption.append('li')
            .attr('class', 'rsi' + (core.rsi() ? ' active' : ''))
            .attr('data-hint', settings.lang.hint_rsi)
            .on('click', buttonOptionListener);
        buttonsOption.append('li')
            .attr('class', 'sma0' + (core.sma0() ? ' active' : ''))
            .attr('data-hint', settings.lang.hint_sma0)
            .on('click', buttonOptionListener);
        buttonsOption.append('li')
            .attr('class', 'sma1' + (core.sma1() ? ' active' : ''))
            .attr('data-hint', settings.lang.hint_sma1)
            .on('click', buttonOptionListener);
        buttonsOption.append('li')
            .attr('class', 'ema2' + (core.ema2() ? ' active' : ''))
            .attr('data-hint', settings.lang.hint_ema2)
            .on('click', buttonOptionListener);
    }

    setup();
}

module.exports = Panel;
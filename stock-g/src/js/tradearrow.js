// Container function
module.exports = (function(){
    var _x;
    var _y;
    var _data;

    function pathDirection(a){
        if(a.type == 'sell'){
            return "M 0 0 l -6 -7.5 l 4 0 l 0 -7.5 l 4 0 l 0 7.5 l 4 0 z";
        }
        return "M 0 0 l -6 7.5 l 4 0 l 0 7.5 l 4 0 l 0 -7.5 l 4 0 z";
    }

    function translation(a){
        var price = a.low;
        var mod = 5;
        if(a.type == 'sell'){ price = a.high; mod = -5; }
        return 'translate(' + _x(a.date) + ',' + (_y(price) + mod) + ')';
    }

    function tradearrow(g){
        _data = g.data()[0];

        var group = g.selectAll('g').data(_data);

        group.attr('transform', translation);

        group.enter()
            .append('g')
            .attr('class', function(a){
                return 'tradearrow ' + a.type;
            })
            .attr('transform', translation)
            .on('click', function(a){
                console.log(this);
                console.log("TEST");
            })
            .append('path')
            .attr('d', pathDirection);

        group.exit()
            .remove();
    }

    tradearrow.refresh = function(g){
    };

    tradearrow.xScale = function(scale){
        _x = scale;
        return this;
    };

    tradearrow.yScale = function(scale){
        _y = scale;
        return this;
    };

    return tradearrow;
});
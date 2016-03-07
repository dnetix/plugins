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
        var price = a.price, mod = 0;
        if(a.type && a.low && a.high){
            if(a.type == 'sell'){
                price = a.high; mod = -5;
            }else{
                price = a.low; mod = 5;
            }
        }
        return 'translate(' + _x(a.date) + ',' + (_y(price) + mod) + ')';
    }

    function tradearrow(g){
        _data = g.data()[0];

        var group = g.selectAll('g').data(_data);

        // If exists, then translate it to the point
        group.attr('transform', translation);
        // If doesnt exist well, make it
        group.enter()
            .append('g')
            .attr('class', function(a){
                return 'tradearrow ' + a.type;
            })
            .attr('id', function(a){
                return 'arrow_' + a.id;
            })
            .attr('transform', translation)
            // TODO Handle here or in the g tag the arrow mouse events
            .append('path')
            .attr('d', pathDirection);
        // If not needed anymore, remove it
        group.exit()
            .remove();
    }

    tradearrow.refresh = function(g){
        // TODO Refresh the data, but actually its just like making it
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
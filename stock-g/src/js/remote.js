/**
 * Adds some sort of interface to handle external operations over the stock-g chart
 * @param core
 * @param options
 * @constructor
 */
function Remote(core, options){

    // Creates one arrow at one point, if there is some then it removes them
    this.addSingleArrow = function(element, type){
        // The only things needed are the x (date) point, and the price to point out, but if you can send all the element, better
        core.clearDraws('trades');
        if(!element.price){
            element['price'] = element.low;
        }
        if(type){
            element['type'] = type;
        }
        core.draws('trades', element);
    };

    // This one its used when you want to display in the chart the trades maded, trades need to have a date, type and price
    this.addTrades = function(trades, clear){
        if(clear){ core.clearDraws('trades'); }
        trades.filter(function(a){
            if(a.date && a.type && a.price){
                core.draws('trades', a);
                return true;
            }
            return false;
        });
    };

}

module.exports = Remote;

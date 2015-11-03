function Ticker(container, options){
    var self = this;
    this.timer;
    this.index = 0;
    this.ticks = 0;
    this.container = $(container);
    this.tickerContainer = $(container + " .ticks-container");
    this.tickerHolder = $(container + " .ticks");
    this.canTick = false;

    this.opt = function(key, def){
        if(options && options[key]){
            return options[key];
        }
        return def || null;
    };

    this.speed = self.opt("speed", 5000);

    this.ready = function(){
        self.ticks = self.tickerHolder.find("li").length;
        if(self.ticks > 1){
            self.canTick = true;
        }
    };

    this.start = function(){
        self.ready();
        self.container.on("mouseover", function(){
            self.canTick = false;
        });
        self.container.on("mouseout", function(){
            self.canTick = true;
        });
        self.timer = setInterval(function(){
            if(self.canTick){
                self.next();
            }
        }, self.speed);
        self.container.find(".caption").on("click", function(){
            self.next();
        });
    };

    this.prev = function(){
        self.index--;
        if(self.index < 0){
            self.index = self.ticks - 1;
        }
        self.goTo(self.index);
    };

    this.next = function(){
        self.index++;
        if(self.index >= self.ticks){
            self.index = 0;
        }
        self.goTo(self.index);
    };

    this.goTo = function(pos){
        var increment = -24;
        if(pos < self.ticks){
            self.index = pos;
        }
        var position = self.index * increment;
        self.tickerContainer.css("top", position + "px");
    };

    this.add = function(data){
        self.tickerHolder.prepend("<li>" + data + "</li>");
        self.ready();
        self.goTo(0);
    };

    this.start();
}

'use strict';

if('undefined' !== typeof window) {
}else{
    throw "Unsupported runtime environment: could not find d3 or techanjs";
}

module.exports = (function(){
    return {
        version: require('../build/version'),
        create: require('./stockg'),
        panel: require('./panel'),
        settings: require('./settings')
    }
})();

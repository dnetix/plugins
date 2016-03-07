module.exports = function(options){
    var settings = {
        zoom: true,
        pause: false,
        margins: {
            top: 20,
            right: 50,
            bottom: 30,
            left: 50
        },
        draw: 'ohlc',
        macd: false,
        macd_height: 25,
        rsi: false,
        rsi_height: 25,
        sma0: false,
        sma1: false,
        ema2: false,
        parser: function (d) {
            return new Date(d);
        },
        padding: 10,
        supstances: [],
        preroll: 2,
        nFormat: '%Y-%m-%d',
        symbol: '',
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

    for (var key in options){
        settings[key] = options[key];
    }
    return settings;
};
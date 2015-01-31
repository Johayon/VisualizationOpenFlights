// Variables globales 
var maxValue = 2000.0;
var minValue = 300.0;
var initialMin = 500;
var initialMax = 1500;

// Création du slider et connexion avec le barChart via l'évènement slide
var slider = d3.select('#slider');
slider.call(d3.slider().max(maxValue).min(minValue).axis(true).value([initialMin, initialMax]).on("slide", function(evt, value)
{
    var percent = ((parseFloat(value[0])-minValue) / (maxValue-minValue))*100;
    d3.select(".d3-slider-range").style("left", percent.toString() + "%")

    filterGraphDataByTotalOfRoutes(parseInt(value[0]), parseInt(value[1]));
}));
// nFlights
// - 0: chosen airport
// - 1: 1-flight airport
// - 2: 2-flight airport
// - 3: airport from country
// - 4: removed airport

d3.select(window).on("resize", throttle);

var flag_airport_from_nFlightDistance = false;
var flag_airport_from_country = false;
var flag_allow_chosing_airport = false;

var flag_removing_airports = false;
var flag_showing_airports = true;
var flag_impact_airports = false;

var list_removed_airport = [];
var airport_Count = [0, 0, 0];

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 9])
    .on("zoom", move);

var layer_airport = [];

var chosen_airport = null;
var chosen_country = null;
var list_airports = null;

var airport_MaxNFlights = 2;

var slider_CurrentDistance_Min = 0;
var slider_CurrentDistance_Max = 3000;
var slider_MinimumDistance = 0;
var slider_MaximumDistance = 25000;

var color_Country = ["#101010","#710000","#005709"];
// var airport_color = ["#FFFF00","#FF3000", "#00FFCD", "#FFFF00"];
var airport_color = ["#FFFF00","#FF5000", "#00FFCD", "#FFFF00", "#FF0000"];
var airport_centerSize = ["100%","10%","8%","10%", "15%"];
var airport_border_color = ["none", "none", "none", "none", "none"];
var airportR = [10, 21, 21, 21, 25];
var airportOverviewR = [10, 21, 21, 21, 25];
var airportDetailR = [1, 1, 0.7, 0.7, 0.7];
var airportOpacity = [0.5, 0.2, 0.1, 0.1, 0.2];
var airportOverviewOpacity = [0.5, 0.2, 0.1, 0.1, 0.2];
var airportDetailOpacity = [0.5, 0.7, 0.7, 0.7, 0.7];
var airportBorderOpacity = [0.01, 0.01, 0.01, 0.01, 0.01];

var width = document.getElementById('container_map').offsetWidth;
var height = width / 2;

var topo,projection,path,svg,g;
var infoColorMeaning;

var graticule = d3.geo.graticule();

var tooltip = d3.select("#container_map").append("div").attr("class", "tooltip hidden");
var slider;

setup(width,height);

d3.json("http://localhost:1337/WorldMap/data/world-topo-min.json", function(error, world) {

  var countries = topojson.feature(world, world.objects.countries).features;

  topo = countries;
  draw(topo);

});
// d3.select("body").append("div").append("p").attr("id", "info_log").text("charles_de_gaulle");
createSlider(20000);

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
function createSlider(maxval) {
  slider_MinimumDistance = 0;
  slider_MaximumDistance = maxval + 1;
  slider_CurrentDistance_Min = 0;
  slider_CurrentDistance_Max = maxval;

  slider = d3.slider()
              .min(slider_MinimumDistance)
              .max(slider_MaximumDistance)
              .axis(true)
              .value([slider_CurrentDistance_Min, slider_CurrentDistance_Max])
              .on("slide", function(evt, value) {

                slider_CurrentDistance_Min = value[0];
                slider_CurrentDistance_Max = value[1];
                if (list_airports == null) return;

                if (flag_airport_from_nFlightDistance) redraw_airports();
              });

  var container = d3.select("#slider");
  container.selectAll("*").remove();
  var temp = container.call(slider);
}
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
function activate_airport_in_country(d) {
  chosen_country = d;
  flag_airport_from_country = true;
  flag_airport_from_nFlightDistance = false;

  layer_airport[3].selectAll(".airport3").remove();
  layer_airport[3].attr("visibility", "visible");

  for (var i = 0; i < 3; ++i) {
    layer_airport[i].selectAll(".airport" + i).remove();
    layer_airport[i].attr("visibility", "hidden");
  }

  chosen_airport = null;
  draw_airports_from_country();
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
function activate_airport_from_distance(command, airportName) {
  console.log("activate airport " + airportName);

  flag_airport_from_country = false;
  flag_airport_from_nFlightDistance = true;

  if (command == "show") draw_colorMeaningShow(airportName, "1-flight airports", "2-flight airports");
  else draw_colorMeaningShow(airportName, "Unreachable airports", "Affected airports");

  layer_airport[3].selectAll(".airport3").remove();
  layer_airport[3].attr("visibility", "hidden");

  if (chosen_country != null)
    d3.selectAll($('#' + chosen_country.id)).style("fill", color_Country[0]);

  for (var i = 0; i < 3; ++i) {
    layer_airport[i].selectAll("*").remove();
    layer_airport[i].attr("visibility", "visible");
  }

  chosen_country = null;
  draw_airports_from_distance(command, normalizeName(airportName));
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
// draw countries

function draw_countries() {
  var country = g.selectAll(".country").data(topo);
  var allCountries = country.enter().insert("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("id", function(d,i) { return d.id; })
      .attr("title", function(d,i) { return d.properties.name; })
      // .style("fill", function(d, i) { return d.properties.color; }) 
      // .style("fill", "#1C1C1C")
      .style("fill", color_Country[0])
      // .style("fill", "#F5F5F5")
      .attr("stroke", "#999999")
      .attr("stroke-width", "0.3px");

  allCountries.attr("visibility", "visible");
  // allCountries.attr("visibility", function(d, i) { if (d.properties.name == "France") return "visible"; else return "hidden"});

  //offsets for tooltips
  var offsetL = document.getElementById('container_map').offsetLeft+20;
  var offsetT = document.getElementById('container_map').offsetTop+10;

  //tooltips
  country
    .on("mousemove", function(d,i) {
        var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
        tooltip.classed("hidden", false)
               .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
               .html(d.properties.name);

        if (chosen_country == null || d.id != chosen_country.id)
          d3.selectAll($('#' + d.id)).style("fill", color_Country[2]);
      })

    .on("mouseout",  function(d,i) {
        tooltip.classed("hidden", true);
        if (chosen_country == null || d.id != chosen_country.id) 
          d3.selectAll($('#' + d.id)).style("fill", color_Country[0]);
      })

    .on("dblclick", function(d,i) {
      console.log("Click COUNTRY: " + d.properties.name);
      if (chosen_country != null && d.properties.name == chosen_country.properties.name) return;
      if (chosen_country != null)
        d3.selectAll($('#' + chosen_country.id)).style("fill", color_Country[0]);

      d3.selectAll($('#' + d.id)).style("fill", color_Country[1]);
      activate_airport_in_country(d);
      draw_colorMeaningClickCountry(d.properties.name);
    });
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
// draw all airports

function draw_airports_all(color) {
  d3.csv("http://localhost:1337/data/airports.dat", function(err, airports) {
    airports.forEach(function(i) {
      draw_airport(i, color, layer_airport_all);
    });
  });
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
//draw all airports in the country

function draw_airports_from_country() {
  d3.csv("http://localhost:1337/tool_get_airports_from_country/" + normalizeName(chosen_country.properties.name) + "/" + getParameters(), function(err, airports) {
    list_airports = airports;
    chosen_airport = airports[0];
    airports.forEach(function(i) {
      draw_airport(i);
    });
  });
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
//draw all airports from an airport base on the distance (distance: number of flights)

function draw_airports_from_distance(command, airportName) {
  console.log("COMMAND = " + command);
  airport = typeof airport !== 'undefined' ? airport : "charles_de_gaulle";

  var url = "http://localhost:1337/";
  if (command == "show") url += "tool_get_airports_from_distance/" + airportName + "/2/" + getParameters();
  else url += "tool_get_airports_from_impact/" + airportName + "/" + getParameters();

  d3.csv(url, function(err, airports) {
    list_airports = airports;
    chosen_airport = list_airports[0];
    list_airports.forEach(function(i) {
        draw_airport(i);
      });
  });
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
//draw all routes which starts from a country

function draw_routes_from_country(country, color, thickness) {
  color = typeof color !== 'undefined' ? color : "#FFFF00";
  thickness = typeof thickness !== 'undefined' ? thickness : "0.05px";
  country = typeof country !== 'undefined' ? country : "france";

  d3.csv("http://localhost:1337/tool_routes_from_country/" + country, function(err, lines) {
    lines.forEach(function(i) {
      draw_route(i, color, thickness, layer_route);
    });
  });
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
//draw all routes from "airport"

function draw_routes_from_airport(airport, color, thickness) {
  color = typeof color !== 'undefined' ? color : "#FFFF00";
  thickness = typeof thickness !== 'undefined' ? thickness : "0.05px";
  country = typeof country !== 'undefined' ? country : "france";

  d3.csv("http://localhost:1337/tool_routes_from_airport/" + airport, function(err, lines) {
    lines.forEach(function(i) {
      draw_route(i, color, thickness, layer_route);
    });
  });
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
function setup(width,height){
  projection = d3.geo.mercator()
    .translate([width/2, height/2])
    .scale( width / 2 / Math.PI);

  path = d3.geo.path().projection(projection);

  svg = d3.select("#container_map").append("svg")
      .attr("width", width)
      .attr("height", height)
      .call(zoom)
      .on("click", click)
      .append("g");

  g = svg.append("g");
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
//Drawing function: run only one time

function draw(topo) {

  svg.append("path")
     .datum(graticule)
     .attr("class", "graticule")
     .attr("d", path);


  g.append("path")
   .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
   .attr("class", "equator")
   .attr("d", path);

  draw_countries();

  //charles_de_gaulle
  //frankfurt_main
  //tansonnhat_intl

  layer_route = g.append("g").attr("id", "layer_route").attr("visibility", "hidden");

  layer_airport.push(g.append("g").attr("id", "layer_airport_0").attr("visibility", "hidden"));
  layer_airport.push(g.append("g").attr("id", "layer_airport_1").attr("visibility", "hidden"));  
  layer_airport.push(g.append("g").attr("id", "layer_airport_2").attr("visibility", "hidden"));
  layer_airport.push(g.append("g").attr("id", "layer_airport_3").attr("visibility", "hidden"));
  layer_airport.push(g.append("g").attr("id", "layer_airport_4").attr("visibility", "visible"));

  //swap
  var temp = layer_airport[0];
  layer_airport[0] = layer_airport[2];
  layer_airport[2] = temp;

  infoColorMeaning = d3.select("#container_map").append("div").attr("class", "cssinfo hidden");

  var offsetL = document.getElementById("container_map").offsetLeft + 20;
  var offsetT = document.getElementById("container_map").offsetTop + 20;

  infoColorMeaning.classed("hidden", false)
                  .attr("style", "left:" + offsetL + "px;top:" + offsetT + "px")
                  .html("");
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
//redraw when user change the size of the browser

function redraw() {
  width = document.getElementById('container_map').offsetWidth;
  height = width / 2;
  d3.select('svg').remove();
  setup(width,height);
  draw(topo);
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
//sqr
function sqr(x) {
  return x * x;
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
//process mouseMoved event

function move() {

  var t = d3.event.translate;
  var s = d3.event.scale; 
  interact_map(t, s);
}

function interact_map(t, s) {
  zscale = s;
  var h = height/4;


  t[0] = Math.min(
    (width/height)  * (s - 1), 
    Math.max( width * (1 - s), t[0] )
  );

  t[1] = Math.min(
    h * (s - 1) + h * s, 
    Math.max(height  * (1 - s) - h * s, t[1])
  );

  zoom.translate(t);
  g.attr("transform", "translate(" + t + ")scale(" + s + ")");

  //adjust the country hover stroke width based on zoom level
  d3.selectAll(".country").style("stroke-width", 1 / s);

  for (var i = 0; i < 5; ++i) {
    airportR[i] = airportOverviewR[i] - (s - 1) * (airportOverviewR[i] - airportDetailR[i]) / 8;
    d3.selectAll(".airport" + i).attr("r", airportR[i] + "px");
  }

  for (var i = 0; i < 5; ++i) {
    airportOpacity[i] = airportOverviewOpacity[i] - (s - 1) * (airportOverviewOpacity[i] - airportDetailOpacity[i]) / 8;
    d3.selectAll(".stop" + i + "_center").style("stop-opacity", airportOpacity[i]);
  }

  flag_allow_chosing_airport = flag_airport_from_country || (s > 8);
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
// calculate the distance between two point (lon1, lat1) and (lon2, lat2)

function distance(lon1, lat1, lon2, lat2) {
  var R = 6371; // Radius of the earth in km
  var dLat = (lat2 - lat1) * Math.PI / 180;  // deg2rad below
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = 
     0.5 - Math.cos(dLat)/2 + 
     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
     (1 - Math.cos(dLon))/2;

  return R * 2 * Math.asin(Math.sqrt(a));
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
//
var throttleTimer;
function throttle() {
  window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
      redraw();
    }, 200);
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
//geo translation on mouse click in map

function click() {
  var latlon = projection.invert(d3.mouse(this));
  // console.log(latlon);
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
//normalize the name so that the server can understand (removing spaces)

function normalizeName(name) {
  s = name;
  var pos = 0;
  while (true)
  {
    pos = s.search(' ');
    if (pos === -1) return s;
    else s = s.replace(' ','_');
  }
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
//Draw an airports

function draw_airport(obj) {
  var gpoint = layer_airport[obj.nFlights].append("g");
  var coor = projection([obj.Longitude,obj.Latitude]);
  var x = coor[0];
  var y = coor[1];

  var grads = svg.append("defs")
    .append("radialGradient")
    .attr("id", "grad" + obj.nFlights)
    .attr("cx", "50%")
    .attr("cy", "50%")
    .attr("r", "50%")
    .attr("fx", "50%")
    .attr("fy", "50%");

  grads.append("stop").attr("class", "stop" + obj.nFlights + "_asd").attr("offset", "0%").style("stop-color", airport_color[obj.nFlights]).style("stop-opacity", "1");
  grads.append("stop").attr("class", "stop" + obj.nFlights + "_center").attr("offset", airport_centerSize[obj.nFlights]).style("stop-color", airport_color[obj.nFlights]).style("stop-opacity", airportOpacity[obj.nFlights]);
  grads.append("stop").attr("class", "stop" + obj.nFlights + "_border").attr("offset", "100%").style("stop-color", airport_color[obj.nFlights]).style("stop-opacity", airportBorderOpacity[obj.nFlights]);

  var airportObj = layer_airport[obj.nFlights].append("svg:circle")
      .attr("id", "airport" + obj.AirportID)
      .attr("cx", x)
      .attr("cy", y)
      .attr("stroke-width", "0.2px")
      .attr("stroke", airport_border_color[obj.nFlights])
      .attr("class","airport" + obj.nFlights)
      .attr("r", airportR[obj.nFlights] + "px")
      .attr("fill", function() {
        return "url(#" + grads.attr("id") + ")";
      });

  airportObj.on("mouseover", function() {
                if (flag_allow_chosing_airport == false) return;
                var offsetL = document.getElementById('container_map').offsetLeft+20;
                var offsetT = document.getElementById('container_map').offsetTop+10;

                var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
                var text = obj.Name + ", " + obj.City + ", " + obj.Country;
                tooltip.classed("hidden", false)
                           .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
                           .html(text);
            })
            .on("mouseout", function() {
              tooltip.classed("hidden", true);
            })
            .on("dblclick", function() {
              console.log("Click AIRPORT");
              if (flag_removing_airports == true) remove_airport(obj);
              if (flag_showing_airports == true) activate_airport_from_distance("show", obj.Name);
              if (flag_impact_airports == true) activate_airport_from_distance("impact", obj.Name);
            });

  if (obj.nFlights == 3) {
    console.log("add hidden airport");
    var gradsRemoved = svg.append("defs")
      .append("radialGradient")
      .attr("id", "gradRemoved" + obj.nFlights)
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%")
      .attr("fx", "50%")
      .attr("fy", "50%");

    gradsRemoved.append("stop").attr("class", "stop" + "4" + "_asd").attr("offset", "0%").style("stop-color", airport_color[4]).style("stop-opacity", "1");
    gradsRemoved.append("stop").attr("class", "stop" + "4" + "_center").attr("offset", airport_centerSize[4]).style("stop-color", airport_color[4]).style("stop-opacity", airportOpacity[4]);
    gradsRemoved.append("stop").attr("class", "stop" + "4" + "_border").attr("offset", "100%").style("stop-color", airport_color[4]).style("stop-opacity", airportBorderOpacity[4]);

    var removedAirportObj = layer_airport[4].append("svg:circle")
        .attr("id", "removedAirport" + obj.AirportID)
        .attr("cx", x)
        .attr("cy", y)
        .attr("stroke-width", "0.5px")
        .attr("stroke", airport_border_color[4])
        .attr("class","airport4")
        .attr("r", airportR[4] + "px")
        .attr("fill", function() {
          return "url(#" + gradsRemoved.attr("id") + ")";
        })
        .attr("visibility", "hidden");

    removedAirportObj
              .on("mouseover", function() {
                  if (flag_allow_chosing_airport == false) return;
                  var offsetL = document.getElementById('container_map').offsetLeft+20;
                  var offsetT = document.getElementById('container_map').offsetTop+10;

                  var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
                  var text = obj.Name + ", " + obj.City + ", " + obj.Country;
                  tooltip.classed("hidden", false)
                             .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
                             .html(text);
              })
              .on("mouseout", function() {
                tooltip.classed("hidden", true);
              })
              .on("dblclick", function() {
                console.log("Click REMOVEDAIRPORT");
                if (flag_removing_airports == true) restore_airport(obj);
              });
  }

  if (flag_airport_from_nFlightDistance && 
      (obj.nFlights > airport_MaxNFlights || 
        (obj !== chosen_airport && (obj.DistanceToHost < slider_CurrentDistance_Min || obj.DistanceToHost > slider_CurrentDistance_Max)) )) {
    airportObj.attr("visibility", "hidden");
  }
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
//Draw a routes

function draw_route(obj, color, width, layer) {

  // var gpoint = g.append("line");
  var srcCoor = projection([obj.SrcLon, obj.SrcLat]);
  var destCoor = projection([obj.DestLon, obj.DestLat]);

  layer.append("svg:line")
        .attr("class", "route")
        .attr("x1", srcCoor[0])
        .attr("y1", srcCoor[1])
        .attr("x2", destCoor[0])
        .attr("y2", destCoor[1])
        .attr("stroke", color)
        .attr("stroke-width", width);
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
//Count airports
function count_Airports() {
  airport_Count = [0, 0, 0];
  list_airports.forEach(function(i) {
    var temp = "#airport" + i.AirportID;
    if (  flag_airport_from_nFlightDistance &&
          (i.nFlights > airport_MaxNFlights || 
          (i !== chosen_airport && (i.DistanceToHost < slider_CurrentDistance_Min || i.DistanceToHost > slider_CurrentDistance_Max)) )) {
    }
    else {
      airport_Count[i.nFlights]++;
    }
  });
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
//Redraw airports
function redraw_airports() {
  if (list_airports == null) return;
  list_airports.forEach(function(i) {
    var temp = "#airport" + i.AirportID;
    if (  flag_airport_from_nFlightDistance &&
          (i.nFlights > airport_MaxNFlights || 
          (i !== chosen_airport && (i.DistanceToHost < slider_CurrentDistance_Min || i.DistanceToHost > slider_CurrentDistance_Max)) )) {
      d3.selectAll(temp).attr("visibility", "hidden");
    }
    else {
      d3.selectAll(temp).attr("visibility", "visible"); 
      airport_Count[i.nFlights]++;
    }
  });
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
function draw_colorMeaningClickCountry(countryName) {
  infoColorMeaning.html("");

  var tempDiv3 = infoColorMeaning.append("div").attr("class", "colorSample");
  var svg3 = tempDiv3.append("div").style("margin-left", "10px").style("float", "left").append("svg").attr({ width: "20px", height: "20px" });
  var grads3 = createGradient(svg3, 3);

  svg3.append("svg:circle").attr({ cx: "10", cy: "10", r: "10" }).style("float", "left")
      .attr("fill", function() {
        return "url(#" + grads3.attr("id") + ")";
      });
  tempDiv3.append("div").style("margin-left", "40px").style("margin-right", "10px").style("color", airport_color[3]).html("Airport in " + countryName);
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
function createGradient(svglayer, flag) {
  var grads = svglayer.append("defs")
    .append("radialGradient")
    .attr("id", "gradinfo" + flag)
    .attr("cx", "50%")
    .attr("cy", "50%")
    .attr("r", "50%")
    .attr("fx", "50%")
    .attr("fy", "50%");

  grads.append("stop").attr("class", "stop" + flag + "_asdinfo").attr("offset", "0%").style("stop-color", airport_color[flag]).style("stop-opacity", "1");
  grads.append("stop").attr("class", "stop" + flag + "_centerinfo").attr("offset", airport_centerSize[flag]).style("stop-color", airport_color[flag]).style("stop-opacity", airportOpacity[flag]);
  grads.append("stop").attr("class", "stop" + flag + "_borderinfo").attr("offset", "100%").style("stop-color", airport_color[flag]).style("stop-opacity", airportBorderOpacity[flag]);

  return grads;
}
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
function draw_colorMeaningShow(airportName, text1, text2) {
  infoColorMeaning.html("");

  var tempDiv = infoColorMeaning.append("div").attr("class", "colorSample");
  tempDiv.append("div").style("margin-left", "10px").style("float", "left").append("svg").attr({ width: "20px", height: "20px" }).append("circle").attr({ cx: "10", cy: "10", r: "7", fill: airport_color[0] }).style("float", "left");
  tempDiv.append("div").style("margin-left", "40px").style("margin-right", "10px").style("color", airport_color[0]).html("Host: " + airportName);

  var tempDiv1 = infoColorMeaning.append("div").attr("class", "colorSample");
  var svg1 = tempDiv1.append("div").style("margin-left", "10px").style("float", "left").append("svg").attr({ width: "20px", height: "20px" });
  var grads1 = createGradient(svg1, 1);

  svg1.append("svg:circle").attr({ cx: "10", cy: "10", r: "10" }).style("float", "left")
      .attr("fill", function() {
        return "url(#" + grads1.attr("id") + ")";
      });
  tempDiv1.append("div").style("margin-left", "40px").style("margin-right", "10px").style("color", airport_color[1]).html(text1);

  var tempDiv2 = infoColorMeaning.append("div").attr("class", "colorSample");
  var svg2 = tempDiv2.append("div").style("margin-left", "10px").style("float", "left").append("svg").attr({ width: "20px", height: "20px" });
  var grads2 = createGradient(svg2, 2);

  svg2.append("svg:circle").attr({ cx: "10", cy: "10", r: "10" }).style("float", "left")
      .attr("fill", function() {
        return "url(#" + grads2.attr("id") + ")";
      });
  tempDiv2.append("div").style("margin-left", "40px").style("margin-right", "10px").style("color", airport_color[2]).html(text2);
}
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
function check_removedAirport(id) {
  for (var i = 0; i < list_removed_airport.length; ++i)
    if (list_removed_airport[i] == id)
      return true;

  return false;
}
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
function getParameters() {
  var result = "";
  for (var i = 0; i < list_removed_airport.length; ++i)
    result += list_removed_airport[i] + "/";
  return result;
}
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
function remove_airport(obj) {
  console.log("REMOVE " + obj.Name + " " + obj.nFlights + " " + obj.AirportID);
  layer_airport[3].selectAll("#airport" + obj.AirportID).attr("visibility", "hidden");
  layer_airport[4].selectAll("#removedAirport" + obj.AirportID).attr("visibility", "visible");
  list_removed_airport.push(parseInt(obj.AirportID));
  console.log("list = " + list_removed_airport.length);
}
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
function restore_airport(obj) {
  console.log("RESTORE " + obj.Name + " " + obj.nFlights + " " + obj.AirportID);
  layer_airport[3].selectAll("#airport" + obj.AirportID).attr("visibility", "visible");
  layer_airport[4].selectAll("#removedAirport" + obj.AirportID).attr("visibility", "hidden");
  list_removed_airport.splice(list_removed_airport.indexOf(parseInt(obj.AirportID)), 1);
}
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
function activate_remove_airports() {
  console.log("activate_remove_airports");
  flag_removing_airports = true;
  flag_showing_airports = false;
  flag_impact_airports = false;
  resetImages();

  svg.style("cursor", "pointer");
  for (var i = 0; i < 4; ++i) {
    if (i < 3 || flag_airport_from_country == false) {
      layer_airport[i].selectAll(".airport" + i).remove();
      layer_airport[i].attr("visibility", "hidden");
    }
  }
}
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
function activate_show_airports() {
  console.log("activate_show_airports");
  flag_showing_airports = true;
  flag_removing_airports = false;
  flag_impact_airports = false;
  resetImages();

  console.log("list_removed_airport = " + listToString(list_removed_airport));

  svg.style("cursor", null);
  for (var i = 0; i < 5; ++i) {
      if (i != 3) {
        if (i < 4) layer_airport[i].selectAll(".airport" + i).remove();
        layer_airport[i].attr("visibility", "hidden");
      }
  }
}
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
function activate_impact_airports() {
  console.log("activate_impact_airports");
  flag_removing_airports = false;
  flag_showing_airports = false;
  flag_impact_airports = true;
  resetImages();

  svg.style("cursor", null);
  for (var i = 0; i < 4; ++i) {
    if (i < 3 || flag_airport_from_country == false) {
      layer_airport[i].selectAll(".airport" + i).remove();
      layer_airport[i].attr("visibility", "hidden");
    }
  }
}
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
function resetImages() {
  if (flag_removing_airports)
    d3.select("#buttonRemove").attr("src", "http://localhost:1337/WorldMap/images/remove_hover.jpg");
  else
    d3.select("#buttonRemove").attr("src", "http://localhost:1337/WorldMap/images/remove.jpg");

  if (flag_showing_airports)
    d3.select("#buttonShow").attr("src", "http://localhost:1337/WorldMap/images/show_hover.jpg");
  else
    d3.select("#buttonShow").attr("src", "http://localhost:1337/WorldMap/images/show.jpg");

  if (flag_impact_airports)
    d3.select("#buttonImpact").attr("src", "http://localhost:1337/WorldMap/images/impact_hover.jpg");
  else
    d3.select("#buttonImpact").attr("src", "http://localhost:1337/WorldMap/images/impact.jpg");
}
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
function listToString(list) {
  var s = "[";
  for (var i = 0; i < list.length; ++i)
    s += list[i];
  s += "]";
  return s;
}
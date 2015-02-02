d3.select(window).on("resize", throttle);

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 9])
    .on("zoom", move);

var color_airport = "#FF8000";
var color_airport_2 = "#00FF80";

var airportR = 25;
var airportOverviewR = 25;
var airportDetailR = 0.7;

var airportOpacity_2 = 0.05;
var airportOverviewOpacity_2 = 0.05;
var airportDetailOpacity_2 = 0.7;

var airportOpacity = 0.2;
var airportOverviewOpacity = 0.2;
var airportDetailOpacity = 0.7;

var width = document.getElementById('container').offsetWidth;
var height = width / 2;

var topo,projection,path,svg,g;

var graticule = d3.geo.graticule();

var tooltip = d3.select("#container").append("div").attr("class", "tooltip hidden");

setup(width,height);

d3.json("http://localhost:1337/data/world-topo-min.json", function(error, world) {

  var countries = topojson.feature(world, world.objects.countries).features;

  topo = countries;
  draw(topo);

});
d3.select("body").append("p").attr("id", "info_log").text("Charles De Gaulle");

////////////////////////////////////////////////////////////////////////////
function draw_countries() {
  var country = g.selectAll(".country").data(topo);
  var allCountries = country.enter().insert("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("id", function(d,i) { return d.id; })
      .attr("title", function(d,i) { return d.properties.name; })
      // .style("fill", function(d, i) { return d.properties.color; }) 
      .style("fill", "#1C1C1C")
      .attr("stroke", "#4A4A4A")
      .attr("stroke-width", "0.3px");

  allCountries.attr("visibility", "visible");
  // allCountries.attr("visibility", function(d, i) { if (d.properties.name == "France") return "visible"; else return "hidden"});

  //offsets for tooltips
  var offsetL = document.getElementById('container').offsetLeft+20;
  var offsetT = document.getElementById('container').offsetTop+10;

  //tooltips
  country
    .on("mousemove", function(d,i) {
        var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
        tooltip.classed("hidden", false)
               .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
               .html(d.properties.name);

        d3.selectAll($('#' + d.id)).style("fill", "#005709");
      })

    .on("mouseout",  function(d,i) {
        tooltip.classed("hidden", true);
        d3.selectAll($('#' + d.id)).style("fill", "#1C1C1C");
      })

    .on("click", function(d,i) {
      console.log("CLICK COUNTRY");
      layer_route.selectAll(".route").remove();
      draw_routes_from_country(normalizeName(d.properties.name), "#00FF00", "0.08px");
      layer_airport_all.attr("visibility", "hidden");
      layer_airport_from_distance.attr("visibility", "hidden");
      layer_route.attr("visibility", "visible");
    });
}
////////////////////////////////////////////////////////////////////////////
function draw_airports_all(color) {
  d3.csv("http://localhost:1337/data/airports.dat", function(err, airports) {
    airports.forEach(function(i) {
      addpoint(i, color, layer_airport_all);
    });
  });
}
////////////////////////////////////////////////////////////////////////////
function draw_airports_from_distance(airport, reqlen, color, layer) {
  airport = typeof airport !== 'undefined' ? airport : "charles_de_gaulle";
  reqlen = typeof reqlen !== 'undefined' ? reqlen : 1;

  d3.csv("http://localhost:1337/tool_get_airports_from_distance/" + airport + "/" + reqlen, function(err, airports) {
    airports.forEach(function(i) {
      addpoint(i, color, layer);
    });
  });
}
////////////////////////////////////////////////////////////////////////////
function draw_routes_from_country(country, color, thickness) {
  color = typeof color !== 'undefined' ? color : "#FFFF00";
  thickness = typeof thickness !== 'undefined' ? thickness : "0.05px";
  country = typeof country !== 'undefined' ? country : "france";

  d3.csv("http://localhost:1337/tool_routes_from_country/" + country, function(err, lines) {
    lines.forEach(function(i) {
      addline(i, color, thickness, layer_route);
    });
  });
}
////////////////////////////////////////////////////////////////////////////
function draw_routes_from_airport(airport, color, thickness) {
  color = typeof color !== 'undefined' ? color : "#FFFF00";
  thickness = typeof thickness !== 'undefined' ? thickness : "0.05px";
  country = typeof country !== 'undefined' ? country : "france";

  var temp = "http://localhost:1337/tool_routes_from_airport/" + airport;
  console.log("temp = ", temp);
  d3.csv("http://localhost:1337/tool_routes_from_airport/" + airport, function(err, lines) {
    lines.forEach(function(i) {
      addline(i, color, thickness, layer_route);
    });
  });
}
////////////////////////////////////////////////////////////////////////////
// function draw_routes_all(path, color, thickness) {
//   //set default values
//   path = typeof path !== 'undefined' ? path : "http://localhost:1337/data/lines.dat";
//   color = typeof color !== 'undefined' ? color : "#FFEE00";
//   thickness = typeof thickness !== 'undefined' ? thickness : "0.05px";

//   d3.csv(path, function(err, lines) {
//     lines.forEach(function(i) {
//       addline(i, color, thickness);
//     });
//   });
// }
////////////////////////////////////////////////////////////////////////////
function setup(width,height){
  projection = d3.geo.mercator()
    .translate([width/2, height/2])
    .scale( width / 2 / Math.PI);

  path = d3.geo.path().projection(projection);

  svg = d3.select("#container").append("svg")
      .attr("width", width)
      .attr("height", height)
      .call(zoom)
      .on("click", click)
      .append("g");

  g = svg.append("g");

}
////////////////////////////////////////////////////////////////////////////
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

  // layer_airport_all = g.append("g").attr("id", "layer_airport_all").attr("visibility", "visible");
  // draw_airports_all("#FF8000");

  layer_airport_from_distance_2 = g.append("g").attr("id", "layer_airport_from_distance").attr("visibility", "visible");
  draw_airports_from_distance("charles_de_gaulle", 2, color_airport_2, layer_airport_from_distance_2);

  layer_airport_from_distance = g.append("g").attr("id", "layer_airport_from_distance").attr("visibility", "visible");
  draw_airports_from_distance("charles_de_gaulle", 1, color_airport, layer_airport_from_distance);

  // draw_routes_all();
  // draw_routes_from_country();
}
////////////////////////////////////////////////////////////////////////////
function redraw() {
  width = document.getElementById('container').offsetWidth;
  height = width / 2;
  d3.select('svg').remove();
  setup(width,height);
  draw(topo);
}
////////////////////////////////////////////////////////////////////////////
function sqr(x) {
  return x * x;
}
////////////////////////////////////////////////////////////////////////////
function move() {

  var t = d3.event.translate;
  var s = d3.event.scale; 
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

  airportR = airportOverviewR - (s - 1) * (airportOverviewR - airportDetailR) / 8;
  d3.selectAll("circle").attr("r", airportR + "px");

  airportOpacity = airportOverviewOpacity - (s - 1) * (airportOverviewOpacity - airportDetailOpacity) / 8;
  airportOpacity_2 = airportOverviewOpacity_2 - (s - 1) * (airportOverviewOpacity_2 - airportDetailOpacity_2) / 8;

  d3.selectAll("#stop1").style("stop-opacity", airportOpacity);
  d3.selectAll("#stop3").style("stop-opacity", airportOpacity_2);
  // d3.select("#stop2").style("stop-opacity", airportOpacity);

  // console.log("s = ", s);
  // console.log("r = ", airportR);
  // console.log("o = ", airportOpacity);
}

////////////////////////////////////////////////////////////////////////////
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
var throttleTimer;
function throttle() {
  window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
      redraw();
    }, 200);
}
////////////////////////////////////////////////////////////////////////////
//geo translation on mouse click in map
function click() {
  var latlon = projection.invert(d3.mouse(this));
  // console.log(latlon);
}
////////////////////////////////////////////////////////////////////////////
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
//function to add points and text to the map (used in plotting capitals)
function addpoint(obj,color,layer) {
  // var gpoint = layer.append("g").attr("class", "gpoint");
  var gpoint = layer.append("g");
  var coor = projection([obj.Longitude,obj.Latitude]);
  var x = coor[0];
  var y = coor[1];

  var grads = svg.append("defs")
    .append("radialGradient")
    // .attr("gradientUnits", "userSpaceOnUse")
    .attr("id", "grad" + layer.attr("id"))
    .attr("cx", "50%")
    .attr("cy", "50%")
    .attr("r", "50%")
    .attr("fx", "50%")
    .attr("fy", "50%");

  if (layer === layer_airport_from_distance) {
    grads.append("stop").attr("id", "stop1").attr("offset", "0%").style("stop-color", color).style("stop-opacity", airportOpacity);
    grads.append("stop").attr("id", "stop2").attr("offset", "100%").style("stop-color", color).style("stop-opacity", 0.01);
  }
  else {
    grads.append("stop").attr("id", "stop3").attr("offset", "0%").style("stop-color", color).style("stop-opacity", airportOpacity_2);
    grads.append("stop").attr("id", "stop4").attr("offset", "100%").style("stop-color", color).style("stop-opacity", 0.01);
  }

  layer.append("svg:circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("class","airport")
      .attr("r", airportR + "px")
      .attr("fill", function() {
        return "url(#" + grads.attr("id") + ")";
      })
      .on("mouseover", function() {
          var offsetL = document.getElementById('container').offsetLeft+20;
          var offsetT = document.getElementById('container').offsetTop+10;

          var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
          var text = obj.Name + ", " + obj.City + ", " + obj.Country;
          tooltip.classed("hidden", false)
                     .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
                     .html(text);
      })
      .on("mouseout", function() {
          tooltip.classed("hidden", true);
      })
      .on("click", function() {
          if (airportR - 0.05 < airportDetailR)
          {
            console.log("CLICKED");

            layer_airport_from_distance.selectAll(".airport").remove();
            draw_airports_from_distance(normalizeName(obj.Name), 1, color_airport, layer_airport_from_distance);

            layer_airport_from_distance_2.selectAll(".airport").remove();
            draw_airports_from_distance(normalizeName(obj.Name), 2, color_airport_2, layer_airport_from_distance_2);

            d3.select("#info_log").text(obj.Name);
          }
      });

}
////////////////////////////////////////////////////////////////////////////
function addline(obj, color, width, layer) {

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
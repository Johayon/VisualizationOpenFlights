
// Global Variable for Graph
var nodesData = [];
var UpdateNodeData =[];
var connectionsData = [];
var isGraphDrawn = true;

// Global Variable for Table
var overallNbRoutes= 67663; // assumption : same route operated by 2 airlines = 2 routes
var overallNbAirlines= 507;  
var totalNbRoutesDisplayed = 0; // To calculate the ratio of number of routes displayed
var overallNbCountries=240;
var gaugeAirlinesValue = 0;
var gaugeRoutesValue = 0;
var gaugeCountriesValue = 0;

// refresh Gauge

var gaugeAirlines = new JustGage({
                    id: "gaugeAirlines",
                    value: gaugeAirlinesValue,
                    min: 0,
                    max: overallNbAirlines,
            title: "Airlines Available"
         });

var gaugeRoutes = new JustGage({
                    id: "gaugeRoutes",
                    value: gaugeRoutesValue,
                    min: 0,
                    max: overallNbRoutes,
            title: "Routes"
         });

var gaugeCountries = new JustGage({
                    id: "gaugeCountries",
                    value: gaugeCountriesValue,
                    min: 0,
                    max: overallNbCountries,
            title: "Countries reached"
         });


function refreshGaugeCountry(name)
{
    var goodnode = {};
    for (var i = 0; i < UpdateNodeData.length; i++) 
    {
        var node = UpdateNodeData[i];
        if (node.name.toUpperCase() == name.toUpperCase()) 
        {
            goodnode = node
        }
    }
    gaugeCountries.refresh(goodnode.NbCountry);
    gaugeCountriesValue=goodnode.NbCountry;
}

function refreshGaugeRoutes()
{
    var routesinAirports = 0
    var mySet = new Set();
    for(var i = 0; i < UpdateNodeData.length; i++) 
    {
        var node = nodesData[i];
        airlines = node.Airlines.split("'")
        routesinAirports += node["size"]  
        for (var j=0 ; j<airlines.length; j++){
            if (j%2){
                var airline = airlines[j];
                mySet.add(airline);
            }
        }
    }

    gaugeRoutes.refresh(routesinAirports);
    gaugeRoutesValue=routesinAirports;
    gaugeAirlines.refresh(mySet.size);
    gaugeAirlinesValue=mySet.size;
}




// Function to draw the graph
function GraphDraw(nodes,connections)
{
    var visualization = d3plus.viz()
                .container("#viz")
                .type("network")
                .data(nodes)
                .edges({"label": "strength", "size": "strength", "large": 1000, "value": connections})
                .size("size")
                .tooltip(["Complete Name","City, Country"])
                .id("name")
                .draw()
    
}

   


function Graph2Draw(nodes,connections)
{
    var visualization = d3plus.viz()
                .container("#viz")
                .type("rings")
                .edges({ "value": connections})
                .id("name")
                .focus("CDG")
                .draw()

    //Added for managing clicks on bars 
    
}

// Function to Update the Data with max and min.
function UpdateData(inf,max)
{
    var UpdatedNodeData = [];
    
    for(var i = 0; i < nodesData.length; i++) 
    {
        var node = nodesData[i];
        if (node["size"] > inf && node["size"] < max) 
        {
            UpdatedNodeData.push(node) 
        }
    }
    UpdateNodeData = UpdatedNodeData
    var UpdatedConnectionData =[];
    for(var i = 0; i < connectionsData.length; i++) 
    {
        var connect = connectionsData[i];
        if (connect.size1 > inf && connect.size1 < max && connect.size2 > inf && connect.size2 < max) 
        {
            UpdatedConnectionData.push(connect)
        }
    } 

    GraphDraw(UpdatedNodeData,UpdatedConnectionData)
    refreshGaugeRoutes()
    
}





// Function to load the Data
function loadData()
{
    d3.csv("NodeForGraphVisualization.csv",function(lines) {
        var numberOfLines = lines.length;
        for (var i = 0; i< numberOfLines;i++)
        {   
            // Recuperation des noeuds
            var airportID = lines[i]['IATA/FAA']
            var airportSize = lines[i].TotalFlight
            var airportAirlines = lines[i].Airlines
            var airportName = lines[i].Name
            var airportCity = lines[i].City
            var airportCountry = lines[i].Country
            var numberOfCountry = lines[i]["Number of Country"]
            nodesData.push({"name": airportID, "Complete Name" : airportName , "City" : airportCity, "Country" : airportCountry  ,"size": parseInt(airportSize),"Airlines": airportAirlines,"NbCountry" : numberOfCountry})
            
        }
        console.log(">>>>>>>>>>>>>> nodesData in Load")
        console.log(nodesData.length)

        // Load Data
        d3.csv("LinkForGraphVisualization.csv", function(lines)
        {  
            var numberOfLines = lines.length;
            for (var i = 0; i < numberOfLines; i++) 
            {
                // Récupération des données brutes 
                var airportID = lines[i]['IATA/FAA_x'];
                var airport2ID = lines[i]['IATA/FAA_y'];
                var airportSize = lines[i]['TotalFlight_x']
                var airport2Size = lines[i]['TotalFlight_y']
                var nbOperators = lines[i]['size'];
                // Cas ou la ligne ne décrit qu'un seul marchand 
                // Sinon c'est que c'est une connexion 
                
                    connectionsData.push( {"source": airportID, "target": airport2ID, "strength":parseInt(nbOperators),"size1":airportSize,"size2":airport2Size})
            }
            UpdateData(750,2000)
        })
    })    
}

loadData()

d3.select("body").on("click", function(d,i) {
        var selectedNode = d3.select("div.d3plus_tooltip_title")[0][0].textContent
        refreshGaugeCountry(selectedNode)
    })



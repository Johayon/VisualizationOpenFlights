
// Global Variable for Graph
var nodesData = [];
var connectionsData = [];
var isGraphDrawn = true;

// Global Variable for Table
var overallNbRoutes= 67663; // assumption : same route operated by 2 airlines = 2 routes
var overallNbAirports= 8107;  
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
                    max: overallNbAirports,
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


function refreshGaugeRoutes(totalNbRoutesDisplayed)
{
    gaugeRoutes.refresh(totalNbRoutesDisplayed);
    gaugeRoutesValue=totalNbRoutesDisplayed;
}






// Function to draw the graph
function GraphDraw(nodes,connections)
{
    console.log(connections.length)
    console.log(nodes.length)
    var visualization = d3plus.viz()
                .container("#viz")
                .type("network")
                .data(nodes)
                .edges({"label": "strength", "size": "strength", "large": 1000, "value": connections})
                .size("size")
                .tooltip(["Complete Name","City, Country"])
                .id("name")
                .draw()

    //Added for managing clicks on bars 
    
}


// Function to Update the Data with max and min.
function UpdateData(inf,max)
{
    var UpdatedNodeData = [];
    var routesinAirports = 0
    for(var i = 0; i < nodesData.length; i++) 
    {
        var node = nodesData[i];
        if (node["size"] > inf && node["size"] < max) 
        {
            UpdatedNodeData.push(node)
            routesinAirports += node["size"]
        }
    }

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
    refreshGaugeRoutes(routesinAirports)
    
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
            nodesData.push({"name": airportID, "Complete Name" : airportName , "City, Country" : airportCity + ", " +  airportCountry  ,"size": parseInt(airportSize) })
            
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




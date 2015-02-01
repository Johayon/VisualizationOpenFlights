// Les variables globales 
var csvDataFilePath = "dataForBarChartVisualization.csv"
var csvAirportsListPerAirlineFilePath =  "dataAirportsListPerAirline.csv"
var alldata = new Array();
var data = [];
var chart = null;
var minimumNbRoutes = 0;
var maximumNbRoutes = 10000;
///// A DISCUTER AVEC ADRIEN => LIMITE D'AFFICHAGE DU NOMBRE DE COMPANGNIES + QUEL TRI POUR L'AFFICHAGE/////
var overallNbRoutes= 67663; // assumption : same route operated by 2 airlines = 2 routes
var overallNbAirports= 8107; 
var totalNbRoutesDisplayed = 0; // To calculate the ratio of number of routes displayed
var overallNbCountries=240;
var isLongHaulSelected = true;
var isMediumHaulSelected = true;
var isShortHaulSelected = true;
var airportsWholeSet = new Set();
var gaugeAirportsValue = 0;
var gaugeRoutesValue = 0;
gaugeCountriesValue = 0;
var gaugeAirports = new JustGage({
                    id: "gaugeAirports",
                    value: gaugeAirportsValue,
                    min: 0,
                    max: overallNbAirports,
            title: "Airports Coverage"
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


function loadDataAndDrawGraph()
{
    // Load the data
    d3.csv(csvDataFilePath, function(companies)
    {   
        // Structure
        var tab1 = {key:'Vols_Court_Courrier', values:[]};
        var tab2 = {key:'Vols_Moyen_Courrier', values:[]};
        var tab3 = {key:'Vols_Longs_Courrier', values:[]};
        data = [tab1, tab2, tab3]

        var numberOfCompanies = companies.length;
        for (var i = 0; i < numberOfCompanies; i++) 
        {
            // Récupération des données brutes 
            var name = companies[i].Airline;
            var shortHaul = parseInt(companies[i]['0']);
            var mediumHaul = parseInt(companies[i]['1']);
            var longHaul = parseInt(companies[i]['2']);
            var fullName = companies[i].Name
            var country = companies[i].Country
            var numberCountries = companies[i]['Number Countries']
            var favoriteAirportName = companies[i]['Favorite Airport Name']
            var favoriteAirportCity = companies[i]['Favorite Airport City']
            var favoriteAirportCountry = companies[i]['Favorite Airport Country']
            var airportsSet = new Set();

            // Ajout à la structure 
            data[0].values.push( {x:name, y:shortHaul} )
            data[1].values.push( {x:name, y:mediumHaul} )
            data[2].values.push( {x:name, y:longHaul} )

            alldata[name] = {shortHaul: shortHaul, mediumHaul: mediumHaul, longHaul: longHaul, fullName:fullName, country:country, numberCountries :numberCountries, 
                            favoriteAirportName :favoriteAirportName, favoriteAirportCity : favoriteAirportCity, favoriteAirportCountry : favoriteAirportCountry, airportsSet : airportsSet}
        }

        console.log("Data is now loaded : ", data)
        drawGraph()
    })
     

    d3.csv(csvAirportsListPerAirlineFilePath, function(companies)
    {
        var numberOfCompanies = companies.length;
        for (var i = 0; i < numberOfCompanies; i++) 
        {
            // Récupération des données brutes 
            var name = companies[i].Airline;
            var airportID = companies[i]['Airport ID']
            if (name in alldata) {
            alldata[name].airportsSet.add(airportID); 
            }         
        }
    drawGraph()
    })
}


// Fonction dessinant le graphique
function drawGraph()
{
    nv.addGraph(function()
    {
		chart = nv.models.multiBarChart();
        chart.reduceXTicks(false);
        chart.multibar.stacked(true);
		chart.yAxis.tickFormat(d3.format('d'));        
		d3.select('#chart svg').datum(data).transition().duration(500).call(chart);
		nv.utils.windowResize(chart.update);
	},  function()
        {
            // Premièrement on ne selectionne que les 3 boutons short, medium et long haul
            d3.selectAll(".nv-series")[0][0].onclick = selectShortFlight;
            d3.selectAll(".nv-series")[0][1].onclick = selectMediumFlight;
            d3.selectAll(".nv-series")[0][2].onclick = selectLongFlight;
            
            //Added for managing clicks on bars 
            chart.multibar.dispatch.on("elementClick", function(e) {
            var position = e.pointIndex;
            console.log(e);
            refreshAirlinePanel(e.series.values[position].x);
            }
            )

            sortGraphData();
            filterGraphDataByTotalOfRoutes(500, 1500);
        
        }
            )    
}


function displayAirlinePanel(a)
{
    
}

function refreshGeneralPanel(valueAirports,totalNbRoutesDisplayed)
{
    gaugeAirports.refresh(valueAirports);
    gaugeAirportsValue=valueAirports;
    gaugeRoutes.refresh(totalNbRoutesDisplayed);
    gaugeRoutesValue=totalNbRoutesDisplayed;
}

function refreshAirlinePanel(a)
{
    gaugeCountries.refresh(alldata[a].numberCountries);
    gaugeCountriesValue=alldata[a].numberCountries;
    d3.select("#airlineName").text("AirLine Name: " + alldata[a].fullName);
    d3.select("#country").text("Country of Origin: " + alldata[a].country);
    // d3.select("#panel").select("#numberCountries").text("Number of countries covered by airline: " + alldata[a].numberCountries);
    d3.select("#mainAirport").text("Main airport: " + alldata[a].favoriteAirportName + ", " + alldata[a].favoriteAirportCity + ", " + alldata[a].favoriteAirportCountry);
}

// function displayGeneralPanel(value, min, max)
// {
//     var percentageRoutesDisplayed =  ((totalNbRoutesDisplayed / overallNbRoutes)*100).toFixed(2);
//     var airportsSetNumber = airportsWholeSet.size;
//     var percentageAirportsReached = ((airportsWholeSet.size/overallNbAirports)*100).toFixed(2); 
//     // d3.select("#panel").select("#percentageRoutes").text("Percentage of routes covered by the selection: " + percentageRoutesDisplayed.toString() + " %");
//     // d3.select("#panel").select("#percentageAirports").text("Percentage of airports reached by the selection: " + percentageAirportsReached.toString() + " %");
//     var g = new JustGage({
//             id: "gaugeAirports",
//             value: 67,
//             min: 0,
//             max: 100,
//             title: "Airports"
//             });
// }
// Fonctions prenant en compte le clic sur un type de vol
function selectShortFlight()
{
    console.log("In short fonction")
    isShortHaulSelected = !isShortHaulSelected;
    checkIfAllFlightsTypeAreDisabled();
    sortGraphData();
}


// Fonctions prenant en compte le clic sur un type de vol
function selectMediumFlight()
{
    console.log("In medium fonction")
    isMediumHaulSelected = !isMediumHaulSelected;
    checkIfAllFlightsTypeAreDisabled();
    sortGraphData();
}


// Fonctions prenant en compte le clic sur un type de vol
function selectLongFlight()
{
    console.log("In long fonction")
    isLongHaulSelected = !isLongHaulSelected;
    checkIfAllFlightsTypeAreDisabled();
    sortGraphData();
}


// Si tous les types de vols sont desactivés alors nvd3 les réactive tous...
function checkIfAllFlightsTypeAreDisabled()
{
    if( !isShortHaulSelected && !isMediumHaulSelected && !isLongHaulSelected )
    {
        isShortHaulSelected = true;
        isMediumHaulSelected = true;
        isLongHaulSelected = true;
    }
}


// Fonction qui trie les données du graphe 
function sortGraphData() 
{
    data[0].values.sort(sortArray);
    data[1].values.sort(sortArray);
    data[2].values.sort(sortArray);
    d3.select('#chart svg').datum(data).transition().duration(500).call(chart);
}


function sortArray(a, b)
{
    var aName = a.x;
    var bName = b.x;
    var aTotal = 0;
    var bTotal = 0;

    if( isShortHaulSelected )
    {
        aTotal += alldata[aName].shortHaul;
        bTotal += alldata[bName].shortHaul;
    }

    if( isMediumHaulSelected )
    {
        aTotal += alldata[aName].mediumHaul;
        bTotal += alldata[bName].mediumHaul;
    }

    if( isLongHaulSelected )
    {
        aTotal += alldata[aName].longHaul;
        bTotal += alldata[bName].longHaul;
    }

    return (aTotal < bTotal)
}


function filterGraphDataByTotalOfRoutes(minimum, maximum)
{
    // Mise à jour des variables globales
    minimumNbRoutes = minimum;
    maximumNbRoutes = maximum;
    totalNbRoutesDisplayed = 0;
    airportsWholeSet = new Set();

    // Formatage des données pour coller au format du graphe nvd3
    data[0].values = [];
    data[1].values = [];
    data[2].values = [];

    console.log("Test stylé", alldata)

    for(var el in alldata)
    {
        var totalNbRoutes = alldata[el].shortHaul + alldata[el].mediumHaul + alldata[el].longHaul;
        if( totalNbRoutes > minimum && totalNbRoutes < maximum )
        {
            data[0].values.push( {x:el, y:alldata[el].shortHaul} );
            data[1].values.push( {x:el, y:alldata[el].mediumHaul} );
            data[2].values.push( {x:el, y:alldata[el].longHaul} );
            totalNbRoutesDisplayed += totalNbRoutes;

            for (id of alldata[el].airportsSet) 
            {
                airportsWholeSet.add(id)
            }
        }
    }

    // Tri des nouvelles données 
    sortGraphData();
    
    // Mise à jour du graphe
    d3.select('#chart svg').datum(data).transition().duration(500).call(chart);
    
    refreshGeneralPanel(airportsWholeSet.size, totalNbRoutesDisplayed);
}
loadDataAndDrawGraph();


///CODE TO REFRESH THE GAUGE
// var gageValue = 100;

//         var g = new JustGage({
//             id: "gauge",
//             value: gageValue,
//             min: 0,
//             max: 200,
//             title: "BMI"
//         });

// function updateGage(n) {
//   g.refresh(gageValue + n);
//   gageValue += n;
// }

// function inc() {
//   updateGage(20);
// }

// function dec() {
//   updateGage(-20);
// }

// function incVar() {
//   updateGage(parseInt(document.getElementById("change").value))
// }

// function decVar() {
//   updateGage(-parseInt(document.getElementById("change").value))
// }


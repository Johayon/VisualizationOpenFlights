// Les variables globales 
var csvDataFilePath = "dataForBarChartVisualization.csv"
var alldata = new Array();
var data = [];
var chart = null;
var minimumNbRoutes = 0;
var maximumNbRoutes = 10000;
var isLongHaulSelected = true;
var isMediumHaulSelected = true;
var isShortHaulSelected = true;


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

            // Ajout à la structure 
            data[0].values.push( {x:name, y:shortHaul} )
            data[1].values.push( {x:name, y:mediumHaul} )
            data[2].values.push( {x:name, y:longHaul} )

            alldata[name] = {shortHaul: shortHaul, mediumHaul: mediumHaul, longHaul: longHaul}
        }

        console.log("Data is now loaded : ", data)
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
            sortGraphData();
            filterGraphDataByTotalOfRoutes(500, 1500);
        }
    )    
}


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
            data[0].values.push( {x:el, y:alldata[el].shortHaul} )
            data[1].values.push( {x:el, y:alldata[el].mediumHaul} )
            data[2].values.push( {x:el, y:alldata[el].longHaul} )
        }
    }

    // Tri des nouvelles données 
    sortGraphData();
    
    // Mise à jour du graphe
    d3.select('#chart svg').datum(data).transition().duration(500).call(chart);
}


loadDataAndDrawGraph();

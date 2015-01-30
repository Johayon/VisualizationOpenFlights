
#Visualization Project Design 


Team-Members:
-Huynh Duy-Hung Nguyen (ING 24M)
-Geoffray Bories (MS BGD)
-Adrien Dutertre (MS BGD)
-Yoann Janvier (MS BGD)
-Jonathan Ohayon (MS BGD)

##Datasets
As part of this project we are going to leverage 3 datasets containing the airports, airlines and routes over the world.

##Refined Problem Statement
Here are a couple of questions we will try to be answer through the visualizations:

| Audience  						| Question / Problem  											|
|-----------------------------------|---------------------------------------------------------------|
| Governments / Airport companies   | What are the incoming/outgoing routes for a given airport?   	|
| Governments / airlines 			| What are the biggest hubs?								    |   
| Governments/Travel Agencies	    | What are the biggest airlines in terms of traffic for the short, medium and long haul flights? |
| Airport companies					| An airline is in bankruptcy: how many routes do we lose, what is the percentage of workload loss for a given airport?|
| Governments / Airline companies   |  An airport is not available – what is the impact for the airlines? |
| All | What are airports/airlines main characteristics (country )|


##Design Proposals
###Interactive Worldwide map 
####Overview
Initially, we had planned to base our project on a worldwide map visualization representing:
-The overall airline traffic on the basis of the routes
-The impact on the airline traffic if one or more airline(s) stop operating and/or if one or more airports stop their activity.

The outline for this first visualization being as follows:



Features to implement:

1. The slider allows changing the minimum length of routes displayed on the map.
2. If the user hovers the mouse over a country, its name will be displayed.
3. If the user clicks on a country, the information of this country will be displayed one the right.
4. The user can remove an Airline or an Airport through a combo box.

Nice to have : 

1. More information displayed when the user hovers over a country.

How to leverage effectively this visualization ?

Brainstorming on this representation, it turned out that the users could miss valuable inputs to order to leverage effectively this tool. 

For instance, it would be of main interest to know which are the biggest / central hubs, or which are the biggest airlines to make the most of this visualization.

In order to address these problems, 2 additional visualizations have been identified and describes in the upcoming sections:
-Airport’s centrality
-Histogram of Short/Medium/Long Haul airlines capacities 

###Airports’ graph centrality
In order to know which are the biggest or central hubs, we propose to perform a graph visualization where the nodes are the airports and the links are the routes between the airports. The layout would be as follows:

Features to implement:

1. The slider allows changing the number of airports on the graph, on the basis of airport’s related routes using minimum and maximum thresholds.
2. If the user hovers with the mouse over a node, its name will be displayed.
3. If the user clicks on an airport, the information of this airport will be displayed on the table.

Nice to have features:

1. The ability to center the graph on a node.
2. Information on a specified route if the user hovers with the mouse over a edge (i.e. Number of airlines using this route).
3. Ability to change the focus to a country with the add of a selector.








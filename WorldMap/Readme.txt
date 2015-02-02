HOW TO RUN THE MAP

- Install Nodejs

- Compile the cpp files
	- g++ tool_get_airports_from_distance.cpp -o tool_get_airports_from_distance
	- g++ tool_routes_from_airport.cpp -o tool_routes_from_airport
	- g++ tool_routes_from_country.cpp -o tool_routes_from_country

- Run FileServer.js (Command: "node FileServer.js" or "nodejs FileServer.js")

- Open GoogleChrome (not Firefox)

- URL: "localhost:1337/map_index.html"
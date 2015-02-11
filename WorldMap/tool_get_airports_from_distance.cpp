////////////////////////////////////////////////////////////////////////////
//COMMAND: tool_get_airports_from_distance <airportName> <distance>
//         - return all the airports that coule be reach by exactly <distance> flights from <airportName>
//         - airportName: no spaces, no special characters
//         - distance: integer, >= 1
////////////////////////////////////////////////////////////////////////////
#include <iostream>
#include <cstdio>
#include <cstring>
#include <cstdlib>
#include <cmath>
#include <cassert>
#include <ctime>
#include <fstream>
#include <sstream>
#include <algorithm>
#include <string>
#include <vector>
#include <map>
#include <set>
#include <stack>
#include <queue>
#include <deque>
using namespace std;

#define sz(a) int(a.size())

const int nAirports = 10000;
const int nAirlines = 20000;
const int nRoutes = 70000;

struct AIRPORT {
	int id;
	string name;
	string city;
	string country;
	double latitude;
	double longitude;
};

struct AIRLINE {
	int id;
	string name;
	string country;
	string active;
};

struct ROUTE {
	int id;
	int sourceAirportID;
	int destinationAirportID;
};

int stringToInt(string s)
{
	stringstream ss;
	ss << s;

	int res;
	ss >> res;

	return res;
}

double stringToDouble(string s)
{
	stringstream ss;
	ss << s;

	double res;
	ss >> res;

	return res;
}

string stringToString(string s)
{
	s.erase(0, 1);
	s.erase(sz(s) - 1);
	return s;
}

string outputString(string s)
{
	bool flag = true;
	for (int i = 0; i < sz(s); ++i)
		if (s[i] == '_')
		{
			s[i] = ' ';
			flag = true;
		}
		else
		{
			if (flag == true) 
				s[i] = toupper(s[i]);
			flag = false;
		}

	return s;
}

void readData(string path, vector <vector <string> > &data) {
	ifstream input;
	input.open(path.c_str());

	string s;
	getline(input, s);

	int index = -1;
	while (getline(input, s))
	{
		index++;
		data.push_back(vector <string> ());
		for (int i = 0; i < sz(s); ++i)
			if (s[i] == ' ')
				s[i] = '_';
			else
				if (s[i] == ',')
					s[i] = ' ';
				else
					s[i] = tolower(s[i]);

		stringstream ss;
		ss << s;

		while (ss >> s) data[index].push_back(s);
	}

	input.close();
}

void readRoutes(string path, vector <ROUTE> &routes)
{
	vector <vector <string> > data;
	readData(path, data);

	for (int i = 0; i < sz(data); ++i)
	{
		ROUTE route;
		route.id = stringToInt(data[i][1]);
		route.sourceAirportID = stringToInt(data[i][3]);
		route.destinationAirportID = stringToInt(data[i][5]);

		routes.push_back(route);
	}
}

void readAirports(string path, vector <AIRPORT> &airports)
{
	vector <vector <string> > data;
	readData(path, data);

	for (int i = 0; i < sz(data); ++i)
	{
		AIRPORT airport;
		airport.id = stringToInt(data[i][0]);
		airport.name = stringToString(data[i][1]);
		airport.city = stringToString(data[i][2]);
		airport.country = stringToString(data[i][3]);
		airport.latitude = stringToDouble(data[i][6]);
		airport.longitude = stringToDouble(data[i][7]);

		airports.push_back(airport);
	}
}

double distance(double lon1, double lat1, double lon2, double lat2) {
  double R = 6371; // Radius of the earth in km
  double PI = acos(-1);
  double dLat = (lat2 - lat1) * PI / 180;  // deg2rad below
  double dLon = (lon2 - lon1) * PI / 180;
  double a = 
     0.5 - cos(dLat)/2 + 
     cos(lat1 * PI / 180) * cos(lat2 * PI / 180) * 
     (1 - cos(dLon))/2;

  return R * 2 * asin(sqrt(a));
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

vector <ROUTE> routes;
vector <AIRPORT> airports;

int cost[nAirports];
vector <int> adj[nAirports];
map <int, int> ma;
queue <int> qu;

void read(int argc, char ** argv, string &sourceAirport, int &reqlen)
{
	string s;
	for (int j = 0; j < strlen(argv[1]); ++j)
		if (argv[1][j] == '/')
			s.push_back(' ');
		else
			s.push_back(tolower(argv[1][j]));

	stringstream ss;
	ss << s;
	ss >> sourceAirport >> reqlen;
}

int main(int argc, char ** argv)
{
	string sourceAirport;
	int reqlen;
	read(argc, argv, sourceAirport, reqlen);

	//init
	int source = -1;
	readAirports("data/airports.dat", airports);
	for (int i = 0; i < sz(airports); ++i)
	{
		ma[airports[i].id] = i;
		string lowername = "";
		for (int j = 0; j < sz(airports[i].name); ++j)
			lowername.push_back(tolower(airports[i].name[j]));

		if (lowername == sourceAirport)
			source = i;
	}

	readRoutes("data/routes.dat", routes);
	for (vector <ROUTE> :: iterator i = routes.begin(); i != routes.end(); ++i)
	{
		int is = ma[i->sourceAirportID];
		int id = ma[i->destinationAirportID];
		if (is == 0 || id == 0) continue;

		adj[is].push_back(id);
		adj[id].push_back(is);
	}

	cost[source] = 1;
	qu.push(source);

	vector <int> result;
	double maxdist = 0;

	cout << "AirportID,Name,City,Country,Latitude,Longitude,nFlights,DistanceToHost\n";
	while (qu.empty() == false)
	{
		int u = qu.front(); qu.pop();
		if (cost[u] <= reqlen + 1 || u == source)
		{
			result.push_back(u);
			maxdist = max(maxdist, distance(airports[source].longitude, airports[source].latitude, airports[u].longitude, airports[u].latitude));
		}

		for (int i = 0; i < sz(adj[u]); ++i)
		{
			int v = adj[u][i];
			if (cost[v] != 0) continue;
			cost[v] = cost[u] + 1;
			if (cost[v] <= reqlen + 1)
				qu.push(v);
		}
	}

	for (vector <int> :: iterator i = result.begin(); i != result.end(); ++i)
	{
		int u = *i;;
		cout << airports[u].id << ',';
		cout << outputString(airports[u].name) << ',';
		cout << outputString(airports[u].city) << ',';
		cout << outputString(airports[u].country) << ',';
		cout << airports[u].latitude << ',';
		cout << airports[u].longitude << ',';
		cout << cost[u] - 1 << ',';

		if (u == source)
			cout << maxdist << '\n';
		else
			cout << distance(airports[source].longitude, airports[source].latitude, airports[u].longitude, airports[u].latitude) << '\n';
	}

	return 0;
}

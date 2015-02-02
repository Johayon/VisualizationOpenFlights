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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

vector <ROUTE> routes;
vector <AIRPORT> airports;

map <int, int> ma;

int main(int argc, char ** argv)
{
	string name = "";
	for (int i = 1; i < argc; ++i)
	{
		string s = "";
		for (int j = 0; j < strlen(argv[i]); ++j)
			s.push_back(argv[i][j]);
		s.push_back('_');
		name += s;
	}

	name.erase(sz(name) - 1);
	for (int i = 0; i < sz(name); ++i)
		name[i] = tolower(name[i]);

	//init
	// cout << name << endl;
	readAirports("data/airports.dat", airports);
	for (int i = 0; i < sz(airports); ++i)
		ma[airports[i].id] = i;

	// ofstream output;
	// output.open("result_routes.dat");
	cout << "Id,SrcId,SrcLat,SrcLon,DestId,DestLat,DestLon\n";

	readRoutes("data/routes.dat", routes);
	for (vector <ROUTE> :: iterator i = routes.begin(); i != routes.end(); ++i)
	{
		int index_src = ma[i->sourceAirportID];
		int index_dest = ma[i->destinationAirportID];
		if (index_src == 0 || index_dest == 0) continue;
		if (airports[index_src].name == name || airports[index_dest].name == name)
		{
			cout << i->id << ',';
			cout << i->sourceAirportID << ',';
			cout << airports[index_src].latitude << ',';
			cout << airports[index_src].longitude << ',';
			cout << i->destinationAirportID << ',';
			cout << airports[index_dest].latitude << ',';
			cout << airports[index_dest].longitude << '\n';
		}
	}

	// output.close();
	return 0;
}
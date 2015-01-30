# -*- coding: utf-8 -*-

import numpy as np 
import pandas as pd 
import geopy
import geopy.distance


def readAndMergeData(airlinesDataFile, airportsDataFile, routesDataFile) : 

	# Première étape : on lit les 3 csv et on les stocke chacun dans un DF 
	airportsDF = pd.read_csv(airportsDataFile, na_values=['\N'])
	routesDF = pd.read_csv(routesDataFile, na_values=['\N'])
	airlinesDF = pd.read_csv(airlinesDataFile, na_values=['\N'])
	
	# On ne garde que ce qui nous interesse
	routesDF.drop([u'Codeshare'], axis=1, inplace=True)
	airportsDF.drop([u'Name', u'City', u'Country', u'IATA/FAA', u'ICAO', u'Altitude', u'Timezone', u'DST', u'Tz database time zone'], axis=1, inplace=True)
	airlinesDF.drop([u'Alias', u'IATA', u'ICAO', u'Callsign', u'Country', u'Active'], axis=1, inplace=True)
	
	# On supprime les valeurs nan
	routesDF.dropna(inplace=True)
	airportsDF.dropna(inplace=True)
	airlinesDF.dropna(inplace=True)

	# Jointure pour les sources airports 
	airportsDF.columns = [u'Source airport ID', u'Source latitude', u'Source longitude']
	tmpDF = pd.merge(routesDF, airportsDF, on='Source airport ID')

	# Jointure pour les destination airports 
	airportsDF.columns = [u'Destination airport ID', u'Destination latitude', u'Destination longitude']
	tmp2DF = pd.merge(tmpDF, airportsDF, on='Destination airport ID')

	# Jointure pour les noms complets des airlines 
	mergedDF = pd.merge(tmp2DF, airlinesDF, on='Airline ID')

	# Enfin on retourne l'unique DF résultant où figurent toutes les infos dont on a besoin ensuite 
	return mergedDF


def computeFlightDistance(row) : 

	sourcePoint = geopy.Point(row['Source latitude'], row['Source longitude'])
	destinationPoint = geopy.Point(row['Destination latitude'], row['Destination longitude'])

	return geopy.distance.distance(sourcePoint, destinationPoint).km


def getFlightType(row, thresholds) : 

	# court courrier  
	if row['distance'] < thresholds[0] : 
		return 0

	# Moyen courrier
	elif row['distance'] < thresholds[1] :
		return 1

	# Long courrier
	else : 
		return 2


# Paramètres du programme
airlinesDataFile = "../data/airlines.csv"
airportsDataFile = "../data/airports.csv"
routesDataFile = "../data/routes.csv"
csvOutputFilename = "dataForBarChartVisualization.csv"
thresholds = [1500, 3000]

# Récupération des données brutes
print "\nRécupération des données brutes"
data = readAndMergeData(airlinesDataFile, airportsDataFile, routesDataFile)

# Pour chaque vol calcul de la distance parcourue et donc ensuite du type de vol
print "Calcul de la distance et du type de chaque vol"
data['distance'] = data.apply(computeFlightDistance, axis=1)
data['Type'] = data.apply(lambda x : getFlightType(x, thresholds), axis=1)

# Regroupement du nombre de vols de chaque type par compagnie aérienne
print "Regroupement du nombre de vols de chaque type par compagnie"
dataForVisualization = data.groupby(['Airline', 'Name'])['Type'].value_counts().unstack()
dataForVisualization.fillna(0, inplace=True)

# Ecriture du csv qui servira pour la partie visu en Javascript ensuite
print "Ecriture du csv"
dataForVisualization.to_csv(csvOutputFilename)

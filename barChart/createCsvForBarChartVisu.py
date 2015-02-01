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
	airportsDF.drop([u'IATA/FAA', u'ICAO', u'Altitude', u'Timezone', u'DST', u'Tz database time zone', u'Name', u'City', u'Country'], axis=1, inplace=True)

	airlinesDF.drop([u'Alias', u'IATA', u'ICAO', u'Callsign', u'Active'], axis=1, inplace=True)
	
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

def getNumberCountriesCovered(airportsDataFile, routesDataFile) :
	# Première étape : on lit les 3 csv et on les stocke chacun dans un DF 
	airportsDF = pd.read_csv(airportsDataFile, na_values=['\N'])
	routesDF = pd.read_csv(routesDataFile, na_values=['\N'])

	# On ne garde que ce qui nous interesse
	routesDF.drop([u'Codeshare',u'Stops', u'Equipment', u'Airline ID', u'Source airport', u'Destination airport'], axis=1, inplace=True)
	airportsDF.drop([u'IATA/FAA', u'ICAO', u'Altitude', u'Timezone', u'DST', u'Tz database time zone',u'Latitude', u'Longitude'], axis=1, inplace=True)

	# On supprime les valeurs nan
	routesDF.dropna(inplace=True)
	airportsDF.dropna(inplace=True)

	# Jointure pour les sources airports 
	resultMerge = pd.merge (routesDF, airportsDF, left_on='Source airport ID', right_on='Airport ID')

	# Jointure pour les destination airports 
	resultMerge2 = pd.merge (resultMerge, airportsDF, left_on='Destination airport ID', right_on='Airport ID')
	resultMerge2 = resultMerge2[['Airline', 'Country_x', 'Country_y']]

	#Concaténation et groupby
	resultMerge2=pd.concat([resultMerge2[['Airline', 'Country_x']].rename(columns={'Country_x':'Number Countries'}),resultMerge2[['Airline','Country_y']].rename(columns={'Country_y':'Number Countries'})]).drop_duplicates()
	nbCountriesCoveredDF = resultMerge2.groupby('Airline').count()
	return nbCountriesCoveredDF

def getFavoriteAirport(airportsDataFile, routesDataFile) :
	# Première étape : on lit les 3 csv et on les stocke chacun dans un DF 
	airportsDF = pd.read_csv(airportsDataFile, na_values=['\N'])
	routesDF = pd.read_csv(routesDataFile, na_values=['\N'])

	# On ne garde que ce qui nous interesse
	routesDF.drop([u'Codeshare',u'Stops', u'Equipment', u'Airline ID', u'Source airport', u'Destination airport'], axis=1, inplace=True)
	airportsDF.drop([u'IATA/FAA', u'ICAO', u'Altitude', u'Timezone', u'DST', u'Tz database time zone',u'Latitude', u'Longitude'], axis=1, inplace=True)

	# On supprime les valeurs nan
	routesDF.dropna(inplace=True)
	airportsDF.dropna(inplace=True)

	# On crée des DataFrames pour les lieux de départ et de destination de chaque route
	sourceRouteDF = routesDF.drop([u'Destination airport ID'], axis=1).rename(columns={'Source airport ID':'Airport ID'})
	destinationRouteDF = routesDF.drop([u'Source airport ID'], axis=1).rename(columns={'Destination airport ID':'Airport ID'})

	# On compte le nombre d'occurrence de chaque lieu pour chaque Airline
	result = pd.concat ([sourceRouteDF, destinationRouteDF])
	result['Value']=1
	result = result.groupby(['Airline', 'Airport ID']).count().reset_index()
	favoriteAirportDF = result.groupby('Airline').apply(lambda subf: subf['Airport ID'][subf['Value'].idxmax()]).to_frame('Airport ID')
	favoriteAirportDF = favoriteAirportDF.reset_index().merge(airportsDF, on='Airport ID').set_index('Airline')
	favoriteAirportDF = favoriteAirportDF.rename(columns = {'Airport ID' : 'Favorite Airport ID', 'Name' : 'Favorite Airport Name' , 'City' : 'Favorite Airport City', 'Country' : 'Favorite Airport Country'})
	return favoriteAirportDF

def getAirportsList(airportsDataFile, routesDataFile) :
	# Première étape : on lit les 3 csv et on les stocke chacun dans un DF 
	airportsDF = pd.read_csv(airportsDataFile, na_values=['\N'])
	routesDF = pd.read_csv(routesDataFile, na_values=['\N'])

	# On ne garde que ce qui nous interesse
	routesDF.drop([u'Codeshare',u'Stops', u'Equipment', u'Airline ID', u'Source airport', u'Destination airport'], axis=1, inplace=True)
	airportsDF.drop([u'IATA/FAA', u'ICAO', u'Altitude', u'Timezone', u'DST', u'Tz database time zone',u'Latitude', u'Longitude'], axis=1, inplace=True)

	# On supprime les valeurs nan
	routesDF.dropna(inplace=True)
	airportsDF.dropna(inplace=True)

	# On crée des DataFrames pour les lieux de départ et de destination de chaque route
	sourceRouteDF = routesDF.drop([u'Destination airport ID'], axis=1).rename(columns={'Source airport ID':'Airport ID'})
	destinationRouteDF = routesDF.drop([u'Source airport ID'], axis=1).rename(columns={'Destination airport ID':'Airport ID'})

	result = pd.concat ([sourceRouteDF, destinationRouteDF]).set_index('Airline')
	return result
	

# Paramètres du programme
airlinesDataFile = "../data/airlines.csv"
airportsDataFile = "../data/airports.csv"
routesDataFile = "../data/routes.csv"
csvOutputFilename = "dataForBarChartVisualization.csv"
csvAirportListOutputFilename = "dataAirportsListPerAirline.csv"
thresholds = [1500, 3000]

# Récupération des données brutes
print "\nRécupération des données brutes"
data = readAndMergeData(airlinesDataFile, airportsDataFile, routesDataFile)
nbCountriesCoveredDF = getNumberCountriesCovered(airportsDataFile, routesDataFile)
favoritesAirportsDF = getFavoriteAirport(airportsDataFile, routesDataFile)
airportList = getAirportsList(airportsDataFile, routesDataFile)

# Pour chaque vol calcul de la distance parcourue et donc ensuite du type de vol
print "Calcul de la distance et du type de chaque vol"
data['distance'] = data.apply(computeFlightDistance, axis=1)
data['Type'] = data.apply(lambda x : getFlightType(x, thresholds), axis=1)

# Regroupement du nombre de vols de chaque type par compagnie aérienne
print "Regroupement du nombre de vols de chaque type par compagnie"
dataForVisualization = data.groupby(['Airline', 'Name', 'Country'])['Type'].value_counts().unstack()
dataForVisualization.fillna(0, inplace=True)

# Regroupement du nombre de pays couverts par chaque compagnie aérienne
dataForVisualization = dataForVisualization.join(nbCountriesCoveredDF)
dataForVisualization = dataForVisualization.join(favoritesAirportsDF)

# Ecriture du csv qui servira pour la partie visu en Javascript ensuite
print "Ecriture des csv"
dataForVisualization.to_csv(csvOutputFilename)
airportList.to_csv(csvAirportListOutputFilename)





















# -*- coding: utf-8 -*-

import numpy as np 
import pandas as pd 
import geopy
import geopy.distance


def readAndMergeData(airportsDataFile, routesDataFile): 

	# Première étape : on lit les 3 csv et on les stocke chacun dans un DF 
	airportsDF = pd.read_csv(airportsDataFile, na_values=['\N'])
	routesDF = pd.read_csv(routesDataFile, na_values=['\N'])
	
	# On ne garde que ce qui nous interesse
	routesDF.drop([u'Codeshare',u'Source airport',u'Destination airport',u'Stops',u'Equipment'], axis=1, inplace=True)
	airportsDF.drop([u'ICAO', u'Timezone', u'DST', u'Tz database time zone'], axis=1, inplace=True)
	
	# On supprime les valeurs nan
	routesDF.dropna(inplace=True)
	airportsDF.dropna(inplace=True)

	# Enfin on retourne l'unique DF résultant où figurent toutes les infos dont on a besoin ensuite 
	return routesDF,airportsDF
	

def removeDirection(data):
	tmp=data[['Source airport ID','Destination airport ID','Airline']].copy()
	tmp2=data[['Source airport ID','Destination airport ID','Airline']].copy()
	tmp2['Source airport ID'] = tmp['Destination airport ID']
	tmp2['Destination airport ID'] = tmp['Source airport ID']
	res = pd.concat([tmp,tmp2]).drop_duplicates()
	return res


def getAirlineOperators(data):
	resultat= data.groupby('Source airport ID').apply(lambda x: list(x.Airline))
	return pd.DataFrame({'Airlines':resultat.apply(lambda x : list(set(x)))}).reset_index()

def processLink(data):
	res = pd.DataFrame({'size':data.groupby(['Source airport ID','Destination airport ID'])['Airline'].count()}).reset_index()
	resultat = res[res['Source airport ID']<res['Destination airport ID']]
	return resultat

def getNumberOfFlights(data) :
	tmp = data.copy()
	tmp['OutFlight'] = data.groupby(['Source airport ID'])['Destination airport ID'].transform('count')
	tmp['InFlight'] =  data.groupby(['Destination airport ID'])['Source airport ID'].transform('count')
	tmp2 = tmp[['Source airport ID','OutFlight']].drop_duplicates()
	tmp3 = tmp[['Destination airport ID','InFlight']].drop_duplicates()
	for x in tmp3['Destination airport ID'].values:
		if x not in tmp2['Source airport ID'].values:
			add_x = pd.DataFrame.from_dict({'Source airport ID':[x],'OutFlight':[0]})
			tmp2 = pd.concat([tmp2,add_x])
	for x in tmp2['Source airport ID'].values:
		if x not in tmp3['Destination airport ID'].values:
			add_x = pd.DataFrame.from_dict({'Destination airport ID':[x],'InFlight':[0]})
			tmp3 = pd.concat([tmp3,add_x])

	merger =  tmp2.merge(tmp3,right_on = 'Destination airport ID',left_on = 'Source airport ID')
	merger['TotalFlight'] = merger.apply(lambda x : x['InFlight'] + x['OutFlight'],axis=1)
	return merger

def getNumberOfCountry(dataLink,dataNodes) :
	tmp = dataLink.merge(dataNodes[['Source airport ID','Country']], left_on='Destination airport ID', right_on='Source airport ID')
	tmp2 = tmp[['Source airport ID_x','Country']].drop_duplicates()
	tmp3 = tmp[['Source airport ID_x']].drop_duplicates()
	res = tmp3.merge(pd.DataFrame({'Number of Country':tmp2.groupby(['Source airport ID_x'])['Country'].count()}).reset_index(),on="Source airport ID_x") 
	return res


# Paramètres du programme
airportsDataFile = "../data/airports.csv"
routesDataFile = "../data/routes.csv"
LinkcsvOutputFilename = "LinkForGraphVisualization.csv"
NodecsvOutputFilename = "NodeForGraphVisualization.csv"

# Récupération des données brutes
print "\nRécupération des données brutes"
Linkrawdata,airportsrawData = readAndMergeData(airportsDataFile, routesDataFile)

# Creation des Liens entre aeroport.
UndirectedData = removeDirection(Linkrawdata)
LinkCompleteData = processLink(UndirectedData)

# Regroupement du nombre de vols par aeroport.
print "Regroupement du nombre de vols par aeroport in + out "
airportsData = getNumberOfFlights(Linkrawdata)
airportsOperators = getAirlineOperators(UndirectedData)
airportsDatatmp = airportsData[['Source airport ID','OutFlight','InFlight','TotalFlight']].merge(airportsOperators,on='Source airport ID')
airportsCompleteData = airportsDatatmp.merge(airportsrawData,left_on='Source airport ID',right_on='Airport ID')
#dataForVisualization.merge(FlightbyAirports,)

# add cutoof in link
FinalLink=LinkCompleteData.merge(airportsCompleteData[['Source airport ID','IATA/FAA','TotalFlight','Country']],on='Source airport ID').merge(airportsCompleteData[['Source airport ID','IATA/FAA','TotalFlight','Country']], left_on='Destination airport ID', right_on='Source airport ID')

# add number of country reached.
NumberOfCountrybyAirport = getNumberOfCountry(UndirectedData,airportsCompleteData)
FinalNode = airportsCompleteData.merge(NumberOfCountrybyAirport ,left_on='Source airport ID',right_on='Source airport ID_x')




# Ecriture du csv qui servira pour la partie visu en Javascript ensuite
print "Ecriture des csv"
FinalNode.to_csv(NodecsvOutputFilename)
FinalLink.to_csv(LinkcsvOutputFilename)


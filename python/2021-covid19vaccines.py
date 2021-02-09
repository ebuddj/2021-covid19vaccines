#!/usr/bin/python
# -*- coding: UTF8 -*-
# @See http://www.python.org/dev/peps/pep-0263/

#######
# ABOUT
#######

# Fire location analysis

########
# AUTHOR
########

# Teemo Tebest (teemo.tebest@gmail.com)

#########
# LICENSE
#########

# CC-BY-SA 4.0 EBU / Teemo Tebest

#######
# USAGE
#######

# python 2021-covid19vaccines.py

# Load the Pandas libraries with alias pd.
import pandas as pd

# Import glob for reading files.
import glob

# Read the file and filter columns.
f = '../data/owid-covid-data.csv'
df = pd.read_csv(f, usecols=['continent','location','date','total_vaccinations_per_hundred'])

# Filter data by row values.
df = (df[(df['date'] > '2020-12-24') & (df['continent'] == 'Europe')])

# Convert NaN to None
# https://stackoverflow.com/questions/28639953/python-json-encoder-convert-nans-to-null-instead/34467382#34467382
df = df.where(pd.notnull(df), 0)

# List of ERNO countries
erno_countries = ['Albania','Bosnia and Herzegovina','Bulgaria','Croatia','Hungary','Kosovo','Montenegro','North Macedonia','Romania','Serbia','Slovenia']

# Loop throught the ERNO countries and create data.
data = {}
for erno_country in erno_countries:
  previous_value = 0
  data[erno_country] = {'Province_State':erno_country}
  for index, values in (df[df['location'] == erno_country]).iterrows():
    if values.total_vaccinations_per_hundred != 0:
      previous_value = values.total_vaccinations_per_hundred
      data[erno_country][values.date] = values.total_vaccinations_per_hundred
    else:
      data[erno_country][values.date] = previous_value

# Export data.
import json
data = {'vaccinated':data}
with open('../media/data/data.json', 'w') as outfile:
  json.dump(data, outfile)

# Group the number of fires per year and month.
# https://stackoverflow.com/questions/52182967/python-pandas-group-by-date-and-count
# df1 = df.groupby([df['date'].dt.year.rename('year'), df['date'].dt.month.rename('month')]).size().reset_index(name='Count')

# https://datatofish.com/export-dataframe-to-csv/
# df1.to_csv(r'export.csv')

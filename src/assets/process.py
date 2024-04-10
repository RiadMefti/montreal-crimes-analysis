import json
import csv

neighborhoods = {}

with open('montreal_population_by_density.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    data = list(reader)

    # first row contains column names second populaiton and third density
    for i in range(3, len(data[0])):
        neighborhoods[data[0][i]] = {
            'name': data[0][i],
            'population': float(data[1][i]),
            'density': float(data[2][i]),
            'singleparent_nb': float(data[3][i]),
            'singleparent_pct': float(data[4][i]),
            'avg_age': float(data[5][i]),
            'median_age': float(data[6][i]),
            'no_diploma_nb': float(data[7][i]),
            'no_diploma_pct': float(data[8][i]),
            'highschool_diploma_nb': float(data[9][i]),
            'highschool_diploma_pct': float(data[10][i]),
            'median_income': float(data[11][i]),
            'unemployment_rate': float(data[12][i]),
            'C90_C10_ratio': float(data[13][i]),
            'Gini_index': float(data[14][i]),
            'total_crime': 0,
            'crime_rate': 0,
        }

with open('actes-criminels.json', 'r', encoding='utf-8') as f:
    crimes = json.load(f)

for crime in crimes:
    if crime["DATE"].startswith("2021") and "ARRONDISSEMENT" in crime:
        neighborhoods[crime["ARRONDISSEMENT"]]['total_crime'] += 1

for name, value in neighborhoods.items():
    value['crime_rate'] = value['total_crime'] / value['population'] * 100000

with open('neighborhood_data.json', 'w', encoding='utf-8') as f:
    json.dump(list(neighborhoods.values()), f, ensure_ascii=False, indent=4)

    




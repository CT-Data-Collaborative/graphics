import csv, json, geocoder, datetime, time

formationTypes = [
    "ORGANIZATION",
    "INCORPORATION",
    "INCORPORATED-B"
]

organizationTypes = [
    "ORG REPORT",
]

conversionTypes = [
    "CONVERSION-B",
    "ELECT B-STATUS"
]

structureTypes = {
    "CIS" : "Domestic Stock Corporation",
    "LC" : "Domestic LLC",
    "BCORP" : "Domestic Benefit Corporation"
}

with open("bcorp-papertrail.csv", "r") as dataFile:
    csvReader = csv.DictReader(dataFile)
    raw = [{k: (row[k]).strip() for k in row.keys()} for row in csvReader]

dataObj = {}

for id in set([row["id_bus"] for row in raw]):
    dataObj[id] = {
        "name" : False,
        "formation" : False,
        "organization" : False,
        "conversion" : False,
        "address" : False
    }

# formation values
for formation in [row for row in raw if row["tx_certif"] in formationTypes]:
    # dataObj[formation["id_bus"]]["name"] = formation["nm_name"].title()
    dataObj[formation["id_bus"]]["name"] = formation["nm_name"]

    dataObj[formation["id_bus"]]["formation"] = {
        "type" : structureTypes[formation["cd_trans_type"]],
        "date" : datetime.datetime.strptime(formation["tm_filing"], "%Y%m%d").strftime("%b %d, %Y")
    }

    # address
    if formation["ad_zip5"] == "":
        dataObj[formation["id_bus"]]["address"] = False
    else:
        dataObj[formation["id_bus"]]["address"] = {
            "street1" : formation["ad_str1"].title(),
            "street2" : formation["ad_str2"].title(),
            "street3" : formation["ad_str3"].title(),
            "city" : formation["ad_city"].title(),
            "zip" : formation["ad_zip5"],
            "state" : formation["ad_st"]
        }
        # geocode address
        geoAddress = [
            dataObj[formation["id_bus"]]["address"]["street1"]
        ]

        if dataObj[formation["id_bus"]]["address"]["street2"] != "":
            geoAddress.append(dataObj[formation["id_bus"]]["address"]["street2"])

        if dataObj[formation["id_bus"]]["address"]["street3"] != "":
            geoAddress.append(dataObj[formation["id_bus"]]["address"]["street3"])

        geoAddress +=[
            dataObj[formation["id_bus"]]["address"]["city"],
            dataObj[formation["id_bus"]]["address"]["state"],
            dataObj[formation["id_bus"]]["address"]["zip"]
        ]

        # print(geoAddress)
        geoAddress = ",".join(geoAddress)
        # print(geoAddress)
        # geocoder values
        geocode = geocoder.google(geoAddress)
        time.sleep(1)
        # print(geocode.latlng)
        dataObj[formation["id_bus"]]["address"]["geocode"] = geocode.latlng

# organization values
for organization in [row for row in raw if row["tx_certif"] in organizationTypes]:
    dataObj[organization["id_bus"]]["organization"] = {
        "date" : datetime.datetime.strptime(organization["tm_filing"], "%Y%m%d").strftime("%b %d, %Y")
    }

# conversion values
for conversion in [row for row in raw if row["tx_certif"] in conversionTypes]:
    dataObj[conversion["id_bus"]]["conversion"] = {
        "date" : datetime.datetime.strptime(conversion["tm_filing"], "%Y%m%d").strftime("%b %d, %Y")
    }

# convert object to list of objects - ditch business ID's
data = []

for id in dataObj:
    data.append(dataObj[id])

with open("dataObject.json", "w") as outputFile:
    json.dump(dataObj, outputFile)

with open("data.json", "w") as outputFile:
    json.dump(data, outputFile)
library(data.table)
library(reshape2)
library(stringr)

# get town fips - used later
fips <- fread(
    file.path(getOption("common_path"), "Geography", "town_fips.csv")
)

# OFA FY 2014 data
ofa <- fread(
    "raw/grants-ofa.csv"
)

setnames(ofa, c("Town", "Category", "Grant", "Value"))

ofa[, `:=`(
    Category = NULL,
    Year = "2014"
)]

ofa <- ofa[
    Grant %in% c(
        "Colleges &amp; Hospitals PILOT",
        "State Property PILOT",
        "Town Aid Road",
        "Disability Exemption",
        "Elderly Circuit Breaker",
        "Elderly Freeze",
        "LoCIP",
        "Veterans' Exemption",
        "Pequot Grants",
        "DECD PILOT Grant",
        "DECD Tax Abatement"
    )
]

# ofa now has all 2014 data

# Gather 2015 data from various sources
# socrata data
socrata <- fread(
    "raw/grants-socrata.csv"
)

socrata[,`:=`(
    Town = `Town Name`,
    Grant = `Grant Name`,
    Year = `Grant Year`,
    Value = `Grant Amount`,
    `Town Code` = NULL,
    `Town Name` = NULL,
    `Grant Name` = NULL,
    `Grant Year` = NULL,
    `Grant Amount` = NULL
)]


socrata <- socrata[Year == 2015]

socrata <- socrata[
    `Grant` %in% c(
        "TOTALLY DISABLED",
        "ELDERLY HOMEOWNERS",
        "ELDERLY TAX FREEZE",
        "COLLEGES & HOSPITALS PILOT",
        "STATE-OWNED PILOT",
        "MASHANTUCKET PEQUOT & MOHEGAN"
    )
][
    ,
    Grant := switch(
        Grant,
        `TOTALLY DISABLED` = "Disability Exemption",
        `ELDERLY HOMEOWNERS` = "Elderly Circuit Breaker",
        `ELDERLY TAX FREEZE` = "Elderly Freeze",
        `COLLEGES & HOSPITALS PILOT` = "Colleges &amp; Hospitals PILOT",
        `STATE-OWNED PILOT` = "State Property PILOT",
        `MASHANTUCKET PEQUOT & MOHEGAN` = "Pequot Grants"
    ),
    by = Grant
]

# Fix town names so they all match the 169 we use.
townNameFix <- fread("town-fixes-for-socrata.csv")
setkey(townNameFix, Town)
setkey(socrata, Town)
socrata <- townNameFix[socrata]
socrata[
    !is.na(FixedTown),
    Town := FixedTown
]

# Remove extra field, convert values to numeric
socrata[, `:=`(
    FixedTown = NULL,
    Value = as.numeric(gsub("[^0-9.]", "", Value))
)]

# aggregate to 1 town per grant (sum any dupes)
socrata <- socrata[
    ,
    list(
        Value = sum(Value)
    ),
    by = list(Town, Grant, Year)
]
# END socrata data

# comptroller data
comptroller <- fread(
    "raw/grants-comptroller.csv",
    select = c(2, 4, 5)
)

setnames(
    comptroller,
    c(
        "Town",
        "Grant",
        "Value"
    )
)

# Fix town names
comptroller[
    ,
    Town := gsub(
        "town of|city of|borough of|town treasurer",
        "",
        str_to_title(Town),
        ignore.case = T
    )
][
    ,
    Town := str_trim(Town)
]

# Fix town names so they all match the 169 we use.
townNameFix <- fread("town-fixes-for-comptroller.csv")
setkey(townNameFix, Town)
setkey(comptroller, Town)
comptroller <- townNameFix[comptroller]
comptroller[
    !is.na(FixedTown),
    Town := FixedTown
]

# remove extra column, turn values into numeric
comptroller[, `:=`(
    FixedTown = NULL,
    Value = as.numeric(gsub("[^0-9.]", "", Value))
)]

# aggregate any dupes now that we've fixed towns (sum values)
comptroller <- comptroller[
    ,
    list(
        Value = sum(Value)
    ),
    by = list(Town, Grant)
]

# Fix grant name, add year
comptroller[, `:=`(
    Grant = "Veterans' Exemption",
    Year = 2015
)]

# END comptroller data

# TrendCT data
trend <- fread(
    "raw/grants-trendct.csv",
    select = c(1, 11, 14),
    nrows = 169,
    skip=2,
    header = F
)

setnames(trend, c("Town", "Town Aid Road", "LoCIP"))

trend <- melt(
    trend,
    id.vars = c("Town"),
    variable.name = "Grant",
    variable.factor = F,
    value.name = "Value",
    value.factor = F
)

trend[, `:=`(
    Year = 2015
)]
# END TrendCT data

# DECD data
decdAbatement <- fread(
    "raw/decd-tax-abatement-2015.csv",
    select = c(1, 4)
)
setnames(decdAbatement, c("Town", "Value"))
decdAbatement[, `:=`(
    Year = 2015,
    Grant = "DECD Tax Abatement"
)]

decdPilot <- fread(
    "raw/decd-pilot-2015.csv",
    select = c(1, 3)
)
setnames(decdPilot, c("Town", "Value"))
decdPilot[, `:=`(
    Year = 2015,
    Grant = "DECD PILOT Grant"
)]
# END DECD data
data <- rbind(
    ofa,
    socrata,
    comptroller,
    trend,
    decdAbatement,
    decdPilot
)

data[, `:=`(
    Grant = gsub("&amp;", "&", Grant, fixed = T),
    Value = as.numeric(gsub("[^0-9.]", "", Value))
)]

# Backfill towns
backfill <- expand.grid(
    list(
        Town = unique(fips[Town != "Connecticut", Town]),
        Year = c(2014, 2015),
        Grant = unique(data$Grant)
    )
)

data <- merge(
    backfill,
    data,
    all.x = T
)

# NA values are zero
data <- as.data.table(data)
data[
    is.na(Value),
    Value := 0
]

# Add connecticut total

ct <- data[
    ,
    list(
        Town = "Connecticut",
        Value = sum(Value)
    ),
    by = list(Year, Grant)
]
data <- rbind(data, ct)

# Create value of grant=total for town/year
totals <- data[
    ,
    list(
        Grant = "Total",
        Value = sum(Value)
    ),
    by = list(Town, Year)
]

data <- rbind(data, totals)

# create and write wide dataset
wide <- dcast.data.table(data, Town + Grant ~ Year, value.var = "Value", verbose=T)
write.table(wide, "wide-grant-data.csv", sep = ",", row.names = F)

# join FIPS for long data set
setkey(fips, Town)
setkey(data, Town)
data <- fips[data]

# Write to File
write.table(
    data,
    file.path("grants.csv"),
    sep = ",",
    row.names = F,
    na = "-9999"
)

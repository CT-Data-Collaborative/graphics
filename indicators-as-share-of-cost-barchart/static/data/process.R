library(data.table)

data <- fread(
    "data-with-cogs.csv",
    colClasses = c(
        rep_len("character", 3),
        rep_len("numeric", 12)
    )
)

data[,`:=`(
    # Convert all measures to numeric
    `Unemployment Rate (%)` = as.numeric(`Unemployment Rate (%)`),
    `Population Density (000s per square mile)` = as.numeric(`Population Density (000s per square mile)`),
    `Private-Sector Wage Index (%)` = as.numeric(`Private-Sector Wage Index (%)`),
    `Town Maintenance Road Mileage (per 000 population)` = as.numeric(`Town Maintenance Road Mileage (per 000 population)`),
    `Total Jobs (per capita)` = as.numeric(`Total Jobs (per capita)`)
)][
    , # Calculate a total for denominator that disregards constant in original equation
    `Total Cost` := sum(
        c(
            24.80 * `Unemployment Rate (%)`,
            36.48 * `Population Density (000s per square mile)`,
            6.66 * `Private-Sector Wage Index (%)`,
            6.73 * `Town Maintenance Road Mileage (per 000 population)`,
            217.92 * `Total Jobs (per capita)`
        )
    ),
    by = Municipality
][,`:=`(
    # calculate each measure's share of the above total
    `Unemployment Rate (%)` = (24.80 * `Unemployment Rate (%)`)/`Total Cost`,
    `Population Density (000s per square mile)` = (36.48 * `Population Density (000s per square mile)`)/`Total Cost`,
    `Private-Sector Wage Index (%)` = (6.66 * `Private-Sector Wage Index (%)`)/`Total Cost`,
    `Town Maintenance Road Mileage (per 000 population)` = (6.73 * `Town Maintenance Road Mileage (per 000 population)`)/`Total Cost`,
    `Total Jobs (per capita)` = (217.92 * `Total Jobs (per capita)`)/`Total Cost`
)][,`:=`(
    # multiply by 100, round each share to 2 decimal places
    `Unemployment Rate (%)` = round(100*`Unemployment Rate (%)`, 2),
    `Population Density (000s per square mile)` = round(100*`Population Density (000s per square mile)`, 2),
    `Private-Sector Wage Index (%)` = round(100*`Private-Sector Wage Index (%)`, 2),
    `Town Maintenance Road Mileage (per 000 population)` = round(100*`Town Maintenance Road Mileage (per 000 population)`, 2),
    `Total Jobs (per capita)` = round(100*`Total Jobs (per capita)`, 2)
)]

data <- data[
    ,
    list(
        Municipality,
        `Planning Region`,
        `Municipality Type`,
        `Unemployment Rate (%)`,
        `Population Density (000s per square mile)`,
        `Private-Sector Wage Index (%)`,
        `Town Maintenance Road Mileage (per 000 population)`,
        `Total Jobs (per capita)`
    )
]

# Write to File
write.table(
    data,
    "indicator-share-with-cogs.csv",
    sep = ",",
    row.names = F,
    na = "-9999"
)
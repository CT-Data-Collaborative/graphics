library(data.table)

data <- fread(
    "cogs-real-values.csv",
    colClasses = c(
        rep_len("character", 3),
        rep_len("numeric", 10)
    )
)

data <- data[
    ,
    list(
        `Municipal Capacity` = sum(`Municipal Capacity`),
        `Municipal Cost` = sum(`Municipal Cost`),
        `Municipal Gap` = sum(`Municipal Gap`),
        `State Nonschool Grants` = sum(`State Nonschool Grants`)
    ),
    by = `Planning Region`
]

data[, `:=`(
    `Gap After Grants` = `Municipal Gap`+`State Nonschool Grants`,
    `% of Gap filled by Grants` = round(100*abs(`State Nonschool Grants`/`Municipal Gap`), 2)
)]

# make these values NA, since it doesn't make sense to measure a % of a surplus in this context?
data[
    `Municipal Gap` > 0,
    `% of Gap filled by Grants` := NA_integer_
]

# Write to File
write.table(
    data,
    "agg-data.csv",
    sep = ",",
    row.names = F,
    na = "NA"
)
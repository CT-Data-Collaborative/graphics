library(data.table)
library(reshape2)
library(stringr)

data <- fread(
    "municipal-grand-list.csv"
)

data <- data[
    Variable == "Equalized Net Grand List"
][
    ,
    c(1,3,6),
    with = F
]

setnames(data, "Town", "Municipality")

data <- dcast(data, Municipality ~ Year)

data <- as.data.table(data)

# Write to File for posterity
write.table(
    data,
    "engl-by-fiscal-year-all.csv",
    sep = ",",
    row.names = F,
    na = "-9999"
)

data[
    ,
    `ENGL AAGR '11-'14` := 100 * mean(
        c(
            (`SFY 2011-2012` - `SFY 2010-2011`)/`SFY 2010-2011`,
            (`SFY 2012-2013` - `SFY 2011-2012`)/`SFY 2011-2012`,
            (`SFY 2013-2014` - `SFY 2012-2013`)/`SFY 2012-2013`
        )
    ),
    by = Municipality
]

data <- data[
    ,
    list(
        Municipality,
        `ENGL AAGR '11-'14`
    )
]


appendix <- fread("NEPPC-appendix-table-1.csv", select=c("Municipality", "Municipal Gap($ per capita)"))
cogs <- fread("cogs.csv", select=1:2)
setnames(cogs, "TOWN", "Municipality")

appendix[
    ,
    `Municipal Gap($ per capita)` := -1 * as.numeric(`Municipal Gap($ per capita)`)
]

setkey(data, Municipality)
setkey(appendix, Municipality)
setkey(cogs, Municipality)

data <- cogs[appendix][data][order(-`Municipal Gap($ per capita)`)]
data[
    ,
    Rank := 1:.N
]

setcolorder(data, c(1, 2, 5, 3, 4))

write.table(data, "gap-and-engl-trends.csv", sep=",", row.names=F)

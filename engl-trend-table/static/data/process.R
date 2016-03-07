library(data.table)
library(stringr)

data <- fread(
    "engl-by-fiscal-year.csv",
    select=c(1,3,6)
)

setnames(data, "Location", "Municipality")

data[, `:=`(
    `SFY 2010-2011` = as.numeric(str_replace_all(`SFY 2010-2011`, "[^0-9]", "")),
    `SFY 2013-2014` = as.numeric(str_replace_all(`SFY 2013-2014`, "[^0-9]", ""))
)]

data[
    ,
    `ENGL '09 vs '12` := round(100 * (`SFY 2010-2011`-`SFY 2013-2014`)/`SFY 2010-2011`, 1),
    by = Municipality
]

data[, `:=`(
    `SFY 2010-2011` = NULL,
    `SFY 2013-2014` = NULL
)]

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

write.table(cogs[appendix][data], "gap-and-engl-trends.csv", sep=",", row.names=F)

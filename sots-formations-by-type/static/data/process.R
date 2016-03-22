library(data.table)
library(reshape2)

data <- fread("formations-by-id.csv")

data[,
     Type := switch(
         type,
         CORP = "Corporation",
         LLC = "LLC",
         "Other"
     ),
     by = type
 ]

data <- data[, .N, by = list(year, Type)][between(year, 1992, 2015)]

data[, `:=`(
    Year = year,
    Value = N,
    year = NULL,
    N = NULL
)]

backfill <- expand.grid(
    Year <- unique(data$Year),
    Type <- unique(data$Type)
)

setkey(data, Year, Type)
data <- data[backfill]
data <- as.data.table(data)
data[is.na(Value), Value := 0]

data <- dcast(data, Year ~ Type)

# ggplot(data, aes(x = Year, y = Value, color = Type)) + geom_line()

write.table(
    data,
    "formations-by-type-by-year.csv",
    sep=",",
    row.names=F
)

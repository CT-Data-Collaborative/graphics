library(data.table)
library(gtools)

data <- fread("gaps-grants-populations.csv")

data[, quintile:=quantcut(data$`Municipal Gap`, q=seq(0, 1, 0.2), labels=1:5)]

write.table(
    data,
    "data.csv",
    sep = ",",
    row.names = F
)

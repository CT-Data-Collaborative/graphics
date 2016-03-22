SELECT
    filing.id_bus,
    tx.type,
    EXTRACT(YEAR FROM to_date(filing.dt_filing, 'YYYYMMDD')) AS year
FROM
    bus_filing AS filing
    JOIN tx_codes AS tx ON tx.cd_trans_type = filing.cd_trans_type
WHERE
    filing.cd_trans_type IN ('BCORP','BN','BS','CFAN','CFAS','CICUN','CIN','CIS','GP','IN','IS','LC','LCF','LLP','LLPF','LP','LPF','ST','STF')
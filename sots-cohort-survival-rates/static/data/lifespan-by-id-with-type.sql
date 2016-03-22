SELECT
    master.id_bus,
    formations.type,
    -- ARRAY_AGG(DISTINCT formations.year) AS formation,
    MIN(DISTINCT formations.year) AS formation,
    -- ARRAY_AGG(DISTINCT dissolutions.year) AS dissolution
    MAX(DISTINCT dissolutions.year) AS dissolution
FROM
    bus_master AS master
    JOIN (
        SELECT
            id_bus,
            tx.type AS type,
            EXTRACT(YEAR FROM to_date(dt_filing, 'YYYYMMDD')) AS year
        FROM
            bus_filing AS filing
            JOIN tx_codes AS tx ON tx.cd_trans_type = filing.cd_trans_type
        WHERE
            filing.cd_trans_type IN ('BCORP','BN','BS','CFAN','CFAS','CICUN','CIN','CIS','GP','IN','IS','LC','LCF','LLP','LLPF','LP','LPF','ST','STF')
    ) AS formations ON formations.id_bus = master.id_bus
    LEFT JOIN (
        SELECT
            id_bus,
            EXTRACT(YEAR FROM to_date(dt_filing, 'YYYYMMDD')) AS year
        FROM
            bus_filing
        WHERE
            cd_trans_type IN ('CDRN','CDRNNR','CDRS','CDRSNR','CFWN','CFWS','GPC','GPDIS','GPDISA','LCD','LCFC','LLPFW','LPC','LPFC','STC','STFC')
    ) AS dissolutions ON dissolutions.id_bus = master.id_bus
GROUP BY
    master.id_bus,
    formations.type
ORDER BY
    master.id_bus DESC
LIMIT    100
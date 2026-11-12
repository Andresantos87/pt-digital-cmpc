-- Consultas de Referência BigQuery (CMPC Mi Fibra / CSOD)
-- Projeto: cmpc-all-mof-prod
-- Dataset: 00_personas_corp_datalake_transform
--
-- ATENÇÃO: Não usar SELECT * em vw_csod_vwrptuser por causa das Policy Tags de PII
-- (user_email, user_login, user_phone_mobile, user_id, user_ref).

-- 1. Busca de Empregado Próprio Ativo por CPF (BRA) ou RUT (CHL)
SELECT
  TRIM(CONCAT(COALESCE(u.user_name_first, ''), ' ', COALESCE(u.user_name_last, ''))) AS nome_completo,
  u.user_country,
  u.user_vat_number AS documento_fiscal,
  u.user_company_no AS empresa_cmpc,
  u.user_local_system_id AS matricula_rh,
  TRIM(CONCAT(COALESCE(u.user_mgr_name_first, ''), ' ', COALESCE(u.user_mgr_name_last, ''))) AS lider_imediato
FROM `cmpc-all-mof-prod.00_personas_corp_datalake_transform.vw_csod_vwrptuser` u
WHERE u.user_status_id = 1
  AND u.user_country IN ('BRA', 'CHL')
  AND UPPER(REGEXP_REPLACE(CAST(u.user_vat_number AS STRING), r'[^0-9kK]', '')) = @documentoLimpo
LIMIT 1;

-- 2. Tabelas de Terceiros (Rainbow BR / SAT CL)
-- Brasil (Rainbow): cmpc-all-mof-prod.cmpc_all_data_integration_pt_digital.cmpc_all_pt_digital_rainbow_workers
-- Chile (SAT):      cmpc-all-mof-prod.cmpc_all_data_integration_pt_digital.cmpc_all_pt_digital_sat_contratista

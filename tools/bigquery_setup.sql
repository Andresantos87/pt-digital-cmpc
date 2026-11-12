-- Exemplo de View/Query no BigQuery para padronizar as credenciais de Guaíba (CPF) e Santa Fe (RUT)
-- Caso sua tabela já exista, você pode apontar diretamente para ela em backend-apps-script/Code.gs
-- ou criar uma VIEW unificada como esta abaixo:

CREATE OR REPLACE VIEW `SEU-PROJETO-GCP.SEU_DATASET.vw_credenciais_pt_digital` AS
SELECT
  UPPER(REGEXP_REPLACE(CAST(documento AS STRING), r'[^0-9kK]', '')) AS cpf_rut,
  TRIM(nome_completo) AS nome_completo,
  TRIM(empresa_prestadora) AS empresa,
  LOWER(TRIM(planta)) AS planta -- 'guaiba' ou 'santafe'
FROM `SEU-PROJETO-GCP.SEU_DATASET.SUA_TABELA_ORIGEM`
WHERE documento IS NOT NULL;

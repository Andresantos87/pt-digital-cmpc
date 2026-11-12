/**
 * Catálogo de Módulos e Vídeos do Treinamento PT Digital
 * ======================================================
 * Cada módulo pode conter 1 vídeo ou um grupo de vídeos.
 * Quando TODOS os vídeos de um módulo são assistidos, o módulo recebe automaticamente o Check ✓.
 *
 * Tipos de vídeo suportados (`type`):
 * - "youtube": coloque o ID do vídeo do YouTube Não Listado em `src` (ex: "dQw4w9WgXcQ")
 * - "mp4":     coloque a URL direta ou caminho relativo do .mp4 em `src` (ex: "videos/aula1.mp4")
 * - "gdrive":  coloque o ID do arquivo no Google Drive em `src`
 * - "demo":    modo simulação para testes antes de subir os vídeos finais
 *
 * Filtro por planta (`plant`):
 * - "all"     -> aparece em Guaíba e Santa Fe
 * - "guaiba"  -> aparece somente para Guaíba
 * - "santafe" -> aparece somente para Santa Fe
 */
window.PT_MODULES = [
  {
    id: "mod-1",
    order: 1,
    plant: "all",
    title: {
      pt: "Módulo 1: Acesso ao Sistema e Abertura da PT",
      es: "Módulo 1: Acceso al Sistema y Apertura del PT",
    },
    description: {
      pt: "Lista de permissões, inclusão de Ordem de Manutenção (OM), número da AST e salvamento em rascunho.",
      es: "Lista de permisos, ingreso de Orden de Mantenimiento (OM), número de AST y guardado en borrador.",
    },
    videos: [
      {
        id: "vid-1-1",
        title: {
          pt: "1.1 Visão Geral e Acesso à Plataforma PT Digital",
          es: "1.1 Visión General y Acceso a la Plataforma PT Digital",
        },
        durationLabel: "03:30",
        type: "demo",
        src: "",
        summary: {
          pt: "Como acessar a plataforma, visualizar permissões ativas e iniciar uma nova Permissão de Trabalho.",
          es: "Cómo ingresar a la plataforma, visualizar permisos activos e iniciar un nuevo Permiso de Trabajo.",
        },
      },
      {
        id: "vid-1-2",
        title: {
          pt: "1.2 Inserir OM, AST Manual e Salvar Rascunho",
          es: "1.2 Ingresar OM, AST Manual y Guardar Borrador",
        },
        durationLabel: "04:15",
        type: "demo",
        src: "",
        summary: {
          pt: "Autocompletado da Ordem de Manutenção (OM), preenchimento da AST impressa e salvamento inicial em rascunho.",
          es: "Autocompletado de la Orden de Mantenimiento (OM), ingreso de AST impresa y guardado inicial en borrador.",
        },
      },
    ],
  },
  {
    id: "mod-2",
    order: 2,
    plant: "all",
    title: {
      pt: "Módulo 2: Análise de Riscos, Ação Operática e EPIs",
      es: "Módulo 2: Análisis de Riesgos, Acción Operativa y EPP",
    },
    description: {
      pt: "Identificação de riscos, medidas de controle automáticas, passos operacionais e seleção de EPIs/EPPs.",
      es: "Identificación de riesgos, medidas de control automáticas, pasos operativos y selección de EPP.",
    },
    videos: [
      {
        id: "vid-2-1",
        title: {
          pt: "2.1 Análise de Riscos e Medidas de Controle",
          es: "2.1 Análisis de Riesgos y Medidas de Control",
        },
        durationLabel: "05:00",
        type: "demo",
        src: "",
        summary: {
          pt: "Seleção de riscos da atividade, validação de medidas de controle automáticas e registro de imprevistos.",
          es: "Selección de riesgos de la actividad, validación de medidas de control automáticas y registro de imprevistos.",
        },
      },
      {
        id: "vid-2-2",
        title: {
          pt: "2.2 Checklists, Tipo de Trabalho e Seleção de EPIs",
          es: "2.2 Checklists, Tipo de Trabajo y Selección de EPP",
        },
        durationLabel: "04:10",
        type: "demo",
        src: "",
        summary: {
          pt: "Definição do tipo de trabalho (altura, quente, espaço confinado, etc.) e conferência dos EPIs obrigatórios.",
          es: "Definición del tipo de trabajo (altura, caliente, espacio confinado, etc.) y verificación de EPP obligatorios.",
        },
      },
    ],
  },
  {
    id: "mod-3",
    order: 3,
    plant: "all",
    title: {
      pt: "Módulo 3: Avaliação do Entorno, Interações e Medição de Gases",
      es: "Módulo 3: Evaluación del Entorno, Interacciones y Medición de Gases",
    },
    description: {
      pt: "Avaliação do ambiente, registro de trabalhos simultâneos e parâmetros de medição de gases.",
      es: "Evaluación del entorno, registro de trabajos simultáneos y parámetros de medición de gases.",
    },
    videos: [
      {
        id: "vid-3-1",
        title: {
          pt: "3.1 Avaliação do Entorno e Interações com Outros Trabalhos",
          es: "3.1 Evaluación del Entorno e Interacciones con Otros Trabajos",
        },
        durationLabel: "03:45",
        type: "demo",
        src: "",
        summary: {
          pt: "Como usar o painel lateral para registrar interferências e interações com atividades próximas.",
          es: "Cómo usar el panel lateral para registrar interferencias e interacciones con actividades cercanas.",
        },
      },
      {
        id: "vid-3-2",
        title: {
          pt: "3.2 Medições e Registro de Parâmetros de Gases",
          es: "3.2 Mediciones y Registro de Parámetros de Gases",
        },
        durationLabel: "04:40",
        type: "demo",
        src: "",
        summary: {
          pt: "Diferença entre parâmetro Conforme (OK) e Não Conforme (NO OK) e bloqueios de segurança.",
          es: "Diferencia entre parámetro Conforme (OK) y No Conforme (NO OK) y bloqueos de seguridad.",
        },
      },
    ],
  },
  {
    id: "mod-4",
    order: 4,
    plant: "all",
    title: {
      pt: "Módulo 4: Assinatura Digital, Renovação e Encerramento",
      es: "Módulo 4: Firma Digital, Renovación y Cierre del PT",
    },
    description: {
      pt: "Validação com assinatura dos responsáveis, renovação de turno e encerramento oficial da PT.",
      es: "Validación con firma de los responsables, renovación de turno y cierre oficial del PT.",
    },
    videos: [
      {
        id: "vid-4-1",
        title: {
          pt: "4.1 Assinatura (Firma), Renovação e Encerramento da PT",
          es: "4.1 Firma Digital, Renovación y Cierre del PT",
        },
        durationLabel: "03:55",
        type: "demo",
        src: "",
        summary: {
          pt: "Coleta de assinaturas no campo, procedimento de renovação entre turnos e encerramento final da PT.",
          es: "Toma de firmas en terreno, procedimiento de renovación entre turnos y cierre final del PT.",
        },
      },
    ],
  },
];

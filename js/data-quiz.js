/**
 * Banco de Questões da Avaliação Final (10 Perguntas Bilíngues: PT-BR e ES-CL)
 * `correctIndex` indica o índice da alternativa correta (0 a 3).
 */
window.PT_QUIZ = [
  {
    id: "q1",
    question: {
      pt: "Qual é o objetivo principal da Permissão de Trabalho Digital (PT Digital)?",
      es: "¿Cuál es el objetivo principal del Permiso de Trabajo Digital (PT Digital)?",
    },
    options: {
      pt: [
        "Substituir o uso de EPIs nas áreas operacionais.",
        "Autorizar atividades específicas garantindo segurança, identificação de riscos, medidas de controle e assinaturas.",
        "Servir apenas como ponto eletrônico de entrada na fábrica.",
        "Dispensar a realização da Análise de Riscos antes do serviço.",
      ],
      es: [
        "Reemplazar el uso de EPP en las áreas operativas.",
        "Autorizar actividades específicas asegurando control de riesgos, medidas preventivas y firmas responsables.",
        "Servir únicamente como registro de asistencia al ingresar a la planta.",
        "Evitar realizar el análisis de riesgos antes de iniciar la tarea.",
      ],
    },
    correctIndex: 1,
  },
  {
    id: "q2",
    question: {
      pt: "Ao criar uma nova PT e inserir a Ordem de Manutenção (OM) e o número da AST, qual é o status inicial ao salvar?",
      es: "Al crear un nuevo PT e ingresar la Orden de Mantenimiento (OM) y el número de AST, ¿en qué estado inicial se guarda?",
    },
    options: {
      pt: [
        "Encerrada automaticamente.",
        "Liberada para execução imediata sem validação.",
        "Salva como Rascunho para preenchimento das etapas passo a passo.",
        "Cancelada até o turno seguinte.",
      ],
      es: [
        "Cerrado automáticamente.",
        "Aprobado para ejecución inmediata sin validación.",
        "Guardado como Borrador para completar las etapas paso a paso.",
        "Anulado hasta el próximo turno.",
      ],
    },
    correctIndex: 2,
  },
  {
    id: "q3",
    question: {
      pt: "Na etapa de AST (Análise de Segurança do Trabalho), o que deve ser incluído quando utilizada a AST física/impressa?",
      es: "En la etapa de AST (Análisis Seguro de Trabajo), ¿qué se debe incluir cuando se utiliza una AST impresa?",
    },
    options: {
      pt: [
        "Registrar a etapa/número da AST impressa vinculada à PT.",
        "Descartar a AST antes de iniciar o serviço.",
        "Deixar o campo em branco para preenchimento após o término.",
        "Inserir apenas o nome da empresa terceirizada.",
      ],
      es: [
        "Registrar la etapa/número de la AST impresa vinculada al PT.",
        "Desechar la AST antes de iniciar la tarea.",
        "Dejar el campo vacío para completarlo al finalizar.",
        "Ingresar solo el nombre de la empresa contratista.",
      ],
    },
    correctIndex: 0,
  },
  {
    id: "q4",
    question: {
      pt: "Como funciona a etapa de Análise de Riscos dentro da PT Digital?",
      es: "¿Cómo funciona la etapa de Análisis de Riesgos dentro del PT Digital?",
    },
    options: {
      pt: [
        "O executante não precisa selecionar riscos, pois o sistema libera tudo automaticamente.",
        "Ao selecionar os potenciais riscos da tarefa, o sistema sugere/vincula as medidas de controle correspondentes.",
        "Apenas riscos ergonômicos podem ser cadastrados.",
        "É opcional e só deve ser preenchida em caso de acidente.",
      ],
      es: [
        "El ejecutante no necesita seleccionar riesgos, ya que el sistema libera todo automáticamente.",
        "Al seleccionar los riesgos potenciales de la tarea, el sistema asocia las medidas de control correspondientes.",
        "Solo se pueden registrar riesgos ergonómicos.",
        "Es opcional y solo se completa si ocurre un incidente.",
      ],
    },
    correctIndex: 1,
  },
  {
    id: "q5",
    question: {
      pt: "Na etapa de 'Ação Operática + Imprevistos', o que deve ser registrado?",
      es: "En la etapa de 'Acción Operativa + Imprevistos', ¿qué se debe registrar?",
    },
    options: {
      pt: [
        "Somente o horário de almoço da equipe.",
        "Os passos operacionais da atividade e eventuais imprevistos identificados durante o planejamento/execução.",
        "Apenas os dados bancários da contratada.",
        "Somente o número da nota fiscal dos equipamentos.",
      ],
      es: [
        "Solo el horario de colación del equipo.",
        "Los pasos operativos de la actividad y posibles imprevistos detectados durante la planificación o ejecución.",
        "Solo los datos administrativos del contrato.",
        "Únicamente la patente de los vehículos.",
      ],
    },
    correctIndex: 1,
  },
  {
    id: "q6",
    question: {
      pt: "Sobre a seleção de Tipo de Trabalho e Checklists de EPIs/EPPs, qual afirmação é verdadeira?",
      es: "Respecto a la selección del Tipo de Trabajo y Checklists de EPP, ¿qué afirmación es correcta?",
    },
    options: {
      pt: [
        "A escolha do tipo de trabalho define checklists e EPIs específicos que devem ser verificados antes da liberação.",
        "Os checklists podem ser marcados mesmo sem os EPIs estarem no local.",
        "EPIs obrigatórios são dispensados quando a PT é digital.",
        "Qualquer pessoa pode aprovar a PT sem conferir o checklist.",
      ],
      es: [
        "La selección del tipo de trabajo define checklists y EPP específicos que deben verificarse antes de la liberación.",
        "Los checklists se pueden marcar aunque los EPP no estén en terreno.",
        "Los EPP obligatorios no aplican cuando el PT es digital.",
        "Cualquier persona puede aprobar el PT sin revisar el checklist.",
      ],
    },
    correctIndex: 0,
  },
  {
    id: "q7",
    question: {
      pt: "Para que serve a etapa de 'Avaliação do Entorno' e o painel lateral de 'Interação com outros trabalhos'?",
      es: "¿Para qué sirve la etapa de 'Evaluación del Entorno' y el panel lateral de 'Interacción con otros trabajos'?",
    },
    options: {
      pt: [
        "Para cadastrar novos usuários no BigQuery.",
        "Para avaliar o ambiente ao redor e registrar interferências com outras atividades simultâneas na mesma área.",
        "Para solicitar vale-alimentação para a equipe.",
        "Para alterar o idioma da plataforma.",
      ],
      es: [
        "Para crear nuevos usuarios en BigQuery.",
        "Para evaluar el entorno de trabajo y registrar interferencias con otras faenas simultáneas en la misma área.",
        "Para solicitar alimentación para la cuadrilla.",
        "Para cambiar el idioma de la plataforma.",
      ],
    },
    correctIndex: 1,
  },
  {
    id: "q8",
    question: {
      pt: "Durante a etapa de Medições (ex.: medição de gases), o que deve ser feito se um parâmetro indicar 'NO OK' (fora do limite seguro)?",
      es: "Durante la etapa de Mediciones (ej. medición de gases), ¿qué se debe hacer si un parámetro resulta 'NO OK' (fuera del límite seguro)?",
    },
    options: {
      pt: [
        "Iniciar o trabalho rapidamente para terminar antes que piore.",
        "Ignorar o alarme do medidor e digitar um valor fictício.",
        "Não iniciar/interromper a atividade, adotar medidas de controle/ventilação e só prosseguir quando os parâmetros estiverem OK.",
        "Assinar a PT mesmo assim e avisar apenas no fim do dia.",
      ],
      es: [
        "Iniciar el trabajo rápido para terminar antes de que empeore.",
        "Ignorar la alarma del equipo e ingresar un valor ficticio.",
        "No iniciar o detener la actividad, aplicar medidas de control/ventilación y continuar solo cuando los parámetros estén OK.",
        "Firmar el PT de todas formas y avisar al final de la jornada.",
      ],
    },
    correctIndex: 2,
  },
  {
    id: "q9",
    question: {
      pt: "Quem deve validar a PT na etapa de Assinatura (Firma) antes do início da execução?",
      es: "¿Quién debe validar el PT en la etapa de Firma antes de comenzar la ejecución?",
    },
    options: {
      pt: [
        "Apenas o vigia da portaria.",
        "Os responsáveis autorizados (emissor/operador da área e executante/supervisor), confirmando que todas as condições são seguras.",
        "Somente o setor de compras.",
        "Não é necessária nenhuma assinatura na versão digital.",
      ],
      es: [
        "Solo el guardia de portería.",
        "Los responsables autorizados (emisor/operador del área y ejecutante/supervisor), confirmando condiciones seguras.",
        "Solo el área de adquisiciones.",
        "No se requiere ninguna firma en la versión digital.",
      ],
    },
    correctIndex: 1,
  },
  {
    id: "q10",
    question: {
      pt: "Ao final da jornada ou conclusão do serviço, qual procedimento é obrigatório na PT Digital?",
      es: "Al finalizar la jornada o concluir el trabajo, ¿qué procedimiento es obligatorio en el PT Digital?",
    },
    options: {
      pt: [
        "Deixar a PT aberta indefinidamente sem registro.",
        "Realizar a Renovação (se o trabalho continuar no próximo turno) ou o Encerramento (Cierre) oficial da PT.",
        "Excluir a Ordem de Manutenção do sistema.",
        "Imprimir o certificado sem finalizar a tarefa.",
      ],
      es: [
        "Dejar el PT abierto indefinidamente sin registro.",
        "Realizar la Renovación (si continúa en el siguiente turno) o el Cierre oficial del PT.",
        "Eliminar la Orden de Mantenimiento del sistema.",
        "Cerrar el navegador sin registrar el término.",
      ],
    },
    correctIndex: 1,
  },
];

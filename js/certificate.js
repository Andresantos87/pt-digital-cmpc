/**
 * Gerador de Certificado PDF (100% Client-Side com jsPDF - Custo Zero)
 */
window.PTCertificate = (function () {
  function generateCode(plant) {
    const prefix = plant === "santafe" ? "SF" : "GUA";
    const year = new Date().getFullYear();
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PTD-${prefix}-${year}-${rand}`;
  }

  function downloadPDF(data) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("Biblioteca jsPDF ainda está carregando. Tente novamente em 2 segundos.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const lang = data.plant === "santafe" ? "es" : "pt";
    const t = window.PT_I18N[lang];

    const pageW = doc.internal.pageSize.getWidth(); // 297mm
    const pageH = doc.internal.pageSize.getHeight(); // 210mm

    // Fundo claro sutil
    doc.setFillColor(248, 251, 249);
    doc.rect(0, 0, pageW, pageH, "F");

    // Moldura externa verde CMPC
    doc.setDrawColor(27, 94, 32);
    doc.setLineWidth(2.2);
    doc.rect(10, 10, pageW - 20, pageH - 20);

    // Moldura interna fina
    doc.setDrawColor(104, 159, 56);
    doc.setLineWidth(0.6);
    doc.rect(14, 14, pageW - 28, pageH - 28);

    // Faixa superior
    doc.setFillColor(27, 94, 32);
    doc.rect(14, 14, pageW - 28, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(t.certHeader, pageW / 2, 27, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`${window.PT_CONFIG.ORGANIZATION_NAME} • ${t.certProgram}`, pageW / 2, 36, { align: "center" });

    // Texto introdutório
    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const introLines = doc.splitTextToSize(t.certBody, pageW - 60);
    doc.text(introLines, pageW / 2, 58, { align: "center" });

    // Nome do colaborador em destaque
    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text((data.name || "").toUpperCase(), pageW / 2, 82, { align: "center" });

    // Linha sob o nome
    doc.setDrawColor(46, 125, 50);
    doc.setLineWidth(0.8);
    doc.line(60, 86, pageW - 60, 86);

    // Caixa de detalhes
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.4);
    doc.roundedRect(28, 95, pageW - 56, 52, 3, 3, "FD");

    const plantLabel = data.plant === "santafe" ? t.santafeName : t.guaibaName;
    const leftX = 36;
    const rightX = 158;
    let y = 107;

    doc.setFontSize(10.5);
    const drawField = (x, label, value, offsetY) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(27, 94, 32);
      doc.text(`${label}:`, x, offsetY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(31, 41, 55);
      doc.text(String(value || "-"), x + 36, offsetY);
    };

    drawField(leftX, t.certFieldDoc, data.docFormatted, y);
    drawField(rightX, t.certFieldPlant, plantLabel, y);

    y += 12;
    drawField(leftX, t.certFieldCompany, data.company, y);
    drawField(rightX, t.certFieldScore, `${data.score}/${data.total} (${data.percent}%)`, y);

    y += 12;
    drawField(leftX, t.certFieldEmail, data.email, y);
    drawField(rightX, t.certFieldDate, data.dateFormatted, y);

    // Módulos concluídos
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(27, 94, 32);
    const modTitle = lang === "es" ? "Módulos aprobados:" : "Módulos concluídos:";
    doc.text(modTitle, 28, 158);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);
    const modNames = (data.modules || []).map((m) => `✓ ${m.title[lang] || m.title.pt}`).join("   |   ");
    const modLines = doc.splitTextToSize(modNames, pageW - 56);
    doc.text(modLines, 28, 164);

    // Rodapé / Assinatura & Código
    doc.setDrawColor(156, 163, 175);
    doc.line(35, 183, 115, 183);
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text(
      lang === "es" ? "Plataforma Digital de Capacitación HSE • CMPC" : "Plataforma Digital de Treinamento HSE • CMPC",
      75,
      188,
      { align: "center" }
    );

    doc.setFont("helvetica", "bold");
    doc.setTextColor(27, 94, 32);
    doc.text(`${t.certFieldCode}: ${data.code}`, pageW - 35, 185, { align: "right" });

    const safeName = (data.name || "certificado")
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_|_$/g, "");
    doc.save(`Certificado_PT_Digital_${safeName}.pdf`);
  }

  return {
    generateCode,
    downloadPDF,
  };
})();

/**
 * Validadores e formatadores de CPF (Brasil) e RUT (Chile)
 */
(function (global) {
  function cleanDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function cleanRUT(value) {
    return String(value || "")
      .replace(/[^0-9kK]/g, "")
      .toUpperCase();
  }

  function formatCPF(value) {
    const d = cleanDigits(value).slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
  }

  function isValidCPF(cpf) {
    const d = cleanDigits(cpf);
    if (d.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(d)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += Number(d[i]) * (10 - i);
    }
    let rem = (sum * 10) % 11;
    if (rem === 10 || rem === 11) rem = 0;
    if (rem !== Number(d[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += Number(d[i]) * (11 - i);
    }
    rem = (sum * 10) % 11;
    if (rem === 10 || rem === 11) rem = 0;
    return rem === Number(d[10]);
  }

  function formatRUT(value) {
    const c = cleanRUT(value).slice(0, 9);
    if (c.length <= 1) return c;
    const body = c.slice(0, -1);
    const dv = c.slice(-1);
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formattedBody}-${dv}`;
  }

  function isValidRUT(rut) {
    const c = cleanRUT(rut);
    if (c.length < 8 || c.length > 9) return false;
    const body = c.slice(0, -1);
    const dv = c.slice(-1);
    if (!/^\d+$/.test(body)) return false;
    if (/^(\d)\1+$/.test(body)) return false;

    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += Number(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const mod = 11 - (sum % 11);
    const expectedDv = mod === 11 ? "0" : mod === 10 ? "K" : String(mod);
    return dv === expectedDv;
  }

  function normalizeDocument(plant, value) {
    return plant === "santafe" ? cleanRUT(value) : cleanDigits(value);
  }

  function formatDocument(plant, value) {
    return plant === "santafe" ? formatRUT(value) : formatCPF(value);
  }

  function isValidDocument(plant, value) {
    return plant === "santafe" ? isValidRUT(value) : isValidCPF(value);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());
  }

  const api = {
    cleanDigits,
    cleanRUT,
    formatCPF,
    isValidCPF,
    formatRUT,
    isValidRUT,
    normalizeDocument,
    formatDocument,
    isValidDocument,
    isValidEmail,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.PTValidators = api;
  }
})(typeof window !== "undefined" ? window : globalThis);

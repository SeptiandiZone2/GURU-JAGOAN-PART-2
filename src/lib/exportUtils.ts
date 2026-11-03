import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const oklchToRgb = (l: number, c: number, h: number, alpha?: number): string => {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l_3 = l_ * l_ * l_;
  const m_3 = m_ * m_ * m_;
  const s_3 = s_ * s_ * s_;

  const rLin = +4.0767416621 * l_3 - 3.3077115913 * m_3 + 0.2309699292 * s_3;
  const gLin = -1.2684380046 * l_3 + 2.6097574011 * m_3 - 0.3413193965 * s_3;
  const bLin = -0.0041960863 * l_3 - 0.7034186147 * m_3 + 1.707614701 * s_3;

  const f = (x: number) =>
    x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;

  const red = Math.round(Math.max(0, Math.min(1, f(rLin))) * 255);
  const green = Math.round(Math.max(0, Math.min(1, f(gLin))) * 255);
  const blue = Math.round(Math.max(0, Math.min(1, f(bLin))) * 255);

  if (alpha !== undefined && !isNaN(alpha)) {
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }
  return `rgb(${red}, ${green}, ${blue})`;
};

const oklabToRgb = (l: number, a: number, b: number, alpha?: number): string => {
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l_3 = l_ * l_ * l_;
  const m_3 = m_ * m_ * m_;
  const s_3 = s_ * s_ * s_;

  const rLin = +4.0767416621 * l_3 - 3.3077115913 * m_3 + 0.2309699292 * s_3;
  const gLin = -1.2684380046 * l_3 + 2.6097574011 * m_3 - 0.3413193965 * s_3;
  const bLin = -0.0041960863 * l_3 - 0.7034186147 * m_3 + 1.707614701 * s_3;

  const f = (x: number) =>
    x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;

  const red = Math.round(Math.max(0, Math.min(1, f(rLin))) * 255);
  const green = Math.round(Math.max(0, Math.min(1, f(gLin))) * 255);
  const blue = Math.round(Math.max(0, Math.min(1, f(bLin))) * 255);

  if (alpha !== undefined && !isNaN(alpha)) {
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }
  return `rgb(${red}, ${green}, ${blue})`;
};

const replaceOklchWithRgb = (cssText: string): string => {
  return cssText.replace(/oklch\(([^)]+)\)/g, (match, p1) => {
    try {
      const parts = p1.trim().split(/[\s,/]+/);
      if (parts.length < 3) return match;
      const lVal = parts[0];
      const cVal = parts[1];
      const hVal = parts[2];
      const aVal = parts[3];
      const l = lVal.endsWith("%") ? parseFloat(lVal) / 100 : parseFloat(lVal);
      const c = parseFloat(cVal);
      const h = hVal.endsWith("deg") ? parseFloat(hVal) : parseFloat(hVal);
      let alpha: number | undefined = undefined;
      if (aVal) {
        alpha = aVal.endsWith("%") ? parseFloat(aVal) / 100 : parseFloat(aVal);
      }
      if (isNaN(l) || isNaN(c) || isNaN(h)) return "rgb(79, 70, 229)";
      return oklchToRgb(l, c, h, alpha);
    } catch {
      return "rgb(79, 70, 229)";
    }
  });
};

const replaceOklabWithRgb = (cssText: string): string => {
  return cssText.replace(/oklab\(([^)]+)\)/g, (match, p1) => {
    try {
      const parts = p1.trim().split(/[\s,/]+/);
      if (parts.length < 3) return match;
      const lVal = parts[0];
      const aVal = parts[1];
      const bVal = parts[2];
      const alphaVal = parts[3];
      const l = lVal.endsWith("%") ? parseFloat(lVal) / 100 : parseFloat(lVal);
      const a = parseFloat(aVal);
      const b = parseFloat(bVal);
      let alpha: number | undefined = undefined;
      if (alphaVal) {
        alpha = alphaVal.endsWith("%")
          ? parseFloat(alphaVal) / 100
          : parseFloat(alphaVal);
      }
      if (isNaN(l) || isNaN(a) || isNaN(b)) return "rgb(79, 70, 229)";
      return oklabToRgb(l, a, b, alpha);
    } catch {
      return "rgb(79, 70, 229)";
    }
  });
};

export async function exportElementToPDF(
  elementId: string,
  filename = "Dokumen_Guru_Jagoan.pdf"
) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const originalStyleSheets = Array.from(document.styleSheets);
  const disabledSheets: { sheet: CSSStyleSheet; disabled: boolean }[] = [];
  const tempStyleElements: HTMLStyleElement[] = [];

  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function (elt, pseudoElt) {
    const style = originalGetComputedStyle(elt, pseudoElt);
    return new Proxy(style, {
      get(target, prop) {
        if (prop === "getPropertyValue") {
          return function (propertyName: string) {
            const val = target.getPropertyValue(propertyName);
            if (
              typeof val === "string" &&
              (val.includes("oklch") || val.includes("oklab"))
            ) {
              return replaceOklabWithRgb(replaceOklchWithRgb(val));
            }
            return val;
          };
        }
        const val = (target as any)[prop];
        if (typeof val === "function") return val.bind(target);
        if (
          typeof val === "string" &&
          (val.includes("oklch") || val.includes("oklab"))
        ) {
          return replaceOklabWithRgb(replaceOklchWithRgb(val));
        }
        return val;
      },
    });
  };

  try {
    for (const sheet of originalStyleSheets) {
      try {
        if (sheet.cssRules) {
          const rulesText: string[] = [];
          for (let i = 0; i < sheet.cssRules.length; i++) {
            rulesText.push(sheet.cssRules[i].cssText);
          }
          const rawCss = rulesText.join("\n");
          if (rawCss.includes("oklch") || rawCss.includes("oklab")) {
            let cleanedText = replaceOklchWithRgb(rawCss);
            cleanedText = replaceOklabWithRgb(cleanedText);
            const styleEl = document.createElement("style");
            styleEl.innerHTML = cleanedText;
            document.head.appendChild(styleEl);
            tempStyleElements.push(styleEl);
            disabledSheets.push({ sheet, disabled: sheet.disabled });
            sheet.disabled = true;
          }
        }
      } catch {
        disabledSheets.push({ sheet, disabled: sheet.disabled });
        sheet.disabled = true;
      }
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const pageHeight = pdf.internal.pageSize.getHeight();
    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
  } finally {
    window.getComputedStyle = originalGetComputedStyle;
    for (const { sheet, disabled } of disabledSheets) {
      sheet.disabled = disabled;
    }
    for (const el of tempStyleElements) {
      el.remove();
    }
  }
}

export function exportHtmlToWordDoc(elementId: string, filename = "Dokumen_Guru_Jagoan.doc") {
  const element = document.getElementById(elementId);
  if (!element) return;
  const clone = element.cloneNode(true) as HTMLElement;
  const hiddenElements = clone.querySelectorAll(".print\\:hidden");
  hiddenElements.forEach((el) => el.parentNode?.removeChild(el));

  const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head><meta charset='utf-8'><title>Export Dokumen Guru Jagoan</title>
  <style>
      @page WordSection1 { size: 21.0cm 29.7cm; margin: 2.54cm; }
      div.WordSection1 { page: WordSection1; }
      body { font-family: Arial, sans-serif; font-size: 11.5pt; line-height: 1.5; color: #000; }
      h1 { font-size: 15pt; font-weight: bold; text-align: center; margin-bottom: 10pt; text-transform: uppercase; }
      h2 { font-size: 13pt; font-weight: bold; text-align: center; margin-bottom: 10pt; }
      h3, h4 { font-size: 12pt; font-weight: bold; margin-bottom: 6pt; margin-top: 12pt; }
      p, li, div { text-align: justify; margin-top: 0; margin-bottom: 6pt; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 12pt; font-size: 11pt; }
      th, td { border: 1px solid black; padding: 6px; vertical-align: top; }
      table.border-none, table.border-none th, table.border-none td, td.border-none { border: none !important; }
      .text-center { text-align: center !important; } .text-right { text-align: right !important; } .font-bold { font-weight: bold !important; } .underline { text-decoration: underline !important; }
  </style></head><body><div class="WordSection1">`;
  const postHtml = "</div></body></html>";
  const html = preHtml + clone.innerHTML + postHtml;
  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".doc") ? filename : `${filename}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

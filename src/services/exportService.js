const encoder = new TextEncoder();

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function sheetName(name) {
  return String(name || "Sheet")
    .replace(/[\[\]:*?/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31) || "Sheet";
}

function columnLetter(index) {
  let letters = "";
  let current = index + 1;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    current = Math.floor((current - 1) / 26);
  }
  return letters;
}

function cellType(value, column) {
  if (value === null || value === undefined || value === "") return { type: "inlineStr", value: "" };
  if (column?.type === "number" || column?.type === "percent" || column?.type === "currency") {
    const number = Number(String(value).replace(/[^\d.-]/g, ""));
    return Number.isFinite(number) ? { type: "n", value: number } : { type: "inlineStr", value };
  }
  if (column?.type === "date" && value) return { type: "inlineStr", value };
  if (typeof value === "number") return { type: "n", value };
  return { type: "inlineStr", value };
}

function statusStyle(value) {
  const text = String(value || "").toUpperCase();
  if (["ELIGIBLE", "SELECTED", "HIRED", "ACTIVE", "VERIFIED"].some((term) => text.includes(term))) return 8;
  if (["SHORTLISTED", "INTERVIEW"].some((term) => text.includes(term))) return 11;
  if (["APPLIED", "SCHEDULED"].some((term) => text.includes(term))) return 12;
  if (["PENDING", "ON_HOLD", "DRAFT"].some((term) => text.includes(term))) return 9;
  if (["NOT ELIGIBLE", "NOT_ELIGIBLE", "REJECTED", "CANCELLED", "MISSING", "CLOSED"].some((term) => text.includes(term))) return 10;
  return 0;
}

function valueFor(row, column) {
  if (typeof column.value === "function") return column.value(row);
  return row?.[column.key];
}

function styleFor(value, column, fallback = 0) {
  if (column?.status) return statusStyle(value);
  if (column?.type === "percent") return 5;
  if (column?.type === "currency") return 6;
  if (column?.type === "number") return 4;
  return fallback;
}

function cell(value, column, fallbackStyle = 0) {
  const resolved = cellType(value, column);
  const style = styleFor(value, column, fallbackStyle);
  const styleAttr = style ? ` s="${style}"` : "";
  if (resolved.type === "n") return `<c${styleAttr}><v>${resolved.value}</v></c>`;
  return `<c t="inlineStr"${styleAttr}><is><t>${escapeXml(resolved.value)}</t></is></c>`;
}

function rowXml(cells, index, height) {
  const heightAttr = height ? ` ht="${height}" customHeight="1"` : "";
  return `<row r="${index}"${heightAttr}>${cells}</row>`;
}

function sheetXml(sheet) {
  const columns = sheet.columns || [];
  const rows = sheet.rows || [];
  const metadata = sheet.metadata || [];
  const lastColumn = columnLetter(Math.max(0, columns.length - 1));
  let rowIndex = 1;
  const xmlRows = [];

  if (sheet.title) {
    xmlRows.push(rowXml(`<c t="inlineStr" s="1"><is><t>${escapeXml(sheet.title)}</t></is></c>`, rowIndex, 24));
    rowIndex += 1;
  }

  metadata.forEach((item) => {
    xmlRows.push(rowXml(
      `<c t="inlineStr" s="2"><is><t>${escapeXml(item.label)}</t></is></c><c t="inlineStr" s="2"><is><t>${escapeXml(item.value)}</t></is></c>`,
      rowIndex
    ));
    rowIndex += 1;
  });

  if (sheet.title || metadata.length) {
    xmlRows.push(rowXml("", rowIndex, 8));
    rowIndex += 1;
  }

  const headerRow = rowIndex;
  xmlRows.push(rowXml(columns.map((column) => cell(column.label, null, 3)).join(""), rowIndex, 21));
  rowIndex += 1;

  rows.forEach((record) => {
    xmlRows.push(rowXml(columns.map((column) => cell(valueFor(record, column), column)).join(""), rowIndex));
    rowIndex += 1;
  });

  const autoFilter = rows.length && columns.length ? `<autoFilter ref="A${headerRow}:${lastColumn}${rowIndex - 1}"/>` : "";
  const widths = columns.map((column, index) => `<col min="${index + 1}" max="${index + 1}" width="${column.width || 18}" customWidth="1"/>`).join("");
  const mergeCells = sheet.title && columns.length > 1 ? `<mergeCells count="1"><mergeCell ref="A1:${lastColumn}1"/></mergeCells>` : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="${headerRow}" topLeftCell="A${headerRow + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${widths}</cols>
  <sheetData>${xmlRows.join("")}</sheetData>
  ${autoFilter}
  ${mergeCells}
</worksheet>`;
}

function workbookXml(sheets) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheets.map((sheet, index) => `<sheet name="${escapeXml(sheetName(sheet.name))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets>
</workbook>`;
}

function workbookRelsXml(sheets) {
  const worksheetRels = sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${worksheetRels}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
}

function contentTypesXml(sheets) {
  const worksheetTypes = sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${worksheetTypes}
</Types>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="16"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="8"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF047857"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F766E"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE7F8EF"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF4D6"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFE3E7"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/></patternFill></fill></fills>
  <borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD9E4DF"/></left><right style="thin"><color rgb="FFD9E4DF"/></right><top style="thin"><color rgb="FFD9E4DF"/></top><bottom style="thin"><color rgb="FFD9E4DF"/></bottom><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="13">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="10" fontId="0" fillId="0" borderId="1" xfId="0"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="14" fontId="0" fillId="0" borderId="1" xfId="0"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="6" borderId="1" xfId="0"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="7" borderId="1" xfId="0"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;
}

function relsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
}

function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function pushUint16(bytes, value) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff);
}

function pushUint32(bytes, value) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function zip(files) {
  const bytes = [];
  const central = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);

    pushUint32(bytes, 0x04034b50);
    pushUint16(bytes, 20);
    pushUint16(bytes, 0);
    pushUint16(bytes, 0);
    pushUint16(bytes, 0);
    pushUint16(bytes, 0);
    pushUint32(bytes, crc);
    pushUint32(bytes, data.length);
    pushUint32(bytes, data.length);
    pushUint16(bytes, nameBytes.length);
    pushUint16(bytes, 0);
    bytes.push(...nameBytes, ...data);

    const centralRecord = [];
    pushUint32(centralRecord, 0x02014b50);
    pushUint16(centralRecord, 20);
    pushUint16(centralRecord, 20);
    pushUint16(centralRecord, 0);
    pushUint16(centralRecord, 0);
    pushUint16(centralRecord, 0);
    pushUint16(centralRecord, 0);
    pushUint32(centralRecord, crc);
    pushUint32(centralRecord, data.length);
    pushUint32(centralRecord, data.length);
    pushUint16(centralRecord, nameBytes.length);
    pushUint16(centralRecord, 0);
    pushUint16(centralRecord, 0);
    pushUint16(centralRecord, 0);
    pushUint16(centralRecord, 0);
    pushUint32(centralRecord, 0);
    pushUint32(centralRecord, offset);
    centralRecord.push(...nameBytes);
    central.push(...centralRecord);

    offset = bytes.length;
  });

  const centralOffset = bytes.length;
  bytes.push(...central);
  pushUint32(bytes, 0x06054b50);
  pushUint16(bytes, 0);
  pushUint16(bytes, 0);
  pushUint16(bytes, files.length);
  pushUint16(bytes, files.length);
  pushUint32(bytes, central.length);
  pushUint32(bytes, centralOffset);
  pushUint16(bytes, 0);

  return new Uint8Array(bytes);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportXlsxWorkbook({ filename, sheets }) {
  const cleanSheets = (sheets || []).filter((sheet) => sheet && (sheet.rows?.length || sheet.allowEmpty));
  if (!cleanSheets.length) throw new Error("No exportable data found.");

  const files = [
    { name: "[Content_Types].xml", content: contentTypesXml(cleanSheets) },
    { name: "_rels/.rels", content: relsXml() },
    { name: "xl/workbook.xml", content: workbookXml(cleanSheets) },
    { name: "xl/_rels/workbook.xml.rels", content: workbookRelsXml(cleanSheets) },
    { name: "xl/styles.xml", content: stylesXml() },
    ...cleanSheets.map((sheet, index) => ({ name: `xl/worksheets/sheet${index + 1}.xml`, content: sheetXml(sheet) }))
  ];

  const blob = new Blob([zip(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  downloadBlob(blob, filename?.endsWith(".xlsx") ? filename : `${filename || "smartplacify-export"}.xlsx`);
}

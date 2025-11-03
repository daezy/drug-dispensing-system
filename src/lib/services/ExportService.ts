/**
 * Export Utility
 * Handles CSV and PDF export for reports and audit logs
 */

import {
  AuditLogEntry,
  DispensedDrugReport,
  StockLevelReport,
} from "./ReportingService";

export class ExportService {
  /**
   * Convert data to CSV format
   */
  static toCSV(data: any[], headers: string[]): string {
    const rows = [headers.join(",")];

    data.forEach((item) => {
      const row = headers.map((header) => {
        const value = item[header];
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return JSON.stringify(value);
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value).replace(/"/g, '""');
        return stringValue.includes(",") ? `"${stringValue}"` : stringValue;
      });
      rows.push(row.join(","));
    });

    return rows.join("\n");
  }

  /**
   * Export audit logs to CSV
   */
  static exportAuditLogsCSV(logs: AuditLogEntry[]): string {
    const headers = [
      "timestamp",
      "action",
      "performedBy",
      "userRole",
      "entityType",
      "entityId",
      "blockchainTxHash",
      "details",
    ];

    const data = logs.map((log) => ({
      timestamp: new Date(log.timestamp).toISOString(),
      action: log.action,
      performedBy: log.performedBy,
      userRole: log.userRole,
      entityType: log.entityType,
      entityId: log.entityId,
      blockchainTxHash: log.blockchainTxHash || "",
      details: JSON.stringify(log.details),
    }));

    return this.toCSV(data, headers);
  }

  /**
   * Export dispensed drugs to CSV
   */
  static exportDispensedDrugsCSV(drugs: DispensedDrugReport[]): string {
    const headers = [
      "drugName",
      "batchNumber",
      "patientName",
      "pharmacistName",
      "quantity",
      "dispensedAt",
      "prescriptionId",
      "verificationHash",
    ];

    const data = drugs.map((drug) => ({
      drugName: drug.drugName,
      batchNumber: drug.batchNumber || "",
      patientName: drug.patientName,
      pharmacistName: drug.pharmacistName,
      quantity: drug.quantity,
      dispensedAt: new Date(drug.dispensedAt).toISOString(),
      prescriptionId: drug.prescriptionId,
      verificationHash: drug.verificationHash || "",
    }));

    return this.toCSV(data, headers);
  }

  /**
   * Export stock levels to CSV
   */
  static exportStockLevelsCSV(stock: StockLevelReport[]): string {
    const headers = [
      "drugName",
      "genericName",
      "currentStock",
      "minimumLevel",
      "status",
      "expiryDate",
      "batchNumber",
    ];

    const data = stock.map((item) => ({
      drugName: item.drugName,
      genericName: item.genericName || "",
      currentStock: item.currentStock,
      minimumLevel: item.minimumLevel,
      status: item.status,
      expiryDate: new Date(item.expiryDate).toISOString().split("T")[0],
      batchNumber: item.batchNumber || "",
    }));

    return this.toCSV(data, headers);
  }

  /**
   * Generate HTML for PDF conversion
   * Returns HTML string that can be converted to PDF using a library like jsPDF or puppeteer
   */
  static generateAuditLogPDFHTML(
    logs: AuditLogEntry[],
    title: string = "Audit Logs Report"
  ): string {
    const dateRange =
      logs.length > 0
        ? `From ${new Date(
            logs[logs.length - 1].timestamp
          ).toLocaleDateString()} to ${new Date(
            logs[0].timestamp
          ).toLocaleDateString()}`
        : "No data";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e40af;
      margin: 0;
    }
    .header p {
      color: #64748b;
      margin: 5px 0;
    }
    .meta-info {
      background: #f1f5f9;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 12px;
    }
    thead {
      background-color: #2563eb;
      color: white;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border: 1px solid #e2e8f0;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      color: #64748b;
      font-size: 10px;
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>Generated on: ${new Date().toLocaleString()}</p>
    <p>${dateRange}</p>
  </div>

  <div class="meta-info">
    <strong>Total Records:</strong> ${logs.length}<br>
    <strong>Report Type:</strong> Compliance Audit Log<br>
    <strong>System:</strong> PharmChain Drug Dispensing System
  </div>

  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Action</th>
        <th>Performed By</th>
        <th>Role</th>
        <th>Entity</th>
        <th>TX Hash</th>
      </tr>
    </thead>
    <tbody>
      ${logs
        .map(
          (log) => `
        <tr>
          <td>${new Date(log.timestamp).toLocaleString()}</td>
          <td>${log.action}</td>
          <td>${log.performedBy}</td>
          <td>${log.userRole}</td>
          <td>${log.entityType}: ${log.entityId.substring(0, 8)}...</td>
          <td>${
            log.blockchainTxHash
              ? log.blockchainTxHash.substring(0, 10) + "..."
              : "N/A"
          }</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    <p>PharmChain - Blockchain-Based Drug Dispensing System</p>
    <p>This is a system-generated compliance report</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate HTML for dispensed drugs PDF
   */
  static generateDispensedDrugsPDFHTML(
    drugs: DispensedDrugReport[],
    title: string = "Dispensed Drugs Report"
  ): string {
    const totalQuantity = drugs.reduce((sum, drug) => sum + drug.quantity, 0);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #10b981;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #059669;
      margin: 0;
    }
    .meta-info {
      background: #f1f5f9;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    thead {
      background-color: #10b981;
      color: white;
    }
    th, td {
      padding: 8px;
      text-align: left;
      border: 1px solid #e2e8f0;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      color: #64748b;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>Generated on: ${new Date().toLocaleString()}</p>
  </div>

  <div class="meta-info">
    <strong>Total Dispensed:</strong> ${drugs.length} prescriptions<br>
    <strong>Total Quantity:</strong> ${totalQuantity} units<br>
    <strong>Report Type:</strong> Dispensed Drugs Summary
  </div>

  <table>
    <thead>
      <tr>
        <th>Drug Name</th>
        <th>Batch No.</th>
        <th>Patient</th>
        <th>Pharmacist</th>
        <th>Quantity</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      ${drugs
        .map(
          (drug) => `
        <tr>
          <td>${drug.drugName}</td>
          <td>${drug.batchNumber || "N/A"}</td>
          <td>${drug.patientName}</td>
          <td>${drug.pharmacistName}</td>
          <td>${drug.quantity}</td>
          <td>${new Date(drug.dispensedAt).toLocaleDateString()}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    <p>PharmChain - Blockchain-Based Drug Dispensing System</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate HTML for stock levels PDF
   */
  static generateStockLevelsPDFHTML(
    stock: StockLevelReport[],
    title: string = "Stock Levels Report"
  ): string {
    const lowStock = stock.filter((s) => s.status === "low_stock").length;
    const outOfStock = stock.filter((s) => s.status === "out_of_stock").length;
    const expired = stock.filter((s) => s.status === "expired").length;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #f59e0b;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #d97706;
      margin: 0;
    }
    .meta-info {
      background: #f1f5f9;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .alert-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 10px;
      margin: 10px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    thead {
      background-color: #f59e0b;
      color: white;
    }
    th, td {
      padding: 8px;
      text-align: left;
      border: 1px solid #e2e8f0;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .status-low { color: #f59e0b; font-weight: bold; }
    .status-out { color: #ef4444; font-weight: bold; }
    .status-expired { color: #dc2626; font-weight: bold; }
    .status-ok { color: #10b981; }
    .footer {
      margin-top: 30px;
      text-align: center;
      color: #64748b;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>Generated on: ${new Date().toLocaleString()}</p>
  </div>

  <div class="meta-info">
    <strong>Total Drugs:</strong> ${stock.length}<br>
    <strong>Low Stock:</strong> ${lowStock}<br>
    <strong>Out of Stock:</strong> ${outOfStock}<br>
    <strong>Expired:</strong> ${expired}
  </div>

  ${
    lowStock + outOfStock + expired > 0
      ? `<div class="alert-box">
    <strong>⚠ Attention Required:</strong> ${
      lowStock + outOfStock + expired
    } drugs need immediate attention
  </div>`
      : ""
  }

  <table>
    <thead>
      <tr>
        <th>Drug Name</th>
        <th>Generic Name</th>
        <th>Current Stock</th>
        <th>Min. Level</th>
        <th>Status</th>
        <th>Expiry Date</th>
      </tr>
    </thead>
    <tbody>
      ${stock
        .map(
          (item) => `
        <tr>
          <td>${item.drugName}</td>
          <td>${item.genericName || "N/A"}</td>
          <td>${item.currentStock}</td>
          <td>${item.minimumLevel}</td>
          <td class="status-${
            item.status === "low_stock"
              ? "low"
              : item.status === "out_of_stock"
              ? "out"
              : item.status === "expired"
              ? "expired"
              : "ok"
          }">
            ${item.status.replace(/_/g, " ").toUpperCase()}
          </td>
          <td>${new Date(item.expiryDate).toLocaleDateString()}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    <p>PharmChain - Blockchain-Based Drug Dispensing System</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Download CSV file in browser
   */
  static downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Download PDF file in browser (requires html2pdf or similar library)
   */
  static async downloadPDF(html: string, filename: string) {
    // This is a placeholder - actual implementation would use a library like html2pdf, jsPDF, or puppeteer
    // For client-side, you could use html2pdf.js:
    // const element = document.createElement('div');
    // element.innerHTML = html;
    // await html2pdf().from(element).save(filename);

    // For now, we'll create a blob and download
    const blob = new Blob([html], { type: "text/html" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename.replace(".pdf", ".html"));
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

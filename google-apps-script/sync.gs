// Google Apps Script — Onda AI Sheets Sync
// Deploy as web app: Execute as Me, Access: Anyone
// Paste the deployment URL into js/sheets-sync.js SHEETS_SYNC_URL

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Add header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'Name', 'Email', 'Phone', 'Company',
        'Industry', 'Size', 'Website', 'Revenue', 'Score',
        'Level', 'Stage', 'Deal Value'
      ]);
    }

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.email || '',
      data.phone || '',
      data.company || '',
      data.industry || '',
      data.size || '',
      data.website || '',
      data.revenue || '',
      data.score || '',
      data.level || '',
      data.stage || '',
      data.deal_value || ''
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ status: 'ok' })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Onda AI Sheets Sync is running.');
}

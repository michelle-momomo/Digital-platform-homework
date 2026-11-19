/**
 * Google Sheet logger for Digital Platforms guest-session runs.
 * Deploy as a web app: Execute as Me, Who has access: Anyone.
 * The game POSTs JSON as text/plain so the browser skips the CORS preflight.
 */
var HEADERS = [
  "timestamp",
  "name",
  "studentId",
  "gender",
  "hair",
  "hairColor",
  "skin",
  "outfit",
  "region",
  "level",
  "stars",
  "score",
  "correct",
  "total",
  "timeMs",
  "kind",
];

function getSheet() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName("Results");
  if (!sheet) sheet = ss.insertSheet("Results");
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  return sheet;
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var row = HEADERS.map(function (key) {
      return data[key] == null ? "" : String(data[key]);
    });
    getSheet().appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  var sheet = getSheet();
  var values = sheet.getDataRange().getValues();
  var header = values.shift() || HEADERS;
  var rows = values.map(function (line) {
    var obj = {};
    header.forEach(function (key, i) {
      obj[key] = line[i];
    });
    return obj;
  });
  return json_(rows);
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

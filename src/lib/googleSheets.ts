import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getCredentials() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error(
      "Google Sheets 연동 환경변수가 설정되지 않았습니다. GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, GOOGLE_SHEETS_SPREADSHEET_ID 를 확인해주세요."
    );
  }

  return {
    clientEmail,
    // 환경변수에 저장 시 개행이 \n 형태로 들어가므로 실제 개행 문자로 복원
    privateKey: privateKey.replace(/\\n/g, "\n"),
    spreadsheetId,
  };
}

export async function getSheetsClient() {
  const { clientEmail, privateKey } = getCredentials();

  const auth = new google.auth.JWT(clientEmail, undefined, privateKey, SCOPES);

  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
}

export function getSpreadsheetId() {
  const { spreadsheetId } = getCredentials();
  return spreadsheetId;
}


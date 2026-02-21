const SPREADSHEET_ID = "1cSEnISeP_vU9kh76KFy6cJJLndRStLJFJN6wrbSdmG0";

// ==========================
// HELPER
// ==========================
function getSheet(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}

function generateNumber(prefix, sheetName) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  const next = lastRow;
  const number = String(next).padStart(4, '0');
  return prefix + number;
}

function logActivity(username, role, aktivitas, no_pendaftaran="") {
  const sheet = getSheet("LOG_AKTIVITAS");
  sheet.appendRow([
    sheet.getLastRow(),
    username,
    role,
    aktivitas,
    no_pendaftaran,
    new Date()
  ]);
}

// ==========================
// LOGIN ADMIN / PANITIA
// ==========================
function loginAdmin(username, password) {
  const sheet = getSheet("USERS");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] == username && data[i][2] == password) {
      logActivity(username, data[i][3], "Login Admin");
      return {status:true, role:data[i][3]};
    }
  }
  return {status:false};
}

// ==========================
// LOGIN SISWA
// ==========================
function loginSiswa(no_pendaftaran, password) {
  const sheetOffline = getSheet("CALON_SISWA");
  const sheetOnline = getSheet("PENDAFTAR_ONLINE");

  const dataOffline = sheetOffline.getDataRange().getValues();
  const dataOnline = sheetOnline.getDataRange().getValues();

  // Cek Offline
  for (let i = 1; i < dataOffline.length; i++) {
    if (dataOffline[i][1] == no_pendaftaran && dataOffline[i][12] == password) {
      logActivity(no_pendaftaran, "siswa", "Login Siswa", no_pendaftaran);
      return {status:true, type:"offline"};
    }
  }

  // Cek Online
  for (let i = 1; i < dataOnline.length; i++) {
    if (dataOnline[i][1] == no_pendaftaran && dataOnline[i][11] == password) {
      logActivity(no_pendaftaran, "siswa", "Login Siswa", no_pendaftaran);
      return {status:true, type:"online"};
    }
  }

  return {status:false};
}

// ==========================
// INPUT CALON SISWA OFFLINE
// ==========================
function inputCalonSiswa(data) {
  const sheet = getSheet("CALON_SISWA");
  const no = generateNumber("SMKBI-", "CALON_SISWA");

  sheet.appendRow([
    sheet.getLastRow(),
    no,
    data.nama,
    data.sekolah_asal,
    data.telp_siswa,
    data.telp_ortu,
    data.total_tagihan,
    0,
    data.total_tagihan,
    "Draft",
    data.input_by,
    "",
    "smkbip2026",
    false,
    "",
    new Date()
  ]);

  logActivity(data.input_by, "panitia", "Input Data Offline", no);
  return no;
}

// ==========================
// APPROVE ONLINE
// ==========================
function approveOnline(no_pendaftaran, username) {
  const sheet = getSheet("PENDAFTAR_ONLINE");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] == no_pendaftaran) {
      sheet.getRange(i+1, 10).setValue("Approved");
      sheet.getRange(i+1, 11).setValue(username);
      sheet.getRange(i+1, 16).setValue(new Date());
      logActivity(username, "panitia", "Approve Online", no_pendaftaran);
      return true;
    }
  }
  return false;
}

// ==========================
// INPUT PEMBAYARAN
// ==========================
function inputPembayaran(data) {
  const sheet = getSheet("PEMBAYARAN");
  const siswaSheet = getSheet("CALON_SISWA");

  sheet.appendRow([
    sheet.getLastRow(),
    data.no_pendaftaran,
    data.nama,
    data.jumlah,
    data.metode,
    new Date(),
    data.input_by,
    ""
  ]);

  const siswaData = siswaSheet.getDataRange().getValues();
  for (let i = 1; i < siswaData.length; i++) {
    if (siswaData[i][1] == data.no_pendaftaran) {
      let totalBayar = Number(siswaData[i][7]) + Number(data.jumlah);
      siswaSheet.getRange(i+1, 8).setValue(totalBayar);
      siswaSheet.getRange(i+1, 9).setValue(Number(siswaData[i][6]) - totalBayar);
    }
  }

  logActivity(data.input_by, "panitia", "Input Pembayaran", data.no_pendaftaran);
  return true;
}

// ==========================
// UPDATE DATA LENGKAP SISWA
// ==========================
function updateDataLengkap(data) {
  const sheet = getSheet("DATA_LENGKAP_SISWA");

  sheet.appendRow([
    data.no_pendaftaran,
    data.tempat_lahir,
    data.tanggal_lahir,
    data.nisn,
    data.nik,
    data.jenis_kelamin,
    data.agama,
    data.alamat_siswa,
    data.alamat_sama_ortu,
    data.nama_ayah,
    data.nik_ayah,
    data.ttl_ayah,
    data.nama_ibu,
    data.nik_ibu,
    data.ttl_ibu,
    new Date(),
    data.no_pendaftaran
  ]);

  logActivity(data.no_pendaftaran, "siswa", "Update Data Lengkap", data.no_pendaftaran);
  return true;
}

function doPost(e){
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  if(action == "loginAdmin") return ContentService.createTextOutput(JSON.stringify(loginAdmin(data.username,data.password))).setMimeType(ContentService.MimeType.JSON);
  if(action == "loginSiswa") return ContentService.createTextOutput(JSON.stringify(loginSiswa(data.no_pendaftaran,data.password))).setMimeType(ContentService.MimeType.JSON);
  if(action == "inputCalonSiswa") return ContentService.createTextOutput(JSON.stringify(inputCalonSiswa(data))).setMimeType(ContentService.MimeType.JSON);
  if(action == "approveOnline") return ContentService.createTextOutput(JSON.stringify(approveOnline(data.no_pendaftaran,data.username))).setMimeType(ContentService.MimeType.JSON);
  if(action == "inputPembayaran") return ContentService.createTextOutput(JSON.stringify(inputPembayaran(data))).setMimeType(ContentService.MimeType.JSON);
  if(action == "updateDataLengkap") return ContentService.createTextOutput(JSON.stringify(updateDataLengkap(data))).setMimeType(ContentService.MimeType.JSON);
  if(action == "gantiPassword") return ContentService.createTextOutput(JSON.stringify(gantiPassword(data))).setMimeType(ContentService.MimeType.JSON);
}

function gantiPassword(data){
  const sheet1 = getSheet("CALON_SISWA");
  const sheet2 = getSheet("PENDAFTAR_ONLINE");

  const sheets = [sheet1, sheet2];

  for(let s of sheets){
    const values = s.getDataRange().getValues();
    for(let i=1;i<values.length;i++){
      if(values[i][1] == data.no_pendaftaran){
        s.getRange(i+1,13).setValue(data.password);
        return {status:true};
      }
    }
  }
  return {status:false};
}
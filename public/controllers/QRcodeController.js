/*const qr = require("qrcode");
const uuid = require("uuid").v4;
const pool = require("../dbConfig");

async function generateQRCode(dadosBilhete) {
  const dadosQRCode = JSON.stringify(dadosBilhete);
  const filenameQRCode = `qr_${uuid()}.png`;
  qr.toFile(
    filenameQRCode,
    dadosQRCode,
    { errorCorrectionLevel: "H" },
    (err) => {
    if (err) {
        console.error("Erro ao gerar QR code:", err);
    } else {
        console.log("QR code gerado com suceso: ", filenameQRCode);
    }
    });
}

module.exports = {
  generateQRCode,
};
*/
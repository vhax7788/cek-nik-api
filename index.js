const express = require("express");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/cek-nik", async (req, res) => {
  const nik = req.query.nik;
  if (!nik) return res.status(400).json({ error: "NIK wajib diisi." });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.goto("https://cekdptonline.kpu.go.id", { waitUntil: "networkidle2" });

    await page.type("input[type=text]", nik);
    await page.click("button[type=submit]");
    await page.waitForTimeout(4000); // Tunggu data muncul

    const html = await page.content();
    await browser.close();

    const $ = cheerio.load(html);
    const nama = $("b:contains('Nama Pemilih')").parent().text().replace("Nama Pemilih", "").trim();
    const tps = $("b:contains('TPS')").parent().text().replace("TPS", "").trim();
    const kelurahan = $("b:contains('Kelurahan')").parent().text().replace("Kelurahan", "").trim();
    const kecamatan = $("b:contains('Kecamatan')").parent().text().replace("Kecamatan", "").trim();
    const kabupaten = $("b:contains('Kabupaten/Kota')").parent().text().replace("Kabupaten/Kota", "").trim();
    const alamat = $("b:contains('Alamat Potensial TPS')").parent().text().replace("Alamat Potensial TPS", "").trim();

    if (!nama) {
      return res.status(404).json({ error: "Data tidak ditemukan atau NIK salah." });
    }

    return res.json({
      nama,
      nik: nik.replace(/^(\d{6})\d+(\d{4})$/, "$1********$2"),
      tps,
      kelurahan,
      kecamatan,
      kabupaten,
      alamat
    });
  } catch (err) {
    res.status(500).json({ error: "Gagal scraping", detail: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

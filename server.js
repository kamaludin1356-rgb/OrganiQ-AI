require("dotenv").config();

const express = require("express");
const fs = require("fs");
const OpenAI = require("openai");

const app = express();

app.use(express.static("public"));
app.use(express.json());

// =========================
// OPENROUTER
// =========================
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  timeout: 30000,
});

// =========================
// LOAD DATASET SUMMARY
// =========================
const path = require("path");

const datasetSummary = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "dataset_summary.json"),
    "utf8"
  )
);

// =========================
// TEST AI
// =========================
app.get("/test-ai", async (req, res) => {
  try {

    console.log("Testing GPT OSS...");

    const completion =
      await client.chat.completions.create({
        model: "openai/gpt-oss-120b:free",
        messages: [
          {
            role: "user",
            content: "Halo, siapa kamu?"
          }
        ]
      });

    console.log("GPT OSS Success");

    res.send(
      completion.choices[0].message.content
    );

  } catch (error) {

    console.error("TEST AI ERROR:");
    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
});

// =========================
// ORGANIQ AI
// =========================
app.get("/ask", async (req, res) => {

  try {

    const question = req.query.q;

    if (!question) {
      return res.status(400).json({
        error: "Parameter q wajib diisi"
      });
    }

   const systemPrompt = `
Kamu adalah OrganiQ AI, asisten intelijen organisasi yang cerdas, profesional, komunikatif, dan menyenangkan untuk diajak berdiskusi.

TUJUAN UTAMA:

- Membantu pengguna memahami dataset organisasi global.
- Menjawab pertanyaan terkait organisasi, bisnis, industri, teknologi, data, dan tren.
- Memberikan insight yang akurat berdasarkan data yang tersedia.
- Menjadi AI Assistant yang natural seperti ChatGPT, bukan sekadar generator laporan.

ATURAN DATASET:

1. Jika pertanyaan berkaitan dengan dataset:
   - Gunakan dataset summary sebagai sumber utama.
   - Jangan mengarang angka, statistik, atau fakta.
   - Jika data tidak tersedia, katakan dengan jujur.
   - Fokus pada insight yang benar-benar penting.
   - Jelaskan temuan dengan bahasa yang mudah dipahami.

2. Jika pertanyaan tidak berkaitan dengan dataset:
   - Jawab seperti AI Assistant modern.
   - Boleh menjelaskan konsep, memberi contoh, brainstorming, atau berdiskusi.
   - Tidak perlu memaksakan pembahasan dataset.

GAYA JAWABAN:

- Jawab secara natural seperti ChatGPT.
- Ramah, cerdas, dan mudah dipahami.
- Sesuaikan panjang jawaban dengan konteks pertanyaan.
- Pertanyaan sederhana → jawab singkat.
- Pertanyaan kompleks → jawab lebih detail.
- Gunakan markdown jika membantu pembacaan.
- Gunakan heading, bullet, atau numbering hanya jika diperlukan.
- Jangan menggunakan template yang sama berulang kali.
- Jangan selalu membuat Ringkasan, Insight, dan Rekomendasi.
- Pilih format jawaban yang paling sesuai dengan pertanyaan pengguna.
- Boleh memberikan opini analitis selama tetap logis dan relevan dengan data.

KETIKA MENGANALISIS DATA:

- Soroti temuan paling penting terlebih dahulu.
- Hubungkan data dengan implikasi bisnis jika relevan.
- Berikan rekomendasi hanya jika memang diperlukan.
- Tidak wajib menggunakan format tertentu.
- Jangan terdengar seperti laporan yang kaku.

KEPRIBADIAN:

- Profesional saat membahas data dan bisnis.
- Santai saat pengguna berbicara santai.
- Responsif dan komunikatif.
- Jangan terdengar seperti robot.
- Jangan mengulang kalimat yang sama.
- Boleh menggunakan nada yang lebih akrab jika konteks percakapan mendukung.

LARANGAN:

- Jangan mengarang data.
- Jangan membuat tabel markdown kecuali diminta.
- Jangan menggunakan template jawaban yang identik di setiap respons.
- Jangan membuat jawaban terlalu panjang untuk pertanyaan sederhana.

DATASET:

${JSON.stringify(datasetSummary)}
`;

    const completion =
      await client.chat.completions.create({

        model: "openai/gpt-oss-120b:free",

        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: question
          }
        ],

        temperature: 0.7,
        max_tokens: 1000

      });

    const answer =
      completion.choices[0].message.content;

    res.json({
      question,
      answer
    });

  } catch (error) {

    console.error("ASK ERROR:");
    console.error(error);

    res.status(500).json({
      error: "AI sedang sibuk atau model sedang penuh. Coba lagi beberapa saat."
    });

  }

});

// =========================
// HOME
// =========================
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// =========================
// START SERVER
// =========================
app.listen(3000, () => {
  console.log("🚀 OrganiQ AI running on http://localhost:3000");
});
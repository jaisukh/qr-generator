import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pdfjs from 'pdfjs-dist/legacy/build/pdf.js';
const { getDocument } = pdfjs;
import QRCode from 'qrcode';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const standardFontDataUrl = path.join(__dirname, 'node_modules/pdfjs-dist/standard_fonts/');

const app = express();
const PORT = process.env.PORT || 3001;

// Storage setup for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

app.use(cors());

// Upload endpoint
app.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileId = path.parse(req.file.filename).name;
  const downloadUrl = `/download/${fileId}`;
  res.json({ downloadUrl });
});

// Download endpoint
app.get('/download/:id', (req, res) => {
  const fileId = req.params.id;
  const files = fs.readdirSync('./uploads');
  const file = files.find(f => f.startsWith(fileId));
  if (!file) {
    return res.status(404).send('File not found');
  }
  res.download(path.join('./uploads', file));
});

console.log('standardFontDataUrl:', standardFontDataUrl);
// PDF to HTML (text) preview endpoint
app.get('/preview/:id', async (req, res) => {
  const fileId = req.params.id;
  const files = fs.readdirSync('./uploads');
  const file = files.find(f => f.startsWith(fileId));
  if (!file) {
    return res.status(404).send('File not found');
  }
  const filePath = path.join('./uploads', file);
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const loadingTask = getDocument({
      data: dataBuffer,
      standardFontDataUrl,
    });
    const pdfDocument = await loadingTask.promise;
    let textContent = '';
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      textContent += pageText + '\n\n';
    }
    res.send(`<pre>${textContent}</pre>`);
  } catch (err) {
    console.error('PDF parsing error:', err);
    res.status(500).send('Failed to parse PDF: ' + err.message);
  }
});

// QR code generation endpoint
app.get('/qrcode/:id', async (req, res) => {
  const fileId = req.params.id;
  const files = fs.readdirSync('./uploads');
  const file = files.find(f => f.startsWith(fileId));
  if (!file) {
    return res.status(404).send('File not found');
  }
  // New (Render public URL)
  const downloadUrl = `https://qr-generator-sgsg.onrender.com/download/${fileId}`;
  try {
    const qr = await QRCode.toDataURL(downloadUrl);
    res.type('html').send(`<img src='${qr}' alt='QR Code for download' />`);
  } catch (err) {
    res.status(500).send('Failed to generate QR code');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
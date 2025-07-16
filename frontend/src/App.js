import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [qrCodeHtml, setQrCodeHtml] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setQrCodeHtml('');
    setDownloadUrl('');
    setError('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      const res = await axios.post('https://qr-generator-sgsg.onrender.com/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.downloadUrl;
      setDownloadUrl(`https://qr-generator-sgsg.onrender.com${url}`);
      // Fetch QR code
      const qrRes = await axios.get(`https://qr-generator-sgsg.onrender.com/qrcode/${url.split('/').pop()}`);
      setQrCodeHtml(qrRes.data);
    } catch (err) {
      setError('Upload failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <h2>PDF Upload & QR Code</h2>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading} style={{ marginLeft: 8 }}>
        {loading ? 'Uploading...' : 'Upload'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {downloadUrl && (
        <div style={{ marginTop: 16 }}>
          <a href={downloadUrl} target="_blank" rel="noopener noreferrer">Download PDF</a>
        </div>
      )}
      {qrCodeHtml && (
        <div style={{ marginTop: 24 }}>
          <h3>QR Code for Download</h3>
          <div dangerouslySetInnerHTML={{ __html: qrCodeHtml }} />
        </div>
      )}
    </div>
  );
}

export default App;

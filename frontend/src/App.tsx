import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './App.css';

const App = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [sourceFormat, setSourceFormat] = useState('step');
  const [targetFormat, setTargetFormat] = useState('stl');
  const [conversionStatus, setConversionStatus] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleConvert = async () => {
    if (files.length === 0) {
      alert('Please select a file to convert.');
      return;
    }

    const file = files[0];
    setConversionStatus('Getting upload URL...');

    try {
      // 1. Get a pre-signed URL for upload
      const uploadUrlResponse = await axios.post('/api/upload-url', {
        fileName: file.name,
      });
      const { uploadUrl } = uploadUrlResponse.data;

      // 2. Upload the file to S3
      setConversionStatus('Uploading file...');
      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type },
      });

      // 3. Initiate the conversion
      setConversionStatus('Converting file...');
      const convertResponse = await axios.post('/api/convert', {
        fileName: file.name,
        sourceFormat,
        targetFormat,
      });
      const { jobId } = convertResponse.data;

      // 4. Poll for conversion status
      setConversionStatus('Waiting for conversion to complete...');
      let status = '';
      while (status !== 'completed') {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Poll every 2 seconds
        const statusResponse = await axios.get(`/api/status/${jobId}`);
        status = statusResponse.data.status;
        setConversionStatus(`Conversion status: ${status}`);
      }

      // 5. Get the download URL
      const downloadUrlResponse = await axios.get(`/api/download-url/${jobId}`);
      setDownloadUrl(downloadUrlResponse.data.downloadUrl);
      setConversionStatus('Conversion complete!');
    } catch (error) {
      console.error('Conversion failed:', error);
      setConversionStatus('Conversion failed.');
    }
  };

  return (
    <div className="App">
      <h1>3D File Converter</h1>
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {files.length > 0 ? (
          <p>{files.map((file) => file.name).join(', ')}</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>
      <div className="options">
        <label>
          Source Format:
          <select value={sourceFormat} onChange={(e) => setSourceFormat(e.target.value)}>
            <option value="step">STEP</option>
            <option value="stp">STP</option>
            <option value="obj">OBJ</option>
            <option value="3mf">3MF</option>
          </select>
        </label>
        <label>
          Target Format:
          <select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value)}>
            <option value="stl">STL</option>
            <option value="step">STEP</option>
            <option value="stp">STP</option>
            <option value="obj">OBJ</option>
            <option value="3mf">3MF</option>
          </select>
        </label>
      </div>
      <button onClick={handleConvert} disabled={conversionStatus.startsWith('Converting') || conversionStatus.startsWith('Waiting')}>
        Convert
      </button>
      {conversionStatus && <p className="status">{conversionStatus}</p>}
      {downloadUrl && (
        <div className="download">
          <a href={downloadUrl} download>
            Download Converted File
          </a>
        </div>
      )}
    </div>
  );
};

export default App;
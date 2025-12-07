import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const App = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [sourceFormat, setSourceFormat] = useState('step');
  const [targetFormat, setTargetFormat] = useState('stl');
  const [conversionStatus, setConversionStatus] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');

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
      setJobId(jobId);

      // 4. Poll for conversion status
      setConversionStatus('Waiting for conversion to complete...');
      let status = '';
      while (status !== 'completed' && status !== 'failed') {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Poll every 2 seconds
        const statusResponse = await axios.get(`/api/status/${jobId}`);
        status = statusResponse.data.status;
        setConversionStatus(`Conversion status: ${status}`);
      }

      if (status === 'completed') {
        // 5. Get the download URL
        const downloadUrlResponse = await axios.get(
          `/api/download-url/${jobId}`
        );
        setDownloadUrl(downloadUrlResponse.data.downloadUrl);
        setConversionStatus('Conversion complete!');
      } else {
        setConversionStatus('Conversion failed.');
      }
    } catch (error) {
      console.error('Conversion failed:', error);
      setConversionStatus('Conversion failed.');
    }
  };

  return (
    <AppContainer>
      <Header>
        <h1>3D File Converter</h1>
      </Header>
      <ConverterContainer>
        <DropzoneContainer
          {...getRootProps()}
          isDragActive={isDragActive}
          as={motion.div}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <input {...getInputProps()} />
          {files.length > 0 ? (
            <p>{files.map((file) => file.name).join(', ')}</p>
          ) : (
            <p>Drag 'n' drop some files here, or click to select files</p>
          )}
        </DropzoneContainer>
        <OptionsContainer>
          <SelectContainer>
            <label>From</label>
            <select
              value={sourceFormat}
              onChange={(e) => setSourceFormat(e.target.value)}
            >
              <option value="step">STEP</option>
              <option value="stp">STP</option>
              <option value="obj">OBJ</option>
              <option value="3mf">3MF</option>
            </select>
          </SelectContainer>
          <SelectContainer>
            <label>To</label>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
            >
              <option value="stl">STL</option>
              <option value="step">STEP</option>
              <option value="stp">STP</option>
              <option value="obj">OBJ</option>
              <option value="3mf">3MF</option>
            </select>
          </SelectContainer>
        </OptionsContainer>
        <ConvertButton
          onClick={handleConvert}
          disabled={
            conversionStatus.startsWith('Converting') ||
            conversionStatus.startsWith('Waiting')
          }
          as={motion.button}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Convert
        </ConvertButton>
        {conversionStatus && <StatusText>{conversionStatus}</StatusText>}
        {downloadUrl && (
          <DownloadLink href={downloadUrl} download>
            Download Converted File
          </DownloadLink>
        )}
      </ConverterContainer>
      <AdContainer>
        {/* Placeholder for Google AdSense */}
      </AdContainer>
    </AppContainer>
  );
};

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica,
    Arial, sans-serif;
  background-color: #f7f8fc;
  min-height: 100vh;
`;

const Header = styled.header`
  width: 100%;
  padding: 2rem;
  text-align: center;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
`;

const ConverterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
  width: 100%;
  max-width: 500px;
`;

const DropzoneContainer = styled.div<{ isDragActive: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 150px;
  border: 2px dashed ${(props) => (props.isDragActive ? '#007bff' : '#ccc')};
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
`;

const OptionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin: 1rem 0;
`;

const SelectContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 48%;

  label {
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    color: #555;
  }

  select {
    width: 100%;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ccc;
  }
`;

const ConvertButton = styled.button`
  width: 100%;
  padding: 1rem;
  border-radius: 4px;
  border: none;
  background-color: #007bff;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const StatusText = styled.p`
  margin-top: 1rem;
  font-weight: bold;
`;

const DownloadLink = styled.a`
  margin-top: 1rem;
  font-weight: bold;
  color: #007bff;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const AdContainer = styled.div`
  width: 100%;
  max-width: 500px;
  margin-top: 2rem;
  padding: 1rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

export default App;

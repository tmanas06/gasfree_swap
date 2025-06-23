import React, { useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useIPFS } from '../hooks/useIPFS';
import { useArweave } from '../hooks/useArweave';
import { useWeb3 } from '../context/Web3Context';

const StorageContainer = styled(motion.div)`
  max-width: 800px;
  margin: 20px auto;
  background: ${props => props.theme.cardBackground};
  border-radius: 20px;
  padding: 24px;
  box-shadow: ${props => props.theme.cardShadow};
  border: 1px solid ${props => props.theme.borderColor};
`;

const StorageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const StorageTitle = styled.h2`
  color: ${props => props.theme.textPrimary};
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

const StorageToggle = styled.div`
  display: flex;
  background: ${props => props.theme.inputBackground};
  border-radius: 12px;
  padding: 4px;
`;

const ToggleButton = styled.button`
  background: ${props => props.active ? props.theme.primary : 'transparent'};
  color: ${props => props.active ? 'white' : props.theme.textSecondary};
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active ? props.theme.primary : props.theme.hoverBackground};
  }
`;

const UploadSection = styled.div`
  border: 2px dashed ${props => props.isDragOver ? props.theme.primary : props.theme.borderColor};
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  background: ${props => props.isDragOver ? `${props.theme.primary}10` : props.theme.inputBackground};
  transition: all 0.3s ease;
  margin-bottom: 24px;
  cursor: pointer;

  &:hover {
    border-color: ${props => props.theme.primary};
    background: ${props => props.theme.primary}05;
  }
`;

const UploadIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  color: ${props => props.theme.textSecondary};
`;

const UploadText = styled.p`
  color: ${props => props.theme.textPrimary};
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const UploadSubtext = styled.p`
  color: ${props => props.theme.textSecondary};
  font-size: 14px;
  margin: 0;
`;

const StorageInfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
`;

const InfoCard = styled.div`
  background: ${props => props.theme.detailsBackground};
  border-radius: 12px;
  padding: 16px;
  border: 1px solid ${props => props.theme.borderColor};
`;

const InfoTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const InfoIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
`;

const InfoName = styled.span`
  color: ${props => props.theme.textPrimary};
  font-weight: 600;
`;

const InfoDetail = styled.div`
  color: ${props => props.theme.textSecondary};
  font-size: 14px;
  margin-bottom: 4px;
`;

const FileList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const FileItem = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.theme.inputBackground};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid ${props => props.theme.borderColor};
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const FileIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${props => props.theme.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
`;

const FileDetails = styled.div``;

const FileName = styled.div`
  color: ${props => props.theme.textPrimary};
  font-weight: 500;
  margin-bottom: 4px;
`;

const FileSize = styled.div`
  color: ${props => props.theme.textSecondary};
  font-size: 12px;
`;

const FileActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: ${props => props.variant === 'danger' ? '#ff4757' : props.theme.primary};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const UploadProgress = styled.div`
  background: ${props => props.theme.detailsBackground};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${props => props.theme.borderColor};
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => props.theme.primary};
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  color: ${props => props.theme.textPrimary};
  font-size: 14px;
  text-align: center;
`;

const StorageInterface = () => {
  const { account, isConnected } = useWeb3();
  const { uploadToIPFS, getFromIPFS, ipfsGateway } = useIPFS();
  const { uploadToArweave, getFromArweave, getArweaveBalance } = useArweave();

  const [storageType, setStorageType] = useState('ipfs'); // 'ipfs' or 'arweave'
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [arweaveBalance, setArweaveBalance] = useState('0');

  const fileInputRef = useRef(null);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file extension
  const getFileExtension = (filename) => {
    return filename.split('.').pop().toUpperCase();
  };

  // Handle file drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Handle file selection
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFileUpload(files);
  };

  // Upload files
  const handleFileUpload = async (files) => {
    if (!isConnected || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress((i / files.length) * 50);

        let result;
        if (storageType === 'ipfs') {
          result = await uploadToIPFS(file);
        } else {
          result = await uploadToArweave(file);
        }

        const uploadedFile = {
          id: Date.now() + i,
          name: file.name,
          size: file.size,
          type: file.type,
          storageType,
          hash: result.hash || result.id,
          url: result.url,
          uploadDate: new Date().toISOString(),
          cost: result.cost || '0'
        };

        setUploadedFiles(prev => [...prev, uploadedFile]);
        setUploadProgress(((i + 1) / files.length) * 100);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Download file
  const downloadFile = async (file) => {
    try {
      let url;
      if (file.storageType === 'ipfs') {
        url = `${ipfsGateway}/ipfs/${file.hash}`;
      } else {
        url = `https://arweave.net/${file.hash}`;
      }

      window.open(url, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Remove file from list
  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Get storage costs
  const getStorageCost = (fileSize) => {
    if (storageType === 'ipfs') {
      return `$${(fileSize / (1024 * 1024 * 1024) * 0.01).toFixed(6)}/month`;
    } else {
      return `$${(fileSize / (1024 * 1024 * 1024) * 5.0).toFixed(4)} one-time`;
    }
  };

  return (
    <StorageContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <StorageHeader>
        <StorageTitle>Decentralized Storage</StorageTitle>
        <StorageToggle>
          <ToggleButton
            active={storageType === 'ipfs'}
            onClick={() => setStorageType('ipfs')}
          >
            IPFS
          </ToggleButton>
          <ToggleButton
            active={storageType === 'arweave'}
            onClick={() => setStorageType('arweave')}
          >
            Arweave
          </ToggleButton>
        </StorageToggle>
      </StorageHeader>

      <StorageInfoGrid>
        <InfoCard>
          <InfoTitle>
            <InfoIcon color="#6366f1">I</InfoIcon>
            <InfoName>IPFS Storage</InfoName>
          </InfoTitle>
          <InfoDetail>Cost: $0.01 per GB/month</InfoDetail>
          <InfoDetail>Speed: Fast retrieval</InfoDetail>
          <InfoDetail>Use case: Temporary storage, frequent access</InfoDetail>
        </InfoCard>

        <InfoCard>
          <InfoTitle>
            <InfoIcon color="#10b981">A</InfoIcon>
            <InfoName>Arweave Storage</InfoName>
          </InfoTitle>
          <InfoDetail>Cost: $5.00 per GB (one-time)</InfoDetail>
          <InfoDetail>Speed: Permanent storage</InfoDetail>
          <InfoDetail>Use case: Archive, permanent records</InfoDetail>
        </InfoCard>
      </StorageInfoGrid>

      <UploadSection
        isDragOver={isDragOver}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleFileSelect}
      >
        <UploadIcon>
          {storageType === 'ipfs' ? '📁' : '🏛️'}
        </UploadIcon>
        <UploadText>
          Drop files here or click to upload to {storageType.toUpperCase()}
        </UploadText>
        <UploadSubtext>
          Supports any file type. {storageType === 'ipfs' ? 'Fast and affordable' : 'Permanent storage'}
        </UploadSubtext>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
      </UploadSection>

      <AnimatePresence>
        {isUploading && (
          <UploadProgress>
            <ProgressBar>
              <ProgressFill progress={uploadProgress} />
            </ProgressBar>
            <ProgressText>
              Uploading to {storageType.toUpperCase()}... {Math.round(uploadProgress)}%
            </ProgressText>
          </UploadProgress>
        )}
      </AnimatePresence>

      {uploadedFiles.length > 0 && (
        <FileList>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>
            Uploaded Files
          </h3>
          {uploadedFiles.map((file) => (
            <FileItem
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FileInfo>
                <FileIcon>
                  {getFileExtension(file.name)}
                </FileIcon>
                <FileDetails>
                  <FileName>{file.name}</FileName>
                  <FileSize>
                    {formatFileSize(file.size)} • {file.storageType.toUpperCase()} • 
                    Cost: {getStorageCost(file.size)}
                  </FileSize>
                </FileDetails>
              </FileInfo>

              <FileActions>
                <ActionButton onClick={() => downloadFile(file)}>
                  Download
                </ActionButton>
                <ActionButton 
                  variant="danger" 
                  onClick={() => removeFile(file.id)}
                >
                  Remove
                </ActionButton>
              </FileActions>
            </FileItem>
          ))}
        </FileList>
      )}
    </StorageContainer>
  );
};

export default StorageInterface;
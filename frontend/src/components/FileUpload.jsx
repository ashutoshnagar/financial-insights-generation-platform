import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  Paper,
  Divider
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { formatBytes } from '../utils/helpers';

const FileUpload = ({ onUpload, loading = false, maxFiles = 2 }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errors, setErrors] = useState([]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Clear previous errors
    setErrors([]);
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const newErrors = rejectedFiles.map(({ file, errors }) => ({
        file: file.name,
        errors: errors.map(e => e.message)
      }));
      setErrors(newErrors);
    }

    // Handle accepted files
    if (acceptedFiles.length > 0) {
      // Validate file count
      const totalFiles = uploadedFiles.length + acceptedFiles.length;
      if (totalFiles > maxFiles) {
        setErrors([{
          file: 'File Count',
          errors: [`Maximum ${maxFiles} files allowed`]
        }]);
        return;
      }

      // Add files to state
      const newFiles = acceptedFiles.map(file => ({
        file,
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'ready'
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  }, [uploadedFiles.length, maxFiles]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    maxFiles
  });

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    setErrors([]);
  };

  const handleUpload = () => {
    if (uploadedFiles.length === 0) return;
    
    const files = uploadedFiles.map(f => f.file);
    onUpload(files);
  };

  const getDropZoneStyle = () => {
    let borderColor = '#cbd5e1';
    let backgroundColor = '#f8fafc';
    
    if (isDragActive && !isDragReject) {
      borderColor = '#3b82f6';
      backgroundColor = '#eff6ff';
    } else if (isDragReject) {
      borderColor = '#ef4444';
      backgroundColor = '#fef2f2';
    }
    
    return { borderColor, backgroundColor };
  };

  return (
    <Box>
      {/* Compact File Drop Zone */}
      <Paper
        {...getRootProps()}
        elevation={0}
        sx={{
          border: '2px dashed',
          borderRadius: 3,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          ...getDropZoneStyle(),
          '&:hover': {
            borderColor: '#3b82f6',
            backgroundColor: '#eff6ff'
          }
        }}
      >
        <input {...getInputProps()} />
        
        <UploadIcon 
          sx={{ 
            fontSize: 40, 
            color: isDragReject ? 'error.main' : 'primary.main',
            mb: 1 
          }} 
        />
        
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          {isDragActive
            ? isDragReject
              ? 'Invalid file type'
              : 'Drop files here'
            : 'Upload Portfolio Data'
          }
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isDragActive ? '' : 'Drag & drop files or click to browse'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 1 }}>
          <Chip label="2 CSV Files" variant="outlined" size="small" />
          <Chip label="1 Excel File" variant="outlined" size="small" />
        </Box>
        
        <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
          Previous & Current Month • Max 50MB each
        </Typography>
      </Paper>

      {/* Compact File List */}
      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Selected Files ({uploadedFiles.length})
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {uploadedFiles.map((fileInfo) => (
              <Paper key={fileInfo.id} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                <FileIcon color="primary" sx={{ mr: 2, fontSize: 20 }} />
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {fileInfo.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatBytes(fileInfo.size)}
                    </Typography>
                    <Chip 
                      label={fileInfo.type.includes('excel') ? 'Excel' : 'CSV'} 
                      size="small" 
                      variant="outlined"
                      sx={{ height: 20 }}
                    />
                    <Chip 
                      icon={<CheckIcon />} 
                      label="Ready" 
                      size="small" 
                      color="success"
                      variant="outlined"
                      sx={{ height: 20 }}
                    />
                  </Box>
                </Box>
                
                <IconButton 
                  size="small"
                  onClick={() => removeFile(fileInfo.id)}
                  disabled={loading}
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors.map((error, index) => (
            <Typography variant="body2" key={index}>
              <strong>{error.file}:</strong> {error.errors.join(', ')}
            </Typography>
          ))}
        </Alert>
      )}


      {/* Fixed Position Action Buttons */}
      <Box sx={{ 
        mt: 3, 
        display: 'flex', 
        gap: 2, 
        justifyContent: 'flex-end',
        position: 'sticky',
        bottom: 0,
        bgcolor: 'background.paper',
        py: 1
      }}>
        <Button
          variant="outlined"
          onClick={() => {
            setUploadedFiles([]);
            setErrors([]);
          }}
          disabled={loading || uploadedFiles.length === 0}
        >
          Clear All
        </Button>
        
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={handleUpload}
          disabled={loading || uploadedFiles.length === 0 || errors.length > 0}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Processing...' : 'Upload'}
        </Button>
      </Box>

      {/* Loading Progress */}
      {loading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress sx={{ borderRadius: 1 }} />
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
            Processing files and analyzing data structure...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;

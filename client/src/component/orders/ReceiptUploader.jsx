import React, { useState, useRef } from 'react';
import {
  Box, Button, Typography, Paper, LinearProgress, Chip, 
  Alert, IconButton, Tooltip, Fade, Slide, useTheme
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import Tesseract from 'tesseract.js';
import ApiService from '../../ApiService';

export default function ReceiptUploader({ 
  reservationId, 
  onReceiptUploaded, 
  currentStatus = 'pending',
  receiptFilePath = null 
}) {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // בדיקת סוג הקובץ (תמונה או PDF)
      const isImage = selectedFile.type.startsWith('image/');
      const isPdf = selectedFile.type === 'application/pdf';
      if (!isImage && !isPdf) {
        setError('אנא העלה קובץ תמונה או PDF');
        return;
      }
      
      // בדיקת גודל הקובץ (מקסימום 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('גודל הקובץ לא יכול לעלות על 10MB');
        return;
      }

      setFile(selectedFile);
      setError(null);
      
      // יצירת תצוגה מקדימה (רק לתמונות)
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setAnalyzing(true);
    setProgress(0);
    setError(null);

    try {
      // שלב 1: העלאת הקובץ לשרת
      const formData = new FormData();
      formData.append('receipt', file);
      formData.append('reservationId', reservationId);

      setProgress(20);
      
      await ApiService.request({
        endPath: `reservations/${reservationId}/upload_receipt`,
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      setProgress(40);

      // שלב 2: ניתוח המסמך
      let result = { data: { text: '', confidence: null } };
      if (file.type === 'application/pdf') {
        // ב-PDF העיבוד יתבצע בצד השרת; כאן לא מבצעים OCR
        setProgress(80);
      } else {
        // תמונה: OCR בצד לקוח
        result = await Tesseract.recognize(
          file,
          'heb+eng',
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                setProgress(40 + (m.progress * 40));
              }
            }
          }
        );
      }

      setProgress(80);

      // שלב 3: שליחת התוצאות לשרת לאישור
      const analysisData = {
        analyzedText: result.data.text,
        amount: extractAmount(result.data.text),
        date: extractDate(result.data.text),
        senderName: extractSenderName(result.data.text),
        confidence: result.data.confidence || null
      };

      await ApiService.request({
        endPath: `reservations/${reservationId}/verify_receipt`,
        method: 'POST',
        body: analysisData,
        credentials: 'include'
      });

      setProgress(100);
      setSuccess(true);
      
      // קריאה לפונקציה שמעדכנת את הקומפוננטה ההורה
      if (onReceiptUploaded) {
        onReceiptUploaded();
      }

      // איפוס המצב אחרי 3 שניות
      setTimeout(() => {
        setSuccess(false);
        setFile(null);
        setPreview(null);
        setProgress(0);
      }, 3000);

    } catch (error) {
      console.error('Error processing receipt:', error);
      setError(error.message || 'שגיאה בעיבוד המסמך');
    } finally {
      setAnalyzing(false);
    }
  };

  const extractAmount = (text) => {
    // חיפוש סכומים כמו "100.00 ₪" או "100 ש"ח" או "100 שח"
    const amountRegex = /(\d+\.?\d*)\s*(₪|ש"ח|שח|nis|NIS)/gi;
    const matches = text.match(amountRegex);
    if (matches) {
      const amount = parseFloat(matches[0].replace(/[^\d.]/g, ''));
      return isNaN(amount) ? null : amount;
    }
    return null;
  };

  const extractDate = (text) => {
    // חיפוש תאריכים כמו "01/01/2025" או "2025-01-01" או "01.01.2025"
    const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})|(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g;
    const matches = text.match(dateRegex);
    return matches ? matches[0] : null;
  };

  const extractSenderName = (text) => {
    // חיפוש שמות (פשוט - מילים שמתחילות באות גדולה)
    const nameRegex = /[א-תA-Z][א-תa-z]+\s+[א-תA-Z][א-תa-z]+/g;
    const matches = text.match(nameRegex);
    return matches ? matches[0] : null;
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'receipt_verified': return 'success';
      case 'receipt_under_review': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case 'receipt_verified': return 'הסמכתא אושרה';
      case 'receipt_under_review': return 'הסמכתא בבדיקה';
      default: return 'לא הועלתה הסמכתא';
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        borderRadius: 3,
        background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f4fd 100%)',
        border: `1px solid ${theme.palette.primary.light}20`
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ReceiptIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
        <Typography variant="h6" fontWeight={600} color="primary.main">
          העלאת הסמכתא
        </Typography>
        <Chip 
          label={getStatusText()}
          color={getStatusColor()}
          size="small"
          sx={{ ml: 'auto' }}
        />
      </Box>

      {error && (
        <Slide direction="up" in={!!error}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </Slide>
      )}

      {success && (
        <Slide direction="up" in={success}>
          <Alert severity="success" sx={{ mb: 2 }}>
            הסמכתא הועלתה ונוהלה בהצלחה! 🎉
          </Alert>
        </Slide>
      )}

      {analyzing && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            מעבד את המסמך... {Math.round(progress)}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      )}

      {!file && !preview && (
        <Box
          sx={{
            border: `2px dashed ${theme.palette.primary.light}`,
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              backgroundColor: theme.palette.primary.light + '10'
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
          <Typography variant="h6" color="primary.main" sx={{ mb: 1 }}>
            העלה הסמכתא
          </Typography>
          <Typography variant="body2" color="text.secondary">
            לחץ כאן או גרור קובץ תמונה או PDF (JPG, PNG, GIF, PDF)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            מקסימום 10MB
          </Typography>
        </Box>
      )}

      {preview && (
        <Fade in={!!preview}>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <img 
                src={preview} 
                alt="תצוגה מקדימה" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: 300, 
                  borderRadius: 8,
                  border: `2px solid ${theme.palette.primary.light}`
                }} 
              />
              <IconButton
                onClick={handleRemoveFile}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        </Fade>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {file && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={analyzing}
            startIcon={analyzing ? <LinearProgress /> : <CheckIcon />}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)'
              }
            }}
          >
            {analyzing ? 'מעבד...' : 'העלה ובדוק'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={handleRemoveFile}
            disabled={analyzing}
            sx={{ borderRadius: 2, px: 4, py: 1.5 }}
          >
            בטל
          </Button>
        </Box>
      )}

      {receiptFilePath && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            הסמכתא הנוכחית:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon sx={{ fontSize: 20, color: 'success.main' }} />
            <Typography variant="body2" sx={{ flex: 1 }}>
              הסמכתא הועלתה בהצלחה
            </Typography>
            <Tooltip title="צפה בהסמכתא">
              <IconButton size="small" color="primary">
                <ViewIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Paper>
  );
}

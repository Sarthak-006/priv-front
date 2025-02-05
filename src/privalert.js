import React, { useState, useCallback, useEffect } from 'react';
import {
  AppBar,
  Box,
  Button,
  Container,
  CssBaseline,
  FormControlLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
  useMediaQuery,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { styled } from '@mui/system';
import {
  CloudUpload,
  Lock,
  Settings,
  Description,
  PrivacyTip,
  Refresh,
  Error,
  CheckCircle,
} from '@mui/icons-material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
  },
}));

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const API_URL = process.env.REACT_APP_API_URL || 'https://privalert-backend.vercel.app';

const AnalysisResult = styled(Box)(({ theme, haspii }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: haspii === 'true' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 0, 0.1)',
  border: `1px solid ${haspii === 'true' ? theme.palette.error.main : theme.palette.success.main}`,
  marginTop: theme.spacing(2)
}));

function App() {
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bgOption, setBgOption] = useState('default');
  const [bgColor, setBgColor] = useState('#f5f5f5');
  const [bgImage, setBgImage] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch(`${API_URL}/health`);
        if (!response.ok) {
          throw new Error('Backend health check failed');
        }
      } catch (error) {
        console.error('Backend health check failed:', error);
        setSnackbar({
          open: true,
          message: 'Warning: Backend service may be unavailable',
          severity: 'warning'
        });
      }
    };

    checkBackendHealth();
  }, []);

  const handleFileChange = useCallback((event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, []);

  const handlePromptChange = useCallback((event) => {
    setPrompt(event.target.value);
  }, []);

  const handleProcess = useCallback(async () => {
    if (!file || !prompt) {
      setSnackbar({ open: true, message: 'Please upload an image and enter a prompt.', severity: 'warning' });
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('prompt', prompt);

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process the image');
      }

      const data = await response.json();
      setImageDescription(data.image_description || 'No description available.');
      setAnalysis(data.privacy_analysis || 'No analysis available.');
      setSnackbar({ open: true, message: 'Analysis completed successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error:', error);
      setSnackbar({ 
        open: true, 
        message: `Error: ${error.message || 'An error occurred while processing the image'}`, 
        severity: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [file, prompt]);

  const handleClearInputs = useCallback(() => {
    setFile(null);
    setImagePreview(null);
    setPrompt('');
    setImageDescription('');
    setAnalysis('');
    setSnackbar({ open: true, message: 'Inputs cleared successfully.', severity: 'info' });
  }, []);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: bgOption === 'color' ? bgColor : 'inherit',
          backgroundImage: bgOption === 'image' ? `url(${bgImage})` : 'none',
          backgroundSize: 'cover',
          backgroundAttachment: 'fixed',
        }}
      >
        <AppBar position="static" color="primary" elevation={0}>
          <Toolbar>
            <Lock sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              PrivAlert: Privacy-Focused Document Analysis
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <StyledPaper>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Settings sx={{ mr: 1 }} /> Settings
                </Typography>
                <RadioGroup
                  value={bgOption}
                  onChange={(e) => setBgOption(e.target.value)}
                >
                  <FormControlLabel value="default" control={<Radio />} label="Default" />
                  <FormControlLabel value="color" control={<Radio />} label="Color" />
                  <FormControlLabel value="image" control={<Radio />} label="Image" />
                </RadioGroup>
                {bgOption === 'color' && (
                  <TextField
                    fullWidth
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    sx={{ mt: 2 }}
                  />
                )}
                {bgOption === 'image' && (
                  <TextField
                    fullWidth
                    label="Image URL"
                    value={bgImage}
                    onChange={(e) => setBgImage(e.target.value)}
                    sx={{ mt: 2 }}
                  />
                )}
                <Button
                  variant="outlined"
                  onClick={handleClearInputs}
                  fullWidth
                  sx={{ mt: 2 }}
                  startIcon={<Refresh />}
                >
                  Clear Inputs
                </Button>
              </StyledPaper>
            </Grid>
            <Grid item xs={12} md={9}>
              <StyledPaper>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CloudUpload sx={{ mr: 1 }} /> Image Input
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Button
                    component="label"
                    variant="contained"
                    startIcon={<CloudUpload />}
                    sx={{ mb: 2 }}
                  >
                    Upload Image
                    <VisuallyHiddenInput type="file" onChange={handleFileChange} accept="image/*" />
                  </Button>
                  {imagePreview && (
                    <Box
                      component="img"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 300,
                        objectFit: 'contain',
                        mt: 2,
                        borderRadius: 2,
                      }}
                      src={imagePreview}
                      alt="Uploaded image preview"
                    />
                  )}
                  {file && (
                    <Typography sx={{ mt: 2 }}>
                      File: {file.name}
                    </Typography>
                  )}
                </Box>
              </StyledPaper>
              <StyledPaper>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Description sx={{ mr: 1 }} /> Text Prompt
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  placeholder="Enter your prompt (e.g., Describe this image)"
                  value={prompt}
                  onChange={handlePromptChange}
                />
              </StyledPaper>
              <Button
                variant="contained"
                onClick={handleProcess}
                disabled={isLoading}
                fullWidth
                sx={{ mt: 2, mb: 3, py: 1.5 }}
                size="large"
                startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : null}
              >
                {isLoading ? 'Processing...' : 'Analyze Image'}
              </Button>
              {imageDescription && (
                <StyledPaper>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Description sx={{ mr: 1 }} /> Image Description
                  </Typography>
                  <Typography variant="body1">{imageDescription}</Typography>
                </StyledPaper>
              )}
              {analysis && (
                <StyledPaper>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PrivacyTip sx={{ mr: 1 }} /> Privacy Analysis
                  </Typography>
                  <AnalysisResult haspii={String(analysis.toLowerCase().includes('pii detected'))}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {analysis.toLowerCase().includes('pii detected') ? (
                        <Error color="error" sx={{ mr: 1 }} />
                      ) : (
                        <CheckCircle color="success" sx={{ mr: 1 }} />
                      )}
                      <Typography
                        variant="h6"
                        sx={{
                          color: analysis.toLowerCase().includes('pii detected') 
                            ? 'error.main' 
                            : 'success.main',
                          fontWeight: 'medium',
                        }}
                      >
                        {analysis.toLowerCase().includes('pii detected') 
                          ? 'PII Detected!' 
                          : 'No PII Detected'}
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {analysis}
                    </Typography>
                  </AnalysisResult>
                </StyledPaper>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;


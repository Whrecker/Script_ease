// src/pages/PrescriptionPage.tsx

import { useState, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Mic, Stop, Edit, Download, Print as PrintIcon } from '@mui/icons-material';
import { usePrescriptionStore } from '../store/prescriptionStore';
import PrescriptionTemplate from '../components/PrescriptionTemplate'; // Assuming you have these components
import { generatePrescriptionPDF } from '../utils/pdfGenerator';    // Assuming you have these utils

// This component can stay the same
const PatientInfoDisplay = () => {
  const { name, age } = usePrescriptionStore((state) => state.patientInfo);
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h4" gutterBottom>Patient Information</Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}><Typography variant="subtitle1">Name: {name}</Typography></Grid>
        <Grid item xs={6}><Typography variant="subtitle1">Age: {age}</Typography></Grid>
      </Grid>
    </Paper>
  );
};

const PrescriptionPage = () => {
  const {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording, // We'll use the new async version from the store
    prescriptionData,
    patientInfo,
    updatePrescriptionData,
  } = usePrescriptionStore();

  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const prescriptionRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // ✅ MODIFIED RECORDING LOGIC
  const handleStartRecording = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaRecorderRef.current = new MediaRecorder(stream);
          mediaRecorderRef.current.ondataavailable = event => {
            audioChunksRef.current.push(event.data);
          };
          mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            stopRecording(audioBlob); // Call store action with the final audio blob
            audioChunksRef.current = [];
          };
          mediaRecorderRef.current.start();
          startRecording(); // Update state in store
        })
        .catch(err => console.error("Error getting user media:", err));
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop(); // This will trigger the onstop event
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setIsEditing(false);
  };

  const handleViewPrescription = () => {
    setShowPreview(true);
    setIsEditing(false);
  };

  const handleEdit = () => setIsEditing(true);
  const handleSave = () => setIsEditing(false);

  // No changes needed below this line, as it already expects the correct object format
  const handleDownload = async () => { /* ... your existing code ... */ };
  const handlePrint = () => { /* ... your existing code ... */ };

  const handleMedicineChange = (index: number, field: 'name' | 'dosage' | 'duration', value: string) => {
    const updatedMedicines = [...(prescriptionData.medicines as any[])];
    updatedMedicines[index] = { ...updatedMedicines[index], [field]: value };
    updatePrescriptionData({ ...prescriptionData, medicines: updatedMedicines });
  };
  const handleAddMedicine = () => {
    const newMedicines = [...(prescriptionData.medicines as any[]), { name: '', dosage: '', duration: '' }];
    updatePrescriptionData({ ...prescriptionData, medicines: newMedicines });
  };
  const handleRemoveMedicine = (index: number) => {
    const updatedMedicines = (prescriptionData.medicines as any[]).filter((_, i) => i !== index);
    updatePrescriptionData({ ...prescriptionData, medicines: updatedMedicines });
  };
  const handleAdviceChange = (value: string) => {
    updatePrescriptionData({ ...prescriptionData, advice: value });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PatientInfoDisplay />
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>Voice Prescription</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <Button
            variant="contained"
            color={isRecording ? 'error' : 'primary'}
            size="large"
            startIcon={isRecording ? <Stop /> : <Mic />}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
        </Box>
        {isProcessing && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2, alignSelf: 'center' }}>Processing audio...</Typography>
          </Box>
        )}
      </Paper>

      {(prescriptionData.medicines.length > 0 || prescriptionData.advice) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button variant="outlined" color="primary" startIcon={<Edit />} onClick={handleViewPrescription}>
            View Prescription
          </Button>
        </Box>
      )}

      <Dialog open={showPreview} onClose={handleClosePreview} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Prescription Preview</Typography>
            <Box>
              <IconButton onClick={handleEdit} disabled={isEditing}><Edit /></IconButton>
              <IconButton onClick={handlePrint} disabled={isEditing}><PrintIcon /></IconButton>
              <IconButton onClick={handleDownload} disabled={isEditing || isGeneratingPDF}><Download /></IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {isEditing ? (
            <Box sx={{ mt: 2 }}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Medicine Name</TableCell>
                      <TableCell>Dosage</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(prescriptionData.medicines as any[]).map((medicine, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField fullWidth value={medicine.name || ''} onChange={(e) => handleMedicineChange(index, 'name', e.target.value)} size="small" />
                        </TableCell>
                        <TableCell>
                          <TextField fullWidth value={medicine.dosage || ''} onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)} size="small" />
                        </TableCell>
                        <TableCell>
                          <TextField fullWidth value={medicine.duration || ''} onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)} size="small" />
                        </TableCell>
                        <TableCell>
                          <IconButton color="error" onClick={() => handleRemoveMedicine(index)}><Stop /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button variant="outlined" onClick={handleAddMedicine} sx={{ mt: 2 }}>Add Medicine</Button>
              <TextField fullWidth multiline rows={2} label="Advice" value={prescriptionData.advice || ''} onChange={(e) => handleAdviceChange(e.target.value)} sx={{ mt: 3 }}/>
            </Box>
          ) : (
            <PrescriptionTemplate ref={prescriptionRef} />
          )}
        </DialogContent>
        <DialogActions>
          {isEditing ? (
            <Button onClick={handleSave} variant="contained">Save Changes</Button>
          ) : null}
          <Button onClick={handleClosePreview}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
    </Container>
  );
};

export default PrescriptionPage;
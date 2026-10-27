import { Box, Paper, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { usePrescriptionStore } from '../store/prescriptionStore'
import { forwardRef } from 'react'

const PrescriptionTemplate = forwardRef<HTMLDivElement>((_, ref) => {
  const { patientInfo, doctorInfo, prescriptionData } = usePrescriptionStore()

  return (
    <Paper
      ref={ref}
      elevation={0}
      sx={{
        p: 4,
        background: '#fff',
        border: '1px solid #e0e0e0',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("/prescription-bg.svg")',
          opacity: 0.1,
          zIndex: 0,
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            MEDICAL PRESCRIPTION
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#666' }}>
            {doctorInfo.name}, {doctorInfo.title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Medical License #{doctorInfo.license} | Phone: {doctorInfo.phone}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            {doctorInfo.address}
          </Typography>
        </Box>

        {/* Patient Info */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" sx={{ color: '#666' }}>
                Patient Name:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {patientInfo.name}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" sx={{ color: '#666' }}>
                Age:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {patientInfo.age} years
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" sx={{ color: '#666' }}>
                Date:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {new Date().toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Prescription Content */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>
            Rx:
          </Typography>
          <Box
            sx={{
              minHeight: '200px',
              border: '1px dashed #ccc',
              p: 2,
              borderRadius: 1,
            }}
          >
            {/* Medicines Table */}
            {prescriptionData.medicines.length > 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Medicine Name</TableCell>
                      <TableCell>Dosage</TableCell>
                      <TableCell>Frequency</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prescriptionData.medicines.map((medicine, index) => (
                      <TableRow key={index}>
                        <TableCell>{medicine.name}</TableCell>
                        <TableCell>{medicine.dosage}</TableCell>
                        <TableCell>{medicine.frequency}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Advice */}
            {prescriptionData.advice && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>
                  Advice:
                </Typography>
                <Typography variant="body1">
                  {prescriptionData.advice}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 6, borderTop: '1px solid #e0e0e0', pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Doctor's Signature
              </Typography>
              <Box sx={{ mt: 4, borderTop: '1px solid #000', width: '80%' }} />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Date & Stamp
              </Typography>
              <Box sx={{ mt: 4, borderTop: '1px solid #000', width: '80%' }} />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Paper>
  )
})

PrescriptionTemplate.displayName = 'PrescriptionTemplate'

export default PrescriptionTemplate 
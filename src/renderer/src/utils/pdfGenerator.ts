import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export const generatePrescriptionPDF = async (element: HTMLElement, patientName: string) => {
  try {
    // Create a canvas from the prescription element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Enable CORS for images
      logging: false,
      backgroundColor: '#ffffff',
    })

    // Calculate dimensions
    const imgWidth = 210 // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgData = canvas.toDataURL('image/png')

    // Add the image to the PDF
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

    // Generate filename with patient name and date
    const date = new Date().toISOString().split('T')[0]
    const filename = `Prescription_${patientName}_${date}.pdf`

    // Save the PDF
    pdf.save(filename)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
} 
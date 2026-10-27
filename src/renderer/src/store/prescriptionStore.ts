import { create } from 'zustand'
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
interface PatientInfo {
  name: string
  age: number
}

interface DoctorInfo {
  name: string
  title: string
  license: string
  phone: string
  address: string
}

interface Medicine {
  name: string
  dosage: string
  duration: string
}

interface PrescriptionData {
  medicines: Medicine[]
  advice: string
}

interface PrescriptionState {
  patientInfo: PatientInfo
  doctorInfo: DoctorInfo
  prescriptionData: PrescriptionData
  isRecording: boolean
  isProcessing: boolean
  setPatientInfo: (info: PatientInfo) => void
  setDoctorInfo: (info: DoctorInfo) => void
  updatePrescriptionData: (data: PrescriptionData) => void
  setIsRecording: (isRecording: boolean) => void
  setIsProcessing: (isProcessing: boolean) => void
  startRecording: () => void
  stopRecording: () => void
  savePrescription: () => void
}

export const usePrescriptionStore = create<PrescriptionState>((set) => ({
  patientInfo: {
    name: 'John Doe',
    age: 30,
  },
  doctorInfo: {
    name: 'Dr. John Smith',
    title: 'MD',
    license: '12345',
    phone: '(555) 123-4567',
    address: '123 Medical Center Dr, Suite 100',
  },
  prescriptionData: {
    medicines: [],
    advice: '',
  },
  isRecording: false,
  isProcessing: false,

  setPatientInfo: (info) => set({ patientInfo: info }),
  setDoctorInfo: (info) => set({ doctorInfo: info }),
  updatePrescriptionData: (data) => set({ prescriptionData: data }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),

  startRecording: async () => {
    set({ isRecording: true })

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }

    mediaRecorder.start()
  },

  stopRecording: async () => {
    set({ isRecording: false, isProcessing: true })
  
    return new Promise<void>((resolve) => {
      if (!mediaRecorder) {
        set({ isProcessing: false });
        resolve();
        return;
      }
  
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('audio', audioBlob, 'voice-recording.webm')
  
        try {
          const res = await fetch('http://127.0.0.1:5000/audio', {
            method: 'POST',
            body: formData,
          })
  
          if (!res.ok) {
            throw new Error(`Server responded with status ${res.status}`)
          }
          console.log(res)
          const data = await res.json()
          console.log(data)
          // Check if data contains the expected fields, provide defaults if not
          set({
            prescriptionData: {
              medicines: Array.isArray(data.medicines) ? data.medicines : [],
              advice: typeof data.advice === 'string' ? data.advice : '',
            },
            isProcessing: false,
          })
        } catch (error) {
          console.error('Error processing audio:', error)
          // Keep existing medicines if there's an error, just update processing state
          set({ isProcessing: false })
        }
  
        resolve()
      }
  
      mediaRecorder?.stop()
    })
  },
  savePrescription: () => {
    // Backend integration: Save prescription
  },
})) 
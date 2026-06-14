import { useEffect, useRef } from 'react'
import { useWinkDetector } from './useWinkDetector'

function Camera({ onWinkRight, onWinkLeft, onCalibrated, onRecalibrateRef, hidden }) {
  const videoRef = useRef(null)

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        })
        videoRef.current.srcObject = stream
      } catch (err) {
        console.error('Error al acceder a la cámara:', err)
      }
    }
    startCamera()
  }, [])

  const { recalibrate } = useWinkDetector(videoRef, onWinkRight, onWinkLeft, onCalibrated)

  useEffect(() => {
    if (onRecalibrateRef) onRecalibrateRef.current = recalibrate
  }, [recalibrate])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      style={{
        width: '100px',
        height: '75px',
        borderRadius: '8px',
        border: '0.5px solid #444',
        transform: 'scaleX(-1)',
        display: hidden ? 'none' : 'block'
      }}
    />
  )
}

export default Camera
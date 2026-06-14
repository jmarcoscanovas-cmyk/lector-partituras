import { useEffect, useRef } from 'react'
import { useWinkDetector } from './useWinkDetector'

function Camera({ onWinkRight, onWinkLeft, onCalibrated, hidden }) {
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

  useWinkDetector(videoRef, onWinkRight, onWinkLeft, onCalibrated)

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
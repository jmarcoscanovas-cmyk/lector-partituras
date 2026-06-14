import { useEffect, useRef } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

const LEFT_EYE  = [263, 387, 385, 362, 380, 373]
const RIGHT_EYE = [33, 160, 158, 133, 153, 144]
const SMOOTH_WINDOW = 5
const TH_RATIO = 0.65

function EAR(landmarks, eye) {
  const pts = eye.map(i => ({ x: landmarks[i].x, y: landmarks[i].y }))
  const d1 = Math.hypot(pts[1].x - pts[5].x, pts[1].y - pts[5].y)
  const d2 = Math.hypot(pts[2].x - pts[4].x, pts[2].y - pts[4].y)
  const d3 = Math.hypot(pts[0].x - pts[3].x, pts[0].y - pts[3].y)
  return (d1 + d2) / (2.0 * d3)
}

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function useWinkDetector(videoRef, onWinkRight, onWinkLeft, onCalibrated) {
  const detectorRef    = useRef(null)
  const baselineLRef   = useRef(null)
  const baselineRRef   = useRef(null)
  const leftHistRef    = useRef([])
  const rightHistRef   = useRef([])
  const lockRightRef   = useRef(false)
  const lockLeftRef    = useRef(false)
  const calibDataL     = useRef([])
  const calibDataR     = useRef([])
  const calibDoneRef   = useRef(false)
  const calibStartRef  = useRef(null)
  const onWinkRightRef = useRef(onWinkRight)
  const onWinkLeftRef  = useRef(onWinkLeft)
  const onCalibratedRef = useRef(onCalibrated)
  const CALIB_TIME = 2000

  useEffect(() => { onWinkRightRef.current = onWinkRight }, [onWinkRight])
  useEffect(() => { onWinkLeftRef.current = onWinkLeft }, [onWinkLeft])
  useEffect(() => { onCalibratedRef.current = onCalibrated }, [onCalibrated])

  function recalibrate() {
    calibDataL.current   = []
    calibDataR.current   = []
    calibDoneRef.current = false
    calibStartRef.current = performance.now()
    leftHistRef.current  = []
    rightHistRef.current = []
  }

  useEffect(() => {
    let animFrame

    async function init() {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      )
      detectorRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1
      })
      calibStartRef.current = performance.now()
      animFrame = requestAnimationFrame(detect)
    }

    function detect() {
      const video = videoRef.current

      if (!video || !detectorRef.current) {
        animFrame = requestAnimationFrame(detect)
        return
      }

      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        animFrame = requestAnimationFrame(detect)
        return
      }

      const now = performance.now()

      let results
      try {
        results = detectorRef.current.detectForVideo(video, now)
      } catch (err) {
        animFrame = requestAnimationFrame(detect)
        return
      }

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const lm = results.faceLandmarks[0]
        const earL = EAR(lm, LEFT_EYE)
        const earR = EAR(lm, RIGHT_EYE)

        if (!calibDoneRef.current) {
          calibDataL.current.push(earL)
          calibDataR.current.push(earR)

          if (now - calibStartRef.current >= CALIB_TIME) {
            baselineLRef.current = mean(calibDataL.current)
            baselineRRef.current = mean(calibDataR.current)
            calibDoneRef.current = true
            if (onCalibratedRef.current) onCalibratedRef.current()
          }
        } else {
          leftHistRef.current  = [...leftHistRef.current.slice(-(SMOOTH_WINDOW - 1)), earL]
          rightHistRef.current = [...rightHistRef.current.slice(-(SMOOTH_WINDOW - 1)), earR]

          const sL = mean(leftHistRef.current)
          const sR = mean(rightHistRef.current)

          const mL = baselineLRef.current
          const mR = baselineRRef.current

          const leftClosed  = sL < mL * TH_RATIO
          const rightClosed = sR < mR * TH_RATIO

          const winkRight = rightClosed && !leftClosed && sL > sR
          const winkLeft  = leftClosed  && !rightClosed && sL < sR

          if (winkRight && !lockRightRef.current) {
            onWinkRightRef.current()
            lockRightRef.current = true
          } else if (!winkRight) {
            lockRightRef.current = false
          }

          if (winkLeft && !lockLeftRef.current) {
            onWinkLeftRef.current()
            lockLeftRef.current = true
          } else if (!winkLeft) {
            lockLeftRef.current = false
          }
        }
      }

      animFrame = requestAnimationFrame(detect)
    }

    init()
    return () => cancelAnimationFrame(animFrame)
  }, [])

  return { recalibrate }
}
import { useState, useRef, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import Thumbnails from './Thumbnails'
import Camera from './Camera'
import { useZoom } from './useZoom'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

function PdfViewer() {
  const [pdf, setPdf] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [calibrated, setCalibrated] = useState(false)
  const [concertMode, setConcertMode] = useState(false)
  const canvasRef = useRef(null)
  const zoomRef = useRef(null)
  const recalibrateRef = useRef(null)

  useZoom(zoomRef)

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const arrayBuffer = await file.arrayBuffer()
    const loadedPdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    setPdf(loadedPdf)
    setNumPages(loadedPdf.numPages)
    setCurrentPage(1)
  }

  useEffect(() => {
    if (!pdf) return
    renderPage(currentPage)
  }, [pdf, currentPage])

  async function renderPage(pageNum) {
    const page = await pdf.getPage(pageNum)
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const viewport = page.getViewport({ scale: 1.5 })
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: context, viewport }).promise
  }

  function nextPage() {
    setCurrentPage(p => p < numPages ? p + 1 : p)
  }

  function prevPage() {
    setCurrentPage(p => p > 1 ? p - 1 : p)
  }

  function handleRecalibrate() {
    setCalibrated(false)
    if (recalibrateRef.current) recalibrateRef.current()
  }

  if (!pdf) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        background: '#0a0a0a'
      }}>
        <p style={{ color: '#888', fontSize: '15px' }}>Selecciona una partitura en PDF</p>
        <label style={{
          background: '#1a1a1a',
          border: '0.5px solid #444',
          borderRadius: '10px',
          padding: '12px 24px',
          color: '#fff',
          fontSize: '15px',
          cursor: 'pointer'
        }}>
          Abrir PDF
          <input type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
        </label>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0a' }}>

      {!concertMode && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: '#111',
          borderBottom: '0.5px solid #333',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Lector de partituras</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#222',
            border: '0.5px solid #444',
            borderRadius: '20px',
            padding: '4px 10px'
          }}>
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: calibrated ? '#4ade80' : '#facc15'
            }} />
            <span style={{ fontSize: '12px', color: '#888' }}>
              {calibrated ? 'Calibrado' : 'Calibrando...'}
            </span>
          </div>
        </div>
      )}

      <div style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000'
      }}>
        {!concertMode && (
          <span style={{
            position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.08)', borderRadius: '12px',
            padding: '3px 12px', fontSize: '12px', color: '#888', zIndex: 1
          }}>
            Página {currentPage} / {numPages}
          </span>
        )}

        <div
          ref={zoomRef}
          style={{
            transformOrigin: 'center center',
            transition: 'transform 0.05s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%' }} />
        </div>

        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
          <Camera
            onWinkRight={nextPage}
            onWinkLeft={prevPage}
            onCalibrated={() => setCalibrated(true)}
            onRecalibrateRef={recalibrateRef}
            hidden={concertMode}
          />
        </div>
      </div>

      {!concertMode && (
        <div style={{
          background: '#111',
          borderTop: '0.5px solid #333',
          padding: '8px',
          flexShrink: 0
        }}>
          <Thumbnails
            pdf={pdf}
            numPages={numPages}
            currentPage={currentPage}
            onPageSelect={setCurrentPage}
          />
        </div>
      )}

      {!concertMode && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: '#111',
          borderTop: '0.5px solid #333',
          flexShrink: 0
        }}>
          <button onClick={prevPage} style={{
            background: '#222', border: '0.5px solid #444',
            borderRadius: '8px', padding: '8px 18px',
            color: '#ccc', fontSize: '14px', cursor: 'pointer'
          }}>← Anterior</button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
            <button onClick={handleRecalibrate} style={{
              background: '#1a1a2e', border: '0.5px solid #534AB7',
              borderRadius: '8px', padding: '6px 14px',
              color: '#AFA9EC', fontSize: '12px', cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}>Recalibrar</button>

            <button onClick={() => setConcertMode(true)} style={{
              background: '#1a1a2e', border: '0.5px solid #534AB7',
              borderRadius: '8px', padding: '6px 14px',
              color: '#AFA9EC', fontSize: '12px', cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}>Modo concierto</button>
          </div>

          <button onClick={nextPage} style={{
            background: '#222', border: '0.5px solid #444',
            borderRadius: '8px', padding: '8px 18px',
            color: '#ccc', fontSize: '14px', cursor: 'pointer'
          }}>Siguiente →</button>
        </div>
      )}

      {concertMode && (
        <button onClick={() => setConcertMode(false)} style={{
          position: 'absolute', bottom: '20px', right: '20px',
          background: 'rgba(26,26,46,0.8)', border: '0.5px solid #534AB7',
          borderRadius: '8px', padding: '8px 14px',
          color: '#AFA9EC', fontSize: '13px', cursor: 'pointer'
        }}>Salir</button>
      )}
    </div>
  )
}

export default PdfViewer
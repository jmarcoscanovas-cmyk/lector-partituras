import { useEffect, useRef } from 'react'

function Thumbnail({ pdf, pageNum, isActive, onClick }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    async function render() {
      const page = await pdf.getPage(pageNum)
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      const viewport = page.getViewport({ scale: 0.3 })
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: context, viewport }).promise
    }
    render()
  }, [pdf, pageNum])

  return (
    <canvas
      ref={canvasRef}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        border: isActive ? '3px solid red' : '3px solid transparent',
        margin: '0 4px'
      }}
    />
  )
}

function Thumbnails({ pdf, numPages, currentPage, onPageSelect }) {
  if (!pdf) return null

  return (
    <div style={{ display: 'flex', overflowX: 'auto', padding: '8px 0' }}>
      {Array.from({ length: numPages }, (_, i) => (
        <Thumbnail
          key={i}
          pdf={pdf}
          pageNum={i + 1}
          isActive={currentPage === i + 1}
          onClick={() => onPageSelect(i + 1)}
        />
      ))}
    </div>
  )
}

export default Thumbnails
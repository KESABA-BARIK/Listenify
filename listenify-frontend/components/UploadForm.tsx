'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { uploadPDF, getLanguages } from '@/lib/api'

const LENGTHS   = ['brief', 'standard', 'full']
const DIFFS     = ['beginner', 'intermediate', 'advanced']

export default function UploadForm() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [file, setFile]         = useState<File | null>(null)
  const [length, setLength]     = useState('standard')
  const [language, setLanguage] = useState('english')
  const [difficulty, setDiff]   = useState('intermediate')
  const [debate, setDebate]     = useState(false)
  const [languages, setLanguages] = useState<string[]>(['english'])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    getLanguages().then(d => setLanguages(d.supported_languages))
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') setFile(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Please select a PDF file.'); return }
    setLoading(true)
    setError('')
    try {
      const { job_id } = await uploadPDF(file, { length, language, difficulty, debate })
      router.push(`/job/${job_id}`)
    } catch (e: any) {
      setError(e.message || 'Upload failed.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed cursor-pointer
          flex flex-col items-center justify-center py-14 px-6 text-center
          transition-all duration-150 select-none
          ${dragging ? 'border-accent bg-warm' : 'border-border hover:border-ink'}
        `}
      >
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
        <div className="text-4xl mb-3">📄</div>
        {file ? (
          <>
            <p className="font-display text-xl text-ink">{file.name}</p>
            <p className="text-muted text-sm mt-1 font-mono">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-xl text-ink">Drop your PDF here</p>
            <p className="text-muted text-sm mt-1">or click to browse</p>
          </>
        )}
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Length */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-muted mb-2">
            Episode length
          </label>
          <div className="flex gap-2">
            {LENGTHS.map(l => (
              <button
                key={l} type="button"
                onClick={() => setLength(l)}
                className={`flex-1 py-2 text-xs font-mono uppercase tracking-widest border transition-all
                  ${length === l
                    ? 'bg-ink text-paper border-ink'
                    : 'bg-warm text-muted border-border hover:border-ink'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-muted mb-2">
            Difficulty
          </label>
          <div className="flex gap-2">
            {DIFFS.map(d => (
              <button
                key={d} type="button"
                onClick={() => setDiff(d)}
                className={`flex-1 py-2 text-xs font-mono uppercase tracking-widest border transition-all
                  ${difficulty === d
                    ? 'bg-ink text-paper border-ink'
                    : 'bg-warm text-muted border-border hover:border-ink'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-muted mb-2">
            Language
          </label>
          <div className="relative">
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="select-field pr-8"
            >
              {languages.map(l => (
                <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">▾</span>
          </div>
        </div>

        {/* Debate */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-muted mb-2">
            Debate mode
          </label>
          <button
            type="button"
            onClick={() => setDebate(!debate)}
            className={`w-full py-3 text-xs font-mono uppercase tracking-widest border transition-all
              ${debate
                ? 'bg-accent text-paper border-accent'
                : 'bg-warm text-muted border-border hover:border-ink'}`}
          >
            {debate ? '⚡ On — host challenges expert' : 'Off — collaborative tone'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-accent text-sm font-mono border border-accent px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !file}
        className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Uploading…' : 'Generate Podcast →'}
      </button>
    </form>
  )
}

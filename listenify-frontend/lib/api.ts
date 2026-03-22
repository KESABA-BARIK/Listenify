const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function uploadPDF(file: File, opts: {
  length: string; language: string; difficulty: string; debate: boolean
}) {
  const form = new FormData()
  form.append('file', file)
  form.append('length', opts.length)
  form.append('language', opts.language)
  form.append('difficulty', opts.difficulty)
  form.append('debate', String(opts.debate))
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form })
  if (!res.ok) {
    let msg = 'Upload failed'
    try { msg = (await res.json()).detail ?? msg } catch {}
    throw new Error(msg)
  }
  return res.json()
}

export const getStatus      = (id: string) => fetch(`${BASE}/status/${id}`).then(r => r.json())
export const getChapters    = (id: string) => fetch(`${BASE}/audiobook/${id}/chapters`).then(r => r.ok ? r.json() : [])
export const getShowNotes   = (id: string) => fetch(`${BASE}/audiobook/${id}/shownotes`).then(r => r.ok ? r.json() : null)
export const getTranscript  = (id: string) => fetch(`${BASE}/audiobook/${id}/transcript`).then(r => r.ok ? r.text() : null)
export const getLanguages   = ()           => fetch(`${BASE}/languages`).then(r => r.ok ? r.json() : { supported_languages: ['english'] })

export const streamUrl       = (id: string) => `${BASE}/audiobook/${id}/stream`
export const downloadUrl     = (id: string) => `${BASE}/audiobook/${id}/download`
export const transcriptDlUrl = (id: string) => `${BASE}/audiobook/${id}/transcript/download`

export async function uploadURL(url: string, opts: {
  length: string; language: string; difficulty: string; debate: boolean
}) {
  const form = new FormData()
  form.append('url', url)
  form.append('length', opts.length)
  form.append('language', opts.language)
  form.append('difficulty', opts.difficulty)
  form.append('debate', String(opts.debate))
  const res = await fetch(`${BASE}/upload-url`, { method: 'POST', body: form })
  if (!res.ok) {
    let msg = 'Failed to process URL'
    try { msg = (await res.json()).detail ?? msg } catch {}
    throw new Error(msg)
  }
  return res.json()
}
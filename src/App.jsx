import { useMemo, useState } from 'react'
import { ToastProvider, toast } from 'untoastify'
import './App.css'

const typeOptions = ['success', 'error', 'info', 'warning']
const positionOptions = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']
const sizeOptions = ['sm', 'md', 'lg', 'xl', '2xl']
const stackOptions = ['list', 'cards', 'overlap']
const queueOptions = ['wait', 'replace']

const exampleStyle = `{
  "backgroundColor": "#171717",
  "color": "white",
  "fontSize": 16,
  "boxShadow": "0 12px 32px rgba(0,0,0,0.25)"
}`

const uiPalette = {
  success: '#1bbf75',
  error: '#f05252',
  info: '#3b82f6',
  warning: '#f6b73c',
}

const parseStyleObject = (rawStyle) => {
  const trimmed = rawStyle.trim()

  if (!trimmed) {
    return {}
  }

  let parsed

  try {
    parsed = JSON.parse(trimmed)
  } catch {
    try {
      parsed = Function(`"use strict"; return (${trimmed});`)()
    } catch {
      throw new Error('Enter a valid object like { "backgroundColor": "#171717" }')
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Style must be an object like { ... }')
  }

  const style = {}

  for (const [key, value] of Object.entries(parsed)) {
    if (typeof key !== 'string' || !key.trim()) {
      throw new Error('Style keys must be valid property names.')
    }

    if (
      value !== null &&
      value !== undefined &&
      typeof value !== 'string' &&
      typeof value !== 'number'
    ) {
      throw new Error(`Unsupported value for "${key}". Use strings or numbers.`)
    }

    if (value !== undefined && value !== null) {
      style[key] = value
    }
  }

  return style
}

const formatStyleObject = (styleObject) => {
  const entries = Object.entries(styleObject)

  if (!entries.length) {
    return '{}'
  }

  const formatted = entries
    .map(([key, value]) => `    ${key}: ${typeof value === 'string' ? JSON.stringify(value) : value}`)
    .join(',\n')

  return `{
${formatted}
  }`
}

function App() {
  const [toastType, setToastType] = useState('success')
  const [message, setMessage] = useState('Wow! This is CRAZY!')
  const [position, setPosition] = useState('top-right')
  const [size, setSize] = useState('md')
  const [duration, setDuration] = useState(4000)
  const [stack, setStack] = useState('list')
  const [queue, setQueue] = useState('wait')
  const [showIcon, setShowIcon] = useState(true)
  const [customStyleEnabled, setCustomStyleEnabled] = useState(false)
  const [customStylePreset, setCustomStylePreset] = useState('default')
  const [customStyleInput, setCustomStyleInput] = useState(exampleStyle)
  const [copied, setCopied] = useState(false)

  const presetStyle = useMemo(() => {
    switch (customStylePreset) {
      case 'soft':
        return { fontWeight: 600, letterSpacing: '0.02em' }
      case 'glass':
        return {
          background: 'rgba(15, 23, 42, 0.82)',
          border: '1px solid rgba(148, 163, 184, 0.28)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.4)',
        }
      default:
        return {}
    }
  }, [customStylePreset])

  const parsedCustomStyle = useMemo(() => {
    try {
      return parseStyleObject(customStyleInput)
    } catch {
      return null
    }
  }, [customStyleInput])

  const styleError = customStyleInput.trim() && !parsedCustomStyle ? 'Invalid style object. Use a valid object like the example.' : ''

  const toastStyle = useMemo(() => {
    const merged = { ...presetStyle }

    if (customStyleEnabled && parsedCustomStyle && Object.keys(parsedCustomStyle).length) {
      Object.assign(merged, parsedCustomStyle)
    }

    return Object.keys(merged).length ? merged : undefined
  }, [customStyleEnabled, parsedCustomStyle, presetStyle])

  const toastOptions = useMemo(() => {
    const options = {
      position,
      duration,
      size,
      style: toastStyle,
    }

    if (!showIcon) {
      options.icon = null
    }

    return options
  }, [duration, position, showIcon, size, toastStyle])

  const triggerToast = () => {
    const method = toast[toastType]
    method(message || 'Please provide a message', toastOptions)
  }

  const toastSnippet = useMemo(() => {
    const safeMessage = message || 'Please provide a message'
    const toastLines = [
      `position: "${position}"`,
      `duration: ${duration}`,
      `size: "${size}"`,
      !showIcon ? 'icon: null' : null,
      toastStyle ? `style: ${formatStyleObject(toastStyle)}` : null,
    ].filter(Boolean)

    return `toast.${toastType}(${JSON.stringify(safeMessage)}, {
  ${toastLines.join(',\n  ')}
});`
  }, [duration, message, position, showIcon, size, toastStyle, toastType])

  const providerSnippet = useMemo(() => {
    return `<ToastProvider
  defaultPosition="${position}"
  defaultDuration={${duration}}
  defaultSize="${size}"
  stack="${stack}"
  queue="${queue}"
/>`
  }, [duration, position, queue, size, stack])

  const handleCopyProvider = async () => {
    try {
      await navigator.clipboard.writeText(providerSnippet)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  const handleCopyToast = async () => {
    try {
      await navigator.clipboard.writeText(toastSnippet)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <ToastProvider
      defaultPosition={position}
      defaultDuration={duration}
      defaultSize={size}
      stack={stack}
      queue={queue}
    >
      <div className="demo-shell">
        <header className="topbar">
          <div>
            <h1>untoastify</h1>
          </div>
          <a
            className="github-link"
            href="https://github.com/clouds440/untoastify"
            target="_blank"
            rel="noreferrer"
          >
            View package
          </a>
        </header>

        <main className="layout">
          <section className="hero-card panel">
            <div className="hero-copy">
              <span className="chip">Live toast playground</span>
              <h2>Lightweight toasts for real interfaces.</h2>
              <p>
                A smaller, cleaner alternative to toast libraries that still feels
                polished and flexible. Tune the layout, timing, and styling, then
                send a toast instantly.
              </p>
            </div>

            <div className="type-row" aria-label="Toast type selector">
              {typeOptions.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={type === toastType ? 'type-btn active' : 'type-btn'}
                  style={{ '--accent': uiPalette[type] }}
                  onClick={() => setToastType(type)}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="code-panel-stack">
              <div className="preview-box code-box">
                <div className="preview-header">
                  <div className="snippet-header-left">
                    <span className="dots">
                      <span className="dot success" />
                      <span className="dot warning" />
                      <span className="dot error" />
                    </span>
                    <span className="snippet-label">toast</span>
                  </div>
                  <button type="button" className="copy-btn" onClick={handleCopyToast}>
                    {copied ? 'Copied!' : 'Copy toast'}
                  </button>
                </div>
                <pre>{toastSnippet}</pre>
              </div>

              <div className="preview-box code-box">
                <div className="preview-header">
                  <div className="snippet-header-left">
                    <span className="dots">
                      <span className="dot success" />
                      <span className="dot warning" />
                      <span className="dot error" />
                    </span>
                    <span className="snippet-label">provider</span>
                  </div>
                  <button type="button" className="copy-btn" onClick={handleCopyProvider}>
                    {copied ? 'Copied!' : 'Copy provider'}
                  </button>
                </div>
                <pre>{providerSnippet}</pre>
              </div>
            </div>

            <div className="cta-row">
              <button type="button" className="primary-btn" onClick={triggerToast}>
                Trigger toast
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => toast.info('Preview ready — change the options and try again.', toastOptions)}
              >
                Preview example
              </button>
            </div>
          </section>

          <aside className="playground panel">
            <div className="panel-header">
              <h3>Playground controls</h3>
            </div>

            <label className="field">
              <span>Message</span>
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Toast message"
              />
            </label>

            <div className="two-col">
              <label className="field">
                <span>Position</span>
                <select value={position} onChange={(event) => setPosition(event.target.value)}>
                  {positionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Size</span>
                <select value={size} onChange={(event) => setSize(event.target.value)}>
                  {sizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="two-col">
              <label className="field">
                <span>Duration</span>
                <input
                  type="number"
                  min="500"
                  max="10000"
                  step="250"
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value) || 4000)}
                />
              </label>

              <label className="field">
                <span>Style</span>
                <select value={customStylePreset} onChange={(event) => setCustomStylePreset(event.target.value)}>
                  <option value="default">Default</option>
                  <option value="soft">Soft emphasis</option>
                  <option value="glass">Glass</option>
                </select>
              </label>
            </div>

            <div className="two-col">
              <label className="field">
                <span>Stack</span>
                <select value={stack} onChange={(event) => setStack(event.target.value)}>
                  {stackOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Queue</span>
                <select value={queue} onChange={(event) => setQueue(event.target.value)}>
                  {queueOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field field-wide">
              <div className="field-header">
                <span>Custom CSS / Inline Style</span>
                <label className="switch-toggle" aria-label="Enable custom CSS">
                  <input
                    type="checkbox"
                    checked={customStyleEnabled}
                    onChange={(event) => setCustomStyleEnabled(event.target.checked)}
                  />
                  <span className="switch-slider" />
                </label>
              </div>
              <textarea
                rows={7}
                spellCheck={false}
                value={customStyleInput}
                onChange={(event) => setCustomStyleInput(event.target.value)}
                disabled={!customStyleEnabled}
                className={customStyleEnabled ? '' : 'disabled-textarea'}
                placeholder={'{\n  "backgroundColor": "#171717",\n  "color": "white",\n  "fontSize": 16\n}'}
              />
              <small className={styleError ? 'style-hint error' : 'style-hint'}>
                {styleError || 'Example: { "backgroundColor": "#171717", "color": "white", "fontSize": 16 }'}
              </small>
            </label>

            <div className="field-header field-wide compact-toggle-row">
              <span>Show default icon</span>
              <label className="switch-toggle" aria-label="Enable default icon">
                <input
                  type="checkbox"
                  checked={showIcon}
                  onChange={(event) => setShowIcon(event.target.checked)}
                />
                <span className="switch-slider" />
              </label>
            </div>
          </aside>
        </main>
      </div>
    </ToastProvider>
  )
}

export default App

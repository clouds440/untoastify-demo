import { useEffect, useMemo, useState } from 'react'
import { ToastProvider, toast } from 'untoastify'
import './App.css'

const typeOptions = ['success', 'error', 'info', 'warning']
const positionOptions = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']
const sizeOptions = ['sm', 'md', 'lg', 'xl', '2xl']
const stackOptions = ['list', 'cards', 'overlap']
const queueOptions = ['wait', 'replace']
const iconSourceOptions = ['default', 'none', 'element', 'component', 'url', 'object', 'upload']

const demoStyleExample = `{
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

const SparkIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ width: 18, height: 18 }}>
    <path
      d="M12 2.5l1.7 5.8L19.5 10l-5.8 1.7L12 17.5l-1.7-5.8L4.5 10l5.8-1.7L12 2.5Z"
      fill="currentColor"
    />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ width: 18, height: 18 }}>
    <path d="M9.55 15.95 5.6 12l-1.4 1.4 5.35 5.35L20.4 5.4 19 4l-9.45 11.95Z" fill="currentColor" />
  </svg>
)

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ width: 18, height: 18 }}>
    <path d="M12 2.75A9.25 9.25 0 1 0 21.25 12 9.26 9.26 0 0 0 12 2.75Zm0 4.5a1 1 0 0 1 1 1v4.5a1 1 0 0 1-2 0v-4.5a1 1 0 0 1 1-1Zm0 9.75a1.35 1.35 0 1 1 0-2.7 1.35 1.35 0 0 1 0 2.7Z" fill="currentColor" />
  </svg>
)

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

const formatCodeValue = (value) => {
  if (value === undefined) {
    return 'undefined'
  }

  if (value === null) {
    return 'null'
  }

  if (typeof value === 'string') {
    return JSON.stringify(value)
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => formatCodeValue(item)).join(', ')}]`
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value)
    if (!entries.length) {
      return '{}'
    }

    return `{
    ${entries
      .map(([key, item]) => `${key}: ${formatCodeValue(item)}`)
      .join(',\n    ')}
  }`
  }

  return value
}

const isPlainImageHint = (sourceValue) => {
  if (!sourceValue) {
    return false
  }

  const cleaned = sourceValue.trim()
  return /^https?:\/\//i.test(cleaned) || /^data:image\//i.test(cleaned)
}

const makeComponentForMode = (mode) => {
  switch (mode) {
    case 'check':
      return CheckIcon
    case 'alert':
      return AlertIcon
    default:
      return SparkIcon
  }
}

const getIconValueFromConfig = (config, defaultType = 'info') => {
  const source = config?.source || 'default'

  if (source === 'default') {
    return undefined
  }

  if (source === 'none') {
    return null
  }

  if (source === 'element') {
    return <SparkIcon />
  }

  if (source === 'component') {
    return makeComponentForMode(config.componentMode || 'spark')
  }

  if (source === 'url') {
    return config.url || 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=96&q=80'
  }

  if (source === 'object') {
    return {
      src: config.src || 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=96&q=80',
      alt: config.alt || `${defaultType} icon`,
    }
  }

  if (source === 'upload') {
    return config.uploadDataUrl || {
      src: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=96&q=80',
      alt: `${defaultType} icon`,
    }
  }

  return undefined
}

const serializeIconCode = (config = {}, modeLabel = 'toast') => {
  const source = config.source || 'default'

  if (source === 'default') {
    return undefined
  }

  if (source === 'none') {
    return 'null'
  }

  if (source === 'element') {
    return `(
  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '999px', background: 'rgba(255,255,255,0.12)', color: '#fff' }}>✨</span>
)`
  }

  if (source === 'component') {
    return `${config.componentMode === 'check' ? 'CheckIcon' : config.componentMode === 'alert' ? 'AlertIcon' : 'SparkIcon'}`
  }

  if (source === 'url') {
    return formatCodeValue(config.url || 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=96&q=80')
  }

  if (source === 'object') {
    return formatCodeValue({
      src: config.src || 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=96&q=80',
      alt: config.alt || `${modeLabel} icon`,
    })
  }

  if (source === 'upload') {
    return formatCodeValue({
      src: config.uploadDataUrl || 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=96&q=80',
      alt: config.alt || `${modeLabel} icon`,
    })
  }

  return undefined
}

function App() {
  const [toastType, setToastType] = useState('success')
  const [message, setMessage] = useState('Wow! This is CRAZY!')
  const [position, setPosition] = useState('top-right')
  const [defaultPosition, setDefaultPosition] = useState('top-right')
  const [size, setSize] = useState('md')
  const [defaultSize, setDefaultSize] = useState('md')
  const [duration, setDuration] = useState(4000)
  const [defaultDuration, setDefaultDuration] = useState(4000)
  const [stack, setStack] = useState('list')
  const [queue, setQueue] = useState('wait')
  const [toastStyleEnabled, setToastStyleEnabled] = useState(false)
  const [toastStyleInput, setToastStyleInput] = useState('{\n  "background": "linear-gradient(135deg, rgba(8, 15, 24, 0.96), rgba(15, 32, 48, 0.94))",\n  "color": "#e6fbff",\n  "border": "1px solid rgba(34, 211, 238, 0.7)",\n  "borderRadius": 18,\n  "padding": "18px 20px",\n  "boxShadow": "0 0 0 1px rgba(45, 212, 191, 0.35), 0 0 24px rgba(34, 211, 238, 0.45), 0 0 50px rgba(168, 85, 247, 0.32)",\n  "fontFamily": "\'Orbitron\', \"Segoe UI\", sans-serif",\n  "letterSpacing": "0.08em",\n  "textTransform": "uppercase",\n  "backdropFilter": "blur(12px)"\n}')
  const [iconStyleEnabled, setIconStyleEnabled] = useState(false)
  const [iconStyleInput, setIconStyleInput] = useState('{\n  "fontSize": 20,\n  "color": "#d9fffb",\n  "background": "rgba(45, 212, 191, 0.16)",\n  "borderRadius": 10,\n  "padding": 8,\n  "boxShadow": "0 0 18px rgba(45, 212, 191, 0.7)",\n  "display": "inline-flex",\n  "alignItems": "center",\n  "justifyContent": "center"\n}')
  const [messageStyleEnabled, setMessageStyleEnabled] = useState(false)
  const [messageStyleInput, setMessageStyleInput] = useState('{\n  "color": "#dcfce7",\n  "fontSize": 15,\n  "fontWeight": 700,\n  "textShadow": "0 0 12px rgba(34, 211, 238, 0.85)",\n  "letterSpacing": "0.08em"\n}')
  const [closeButtonStyleEnabled, setCloseButtonStyleEnabled] = useState(false)
  const [closeButtonStyleInput, setCloseButtonStyleInput] = useState('{\n  "color": "#a5f3fc",\n  "fontSize": 14,\n  "fontWeight": 700,\n  "background": "rgba(8, 145, 178, 0.18)",\n  "borderRadius": 8,\n  "padding": "4px 8px",\n  "textShadow": "0 0 12px rgba(103, 232, 249, 0.9)"\n}')

  const [providerStyleEnabled, setProviderStyleEnabled] = useState(false)
  const [providerStyleInput, setProviderStyleInput] = useState('{\n  "background": "rgba(2, 6, 23, 0.78)",\n  "border": "1px solid rgba(34, 211, 238, 0.25)",\n  "borderRadius": 18,\n  "boxShadow": "0 0 0 1px rgba(45, 212, 191, 0.15), 0 0 28px rgba(34, 211, 238, 0.18), 0 0 48px rgba(168, 85, 247, 0.16)",\n  "backdropFilter": "blur(14px)"\n}')
  const [providerIconStyleEnabled, setProviderIconStyleEnabled] = useState(false)
  const [providerIconStyleInput, setProviderIconStyleInput] = useState('{\n  "fontSize": 20,\n  "color": "#cffafe",\n  "background": "rgba(14, 116, 144, 0.22)",\n  "borderRadius": 10,\n  "padding": 8,\n  "boxShadow": "0 0 16px rgba(34, 211, 238, 0.72)"\n}')
  const [providerMessageStyleEnabled, setProviderMessageStyleEnabled] = useState(false)
  const [providerMessageStyleInput, setProviderMessageStyleInput] = useState('{\n  "color": "#d8f9ff",\n  "background": "rgba(14, 116, 144, 0.22)",\n  "fontWeight": 700,\n  "letterSpacing": "0.06em",\n  "textShadow": "0 0 12px rgba(34, 211, 238, 0.9)"\n}')
  const [providerCloseButtonStyleEnabled, setProviderCloseButtonStyleEnabled] = useState(false)
  const [providerCloseButtonStyleInput, setProviderCloseButtonStyleInput] = useState('{\n  "color": "#c4b5fd",\n  "fontWeight": 700,\n  "background": "rgba(139, 92, 246, 0.18)",\n  "borderRadius": 8,\n  "padding": "4px 8px",\n  "textShadow": "0 0 12px rgba(196, 181, 253, 0.9)"\n}')

  const [toastIconEnabled, setToastIconEnabled] = useState(false)
  const [toastIcon, setToastIcon] = useState({
    source: 'default',
    componentMode: 'spark',
    url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=96&q=80',
    src: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=96&q=80',
    alt: 'Toast icon',
    uploadDataUrl: '',
  })

  const [providerIconsEnabled, setProviderIconsEnabled] = useState(false)
  const [providerIcons, setProviderIcons] = useState({
    success: { source: 'default', componentMode: 'spark', url: '', src: '', alt: 'Success icon', uploadDataUrl: '' },
    error: { source: 'default', componentMode: 'alert', url: '', src: '', alt: 'Error icon', uploadDataUrl: '' },
    info: { source: 'default', componentMode: 'spark', url: '', src: '', alt: 'Info icon', uploadDataUrl: '' },
    warning: { source: 'default', componentMode: 'alert', url: '', src: '', alt: 'Warning icon', uploadDataUrl: '' },
  })

  const [onCloseEnabled, setOnCloseEnabled] = useState(false)
  const [showExtraOptions, setShowExtraOptions] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isBottomPinned, setIsBottomPinned] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24
      setIsBottomPinned(nearBottom)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const tryParseStyle = (rawValue) => {
    if (!rawValue || !rawValue.trim()) {
      return {}
    }

    try {
      return parseStyleObject(rawValue)
    } catch {
      return null
    }
  }

  const parsedToastStyle = useMemo(() => tryParseStyle(toastStyleInput), [toastStyleInput])
  const parsedIconStyle = useMemo(() => tryParseStyle(iconStyleInput), [iconStyleInput])
  const parsedMessageStyle = useMemo(() => tryParseStyle(messageStyleInput), [messageStyleInput])
  const parsedCloseButtonStyle = useMemo(() => tryParseStyle(closeButtonStyleInput), [closeButtonStyleInput])
  const parsedProviderStyle = useMemo(() => tryParseStyle(providerStyleInput), [providerStyleInput])
  const parsedProviderIconStyle = useMemo(() => tryParseStyle(providerIconStyleInput), [providerIconStyleInput])
  const parsedProviderMessageStyle = useMemo(() => tryParseStyle(providerMessageStyleInput), [providerMessageStyleInput])
  const parsedProviderCloseButtonStyle = useMemo(() => tryParseStyle(providerCloseButtonStyleInput), [providerCloseButtonStyleInput])

  const styleErrors = {
    toast: toastStyleInput.trim() && !parsedToastStyle ? 'Invalid toast style object.' : '',
    icon: iconStyleInput.trim() && !parsedIconStyle ? 'Invalid icon style object.' : '',
    message: messageStyleInput.trim() && !parsedMessageStyle ? 'Invalid message style object.' : '',
    close: closeButtonStyleInput.trim() && !parsedCloseButtonStyle ? 'Invalid close button style object.' : '',
    provider: providerStyleInput.trim() && !parsedProviderStyle ? 'Invalid provider style object.' : '',
    providerIcon: providerIconStyleInput.trim() && !parsedProviderIconStyle ? 'Invalid provider icon style object.' : '',
    providerMessage: providerMessageStyleInput.trim() && !parsedProviderMessageStyle ? 'Invalid provider message style object.' : '',
    providerClose: providerCloseButtonStyleInput.trim() && !parsedProviderCloseButtonStyle ? 'Invalid provider close button style object.' : '',
  }

  const resolvedToastIcon = useMemo(() => getIconValueFromConfig(toastIcon, toastType), [toastIcon, toastType])

  const activeToastOptions = useMemo(() => {
    const options = {
      position,
      duration,
      size,
      style: toastStyleEnabled && parsedToastStyle && Object.keys(parsedToastStyle).length ? parsedToastStyle : undefined,
      iconStyle: iconStyleEnabled && parsedIconStyle && Object.keys(parsedIconStyle).length ? parsedIconStyle : undefined,
      messageStyle: messageStyleEnabled && parsedMessageStyle && Object.keys(parsedMessageStyle).length ? parsedMessageStyle : undefined,
      closeButtonStyle: closeButtonStyleEnabled && parsedCloseButtonStyle && Object.keys(parsedCloseButtonStyle).length ? parsedCloseButtonStyle : undefined,
      icon: toastIconEnabled ? resolvedToastIcon : undefined,
    }

    return options
  }, [position, duration, size, toastStyleEnabled, parsedToastStyle, iconStyleEnabled, parsedIconStyle, messageStyleEnabled, parsedMessageStyle, closeButtonStyleEnabled, parsedCloseButtonStyle, toastIconEnabled, resolvedToastIcon, onCloseEnabled])

  const providerConfig = useMemo(() => {
    const config = {
      defaultPosition,
      defaultDuration,
      defaultSize,
      stack,
      queue,
      style: providerStyleEnabled && parsedProviderStyle && Object.keys(parsedProviderStyle).length ? parsedProviderStyle : undefined,
      iconStyle: providerIconStyleEnabled && parsedProviderIconStyle && Object.keys(parsedProviderIconStyle).length ? parsedProviderIconStyle : undefined,
      messageStyle: providerMessageStyleEnabled && parsedProviderMessageStyle && Object.keys(parsedProviderMessageStyle).length ? parsedProviderMessageStyle : undefined,
      closeButtonStyle: providerCloseButtonStyleEnabled && parsedProviderCloseButtonStyle && Object.keys(parsedProviderCloseButtonStyle).length ? parsedProviderCloseButtonStyle : undefined,
    }

    const icons = {}

    if (providerIconsEnabled) {
      Object.entries(providerIcons).forEach(([type, value]) => {
        const resolved = getIconValueFromConfig(value, type)
        if (resolved !== undefined || value.source === 'none') {
          icons[type] = resolved
        }
      })
    }

    if (Object.keys(icons).length) {
      config.icons = icons
    }

    return config
  }, [defaultPosition, defaultDuration, defaultSize, stack, queue, providerStyleEnabled, parsedProviderStyle, providerIconStyleEnabled, parsedProviderIconStyle, providerMessageStyleEnabled, parsedProviderMessageStyle, providerCloseButtonStyleEnabled, parsedProviderCloseButtonStyle, providerIconsEnabled, providerIcons])

  const triggerToast = () => {
    const method = toast[toastType]
    method(message || 'Please provide a message', activeToastOptions)
  }

  const buildCodeSnippet = (payload, isProvider = false) => {
    const lines = []

    if (isProvider) {
      lines.push(`<ToastProvider`)
      lines.push(`  defaultPosition="${providerConfig.defaultPosition}"`)
      lines.push(`  defaultDuration={${providerConfig.defaultDuration}}`)
      lines.push(`  defaultSize="${providerConfig.defaultSize}"`)
      lines.push(`  stack="${providerConfig.stack}"`)
      lines.push(`  queue="${providerConfig.queue}"`)

      if (providerConfig.style) lines.push(`  style={${formatStyleObject(providerConfig.style)}}`)
      if (providerConfig.iconStyle) lines.push(`  iconStyle={${formatStyleObject(providerConfig.iconStyle)}}`)
      if (providerConfig.messageStyle) lines.push(`  messageStyle={${formatStyleObject(providerConfig.messageStyle)}}`)
      if (providerConfig.closeButtonStyle) lines.push(`  closeButtonStyle={${formatStyleObject(providerConfig.closeButtonStyle)}}`)
      if (providerConfig.icons) {
        const iconEntries = Object.entries(providerConfig.icons)
          .map(([type, value]) => {
            if (value === undefined) return null
            if (value === null) return `    ${type}: null`
            if (typeof value === 'function') return `    ${type}: ${value.name || 'DemoIcon'}`
            if (value && typeof value === 'object' && 'src' in value) return `    ${type}: ${JSON.stringify(value, null, 2).replace(/\n/g, '\n    ')}`
            if (typeof value === 'string') return `    ${type}: ${JSON.stringify(value)}`
            return null
          })
          .filter(Boolean)

        if (iconEntries.length) {
          lines.push(`  icons={{\n${iconEntries.join(',\n')}\n  }}`)
        }
      }

      lines.push('/>')
      return lines.join('\n')
    }

    const configLines = []
    configLines.push(`position: "${payload.position}"`)
    configLines.push(`duration: ${payload.duration}`)
    configLines.push(`size: "${payload.size}"`)
    if (toastIconEnabled && payload.icon !== undefined) configLines.push(`icon: ${serializeIconCode(toastIcon, toastType) ?? 'null'}`)
    if (toastStyleEnabled && payload.style) configLines.push(`style: ${formatStyleObject(payload.style)}`)
    if (iconStyleEnabled && payload.iconStyle) configLines.push(`iconStyle: ${formatStyleObject(payload.iconStyle)}`)
    if (messageStyleEnabled && payload.messageStyle) configLines.push(`messageStyle: ${formatStyleObject(payload.messageStyle)}`)
    if (closeButtonStyleEnabled && payload.closeButtonStyle) configLines.push(`closeButtonStyle: ${formatStyleObject(payload.closeButtonStyle)}`)
    if (onCloseEnabled && payload.onClose) configLines.push('onClose: () => console.log("Toast closed")')

    return `toast.${toastType}(${JSON.stringify(message || 'Please provide a message')}, {
  ${configLines.join(',\n  ')}
});`
  }

  const providerSnippet = useMemo(() => buildCodeSnippet(providerConfig, true), [providerConfig])
  const toastSnippet = useMemo(() => buildCodeSnippet(activeToastOptions), [activeToastOptions])

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

  const updateProviderIcon = (type, patch) => {
    setProviderIcons((current) => ({
      ...current,
      [type]: {
        ...current[type],
        ...patch,
      },
    }))
  }

  const fileInputOnChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setToastIcon((current) => ({ ...current, source: 'upload', uploadDataUrl: String(reader.result || ''), alt: current.alt || 'Upload icon' }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <ToastProvider {...providerConfig}>
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
                Tune every documented Untoastify option, then trigger a real toast instantly.
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

            <div className={`cta-row ${isBottomPinned ? 'is-pinned' : ''}`}>
              <button type="button" className="primary-btn" onClick={triggerToast}>
                Trigger toast
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => toast.info('Preview ready — change the options and try again.', activeToastOptions)}
              >
                Preview example
              </button>
            </div>

          </section>

          <aside className="playground panel">
            <div className="panel-header">
              <h3>Playground controls</h3>
            </div>

            <section className="config-section">
              <div className="section-heading">Toast options</div>

              <label className="field">
                <span>Message</span>
                <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Toast message" />
              </label>

              <div className="two-col">
                <label className="field">
                  <span>Position</span>
                  <select value={position} onChange={(event) => setPosition(event.target.value)}>
                    {positionOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Size</span>
                  <select value={size} onChange={(event) => setSize(event.target.value)}>
                    {sizeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="two-col">
                <label className="field">
                  <span>Duration</span>
                  <input
                    type="number"
                    min="0"
                    step="250"
                    value={duration}
                    onChange={(event) => setDuration(Number(event.target.value) || 0)}
                  />
                </label>

                <label className="field">
                  <span>Close callback</span>
                  <label className="switch-toggle" aria-label="Enable onClose callback">
                    <input type="checkbox" checked={onCloseEnabled} onChange={(event) => setOnCloseEnabled(event.target.checked)} />
                    <span className="switch-slider" />
                  </label>
                  <small className="mini-hint">Runs when the toast closes.</small>
                </label>
              </div>

              <div className="advanced-shell">
                <button type="button" className="collapse-trigger" onClick={() => setShowExtraOptions((value) => !value)}>
                  <span>Extra options</span>
                  <span className={`collapse-indicator ${showExtraOptions ? 'open' : ''}`}>⌃</span>
                </button>

                {showExtraOptions && (
                  <>
                    <div className="field-group">
                      <div className="field-group-header">
                        <span>Toast container style</span>
                        <label className="switch-toggle">
                          <input type="checkbox" checked={toastStyleEnabled} onChange={(event) => setToastStyleEnabled(event.target.checked)} />
                          <span className="switch-slider" />
                        </label>
                      </div>
                      <textarea
                        rows={5}
                        spellCheck={false}
                        value={toastStyleInput}
                        onChange={(event) => setToastStyleInput(event.target.value)}
                        disabled={!toastStyleEnabled}
                      />
                      <small className={styleErrors.toast ? 'style-hint error' : 'style-hint'}>
                        {styleErrors.toast || 'JSON or JS object style for the toast container.'}
                      </small>
                    </div>

                    <div className="field-group">
                      <div className="field-group-header">
                        <span>Icon style</span>
                        <label className="switch-toggle">
                          <input type="checkbox" checked={iconStyleEnabled} onChange={(event) => setIconStyleEnabled(event.target.checked)} />
                          <span className="switch-slider" />
                        </label>
                      </div>
                      <textarea rows={4} spellCheck={false} value={iconStyleInput} onChange={(event) => setIconStyleInput(event.target.value)} disabled={!iconStyleEnabled} />
                      <small className={styleErrors.icon ? 'style-hint error' : 'style-hint'}>
                        {styleErrors.icon || 'Target the icon element.'}
                      </small>
                    </div>

                    <div className="field-group">
                      <div className="field-group-header">
                        <span>Message style</span>
                        <label className="switch-toggle">
                          <input type="checkbox" checked={messageStyleEnabled} onChange={(event) => setMessageStyleEnabled(event.target.checked)} />
                          <span className="switch-slider" />
                        </label>
                      </div>
                      <textarea rows={4} spellCheck={false} value={messageStyleInput} onChange={(event) => setMessageStyleInput(event.target.value)} disabled={!messageStyleEnabled} />
                      <small className={styleErrors.message ? 'style-hint error' : 'style-hint'}>
                        {styleErrors.message || 'Target the toast message text.'}
                      </small>
                    </div>

                    <div className="field-group">
                      <div className="field-group-header">
                        <span>Close button style</span>
                        <label className="switch-toggle">
                          <input type="checkbox" checked={closeButtonStyleEnabled} onChange={(event) => setCloseButtonStyleEnabled(event.target.checked)} />
                          <span className="switch-slider" />
                        </label>
                      </div>
                      <textarea rows={4} spellCheck={false} value={closeButtonStyleInput} onChange={(event) => setCloseButtonStyleInput(event.target.value)} disabled={!closeButtonStyleEnabled} />
                      <small className={styleErrors.close ? 'style-hint error' : 'style-hint'}>
                        {styleErrors.close || 'Target the close button.'}
                      </small>
                    </div>

                    <div className="field-group">
                      <div className="field-group-header">
                        <span>Icon source</span>
                        <label className="switch-toggle">
                          <input type="checkbox" checked={toastIconEnabled} onChange={(event) => setToastIconEnabled(event.target.checked)} />
                          <span className="switch-slider" />
                        </label>
                      </div>
                      <select value={toastIcon.source} onChange={(event) => setToastIcon((current) => ({ ...current, source: event.target.value }))} disabled={!toastIconEnabled}>
                        {iconSourceOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    {toastIcon.source === 'component' && toastIconEnabled && (
                      <div className="field-group">
                        <div className="field-group-header">
                          <span>Component style</span>
                        </div>
                        <select value={toastIcon.componentMode} onChange={(event) => setToastIcon((current) => ({ ...current, componentMode: event.target.value }))}>
                          <option value="spark">Spark</option>
                          <option value="check">Check</option>
                          <option value="alert">Alert</option>
                        </select>
                      </div>
                    )}

                    {(toastIcon.source === 'url' || toastIcon.source === 'object' || toastIcon.source === 'upload') && toastIconEnabled && (
                      <div className="field-group">
                        <div className="field-group-header">
                          <span>{toastIcon.source === 'upload' ? 'Local upload' : 'Image URL'}</span>
                        </div>
                        {toastIcon.source === 'upload' ? (
                          <input type="file" accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml" onChange={fileInputOnChange} />
                        ) : (
                          <input
                            value={toastIcon.source === 'object' ? toastIcon.src : toastIcon.url}
                            onChange={(event) => {
                              if (toastIcon.source === 'object') {
                                setToastIcon((current) => ({ ...current, src: event.target.value }))
                              } else {
                                setToastIcon((current) => ({ ...current, url: event.target.value }))
                              }
                            }}
                            placeholder="https://example.com/icon.png"
                          />
                        )}
                      </div>
                    )}

                    {toastIcon.source === 'object' && toastIconEnabled && (
                      <div className="field-group">
                        <div className="field-group-header">
                          <span>Image alt text</span>
                        </div>
                        <input value={toastIcon.alt} onChange={(event) => setToastIcon((current) => ({ ...current, alt: event.target.value }))} placeholder="Toast icon" />
                      </div>
                    )}

                    {toastIcon.source === 'upload' && toastIconEnabled && toastIcon.uploadDataUrl && (
                      <div className="field-group">
                        <div className="field-group-header">
                          <span>Uploaded image preview</span>
                        </div>
                        <div className="icon-preview-box">
                          <img src={toastIcon.uploadDataUrl} alt="Uploaded toast icon" className="uploaded-icon-preview" />
                        </div>
                      </div>
                    )}

                    <div className="field-group">
                      <div className="field-group-header">
                        <span>Provider container style</span>
                        <label className="switch-toggle">
                          <input type="checkbox" checked={providerStyleEnabled} onChange={(event) => setProviderStyleEnabled(event.target.checked)} />
                          <span className="switch-slider" />
                        </label>
                      </div>
                      <textarea rows={5} spellCheck={false} value={providerStyleInput} onChange={(event) => setProviderStyleInput(event.target.value)} disabled={!providerStyleEnabled} />
                      <small className={styleErrors.provider ? 'style-hint error' : 'style-hint'}>
                        {styleErrors.provider || 'Global style for all toasts in this provider.'}
                      </small>
                    </div>

                    <div className="field-group">
                      <div className="field-group-header">
                        <span>Provider icon style</span>
                        <label className="switch-toggle">
                          <input type="checkbox" checked={providerIconStyleEnabled} onChange={(event) => setProviderIconStyleEnabled(event.target.checked)} />
                          <span className="switch-slider" />
                        </label>
                      </div>
                      <textarea rows={4} spellCheck={false} value={providerIconStyleInput} onChange={(event) => setProviderIconStyleInput(event.target.value)} disabled={!providerIconStyleEnabled} />
                      <small className={styleErrors.providerIcon ? 'style-hint error' : 'style-hint'}>
                        {styleErrors.providerIcon || 'Shared icon style for provider-level defaults.'}
                      </small>
                    </div>

                    <div className="field-group">
                      <div className="field-group-header">
                        <span>Provider message style</span>
                        <label className="switch-toggle">
                          <input type="checkbox" checked={providerMessageStyleEnabled} onChange={(event) => setProviderMessageStyleEnabled(event.target.checked)} />
                          <span className="switch-slider" />
                        </label>
                      </div>
                      <textarea rows={4} spellCheck={false} value={providerMessageStyleInput} onChange={(event) => setProviderMessageStyleInput(event.target.value)} disabled={!providerMessageStyleEnabled} />
                      <small className={styleErrors.providerMessage ? 'style-hint error' : 'style-hint'}>
                        {styleErrors.providerMessage || 'Shared message style for all provider toasts.'}
                      </small>
                    </div>

                    <div className="field-group">
                      <div className="field-group-header">
                        <span>Provider close style</span>
                        <label className="switch-toggle">
                          <input type="checkbox" checked={providerCloseButtonStyleEnabled} onChange={(event) => setProviderCloseButtonStyleEnabled(event.target.checked)} />
                          <span className="switch-slider" />
                        </label>
                      </div>
                      <textarea rows={4} spellCheck={false} value={providerCloseButtonStyleInput} onChange={(event) => setProviderCloseButtonStyleInput(event.target.value)} disabled={!providerCloseButtonStyleEnabled} />
                      <small className={styleErrors.providerClose ? 'style-hint error' : 'style-hint'}>
                        {styleErrors.providerClose || 'Shared close button style for provider toasts.'}
                      </small>
                    </div>

                    <div className="field-group">
                      <div className="field-group-header">
                        <span>Provider icons</span>
                        <label className="switch-toggle">
                          <input type="checkbox" checked={providerIconsEnabled} onChange={(event) => setProviderIconsEnabled(event.target.checked)} />
                          <span className="switch-slider" />
                        </label>
                      </div>
                      <div className="provider-icon-grid" style={{ opacity: providerIconsEnabled ? 1 : 0.5 }}>
                        {typeOptions.map((type) => (
                          <div key={type} className="provider-icon-card">
                            <div className="provider-icon-title">{type}</div>
                            <select
                              value={providerIcons[type].source}
                              onChange={(event) => updateProviderIcon(type, { source: event.target.value })}
                              disabled={!providerIconsEnabled}
                            >
                              {iconSourceOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>

                            {providerIcons[type].source === 'component' && providerIconsEnabled && (
                              <select
                                value={providerIcons[type].componentMode || 'spark'}
                                onChange={(event) => updateProviderIcon(type, { componentMode: event.target.value })}
                              >
                                <option value="spark">Spark</option>
                                <option value="check">Check</option>
                                <option value="alert">Alert</option>
                              </select>
                            )}

                            {(providerIcons[type].source === 'url' || providerIcons[type].source === 'object') && providerIconsEnabled && (
                              <input
                                value={providerIcons[type].source === 'object' ? providerIcons[type].src : providerIcons[type].url}
                                onChange={(event) => updateProviderIcon(type, providerIcons[type].source === 'object' ? { src: event.target.value } : { url: event.target.value })}
                                placeholder="https://example.com/icon.png"
                              />
                            )}

                            {providerIcons[type].source === 'object' && providerIconsEnabled && (
                              <input
                                value={providerIcons[type].alt}
                                onChange={(event) => updateProviderIcon(type, { alt: event.target.value })}
                                placeholder="Alt text"
                              />
                            )}

                            {providerIcons[type].source === 'upload' && providerIconsEnabled && (
                              <input
                                type="file"
                                accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                                onChange={(event) => {
                                  const file = event.target.files?.[0]
                                  if (!file) return

                                  const reader = new FileReader()
                                  reader.onload = () => {
                                    updateProviderIcon(type, { source: 'upload', uploadDataUrl: String(reader.result || ''), alt: `${type} icon` })
                                  }
                                  reader.readAsDataURL(file)
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="config-section">
              <div className="section-heading">Provider defaults</div>

              <div className="two-col">
                <label className="field">
                  <span>Default position</span>
                  <select value={defaultPosition} onChange={(event) => setDefaultPosition(event.target.value)}>
                    {positionOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Default size</span>
                  <select value={defaultSize} onChange={(event) => setDefaultSize(event.target.value)}>
                    {sizeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="two-col">
                <label className="field">
                  <span>Default duration</span>
                  <input
                    type="number"
                    min="0"
                    step="250"
                    value={defaultDuration}
                    onChange={(event) => setDefaultDuration(Number(event.target.value) || 0)}
                  />
                </label>

                <label className="field">
                  <span>Stack</span>
                  <select value={stack} onChange={(event) => setStack(event.target.value)}>
                    {stackOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="field">
                <span>Queue</span>
                <select value={queue} onChange={(event) => setQueue(event.target.value)}>
                  {queueOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </section>

            <section className="config-section class-help">
              <div className="section-heading">Class hooks</div>
              <ul className="class-hook-list">
                <li><strong>toast.className</strong> — class on the toast container.</li>
                <li><strong>iconClassName</strong> — class on the icon wrapper.</li>
                <li><strong>messageClassName</strong> — class on the message text block.</li>
                <li><strong>closeButtonClassName</strong> — class on the close button.</li>
                <li><strong>provider className</strong> — class on the provider container for all toasts.</li>
                <li><strong>provider icon/message/close class names</strong> — same idea at the provider level for shared defaults.</li>
              </ul>
            </section>
          </aside>
        </main>
      </div>
    </ToastProvider>
  )
}

export default App

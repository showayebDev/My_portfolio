'use client'
import React, { useState, useEffect } from 'react'

export const MigrationView = () => {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('bucket')
  const [status, setStatus] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  // ZIP Download State
  const [zipLoading, setZipLoading] = useState(false)
  const [zipMessage, setZipMessage] = useState(null)
  // Direct Bucket Transfer State
  const [destBucket, setDestBucket] = useState('')
  const [destEndpoint, setDestEndpoint] = useState('')
  const [destAccessKeyId, setDestAccessKeyId] = useState('')
  const [destSecretAccessKey, setDestSecretAccessKey] = useState('')
  const [destRegion, setDestRegion] = useState('auto')
  const [destForcePathStyle, setDestForcePathStyle] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [transferring, setTransferring] = useState(false)
  const [transferResult, setTransferResult] = useState(null)
  // Database Direct Migration State
  const [directTargetDbUrl, setDirectTargetDbUrl] = useState('')
  const [directShowSecret, setDirectShowSecret] = useState(false)
  const [testingTargetDb, setTestingTargetDb] = useState(false)
  const [testDbResult, setTestDbResult] = useState(null)
  const [directMigrating, setDirectMigrating] = useState(false)
  const [directMigrateResult, setDirectMigrateResult] = useState(null)
  // Database JSON Import State (with optional target DB URL)
  const [dbImportTargetUrl, setDbImportTargetUrl] = useState('')
  const [dbImportShowSecret, setDbImportShowSecret] = useState(false)
  const [testingImportDb, setTestingImportDb] = useState(false)
  const [testImportDbResult, setTestImportDbResult] = useState(null)
  const [dbExportLoading, setDbExportLoading] = useState(false)
  const [dbImportLoading, setDbImportLoading] = useState(false)
  const [dbImportFile, setDbImportFile] = useState(null)
  const [dbImportResult, setDbImportResult] = useState(null)
  // Fetch status on mount
  const fetchStatus = async () => {
    try {
      setLoadingStatus(true)
      const res = await fetch('/api/migration/status')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
        // If users exist in the active DB and the user is not authenticated,
        // redirect them to the admin login page so they can sign in.
        if (!data.isAuthenticated && (data.counts?.users ?? 0) > 0) {
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname + window.location.search
            window.location.href = `/admin/login?redirect=${encodeURIComponent(currentPath)}`
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingStatus(false)
    }
  }
  useEffect(() => {
    setMounted(true)
    fetchStatus()
    if (typeof window !== 'undefined' && window.location.hash === '#database') {
      setActiveTab('database')
    }
  }, [])

  if (!mounted) {
    return null
  }
  // Handle ZIP Download
  const handleDownloadZip = async () => {
    try {
      setZipLoading(true)
      setZipMessage('Gathering files and packaging ZIP with folders...')
      const res = await fetch('/api/migration/download-zip')
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Download failed' }))
        throw new Error(err.error || 'Failed to download ZIP')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `portfolio-media-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setZipMessage('✅ ZIP archive downloaded successfully!')
    } catch (err) {
      setZipMessage(`❌ Error: ${err.message}`)
    } finally {
      setZipLoading(false)
    }
  }
  // Handle Test Connection
  const handleTestConnection = async () => {
    setTestingConnection(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/migration/test-bucket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: destBucket,
          endpoint: destEndpoint,
          accessKeyId: destAccessKeyId,
          secretAccessKey: destSecretAccessKey,
          region: destRegion,
          forcePathStyle: destForcePathStyle,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setTestResult({ success: true, message: data.message || 'Connection successful!' })
      } else {
        setTestResult({ success: false, message: data.error || 'Connection failed.' })
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message || 'Network error.' })
    } finally {
      setTestingConnection(false)
    }
  }
  // Handle Direct Transfer
  const handleStartTransfer = async () => {
    if (!destBucket || !destAccessKeyId || !destSecretAccessKey) {
      alert('Please fill in Destination Bucket, Access Key ID, and Secret Access Key.')
      return
    }
    if (!confirm(`Are you sure you want to migrate all media files to bucket "${destBucket}"?`)) {
      return
    }
    setTransferring(true)
    setTransferResult(null)
    try {
      const res = await fetch('/api/migration/transfer-bucket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: destBucket,
          endpoint: destEndpoint,
          accessKeyId: destAccessKeyId,
          secretAccessKey: destSecretAccessKey,
          region: destRegion,
          forcePathStyle: destForcePathStyle,
        }),
      })
      const data = await res.json()
      setTransferResult(data)
    } catch (err) {
      setTransferResult({ success: false, error: err.message || 'Transfer failed.' })
    } finally {
      setTransferring(false)
      fetchStatus()
    }
  }
  // Handle DB Export
  const handleExportDb = async () => {
    setDbExportLoading(true)
    try {
      const res = await fetch('/api/migration/export-db')
      if (!res.ok) throw new Error('Database export failed.')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `portfolio-database-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(`Export error: ${err.message}`)
    } finally {
      setDbExportLoading(false)
    }
  }
  // Test connection to target database
  const handleTestDatabaseUrl = async (url, setTesting, setResult) => {
    if (!url.trim()) {
      setResult({ success: false, message: 'Please enter a database connection string.' })
      return
    }
    setTesting(true)
    setResult(null)
    try {
      const res = await fetch('/api/migration/test-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseUrl: url.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setResult({
          success: true,
          type: data.type,
          message: data.message || `Successfully connected to target ${data.type || 'database'}!`,
        })
      } else {
        setResult({ success: false, message: data.error || 'Connection failed.' })
      }
    } catch (err) {
      setResult({ success: false, message: err.message || 'Network error.' })
    } finally {
      setTesting(false)
    }
  }
  // Handle Direct Database Migration (Cloud-to-Cloud)
  const handleStartDirectMigrateDb = async () => {
    if (!directTargetDbUrl.trim()) {
      alert('Please enter the target database connection string.')
      return
    }
    if (
      !confirm(
        'Are you sure you want to run direct database migration?\n\nAll collections (Users with login password, Skills, Categories, Projects, Education, Media, and Profile) will be synchronized directly into the target database.',
      )
    ) {
      return
    }
    setDirectMigrating(true)
    setDirectMigrateResult(null)
    try {
      const res = await fetch('/api/migration/direct-migrate-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetDatabaseUrl: directTargetDbUrl.trim(),
        }),
      })
      const data = await res.json()
      setDirectMigrateResult(data)
    } catch (err) {
      setDirectMigrateResult({ success: false, error: err.message || 'Direct migration failed.' })
    } finally {
      setDirectMigrating(false)
      fetchStatus()
    }
  }
  // Handle DB Import (with optional target DB URL)
  const handleImportDb = async () => {
    if (!dbImportFile) {
      alert('Please select a JSON dump file to import.')
      return
    }
    const targetDesc = dbImportTargetUrl.trim()
      ? 'into the specified target database'
      : 'into the active database'
    if (!confirm(`Are you sure you want to import this database dump ${targetDesc}?`)) {
      return
    }
    setDbImportLoading(true)
    setDbImportResult(null)
    try {
      const fileText = await dbImportFile.text()
      const dump = JSON.parse(fileText)
      const res = await fetch('/api/migration/import-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dump,
          targetDatabaseUrl: dbImportTargetUrl.trim() || undefined,
        }),
      })
      const data = await res.json()
      setDbImportResult(data)
    } catch (err) {
      setDbImportResult({ success: false, error: err.message || 'Import failed.' })
    } finally {
      setDbImportLoading(false)
      fetchStatus()
    }
  }
  return (
    <div
      style={{
        padding: '30px 40px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: 'var(--theme-text, #eee)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>🔄</span>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>
            Migration & Backup Center
          </h1>
        </div>
        <p
          style={{
            margin: '8px 0 0 0',
            color: 'var(--theme-elevation-500, #999)',
            fontSize: '15px',
          }}
        >
          Seamless cloud-to-cloud bucket migration, organized ZIP backups, and SQL ⇄ NoSQL database
          synchronization.
        </p>
      </div>

      {/* Auth / Bootstrap Status Banner */}
      {!loadingStatus && status && !status.isAuthenticated && (status.counts?.users ?? 0) > 0 && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔒</span>
            <div>
              <div style={{ fontWeight: 600, color: '#ef4444', fontSize: '15px' }}>
                Admin Authentication Required
              </div>
              <div style={{ color: '#ccc', fontSize: '13px', marginTop: '2px' }}>
                You are currently accessing this page without signing in. Redirecting to admin
                login...
              </div>
            </div>
          </div>
          <a
            href={`/admin/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/admin')}`}
            style={{
              padding: '8px 18px',
              background: '#ef4444',
              color: '#fff',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '13px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Sign In to Admin Panel &rarr;
          </a>
        </div>
      )}

      {!loadingStatus && status && !status.isAuthenticated && (status.counts?.users ?? 0) === 0 && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '20px' }}>✨</span>
          <div>
            <div style={{ fontWeight: 600, color: '#10b981', fontSize: '15px' }}>
              Initial Setup / Bootstrap Mode
            </div>
            <div style={{ color: '#ccc', fontSize: '13px', marginTop: '2px' }}>
              The active database currently has 0 users. You can restore your JSON database dump or
              migrate data directly to set up your administrator credentials and content without
              signing in.
            </div>
          </div>
        </div>
      )}

      {!loadingStatus && status && status.isAuthenticated && (
        <div
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '10px',
            padding: '12px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#93c5fd',
            }}
          >
            <span>✅</span>
            <span>
              Signed in as <strong>{status.user?.email || 'Administrator'}</strong>
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            Full administrative restore and migration access enabled
          </div>
        </div>
      )}

      {/* System Status Overview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div
          style={{
            background: 'var(--theme-elevation-50, #1c1c1c)',
            border: '1px solid var(--theme-elevation-150, #2f2f2f)',
            borderRadius: '10px',
            padding: '16px 20px',
          }}
        >
          <div
            style={{ fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase' }}
          >
            Active Database
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px', color: '#10b981' }}>
            {loadingStatus ? 'Loading...' : status?.database?.type || 'PostgreSQL'}
          </div>
          <div
            style={{ fontSize: '12px', color: '#888', marginTop: '4px', wordBreak: 'break-all' }}
          >
            {status?.database?.urlPreview || 'Connecting...'}
          </div>
        </div>

        <div
          style={{
            background: 'var(--theme-elevation-50, #1c1c1c)',
            border: '1px solid var(--theme-elevation-150, #2f2f2f)',
            borderRadius: '10px',
            padding: '16px 20px',
          }}
        >
          <div
            style={{ fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase' }}
          >
            Current Storage Bucket
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px', color: '#3b82f6' }}>
            {loadingStatus ? 'Loading...' : status?.storage?.bucket || 'Configured'}
          </div>
          <div
            style={{ fontSize: '12px', color: '#888', marginTop: '4px', wordBreak: 'break-all' }}
          >
            {status?.storage?.endpoint || 'S3 Endpoint'}
          </div>
        </div>

        <div
          style={{
            background: 'var(--theme-elevation-50, #1c1c1c)',
            border: '1px solid var(--theme-elevation-150, #2f2f2f)',
            borderRadius: '10px',
            padding: '16px 20px',
          }}
        >
          <div
            style={{ fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase' }}
          >
            Media & Content Records
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px', color: '#f59e0b' }}>
            {loadingStatus ? '...' : `${status?.counts?.media ?? 0} Media Files`}
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
            {status?.counts?.projects ?? 0} Projects • {status?.counts?.skills ?? 0} Skills
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--theme-elevation-200, #333)',
          marginBottom: '28px',
        }}
      >
        <button
          onClick={() => setActiveTab('bucket')}
          style={{
            padding: '12px 20px',
            fontSize: '15px',
            fontWeight: 600,
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'bucket' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'bucket' ? '#3b82f6' : 'var(--theme-elevation-600, #888)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          🗄️ Bucket & Storage Migration
        </button>
        <button
          onClick={() => setActiveTab('database')}
          style={{
            padding: '12px 20px',
            fontSize: '15px',
            fontWeight: 600,
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'database' ? '2px solid #10b981' : '2px solid transparent',
            color: activeTab === 'database' ? '#10b981' : 'var(--theme-elevation-600, #888)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          🗄️ Database Backup & Sync (SQL ⇄ NoSQL)
        </button>
      </div>

      {/* ================= TAB 1: BUCKET MIGRATION ================= */}
      {activeTab === 'bucket' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card 1: ZIP Download with Folders */}
          <div
            style={{
              background: 'var(--theme-elevation-50, #1c1c1c)',
              border: '1px solid var(--theme-elevation-150, #2f2f2f)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                  📦 Offline Media Backup (ZIP with Folders)
                </h3>
                <p
                  style={{
                    margin: '6px 0 0 0',
                    color: 'var(--theme-elevation-500, #999)',
                    fontSize: '14px',
                    maxWidth: '650px',
                  }}
                >
                  Downloads all files from your storage packaged neatly into folders (
                  <code>projects/</code>, <code>icons/</code>, <code>profile/</code>,{' '}
                  <code>media/</code>) matching your database's prefix records.
                </p>
              </div>

              <button
                onClick={handleDownloadZip}
                disabled={zipLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: zipLoading ? 'not-allowed' : 'pointer',
                  opacity: zipLoading ? 0.7 : 1,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                {zipLoading ? '⏳ Generating ZIP...' : '⬇️ Download All Media as ZIP'}
              </button>
            </div>

            {zipMessage && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: zipMessage.includes('❌')
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'rgba(16, 185, 129, 0.1)',
                  color: zipMessage.includes('❌') ? '#ef4444' : '#10b981',
                  border: `1px solid ${zipMessage.includes('❌') ? '#ef4444' : '#10b981'}`,
                }}
              >
                {zipMessage}
              </div>
            )}
          </div>

          {/* Card 2: Direct Bucket-to-Bucket Migration */}
          <div
            style={{
              background: 'var(--theme-elevation-50, #1c1c1c)',
              border: '1px solid var(--theme-elevation-150, #2f2f2f)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
              🚀 Direct Cloud-to-Cloud Bucket Migration
            </h3>
            <p
              style={{
                margin: '6px 0 20px 0',
                color: 'var(--theme-elevation-500, #999)',
                fontSize: '14px',
              }}
            >
              Transfer all media files directly to Cloudflare R2 or any new S3 bucket with folder
              preservation. Zero bandwidth used on your personal computer.
            </p>

            {/* Input Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                  }}
                >
                  Destination Bucket Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. my-portfolio"
                  value={destBucket}
                  onChange={(e) => setDestBucket(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--theme-elevation-200, #333)',
                    background: 'var(--theme-elevation-100, #222)',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                  }}
                >
                  S3 Endpoint URL (Required for Cloudflare R2 / Appwrite / MinIO)
                </label>
                <input
                  type="text"
                  placeholder="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
                  value={destEndpoint}
                  onChange={(e) => setDestEndpoint(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--theme-elevation-200, #333)',
                    background: 'var(--theme-elevation-100, #222)',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                  }}
                >
                  Access Key ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 6ac521180035efc4260f"
                  value={destAccessKeyId}
                  onChange={(e) => setDestAccessKeyId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--theme-elevation-200, #333)',
                    background: 'var(--theme-elevation-100, #222)',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}
                >
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Secret Access Key *</label>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3b82f6',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {showSecret ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder="Secret access key..."
                  value={destSecretAccessKey}
                  onChange={(e) => setDestSecretAccessKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--theme-elevation-200, #333)',
                    background: 'var(--theme-elevation-100, #222)',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                  }}
                >
                  Region
                </label>
                <input
                  type="text"
                  placeholder="auto (standard for R2) or us-east-1"
                  value={destRegion}
                  onChange={(e) => setDestRegion(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--theme-elevation-200, #333)',
                    background: 'var(--theme-elevation-100, #222)',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={destForcePathStyle}
                    onChange={(e) => setDestForcePathStyle(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>
                    Force Path Style (Required for MinIO / Appwrite, Leave unchecked for Cloudflare
                    R2)
                  </span>
                </label>
              </div>
            </div>

            {/* Test & Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection || transferring}
                style={{
                  padding: '10px 18px',
                  borderRadius: '6px',
                  background: 'var(--theme-elevation-150, #2b2b2b)',
                  color: '#fff',
                  border: '1px solid var(--theme-elevation-250, #444)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {testingConnection ? 'Testing...' : '🔌 Test Connection'}
              </button>

              <button
                type="button"
                onClick={handleStartTransfer}
                disabled={transferring}
                style={{
                  padding: '10px 22px',
                  borderRadius: '6px',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: transferring ? 'not-allowed' : 'pointer',
                  opacity: transferring ? 0.7 : 1,
                }}
              >
                {transferring ? '⏳ Migrating Files...' : '🚀 Start Direct Migration'}
              </button>
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: testResult.success
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                  color: testResult.success ? '#10b981' : '#ef4444',
                  border: `1px solid ${testResult.success ? '#10b981' : '#ef4444'}`,
                }}
              >
                {testResult.success ? '✅ ' : '❌ '} {testResult.message}
              </div>
            )}

            {/* Transfer Results Banner */}
            {transferResult && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '20px',
                  borderRadius: '10px',
                  background: transferResult.success
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${transferResult.success ? '#10b981' : '#ef4444'}`,
                }}
              >
                <h4
                  style={{
                    margin: '0 0 10px 0',
                    fontSize: '16px',
                    color: transferResult.success ? '#10b981' : '#ef4444',
                  }}
                >
                  {transferResult.success
                    ? '🎉 Migration Completed Successfully!'
                    : '❌ Migration Encountered Errors'}
                </h4>
                <p style={{ margin: '0 0 14px 0', fontSize: '14px' }}>
                  Total Files: <strong>{transferResult.total}</strong> | Successfully Transferred:{' '}
                  <strong>{transferResult.transferred}</strong> | Failed:{' '}
                  <strong>{transferResult.failed}</strong>
                </p>

                {transferResult.envSnippet && (
                  <div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        marginBottom: '6px',
                        color: '#10b981',
                      }}
                    >
                      📋 Step 2: Copy these credentials into your <code>.env</code> file:
                    </div>
                    <pre
                      style={{
                        background: '#111',
                        padding: '14px',
                        borderRadius: '6px',
                        overflowX: 'auto',
                        fontSize: '13px',
                        color: '#6ee7b7',
                        border: '1px solid #222',
                      }}
                    >
                      {transferResult.envSnippet}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: DATABASE MIGRATION ================= */}
      {activeTab === 'database' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Card 1: Direct Cloud-to-Cloud Database Migration */}
          <div
            style={{
              background: 'var(--theme-elevation-50, #1c1c1c)',
              border: '1px solid var(--theme-elevation-150, #2f2f2f)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>⚡</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                  Option 1: Direct Database Migration (Cloud-to-Cloud)
                </h3>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                Zero-file instant transfer
              </span>
            </div>
            <p
              style={{
                margin: '0 0 20px 0',
                color: 'var(--theme-elevation-500, #999)',
                fontSize: '14px',
                lineHeight: 1.5,
              }}
            >
              Simply give the target database connection string below. The migration engine connects
              directly to both databases and automatically copies all records (Users with login
              password, Skills, Categories, Projects, Education, Media records, and Profile) into
              the target database.
            </p>

            <div
              style={{
                background: 'var(--theme-elevation-100, #242424)',
                border: '1px solid var(--theme-elevation-200, #383838)',
                borderRadius: '10px',
                padding: '20px',
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                  }}
                >
                  Target Database Connection String <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type={directShowSecret ? 'text' : 'password'}
                    placeholder="postgresql://user:pass@host/db or mongodb+srv://user:pass@cluster..."
                    value={directTargetDbUrl}
                    onChange={(e) => setDirectTargetDbUrl(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'var(--theme-elevation-50, #1c1c1c)',
                      border: '1px solid var(--theme-elevation-250, #404040)',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      color: '#eee',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setDirectShowSecret(!directShowSecret)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--theme-elevation-250, #404040)',
                      color: '#bbb',
                      padding: '0 14px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {directShowSecret ? '🙈 Hide' : '👁️ View'}
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                  Supports PostgreSQL (Neon, Supabase) and MongoDB Atlas. Type is detected
                  automatically.
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() =>
                    handleTestDatabaseUrl(directTargetDbUrl, setTestingTargetDb, setTestDbResult)
                  }
                  disabled={testingTargetDb || !directTargetDbUrl.trim()}
                  style={{
                    background: 'var(--theme-elevation-200, #383838)',
                    color: '#eee',
                    border: '1px solid var(--theme-elevation-300, #505050)',
                    padding: '10px 18px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor:
                      testingTargetDb || !directTargetDbUrl.trim() ? 'not-allowed' : 'pointer',
                    opacity: !directTargetDbUrl.trim() ? 0.6 : 1,
                  }}
                >
                  {testingTargetDb ? '🔍 Testing Target DB...' : '🔍 Test Target Connection'}
                </button>

                <button
                  type="button"
                  onClick={handleStartDirectMigrateDb}
                  disabled={directMigrating || !directTargetDbUrl.trim()}
                  style={{
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor:
                      directMigrating || !directTargetDbUrl.trim() ? 'not-allowed' : 'pointer',
                    opacity: !directTargetDbUrl.trim() ? 0.6 : 1,
                  }}
                >
                  {directMigrating ? '⏳ Migrating All Data...' : '🚀 Start Direct Migration'}
                </button>
              </div>

              {/* Connection Test Banner */}
              {testDbResult && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: testDbResult.success
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(239, 68, 68, 0.1)',
                    color: testDbResult.success ? '#10b981' : '#ef4444',
                    border: `1px solid ${testDbResult.success ? '#10b981' : '#ef4444'}`,
                  }}
                >
                  {testDbResult.success ? '✅ ' : '❌ '} {testDbResult.message}
                </div>
              )}

              {/* Direct Migration Results Banner */}
              {directMigrateResult && (
                <div
                  style={{
                    marginTop: '20px',
                    padding: '20px',
                    borderRadius: '10px',
                    background: directMigrateResult.success
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${directMigrateResult.success ? '#10b981' : '#ef4444'}`,
                  }}
                >
                  <h4
                    style={{
                      margin: '0 0 10px 0',
                      fontSize: '16px',
                      color: directMigrateResult.success ? '#10b981' : '#ef4444',
                    }}
                  >
                    {directMigrateResult.success
                      ? `🎉 Direct Migration to ${directMigrateResult.targetType || 'Target Database'} Completed!`
                      : '❌ Migration Encountered an Error'}
                  </h4>

                  {directMigrateResult.stats && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '10px',
                        margin: '14px 0',
                      }}
                    >
                      <div
                        style={{
                          background: '#1c1c1c',
                          padding: '10px',
                          borderRadius: '6px',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '11px', color: '#888' }}>Users</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>
                          {directMigrateResult.stats.users}
                        </div>
                      </div>
                      <div
                        style={{
                          background: '#1c1c1c',
                          padding: '10px',
                          borderRadius: '6px',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '11px', color: '#888' }}>Categories</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>
                          {directMigrateResult.stats.categories}
                        </div>
                      </div>
                      <div
                        style={{
                          background: '#1c1c1c',
                          padding: '10px',
                          borderRadius: '6px',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '11px', color: '#888' }}>Skills</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>
                          {directMigrateResult.stats.skills}
                        </div>
                      </div>
                      <div
                        style={{
                          background: '#1c1c1c',
                          padding: '10px',
                          borderRadius: '6px',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '11px', color: '#888' }}>Projects</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>
                          {directMigrateResult.stats.projects}
                        </div>
                      </div>
                      <div
                        style={{
                          background: '#1c1c1c',
                          padding: '10px',
                          borderRadius: '6px',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '11px', color: '#888' }}>Education</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>
                          {directMigrateResult.stats.education}
                        </div>
                      </div>
                      <div
                        style={{
                          background: '#1c1c1c',
                          padding: '10px',
                          borderRadius: '6px',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '11px', color: '#888' }}>Media Records</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>
                          {directMigrateResult.stats.media}
                        </div>
                      </div>
                    </div>
                  )}

                  {directMigrateResult.envSnippet && (
                    <div style={{ marginTop: '14px' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          marginBottom: '6px',
                          color: '#10b981',
                        }}
                      >
                        📋 When you are ready to switch your app to this target database, update
                        your <code>.env</code>:
                      </div>
                      <pre
                        style={{
                          background: '#111',
                          padding: '12px',
                          borderRadius: '6px',
                          overflowX: 'auto',
                          fontSize: '12px',
                          color: '#6ee7b7',
                          border: '1px solid #222',
                        }}
                      >
                        {directMigrateResult.envSnippet}
                      </pre>
                    </div>
                  )}

                  {directMigrateResult.error && (
                    <div style={{ fontSize: '13px', color: '#ef4444', marginTop: '8px' }}>
                      {directMigrateResult.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: JSON File-Based Backup & Custom Import */}
          <div
            style={{
              background: 'var(--theme-elevation-50, #1c1c1c)',
              border: '1px solid var(--theme-elevation-150, #2f2f2f)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}
            >
              <span style={{ fontSize: '22px' }}>📁</span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                Option 2: File-Based JSON Backup & Import
              </h3>
            </div>
            <p
              style={{
                margin: '0 0 20px 0',
                color: 'var(--theme-elevation-500, #999)',
                fontSize: '14px',
                lineHeight: 1.5,
              }}
            >
              Download an offline JSON snapshot of your database, or upload an existing JSON dump
              into any database of your choice without modifying environment variables.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px',
              }}
            >
              {/* Export Card */}
              <div
                style={{
                  background: 'var(--theme-elevation-100, #242424)',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '1px solid var(--theme-elevation-200, #383838)',
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                  📥 Step 1: Export Current Database
                </h4>
                <p
                  style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#aaa', lineHeight: 1.4 }}
                >
                  Downloads a complete snapshot of all collections and settings as a clean{' '}
                  <code>.json</code> document.
                </p>
                <button
                  type="button"
                  onClick={handleExportDb}
                  disabled={dbExportLoading}
                  style={{
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 18px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: dbExportLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {dbExportLoading ? 'Exporting...' : '⬇️ Download Database Backup (JSON)'}
                </button>
              </div>

              {/* Import Card with Target DB Connection String */}
              <div
                style={{
                  background: 'var(--theme-elevation-100, #242424)',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '1px solid var(--theme-elevation-200, #383838)',
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                  📤 Step 2: Import from JSON Dump
                </h4>
                <p
                  style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#aaa', lineHeight: 1.4 }}
                >
                  Select your JSON dump file, and optionally enter a target database connection
                  string to restore directly into it without changing <code>.env</code>.
                </p>

                {/* File picker */}
                <div style={{ marginBottom: '14px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  >
                    JSON Backup File <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => setDbImportFile(e.target.files?.[0] || null)}
                    style={{ fontSize: '13px', color: '#ccc' }}
                  />
                </div>

                {/* Target DB URL (Optional) */}
                <div style={{ marginBottom: '14px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  >
                    Target Database Connection String{' '}
                    <span style={{ color: '#888', fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type={dbImportShowSecret ? 'text' : 'password'}
                      placeholder="Leave empty for current DB, or enter postgresql:// or mongodb+srv://..."
                      value={dbImportTargetUrl}
                      onChange={(e) => setDbImportTargetUrl(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'var(--theme-elevation-50, #1c1c1c)',
                        border: '1px solid var(--theme-elevation-250, #404040)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: '#eee',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setDbImportShowSecret(!dbImportShowSecret)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--theme-elevation-250, #404040)',
                        color: '#bbb',
                        padding: '0 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {dbImportShowSecret ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                    Leave blank to import into active database, or enter target DB to upload data
                    without changing .env.
                  </div>
                </div>

                {/* Test Import DB button if URL entered */}
                {dbImportTargetUrl.trim() && (
                  <div style={{ marginBottom: '14px' }}>
                    <button
                      type="button"
                      onClick={() =>
                        handleTestDatabaseUrl(
                          dbImportTargetUrl,
                          setTestingImportDb,
                          setTestImportDbResult,
                        )
                      }
                      disabled={testingImportDb}
                      style={{
                        background: 'var(--theme-elevation-200, #383838)',
                        color: '#ddd',
                        border: '1px solid var(--theme-elevation-250, #404040)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {testingImportDb ? '🔍 Testing...' : '🔍 Test Target Connection'}
                    </button>
                    {testImportDbResult && (
                      <div
                        style={{
                          marginTop: '6px',
                          fontSize: '12px',
                          color: testImportDbResult.success ? '#10b981' : '#ef4444',
                        }}
                      >
                        {testImportDbResult.success ? '✅ ' : '❌ '} {testImportDbResult.message}
                      </div>
                    )}
                  </div>
                )}

                {/* Import Button */}
                <div>
                  <button
                    type="button"
                    onClick={handleImportDb}
                    disabled={dbImportLoading || !dbImportFile}
                    style={{
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 18px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: dbImportLoading || !dbImportFile ? 'not-allowed' : 'pointer',
                      opacity: !dbImportFile ? 0.6 : 1,
                    }}
                  >
                    {dbImportLoading ? 'Importing...' : '⬆️ Restore / Import JSON'}
                  </button>
                </div>
              </div>
            </div>

            {/* Import Status Message */}
            {dbImportResult && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: dbImportResult.success
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                  color: dbImportResult.success ? '#10b981' : '#ef4444',
                  border: `1px solid ${dbImportResult.success ? '#10b981' : '#ef4444'}`,
                }}
              >
                <h4 style={{ margin: '0 0 8px 0' }}>
                  {dbImportResult.success
                    ? `✅ Database Import Completed!${dbImportResult.targetType ? ` (into ${dbImportResult.targetType})` : ''}`
                    : '❌ Import Failed'}
                </h4>
                {dbImportResult.stats && (
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', fontSize: '13px' }}>
                    <li>Users imported: {dbImportResult.stats.users}</li>
                    <li>Categories imported: {dbImportResult.stats.categories}</li>
                    <li>Skills imported: {dbImportResult.stats.skills}</li>
                    <li>Projects imported: {dbImportResult.stats.projects}</li>
                    <li>Education imported: {dbImportResult.stats.education}</li>
                    <li>Media imported: {dbImportResult.stats.media}</li>
                    <li>Profile updated: {dbImportResult.stats.profileUpdated ? 'Yes' : 'No'}</li>
                  </ul>
                )}
                {dbImportResult.envSnippet && (
                  <div style={{ marginTop: '10px' }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#10b981',
                        marginBottom: '4px',
                      }}
                    >
                      📋 Update .env to switch to this database:
                    </div>
                    <pre
                      style={{
                        background: '#111',
                        padding: '10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#6ee7b7',
                        margin: 0,
                      }}
                    >
                      {dbImportResult.envSnippet}
                    </pre>
                  </div>
                )}
                {dbImportResult.error && <div>{dbImportResult.error}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

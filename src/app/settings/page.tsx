'use client'

import { useState, useEffect } from 'react'
import { AppSettings, DEFAULT_SETTINGS } from '@/lib/types'
import { getSettings, saveSettings } from '@/lib/storage'
import { Settings, Key, Brain, CheckCircle2, Server } from 'lucide-react'

const LLM_PROVIDERS = [
  { value: 'none', label: 'Rule-based (No AI)', description: 'Uses deterministic rules with market data. Fast and unlimited.' },
  { value: 'grok', label: 'Grok (Your own key)', description: 'Use your own Grok API key for unlimited access.' },
  { value: 'openai', label: 'OpenAI', description: 'GPT-4o-mini or other OpenAI models.' },
  { value: 'openrouter', label: 'OpenRouter', description: 'Access DeepSeek, Llama, and other models.' },
]

const MODEL_PRESETS: Record<string, { label: string; value: string }[]> = {
  grok: [
    { label: 'Grok 3 (Recommended)', value: 'grok-3' },
    { label: 'Grok 3 Mini', value: 'grok-3-mini' },
  ],
  openai: [
    { label: 'GPT-4o Mini (Cheap)', value: 'gpt-4o-mini' },
    { label: 'GPT-4o', value: 'gpt-4o' },
  ],
  openrouter: [
    { label: 'DeepSeek Chat', value: 'deepseek/deepseek-chat' },
    { label: 'Llama 3.3 70B', value: 'meta-llama/llama-3.3-70b-instruct' },
  ],
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(getSettings())
  }, [])

  const handleSave = () => {
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const update = (patch: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }))
    setSaved(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8" style={{ color: 'var(--text-secondary)' }} />
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="gradient-text">Settings</span>
          </h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Configure LLM provider for AI-powered simulations and API keys for enhanced data access.
        </p>
      </div>

      {/* LLM Provider */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>LLM Provider</h3>
        </div>

        <div className="space-y-2">
          {LLM_PROVIDERS.map(provider => (
            <label
              key={provider.value}
              className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
              style={{
                background: settings.llmProvider === provider.value ? 'rgba(59,130,246,0.08)' : 'var(--bg-primary)',
                border: `1px solid ${settings.llmProvider === provider.value ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
              }}
            >
              <input
                type="radio"
                name="llmProvider"
                value={provider.value}
                checked={settings.llmProvider === provider.value}
                onChange={() => update({ llmProvider: provider.value as AppSettings['llmProvider'] })}
                className="mt-1"
              />
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{provider.label}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{provider.description}</div>
              </div>
            </label>
          ))}
        </div>

        {settings.llmProvider !== 'none' && (
          <>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                API Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder="Enter your API key..."
                  value={settings.llmApiKey}
                  onChange={e => update({ llmApiKey: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Your key is stored locally and never sent to our servers.
              </p>
            </div>

            {MODEL_PRESETS[settings.llmProvider] && (
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Model
                </label>
                <select
                  value={settings.llmModel}
                  onChange={e => update({ llmModel: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  {MODEL_PRESETS[settings.llmProvider].map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </div>

      {/* Opinion API Key */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5" style={{ color: 'var(--accent-orange)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Opinion API Key</h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.1)', color: '#FCD34D' }}>Optional</span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Provide an Opinion API key to access advanced market data (orderbooks, price history).
          Public data (indicators) works without a key.
        </p>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="password"
            placeholder="Opinion API key (optional)..."
            value={settings.opinionApiKey}
            onChange={e => update({ opinionApiKey: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
        style={{
          background: saved ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
          color: 'white',
          border: saved ? '1px solid rgba(16,185,129,0.3)' : 'none',
        }}
      >
        {saved ? (
          <><CheckCircle2 className="w-4 h-4" /> Settings Saved</>
        ) : (
          'Save Settings'
        )}
      </button>
    </div>
  )
}

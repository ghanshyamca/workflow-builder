import React, { useEffect, useState } from 'react'
import api from '@services/api'

interface Trigger {
  id: string
  workflow_id: string
  trigger_type: 'webhook' | 'schedule'
  webhook_url?: string
  cron_expression?: string
  timezone?: string
  is_active: boolean
  created_at: string
}

interface TriggerManagerProps {
  workflowId: string
}

const TriggerManager: React.FC<TriggerManagerProps> = ({ workflowId }) => {
  const [triggers, setTriggers] = useState<Trigger[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'webhook' | 'schedule'>('webhook')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [cronExpression, setCronExpression] = useState('0 0 * * *')
  const [timezone, setTimezone] = useState('UTC')

  const loadTriggers = async () => {
    setLoading(true)
    try {
      const res = await api.getTriggers(workflowId)
      setTriggers(res.data.data || [])
    } catch (err) {
      console.error('Failed to load triggers', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTriggers()
  }, [workflowId])

  const handleCreate = async () => {
    if (formType === 'webhook' && !webhookUrl) {
      alert('Please enter a webhook URL')
      return
    }
    if (formType === 'schedule' && !cronExpression) {
      alert('Please enter a cron expression')
      return
    }

    try {
      const data: any = {
        workflowId,
        triggerType: formType,
      }

      if (formType === 'webhook') {
        data.webhookUrl = webhookUrl
      } else {
        data.cronExpression = cronExpression
        data.timezone = timezone
      }

      await api.createTrigger(workflowId, data)
      setShowForm(false)
      setWebhookUrl('')
      setCronExpression('0 0 * * *')
      loadTriggers()
    } catch (err) {
      console.error('Create failed', err)
      alert('Failed to create trigger')
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await api.toggleTrigger(id, !isActive)
      loadTriggers()
    } catch (err) {
      console.error('Toggle failed', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this trigger?')) return
    try {
      await api.deleteTrigger(id)
      loadTriggers()
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/30 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Triggers</h3>
        <button
          className="rounded-lg border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-xs hover:bg-emerald-500/20"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add Trigger'}
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Type</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as 'webhook' | 'schedule')}
              className="w-full rounded-md border border-white/15 bg-slate-900/80 px-2 py-1 text-xs outline-none ring-cyan-400/50 focus:ring"
            >
              <option value="webhook">Webhook</option>
              <option value="schedule">Schedule (Cron)</option>
            </select>
          </div>

          {formType === 'webhook' && (
            <input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full rounded-md border border-white/15 bg-slate-900/80 px-2 py-1 text-xs outline-none ring-cyan-400/50 focus:ring"
              placeholder="https://example.com/webhook"
            />
          )}

          {formType === 'schedule' && (
            <>
              <input
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-slate-900/80 px-2 py-1 text-xs outline-none ring-cyan-400/50 focus:ring font-mono"
                placeholder="0 0 * * * (min hr day mo dow)"
              />
              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-slate-900/80 px-2 py-1 text-xs outline-none ring-cyan-400/50 focus:ring"
                placeholder="Timezone (e.g., UTC, America/New_York)"
              />
            </>
          )}

          <button
            className="w-full rounded-md border border-emerald-400/50 bg-emerald-500/20 px-2 py-2 text-xs font-medium hover:bg-emerald-500/30"
            onClick={handleCreate}
          >
            Create Trigger
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-slate-400">Loading...</p>
      ) : triggers.length === 0 ? (
        <p className="text-xs text-slate-500">No triggers. Add one to automate workflow execution.</p>
      ) : (
        <div className="space-y-2">
          {triggers.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2">
              <div className="flex-1 text-xs">
                <div className="font-mono text-slate-300">
                  {t.trigger_type === 'webhook' ? (
                    <span className="truncate">{t.webhook_url}</span>
                  ) : (
                    <span>{t.cron_expression}</span>
                  )}
                </div>
                <div className="text-slate-400 text-[10px]">{t.trigger_type}</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="rounded-md border border-white/15 px-2 py-1 text-[10px] hover:bg-white/10"
                  onClick={() => handleToggle(t.id, t.is_active)}
                >
                  {t.is_active ? 'On' : 'Off'}
                </button>
                <button
                  className="rounded-md border border-rose-400/50 text-rose-300 px-2 py-1 text-[10px] hover:bg-rose-500/10"
                  onClick={() => handleDelete(t.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TriggerManager

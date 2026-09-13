import { useState } from 'react'
import { getStorageItem, setStorageItem } from '../../utils/storage.js'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Toast } from '../../components/ui/Toast.jsx'

const STORAGE_KEY = 'cf_categories'

const INITIAL_CATEGORIES = [
  { id: 'roads', name: 'Roads & Infrastructure', label: 'Roads & Infrastructure', icon: '🛣️', slaHours: 48, status: 'ACTIVE' },
  { id: 'streetlights', name: 'Electrical & Street Lighting', label: 'Electrical & Street Lighting', icon: '💡', slaHours: 24, status: 'ACTIVE' },
  { id: 'water', name: 'Water Supply & Leakage', label: 'Water Supply & Leakage', icon: '🚰', slaHours: 24, status: 'ACTIVE' },
  { id: 'sanitation', name: 'Sanitation & Solid Waste', label: 'Sanitation & Solid Waste', icon: '🗑️', slaHours: 48, status: 'ACTIVE' },
  { id: 'drainage', name: 'Drainage & Sewage Board', label: 'Drainage & Sewage Board', icon: '🌊', slaHours: 36, status: 'ACTIVE' },
  { id: 'parks', name: 'Horticulture & Public Parks', label: 'Horticulture & Public Parks', icon: '🌳', slaHours: 72, status: 'ACTIVE' },
  { id: 'transport', name: 'Public Transport & Traffic', label: 'Public Transport & Traffic', icon: '🚌', slaHours: 48, status: 'ACTIVE' },
  { id: 'other', name: 'General Municipal Issues', label: 'General Municipal Issues', icon: '📋', slaHours: 48, status: 'ACTIVE' },
]

export function CategoriesManagement() {
  const [categories, setCategories] = useState(() => getStorageItem(STORAGE_KEY, INITIAL_CATEGORIES))
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)

  // Form states
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🏷️')
  const [slaHours, setSlaHours] = useState('48')

  const [toastMessage, setToastMessage] = useState('')

  const loadCategories = () => {
    const list = getStorageItem(STORAGE_KEY, INITIAL_CATEGORIES)
    setCategories(list)
  }

  const handleOpenAdd = () => {
    setName('')
    setIcon('🏷️')
    setSlaHours('48')
    setIsAddModalOpen(true)
  }

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat)
    setName(cat.label || cat.name)
    setIcon(cat.icon || '🏷️')
    setSlaHours(String(cat.slaHours || 48))
  }

  const handleSaveAdd = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    const newCat = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      label: name.trim(),
      icon: icon.trim() || '🏷️',
      slaHours: parseInt(slaHours, 10) || 48,
      status: 'ACTIVE',
    }

    const currentList = getStorageItem(STORAGE_KEY, INITIAL_CATEGORIES)
    const updated = [...currentList, newCat]
    setStorageItem(STORAGE_KEY, updated)

    setIsAddModalOpen(false)
    loadCategories()
    setToastMessage(`Category "${newCat.name}" created successfully.`)
  }

  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (!editingCategory || !name.trim()) return

    const currentList = getStorageItem(STORAGE_KEY, INITIAL_CATEGORIES)
    const updated = currentList.map((c) =>
      c.id === editingCategory.id
        ? {
            ...c,
            name: name.trim(),
            label: name.trim(),
            icon: icon.trim() || '🏷️',
            slaHours: parseInt(slaHours, 10) || 48,
          }
        : c
    )
    setStorageItem(STORAGE_KEY, updated)

    setEditingCategory(null)
    loadCategories()
    setToastMessage(`Category updated successfully.`)
  }

  const handleToggleStatus = (cat) => {
    const nextStatus = cat.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED'
    const currentList = getStorageItem(STORAGE_KEY, INITIAL_CATEGORIES)
    const updated = currentList.map((c) =>
      c.id === cat.id ? { ...c, status: nextStatus } : c
    )
    setStorageItem(STORAGE_KEY, updated)
    loadCategories()
    setToastMessage(`Category "${cat.label || cat.name}" is now ${nextStatus}.`)
  }

  return (
    <div>
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Municipal Categories & SLA Management</h1>
          <p className="cf-page-subtitle">
            Configure municipal service domains, icons, response SLA deadlines, and active state.
          </p>
        </div>
        <Button onClick={handleOpenAdd}>➕ Add New Category</Button>
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table className="cf-table">
            <thead>
              <tr>
                <th>Category Domain</th>
                <th>Standard SLA</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const isActive = cat.status !== 'DISABLED'
                return (
                  <tr key={cat.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ fontSize: '1.4rem' }}>{cat.icon}</span>
                        <div>
                          <strong>{cat.label || cat.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
                            ID: {cat.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{cat.slaHours || 48} Hours</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
                        Default Resolution Target
                      </div>
                    </td>
                    <td>
                      <Badge variant={isActive ? 'success' : 'danger'}>
                        {isActive ? 'ACTIVE' : 'DISABLED'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="cf-inline-wrap" style={{ justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                        <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(cat)}>
                          ✏️ Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={isActive ? 'destructive' : 'success'}
                          onClick={() => handleToggleStatus(cat)}
                        >
                          {isActive ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Category"
          footer={
            <div className="cf-inline-wrap" style={{ justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAdd}>
                ✓ Save Category
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSaveAdd} className="auth-form">
            <Input
              id="new-cat-name"
              label="Category Name *"
              placeholder="e.g. Public Parks & Greenery"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              id="new-cat-icon"
              label="Icon / Emoji"
              placeholder="e.g. 🌳 or 💡"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
            />
            <Input
              id="new-cat-sla"
              label="Default SLA Target (Hours) *"
              type="number"
              value={slaHours}
              onChange={(e) => setSlaHours(e.target.value)}
              required
            />
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editingCategory && (
        <Modal
          isOpen={Boolean(editingCategory)}
          onClose={() => setEditingCategory(null)}
          title="Edit Category"
          footer={
            <div className="cf-inline-wrap" style={{ justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={() => setEditingCategory(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                ✓ Save Changes
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSaveEdit} className="auth-form">
            <Input
              id="edit-cat-name"
              label="Category Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              id="edit-cat-icon"
              label="Icon / Emoji"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
            />
            <Input
              id="edit-cat-sla"
              label="Default SLA Target (Hours) *"
              type="number"
              value={slaHours}
              onChange={(e) => setSlaHours(e.target.value)}
              required
            />
          </form>
        </Modal>
      )}

      {toastMessage && (
        <Toast
          variant="success"
          title="Categories Updated"
          message={toastMessage}
          onClose={() => setToastMessage('')}
        />
      )}
    </div>
  )
}

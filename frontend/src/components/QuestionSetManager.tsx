import React, { useState, useEffect } from 'react'
import { apiService } from '../services/apiService'
import { LoadingSpinner } from './LoadingSpinner'
import { AIQuestionGenerator } from './AIQuestionGenerator'
import styles from '../styles/QuestionSetManager.module.css'

interface QuestionSet {
  id: number
  name: string
  description: string
  category: string
  difficulty: string
  is_active: boolean
  questions?: Question[]
}

interface Question {
  id: number
  question_text: any
  answers: any
  explanation: any
  difficulty: number
}

interface QuestionSetStats {
  total_questions: number
  avg_difficulty: number
  min_difficulty: number
  max_difficulty: number
}

export const QuestionSetManager: React.FC = () => {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [selectedSet, setSelectedSet] = useState<QuestionSet | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showImportForm, setShowImportForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [stats, setStats] = useState<QuestionSetStats | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    difficulty: 'medium'
  })

  const [importData, setImportData] = useState('')

  useEffect(() => {
    loadQuestionSets()
  }, [])

  const loadQuestionSets = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiService.getQuestionSets()
      if (response.success && response.data) {
        // Transform the data to match the QuestionSet interface
        const transformedData: QuestionSet[] = response.data.map((set: any) => ({
          id: set.id,
          name: set.name,
          description: set.description,
          category: set.category || '',
          difficulty: set.difficulty || 'medium',
          is_active: set.is_active !== undefined ? set.is_active : true
        }))
        setQuestionSets(transformedData)
      } else {
        setError(response.error || 'Failed to load question sets')
      }
    } catch (err) {
      setError('Failed to load question sets')
    } finally {
      setIsLoading(false)
    }
  }

  const loadQuestionSetDetails = async (id: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiService.getQuestionSetDetails(id)
      if (response.success && response.data) {
        setSelectedSet(response.data)
        
        // Load stats
        const statsResponse = await apiService.getQuestionSetStats(id)
        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data)
        }
      } else {
        setError(response.error || 'Failed to load question set details')
      }
    } catch (err) {
      setError('Failed to load question set details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateQuestionSet = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await apiService.createQuestionSet(formData)
      if (response.success && response.data) {
        setQuestionSets([...questionSets, response.data])
        setShowCreateForm(false)
        setFormData({ name: '', description: '', category: '', difficulty: 'medium' })
      } else {
        setError(response.error || 'Failed to create question set')
      }
    } catch (err) {
      setError('Failed to create question set')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateQuestionSet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSet) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await apiService.updateQuestionSet(selectedSet.id, {
        ...formData,
        is_active: selectedSet.is_active
      })
      if (response.success && response.data) {
        const updatedSet: QuestionSet = {
          id: response.data.id,
          name: response.data.name,
          description: response.data.description,
          category: response.data.category,
          difficulty: response.data.difficulty,
          is_active: response.data.is_active,
          questions: selectedSet.questions
        }
        setQuestionSets(questionSets.map(set => 
          set.id === selectedSet.id ? updatedSet : set
        ))
        setSelectedSet(updatedSet)
        setShowEditForm(false)
        setFormData({ name: '', description: '', category: '', difficulty: 'medium' })
      } else {
        setError(response.error || 'Failed to update question set')
      }
    } catch (err) {
      setError('Failed to update question set')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteQuestionSet = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question set? This action cannot be undone.')) {
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await apiService.deleteQuestionSet(id)
      if (response.success) {
        setQuestionSets(questionSets.filter(set => set.id !== id))
        if (selectedSet?.id === id) {
          setSelectedSet(null)
          setStats(null)
        }
      } else {
        setError(response.error || 'Failed to delete question set')
      }
    } catch (err) {
      setError('Failed to delete question set')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportQuestionSet = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const parsedData = JSON.parse(importData)
      const response = await apiService.importQuestionSet(parsedData)
      if (response.success && response.data) {
        await loadQuestionSets() // Reload to get the new set
        setShowImportForm(false)
        setImportData('')
      } else {
        setError(response.error || 'Failed to import question set')
      }
    } catch (err) {
      setError('Invalid JSON format or failed to import question set')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportQuestionSet = async (id: number) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await apiService.exportQuestionSet(id)
      if (response.success && response.data) {
        const dataStr = JSON.stringify(response.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `question-set-${id}.json`
        link.click()
        URL.revokeObjectURL(url)
      } else {
        setError(response.error || 'Failed to export question set')
      }
    } catch (err) {
      setError('Failed to export question set')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClick = (set: QuestionSet) => {
    setSelectedSet(set)
    setFormData({
      name: set.name,
      description: set.description,
      category: set.category,
      difficulty: set.difficulty
    })
    setShowEditForm(true)
  }

  const handleSelectSet = (set: QuestionSet) => {
    setSelectedSet(set)
    loadQuestionSetDetails(set.id)
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner />
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Question Set Manager</h1>
        <div className={styles.actions}>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => setShowCreateForm(true)}
          >
            Create New Set
          </button>
          <button
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={() => setShowImportForm(true)}
          >
            Import Set
          </button>
          <button
            className={`${styles.button} ${styles.buttonAccent}`}
            onClick={() => setShowAIGenerator(true)}
          >
            🤖 AI Generator
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.sidebar}>
          <h2>Question Sets</h2>
          <div className={styles.questionSetList}>
            {questionSets.map(set => (
              <div
                key={set.id}
                className={`${styles.questionSetItem} ${
                  selectedSet?.id === set.id ? styles.selected : ''
                }`}
                onClick={() => handleSelectSet(set)}
              >
                <div className={styles.questionSetInfo}>
                  <h3>{set.name}</h3>
                  <p>{set.description}</p>
                  <div className={styles.questionSetMeta}>
                    <span className={styles.category}>{set.category}</span>
                    <span className={`${styles.difficulty} ${styles[set.difficulty]}`}>
                      {set.difficulty}
                    </span>
                    <span className={`${styles.status} ${set.is_active ? styles.active : styles.inactive}`}>
                      {set.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className={styles.questionSetActions}>
                  <button
                    className={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditClick(set)
                    }}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleExportQuestionSet(set.id)
                    }}
                    title="Export"
                  >
                    📤
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteQuestionSet(set.id)
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.mainContent}>
          {selectedSet ? (
            <div className={styles.questionSetDetails}>
              <div className={styles.questionSetHeader}>
                <h2>{selectedSet.name}</h2>
                <div className={styles.questionSetMeta}>
                  <span className={styles.category}>{selectedSet.category}</span>
                  <span className={`${styles.difficulty} ${styles[selectedSet.difficulty]}`}>
                    {selectedSet.difficulty}
                  </span>
                  <span className={`${styles.status} ${selectedSet.is_active ? styles.active : styles.inactive}`}>
                    {selectedSet.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <p className={styles.description}>{selectedSet.description}</p>

              {stats && (
                <div className={styles.stats}>
                  <h3>Statistics</h3>
                  <div className={styles.statsGrid}>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Total Questions</span>
                      <span className={styles.statValue}>{stats.total_questions}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Average Difficulty</span>
                      <span className={styles.statValue}>{stats.avg_difficulty.toFixed(1)}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Difficulty Range</span>
                      <span className={styles.statValue}>{stats.min_difficulty} - {stats.max_difficulty}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedSet.questions && (
                <div className={styles.questions}>
                  <h3>Questions ({selectedSet.questions.length})</h3>
                  <div className={styles.questionList}>
                    {selectedSet.questions.map((question, index) => (
                      <div key={question.id} className={styles.questionItem}>
                        <div className={styles.questionHeader}>
                          <span className={styles.questionNumber}>Q{index + 1}</span>
                          <span className={`${styles.difficulty} ${styles[`level${question.difficulty}`]}`}>
                            Level {question.difficulty}
                          </span>
                        </div>
                        <div className={styles.questionText}>
                          {question.question_text?.en || 'No question text'}
                        </div>
                        <div className={styles.questionAnswers}>
                          {question.answers?.map((answer: any, answerIndex: number) => (
                            <div
                              key={answerIndex}
                              className={`${styles.answer} ${answer.correct ? styles.correct : ''}`}
                            >
                              {answer.text?.en || 'No answer text'}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h2>Select a Question Set</h2>
              <p>Choose a question set from the sidebar to view its details and manage questions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Question Set Modal */}
      {showCreateForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Create New Question Set</h2>
            <form onSubmit={handleCreateQuestionSet}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="difficulty">Difficulty</label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.buttonPrimary}>
                  Create
                </button>
                <button
                  type="button"
                  className={styles.buttonSecondary}
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Question Set Modal */}
      {showEditForm && selectedSet && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Edit Question Set</h2>
            <form onSubmit={handleUpdateQuestionSet}>
              <div className={styles.formGroup}>
                <label htmlFor="edit-name">Name</label>
                <input
                  type="text"
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="edit-category">Category</label>
                <input
                  type="text"
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="edit-difficulty">Difficulty</label>
                <select
                  id="edit-difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.buttonPrimary}>
                  Update
                </button>
                <button
                  type="button"
                  className={styles.buttonSecondary}
                  onClick={() => setShowEditForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Question Set Modal */}
      {showImportForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Import Question Set</h2>
            <form onSubmit={handleImportQuestionSet}>
              <div className={styles.formGroup}>
                <label htmlFor="import-data">JSON Data</label>
                <textarea
                  id="import-data"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste JSON data here..."
                  rows={10}
                  required
                />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.buttonPrimary}>
                  Import
                </button>
                <button
                  type="button"
                  className={styles.buttonSecondary}
                  onClick={() => setShowImportForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Question Generator Modal */}
      {showAIGenerator && (
        <div className={styles.modal}>
          <div className={styles.modalContent} style={{ maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
            <div className={styles.modalHeader}>
              <h2>AI Question Generator</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowAIGenerator(false)}
              >
                ×
              </button>
            </div>
            <AIQuestionGenerator />
          </div>
        </div>
      )}
    </div>
  )
} 
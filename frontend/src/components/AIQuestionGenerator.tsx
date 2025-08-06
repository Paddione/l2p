import React, { useState, useEffect } from 'react'
import { apiService } from '../services/apiService'
import { LoadingSpinner } from './LoadingSpinner'
import FileManager from './FileManager'
import styles from '../styles/AIQuestionGenerator.module.css'

interface AIGenerationForm {
  topic: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionCount: number
  language: 'en' | 'de'
  contextSource: 'files' | 'manual' | 'both'
  selectedFiles: string[]
}

interface FileData {
  fileId: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  metadata: any;
  chromaDocumentId: string;
  createdAt: string;
}

interface GenerationResult {
  questionSet: {
    id: number
    name: string
    description: string
    category: string
    difficulty: string
    is_active: boolean
  }
  questions: Array<{
    id: number
    question_set_id: number
    question_text: any
    answers: any
    explanation: any
    difficulty: number
  }>
  metadata: {
    topic: string
    category: string
    difficulty: string
    generatedAt: string
    contextUsed: string[]
  }
  message: string
}

interface AIStatus {
  geminiConnected: boolean
  chromaConnected: boolean
  chromaStats: {
    totalDocuments: number
    totalEmbeddings: number
    sources: string[]
    subjects: string[]
  } | null
}

export const AIQuestionGenerator: React.FC = () => {
  const [formData, setFormData] = useState<AIGenerationForm>({
    topic: '',
    category: '',
    difficulty: 'medium',
    questionCount: 10,
    language: 'en',
    contextSource: 'both',
    selectedFiles: []
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)
  const [aiStatus, setAiStatus] = useState<AIStatus>({
    geminiConnected: false,
    chromaConnected: false,
    chromaStats: null
  })

  const [availableFiles, setAvailableFiles] = useState<FileData[]>([])
  const [showFileManager, setShowFileManager] = useState(false)

  const categories = [
    'Programming',
    'Mathematics',
    'Science',
    'History',
    'Geography',
    'Literature',
    'Art',
    'Music',
    'Sports',
    'Technology',
    'Business',
    'Philosophy',
    'Psychology',
    'Economics',
    'Politics',
    'Other'
  ]

  useEffect(() => {
    checkAIStatus()
    loadAvailableFiles()
  }, [])

  const checkAIStatus = async () => {
    setIsLoadingStatus(true)
    setError(null)

    try {
      // Test Gemini connection
      const geminiResponse = await apiService.testGeminiConnection()
      
      // Test ChromaDB connection
      const chromaResponse = await apiService.testChromaConnection()
      
      // Get ChromaDB stats
      const statsResponse = await apiService.getChromaStats()

      setAiStatus({
        geminiConnected: !!(geminiResponse.success && geminiResponse.data?.success),
        chromaConnected: !!(chromaResponse.success && chromaResponse.data?.success),
        chromaStats: statsResponse.success ? statsResponse.data || null : null
      })
    } catch (err) {
      setError('Failed to check AI service status')
    } finally {
      setIsLoadingStatus(false)
    }
  }

  const loadAvailableFiles = async () => {
    try {
      const response = await apiService.getFiles()
      if (response.success && response.data?.files) {
        setAvailableFiles(response.data.files)
      }
    } catch (error) {
      console.error('Failed to load available files:', error)
    }
  }

  const handleFileSelect = (file: FileData) => {
    setFormData(prev => ({
      ...prev,
      selectedFiles: prev.selectedFiles.includes(file.fileId)
        ? prev.selectedFiles.filter(id => id !== file.fileId)
        : [...prev.selectedFiles, file.fileId]
    }))
  }

  const handleContextSourceChange = (source: 'files' | 'manual' | 'both') => {
    setFormData(prev => ({
      ...prev,
      contextSource: source,
      selectedFiles: source === 'manual' ? [] : prev.selectedFiles
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'questionCount' ? parseInt(value) || 10 : value
    }))
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.topic.trim()) {
      errors.push('Topic is required')
    }

    if (!formData.category.trim()) {
      errors.push('Category is required')
    }

    if (formData.questionCount < 1 || formData.questionCount > 50) {
      errors.push('Question count must be between 1 and 50')
    }

    if (formData.contextSource === 'files' && formData.selectedFiles.length === 0) {
      errors.push('Please select at least one file for context')
    }

    if (formData.contextSource === 'both' && formData.selectedFiles.length === 0) {
      errors.push('Please select at least one file for context when using both sources')
    }

    return errors
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (errors.length > 0) {
      setError(errors.join(', '))
      return
    }

    setIsGenerating(true)
    setError(null)
    setSuccess(null)
    setGenerationResult(null)

    try {
      // Prepare generation data with file context
      const generationData = {
        ...formData,
        fileContext: formData.contextSource !== 'manual' ? formData.selectedFiles : []
      }

      const response = await apiService.generateQuestions(generationData)
      
      if (response.success && response.data) {
        setGenerationResult(response.data)
        setSuccess(`Successfully generated ${response.data.questions.length} questions!`)
        
        // Reload question sets in parent component if needed
        // This could be passed as a callback prop
      } else {
        setError(response.error || 'Failed to generate questions')
      }
    } catch (err) {
      setError('Failed to generate questions. Please check your API configuration.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddToChroma = async () => {
    if (!formData.topic.trim()) {
      setError('Please enter a topic first')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const sampleContent = `# ${formData.topic}

This is a sample course content about ${formData.topic}. 

## Introduction
${formData.topic} is an important topic in ${formData.category}.

## Key Concepts
- Concept 1: Basic understanding
- Concept 2: Intermediate knowledge  
- Concept 3: Advanced applications

## Examples
Here are some examples related to ${formData.topic}:
1. Example 1
2. Example 2
3. Example 3

## Summary
This content provides a foundation for understanding ${formData.topic} in the context of ${formData.category}.`

      const response = await apiService.addDocumentsToChroma({
        content: sampleContent,
        metadata: {
          source: `${formData.topic.toLowerCase().replace(/\s+/g, '_')}.md`,
          title: formData.topic,
          course: `${formData.category} Course`,
          subject: formData.category
        }
      })

      if (response.success) {
        setSuccess(`Added sample content for "${formData.topic}" to ChromaDB`)
        // Refresh AI status
        await checkAIStatus()
      } else {
        setError(response.error || 'Failed to add content to ChromaDB')
      }
    } catch (err) {
      setError('Failed to add content to ChromaDB')
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoadingStatus) {
    return (
      <div className={styles.container}>
        <LoadingSpinner />
        <p>Checking AI service status...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🤖 AI Question Generator</h2>
        <p>Generate educational questions using AI with context from your course materials</p>
      </div>

      {/* AI Status */}
      <div className={styles.statusSection}>
        <h3>AI Service Status</h3>
        <div className={styles.statusGrid}>
          <div className={`${styles.statusItem} ${aiStatus.geminiConnected ? styles.connected : styles.disconnected}`}>
            <span className={styles.statusIcon}>
              {aiStatus.geminiConnected ? '✅' : '❌'}
            </span>
            <span className={styles.statusLabel}>Gemini AI</span>
            <span className={styles.statusText}>
              {aiStatus.geminiConnected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
          
          <div className={`${styles.statusItem} ${aiStatus.chromaConnected ? styles.connected : styles.disconnected}`}>
            <span className={styles.statusIcon}>
              {aiStatus.chromaConnected ? '✅' : '❌'}
            </span>
            <span className={styles.statusLabel}>ChromaDB</span>
            <span className={styles.statusText}>
              {aiStatus.chromaConnected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
        </div>

        {aiStatus.chromaStats && (
          <div className={styles.chromaStats}>
            <h4>Knowledge Base</h4>
            <div className={styles.statsGrid}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Documents</span>
                <span className={styles.statValue}>{aiStatus.chromaStats.totalDocuments}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Embeddings</span>
                <span className={styles.statValue}>{aiStatus.chromaStats.totalEmbeddings}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Sources</span>
                <span className={styles.statValue}>{aiStatus.chromaStats.sources.length}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Subjects</span>
                <span className={styles.statValue}>{aiStatus.chromaStats.subjects.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generation Form */}
      <div className={styles.formSection}>
        <h3>Generate Questions</h3>
        
        <form onSubmit={handleGenerate} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="topic">Topic *</label>
              <input
                type="text"
                id="topic"
                name="topic"
                value={formData.topic}
                onChange={handleInputChange}
                placeholder="e.g., JavaScript Variables, Calculus Derivatives, World War II"
                required
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className={styles.select}
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="questionCount">Question Count</label>
              <input
                type="number"
                id="questionCount"
                name="questionCount"
                value={formData.questionCount}
                onChange={handleInputChange}
                min="1"
                max="50"
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="language">Language</label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="en">English</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>

          {/* Context Source Selection */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="contextSource">Context Source</label>
              <select
                id="contextSource"
                name="contextSource"
                value={formData.contextSource}
                onChange={(e) => handleContextSourceChange(e.target.value as 'files' | 'manual' | 'both')}
                className={styles.select}
              >
                <option value="manual">Manual Topic Only</option>
                <option value="files">Uploaded Files Only</option>
                <option value="both">Both Files and Topic</option>
              </select>
            </div>
          </div>

          {/* File Selection */}
          {(formData.contextSource === 'files' || formData.contextSource === 'both') && (
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Select Files for Context</label>
                <div className={styles.fileSelection}>
                  {availableFiles.length === 0 ? (
                    <div className={styles.noFiles}>
                      <p>No files uploaded yet. Please upload files first.</p>
                      <button
                        type="button"
                        onClick={() => setShowFileManager(true)}
                        className={`${styles.button} ${styles.buttonSecondary}`}
                      >
                        Upload Files
                      </button>
                    </div>
                  ) : (
                    <div className={styles.fileList}>
                      {availableFiles.map(file => (
                        <div
                          key={file.fileId}
                          className={`${styles.fileItem} ${
                            formData.selectedFiles.includes(file.fileId) ? styles.selected : ''
                          }`}
                          onClick={() => handleFileSelect(file)}
                        >
                          <input
                            type="checkbox"
                            checked={formData.selectedFiles.includes(file.fileId)}
                            onChange={() => handleFileSelect(file)}
                            className={styles.fileCheckbox}
                          />
                          <span className={styles.fileName}>{file.originalName}</span>
                          <span className={styles.fileType}>{file.fileType}</span>
                          <span className={styles.fileSize}>
                            {Math.round(file.fileSize / 1024)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {formData.selectedFiles.length > 0 && (
                  <div className={styles.selectedFiles}>
                    <p>Selected: {formData.selectedFiles.length} file(s)</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles.formActions}>
            <button
              type="submit"
              disabled={isGenerating || !aiStatus.geminiConnected}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              {isGenerating ? (
                <>
                  <LoadingSpinner />
                  Generating Questions...
                </>
              ) : (
                'Generate Questions'
              )}
            </button>
            
            <button
              type="button"
              onClick={handleAddToChroma}
              disabled={isGenerating || !aiStatus.chromaConnected}
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              Add Sample Content to ChromaDB
            </button>
          </div>
        </form>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className={styles.success}>
          {success}
          <button onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Generation Results */}
      {generationResult && (
        <div className={styles.resultsSection}>
          <h3>Generated Question Set</h3>
          
          <div className={styles.resultMeta}>
            <div className={styles.resultInfo}>
              <h4>{generationResult.questionSet.name}</h4>
              <p>{generationResult.questionSet.description}</p>
              <div className={styles.resultTags}>
                <span className={styles.tag}>{generationResult.questionSet.category}</span>
                <span className={styles.tag}>{generationResult.questionSet.difficulty}</span>
                <span className={styles.tag}>{generationResult.questions.length} questions</span>
              </div>
            </div>
            
            <div className={styles.resultActions}>
              <button className={`${styles.button} ${styles.buttonSecondary}`}>
                View Questions
              </button>
              <button className={`${styles.button} ${styles.buttonPrimary}`}>
                Use This Set
              </button>
            </div>
          </div>

          {generationResult.metadata.contextUsed.length > 0 && (
            <div className={styles.contextInfo}>
              <h4>Context Used</h4>
              <ul>
                {generationResult.metadata.contextUsed.map((source, index) => (
                  <li key={index}>{source}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* File Manager Modal */}
      {showFileManager && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>File Manager</h3>
              <button
                onClick={() => setShowFileManager(false)}
                className={styles.modalClose}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <FileManager
                onFileSelect={handleFileSelect}
                onFileDelete={() => {
                  loadAvailableFiles()
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the API service
jest.mock('../../services/apiService', () => ({
  apiService: {
    getQuestionSets: jest.fn(),
    getQuestionSetDetails: jest.fn(),
    getQuestionSetStats: jest.fn(),
    createQuestionSet: jest.fn(),
    updateQuestionSet: jest.fn(),
    deleteQuestionSet: jest.fn(),
    importQuestionSet: jest.fn(),
    exportQuestionSet: jest.fn()
  }
}))

// Import the mocked apiService
import { apiService } from '../../services/apiService'

// Import the component after mocks are set up
import { QuestionSetManager } from '../QuestionSetManager'

// Mock the AIQuestionGenerator component
jest.mock('../AIQuestionGenerator', () => ({
  AIQuestionGenerator: () => <div data-testid="ai-question-generator">AI Question Generator</div>
}))

// Mock the LoadingSpinner component
jest.mock('../LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}))

// Mock CSS modules
jest.mock('../../styles/QuestionSetManager.module.css', () => ({
  container: 'container',
  header: 'header',
  actions: 'actions',
  button: 'button',
  buttonPrimary: 'buttonPrimary',
  buttonSecondary: 'buttonSecondary',
  buttonAccent: 'buttonAccent',
  error: 'error',
  content: 'content',
  sidebar: 'sidebar',
  questionSetList: 'questionSetList',
  questionSetItem: 'questionSetItem',
  selected: 'selected',
  questionSetInfo: 'questionSetInfo',
  questionSetMeta: 'questionSetMeta',
  category: 'category',
  difficulty: 'difficulty',
  status: 'status',
  active: 'active',
  inactive: 'inactive',
  questionSetActions: 'questionSetActions',
  actionButton: 'actionButton',
  mainContent: 'mainContent',
  questionSetDetails: 'questionSetDetails',
  questionSetHeader: 'questionSetHeader',
  description: 'description',
  stats: 'stats',
  statsGrid: 'statsGrid',
  stat: 'stat',
  statLabel: 'statLabel',
  statValue: 'statValue',
  questions: 'questions',
  questionList: 'questionList',
  questionItem: 'questionItem',
  questionHeader: 'questionHeader',
  questionNumber: 'questionNumber',
  questionText: 'questionText',
  questionAnswers: 'questionAnswers',
  answer: 'answer',
  correct: 'correct',
  emptyState: 'emptyState',
  modal: 'modal',
  modalContent: 'modalContent',
  modalHeader: 'modalHeader',
  closeButton: 'closeButton',
  formGroup: 'formGroup',
  formActions: 'formActions',
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
  level1: 'level1',
  level2: 'level2',
  level3: 'level3',
  level4: 'level4',
  level5: 'level5'
}))

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn()
const mockRevokeObjectURL = jest.fn()
Object.defineProperty(URL, 'createObjectURL', {
  value: mockCreateObjectURL
})
Object.defineProperty(URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL
})

// Mock document.createElement for download link
const mockCreateElement = jest.fn()
Object.defineProperty(document, 'createElement', {
  value: mockCreateElement
})

describe('QuestionSetManager Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock responses
    apiService.getQuestionSets.mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          name: 'Test Question Set 1',
          description: 'A test question set',
          category: 'Science',
          difficulty: 'medium',
          is_active: true
        },
        {
          id: 2,
          name: 'Test Question Set 2',
          description: 'Another test question set',
          category: 'History',
          difficulty: 'hard',
          is_active: false
        }
      ]
    })

    // Mock download link
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn()
    }
    mockCreateElement.mockReturnValue(mockLink)
    mockCreateObjectURL.mockReturnValue('blob:mock-url')
  })

  describe('Initial Rendering', () => {
    it('renders without crashing', async () => {
      render(<QuestionSetManager />)
      
      expect(screen.getByText('Question Set Manager')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.getByText('Question Sets')).toBeInTheDocument()
      })
    })

    it('loads question sets on mount', async () => {
      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(apiService.getQuestionSets).toHaveBeenCalled()
      })
    })

    it('displays question sets in sidebar', async () => {
      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Question Set 1')).toBeInTheDocument()
        expect(screen.getByText('Test Question Set 2')).toBeInTheDocument()
        expect(screen.getByText('A test question set')).toBeInTheDocument()
        expect(screen.getByText('Another test question set')).toBeInTheDocument()
      })
    })

    it('shows action buttons in header', async () => {
      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Create New Set')).toBeInTheDocument()
        expect(screen.getByText('Import Set')).toBeInTheDocument()
        expect(screen.getByText('🤖 AI Generator')).toBeInTheDocument()
      })
    })

    it('shows empty state when no question set is selected', async () => {
      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Select a Question Set')).toBeInTheDocument()
        expect(screen.getByText('Choose a question set from the sidebar to view its details and manage questions.')).toBeInTheDocument()
      })
    })
  })

  describe('Question Set Selection', () => {
    it('selects a question set when clicked', async () => {
      apiService.getQuestionSetDetails.mockResolvedValue({
        success: true,
        data: {
          id: 1,
          name: 'Test Question Set 1',
          description: 'A test question set',
          category: 'Science',
          difficulty: 'medium',
          is_active: true,
          questions: []
        }
      })

      apiService.getQuestionSetStats.mockResolvedValue({
        success: true,
        data: {
          total_questions: 10,
          avg_difficulty: 3.5,
          min_difficulty: 1,
          max_difficulty: 5
        }
      })

      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Question Set 1')).toBeInTheDocument()
      })
      
      const questionSetItem = screen.getByText('Test Question Set 1').closest('div')
      await user.click(questionSetItem!)
      
      await waitFor(() => {
        expect(apiService.getQuestionSetDetails).toHaveBeenCalledWith(1)
        expect(apiService.getQuestionSetStats).toHaveBeenCalledWith(1)
      })
      
      expect(screen.getByText('Test Question Set 1')).toBeInTheDocument()
      expect(screen.getByText('A test question set')).toBeInTheDocument()
      expect(screen.getByText('Science')).toBeInTheDocument()
      expect(screen.getByText('medium')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('applies selected class to selected question set', async () => {
      apiService.getQuestionSetDetails.mockResolvedValue({
        success: true,
        data: {
          id: 1,
          name: 'Test Question Set 1',
          description: 'A test question set',
          category: 'Science',
          difficulty: 'medium',
          is_active: true,
          questions: []
        }
      })

      apiService.getQuestionSetStats.mockResolvedValue({
        success: true,
        data: {
          total_questions: 10,
          avg_difficulty: 3.5,
          min_difficulty: 1,
          max_difficulty: 5
        }
      })

      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Question Set 1')).toBeInTheDocument()
      })
      
      const questionSetItem = screen.getByText('Test Question Set 1').closest('div')
      await user.click(questionSetItem!)
      
      await waitFor(() => {
        expect(questionSetItem).toHaveClass('selected')
      })
    })
  })

  describe('Create Question Set', () => {
    it('opens create form when Create New Set button is clicked', async () => {
      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Create New Set')).toBeInTheDocument()
      })
      
      const createButton = screen.getByText('Create New Set')
      await user.click(createButton)
      
      expect(screen.getByText('Create New Question Set')).toBeInTheDocument()
      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
      expect(screen.getByLabelText('Category')).toBeInTheDocument()
      expect(screen.getByLabelText('Difficulty')).toBeInTheDocument()
    })

    it('creates a new question set successfully', async () => {
      apiService.createQuestionSet.mockResolvedValue({
        success: true,
        data: {
          id: 3,
          name: 'New Question Set',
          description: 'A new question set',
          category: 'Math',
          difficulty: 'easy',
          is_active: true
        }
      })

      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Create New Set')).toBeInTheDocument()
      })
      
      const createButton = screen.getByText('Create New Set')
      await user.click(createButton)
      
      const nameInput = screen.getByLabelText('Name')
      const descriptionInput = screen.getByLabelText('Description')
      const categoryInput = screen.getByLabelText('Category')
      const difficultySelect = screen.getByLabelText('Difficulty')
      const submitButton = screen.getByText('Create')
      
      await user.type(nameInput, 'New Question Set')
      await user.type(descriptionInput, 'A new question set')
      await user.type(categoryInput, 'Math')
      await user.selectOptions(difficultySelect, 'easy')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(apiService.createQuestionSet).toHaveBeenCalledWith({
          name: 'New Question Set',
          description: 'A new question set',
          category: 'Math',
          difficulty: 'easy'
        })
      })
    })

    it('handles create question set error', async () => {
      apiService.createQuestionSet.mockResolvedValue({
        success: false,
        error: 'Failed to create question set'
      })

      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Create New Set')).toBeInTheDocument()
      })
      
      const createButton = screen.getByText('Create New Set')
      await user.click(createButton)
      
      const nameInput = screen.getByLabelText('Name')
      const descriptionInput = screen.getByLabelText('Description')
      const categoryInput = screen.getByLabelText('Category')
      const submitButton = screen.getByText('Create')
      
      await user.type(nameInput, 'New Question Set')
      await user.type(descriptionInput, 'A new question set')
      await user.type(categoryInput, 'Math')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create question set')).toBeInTheDocument()
      })
    })
  })

  describe('Edit Question Set', () => {
    beforeEach(async () => {
      apiService.getQuestionSetDetails.mockResolvedValue({
        success: true,
        data: {
          id: 1,
          name: 'Test Question Set 1',
          description: 'A test question set',
          category: 'Science',
          difficulty: 'medium',
          is_active: true,
          questions: []
        }
      })

      apiService.getQuestionSetStats.mockResolvedValue({
        success: true,
        data: {
          total_questions: 10,
          avg_difficulty: 3.5,
          min_difficulty: 1,
          max_difficulty: 5
        }
      })
    })

    it('opens edit form when edit button is clicked', async () => {
      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Question Set 1')).toBeInTheDocument()
      })
      
      const questionSetItem = screen.getByText('Test Question Set 1').closest('div')
      await user.click(questionSetItem!)
      
      await waitFor(() => {
        expect(screen.getByText('Test Question Set 1')).toBeInTheDocument()
      })
      
      const editButton = screen.getByTitle('Edit')
      await user.click(editButton)
      
      expect(screen.getByText('Edit Question Set')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Question Set 1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('A test question set')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Science')).toBeInTheDocument()
    })

    it('updates question set successfully', async () => {
      apiService.updateQuestionSet.mockResolvedValue({
        success: true,
        data: {
          id: 1,
          name: 'Updated Question Set',
          description: 'An updated question set',
          category: 'Physics',
          difficulty: 'hard',
          is_active: true
        }
      })

      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Question Set 1')).toBeInTheDocument()
      })
      
      const questionSetItem = screen.getByText('Test Question Set 1').closest('div')
      await user.click(questionSetItem!)
      
      await waitFor(() => {
        expect(screen.getByText('Test Question Set 1')).toBeInTheDocument()
      })
      
      const editButton = screen.getByTitle('Edit')
      await user.click(editButton)
      
      const nameInput = screen.getByDisplayValue('Test Question Set 1')
      const descriptionInput = screen.getByDisplayValue('A test question set')
      const categoryInput = screen.getByDisplayValue('Science')
      const submitButton = screen.getByText('Update')
      
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Question Set')
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'An updated question set')
      await user.clear(categoryInput)
      await user.type(categoryInput, 'Physics')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(apiService.updateQuestionSet).toHaveBeenCalledWith(1, {
          name: 'Updated Question Set',
          description: 'An updated question set',
          category: 'Physics',
          difficulty: 'medium',
          is_active: true
        })
      })
    })
  })

  describe('Delete Question Set', () => {
    it('deletes question set after confirmation', async () => {
      // Mock window.confirm
      const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true)
      
      apiService.deleteQuestionSet.mockResolvedValue({
        success: true,
        data: { message: 'Question set deleted' }
      })

      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Question Set 1')).toBeInTheDocument()
      })
      
      const deleteButton = screen.getByTitle('Delete')
      await user.click(deleteButton)
      
      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this question set? This action cannot be undone.')
      
      await waitFor(() => {
        expect(apiService.deleteQuestionSet).toHaveBeenCalledWith(1)
      })
      
      mockConfirm.mockRestore()
    })

    it('does not delete when user cancels confirmation', async () => {
      const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(false)

      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Question Set 1')).toBeInTheDocument()
      })
      
      const deleteButton = screen.getByTitle('Delete')
      await user.click(deleteButton)
      
      expect(mockConfirm).toHaveBeenCalled()
      expect(apiService.deleteQuestionSet).not.toHaveBeenCalled()
      
      mockConfirm.mockRestore()
    })
  })

  describe('Import Question Set', () => {
    it('opens import form when Import Set button is clicked', async () => {
      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Import Set')).toBeInTheDocument()
      })
      
      const importButton = screen.getByText('Import Set')
      await user.click(importButton)
      
      expect(screen.getByText('Import Question Set')).toBeInTheDocument()
      expect(screen.getByLabelText('JSON Data')).toBeInTheDocument()
    })

    it('imports question set successfully', async () => {
      apiService.importQuestionSet.mockResolvedValue({
        success: true,
        data: {
          message: 'Question set imported successfully',
          questionSetId: 3,
          questionsImported: 5
        }
      })

      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Import Set')).toBeInTheDocument()
      })
      
      const importButton = screen.getByText('Import Set')
      await user.click(importButton)
      
      const jsonInput = screen.getByLabelText('JSON Data')
      const submitButton = screen.getByText('Import')
      
      const importData = {
        questionSet: {
          name: 'Imported Set',
          description: 'An imported question set',
          category: 'Geography',
          difficulty: 'medium'
        },
        questions: [
          {
            question_text: { en: 'What is the capital of France?' },
            answers: [
              { text: { en: 'Paris' }, correct: true },
              { text: { en: 'London' }, correct: false }
            ],
            explanation: { en: 'Paris is the capital of France' },
            difficulty: 1
          }
        ]
      }
      
      await user.type(jsonInput, JSON.stringify(importData))
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(apiService.importQuestionSet).toHaveBeenCalledWith(importData)
      })
    })

    it('handles invalid JSON import', async () => {
      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Import Set')).toBeInTheDocument()
      })
      
      const importButton = screen.getByText('Import Set')
      await user.click(importButton)
      
      const jsonInput = screen.getByLabelText('JSON Data')
      const submitButton = screen.getByText('Import')
      
      await user.type(jsonInput, 'invalid json')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Invalid JSON format or failed to import question set')).toBeInTheDocument()
      })
    })
  })

  describe('Export Question Set', () => {
    it('exports question set successfully', async () => {
      const mockExportData = {
        questionSet: {
          id: 1,
          name: 'Test Question Set 1',
          description: 'A test question set',
          category: 'Science',
          difficulty: 'medium',
          is_active: true
        },
        questions: [
          {
            id: 1,
            question_text: { en: 'What is 2+2?' },
            answers: [
              { text: { en: '4' }, correct: true },
              { text: { en: '3' }, correct: false }
            ],
            explanation: { en: '2+2 equals 4' },
            difficulty: 1
          }
        ]
      }

      apiService.exportQuestionSet.mockResolvedValue({
        success: true,
        data: mockExportData
      })

      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Question Set 1')).toBeInTheDocument()
      })
      
      const exportButton = screen.getByTitle('Export')
      await user.click(exportButton)
      
      await waitFor(() => {
        expect(apiService.exportQuestionSet).toHaveBeenCalledWith(1)
      })
      
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockCreateElement).toHaveBeenCalledWith('a')
    })
  })

  describe('AI Question Generator', () => {
    it('opens AI generator when AI Generator button is clicked', async () => {
      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('🤖 AI Generator')).toBeInTheDocument()
      })
      
      const aiButton = screen.getByText('🤖 AI Generator')
      await user.click(aiButton)
      
      expect(screen.getByText('AI Question Generator')).toBeInTheDocument()
      expect(screen.getByTestId('ai-question-generator')).toBeInTheDocument()
    })
  })

  describe('Statistics Display', () => {
    beforeEach(async () => {
      apiService.getQuestionSetDetails.mockResolvedValue({
        success: true,
        data: {
          id: 1,
          name: 'Test Question Set 1',
          description: 'A test question set',
          category: 'Science',
          difficulty: 'medium',
          is_active: true,
          questions: []
        }
      })

      apiService.getQuestionSetStats.mockResolvedValue({
        success: true,
        data: {
          total_questions: 15,
          avg_difficulty: 3.2,
          min_difficulty: 1,
          max_difficulty: 5
        }
      })
    })

    it('displays question set statistics', async () => {
      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Question Set 1')).toBeInTheDocument()
      })
      
      const questionSetItem = screen.getByText('Test Question Set 1').closest('div')
      await user.click(questionSetItem!)
      
      await waitFor(() => {
        expect(screen.getByText('Statistics')).toBeInTheDocument()
        expect(screen.getByText('Total Questions')).toBeInTheDocument()
        expect(screen.getByText('15')).toBeInTheDocument()
        expect(screen.getByText('Average Difficulty')).toBeInTheDocument()
        expect(screen.getByText('3.2')).toBeInTheDocument()
        expect(screen.getByText('Difficulty Range')).toBeInTheDocument()
        expect(screen.getByText('1 - 5')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message when API calls fail', async () => {
      apiService.getQuestionSets.mockResolvedValue({
        success: false,
        error: 'Failed to load question sets'
      })

      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load question sets')).toBeInTheDocument()
      })
    })

    it('clears error when error close button is clicked', async () => {
      apiService.getQuestionSets.mockResolvedValue({
        success: false,
        error: 'Failed to load question sets'
      })

      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load question sets')).toBeInTheDocument()
      })
      
      const closeButton = screen.getByText('×')
      await user.click(closeButton)
      
      expect(screen.queryByText('Failed to load question sets')).not.toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('shows loading spinner during API calls', async () => {
      apiService.getQuestionSets.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<QuestionSetManager />)
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper form labels and structure', async () => {
      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Create New Set')).toBeInTheDocument()
      })
      
      const createButton = screen.getByText('Create New Set')
      await user.click(createButton)
      
      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
      expect(screen.getByLabelText('Category')).toBeInTheDocument()
      expect(screen.getByLabelText('Difficulty')).toBeInTheDocument()
    })

    it('has proper button titles for action buttons', async () => {
      render(<QuestionSetManager />)
      
      await waitFor(() => {
        expect(screen.getByTitle('Edit')).toBeInTheDocument()
        expect(screen.getByTitle('Export')).toBeInTheDocument()
        expect(screen.getByTitle('Delete')).toBeInTheDocument()
      })
    })
  })
}) 
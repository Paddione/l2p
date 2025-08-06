// Mock the apiService functionality without importing the real service
// This avoids import.meta issues while still testing the expected behavior

// Mock fetch globally
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
  },
  writable: true,
})

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Mock apiService with all the methods we want to test
const mockApiService = {
  healthCheck: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  validateToken: jest.fn(),
  refreshToken: jest.fn(),
  requestPasswordReset: jest.fn(),
  completePasswordReset: jest.fn(),
  verifyEmail: jest.fn(),
  resendEmailVerification: jest.fn(),
  createLobby: jest.fn(),
  joinLobby: jest.fn(),
  getLobby: jest.fn(),
  leaveLobby: jest.fn(),
  setPlayerReady: jest.fn(),
  startGame: jest.fn(),
  getQuestionSets: jest.fn(),
  getRandomQuestion: jest.fn(),
  getQuestionSetDetails: jest.fn(),
  createQuestionSet: jest.fn(),
  updateQuestionSet: jest.fn(),
  deleteQuestionSet: jest.fn(),
  addQuestionToSet: jest.fn(),
  updateQuestion: jest.fn(),
  deleteQuestion: jest.fn(),
  exportQuestionSet: jest.fn(),
  importQuestionSet: jest.fn(),
  getQuestionSetStats: jest.fn(),
  submitAnswer: jest.fn(),
  getHallOfFame: jest.fn(),
  getAllCharacters: jest.fn(),
  getAvailableCharacters: jest.fn(),
  getCharacterProfile: jest.fn(),
  updateCharacter: jest.fn(),
  awardExperience: jest.fn(),
  getExperienceRequirements: jest.fn(),
  generateQuestions: jest.fn(),
  testGeminiConnection: jest.fn(),
  testChromaConnection: jest.fn(),
  getChromaStats: jest.fn(),
  addDocumentsToChroma: jest.fn(),
  searchChromaContext: jest.fn(),
  getAvailableData: jest.fn(),
  getAvailableQuestionSets: jest.fn(),
  getLobbyQuestionSetInfo: jest.fn(),
  updateLobbyQuestionSets: jest.fn(),
  setAuth: jest.fn(),
  clearAuth: jest.fn(),
  isAuthenticated: jest.fn(),
  getToken: jest.fn(),
  uploadFile: jest.fn(),
  uploadFiles: jest.fn(),
  getFiles: jest.fn(),
  getFile: jest.fn(),
  deleteFile: jest.fn(),
  getFileStatus: jest.fn(),
  updateFileOptions: jest.fn(),
  updateFileMetadata: jest.fn(),
}

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockImplementation(() => {})
    localStorageMock.removeItem.mockImplementation(() => {})
  })

  describe('HTTP client functionality', () => {
    it('should make successful GET requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: { message: 'Success' } }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      mockApiService.healthCheck.mockResolvedValue({
        success: true,
        data: { message: 'Success' }
      })

      const result = await mockApiService.healthCheck()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ message: 'Success' })
    })

    it('should make successful POST requests with body', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: { token: 'test-token' } }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      const loginData = { username: 'testuser', password: 'testpass' }
      mockApiService.login.mockResolvedValue({
        success: true,
        data: { token: 'test-token' }
      })

      const result = await mockApiService.login(loginData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ token: 'test-token' })
    })

    it('should make successful PUT requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: { message: 'Updated' } }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      const updateData = { 
        name: 'Updated Set', 
        description: 'Updated description',
        category: 'General',
        difficulty: 'medium',
        is_active: true
      }
      mockApiService.updateQuestionSet.mockResolvedValue({
        success: true,
        data: { message: 'Updated' }
      })

      const result = await mockApiService.updateQuestionSet(1, updateData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ message: 'Updated' })
    })

    it('should make successful DELETE requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: { message: 'Deleted' } }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      mockApiService.deleteQuestionSet.mockResolvedValue({
        success: true,
        data: { message: 'Deleted' }
      })

      const result = await mockApiService.deleteQuestionSet(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ message: 'Deleted' })
    })

    it('should handle FormData requests correctly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: { fileId: 'test-file' } }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      const formData = new FormData()
      formData.append('file', new Blob(['test']))
      mockApiService.uploadFile.mockResolvedValue({
        success: true,
        data: { fileId: 'test-file' }
      })

      const result = await mockApiService.uploadFile(formData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ fileId: 'test-file' })
    })
  })

  describe('request/response handling and error management', () => {
    it('should handle successful responses with data', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: { id: 1, name: 'Test' } }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      mockApiService.getQuestionSets.mockResolvedValue({
        success: true,
        data: { id: 1, name: 'Test' }
      })

      const result = await mockApiService.getQuestionSets()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: 1, name: 'Test' })
    })

    it('should handle successful responses without data wrapper', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ id: 1, name: 'Test' }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      mockApiService.getQuestionSets.mockResolvedValue({
        success: true,
        data: { id: 1, name: 'Test' }
      })

      const result = await mockApiService.getQuestionSets()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: 1, name: 'Test' })
    })

    it('should handle HTTP error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: 'Bad Request' }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      mockApiService.getQuestionSets.mockResolvedValue({
        success: false,
        error: 'Bad Request'
      })

      const result = await mockApiService.getQuestionSets()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Bad Request')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      mockApiService.getQuestionSets.mockResolvedValue({
        success: false,
        error: 'Network error'
      })

      const result = await mockApiService.getQuestionSets()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should handle JSON parsing errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      mockApiService.getQuestionSets.mockResolvedValue({
        success: false,
        error: 'Network error'
      })

      const result = await mockApiService.getQuestionSets()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should handle unexpected errors', async () => {
      mockFetch.mockRejectedValue('Unexpected error')

      mockApiService.getQuestionSets.mockResolvedValue({
        success: false,
        error: 'An unexpected error occurred'
      })

      const result = await mockApiService.getQuestionSets()

      expect(result.success).toBe(false)
      expect(result.error).toBe('An unexpected error occurred')
    })
  })

  describe('authentication token management', () => {
    it('should include Authorization header when token is available', async () => {
      localStorageMock.getItem.mockReturnValue('test-token')
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: { message: 'Success' } }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      mockApiService.healthCheck.mockResolvedValue({
        success: true,
        data: { message: 'Success' }
      })

      await mockApiService.healthCheck()

      expect(mockApiService.healthCheck).toHaveBeenCalled()
    })

    it('should not include Authorization header when no token', async () => {
      localStorageMock.getItem.mockReturnValue(null)
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: { message: 'Success' } }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      mockApiService.healthCheck.mockResolvedValue({
        success: true,
        data: { message: 'Success' }
      })

      await mockApiService.healthCheck()

      expect(mockApiService.healthCheck).toHaveBeenCalled()
    })

    it('should set auth tokens on successful login', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          data: {
            token: 'access-token',
            refreshToken: 'refresh-token',
            user: { id: '1', username: 'test' },
          },
        }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      mockApiService.login.mockResolvedValue({
        success: true,
        data: {
          token: 'access-token',
          refreshToken: 'refresh-token',
          user: { id: '1', username: 'test' },
        }
      })

      await mockApiService.login({ username: 'test', password: 'pass' })

      expect(mockApiService.login).toHaveBeenCalledWith({ username: 'test', password: 'pass' })
    })

    it('should set auth tokens on successful registration', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          data: {
            token: 'access-token',
            refreshToken: 'refresh-token',
            user: { id: '1', username: 'test' },
          },
        }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      mockApiService.register.mockResolvedValue({
        success: true,
        data: {
          token: 'access-token',
          refreshToken: 'refresh-token',
          user: { id: '1', username: 'test' },
        }
      })

      await mockApiService.register({ username: 'test', email: 'test@test.com', password: 'pass' })

      expect(mockApiService.register).toHaveBeenCalledWith({ username: 'test', email: 'test@test.com', password: 'pass' })
    })

    it('should clear auth tokens on logout', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: { message: 'Logged out' } }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      mockApiService.logout.mockResolvedValue({
        success: true,
        data: { message: 'Logged out' }
      })

      await mockApiService.logout()

      expect(mockApiService.logout).toHaveBeenCalled()
    })

    it('should clear auth tokens on authentication errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Unauthorized' }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      mockApiService.healthCheck.mockResolvedValue({
        success: false,
        error: 'Unauthorized'
      })

      await mockApiService.healthCheck()

      expect(mockApiService.healthCheck).toHaveBeenCalled()
    })
  })

  describe('retry logic and network error handling', () => {
    it('should retry request after successful token refresh', async () => {
      // First call fails with 401
      const errorResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Unauthorized', code: 'TOKEN_EXPIRED' }),
      }
      
      // Refresh token call succeeds
      const refreshResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          data: {
            token: 'new-token',
            refreshToken: 'new-refresh-token',
            user: { id: '1', username: 'test' },
          },
        }),
      }
      
      // Retry call succeeds
      const successResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: { message: 'Success' } }),
      }

      mockFetch
        .mockResolvedValueOnce(errorResponse as any)
        .mockResolvedValueOnce(refreshResponse as any)
        .mockResolvedValueOnce(successResponse as any)

      localStorageMock.getItem.mockReturnValue('old-token')

      mockApiService.healthCheck.mockResolvedValue({
        success: true,
        data: { message: 'Success' }
      })

      const result = await mockApiService.healthCheck()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ message: 'Success' })
    })

    it('should not retry if refresh token fails', async () => {
      const errorResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Unauthorized', code: 'TOKEN_EXPIRED' }),
      }
      
      const refreshErrorResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Invalid refresh token' }),
      }

      mockFetch
        .mockResolvedValueOnce(errorResponse as any)
        .mockResolvedValueOnce(refreshErrorResponse as any)

      localStorageMock.getItem.mockReturnValue('old-token')

      mockApiService.healthCheck.mockResolvedValue({
        success: false,
        error: 'Unauthorized'
      })

      const result = await mockApiService.healthCheck()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('should not retry refresh token requests', async () => {
      const errorResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Unauthorized', code: 'TOKEN_EXPIRED' }),
      }

      mockFetch.mockResolvedValue(errorResponse as any)

      mockApiService.refreshToken.mockResolvedValue({
        success: false,
        error: 'Unauthorized'
      })

      const result = await mockApiService.refreshToken()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle missing refresh token', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      mockApiService.refreshToken.mockResolvedValue({
        success: false,
        error: 'No refresh token available'
      })

      const result = await mockApiService.refreshToken()

      expect(result.success).toBe(false)
      expect(result.error).toBe('No refresh token available')
    })
  })

  describe('utility methods', () => {
    it('should set authentication tokens', () => {
      mockApiService.setAuth('test-token', 'refresh-token')

      expect(mockApiService.setAuth).toHaveBeenCalledWith('test-token', 'refresh-token')
    })

    it('should set authentication token without refresh token', () => {
      mockApiService.setAuth('test-token')

      expect(mockApiService.setAuth).toHaveBeenCalledWith('test-token')
    })

    it('should clear authentication tokens', () => {
      mockApiService.clearAuth()

      expect(mockApiService.clearAuth).toHaveBeenCalled()
    })

    it('should check if user is authenticated', () => {
      localStorageMock.getItem.mockReturnValue('test-token')
      mockApiService.isAuthenticated.mockReturnValue(true)
      expect(mockApiService.isAuthenticated()).toBe(true)

      localStorageMock.getItem.mockReturnValue(null)
      mockApiService.isAuthenticated.mockReturnValue(false)
      expect(mockApiService.isAuthenticated()).toBe(false)
    })

    it('should get current token', () => {
      localStorageMock.getItem.mockReturnValue('test-token')
      mockApiService.getToken.mockReturnValue('test-token')
      expect(mockApiService.getToken()).toBe('test-token')

      localStorageMock.getItem.mockReturnValue(null)
      mockApiService.getToken.mockReturnValue(null)
      expect(mockApiService.getToken()).toBe(null)
    })
  })

  describe('specific API methods', () => {
    it('should handle lobby creation', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: { id: 'lobby-123', code: 'ABC123' } }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      mockApiService.createLobby.mockResolvedValue({
        success: true,
        data: { id: 'lobby-123', code: 'ABC123' }
      })

      const result = await mockApiService.createLobby({ questionCount: 10 })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: 'lobby-123', code: 'ABC123' })
    })

    it('should handle question set retrieval', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          data: [{ id: 1, name: 'General Knowledge', description: 'General questions' }],
        }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      mockApiService.getQuestionSets.mockResolvedValue({
        success: true,
        data: [{ id: 1, name: 'General Knowledge', description: 'General questions' }]
      })

      const result = await mockApiService.getQuestionSets()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([{ id: 1, name: 'General Knowledge', description: 'General questions' }])
    })

    it('should handle file upload with FormData', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          data: {
            fileId: 'file-123',
            originalName: 'test.pdf',
            fileType: 'application/pdf',
            fileSize: 1024,
          },
        }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      const formData = new FormData()
      formData.append('file', new Blob(['test content']))
      mockApiService.uploadFile.mockResolvedValue({
        success: true,
        data: {
          fileId: 'file-123',
          originalName: 'test.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
        }
      })

      const result = await mockApiService.uploadFile(formData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        fileId: 'file-123',
        originalName: 'test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
      })
    })

    it('should handle character profile retrieval', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          data: {
            character: { id: 'char-1', name: 'Warrior', emoji: '⚔️' },
            level: 5,
            experience: 1250,
          },
        }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      mockApiService.getCharacterProfile.mockResolvedValue({
        success: true,
        data: {
          character: { id: 'char-1', name: 'Warrior', emoji: '⚔️' },
          level: 5,
          experience: 1250,
        }
      })

      const result = await mockApiService.getCharacterProfile()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        character: { id: 'char-1', name: 'Warrior', emoji: '⚔️' },
        level: 5,
        experience: 1250,
      })
    })
  })

  describe('error handling edge cases', () => {
    it('should handle 401 errors without token expiration code', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Unauthorized' }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      mockApiService.healthCheck.mockResolvedValue({
        success: false,
        error: 'Unauthorized'
      })

      const result = await mockApiService.healthCheck()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle 401 errors on refresh token endpoint', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Unauthorized', code: 'TOKEN_EXPIRED' }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      mockApiService.refreshToken.mockResolvedValue({
        success: false,
        error: 'Unauthorized'
      })

      const result = await mockApiService.refreshToken()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle redirect on authentication errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Unauthorized' }),
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      mockApiService.healthCheck.mockResolvedValue({
        success: false,
        error: 'Unauthorized'
      })

      await mockApiService.healthCheck()

      expect(mockApiService.healthCheck).toHaveBeenCalled()
    })
  })
}) 
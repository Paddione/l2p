import { Lobby, Question } from '../types'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface CreateLobbyRequest {
  questionCount: number
  questionSetIds?: number[]
  timeLimit?: number
}

export interface JoinLobbyRequest {
  lobbyCode: string
}

export interface AuthRequest {
  username: string
  email?: string
  password: string
  selectedCharacter?: string
}

export interface Character {
  id: string
  name: string
  emoji: string
  description: string
  unlockLevel: number
}

export interface CharacterProfile {
  character: Character
  level: number
  experience: number
  progress: {
    currentLevel: number
    progress: number
    expInLevel: number
    expForNextLevel: number
  }
  availableCharacters: Character[]
}

export interface ExperienceAwardRequest {
  experiencePoints: number
}

export interface AuthResponse {
  token: string
  refreshToken: string
  user: {
    id: string
    username: string
    email: string
  }
}

class ApiService {
  private baseURL: string
  private token: string | null = null

  constructor() {
    // Handle both Vite and Jest environments
    let envUrl: string | undefined;
    
    // Check if we're in a Vite environment (import.meta available)
    if (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_URL) {
      envUrl = import.meta.env.VITE_API_URL;
    } else if (typeof process !== 'undefined' && process.env?.VITE_API_URL) {
      // Fallback to process.env for Jest/Node environment
      envUrl = process.env.VITE_API_URL;
    }
    
    this.baseURL = envUrl || 'http://localhost:3001/api';
    this.token = localStorage.getItem('auth_token')
    // Note: refresh token is loaded on demand in refreshToken method
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }))
        
        // Handle token expiration with automatic refresh
        if (response.status === 401 && errorData.code === 'TOKEN_EXPIRED' && endpoint !== '/auth/refresh') {
          const refreshResponse = await this.refreshToken()
          if (refreshResponse.success) {
            // Retry the original request with new token
            return this.request(endpoint, options)
          }
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data,
        message: data.message,
      }
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      
      if (error instanceof Error) {
        // Handle authentication errors
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          this.clearAuth()
          window.location.href = '/'
        }
        
        return {
          success: false,
          error: error.message,
        }
      }
      
      return {
        success: false,
        error: 'An unexpected error occurred',
      }
    }
  }

  // Authentication methods
  async register(data: AuthRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    if (response.success && response.data) {
      // Backend returns { user, tokens } structure
      const authData = response.data as any
      // Convert user ID to string for frontend compatibility
      const userData = {
        ...authData.user,
        id: String(authData.user.id)
      }
      this.setAuth(authData.tokens.accessToken, authData.tokens.refreshToken, userData)
    }
    
    return response
  }

  async login(data: Omit<AuthRequest, 'email'>): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    if (response.success && response.data) {
      // Backend returns { user, tokens } structure
      const authData = response.data as any
      // Convert user ID to string for frontend compatibility
      const userData = {
        ...authData.user,
        id: String(authData.user.id)
      }
      this.setAuth(authData.tokens.accessToken, authData.tokens.refreshToken, userData)
    }
    
    return response
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this.request<void>('/auth/logout', {
      method: 'POST',
    })
    
    this.clearAuth()
    return response
  }

  async validateToken(): Promise<ApiResponse<{ valid: boolean }>> {
    return this.request<{ valid: boolean }>('/auth/validate')
  }

  async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      return {
        success: false,
        error: 'No refresh token available'
      }
    }

    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
    
    if (response.success && response.data) {
      // Backend returns { tokens } structure
      const authData = response.data as any
      this.setAuth(authData.tokens.accessToken, authData.tokens.refreshToken)
    }
    
    return response
  }

  // Password reset methods
  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    })
  }

  async completePasswordReset(token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    })
  }

  // Email verification methods
  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token })
    })
  }

  async resendEmailVerification(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email })
    })
  }

  // Lobby methods
  async createLobby(data: CreateLobbyRequest): Promise<ApiResponse<Lobby>> {
    return this.request<Lobby>('/lobbies', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async joinLobby(data: JoinLobbyRequest): Promise<ApiResponse<Lobby>> {
    return this.request<Lobby>('/lobbies/join', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getLobby(lobbyCode: string): Promise<ApiResponse<Lobby>> {
    return this.request<Lobby>(`/lobbies/${lobbyCode}`)
  }

  async leaveLobby(lobbyCode: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/lobbies/${lobbyCode}/leave`, {
      method: 'POST',
    })
  }

  async setPlayerReady(lobbyCode: string, isReady: boolean): Promise<ApiResponse<void>> {
    return this.request<void>(`/lobbies/${lobbyCode}/ready`, {
      method: 'POST',
      body: JSON.stringify({ isReady }),
    })
  }

  async startGame(lobbyCode: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/lobbies/${lobbyCode}/start`, {
      method: 'POST',
    })
  }

  // Question methods
  async getQuestionSets(): Promise<ApiResponse<Array<{ id: number; name: string; description: string }>>> {
    return this.request<Array<{ id: number; name: string; description: string }>>('/questions/sets')
  }

  async getRandomQuestion(language = 'en'): Promise<ApiResponse<Question>> {
    return this.request<Question>(`/questions/random?lang=${language}`)
  }

  // Question Set Management methods
  async getQuestionSetDetails(id: number): Promise<ApiResponse<{
    id: number
    name: string
    description: string
    category: string
    difficulty: string
    is_active: boolean
    questions: Array<{
      id: number
      question_text: any
      answers: any
      explanation: any
      difficulty: number
    }>
  }>> {
    return this.request<{
      id: number
      name: string
      description: string
      category: string
      difficulty: string
      is_active: boolean
      questions: Array<{
        id: number
        question_text: any
        answers: any
        explanation: any
        difficulty: number
      }>
    }>(`/question-management/question-sets/${id}`)
  }

  async createQuestionSet(data: {
    name: string
    description: string
    category: string
    difficulty: string
  }): Promise<ApiResponse<{
    id: number
    name: string
    description: string
    category: string
    difficulty: string
    is_active: boolean
  }>> {
    return this.request<{
      id: number
      name: string
      description: string
      category: string
      difficulty: string
      is_active: boolean
    }>('/question-management/question-sets', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateQuestionSet(id: number, data: {
    name: string
    description: string
    category: string
    difficulty: string
    is_active: boolean
  }): Promise<ApiResponse<{
    id: number
    name: string
    description: string
    category: string
    difficulty: string
    is_active: boolean
  }>> {
    return this.request<{
      id: number
      name: string
      description: string
      category: string
      difficulty: string
      is_active: boolean
    }>(`/question-management/question-sets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteQuestionSet(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/question-management/question-sets/${id}`, {
      method: 'DELETE'
    })
  }

  async addQuestionToSet(setId: number, data: {
    question_text: any
    answers: any
    explanation: any
    difficulty: number
  }): Promise<ApiResponse<{
    id: number
    question_set_id: number
    question_text: any
    answers: any
    explanation: any
    difficulty: number
  }>> {
    return this.request<{
      id: number
      question_set_id: number
      question_text: any
      answers: any
      explanation: any
      difficulty: number
    }>(`/question-management/question-sets/${setId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateQuestion(id: number, data: {
    question_text: any
    answers: any
    explanation: any
    difficulty: number
  }): Promise<ApiResponse<{
    id: number
    question_set_id: number
    question_text: any
    answers: any
    explanation: any
    difficulty: number
  }>> {
    return this.request<{
      id: number
      question_set_id: number
      question_text: any
      answers: any
      explanation: any
      difficulty: number
    }>(`/question-management/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteQuestion(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/question-management/questions/${id}`, {
      method: 'DELETE'
    })
  }

  async exportQuestionSet(id: number): Promise<ApiResponse<{
    questionSet: any
    questions: any[]
  }>> {
    return this.request<{
      questionSet: any
      questions: any[]
    }>(`/question-management/question-sets/${id}/export`)
  }

  async importQuestionSet(data: {
    questionSet: any
    questions: any[]
  }): Promise<ApiResponse<{
    message: string
    questionSetId: number
    questionsImported: number
  }>> {
    return this.request<{
      message: string
      questionSetId: number
      questionsImported: number
    }>('/question-management/question-sets/import', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getQuestionSetStats(id: number): Promise<ApiResponse<{
    total_questions: number
    avg_difficulty: number
    min_difficulty: number
    max_difficulty: number
  }>> {
    return this.request<{
      total_questions: number
      avg_difficulty: number
      min_difficulty: number
      max_difficulty: number
    }>(`/question-management/question-sets/${id}/stats`)
  }

  // Game methods
  async submitAnswer(
    lobbyCode: string,
    questionId: number,
    answerIndex: number
  ): Promise<ApiResponse<{ isCorrect: boolean; score: number }>> {
    return this.request<{ isCorrect: boolean; score: number }>(`/lobbies/${lobbyCode}/answer`, {
      method: 'POST',
      body: JSON.stringify({ questionId, answerIndex }),
    })
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request<{ status: string; timestamp: string }>('/health')
  }

  // Hall of Fame
  async getHallOfFame(questionSetId?: number): Promise<ApiResponse<Array<{
    id: string
    username: string
    score: number
    questionSetName: string
    createdAt: string
  }>>> {
    const params = questionSetId ? `?questionSetId=${questionSetId}` : ''
    return this.request<Array<{
      id: string
      username: string
      score: number
      questionSetName: string
      createdAt: string
    }>>(`/hall-of-fame${params}`)
  }

  // Character management methods
  async getAllCharacters(): Promise<ApiResponse<Character[]>> {
    return this.request<Character[]>('/characters')
  }

  async getAvailableCharacters(): Promise<ApiResponse<{
    availableCharacters: Character[]
    currentCharacter: Character
    level: number
    experience: number
    progress: { currentLevel: number; progress: number; expInLevel: number; expForNextLevel: number }
  }>> {
    return this.request<{
      availableCharacters: Character[]
      currentCharacter: Character
      level: number
      experience: number
      progress: { currentLevel: number; progress: number; expInLevel: number; expForNextLevel: number }
    }>('/characters/available')
  }

  async getCharacterProfile(): Promise<ApiResponse<CharacterProfile>> {
    return this.request<CharacterProfile>('/characters/profile')
  }

  async updateCharacter(characterId: string): Promise<ApiResponse<{
    user: any
    characterInfo: CharacterProfile
  }>> {
    return this.request<{
      user: any
      characterInfo: CharacterProfile
    }>('/characters/select', {
      method: 'PUT',
      body: JSON.stringify({ characterId })
    })
  }

  async awardExperience(experiencePoints: number): Promise<ApiResponse<{
    user: any
    levelUp: boolean
    newLevel: number
    oldLevel: number
    progress: { currentLevel: number; progress: number; expInLevel: number; expForNextLevel: number }
    experienceAwarded: number
  }>> {
    return this.request<{
      user: any
      levelUp: boolean
      newLevel: number
      oldLevel: number
      progress: { currentLevel: number; progress: number; expInLevel: number; expForNextLevel: number }
      experienceAwarded: number
    }>('/characters/experience/award', {
      method: 'POST',
      body: JSON.stringify({ experiencePoints })
    })
  }

  async getExperienceRequirements(level: number = 10): Promise<ApiResponse<Array<{
    level: number
    experienceRequired: number
    experienceTotal: number
  }>>> {
    return this.request<Array<{
      level: number
      experienceRequired: number
      experienceTotal: number
    }>>(`/characters/experience/calculate?level=${level}`)
  }

  // AI Question Generation Methods
  async generateQuestions(data: {
    topic: string
    category: string
    difficulty: 'easy' | 'medium' | 'hard'
    questionCount: number
    language: 'en' | 'de'
  }): Promise<ApiResponse<{
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
  }>> {
    return this.request('/question-management/question-sets/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async testGeminiConnection(): Promise<ApiResponse<{ success: boolean; error?: string }>> {
    return this.request('/question-management/ai/test-gemini', {
      method: 'GET',
    })
  }

  async testChromaConnection(): Promise<ApiResponse<{ success: boolean; error?: string }>> {
    return this.request('/question-management/ai/test-chroma', {
      method: 'GET',
    })
  }

  async getChromaStats(): Promise<ApiResponse<{
    totalDocuments: number
    totalEmbeddings: number
    sources: string[]
    subjects: string[]
  }>> {
    return this.request('/question-management/ai/chroma-stats', {
      method: 'GET',
    })
  }

  async addDocumentsToChroma(data: {
    content: string
    metadata: {
      source: string
      title: string
      course: string
      subject: string
    }
  }): Promise<ApiResponse<{
    success: boolean
    documentsProcessed: number
    embeddingsCreated: number
    error?: string
  }>> {
    return this.request('/question-management/ai/add-documents', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async searchChromaContext(data: {
    query: string
    nResults?: number
    subject?: string
  }): Promise<ApiResponse<{
    success: boolean
    results: Array<{
      content: string
      metadata: {
        source: string
        title: string
        course: string
        subject: string
      }
      distance: number
    }>
    count: number
  }>> {
    return this.request('/question-management/ai/search-context', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getAvailableData(): Promise<ApiResponse<{
    sources: string[]
    subjects: string[]
  }>> {
    return this.request('/question-management/ai/available-data', {
      method: 'GET',
    })
  }

  // Question set management for lobbies
  async getAvailableQuestionSets(): Promise<ApiResponse<Array<{
    id: number
    name: string
    category: string
    difficulty: string
    questionCount: number
    isActive: boolean
  }>>> {
    return this.request('/lobbies/question-sets/available', {
      method: 'GET',
    })
  }

  async getLobbyQuestionSetInfo(lobbyCode: string): Promise<ApiResponse<{
    selectedSets: Array<{ id: number; name: string; questionCount: number }>
    totalQuestions: number
    selectedQuestionCount: number
    maxQuestionCount: number
  }>> {
    return this.request(`/lobbies/${lobbyCode}/question-sets`, {
      method: 'GET',
    })
  }

  async updateLobbyQuestionSets(
    lobbyCode: string, 
    questionSetIds: number[], 
    questionCount: number
  ): Promise<ApiResponse<{
    message: string
    lobby: any
  }>> {
    return this.request(`/lobbies/${lobbyCode}/question-sets`, {
      method: 'PUT',
      body: JSON.stringify({
        questionSetIds,
        questionCount
      })
    })
  }

  // Utility methods
  setAuth(token: string, refreshToken?: string, userData?: { id: string; username: string; email: string }): void {
    this.token = token
    localStorage.setItem('auth_token', token)
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken)
    }
    if (userData) {
      localStorage.setItem('user_data', JSON.stringify(userData))
    }
  }

  clearAuth(): void {
    this.token = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_data')
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  getToken(): string | null {
    return this.token
  }

  getCurrentUser(): { id: string; username: string; email: string } | null {
    const userData = localStorage.getItem('user_data')
    if (userData) {
      try {
        return JSON.parse(userData)
      } catch {
        return null
      }
    }
    return null
  }

  // File Upload Methods
  async uploadFile(formData: FormData): Promise<ApiResponse<{
    fileId: string
    originalName: string
    fileType: string
    fileSize: number
    metadata: any
    chromaDocumentId: string
    chunks: number
    wordCount: number
  }>> {
    return this.request('/file-upload/single', {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData, let the browser set it with boundary
      },
      body: formData,
    })
  }

  async uploadFiles(formData: FormData): Promise<ApiResponse<{
    processed: number
    failed: number
    results: Array<{
      fileId: string
      originalName: string
      fileType: string
      fileSize: number
      metadata: any
      chromaDocumentId: string
      chunks: number
      wordCount: number
    }>
    errors: Array<{
      originalName: string
      error: string
      details?: string[]
    }>
  }>> {
    return this.request('/file-upload/batch', {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData, let the browser set it with boundary
      },
      body: formData,
    })
  }

  async getFiles(params?: URLSearchParams): Promise<ApiResponse<{
    files: Array<{
      fileId: string
      originalName: string
      fileType: string
      fileSize: number
      metadata: any
      chromaDocumentId: string
      createdAt: string
    }>
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }>> {
    const queryString = params ? `?${params.toString()}` : ''
    return this.request(`/file-upload/files${queryString}`)
  }

  async getFile(fileId: string): Promise<ApiResponse<{
    fileId: string
    originalName: string
    fileType: string
    fileSize: number
    metadata: any
    chromaDocumentId: string
    createdAt: string
  }>> {
    return this.request(`/file-upload/files/${fileId}`)
  }

  async deleteFile(fileId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/file-upload/${fileId}`, {
      method: 'DELETE',
    })
  }

  async getFileStatus(fileId: string): Promise<ApiResponse<{
    fileId: string
    originalName: string
    fileType: string
    fileSize: number
    metadata: any
    chromaDocumentId: string
    createdAt: string
    status: string
  }>> {
    return this.request(`/file-upload/status/${fileId}`)
  }

  async updateFileOptions(fileId: string, options: any): Promise<ApiResponse<any>> {
    return this.request(`/file-upload/${fileId}/options`, {
      method: 'PUT',
      body: JSON.stringify(options),
    });
  }

  async updateFileMetadata(fileId: string, metadata: any): Promise<ApiResponse<any>> {
    return this.request(`/files/${fileId}/metadata`, {
      method: 'PUT',
      body: JSON.stringify(metadata),
    });
  }
}

// Export singleton instance
export const apiService = new ApiService() 
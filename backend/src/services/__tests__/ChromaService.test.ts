import { ChromaService, DocumentMetadata, EmbeddingResult, SearchResult } from '../ChromaService';
import { ChromaClient } from 'chromadb';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

// Mock the dependencies
jest.mock('chromadb');
jest.mock('langchain/document');
jest.mock('langchain/text_splitter');
jest.mock('crypto');

describe('ChromaService', () => {
  let chromaService: ChromaService;
  let mockChromaClient: jest.Mocked<ChromaClient>;
  let mockCollection: any;
  let mockTextSplitter: jest.Mocked<RecursiveCharacterTextSplitter>;

  // Test data
  const mockDocumentMetadata: DocumentMetadata = {
    source: 'test_source',
    title: 'Test Document',
    course: 'Test Course',
    subject: 'Test Subject',
    page: 1,
    section: 'Test Section',
    fileId: 'test_file_123',
    version: 1,
    hash: 'test_hash_123',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  const mockDocuments: Document[] = [
    new Document({
      pageContent: 'Test content 1',
      metadata: { ...mockDocumentMetadata, section: 'section_1' }
    }),
    new Document({
      pageContent: 'Test content 2',
      metadata: { ...mockDocumentMetadata, section: 'section_2' }
    })
  ];

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup ChromaClient mock
    mockChromaClient = {
      getOrCreateCollection: jest.fn(),
      heartbeat: jest.fn()
    } as any;

    // Setup collection mock
    mockCollection = {
      add: jest.fn(),
      query: jest.fn(),
      get: jest.fn(),
      delete: jest.fn()
    };

    // Setup text splitter mock
    mockTextSplitter = {
      splitText: jest.fn()
    } as any;

    // Mock ChromaClient constructor
    (ChromaClient as jest.MockedClass<typeof ChromaClient>).mockImplementation(() => mockChromaClient);
    mockChromaClient.getOrCreateCollection.mockResolvedValue(mockCollection);

    // Mock RecursiveCharacterTextSplitter constructor
    (RecursiveCharacterTextSplitter as jest.MockedClass<typeof RecursiveCharacterTextSplitter>).mockImplementation(() => mockTextSplitter);

    // Mock crypto
    const mockCrypto = require('crypto');
    mockCrypto.createHash = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('mock_hash_123')
    });

    // Create ChromaService instance
    chromaService = new ChromaService();

    // Set test environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  describe('Constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(ChromaClient).toHaveBeenCalledWith({
        path: 'http://localhost:8000'
      });
      expect(RecursiveCharacterTextSplitter).toHaveBeenCalledWith({
        chunkSize: 1000,
        chunkOverlap: 200,
        separators: ['\n\n', '\n', ' ', '']
      });
    });

    it('should use production URL when in production environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.CHROMA_URL = 'http://production-chroma:8000';
      
      new ChromaService();
      
      expect(ChromaClient).toHaveBeenCalledWith({
        path: 'http://production-chroma:8000'
      });
    });
  });

  describe('initializeCollection', () => {
    it('should successfully initialize collection', async () => {
      const result = await chromaService.initializeCollection();

      expect(mockChromaClient.getOrCreateCollection).toHaveBeenCalledWith({
        name: 'university_courses'
      });
      expect(result).toEqual({ success: true });
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Connection failed');
      mockChromaClient.getOrCreateCollection.mockRejectedValue(error);

      const result = await chromaService.initializeCollection();

      expect(result).toEqual({
        success: false,
        error: 'Connection failed'
      });
    });
  });

  describe('addDocuments', () => {
    beforeEach(() => {
      // Mock successful collection operations
      mockCollection.add.mockResolvedValue(undefined);
      mockCollection.query.mockResolvedValue({
        documents: [],
        metadatas: []
      });
    });

    it('should successfully add documents', async () => {
      const result = await chromaService.addDocuments(mockDocuments, mockDocumentMetadata);

      expect(mockCollection.add).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        documentsProcessed: 2,
        embeddingsCreated: 2,
        duplicatesSkipped: 0
      });
    });

    it('should handle duplicate documents', async () => {
      // Mock existing documents with same hashes
      mockCollection.query.mockResolvedValue({
        documents: [['Test content 1']],
        metadatas: [[{ hash: 'mock_hash_123' }]]
      });

      const result = await chromaService.addDocuments(mockDocuments, mockDocumentMetadata);

      expect(result).toEqual({
        success: true,
        documentsProcessed: 2,
        embeddingsCreated: 0, // Both documents are duplicates
        duplicatesSkipped: 2
      });
    });

    it('should handle all duplicates', async () => {
      // Mock existing documents with same hashes for all documents
      mockCollection.query.mockResolvedValue({
        documents: [['Test content 1', 'Test content 2']],
        metadatas: [[{ hash: 'mock_hash_123' }, { hash: 'mock_hash_123' }]]
      });

      const result = await chromaService.addDocuments(mockDocuments, mockDocumentMetadata);

      expect(result).toEqual({
        success: true,
        documentsProcessed: 2,
        embeddingsCreated: 0,
        duplicatesSkipped: 2
      });
      expect(mockCollection.add).not.toHaveBeenCalled();
    });

    it('should handle add operation errors', async () => {
      const error = new Error('Add operation failed');
      mockCollection.add.mockRejectedValue(error);

      const result = await chromaService.addDocuments(mockDocuments, mockDocumentMetadata);

      expect(result).toEqual({
        success: false,
        documentsProcessed: 0,
        embeddingsCreated: 0,
        duplicatesSkipped: 0,
        error: 'Add operation failed'
      });
    });

    it('should handle query errors during duplicate check', async () => {
      const error = new Error('Query failed');
      mockCollection.query.mockRejectedValue(error);

      const result = await chromaService.addDocuments(mockDocuments, mockDocumentMetadata);

      // The error is caught in findDocumentsByHashes and returns empty array
      // So the method continues and tries to add documents normally
      expect(result).toEqual({
        success: true,
        documentsProcessed: 2,
        embeddingsCreated: 2,
        duplicatesSkipped: 0
      });
    });
  });

  describe('search', () => {
    it('should successfully search for documents', async () => {
      const mockSearchResults = {
        documents: [['Test content 1', 'Test content 2']],
        metadatas: [[
          { source: 'test_source', title: 'Test Document', course: 'Test Course', subject: 'Test Subject' },
          { source: 'test_source2', title: 'Test Document 2', course: 'Test Course 2', subject: 'Test Subject 2' }
        ]],
        distances: [[0.1, 0.2]]
      };

      mockCollection.query.mockResolvedValue(mockSearchResults);

      const results = await chromaService.search('test query', 5);

      expect(mockCollection.query).toHaveBeenCalledWith({
        queryTexts: ['test query'],
        nResults: 5
      });
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        content: 'Test content 1',
        metadata: {
          source: 'test_source',
          title: 'Test Document',
          course: 'Test Course',
          subject: 'Test Subject'
        },
        distance: 0.1
      });
    });

    it('should handle empty search results', async () => {
      mockCollection.query.mockResolvedValue({
        documents: [],
        metadatas: []
      });

      const results = await chromaService.search('test query');

      expect(results).toEqual([]);
    });

    it('should handle search errors', async () => {
      const error = new Error('Search failed');
      mockCollection.query.mockRejectedValue(error);

      const results = await chromaService.search('test query');

      expect(results).toEqual([]);
    });

    it('should handle malformed search results', async () => {
      mockCollection.query.mockResolvedValue({
        documents: null,
        metadatas: null
      });

      const results = await chromaService.search('test query');

      expect(results).toEqual([]);
    });
  });

  describe('getCollectionStats', () => {
    it('should return collection statistics', async () => {
      const mockGetResults = {
        documents: ['doc1', 'doc2', 'doc3'],
        embeddings: ['emb1', 'emb2', 'emb3'],
        metadatas: [
          { source: 'source1', subject: 'subject1' },
          { source: 'source2', subject: 'subject2' },
          { source: 'source1', subject: 'subject1' }
        ]
      };

      mockCollection.get.mockResolvedValue(mockGetResults);

      const stats = await chromaService.getCollectionStats();

      expect(mockCollection.get).toHaveBeenCalledWith({
        include: ['metadatas']
      });
      expect(stats).toEqual({
        totalDocuments: 3,
        totalEmbeddings: 3,
        sources: ['source1', 'source2'],
        subjects: ['subject1', 'subject2']
      });
    });

    it('should handle empty collection', async () => {
      mockCollection.get.mockResolvedValue({
        documents: [],
        embeddings: [],
        metadatas: []
      });

      const stats = await chromaService.getCollectionStats();

      expect(stats).toEqual({
        totalDocuments: 0,
        totalEmbeddings: 0,
        sources: [],
        subjects: []
      });
    });

    it('should handle get operation errors', async () => {
      const error = new Error('Get operation failed');
      mockCollection.get.mockRejectedValue(error);

      const stats = await chromaService.getCollectionStats();

      expect(stats).toEqual({
        totalDocuments: 0,
        totalEmbeddings: 0,
        sources: [],
        subjects: []
      });
    });
  });

  describe('deleteDocumentsBySource', () => {
    it('should successfully delete documents by source', async () => {
      const mockGetResults = {
        ids: ['id1', 'id2', 'id3'],
        metadatas: [
          { source: 'test_source' },
          { source: 'test_source' },
          { source: 'test_source' }
        ]
      };

      mockCollection.get.mockResolvedValue(mockGetResults);
      mockCollection.delete.mockResolvedValue(undefined);

      const result = await chromaService.deleteDocumentsBySource('test_source');

      expect(mockCollection.get).toHaveBeenCalledWith({
        where: { source: 'test_source' },
        include: ['metadatas']
      });
      expect(mockCollection.delete).toHaveBeenCalledWith({
        ids: ['id1', 'id2', 'id3']
      });
      expect(result).toEqual({
        success: true,
        deletedCount: 3
      });
    });

    it('should handle no documents found', async () => {
      mockCollection.get.mockResolvedValue({
        ids: [],
        metadatas: []
      });

      const result = await chromaService.deleteDocumentsBySource('nonexistent_source');

      expect(result).toEqual({
        success: true,
        deletedCount: 0
      });
      expect(mockCollection.delete).not.toHaveBeenCalled();
    });

    it('should handle delete operation errors', async () => {
      const error = new Error('Delete operation failed');
      mockCollection.get.mockResolvedValue({
        ids: ['id1'],
        metadatas: [{ source: 'test_source' }]
      });
      mockCollection.delete.mockRejectedValue(error);

      const result = await chromaService.deleteDocumentsBySource('test_source');

      expect(result).toEqual({
        success: false,
        deletedCount: 0,
        error: 'Delete operation failed'
      });
    });
  });

  describe('testConnection', () => {
    it('should successfully test connection', async () => {
      mockChromaClient.heartbeat.mockResolvedValue({ status: 'ok' });

      const result = await chromaService.testConnection();

      expect(mockChromaClient.heartbeat).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockChromaClient.heartbeat.mockRejectedValue(error);

      const result = await chromaService.testConnection();

      expect(result).toEqual({
        success: false,
        error: 'Connection failed'
      });
    });
  });

  describe('createDocument', () => {
    it('should create document with correct content and metadata', () => {
      const content = 'Test content';
      const metadata = { ...mockDocumentMetadata };

      const document = chromaService.createDocument(content, metadata);

      expect(Document).toHaveBeenCalledWith({
        pageContent: content,
        metadata
      });
    });
  });

  describe('createCourseDocuments', () => {
    it('should create documents from course content', () => {
      const courseContent = `
# Section 1
Content for section 1

## Subsection 1.1
Content for subsection 1.1

# Section 2
Content for section 2
      `;

      // Mock Document constructor to return proper objects
      (Document as jest.MockedClass<typeof Document>).mockImplementation((params: any) => ({
        pageContent: params.pageContent,
        metadata: params.metadata
      }));

      const documents = chromaService.createCourseDocuments(courseContent, mockDocumentMetadata);

      expect(documents).toHaveLength(3); // 3 sections (empty first section + 2 headers)
      expect(documents[0]?.metadata.section).toBe('section_2'); // First header section
      expect(documents[1]?.metadata.section).toBe('section_3'); // Second header section
      expect(documents[2]?.metadata.section).toBe('section_4'); // Third section (after second header)
    });

    it('should handle empty course content', () => {
      const documents = chromaService.createCourseDocuments('', mockDocumentMetadata);

      expect(documents).toEqual([]);
    });

    it('should filter out empty sections', () => {
      const courseContent = `
# Section 1
Content for section 1

# Section 2

# Section 3
Content for section 3
      `;

      // Mock Document constructor to return proper objects
      (Document as jest.MockedClass<typeof Document>).mockImplementation((params: any) => ({
        pageContent: params.pageContent,
        metadata: params.metadata
      }));

      const documents = chromaService.createCourseDocuments(courseContent, mockDocumentMetadata);

      expect(documents).toHaveLength(3); // 3 sections (empty first + 2 non-empty header sections + 1 empty + 1 non-empty)
    });
  });

  describe('getAvailableSources', () => {
    it('should return available sources', async () => {
      const mockStats = {
        totalDocuments: 3,
        totalEmbeddings: 3,
        sources: ['source1', 'source2', 'source3'],
        subjects: ['subject1', 'subject2']
      };

      jest.spyOn(chromaService, 'getCollectionStats').mockResolvedValue(mockStats);

      const sources = await chromaService.getAvailableSources();

      expect(sources).toEqual(['source1', 'source2', 'source3']);
    });

    it('should handle errors', async () => {
      jest.spyOn(chromaService, 'getCollectionStats').mockRejectedValue(new Error('Stats failed'));

      const sources = await chromaService.getAvailableSources();

      expect(sources).toEqual([]);
    });
  });

  describe('getAvailableSubjects', () => {
    it('should return available subjects', async () => {
      const mockStats = {
        totalDocuments: 3,
        totalEmbeddings: 3,
        sources: ['source1', 'source2'],
        subjects: ['subject1', 'subject2', 'subject3']
      };

      jest.spyOn(chromaService, 'getCollectionStats').mockResolvedValue(mockStats);

      const subjects = await chromaService.getAvailableSubjects();

      expect(subjects).toEqual(['subject1', 'subject2', 'subject3']);
    });

    it('should handle errors', async () => {
      jest.spyOn(chromaService, 'getCollectionStats').mockRejectedValue(new Error('Stats failed'));

      const subjects = await chromaService.getAvailableSubjects();

      expect(subjects).toEqual([]);
    });
  });

  describe('searchBySubject', () => {
    it('should return empty results for now', async () => {
      const results = await chromaService.searchBySubject('test_subject', 'test query');

      expect(results).toEqual([]);
    });
  });

  describe('getDocumentsByFileId', () => {
    it('should return documents for file ID', async () => {
      const mockQueryResults = {
        documents: [['doc1', 'doc2']],
        metadatas: [[{ fileId: 'test_file_123' }, { fileId: 'test_file_123' }]]
      };

      mockCollection.query.mockResolvedValue(mockQueryResults);

      const documents = await chromaService.getDocumentsByFileId('test_file_123');

      expect(mockCollection.query).toHaveBeenCalledWith({
        queryTexts: [''],
        nResults: 1000,
        where: { fileId: 'test_file_123' }
      });
      expect(documents).toHaveLength(2);
      expect(documents[0]).toEqual({
        pageContent: 'doc1',
        metadata: { fileId: 'test_file_123' }
      });
    });

    it('should handle query errors', async () => {
      const error = new Error('Query failed');
      mockCollection.query.mockRejectedValue(error);

      const documents = await chromaService.getDocumentsByFileId('test_file_123');

      expect(documents).toEqual([]);
    });
  });

  describe('addDocumentsBatch', () => {
    it('should process document batches with progress tracking', async () => {
      const documentBatches = [
        { documents: mockDocuments, metadata: mockDocumentMetadata },
        { documents: mockDocuments, metadata: mockDocumentMetadata }
      ];

      const onProgress = jest.fn();

      // Mock successful addDocuments calls
      jest.spyOn(chromaService, 'addDocuments').mockResolvedValue({
        success: true,
        documentsProcessed: 2,
        embeddingsCreated: 2,
        duplicatesSkipped: 0
      });

      const result = await chromaService.addDocumentsBatch(documentBatches, onProgress);

      expect(result).toEqual({
        success: true,
        documentsProcessed: 4,
        embeddingsCreated: 4,
        duplicatesSkipped: 0
      });
      expect(onProgress).toHaveBeenCalledTimes(2);
    });

    it('should handle batch processing errors', async () => {
      const documentBatches = [
        { documents: mockDocuments, metadata: mockDocumentMetadata }
      ];

      jest.spyOn(chromaService, 'addDocuments').mockRejectedValue(new Error('Batch failed'));

      const result = await chromaService.addDocumentsBatch(documentBatches);

      expect(result).toEqual({
        success: false,
        documentsProcessed: 0,
        embeddingsCreated: 0,
        duplicatesSkipped: 0,
        error: 'Batch failed'
      });
    });
  });

  describe('updateDocumentVersion', () => {
    it('should update document version successfully', async () => {
      jest.spyOn(chromaService, 'deleteDocumentsByFileId').mockResolvedValue({
        success: true,
        deletedCount: 2
      });
      jest.spyOn(chromaService, 'addDocuments').mockResolvedValue({
        success: true,
        documentsProcessed: 1,
        embeddingsCreated: 1,
        duplicatesSkipped: 0
      });

      const result = await chromaService.updateDocumentVersion('test_file_123', 'new content', mockDocumentMetadata);

      expect(result).toEqual({
        success: true,
        documentsProcessed: 1,
        embeddingsCreated: 1,
        duplicatesSkipped: 0
      });
    });

    it('should handle update errors', async () => {
      jest.spyOn(chromaService, 'deleteDocumentsByFileId').mockRejectedValue(new Error('Delete failed'));

      const result = await chromaService.updateDocumentVersion('test_file_123', 'new content', mockDocumentMetadata);

      expect(result).toEqual({
        success: false,
        documentsProcessed: 0,
        embeddingsCreated: 0,
        duplicatesSkipped: 0,
        error: 'Delete failed'
      });
    });
  });

  describe('deleteDocumentsByFileId', () => {
    it('should delete documents by file ID successfully', async () => {
      const mockDocuments = [
        { pageContent: 'doc1', metadata: { fileId: 'test_file_123' } },
        { pageContent: 'doc2', metadata: { fileId: 'test_file_123' } }
      ];

      jest.spyOn(chromaService, 'getDocumentsByFileId').mockResolvedValue(mockDocuments);
      mockCollection.delete.mockResolvedValue(undefined);

      const result = await chromaService.deleteDocumentsByFileId('test_file_123');

      expect(result).toEqual({
        success: true,
        deletedCount: 2
      });
    });

    it('should handle no documents found', async () => {
      jest.spyOn(chromaService, 'getDocumentsByFileId').mockResolvedValue([]);

      const result = await chromaService.deleteDocumentsByFileId('nonexistent_file');

      expect(result).toEqual({
        success: true,
        deletedCount: 0
      });
    });

    it('should handle delete errors', async () => {
      const mockDocuments = [
        { pageContent: 'doc1', metadata: { fileId: 'test_file_123' } }
      ];

      jest.spyOn(chromaService, 'getDocumentsByFileId').mockResolvedValue(mockDocuments);
      mockCollection.delete.mockRejectedValue(new Error('Delete failed'));

      const result = await chromaService.deleteDocumentsByFileId('test_file_123');

      expect(result).toEqual({
        success: false,
        deletedCount: 0,
        error: 'Delete failed'
      });
    });
  });

  describe('getDocumentVersions', () => {
    it('should return document versions', async () => {
      const mockDocuments = [
        { metadata: { version: 1, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' } },
        { metadata: { version: 2, createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' } }
      ];

      jest.spyOn(chromaService, 'getDocumentsByFileId').mockResolvedValue(mockDocuments);

      const versions = await chromaService.getDocumentVersions('test_file_123');

      expect(versions).toHaveLength(2);
      expect(versions[0].version).toBe(2); // Sorted by version descending
      expect(versions[1].version).toBe(1);
    });

    it('should handle errors', async () => {
      jest.spyOn(chromaService, 'getDocumentsByFileId').mockRejectedValue(new Error('Get failed'));

      const versions = await chromaService.getDocumentVersions('test_file_123');

      expect(versions).toEqual([]);
    });
  });

  describe('getDocumentStats', () => {
    it('should return document statistics', async () => {
      const mockStats = {
        totalDocuments: 10,
        totalEmbeddings: 10,
        sources: ['file_123', 'file_456', 'file_789'],
        subjects: ['subject1', 'subject2']
      };

      jest.spyOn(chromaService, 'getCollectionStats').mockResolvedValue(mockStats);
      jest.spyOn(chromaService, 'getAvailableSources').mockResolvedValue(['file_123', 'file_456', 'file_789']);

      const stats = await chromaService.getDocumentStats();

      expect(stats).toEqual({
        totalDocuments: 10,
        totalFiles: 3,
        totalVersions: 10,
        averageChunksPerFile: 3.33,
        storageSize: 10240
      });
    });

    it('should handle errors', async () => {
      jest.spyOn(chromaService, 'getCollectionStats').mockRejectedValue(new Error('Stats failed'));

      const stats = await chromaService.getDocumentStats();

      expect(stats).toEqual({
        totalDocuments: 0,
        totalFiles: 0,
        totalVersions: 0,
        averageChunksPerFile: 0,
        storageSize: 0
      });
    });
  });

  describe('Private methods', () => {
    describe('findDocumentsByHashes', () => {
      it('should find documents by hashes', async () => {
        const mockQueryResults = {
          documents: [['doc1']],
          metadatas: [[{ hash: 'mock_hash_123' }]]
        };

        mockCollection.query.mockResolvedValue(mockQueryResults);

        // Access private method through reflection
        const findDocumentsByHashes = (chromaService as any).findDocumentsByHashes.bind(chromaService);
        const documents = await findDocumentsByHashes(['mock_hash_123']);

        expect(documents).toHaveLength(1);
        expect(documents[0]).toEqual({
          pageContent: 'doc1',
          metadata: { hash: 'mock_hash_123' }
        });
      });

      it('should handle query errors', async () => {
        const error = new Error('Query failed');
        mockCollection.query.mockRejectedValue(error);

        const findDocumentsByHashes = (chromaService as any).findDocumentsByHashes.bind(chromaService);
        const documents = await findDocumentsByHashes(['mock_hash_123']);

        expect(documents).toEqual([]);
      });
    });

    describe('generateContentHash', () => {
      it('should generate content hash', () => {
        const generateContentHash = (chromaService as any).generateContentHash.bind(chromaService);
        const hash = generateContentHash('test content');

        expect(hash).toBe('mock_hash_123');
      });
    });
  });
}); 
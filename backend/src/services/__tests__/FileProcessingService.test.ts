import { FileProcessingService, ProcessedFile, ProcessingOptions } from '../FileProcessingService';
import fs from 'fs';
import path from 'path';

// Mock fs module
jest.mock('fs');
jest.mock('path');

// Mock pdf-parse
jest.mock('pdf-parse', () => {
  return jest.fn().mockResolvedValue({
    text: 'Test PDF Content',
    numpages: 1,
    info: {
      Title: 'Test Document',
      Author: 'Test Author',
      CreationDate: 'D:20230101120000',
      ModDate: 'D:20230101120000'
    }
  });
});

// Mock mammoth
jest.mock('mammoth', () => ({
  extractRawText: jest.fn().mockResolvedValue({
    value: 'Test DOCX Content',
    messages: []
  })
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('FileProcessingService', () => {
  let fileProcessingService: FileProcessingService;
  let mockFilePath: string;
  let mockOriginalName: string;

  beforeEach(() => {
    fileProcessingService = new FileProcessingService();
    mockFilePath = '/tmp/test-file.pdf';
    mockOriginalName = 'test-document.pdf';

    // Mock fs.statSync
    mockFs.statSync.mockReturnValue({
      size: BigInt(1024),
      isFile: () => true,
      isDirectory: () => false,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isSymbolicLink: () => false,
      isFIFO: () => false,
      isSocket: () => false,
      dev: BigInt(0),
      ino: BigInt(0),
      mode: BigInt(0),
      nlink: BigInt(0),
      uid: BigInt(0),
      gid: BigInt(0),
      rdev: BigInt(0),
      blksize: BigInt(0),
      blocks: BigInt(0),
      atime: new Date(),
      mtime: new Date(),
      ctime: new Date(),
      birthtime: new Date()
    });

    // Mock fs.readFileSync with proper PDF content
    mockFs.readFileSync.mockReturnValue(Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test PDF Content) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF'));

    // Mock path.extname
    mockPath.extname.mockReturnValue('.pdf');
  });

  describe('processFile', () => {
    it('should process a PDF file successfully', async () => {
      const options: ProcessingOptions = {
        chunkSize: 1000,
        chunkOverlap: 200,
        preserveFormatting: true,
        extractMetadata: true
      };

      const result = await fileProcessingService.processFile(mockFilePath, mockOriginalName, options);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.originalName).toBe(mockOriginalName);
      expect(result.fileType).toBe('pdf');
      expect(result.content).toBeDefined();
      expect(result.chunks).toBeDefined();
      expect(result.chunks.length).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(result.fileSize).toBe(1024);
    });

    it('should process a DOCX file successfully', async () => {
      mockPath.extname.mockReturnValue('.docx');

      const result = await fileProcessingService.processFile(mockFilePath, 'test.docx');

      expect(result.fileType).toBe('docx');
    });

    it('should process a Markdown file successfully', async () => {
      mockPath.extname.mockReturnValue('.md');

      const result = await fileProcessingService.processFile(mockFilePath, 'test.md');

      expect(result.fileType).toBe('markdown');
    });

    it('should process an HTML file successfully', async () => {
      mockPath.extname.mockReturnValue('.html');

      const result = await fileProcessingService.processFile(mockFilePath, 'test.html');

      expect(result.fileType).toBe('html');
    });

    it('should handle unsupported file types', async () => {
      mockPath.extname.mockReturnValue('.txt');

      await expect(
        fileProcessingService.processFile(mockFilePath, 'test.txt')
      ).rejects.toThrow('Unsupported file type');
    });

    it('should generate unique file IDs', async () => {
      const result1 = await fileProcessingService.processFile(mockFilePath, 'file1.pdf');
      const result2 = await fileProcessingService.processFile(mockFilePath, 'file2.pdf');

      expect(result1.id).not.toBe(result2.id);
    });

    it('should chunk content according to options', async () => {
      const longContent = 'x'.repeat(5000);
      mockFs.readFileSync.mockReturnValue(Buffer.from(longContent));

      const options: ProcessingOptions = {
        chunkSize: 1000,
        chunkOverlap: 200
      };

      const result = await fileProcessingService.processFile(mockFilePath, mockOriginalName, options);

      expect(result.chunks.length).toBeGreaterThan(1);
      result.chunks.forEach(chunk => {
        expect(chunk.length).toBeLessThanOrEqual(1000);
      });
    });
  });

  describe('validateContent', () => {
    it('should validate valid content', () => {
      const validContent = 'This is valid content with reasonable length.';
      const result = fileProcessingService.validateContent(validContent);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty content', () => {
      const result = fileProcessingService.validateContent('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content is empty');
    });

    it('should reject content that is too short', () => {
      const shortContent = 'Too short';
      const result = fileProcessingService.validateContent(shortContent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content is too short (minimum 10 characters)');
    });

    it('should reject content that is too long', () => {
      const longContent = 'x'.repeat(1000001); // Over 1MB limit
      const result = fileProcessingService.validateContent(longContent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content is too long (maximum 1MB)');
    });

    it('should reject content with invalid characters', () => {
      const invalidContent = 'Content with \x00 null bytes';
      const result = fileProcessingService.validateContent(invalidContent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content contains invalid characters');
    });
  });

  describe('cleanupFile', () => {
    it('should delete file successfully', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync.mockImplementation(() => {});

      fileProcessingService.cleanupFile(mockFilePath);

      expect(mockFs.unlinkSync).toHaveBeenCalledWith(mockFilePath);
    });

    it('should handle file deletion errors gracefully', () => {
      mockFs.unlinkSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      // Should not throw error
      expect(() => {
        fileProcessingService.cleanupFile(mockFilePath);
      }).not.toThrow();
    });
  });

  describe('file type detection', () => {
    it('should detect PDF files', () => {
      const result = fileProcessingService['getFileType']('.pdf');
      expect(result).toBe('pdf');
    });

    it('should detect DOCX files', () => {
      const result = fileProcessingService['getFileType']('.docx');
      expect(result).toBe('docx');
    });

    it('should detect Markdown files', () => {
      const result = fileProcessingService['getFileType']('.md');
      expect(result).toBe('markdown');
    });

    it('should detect HTML files', () => {
      const result = fileProcessingService['getFileType']('.html');
      expect(result).toBe('html');
    });

    it('should return unknown for unsupported types', () => {
      const result = fileProcessingService['getFileType']('.txt');
      expect(result).toBe('unknown');
    });
  });

  describe('language detection', () => {
    it('should detect English text', () => {
      const result = fileProcessingService['detectLanguage']('This is English text');
      expect(result).toBe('en');
    });

    it('should detect German text', () => {
      const result = fileProcessingService['detectLanguage']('Dies ist deutscher Text');
      expect(result).toBe('de');
    });

    it('should default to English for unknown language', () => {
      const result = fileProcessingService['detectLanguage']('123456789');
      expect(result).toBe('en');
    });
  });
}); 
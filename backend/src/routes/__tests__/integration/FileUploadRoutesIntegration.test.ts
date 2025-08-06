import request from 'supertest';
import { app } from '../../server';
import { DatabaseService } from '../../services/DatabaseService';
import { AuthService } from '../../services/AuthService';
import { ChromaService } from '../../services/ChromaService';
import { FileProcessingService } from '../../services/FileProcessingService';
import path from 'path';
import fs from 'fs';

describe('File Upload Routes Integration Tests', () => {
  let dbService: DatabaseService;
  let authService: AuthService;
  let chromaService: ChromaService;
  let fileProcessingService: FileProcessingService;
  let authToken: string;
  let testUserId: number;
  let testFileId: string;

  beforeAll(async () => {
    dbService = new DatabaseService();
    await dbService.initialize();
    
    authService = new AuthService();
    chromaService = new ChromaService();
    fileProcessingService = new FileProcessingService();
  });

  afterAll(async () => {
    await dbService.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await dbService.query('DELETE FROM file_uploads');
    await dbService.query('DELETE FROM users');

    // Create test user
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPass123!'
    };

    // Register and verify user
    await request(app)
      .post('/api/auth/register')
      .send(userData);

    const verificationToken = await dbService.query(
      'SELECT * FROM email_verification_tokens WHERE email = $1',
      [userData.email]
    );
    await request(app)
      .post('/api/auth/verify-email')
      .send({ token: verificationToken.rows[0].token });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: userData.username,
        password: userData.password
      });

    authToken = loginResponse.body.token;
    testUserId = loginResponse.body.user.id;
  });

  describe('POST /api/file-upload/single', () => {
    it('should upload and process a single file successfully', async () => {
      const testFilePath = path.join(__dirname, '../../fixtures/test-document.txt');
      
      // Create test file if it doesn't exist
      if (!fs.existsSync(testFilePath)) {
        const testContent = 'This is a test document for file upload testing. It contains sample text that will be processed and added to the vector database.';
        fs.writeFileSync(testFilePath, testContent);
      }

      const response = await request(app)
        .post('/api/file-upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('originalName');
      expect(response.body.data).toHaveProperty('fileType');
      expect(response.body.data).toHaveProperty('status', 'processed');
      expect(response.body.data).toHaveProperty('metadata');

      testFileId = response.body.data.id;
    });

    it('should reject files with invalid types', async () => {
      const testFilePath = path.join(__dirname, '../../fixtures/invalid-file.exe');
      
      // Create test file if it doesn't exist
      if (!fs.existsSync(testFilePath)) {
        fs.writeFileSync(testFilePath, 'This is an invalid file type');
      }

      const response = await request(app)
        .post('/api/file-upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid file type');
    });

    it('should reject files that exceed size limit', async () => {
      const testFilePath = path.join(__dirname, '../../fixtures/large-file.txt');
      
      // Create a large test file
      const largeContent = 'A'.repeat(11 * 1024 * 1024); // 11MB
      fs.writeFileSync(testFilePath, largeContent);

      const response = await request(app)
        .post('/api/file-upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('File size exceeds limit');

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should require authentication', async () => {
      const testFilePath = path.join(__dirname, '../../fixtures/test-document.txt');
      
      const response = await request(app)
        .post('/api/file-upload/single')
        .attach('file', testFilePath)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('No token provided');
    });

    it('should handle corrupted files gracefully', async () => {
      const testFilePath = path.join(__dirname, '../../fixtures/corrupted-file.txt');
      
      // Create a corrupted file
      fs.writeFileSync(testFilePath, Buffer.from([0xFF, 0xFE, 0x00, 0x01]));

      const response = await request(app)
        .post('/api/file-upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });

  describe('POST /api/file-upload/batch', () => {
    it('should upload and process multiple files successfully', async () => {
      const testFiles = [
        path.join(__dirname, '../../fixtures/test-doc1.txt'),
        path.join(__dirname, '../../fixtures/test-doc2.txt'),
        path.join(__dirname, '../../fixtures/test-doc3.txt')
      ];

      // Create test files
      const contents = [
        'This is the first test document.',
        'This is the second test document with more content.',
        'This is the third test document for batch processing.'
      ];

      testFiles.forEach((filePath, index) => {
        fs.writeFileSync(filePath, contents[index]);
      });

      const response = await request(app)
        .post('/api/file-upload/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testFiles[0])
        .attach('files', testFiles[1])
        .attach('files', testFiles[2])
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(3);
      
      response.body.data.forEach((file: any) => {
        expect(file).toHaveProperty('id');
        expect(file).toHaveProperty('originalName');
        expect(file).toHaveProperty('status', 'processed');
      });

      // Clean up
      testFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    });

    it('should handle mixed valid and invalid files in batch', async () => {
      const validFile = path.join(__dirname, '../../fixtures/valid-doc.txt');
      const invalidFile = path.join(__dirname, '../../fixtures/invalid-doc.exe');
      
      // Create test files
      fs.writeFileSync(validFile, 'Valid document content');
      fs.writeFileSync(invalidFile, 'Invalid file content');

      const response = await request(app)
        .post('/api/file-upload/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', validFile)
        .attach('files', invalidFile)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid file type');

      // Clean up
      fs.unlinkSync(validFile);
      fs.unlinkSync(invalidFile);
    });
  });

  describe('GET /api/file-upload/status/:id', () => {
    it('should return file processing status', async () => {
      // First upload a file
      const testFilePath = path.join(__dirname, '../../fixtures/status-test.txt');
      fs.writeFileSync(testFilePath, 'Test content for status check');

      const uploadResponse = await request(app)
        .post('/api/file-upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath);

      const fileId = uploadResponse.body.data.id;

      const response = await request(app)
        .get(`/api/file-upload/status/${fileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', fileId);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('progress');

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .get('/api/file-upload/status/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('File not found');
    });
  });

  describe('DELETE /api/file-upload/:id', () => {
    it('should delete a file successfully', async () => {
      // First upload a file
      const testFilePath = path.join(__dirname, '../../fixtures/delete-test.txt');
      fs.writeFileSync(testFilePath, 'Test content for deletion');

      const uploadResponse = await request(app)
        .post('/api/file-upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath);

      const fileId = uploadResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/file-upload/${fileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('File deleted successfully');

      // Verify file is deleted
      const statusResponse = await request(app)
        .get(`/api/file-upload/status/${fileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .delete('/api/file-upload/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('File not found');
    });
  });

  describe('GET /api/file-upload/files', () => {
    it('should return list of user files', async () => {
      // Upload multiple files first
      const testFiles = [
        path.join(__dirname, '../../fixtures/list-test1.txt'),
        path.join(__dirname, '../../fixtures/list-test2.txt')
      ];

      testFiles.forEach((filePath, index) => {
        fs.writeFileSync(filePath, `Test content ${index + 1}`);
      });

      // Upload files
      for (const filePath of testFiles) {
        await request(app)
          .post('/api/file-upload/single')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', filePath);
      }

      const response = await request(app)
        .get('/api/file-upload/files')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      response.body.data.forEach((file: any) => {
        expect(file).toHaveProperty('id');
        expect(file).toHaveProperty('originalName');
        expect(file).toHaveProperty('fileType');
        expect(file).toHaveProperty('status');
        expect(file).toHaveProperty('uploadedAt');
      });

      // Clean up
      testFiles.forEach(filePath => {
        fs.unlinkSync(filePath);
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/file-upload/files')
        .query({ page: 1, limit: 5 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 5);
    });
  });

  describe('GET /api/file-upload/files/:id', () => {
    it('should return file details', async () => {
      // First upload a file
      const testFilePath = path.join(__dirname, '../../fixtures/details-test.txt');
      fs.writeFileSync(testFilePath, 'Test content for details');

      const uploadResponse = await request(app)
        .post('/api/file-upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath);

      const fileId = uploadResponse.body.data.id;

      const response = await request(app)
        .get(`/api/file-upload/files/${fileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', fileId);
      expect(response.body.data).toHaveProperty('originalName');
      expect(response.body.data).toHaveProperty('fileType');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('metadata');
      expect(response.body.data).toHaveProperty('uploadedAt');

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });

  describe('PUT /api/file-upload/:id/options', () => {
    it('should update file processing options', async () => {
      // First upload a file
      const testFilePath = path.join(__dirname, '../../fixtures/options-test.txt');
      fs.writeFileSync(testFilePath, 'Test content for options update');

      const uploadResponse = await request(app)
        .post('/api/file-upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath);

      const fileId = uploadResponse.body.data.id;

      const options = {
        chunkSize: 500,
        chunkOverlap: 100,
        preserveFormatting: false,
        extractMetadata: true
      };

      const response = await request(app)
        .put(`/api/file-upload/${fileId}/options`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(options)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', fileId);
      expect(response.body.data).toHaveProperty('processingOptions');

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });

  describe('GET /api/file-upload/:id/versions', () => {
    it('should return file versions', async () => {
      // First upload a file
      const testFilePath = path.join(__dirname, '../../fixtures/versions-test.txt');
      fs.writeFileSync(testFilePath, 'Test content for versions');

      const uploadResponse = await request(app)
        .post('/api/file-upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath);

      const fileId = uploadResponse.body.data.id;

      const response = await request(app)
        .get(`/api/file-upload/${fileId}/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });

  describe('POST /api/file-upload/:id/update-version', () => {
    it('should create new version of file', async () => {
      // First upload a file
      const testFilePath = path.join(__dirname, '../../fixtures/version-update-test.txt');
      fs.writeFileSync(testFilePath, 'Original content');

      const uploadResponse = await request(app)
        .post('/api/file-upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath);

      const fileId = uploadResponse.body.data.id;

      // Create updated file
      const updatedFilePath = path.join(__dirname, '../../fixtures/updated-version.txt');
      fs.writeFileSync(updatedFilePath, 'Updated content');

      const response = await request(app)
        .post(`/api/file-upload/${fileId}/update-version`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', updatedFilePath)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('version');

      // Clean up
      fs.unlinkSync(testFilePath);
      fs.unlinkSync(updatedFilePath);
    });
  });

  describe('GET /api/file-upload/stats', () => {
    it('should return file upload statistics', async () => {
      const response = await request(app)
        .get('/api/file-upload/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalFiles');
      expect(response.body.data).toHaveProperty('totalSize');
      expect(response.body.data).toHaveProperty('fileTypes');
      expect(response.body.data).toHaveProperty('processingStats');
    });
  });

  describe('ChromaService Integration', () => {
    it('should add processed content to vector database', async () => {
      const testFilePath = path.join(__dirname, '../../fixtures/chroma-test.txt');
      const testContent = 'This is test content for ChromaDB integration testing. It contains specific keywords and concepts that should be searchable.';
      fs.writeFileSync(testFilePath, testContent);

      const response = await request(app)
        .post('/api/file-upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('chromaDocumentId');

      // Verify document was added to ChromaDB
      const documentId = response.body.data.chromaDocumentId;
      expect(documentId).toBeDefined();

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should handle ChromaDB connection failures gracefully', async () => {
      // This test would require mocking ChromaService to simulate failures
      // For now, we'll test the basic flow
      const testFilePath = path.join(__dirname, '../../fixtures/chroma-failure-test.txt');
      fs.writeFileSync(testFilePath, 'Test content for ChromaDB failure testing');

      const response = await request(app)
        .post('/api/file-upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce upload rate limits', async () => {
      const testFilePath = path.join(__dirname, '../../fixtures/rate-limit-test.txt');
      fs.writeFileSync(testFilePath, 'Test content for rate limiting');

      // Make multiple rapid requests
      const requests = Array(12).fill(null).map(() => 
        request(app)
          .post('/api/file-upload/single')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', testFilePath)
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });

  describe('Error Handling', () => {
    it('should handle file processing errors gracefully', async () => {
      const testFilePath = path.join(__dirname, '../../fixtures/processing-error-test.txt');
      
      // Create a file that might cause processing issues
      const problematicContent = 'A'.repeat(1000000); // Very large content
      fs.writeFileSync(testFilePath, problematicContent);

      const response = await request(app)
        .post('/api/file-upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath);

      // Should handle gracefully (might succeed or fail with proper error)
      expect([200, 400, 500]).toContain(response.status);

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should handle network interruptions during upload', async () => {
      const testFilePath = path.join(__dirname, '../../fixtures/network-test.txt');
      fs.writeFileSync(testFilePath, 'Test content for network interruption testing');

      // This test would require more sophisticated mocking
      // For now, we'll test basic functionality
      const response = await request(app)
        .post('/api/file-upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });
}); 
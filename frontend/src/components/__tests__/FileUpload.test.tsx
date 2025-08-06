import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileUpload from '../FileUpload';
import { apiService } from '../../services/apiService';

// Mock the apiService
jest.mock('../../services/apiService', () => ({
  apiService: {
    getToken: jest.fn(),
    uploadFile: jest.fn(),
    uploadFiles: jest.fn()
  }
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;

describe('FileUpload Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiService.getToken.mockReturnValue('mock-token');
  });

  it('renders file upload interface', () => {
    render(<FileUpload />);
    
    expect(screen.getByText(/drag and drop files/i)).toBeInTheDocument();
    expect(screen.getByText(/browse files/i)).toBeInTheDocument();
  });

  it('shows accepted file types', () => {
    render(<FileUpload />);
    
    expect(screen.getByText(/\.md, \.pdf, \.docx, \.html/)).toBeInTheDocument();
  });

  it('handles file selection via click', () => {
    render(<FileUpload />);
    
    const fileInput = screen.getByTestId('file-input');
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
  });

  it('shows upload progress', async () => {
    mockApiService.uploadFile.mockResolvedValue({
      success: true,
      data: { fileId: 'test-123', originalName: 'test.pdf' }
    });

    render(<FileUpload />);
    
    const fileInput = screen.getByTestId('file-input');
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });
  });

  it('handles upload success', async () => {
    const onUploadComplete = jest.fn();
    mockApiService.uploadFile.mockResolvedValue({
      success: true,
      data: { fileId: 'test-123', originalName: 'test.pdf' }
    });

    render(<FileUpload onUploadComplete={onUploadComplete} />);
    
    const fileInput = screen.getByTestId('file-input');
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalledWith({
        fileId: 'test-123',
        originalName: 'test.pdf'
      });
    });
  });

  it('handles upload error', async () => {
    const onUploadError = jest.fn();
    mockApiService.uploadFile.mockRejectedValue(new Error('Upload failed'));

    render(<FileUpload onUploadError={onUploadError} />);
    
    const fileInput = screen.getByTestId('file-input');
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(onUploadError).toHaveBeenCalledWith('Upload failed');
    });
  });

  it('validates file size', () => {
    render(<FileUpload maxSize={1024} />); // 1KB limit
    
    const fileInput = screen.getByTestId('file-input');
    const largeFile = new File(['x'.repeat(2048)], 'large.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    
    expect(screen.getByText(/file too large/i)).toBeInTheDocument();
  });

  it('validates file type', () => {
    render(<FileUpload acceptedFileTypes={['.pdf', '.docx']} />);
    
    const fileInput = screen.getByTestId('file-input');
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    
    expect(screen.getByText(/file type not supported/i)).toBeInTheDocument();
  });

  it('requires authentication', () => {
    mockApiService.getToken.mockReturnValue(null);
    const onUploadError = jest.fn();

    render(<FileUpload onUploadError={onUploadError} />);
    
    const fileInput = screen.getByTestId('file-input');
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(onUploadError).toHaveBeenCalledWith('Authentication required');
  });
}); 
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileManager from '../FileManager';
import { apiService } from '../../services/apiService';

// Mock the apiService
jest.mock('../../services/apiService', () => ({
  apiService: {
    getToken: jest.fn(),
    getFiles: jest.fn(),
    deleteFile: jest.fn()
  }
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;

const mockFiles = [
  {
    fileId: 'file-1',
    originalName: 'document.pdf',
    fileType: 'pdf',
    fileSize: 1024000,
    metadata: { title: 'Test Document' },
    chromaDocumentId: 'chroma-1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    fileId: 'file-2',
    originalName: 'notes.docx',
    fileType: 'docx',
    fileSize: 512000,
    metadata: { title: 'Meeting Notes' },
    chromaDocumentId: 'chroma-2',
    createdAt: '2024-01-02T00:00:00Z'
  }
];

describe('FileManager Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiService.getToken.mockReturnValue('mock-token');
    mockApiService.getFiles.mockResolvedValue({
      success: true,
      data: {
        files: mockFiles,
        pagination: { pages: 1, current: 1, total: 2 }
      }
    });
  });

  it('renders file manager interface', async () => {
    render(<FileManager />);
    
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('notes.docx')).toBeInTheDocument();
    });
  });

  it('shows file information', async () => {
    render(<FileManager />);
    
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('1.0 MB')).toBeInTheDocument(); // File size
      expect(screen.getByText('PDF')).toBeInTheDocument(); // File type
    });
  });

  it('handles file selection', async () => {
    const onFileSelect = jest.fn();
    render(<FileManager onFileSelect={onFileSelect} />);
    
    await waitFor(() => {
      const fileItem = screen.getByText('document.pdf');
      fireEvent.click(fileItem);
    });
    
    expect(onFileSelect).toHaveBeenCalledWith(mockFiles[0]);
  });

  it('handles file deletion', async () => {
    const onFileDelete = jest.fn();
    mockApiService.deleteFile.mockResolvedValue({
      success: true,
      data: { message: 'File deleted successfully' }
    });

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(<FileManager onFileDelete={onFileDelete} />);
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByText(/delete/i);
      fireEvent.click(deleteButtons[0]);
    });
    
    expect(window.confirm).toHaveBeenCalled();
    expect(mockApiService.deleteFile).toHaveBeenCalledWith('file-1');
    expect(onFileDelete).toHaveBeenCalledWith('file-1');
  });

  it('handles search functionality', async () => {
    render(<FileManager />);
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search files/i);
      fireEvent.change(searchInput, { target: { value: 'document' } });
    });
    
    expect(mockApiService.getFiles).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'document'
      })
    );
  });

  it('handles file type filtering', async () => {
    render(<FileManager />);
    
    await waitFor(() => {
      const typeFilter = screen.getByDisplayValue(/all/i);
      fireEvent.change(typeFilter, { target: { value: 'pdf' } });
    });
    
    expect(mockApiService.getFiles).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'pdf'
      })
    );
  });

  it('handles sorting', async () => {
    render(<FileManager />);
    
    await waitFor(() => {
      const sortSelect = screen.getByDisplayValue(/date/i);
      fireEvent.change(sortSelect, { target: { value: 'name' } });
    });
    
    expect(mockApiService.getFiles).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'name'
      })
    );
  });

  it('shows loading state', () => {
    mockApiService.getFiles.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<FileManager />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state', async () => {
    mockApiService.getFiles.mockResolvedValue({
      success: false,
      error: 'Failed to load files'
    });

    render(<FileManager />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load files/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no files', async () => {
    mockApiService.getFiles.mockResolvedValue({
      success: true,
      data: {
        files: [],
        pagination: { pages: 0, current: 1, total: 0 }
      }
    });

    render(<FileManager />);
    
    await waitFor(() => {
      expect(screen.getByText(/no files found/i)).toBeInTheDocument();
    });
  });

  it('handles pagination', async () => {
    render(<FileManager />);
    
    await waitFor(() => {
      const nextPageButton = screen.getByText(/next/i);
      fireEvent.click(nextPageButton);
    });
    
    expect(mockApiService.getFiles).toHaveBeenCalledWith(
      expect.objectContaining({
        page: '2'
      })
    );
  });

  it('formats file sizes correctly', async () => {
    render(<FileManager />);
    
    await waitFor(() => {
      expect(screen.getByText('1.0 MB')).toBeInTheDocument(); // 1024000 bytes
      expect(screen.getByText('512.0 KB')).toBeInTheDocument(); // 512000 bytes
    });
  });

  it('formats dates correctly', async () => {
    render(<FileManager />);
    
    await waitFor(() => {
      expect(screen.getByText(/jan 1, 2024/i)).toBeInTheDocument();
      expect(screen.getByText(/jan 2, 2024/i)).toBeInTheDocument();
    });
  });
}); 
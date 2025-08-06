import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '@/components/LoadingSpinner'

describe('LoadingSpinner Component', () => {
  it('renders without crashing', () => {
    render(<LoadingSpinner />)
    // Check that the spinner element exists (it would be a div with spinner class)
    expect(document.querySelector('.spinner')).toBeInTheDocument()
  })

  it('displays default loading text', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays custom text when provided', () => {
    render(<LoadingSpinner text="Processing..." />)
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })

  it('hides text when empty string provided', () => {
    render(<LoadingSpinner text="" />)
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('renders with small size', () => {
    render(<LoadingSpinner size="small" />)
    const spinner = document.querySelector('.spinner')
    expect(spinner).toHaveClass('small')
  })

  it('renders with medium size (default)', () => {
    render(<LoadingSpinner size="medium" />)
    const spinner = document.querySelector('.spinner')
    expect(spinner).toHaveClass('medium')
  })

  it('renders with large size', () => {
    render(<LoadingSpinner size="large" />)
    const spinner = document.querySelector('.spinner')
    expect(spinner).toHaveClass('large')
  })

  it('renders with default medium size when no size specified', () => {
    render(<LoadingSpinner />)
    const spinner = document.querySelector('.spinner')
    expect(spinner).toHaveClass('medium')
  })
}) 
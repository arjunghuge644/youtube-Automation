// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Brand, ErrorNotice, Loading, StatusBadge, ProjectArtwork } from './components';

describe('Web UI Components', () => {
  it('renders Brand with studio link', () => {
    render(
      <MemoryRouter>
        <Brand />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText(/creatorflow ai studio home/i)).toBeInTheDocument();
    expect(screen.getByText('CreatorFlow')).toBeInTheDocument();
  });

  it('renders Loading indicator with custom label', () => {
    render(<Loading label="Fetching creative briefs…" />);
    expect(screen.getByRole('status')).toHaveTextContent('Fetching creative briefs…');
  });

  it('renders ErrorNotice and calls retry callback on button click', async () => {
    const handleRetry = vi.fn();
    const user = userEvent.setup();

    render(<ErrorNotice retry={handleRetry}>Network connection lost</ErrorNotice>);

    expect(screen.getByRole('alert')).toHaveTextContent('Network connection lost');
    const retryBtn = screen.getByRole('button', { name: /try again/i });
    await user.click(retryBtn);

    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders StatusBadge with formatted status string', () => {
    const { rerender } = render(<StatusBadge status="DRAFT" />);
    expect(screen.getByText('draft')).toBeInTheDocument();

    rerender(<StatusBadge status="SCRIPT_GENERATING" />);
    expect(screen.getByText('script generating')).toBeInTheDocument();

    rerender(<StatusBadge status="COMPLETED" />);
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('renders ProjectArtwork with aspect ratio label for vertical, landscape, and square', () => {
    const { rerender } = render(<ProjectArtwork aspectRatio="9:16" />);
    expect(screen.getByLabelText(/project format illustration/i)).toBeInTheDocument();
    expect(screen.getByText('9:16')).toBeInTheDocument();

    rerender(<ProjectArtwork aspectRatio="16:9" />);
    expect(screen.getByText('16:9')).toBeInTheDocument();

    rerender(<ProjectArtwork aspectRatio="1:1" />);
    expect(screen.getByText('1:1')).toBeInTheDocument();
  });
});

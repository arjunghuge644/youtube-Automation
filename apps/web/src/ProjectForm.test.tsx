// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectForm } from './ProjectForm';

describe('ProjectForm', () => {
  it('renders with default values and triggers validation for empty inputs', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<ProjectForm onSubmit={handleSubmit} pending={false} />);

    expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /create project/i });
    await user.click(submitBtn);

    // Should not call onSubmit without valid title and prompt
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('submits valid project input', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(<ProjectForm onSubmit={handleSubmit} pending={false} />);

    const titleInput = screen.getByPlaceholderText(/why do traffic jams happen/i);
    const promptInput = screen.getByPlaceholderText(/describe the story you want to tell/i);
    const audienceInput = screen.getByPlaceholderText(/who is this video for/i);

    await user.type(titleInput, 'Understanding Traffic Flow');
    await user.type(promptInput, 'A detailed animation explaining how shockwaves create traffic jams in cities.');
    await user.clear(audienceInput);
    await user.type(audienceInput, 'Urban commuters');

    const submitBtn = screen.getByRole('button', { name: /create project/i });
    await user.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Understanding Traffic Flow',
        prompt: 'A detailed animation explaining how shockwaves create traffic jams in cities.',
        audience: 'Urban commuters',
        category: 'educational',
        aspectRatio: '9:16',
        language: 'hi',
        durationSeconds: 60,
        narrationEnabled: true,
      }),
    );
  });

  it('submits a product promo project with 1:1 aspect ratio and disabled narration', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(<ProjectForm onSubmit={handleSubmit} pending={false} />);

    const titleInput = screen.getByPlaceholderText(/why do traffic jams happen/i);
    const promptInput = screen.getByPlaceholderText(/describe the story you want to tell/i);
    const audienceInput = screen.getByPlaceholderText(/who is this video for/i);
    const categorySelect = screen.getByRole('combobox', { name: /video category/i });
    const squareRadio = screen.getByRole('radio', { name: /square 1:1/i });
    const narrationCheckbox = screen.getByRole('checkbox', { name: /enable voiceover narration/i });

    await user.type(titleInput, 'Smart Audio Pro Commercial');
    await user.type(promptInput, 'A fast-paced product promo for premium headphones with kinetic typography.');
    await user.clear(audienceInput);
    await user.type(audienceInput, 'Audiophiles and commuters');

    await user.selectOptions(categorySelect, 'product_promo');
    await user.click(squareRadio);
    await user.click(narrationCheckbox); // Uncheck narration

    const submitBtn = screen.getByRole('button', { name: /create project/i });
    await user.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Smart Audio Pro Commercial',
        prompt: 'A fast-paced product promo for premium headphones with kinetic typography.',
        audience: 'Audiophiles and commuters',
        category: 'product_promo',
        aspectRatio: '1:1',
        narrationEnabled: false,
      }),
    );
  });

  it('renders error notice when error prop is provided', () => {
    render(<ProjectForm onSubmit={vi.fn()} pending={false} error="Failed to save project brief." />);
    expect(screen.getByText('Failed to save project brief.')).toBeInTheDocument();
  });
});

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { StoryObj } from '@storybook/react';
import {
  BasicFixed,
  ChatMessagesDynamic,
  ControlledScroll,
  DynamicMeasured,
  DynamicStickyResize,
  GroupedStickyOnScroll,
  ScrollToItemByInput,
  SsrFallback,
  StickyHeaderFooter,
  TileRowsWithRandomTiles,
} from './VirtualList.stories';
import {
  BasicFixedGrid,
  ControlledScrollGrid,
  DynamicRows,
  DynamicStickyResizeGrid,
  PinnedColumnOnScroll,
  PinnedRowOnScroll,
  ScrollToCellByInput,
  StickyRowsColumns,
} from './VirtualGrid.stories';

type AnyStory = StoryObj & {
  render?: (args: Record<string, unknown>, context: { globals: { locale: 'ru' | 'en' } }) => React.ReactElement;
  args?: Record<string, unknown>;
};

const storyContext = {
  globals: {
    locale: 'ru' as const,
  },
};

const listCases: [string, AnyStory][] = [
  ['BasicFixed', BasicFixed as AnyStory],
  ['DynamicMeasured', DynamicMeasured as AnyStory],
  ['StickyHeaderFooter', StickyHeaderFooter as AnyStory],
  ['DynamicStickyResize', DynamicStickyResize as AnyStory],
  ['GroupedStickyOnScroll', GroupedStickyOnScroll as AnyStory],
  ['ControlledScroll', ControlledScroll as AnyStory],
  ['ScrollToItemByInput', ScrollToItemByInput as AnyStory],
  ['SsrFallback', SsrFallback as AnyStory],
  ['ChatMessagesDynamic', ChatMessagesDynamic as AnyStory],
  ['TileRowsWithRandomTiles', TileRowsWithRandomTiles as AnyStory],
];

const gridCases: [string, AnyStory][] = [
  ['BasicFixedGrid', BasicFixedGrid as AnyStory],
  ['DynamicRows', DynamicRows as AnyStory],
  ['StickyRowsColumns', StickyRowsColumns as AnyStory],
  ['DynamicStickyResizeGrid', DynamicStickyResizeGrid as AnyStory],
  ['PinnedRowOnScroll', PinnedRowOnScroll as AnyStory],
  ['PinnedColumnOnScroll', PinnedColumnOnScroll as AnyStory],
  ['ControlledScrollGrid', ControlledScrollGrid as AnyStory],
  ['ScrollToCellByInput', ScrollToCellByInput as AnyStory],
];

const renderStoryCase = (story: AnyStory) => {
  if (typeof story.render !== 'function') {
    throw new Error('Story has no render function');
  }

  const StoryRenderer = () => story.render?.(story.args ?? {}, storyContext) ?? null;

  return render(<StoryRenderer />);
};

const findViewport = (container: HTMLElement): HTMLElement | null => {
  const candidates = Array.from(container.querySelectorAll<HTMLElement>('div'));
  return candidates.find((element) => element.style.overflow === 'auto') ?? null;
};

const assertVirtualBodyAndScroll = async (container: HTMLElement) => {
  await waitFor(() => {
    expect(container.querySelector('[data-virtual-layer="body"]')).toBeTruthy();
  });

  const viewport = findViewport(container);
  if (!viewport) {
    return;
  }

  await act(async () => {
    viewport.scrollTop = 220;
    viewport.scrollLeft = 180;
    fireEvent.scroll(viewport);
    await Promise.resolve();
  });

  await waitFor(() => {
    expect(container.querySelector('[data-virtual-layer="body"]')).toBeTruthy();
  });
};

describe('Playwright e2e: VirtualList Storybook cases', () => {
  it.each(listCases)('renders %s and survives scroll', async (_name, story) => {
    const { container } = renderStoryCase(story);
    await assertVirtualBodyAndScroll(container);
  });
});

describe('Playwright e2e: VirtualGrid Storybook cases', () => {
  it.each(gridCases)('renders %s and survives scroll', async (_name, story) => {
    const { container } = renderStoryCase(story);
    await assertVirtualBodyAndScroll(container);
  });
});

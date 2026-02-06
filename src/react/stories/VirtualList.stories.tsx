import type { Meta, StoryObj } from '@storybook/react';
import React, { useMemo, useState } from 'react';
import { VirtualList } from '../VirtualList';
import type { VirtualListProps } from '../types';
import type { ListItem } from './storyData';
import { createListItems, getListItemHeight, resolveStoryLocale, storyText, type StoryLocale } from './storyData';

const viewportStyle: React.CSSProperties = {
  height: 360,
  width: 320,
  border: '1px solid #e0e0e0',
  borderRadius: 8,
  background: '#fff',
  overflow: 'auto',
  boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  boxSizing: 'border-box',
  borderBottom: '1px solid #f0f0f0',
  fontSize: 14,
};

const meta: Meta<React.ComponentType<VirtualListProps<ListItem>>> = {
  title: 'Компоненты/VirtualList',
  component: VirtualList as React.ComponentType<VirtualListProps<ListItem>>,
  tags: ['autodocs'],
  args: {
    overscan: 2,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;
type StoryListProps = VirtualListProps<ListItem>;

const BaseList = ({
  locale,
  ...props
}: Omit<VirtualListProps<{ id: number; label: string }>, 'items' | 'itemKey'> & { locale: StoryLocale }) => {
  const items = useMemo(() => createListItems(200, locale), [locale]);

  return (
    <VirtualList
      {...props}
      items={items}
      itemKey={(item) => item.id}
      renderItem={({ item, index }) => (
        <div style={{ ...itemStyle, height: props.layout?.sizeMode === 'dynamic' ? getListItemHeight(index) : undefined }}>
          {item.label}
        </div>
      )}
      style={viewportStyle}
    />
  );
};

export const BasicFixed: Story = {
  name: 'Базовый фиксированный размер',
  render: (args: StoryListProps, context) => (
    <BaseList
      {...args}
      locale={resolveStoryLocale(context.globals.locale)}
      layout={{ sizeMode: 'fixed', itemSize: 36, direction: 'vertical' }}
    />
  ),
};

export const DynamicMeasured: Story = {
  name: 'Динамический размер',
  render: (args: StoryListProps, context) => (
    <BaseList
      {...args}
      locale={resolveStoryLocale(context.globals.locale)}
      layout={{ sizeMode: 'dynamic', estimatedItemSize: 36, direction: 'vertical' }}
    />
  ),
};

export const StickyHeaderFooter: Story = {
  name: 'Закрепленные верх и низ',
  render: (args: StoryListProps, context) => {
    const locale = resolveStoryLocale(context.globals.locale);

    return (
    <BaseList
      {...args}
      locale={locale}
      layout={{ sizeMode: 'fixed', itemSize: 36, direction: 'vertical' }}
      sticky={{
        top: 1,
        bottom: 1,
        renderStickyTop: ({ items }) => (
          <div style={{ ...itemStyle, height: 36, background: '#fff7e6', fontWeight: 600 }}>
            {items[0]?.label} ({storyText.sticky(locale)})
          </div>
        ),
        renderStickyBottom: ({ items }) => (
          <div style={{ ...itemStyle, height: 36, background: '#f6ffed', fontWeight: 600 }}>
            {items[0]?.label} ({storyText.sticky(locale)})
          </div>
        ),
      }}
    />
    );
  },
};

export const ControlledScroll: Story = {
  name: 'Контролируемая прокрутка',
  render: (args: StoryListProps, context) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const locale = resolveStoryLocale(context.globals.locale);

    return (
      <div>
        <div style={{ marginBottom: 8, fontSize: 12, color: '#555' }}>
          {storyText.scrollTop(locale)}: {Math.round(position.top)}
        </div>
        <BaseList
          {...args}
          locale={locale}
          layout={{ sizeMode: 'fixed', itemSize: 36, direction: 'vertical' }}
          scroll={{
            position,
            onScroll: (next) => setPosition(next),
          }}
        />
      </div>
    );
  },
};

export const SsrFallback: Story = {
  name: 'SSR fallback',
  render: (args: StoryListProps, context) => (
    <BaseList
      {...args}
      locale={resolveStoryLocale(context.globals.locale)}
      layout={{ sizeMode: 'fixed', itemSize: 36, direction: 'vertical' }}
      ssr={{ count: 6 }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: storyText.ssrDescription('ru'),
      },
    },
  },
};

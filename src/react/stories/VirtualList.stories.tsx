import type { Meta, StoryObj } from '@storybook/react';
import React, { useMemo, useRef, useState } from 'react';
import { VirtualList } from '../VirtualList';
import type { VirtualListHandle, VirtualListProps } from '../types';
import type { ChatMessage, ListItem, TileRow } from './storyData';
import {
  createChatMessages,
  createListItems,
  createTileRows,
  getListItemHeight,
  resolveStoryLocale,
  storyText,
  type StoryLocale,
} from './storyData';

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

const chatViewportStyle: React.CSSProperties = {
  ...viewportStyle,
  width: 420,
  height: 420,
  background: '#f5f7fb',
};

const chatRowStyle: React.CSSProperties = {
  display: 'flex',
  width: '100%',
  boxSizing: 'border-box',
  padding: '6px 10px',
};

const chatBubbleBaseStyle: React.CSSProperties = {
  maxWidth: '82%',
  borderRadius: 12,
  padding: '8px 10px',
  lineHeight: 1.35,
  boxSizing: 'border-box',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
};

const chatAuthorStyle: React.CSSProperties = {
  fontSize: 11,
  marginBottom: 4,
  opacity: 0.8,
  fontWeight: 600,
};

const chatTextStyle: React.CSSProperties = {
  fontSize: 13,
  whiteSpace: 'normal',
  overflowWrap: 'anywhere',
};

const chatTimeStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 10,
  opacity: 0.65,
  textAlign: 'right',
};

const tileViewportStyle: React.CSSProperties = {
  ...viewportStyle,
  width: 560,
  height: 380,
  background: '#fbfbfd',
};

const tileRowContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  boxSizing: 'border-box',
  padding: '8px 10px',
  borderBottom: '1px solid #f0f0f4',
};

const tileRowTitleStyle: React.CSSProperties = {
  width: 86,
  flexShrink: 0,
  alignSelf: 'flex-start',
  paddingTop: 3,
  fontSize: 12,
  color: '#5a6475',
  fontWeight: 600,
};

const tileRowItemsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: 6,
  minWidth: 0,
  whiteSpace: 'normal',
};

const tileItemStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  height: 20,
  padding: '0 8px',
  borderRadius: 999,
  fontSize: 11,
  color: '#1f2a3d',
  background: '#e7efff',
  border: '1px solid #d3e0ff',
};

const ChatList = ({
  locale,
  ...props
}: Omit<VirtualListProps<ChatMessage>, 'items' | 'itemKey' | 'renderItem'> & { locale: StoryLocale }) => {
  const items = useMemo(() => createChatMessages(1500, locale), [locale]);

  return (
    <VirtualList
      {...props}
      items={items}
      itemKey={(item) => item.id}
      renderItem={({ item }) => {
        const isIncoming = item.direction === 'incoming';
        return (
          <div style={{ ...chatRowStyle, justifyContent: isIncoming ? 'flex-start' : 'flex-end' }}>
            <div
              style={{
                ...chatBubbleBaseStyle,
                background: isIncoming ? '#ffffff' : '#d9f6dc',
                border: `1px solid ${isIncoming ? '#e4e7ef' : '#bde8c2'}`,
              }}
            >
              <div style={chatAuthorStyle}>{item.author}</div>
              <div style={chatTextStyle}>{item.text}</div>
              <div style={chatTimeStyle}>{item.time}</div>
            </div>
          </div>
        );
      }}
      style={chatViewportStyle}
    />
  );
};

const TileRowsList = ({
  locale,
  ...props
}: Omit<VirtualListProps<TileRow>, 'items' | 'itemKey' | 'renderItem'> & { locale: StoryLocale }) => {
  const items = useMemo(() => createTileRows(2000, locale), [locale]);

  return (
    <VirtualList
      {...props}
      items={items}
      itemKey={(item) => item.id}
      renderItem={({ item }) => (
        <div style={tileRowContainerStyle}>
          <div style={tileRowTitleStyle}>{item.title}</div>
          <div style={tileRowItemsStyle}>
            {item.tiles.map((tile) => (
              <span
                key={tile}
                style={tileItemStyle}
              >
                {tile}
              </span>
            ))}
          </div>
        </div>
      )}
      style={tileViewportStyle}
    />
  );
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

type GroupedListRow = {
  id: string;
  kind: 'group' | 'item';
  groupLabel: string;
  label: string;
};

const createGroupedRows = (locale: StoryLocale): GroupedListRow[] => {
  const rows: GroupedListRow[] = [];
  const groupPrefix = locale === 'ru' ? 'Группа' : 'Group';
  const childPrefix = locale === 'ru' ? 'Элемент' : 'Item';

  for (let groupIndex = 1; groupIndex <= 24; groupIndex += 1) {
    const groupLabel = `${groupPrefix} ${groupIndex}`;
    rows.push({
      id: `group-${groupIndex}`,
      kind: 'group',
      groupLabel,
      label: groupLabel,
    });

    const childCount = 5 + (groupIndex % 4);
    for (let childIndex = 1; childIndex <= childCount; childIndex += 1) {
      rows.push({
        id: `group-${groupIndex}-item-${childIndex}`,
        kind: 'item',
        groupLabel,
        label: `${childPrefix} ${groupIndex}.${childIndex}`,
      });
    }
  }

  return rows;
};

const findActiveGroup = (rows: readonly GroupedListRow[], startIndex: number): GroupedListRow | undefined => {
  const safeStart = Math.max(0, Math.min(startIndex, rows.length - 1));
  for (let index = safeStart; index >= 0; index -= 1) {
    if (rows[index]?.kind === 'group') {
      return rows[index];
    }
  }

  return rows[0];
};

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
        <div style={{ ...itemStyle, height: props.layout?.sizeMode === 'dynamic' ? getListItemHeight(index) : '100%' }}>
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

export const DynamicStickyResize: Story = {
  name: 'Dynamic sticky resize check',
  render: (args: StoryListProps, context) => {
    const locale = resolveStoryLocale(context.globals.locale);
    const [isExpanded, setIsExpanded] = useState(false);

    const topHeight = isExpanded ? 84 : 40;
    const bottomHeight = isExpanded ? 68 : 36;

    return (
      <div>
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <button
            type='button'
            onClick={() => setIsExpanded((value) => !value)}
            style={{ padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
          >
            {isExpanded ? 'Use compact sticky' : 'Use expanded sticky'}
          </button>
          <span style={{ color: '#555' }}>
            top: {topHeight}px, bottom: {bottomHeight}px
          </span>
        </div>

        <BaseList
          {...args}
          locale={locale}
          layout={{ sizeMode: 'dynamic', estimatedItemSize: 36, direction: 'vertical' }}
          sticky={{
            top: 1,
            bottom: 1,
            renderStickyTop: ({ items }) => (
              <div
                style={{
                  ...itemStyle,
                  height: topHeight,
                  background: '#fff7e6',
                  fontWeight: 600,
                  alignItems: 'flex-start',
                  paddingTop: 8,
                }}
              >
                {items[0]?.label} ({storyText.sticky(locale)})
              </div>
            ),
            renderStickyBottom: ({ items }) => (
              <div
                style={{
                  ...itemStyle,
                  height: bottomHeight,
                  background: '#f6ffed',
                  fontWeight: 600,
                  alignItems: 'flex-start',
                  paddingTop: 8,
                }}
              >
                {items[0]?.label} ({storyText.sticky(locale)})
              </div>
            ),
          }}
        />
      </div>
    );
  },
};

export const GroupedStickyOnScroll: Story = {
  name: 'Grouped list with sticky active group',
  render: (_args: StoryListProps, context) => {
    const locale = resolveStoryLocale(context.globals.locale);
    const rows = useMemo(() => createGroupedRows(locale), [locale]);
    const [activeGroupLabel, setActiveGroupLabel] = useState(() => findActiveGroup(rows, 0)?.groupLabel ?? '');

    return (
      <div style={{ position: 'relative', width: 320 }}>
        <VirtualList
          items={rows}
          itemKey={(item) => item.id}
          renderItem={({ item }) =>
            item.kind === 'group' ? (
              <div
                style={{
                  ...itemStyle,
                  height: 36,
                  background: '#e6f4ff',
                  borderBottom: '1px solid #cde4ff',
                  color: '#12325f',
                  fontWeight: 700,
                }}
              >
                {item.groupLabel}
              </div>
            ) : (
              <div
                style={{
                  ...itemStyle,
                  height: 32,
                  paddingLeft: 28,
                  color: '#2f3e52',
                }}
              >
                {item.label}
              </div>
            )
          }
          layout={{ sizeMode: 'dynamic', estimatedItemSize: 32, direction: 'vertical' }}
          overscan={0}
          onRangeChange={({ items }) => {
            const nextGroup = findActiveGroup(rows, items.start);
            if (nextGroup) {
              setActiveGroupLabel(nextGroup.groupLabel);
            }
          }}
          style={viewportStyle}
        />

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            boxSizing: 'border-box',
            pointerEvents: 'none',
            zIndex: 4,
            background: '#d3ebff',
            borderBottom: '1px solid #b7d9ff',
            color: '#12325f',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {activeGroupLabel}
        </div>
      </div>
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

export const ScrollToItemByInput: Story = {
  name: 'Прокрутка к элементу',
  render: (args: StoryListProps, context) => {
    const locale = resolveStoryLocale(context.globals.locale);
    const items = useMemo(() => createListItems(200, locale), [locale]);
    const listRef = useRef<VirtualListHandle>(null);
    const [inputValue, setInputValue] = useState('1');

    const handleGoToIndex = () => {
      const parsedValue = Number.parseInt(inputValue, 10);
      if (Number.isNaN(parsedValue)) {
        return;
      }

      const clampedIndex = Math.min(Math.max(parsedValue, 1), items.length);
      if (clampedIndex !== parsedValue) {
        setInputValue(String(clampedIndex));
      }

      listRef.current?.scrollToIndex(clampedIndex - 1, { align: 'start', behavior: 'auto' });
    };

    return (
      <div>
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span>{storyText.goToItem(locale)}:</span>
          <label htmlFor='scroll-to-item-input'>{storyText.itemIndex(locale)}</label>
          <input
            id='scroll-to-item-input'
            type='number'
            min={1}
            max={items.length}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleGoToIndex();
              }
            }}
            style={{ width: 92, padding: '4px 6px', fontSize: 12 }}
          />
          <button
            type='button'
            onClick={handleGoToIndex}
            style={{ padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
          >
            {storyText.go(locale)}
          </button>
          <span style={{ color: '#555' }}>{storyText.itemRangeHint(locale, items.length)}</span>
        </div>
        <VirtualList
          {...args}
          ref={listRef}
          items={items}
          itemKey={(item) => item.id}
          renderItem={({ item }) => <div style={{ ...itemStyle, height: 36 }}>{item.label}</div>}
          layout={{ sizeMode: 'fixed', itemSize: 36, direction: 'vertical' }}
          style={viewportStyle}
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

export const ChatMessagesDynamic: Story = {
  name: 'Чат с сообщениями (dynamic)',
  render: (_args: StoryListProps, context) => {
    const locale = resolveStoryLocale(context.globals.locale);

    return (
      <ChatList
        locale={locale}
        layout={{ sizeMode: 'dynamic', estimatedItemSize: 70, direction: 'vertical' }}
        overscan={3}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: storyText.chatStoryDescription('ru'),
      },
    },
  },
};

export const TileRowsWithRandomTiles: Story = {
  name: 'Строки со случайным количеством плиток',
  render: (_args: StoryListProps, context) => (
    <TileRowsList
      locale={resolveStoryLocale(context.globals.locale)}
      layout={{ sizeMode: 'dynamic', estimatedItemSize: 46, direction: 'vertical' }}
      overscan={4}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: storyText.tilesStoryDescription('ru'),
      },
    },
  },
};

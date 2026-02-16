import type { Meta, StoryObj } from '@storybook/react';
import React, { useRef, useState } from 'react';
import { VirtualGrid } from '../VirtualGrid';
import type { AxisConfig } from '../../shared/types';
import type { VirtualGridHandle } from '../types';
import {
  formatCellLabel,
  getColumnWidth,
  getRowHeight,
  resolveStoryLocale,
  storyText,
  type StoryLocale,
} from './storyData';

const viewportStyle: React.CSSProperties = {
  height: 360,
  width: 520,
  border: '1px solid #e0e0e0',
  borderRadius: 8,
  background: '#fff',
  overflow: 'auto',
  boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
};

const cellStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  color: '#333',
  border: '1px solid #f0f0f0',
  boxSizing: 'border-box',
  background: '#fafafa',
};

const meta: Meta<typeof VirtualGrid> = {
  title: 'Компоненты/VirtualGrid',
  component: VirtualGrid,
  tags: ['autodocs'],
  args: {
    overscan: 1,
  },
};

export default meta;

type Story = StoryObj<typeof VirtualGrid>;

const BaseGrid = ({
  rows,
  columns,
  rowCount,
  columnCount,
  locale,
}: {
  rows: AxisConfig;
  columns: AxisConfig;
  rowCount: number;
  columnCount: number;
  locale: StoryLocale;
}) => {
  return (
    <VirtualGrid
      rowCount={rowCount}
      columnCount={columnCount}
      rows={rows}
      columns={columns}
      renderCell={({ rowIndex, columnIndex }) => (
        <div
          style={{
            ...cellStyle,
            height: rows.sizeMode === 'dynamic' ? getRowHeight(rowIndex) : undefined,
            width: columns.sizeMode === 'dynamic' ? getColumnWidth(columnIndex) : undefined,
          }}
        >
          {formatCellLabel(rowIndex, columnIndex, locale)}
        </div>
      )}
      style={viewportStyle}
    />
  );
};

export const BasicFixedGrid: Story = {
  name: 'Базовая фиксированная сетка',
  render: (_args, context) => (
    <BaseGrid
      rowCount={200}
      columnCount={40}
      rows={{ sizeMode: 'fixed', itemSize: 36 }}
      columns={{ sizeMode: 'fixed', itemSize: 120 }}
      locale={resolveStoryLocale(context.globals.locale)}
    />
  ),
};

export const DynamicRows: Story = {
  name: 'Динамические строки',
  render: (_args, context) => (
    <BaseGrid
      rowCount={120}
      columnCount={20}
      rows={{ sizeMode: 'dynamic', estimatedItemSize: 40 }}
      columns={{ sizeMode: 'fixed', itemSize: 120 }}
      locale={resolveStoryLocale(context.globals.locale)}
    />
  ),
};

export const StickyRowsColumns: Story = {
  name: 'Закрепленные строки и колонки',
  render: (_args, context) => {
    const locale = resolveStoryLocale(context.globals.locale);

    return (
      <VirtualGrid
        rowCount={100}
        columnCount={20}
        rows={{ sizeMode: 'fixed', itemSize: 36 }}
        columns={{ sizeMode: 'fixed', itemSize: 120 }}
        sticky={{
          top: 1,
          left: 1,
          renderTopStickyRow: ({ rowIndex }) => (
            <div style={{ ...cellStyle, height: 36, background: '#fff7e6', fontWeight: 600 }}>
              {storyText.header(locale, rowIndex + 1)}
            </div>
          ),
          renderLeftStickyColumn: ({ columnIndex }) => (
            <div style={{ ...cellStyle, width: 120, background: '#f6ffed', fontWeight: 600 }}>
              {storyText.column(locale, columnIndex + 1)}
            </div>
          ),
          renderCorner: ({ corner }) => (
            <div style={{ ...cellStyle, background: '#e6f7ff', fontWeight: 700 }}>{corner.toUpperCase()}</div>
          ),
        }}
        renderCell={({ rowIndex, columnIndex }) => (
          <div style={cellStyle}>{formatCellLabel(rowIndex, columnIndex, locale)}</div>
        )}
        style={viewportStyle}
      />
    );
  },
};

export const ControlledScrollGrid: Story = {
  name: 'Контролируемая прокрутка',
  render: (_args, context) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const locale = resolveStoryLocale(context.globals.locale);

    return (
      <div>
        <div style={{ marginBottom: 8, fontSize: 12, color: '#555' }}>
          {storyText.scroll(locale)}: {Math.round(position.top)} / {Math.round(position.left)}
        </div>
        <VirtualGrid
          rowCount={80}
          columnCount={30}
          rows={{ sizeMode: 'fixed', itemSize: 36 }}
          columns={{ sizeMode: 'fixed', itemSize: 120 }}
          renderCell={({ rowIndex, columnIndex }) => (
            <div style={cellStyle}>{formatCellLabel(rowIndex, columnIndex, locale)}</div>
          )}
          scroll={{
            position,
            onScroll: (next) => setPosition(next),
          }}
          style={viewportStyle}
        />
      </div>
    );
  },
};

export const ScrollToCellByInput: Story = {
  name: 'Прокрутка к ячейке',
  render: (_args, context) => {
    const rowCount = 80;
    const columnCount = 30;
    const locale = resolveStoryLocale(context.globals.locale);
    const gridRef = useRef<VirtualGridHandle>(null);
    const [rowValue, setRowValue] = useState('1');
    const [columnValue, setColumnValue] = useState('1');

    const handleGoToCell = () => {
      const parsedRow = Number.parseInt(rowValue, 10);
      const parsedColumn = Number.parseInt(columnValue, 10);
      if (Number.isNaN(parsedRow) || Number.isNaN(parsedColumn)) {
        return;
      }

      const clampedRow = Math.min(Math.max(parsedRow, 1), rowCount);
      const clampedColumn = Math.min(Math.max(parsedColumn, 1), columnCount);

      if (clampedRow !== parsedRow) {
        setRowValue(String(clampedRow));
      }
      if (clampedColumn !== parsedColumn) {
        setColumnValue(String(clampedColumn));
      }

      gridRef.current?.scrollToCell(clampedRow - 1, clampedColumn - 1, { align: 'start', behavior: 'auto' });
    };

    return (
      <div>
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, flexWrap: 'wrap' }}>
          <span>{storyText.goToCell(locale)}:</span>
          <label htmlFor='scroll-to-row-input'>{storyText.rowIndex(locale)}</label>
          <input
            id='scroll-to-row-input'
            type='number'
            min={1}
            max={rowCount}
            value={rowValue}
            onChange={(event) => setRowValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleGoToCell();
              }
            }}
            style={{ width: 84, padding: '4px 6px', fontSize: 12 }}
          />
          <label htmlFor='scroll-to-column-input'>{storyText.columnIndex(locale)}</label>
          <input
            id='scroll-to-column-input'
            type='number'
            min={1}
            max={columnCount}
            value={columnValue}
            onChange={(event) => setColumnValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleGoToCell();
              }
            }}
            style={{ width: 84, padding: '4px 6px', fontSize: 12 }}
          />
          <button
            type='button'
            onClick={handleGoToCell}
            style={{ padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
          >
            {storyText.go(locale)}
          </button>
          <span style={{ color: '#555' }}>{storyText.rowRangeHint(locale, rowCount)}</span>
          <span style={{ color: '#555' }}>{storyText.columnRangeHint(locale, columnCount)}</span>
        </div>
        <VirtualGrid
          ref={gridRef}
          rowCount={rowCount}
          columnCount={columnCount}
          rows={{ sizeMode: 'fixed', itemSize: 36 }}
          columns={{ sizeMode: 'fixed', itemSize: 120 }}
          renderCell={({ rowIndex, columnIndex }) => (
            <div style={cellStyle}>{formatCellLabel(rowIndex, columnIndex, locale)}</div>
          )}
          style={viewportStyle}
        />
      </div>
    );
  },
};

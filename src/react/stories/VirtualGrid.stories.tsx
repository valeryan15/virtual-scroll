import type { Meta, StoryObj } from '@storybook/react';
import React, { useMemo, useState } from 'react';
import { VirtualGrid } from '../VirtualGrid';
import type { AxisConfig } from '../../shared/types';
import { formatCellLabel, getColumnWidth, getRowHeight } from './storyData';

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
  title: 'Components/VirtualGrid',
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
}: {
  rows: AxisConfig;
  columns: AxisConfig;
  rowCount: number;
  columnCount: number;
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
          {formatCellLabel(rowIndex, columnIndex)}
        </div>
      )}
      style={viewportStyle}
    />
  );
};

export const BasicFixedGrid: Story = {
  render: () => (
    <BaseGrid
      rowCount={200}
      columnCount={40}
      rows={{ sizeMode: 'fixed', itemSize: 36 }}
      columns={{ sizeMode: 'fixed', itemSize: 120 }}
    />
  ),
};

export const DynamicRows: Story = {
  render: () => (
    <BaseGrid
      rowCount={120}
      columnCount={20}
      rows={{ sizeMode: 'dynamic', estimatedItemSize: 40 }}
      columns={{ sizeMode: 'fixed', itemSize: 120 }}
    />
  ),
};

export const StickyRowsColumns: Story = {
  render: () => (
    <VirtualGrid
      rowCount={100}
      columnCount={20}
      rows={{ sizeMode: 'fixed', itemSize: 36 }}
      columns={{ sizeMode: 'fixed', itemSize: 120 }}
      sticky={{
        top: 1,
        left: 1,
        renderTopStickyRow: ({ rowIndex }) => (
          <div style={{ ...cellStyle, height: 36, background: '#fff7e6', fontWeight: 600 }}>Header {rowIndex + 1}</div>
        ),
        renderLeftStickyColumn: ({ columnIndex }) => (
          <div style={{ ...cellStyle, width: 120, background: '#f6ffed', fontWeight: 600 }}>Col {columnIndex + 1}</div>
        ),
        renderCorner: ({ corner }) => (
          <div style={{ ...cellStyle, background: '#e6f7ff', fontWeight: 700 }}>{corner.toUpperCase()}</div>
        ),
      }}
      renderCell={({ rowIndex, columnIndex }) => <div style={cellStyle}>{formatCellLabel(rowIndex, columnIndex)}</div>}
      style={viewportStyle}
    />
  ),
};

export const ControlledScrollGrid: Story = {
  render: () => {
    const [position, setPosition] = useState({ top: 0, left: 0 });

    return (
      <div>
        <div style={{ marginBottom: 8, fontSize: 12, color: '#555' }}>
          Scroll: {Math.round(position.top)} / {Math.round(position.left)}
        </div>
        <VirtualGrid
          rowCount={80}
          columnCount={30}
          rows={{ sizeMode: 'fixed', itemSize: 36 }}
          columns={{ sizeMode: 'fixed', itemSize: 120 }}
          renderCell={({ rowIndex, columnIndex }) => (
            <div style={cellStyle}>{formatCellLabel(rowIndex, columnIndex)}</div>
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

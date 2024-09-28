import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import React, { useMemo, useState } from 'react';
import css from './EditListingBatchProductDetails.module.css';
import { H3 } from '../../../../components';
import { FormattedMessage } from '../../../../util/reactIntl';
import { EditableTableCell } from '../../../../components/EditableTableCell/EditableTableCell';

function getListingFieldOptions(config, listingFieldKey) {
  const { listing } = config;
  const { listingFields } = listing;
  const { enumOptions } = listingFields.find(f => f.key === listingFieldKey);
  return enumOptions.map(({ label, option }) => ({ value: option, label }));
}

export const EditListingBatchProductDetails = props => {
  const { uppy, config } = props;

  const imageryCategoryOptions = getListingFieldOptions(config, 'imageryCategory');
  const usageOptions = getListingFieldOptions(config, 'usage');
  const releaseOptions = getListingFieldOptions(config, 'releases');

  const [data] = useState(uppy.getFiles());
  const columnHelper = createColumnHelper();
  const fileCount = data.length;

  const columns = useMemo(
    () => [
      columnHelper.accessor('preview', {
        header: 'Thumbnail',
        cell: info => <img alt="Thumbnail" src={info.getValue()} />,
      }),
      columnHelper.accessor('name', {
        header: 'File Name',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('name', {
        id: 'title',
        header: 'Title',
        cell: EditableTableCell,
        meta: {
          type: 'input',
          inputType: 'text',
        },
      }),
      columnHelper.display({
        header: 'Description',
        cell: EditableTableCell,
        meta: {
          type: 'input',
          inputType: 'text',
        },
      }),
      columnHelper.display({
        header: 'Category',
        cell: EditableTableCell,
        meta: {
          type: 'select',
          isMulti: true,
          options: imageryCategoryOptions,
        },
      }),
      columnHelper.display({
        header: 'Usage',
        cell: EditableTableCell,
        meta: {
          type: 'select',
          defaultValue: 'editorial',
          options: usageOptions,
        },
      }),
      columnHelper.display({
        header: 'Do you have releases on file / can you obtain them?',
        cell: EditableTableCell,
        meta: releaseOptions,
      }),
      columnHelper.accessor('meta.keywords', {
        header: 'Keywords (max 10)',
        cell: EditableTableCell,
        meta: {
          type: 'input',
          inputType: 'text',
        },
      }),
      columnHelper.display({
        header: 'Dimensions',
        cell: ({ row }) => {
          if (row.original.meta?.width && row.original.meta?.height) {
            return `${row.original.meta.width}px x ${row.original.meta.height} px`;
          }
          return '';
        },
      }),
      columnHelper.accessor('size', {
        header: 'Size',
        cell: info => `${(info.getValue() / 1024).toFixed(2)} KB`,
      }),
      columnHelper.display({
        header: 'Price',
        cell: EditableTableCell,
        meta: {
          type: 'input',
          inputType: 'number',
        },
      }),
    ],
    [fileCount]
  );

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    defaultColumn: {
      minSize: 100,
      size: 250,
    },
  });

  return (
    <div className={css.root}>
      <H3 as="h1">
        <FormattedMessage id="BatchEditListingProductDetails.title" />
        <p>
          <FormattedMessage id="BatchEditListingProductDetails.subtitle" />
        </p>
        <p>
          <FormattedMessage id="BatchEditListingProductDetails.warningRefresh" />
        </p>
      </H3>
      <table
        className={css.productsTable}
        {...{
          style: {
            width: table.getCenterTotalSize(),
          },
        }}
      >
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                return (
                  <th
                    {...{
                      key: header.id,
                      colSpan: header.colSpan,
                      style: {
                        width: header.getSize(),
                      },
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div>{flexRender(header.column.columnDef.header, header.getContext())}</div>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => {
            return (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => {
                  return (
                    <td
                      {...{
                        key: cell.id,
                        style: {
                          width: cell.column.getSize(),
                        },
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

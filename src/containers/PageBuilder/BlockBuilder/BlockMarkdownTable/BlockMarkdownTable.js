import React from 'react';
import css from './BlockMarkdownTable.module.css';

const parseMarkdownTable = markdown => {
  if (!markdown) return null;
  const lines = markdown
    .trim()
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;

  const parseRow = line =>
    line
      .replace(/^\||\|$/g, '')
      .split('|')
      .map(cell => cell.trim());

  const isSeparator = line => /^[\s|:\-]+$/.test(line);

  const headers = parseRow(lines[0]);
  if (!isSeparator(lines[1])) return null;

  const rows = lines.slice(2).map(parseRow);
  return { headers, rows };
};

const BlockMarkdownTable = ({ blockId, text }) => {
  const content = text?.content || text;
  const table = parseMarkdownTable(content);
  if (!table) return null;

  return (
    <div id={blockId} className={css.root}>
      <table className={css.table}>
        <thead>
          <tr>
            {table.headers.map((h, i) => (
              <th key={i} className={css.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? css.rowEven : css.rowOdd}>
              {row.map((cell, ci) => (
                <td key={ci} className={css.td}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BlockMarkdownTable;

import React from 'react';
import { Field } from 'react-final-form';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { generatePresignedUrl } from '../../util/api';

import css from './FieldMediaUpload.module.css';
import { IconSpinner, ValidationError } from '..';
import { FormattedMessage } from 'react-intl';

const ACCEPT_DEFAULT = 'image/*,video/*';

const isVideo = item => {
  if (item?.id) return item.id.startsWith('video');
  if (item?.file?.type) return item.file.type.startsWith('video/');
  if (item?.url) return item.url.endsWith('.mp4');
};

const MediaThumb = props => {
  const { item, onRemove, dragAttributes, dragListeners, isDragging } = props;
  const video = isVideo(item);
  return (
    <div className={css.thumb} data-dragging={isDragging ? 'true' : 'false'}>
      <div className={css.thumbControls}>
        <button
          type="button"
          className={css.dragHandle}
          {...dragAttributes}
          {...dragListeners}
          aria-label="Drag"
        >
          <svg viewBox="0 0 20 20" width="12">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
          </svg>
        </button>
        <button
          type="button"
          className={css.removeBtn}
          onClick={() => onRemove(item.id)}
          aria-label="Remove"
        >
          ×
        </button>
      </div>
      <div className={css.mediaBox}>
        {video ? (
          <video className={css.media} src={item.url} muted autoPlay controls />
        ) : (
          <img className={css.media} src={item.url} alt={item.id} />
        )}
        {item.inProgress ? (
          <div className={css.progress}>
            <IconSpinner />
          </div>
        ) : null}
      </div>
    </div>
  );
};

const SortableThumb = props => {
  const { item, onRemove, status } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className={css.thumbWrapper}>
      <MediaThumb
        item={item}
        onRemove={onRemove}
        dragAttributes={attributes}
        dragListeners={listeners}
        isDragging={isDragging}
        status={status}
      />
    </div>
  );
};

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const FieldMediaUploadComponent = props => {
  const {
    className,
    accept = ACCEPT_DEFAULT,
    multiple = true,
    maxItems,
    disabled,
    storagePath = 'uploads',
    input,
    meta,
  } = props;

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));
  const items = input.value || [];
  const handleAdd = async event => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    const newItems = files.map(file => ({
      id: `${file.type}-${generateUUID()}`,
      file: file,
      inProgress: true,
      url: URL.createObjectURL(file),
    }));

    const nextItems = [...items, ...newItems];
    input.onChange(nextItems);

    const filesPayload = newItems.map(file => ({ name: file.id, type: file.file.type }));
    const payload = { files: filesPayload, storagePath };

    const resp = await generatePresignedUrl(payload);
    const updatedItems = nextItems.map(item => {
      const presignedInfo = resp.find(file => file.originalName === item.id);
      return { ...item, presignedInfo, inProgress: false };
    });

    input.onChange(updatedItems);

    event.target.value = '';
  };

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(items, oldIndex, newIndex);
    input.onChange(next);
  };

  const onRemove = id => {
    const next = items.filter(i => i.id !== id);
    input.onChange(next);
  };

  const ids = items.map(it => it.id);
  return (
    <div className={[css.root, className].filter(Boolean).join(' ')}>
      <div className={css.controlsRow}>
        <label className={css.addBtn}>
          <input
            className={css.input}
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            onChange={handleAdd}
          />
          <span>
            + <FormattedMessage id="FieldMediaUpload.addMedia" />
          </span>
        </label>
        {maxItems ? (
          <span className={css.hint}>
            {input.value.length}/{maxItems}
          </span>
        ) : null}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids}>
          <div className={css.list}>
            {items.map(it => (
              <SortableThumb key={it.id} item={it} onRemove={onRemove} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <ValidationError fieldMeta={meta} />
    </div>
  );
};

/**
 * Field component that uses file-input to allow user to select images or videos.
 */
const FieldMediaUpload = props => {
  return <Field component={FieldMediaUploadComponent} {...props} />;
};

export default FieldMediaUpload;

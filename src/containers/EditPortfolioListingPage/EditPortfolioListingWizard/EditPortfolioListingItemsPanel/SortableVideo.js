import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import css from './SortableImages.module.css';

const SortableVideo = ({ id, children, dragHandle }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={css.sortableImageWrapper}>
      {dragHandle({ listeners, attributes })}
      {children}
    </div>
  );
};

export default SortableVideo;

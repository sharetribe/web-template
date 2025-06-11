import React, { useEffect, useRef, useState } from 'react';
import { Button, message, Tooltip } from 'antd';
import Icon, { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { NamedLink } from '../index';
import css from './ScrollableLinks.module.css';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import IconDotsVertical from '../IconDotsVertical/IconDotsVertical';

const SortableLink = ({ id, children, dragHandle }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <span ref={setNodeRef} style={style} className={css.sortableLinkWrapper}>
      {dragHandle({ listeners, attributes })}
      {children}
    </span>
  );
};

function sortLinks(links) {
  return [...links].sort((a, b) => a.order - b.order);
}

export const ScrollableLinks = props => {
  const { links, selectedLinkId, onSortEnd, sortable = true } = props;
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const canScroll = canScrollLeft || canScrollRight;
  const [items, setItems] = useState(sortLinks(links).map(link => link.id));
  const [messageApi, contextHolder] = message.useMessage();
  const reorderSuccessMessage = () => {
    void messageApi.open({
      type: 'success',
      content: 'Portfolio order updated.',
    });
  };

  useEffect(() => {
    setItems(sortLinks(links).map(link => link.id));
  }, [links]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = event => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setItems(prevItems => {
        const oldIndex = prevItems.indexOf(active.id);
        const newIndex = prevItems.indexOf(over.id);
        const newOrder = arrayMove(prevItems, oldIndex, newIndex);
        if (onSortEnd) {
          onSortEnd(newOrder);
        }
        reorderSuccessMessage();
        return newOrder;
      });
    }
  };

  const updateScrollState = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      // Check if scrolling is possible to the left or right
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    updateScrollState();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollState);
      window.addEventListener('resize', updateScrollState);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', updateScrollState);
      }
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  return (
    <div className={css.root}>
      {contextHolder}
      {canScroll && (
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={scrollLeft}
          className={css.scrollButtonLeft}
          disabled={!canScrollLeft}
        />
      )}

      <div ref={scrollContainerRef} className={css.linksContainer}>
        {sortable ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              {items.map(id => {
                const link = links.find(l => l.id === id);
                return (
                  <SortableLink
                    key={id}
                    id={id}
                    dragHandle={({ listeners, attributes }) => (
                      <span className={css.dragHandle} {...listeners} {...attributes}>
                        <Icon component={IconDotsVertical} />
                      </span>
                    )}
                  >
                    <Tooltip title={link.displayText}>
                      <span className={css.truncated}>
                        <NamedLink
                          name={link.name}
                          active={selectedLinkId === link.id}
                          activeClassName={css.activeLink}
                          to={link.to}
                          params={link.params}
                          className={css.defaultLink}
                        >
                          {link.displayText}
                        </NamedLink>
                      </span>
                    </Tooltip>
                  </SortableLink>
                );
              })}
            </SortableContext>
          </DndContext>
        ) : (
          links.map(link => (
            <Tooltip key={link.id} title={link.displayText}>
              <span className={css.truncated}>
                <NamedLink
                  name={link.name}
                  active={selectedLinkId === link.id}
                  activeClassName={css.activeLink}
                  to={link.to}
                  params={link.params}
                  className={css.defaultLink}
                >
                  {link.displayText}
                </NamedLink>
              </span>
            </Tooltip>
          ))
        )}
      </div>

      {canScroll && (
        <Button
          type="text"
          icon={<RightOutlined />}
          onClick={scrollRight}
          className={css.scrollButtonRight}
          disabled={!canScrollRight} // Disable button if not scrollable to the right
        />
      )}
    </div>
  );
};

export default ScrollableLinks;

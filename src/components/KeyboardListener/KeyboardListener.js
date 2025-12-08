import React, { useEffect, useRef } from 'react';

/**
 * KeyboardListener component
 *
 * @component
 * @param {Object} props
 * @param {Object} props.keyMap - The key map to use for the keyboard listener
 * @param {string} props.containerId - The container ID to pass to callback functions
 * @param {React.Node} props.children - The children to render
 * @returns {JSX.Element}
 */
const KeyboardListener = props => {
  const { children, containerId, keyMap, ...rest } = props;
  const containerRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = event => {
      // Only handle events that originated from this component's descendants
      if (!containerRef.current || !containerRef.current.contains(event.target)) {
        return;
      }

      if (keyMap && keyMap[event.key]) {
        const { action, callback } = keyMap[event.key];

        if (action && callback) {
          callback(event, containerId, action);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerId, keyMap]);

  return (
    <div ref={containerRef} {...rest}>
      {children}
    </div>
  );
};

export default KeyboardListener;

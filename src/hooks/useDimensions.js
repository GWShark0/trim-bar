import { useLayoutEffect, useState, useRef } from 'react';

function getBoundingClientRect(element) {
  var rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    x: rect.x,
    y: rect.y
  };
}

export default function useDimensions() {
  const ref = useRef();
  const [dimensions, setDimensions] = useState({});
  useLayoutEffect(() => {
    setDimensions(getBoundingClientRect(ref.current));
  }, []);

  return [ref, dimensions];
}

import React, { useEffect, useRef, useState } from 'react';
import { DraggableCore } from 'react-draggable';
import styled from 'styled-components';
import clamp from 'lodash/clamp';
import useDimensions from './hooks/useDimensions';

const MIN_DURATION = 1; // second

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 40px;
  border-radius: 4px;
  background-color: #dbdbdb;
`;

const TrimSection = styled.div`
  position: absolute;
  z-index: 1;
  top: 0;
  height: 100%;
  border: 0 solid #0f87ff;
  border-top-width: 3px;
  border-bottom-width: 3px;
  border-radius: 4px;
  cursor: move;
`;

const Handle = styled.div`
  position: absolute;
  top: 0;
  width: 11px;
  height: 100%;
  background-color: #0f87ff;
  cursor: ew-resize;

  &[data-handle="left"] {
    left: 0;
  }

  &[data-handle="right"] {
    right: 0;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    margin: auto;
    width: 3px;
    height: 60%;
    border-left: 1px solid #ffffff;
    border-right: 1px solid #ffffff;
  }
`;

const LeftOverlay = styled.div`
  position: absolute;
  left: 0;
  height: 100%;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  background-color: rgba(0, 0, 0, 0.3);
`;

const RightOverlay = styled.div`
  position: absolute;
  right: 0;
  height: 100%;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  background-color: rgba(0, 0, 0, 0.3);
`;

function TrimBar(props) {
  const { trimStart, trimDuration, totalDuration } = props;
  const [containerRef, { width: totalWidth = 0 }] = useDimensions();
  const [pxPerSec, setPxPerSec] = useState(0);
  const [trimLeft, setTrimLeft] = useState(0);
  const [trimWidth, setTrimWidth] = useState(0);
  const handle = useRef('');


  useEffect(() => {
    const pxPerSec = totalWidth / totalDuration;
    setPxPerSec(pxPerSec);
    setTrimLeft(trimStart * pxPerSec);
    setTrimWidth(trimDuration * pxPerSec);
  }, [trimStart, trimDuration, totalWidth, totalDuration]);

  const handleStart = (event) => {
    handle.current = event.target.dataset.handle;
  }

  const handleDrag = (event, data) => {
    const { deltaX } = data;

    if (handle.current === 'move') {
      move(deltaX);
    }
    if (handle.current === 'left') {
      leftTrim(deltaX);
    }
    if (handle.current === 'right') {
      rightTrim(deltaX);
    }
  }

  const handleStop = () => {
    handle.current = '';
  }

  const move = (deltaX) => {
    setTrimLeft(clamp(trimLeft + deltaX, 0, totalWidth - trimWidth));
  }

  const leftTrim = (deltaX) => {
    const newTrimLeft = Math.max(trimLeft + deltaX, 0);
    const newTrimWidth = trimWidth + trimLeft - newTrimLeft;

    if (newTrimWidth >= MIN_DURATION * pxPerSec) {
      setTrimLeft(newTrimLeft);
      setTrimWidth(newTrimWidth);
    }
  }

  const rightTrim = (deltaX) => {
    const newTrimWidth = trimWidth + deltaX;
    setTrimWidth(clamp(newTrimWidth, MIN_DURATION * pxPerSec, totalWidth - trimLeft));
  }

  return (
    <div>
      <Container ref={containerRef}>
        <LeftOverlay style={{ width: trimLeft + 4 }} />
        <DraggableCore
          onStart={handleStart}
          onDrag={handleDrag}
          onStop={handleStop}
        >
          <TrimSection
            data-handle="move"
            style={{ left: trimLeft, width: trimWidth }}
          >
            <Handle data-handle="left" />
            <Handle data-handle="right" />
          </TrimSection>
        </DraggableCore>
        <RightOverlay style={{ width: totalWidth - trimLeft - trimWidth + 4 }} />
      </Container>
      <pre>
        <table>
          <tbody>
            <tr>
              <td>trimStart:</td>
              <td>{trimStart}s</td>
            </tr>
            <tr>
              <td>trimDuration:</td>
              <td>{trimDuration}s</td>
            </tr>
            <tr>
              <td>totalDuration:</td>
              <td>{totalDuration}s</td>
            </tr>
            <tr>
              <td>totalWidth:</td>
              <td>{totalWidth}px</td>
            </tr>
            <tr>
              <td>trimLeft:</td>
              <td>{trimLeft}px</td>
            </tr>
            <tr>
              <td>trimWidth:</td>
              <td>{trimWidth}px</td>
            </tr>
          </tbody>
        </table>
      </pre>
    </div>
  );
}

export default TrimBar;

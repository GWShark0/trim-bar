import React, { useEffect, useRef, useState } from 'react';
import { DraggableCore } from 'react-draggable';
import styled from 'styled-components';
import clamp from 'lodash/clamp';
import useDimensions from './hooks/useDimensions';
import formatTimestamp from './utils/formatTimestamp';
import PlayPauseButton from './PlayPauseButton';
import NativeMediaControls from './NativeMediaControls';

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
  top: 0;
  height: 100%;
  border: 0 solid #0f87ff;
  border-top-width: 3px;
  border-bottom-width: 3px;
  pointer-events: none;
`;

const Handle = styled.div`
  position: absolute;
  top: 0;
  width: 11px;
  height: 100%;
  background-color: #0f87ff;

  &[data-action="trim-left"] {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
    transform: translateX(-100%);
  }

  &[data-action="trim-right"] {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
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

const Tooltip = styled.div`
  position: absolute;
  bottom: calc(100% + 7px);
  left: 5px;
  transform: translateX(-50%);
  font-size: 10px;
  background-color: #222222;
  color: #ffffff;
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
  user-select: none;
  padding: 2px 8px;
  border-radius: 4px;

  &::before {
    content:'';
    position: absolute;
    width:0;
    height:0;
    top: 100%;
    right: 0;
    left: 0;
    margin: auto;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid #222222;
  }
`;

const LeftOverlay = styled.div`
  position: absolute;
  left: 0;
  height: 100%;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  background-color: rgba(0, 0, 0, 0.3);
  pointer-events: none;
`;

const RightOverlay = styled.div`
  position: absolute;
  right: 0;
  height: 100%;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  background-color: rgba(0, 0, 0, 0.3);
  pointer-events: none;
`;

const PlayHead = styled.div`
  background-color: red;
  width: 1px;
  height: 100%;
  position: absolute;
  top: 0;
`;


function TrimBar(props) {
  const { src, trimStart, trimDuration, totalDuration } = props;
  const [containerRef, { width: totalWidth = 0 }] = useDimensions();
  const [pxPerSec, setPxPerSec] = useState(0);
  const [trimLeft, setTrimLeft] = useState(0);
  const [trimWidth, setTrimWidth] = useState(0);
  const [action, setAction] = useState('');

  const [showPlayHead, setShowPlayHead] = useState(false);


  const [playHeadPosition, setPlayHeadPosition] = useState(100);

  const mediaRef = useRef(null);
  const mediaControls = useRef(null);

  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const source = await NativeMediaControls.preloadVideoSource(src);
        await NativeMediaControls.preloadMediaElement(mediaRef.current, source);
        mediaControls.current = new NativeMediaControls(mediaRef.current);
        setLoading(false);
      } catch (error) {
        console.error('TrimModal could not load media', src);
      }
    })();
  }, [src]);

  const handlePlayPause = () => {
    setPlaying(!playing);

    if (playing) {
      mediaControls.current.pause();
    } else {
      mediaControls.current.play();
    }
  };

  useEffect(() => {
    const pxPerSec = totalWidth / totalDuration;
    setPxPerSec(pxPerSec);
    setTrimLeft(trimStart * pxPerSec);
    setTrimWidth(trimDuration * pxPerSec);
  }, [trimStart, trimDuration, totalWidth, totalDuration]);

  const handleStart = (event, data) => {
    const { action } = event.target.dataset;
    const { node, x } = data;

    if (action === 'seek') {
      const position = x - node.offsetLeft;
      setPlayHeadPosition(position);
      setShowPlayHead(true);

      if (position < trimLeft) {
        leftTrim(position - trimLeft);
      }

      if (position > trimLeft + trimWidth) {
        rightTrim(position - trimLeft - trimWidth + 1);
      }
    }

    if (action === 'trim-left' || action === 'trim-right') {
      setShowPlayHead(false);
    }

    setAction(action);
  }

  const handleDrag = (event, data) => {
    const { deltaX } = data;

    if (action === 'seek') {
      seek(deltaX)
    }

    if (action === 'trim-left') {
      leftTrim(deltaX);
    }

    if (action === 'trim-right') {
      rightTrim(deltaX);
    }
  }

  const handleStop = () => {
    setAction('');
  }

  const seek = (deltaX) => {
    setPlayHeadPosition(clamp(playHeadPosition + deltaX, 0, totalWidth));
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
      <div>
        <video ref={mediaRef} width="100%" crossOrigin="anonymous" />
      </div>
      <PlayPauseButton
        isLoading={loading}
        isPlaying={playing}
        onClick={handlePlayPause}
      />
      <DraggableCore
        onStart={handleStart}
        onDrag={handleDrag}
        onStop={handleStop}
      >
        <Container ref={containerRef} data-action="seek">
          {showPlayHead && <PlayHead style={{ left: playHeadPosition }} />}
          <LeftOverlay style={{ width: trimLeft }} />
          <RightOverlay style={{ width: totalWidth - trimLeft - trimWidth }} />
          <Handle style={{ left: trimLeft }} data-action="trim-left">
            {action === 'trim-left' && (
              <Tooltip>
                {formatTimestamp(trimLeft / pxPerSec, true)}
              </Tooltip>
            )}
          </Handle>
          <TrimSection style={{ left: trimLeft, width: trimWidth }} />
          <Handle style={{ left: trimLeft + trimWidth }} data-action="trim-right">
            {action === 'trim-right' && (
              <Tooltip>
                {formatTimestamp((trimLeft + trimWidth) / pxPerSec, true)}
              </Tooltip>
            )}
          </Handle>
        </Container>
      </DraggableCore>
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

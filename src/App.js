import React from 'react';
import styled from 'styled-components';
import TrimBar from './TrimBar';
import oranges from './oranges.mp4'

const Container = styled.div`
  padding: 2rem;
`;

const Wrapper = styled.div`
  width: 1000px;
`;

function App() {
  return (
    <Container>
      <Wrapper>
        <TrimBar
          src={oranges}
          trimStart={1}
          trimDuration={4}
          totalDuration={10}
        />
      </Wrapper>
    </Container>
  );
}

export default App;

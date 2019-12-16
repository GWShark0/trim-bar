import React, { forwardRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import IconButton from '@material-ui/core/IconButton';
import PauseCircleFilledRoundedIcon from '@material-ui/icons/PauseCircleFilledRounded';
import PlayCircleFilledRoundedIcon from '@material-ui/icons/PlayCircleFilledRounded';

const useStyles = makeStyles({
  button: {
    padding: 0,
    fontSize: '64px',
    color: '#979797',
    '&:hover': {
      backgroundColor: 'transparent',
    },
    '&:focus': {
      outline: 'none',
    },
    '&:disabled': {
      color: '#979797',
    },
  },
  progress: {
    margin: '5px',
  },
});

const PlayPauseButton = forwardRef((props, ref) => {
  const { isPlaying, isLoading, onClick } = props;
  const classes = useStyles();

  return (
    <IconButton
      className={classes.button}
      disableFocusRipple
      disableRipple
      disabled={isLoading}
      onClick={onClick}
      ref={ref}
    >
      {isLoading && (
        <CircularProgress
          className={classes.progress}
          size="54px"
          color="inherit"
        />
      )}
      {!isLoading && isPlaying && (
        <PauseCircleFilledRoundedIcon fontSize="inherit" />
      )}
      {!isLoading && !isPlaying && (
        <PlayCircleFilledRoundedIcon fontSize="inherit" />
      )}
    </IconButton>
  );
});

export default PlayPauseButton;

import * as React from 'react'
import {Component, SyntheticEvent} from 'react'
import {VideoContext, VideoStateContext} from './player'
import {useSelector} from '@xstate/react'
import {State} from 'xstate'

type ShortcutProps = {
  clickable?: boolean
  dblclickable?: boolean
  shortcuts?: any[]
}

const selectHasStarted = (state: {context: VideoStateContext}) =>
  state.context.hasStarted || false

const selectIsActive = (state: {context: VideoStateContext}) =>
  state.context.isActive || false

const selectReadyState = (state: {context: VideoStateContext}) =>
  state.context.readyState || -1

const selectVolume = (state: {context: VideoStateContext}) =>
  state.context.volume || 0.8

const selectDuration = (state: {context: VideoStateContext}) =>
  state.context.volume || 0.8

const selectIsPaused = (state: State<VideoStateContext>) => {
  return state.matches('ready.paused')
}

const selectPlaybackRate = (state: State<VideoStateContext>) =>
  state.context.playbackRate || 1.0

export const Shortcut: React.FC<ShortcutProps> = ({
  clickable = false,
  dblclickable = false,
  ...props
}) => {
  const {videoService} = React.useContext(VideoContext)
  const hasStarted = useSelector(videoService, selectHasStarted)
  const isActive = useSelector(videoService, selectIsActive)
  const readyState = useSelector(videoService, selectReadyState)
  const volume = useSelector(videoService, selectVolume)
  const duration = useSelector(videoService, selectDuration)
  const paused = useSelector(videoService, selectIsPaused)
  const playbackRate = useSelector(videoService, selectPlaybackRate)
  const shortCutsRef = React.useRef<any[]>([])

  console.log(videoService, paused)

  const togglePlay = React.useCallback(() => {
    if (paused) {
      videoService.send('PLAY')
    } else {
      videoService.send('PAUSE')
    }
  }, [paused, videoService])

  const mergeShortcuts = React.useCallback(() => {
    const standardShortcuts = [
      {
        keyCode: 32, // spacebar
        handle: () => togglePlay(),
      },
      {
        keyCode: 75, // k
        handle: () => togglePlay(),
      },
      {
        keyCode: 70, // f
        handle: () => console.log('toggle fullscreen'),
      },
      {
        keyCode: 37, // Left arrow
        handle: () => {
          if (!hasStarted) {
            return
          }
          console.log('seek forward 5', 5, {
            action: 'back-5',
            source: 'shortcut',
          })
        },
      },
      {
        keyCode: 74, // j
        handle: () => {
          if (!hasStarted) {
            return
          }
          console.log('seek back 10', 10, {
            action: 'back-10',
            source: 'shortcut',
          })
        },
      },
      {
        keyCode: 39, // Right arrow
        handle: () => {
          if (!hasStarted) {
            return
          }
          console.log('seek forward 5', 10, {
            action: 'forward-10',
            source: 'shortcut',
          })
        },
      },
      {
        keyCode: 76, // l
        handle: () => {
          if (!hasStarted) {
            return
          }
          console.log('seek forward 10', 10, {
            action: 'forward-10',
            source: 'shortcut',
          })
        },
      },
      {
        keyCode: 36, // Home
        handle: () => {
          if (!hasStarted) {
            return
          }
          console.log('seek to start')
        },
      },
      {
        keyCode: 35, // End
        handle: () => {
          if (!hasStarted) {
            return
          }
          // Go to end of video
          console.log('seek to end', duration)
        },
      },
      {
        keyCode: 38, // Up arrow
        handle: () => {
          // Increase volume 5%
          let v = volume + 0.05
          if (v > 1) {
            v = 1
          }
          console.log('change volume', v, {
            source: 'shortcut',
          })
        },
      },
      {
        keyCode: 40, // Down arrow
        handle: () => {
          // Decrease volume 5%
          let v = volume - 0.05
          if (v < 0) {
            v = 0
          }
          const action = v > 0 ? 'volume-down' : 'volume-off'
          console.log('change volume', v, {
            action,
            source: 'shortcut',
          })
        },
      },
      {
        keyCode: 190, // Shift + >
        shift: true,
        handle: () => {
          // Increase speed
          let newPlaybackRate = playbackRate
          if (playbackRate >= 1.5) {
            newPlaybackRate = 2
          } else if (playbackRate >= 1.25) {
            newPlaybackRate = 1.5
          } else if (playbackRate >= 1.0) {
            newPlaybackRate = 1.25
          } else if (playbackRate >= 0.5) {
            newPlaybackRate = 1.0
          } else if (playbackRate >= 0.25) {
            newPlaybackRate = 0.5
          } else if (playbackRate >= 0) {
            newPlaybackRate = 0.25
          }

          console.log('fast forward', newPlaybackRate, {
            action: 'fast-forward',
            source: 'shortcut',
          })
        },
      },
      {
        keyCode: 188, // Shift + <
        shift: true,
        handle: () => {
          // Decrease speed
          let newPlaybackRate = playbackRate
          if (playbackRate <= 0.5) {
            newPlaybackRate = 0.25
          } else if (playbackRate <= 1.0) {
            newPlaybackRate = 0.5
          } else if (playbackRate <= 1.25) {
            newPlaybackRate = 1.0
          } else if (playbackRate <= 1.5) {
            newPlaybackRate = 1.25
          } else if (playbackRate <= 2) {
            newPlaybackRate = 1.5
          }
          console.log('fast rewind', newPlaybackRate, {
            action: 'fast-rewind',
            source: 'shortcut',
          })
        },
      },
    ]

    const getShortcutKey = ({
      keyCode = 0,
      ctrl = false,
      shift = false,
      alt = false,
    }) => `${keyCode}:${ctrl}:${shift}:${alt}`
    const defaultShortcuts = standardShortcuts.reduce(
      (shortcuts: any, shortcut: any) =>
        Object.assign(shortcuts, {
          [getShortcutKey(shortcut)]: shortcut,
        }),
      {},
    )
    const mergedShortcuts = (props.shortcuts || []).reduce(
      (shortcuts: any, shortcut: any) => {
        const {keyCode, handle} = shortcut
        if (keyCode && typeof handle === 'function') {
          return Object.assign(shortcuts, {
            [getShortcutKey(shortcut)]: shortcut,
          })
        }
        return shortcuts
      },
      defaultShortcuts,
    )

    const gradeShortcut = (s: any) => {
      let score = 0
      const ps = ['ctrl', 'shift', 'alt']
      ps.forEach((key) => {
        if (s[key]) {
          score++
        }
      })
      return score
    }

    return Object.keys(mergedShortcuts)
      .map((key) => mergedShortcuts[key])
      .sort((a, b) => gradeShortcut(b) - gradeShortcut(a))
  }, [duration, hasStarted, playbackRate, props.shortcuts, togglePlay, volume])

  const handleKeyPress = React.useCallback(
    (e: KeyboardEvent) => {
      if (!isActive) {
        return
      }
      if (
        document.activeElement &&
        (hasClass(document.activeElement, 'cueplayer-react-control') ||
          hasClass(
            document.activeElement,
            'cueplayer-react-menu-button-active',
          ) ||
          // || hasClass(document.activeElement, 'cueplayer-react-slider')
          hasClass(document.activeElement, 'cueplayer-react-big-play-button'))
      ) {
        return
      }

      const keyCode = e.keyCode || e.which
      const ctrl = e.ctrlKey || e.metaKey
      const shift = e.shiftKey
      const alt = e.altKey

      const shortcut = shortCutsRef.current.filter((s) => {
        if (!s.keyCode || s.keyCode - keyCode !== 0) {
          return false
        }
        return !(
          (s.ctrl !== undefined && s.ctrl !== ctrl) ||
          (s.shift !== undefined && s.shift !== shift) ||
          (s.alt !== undefined && s.alt !== alt)
        )
      })[0]

      console.log({shortcut})

      if (shortcut) {
        shortcut.handle()
        e.preventDefault()
      }
    },
    [isActive],
  )

  // only if player is active and player is ready
  const canBeClicked = React.useCallback(
    (e: Event) => {
      const target = e.target as Element
      return !(!isActive || target.nodeName !== 'VIDEO' || readyState !== 4)
    },
    [isActive, readyState],
  )

  const handleClick = React.useCallback(
    (e: Event) => {
      if (!canBeClicked(e) || !clickable) {
        return
      }
      togglePlay()
      // e.preventDefault();
    },
    [canBeClicked, clickable, togglePlay],
  )

  const handleDoubleClick = React.useCallback(
    (e: Event) => {
      if (!canBeClicked(e) || !dblclickable) {
        return
      }
      // this.toggleFullscreen()
      // e.preventDefault();
    },
    [canBeClicked, dblclickable],
  )

  React.useEffect(() => {
    shortCutsRef.current = mergeShortcuts()
    document.addEventListener('keydown', handleKeyPress)
    document.addEventListener('click', handleClick)
    document.addEventListener('dblclick', handleDoubleClick)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('dblclick', handleDoubleClick)
    }
  }, [handleClick, handleDoubleClick, handleKeyPress, mergeShortcuts])

  return null
}

// check if an element has a class name
export function hasClass(elm: any, cls: any) {
  const classes = elm.className.split(' ')
  for (let i = 0; i < classes.length; i++) {
    if (classes[i].toLowerCase() === cls.toLowerCase()) {
      return true
    }
  }
  return false
}
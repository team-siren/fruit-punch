/* eslint-disable max-statements */
/* eslint-disable complexity */
import React, {Component} from 'react'
import GameItem from './GameItem'
import {connect} from 'react-redux'
import {findPoint} from './utils'
import {
  killedGameItem,
  removedGameItem,
  gameStarted,
  gameFinished
} from '../store'
const music = new Audio('/assets/CrystalIceArea.mp3')
const winSound = new Audio('/assets/winSound.mp3')

class KickGame extends Component {
  constructor(props) {
    super(props)
    this.state = {
      score: 0,
      won: false,
      metWonCondition: false,
      musicPlaying: false
    }
    this.startGame = this.startGame.bind(this)
    this.restartGame = this.restartGame.bind(this)
  }

  componentDidMount() {
    music.volume = 0.5
    if (!this.state.musicPlaying) {
      music.play()
    }
    this.setState({
      score: 0,
      musicPlaying: true
    })
  }

  shouldComponentUpdate() {
    //if there are still any active game items...
    return !!this.props.gameItems.length
  }

  componentDidUpdate() {
    if (
      this.props.initialBody.keypoints &&
      !this.state.won &&
      !this.props.gameStarted
    ) {
      setTimeout(() => {
        this.props.toggleStart()
      }, 5000)
    }

    this.startGame()
  }

  // THE GAME
  startGame() {
    const squish = new Audio('/assets/squish.mp3')
    squish.volume = 1
    if (this.props.keypoints.length && !this.state.won) {
      for (let i = 0; i < 2; i++) {
        // const rightWristCoords = findPoint('rightWrist', this.props.keypoints)
        const itemCoords = {
          x: this.props.gameItems[i].x,
          y: this.props.gameItems[i].y
        }
        const itemWidth = this.props.gameItems[i].width
        const itemRadius = itemWidth * Math.sqrt(2) / 2
        const itemCenterX =
          Math.floor(Math.cos(Math.PI / 4) * itemRadius) + itemCoords.x
        const itemCenterY =
          Math.floor(Math.sin(Math.PI / 4) * itemRadius) + itemCoords.y

        const rightAnkleCoords = findPoint('rightAnkle', this.props.keypoints)
        const leftAnkleCoords = findPoint('leftAnkle', this.props.keypoints)

        let footToItemDistanceR = Math.sqrt(
          Math.pow(rightAnkleCoords.x - itemCenterX, 2) +
            Math.pow(rightAnkleCoords.y - itemCenterY, 2)
        )

        let footToItemDistanceL = Math.sqrt(
          Math.pow(leftAnkleCoords.x - itemCenterX, 2) +
            Math.pow(leftAnkleCoords.y - itemCenterY, 2)
        )

        if (
          !this.state.won &&
          this.props.gameStarted &&
          (itemRadius + 75 > footToItemDistanceL ||
            itemRadius + 75 > footToItemDistanceR)
        ) {
          if (this.props.gameItems[i].active) {
            //explode the item
            this.props.explodeItem(this.props.gameItems[i])
            squish.play()
            let toRemove = this.props.gameItems[i]
            setTimeout(() => {
              //retire the item
              this.props.removeGameItem(toRemove)
            }, 260)
            if (!this.state.metWonCondition) {
              //helps prevent score from going OVER win condition amount
              this.setState(state => ({
                score: state.score + 10
              })) //score starts at over 0 for some reason??
            }
          }
        }
      }
      if (this.state.score >= 500 && !this.state.metWonCondition) {
        console.log('YOU WON!!!')
        music.pause()
        this.setState({
          metWonCondition: true,
          musicPlaying: false
        })
        winSound.play()
        //explode all the fruits
        for (let i = 0; i < this.props.gameItems.length; i++) {
          this.props.explodeItem(this.props.gameItems[i])
        }
        //play squish sound for the two visible fruits on screen
        squish.play()
        squish.play()
        setTimeout(() => {
          this.props.toggleEnd()
          this.setState({
            won: true
          })
        }, 800)
      }
    }
  }

  restartGame() {
    this.setState({
      won: false,
      metWonCondition: false,
      score: 0
    })
    for (let i = 0; i < this.props.gameItems.length; i++) {
      this.props.removeGameItem(this.props.gameItems[i])
    }
    this.props.toggleStart()
    music.play()
  }

  render() {
    if (
      this.props.initialBody.keypoints &&
      !this.state.won &&
      this.props.gameStarted
    ) {
      const item1 = this.props.gameItems[0]
      const item2 = this.props.gameItems[1]

      return (
        <div>
          <div id="score">Score: {this.state.score}</div>
          <div>
            <GameItem
              key={item1.id}
              imageUrl={item1.imageUrl}
              x={item1.x}
              y={item1.y}
              width={item1.width}
            />

            <GameItem
              key={item2.id}
              imageUrl={item2.imageUrl}
              x={item2.x}
              y={item2.y}
              width={item2.width}
            />
          </div>
        </div>
      )
    } else if (this.state.won) {
      return (
        <div>
          <div id="score">Score: {this.state.score}</div>
          <img id="youWin" src="/assets/win.gif" />
          <img
            id="replayButton"
            src="/assets/replayButton.png"
            onClick={this.restartGame}
          />
          <br />
          <a href="/">
            <img id="homeButton" src="/assets/homeButton.png" />
          </a>
        </div>
      )
    } else return <div />
  }
}

const mapStateToProps = state => ({
  keypoints: state.keypoints,
  gameItems: state.activeGameItems,
  initialBody: state.initialBody,
  gameStarted: state.gameStarted,
  canvasContext: state.canvasContext
})

const mapDispatchToProps = dispatch => ({
  explodeItem: item => {
    dispatch(killedGameItem(item))
  },
  removeGameItem: item => {
    dispatch(removedGameItem(item))
  },
  toggleStart: () => {
    dispatch(gameStarted())
  },
  toggleEnd: () => {
    dispatch(gameFinished())
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(KickGame)
import { CONFIG, utils } from './config.mjs'

export class Player {
  constructor(id) {
    this.id = id
    this.state = 'observe'
    this.averageDelta = 0.0
    this.medianDelta = 0.0
    this.totalMotifs = 0
    this.totalInferencing = 0
    this.totalMoves = 0
    this.totalBranches = 0
    this.inferencingThreshold = utils.randomInRange(CONFIG.THRESHOLD.INITIAL_MIN, CONFIG.THRESHOLD.INITIAL_MIN + CONFIG.THRESHOLD.INITIAL_RANGE)
    this.currentNodes = []
    this.currentBranches = new Map()
    this.currentBranches.set('current', { 
      x: utils.randomInRange(CONFIG.SPACE.MIN, CONFIG.SPACE.MAX),
      y: utils.randomInRange(CONFIG.SPACE.MIN, CONFIG.SPACE.MAX),
      z: utils.randomInRange(CONFIG.SPACE.MIN, CONFIG.SPACE.MAX),
      w: utils.randomInRange(CONFIG.SPACE.MIN, CONFIG.SPACE.MAX)
    })
    this.observedNodes = []
    this.observedBranches = []
  }

  _getLevyStep() {
    const { LEVY } = CONFIG
    return Math.random() < LEVY.SMALL_STEP_PROBABILITY ? utils.randomInRange(-LEVY.SMALL_STEP_RANGE/2, LEVY.SMALL_STEP_RANGE/2) : utils.randomInRange(-LEVY.LARGE_STEP_RANGE/2, LEVY.LARGE_STEP_RANGE/2)
  }

  _getStateDependentNoise() {
    const { NOISE } = CONFIG
    const stateNoise = NOISE.STATE_NOISE[this.state.toUpperCase()] || NOISE.STATE_NOISE.DEFAULT
    switch(stateNoise.type) {
      case 'powerLaw':
        return utils.randomPowerLaw(stateNoise.exponent) * stateNoise.multiplier
      case 'gaussian':
        return utils.randomGaussian(stateNoise.mean, stateNoise.stdDev)
      case 'uniform':
      default:
        return utils.randomInRange(-stateNoise.range/2, stateNoise.range/2)
    }
  }

  _getMedian(arr = this.currentNodes) {
    if (arr.length === 0) return 0
    const sorted = [...arr].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  }

  _getAverage(arr = this.currentNodes) { return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length }

  _setDecay() {
    const { THRESHOLD, DECAY_PROBABILITIES, MEMORY } = CONFIG
    const roll = Math.random()
    if (roll < DECAY_PROBABILITIES.INSTIGATE) {
      this.state = 'instigate'
      this.inferencingThreshold = Math.min(THRESHOLD.MAX, this.inferencingThreshold * THRESHOLD.INSTIGATE_MULTIPLIER)
    } else if (roll < DECAY_PROBABILITIES.INSTIGATE + DECAY_PROBABILITIES.OBSERVE) {
      this.state = 'observe'
      const rand = Math.random() > 0.5 ? THRESHOLD.OBSERVE_VARIANCE.HIGH : THRESHOLD.OBSERVE_VARIANCE.LOW
      this.inferencingThreshold *= rand
    } else {
      this.state = 'receive'
      this.inferencingThreshold = Math.max(THRESHOLD.MIN, this.inferencingThreshold * THRESHOLD.RECEIVE_MULTIPLIER)
      if (this.currentNodes.length >= MEMORY.PRUNE.MIN_NODES && Math.random() > (1 - MEMORY.PRUNE.PROBABILITY)) {
        this.currentNodes = this.currentNodes.slice(0, -MEMORY.PRUNE.AMOUNT)
      }
    }
    this.inferencingThreshold = utils.clamp(this.inferencingThreshold, THRESHOLD.MIN, THRESHOLD.MAX)
    this.averageDelta = this._getAverage()
    this.medianDelta = this._getMedian()
  }

  generateNode() {
    const { NODES, NOISE } = CONFIG
    const nodeConfig = NOISE.NODE
    const baseValue = this.currentNodes.length > 0 ? this._getAverage() : NODES.MAX/2 + utils.randomInRange(-nodeConfig.BASE_RANGE/2, nodeConfig.BASE_RANGE/2)
    const exploration = this._getStateDependentNoise()
    const pureNovelty = utils.randomInRange(-nodeConfig.PURE_NOVELTY/2, nodeConfig.PURE_NOVELTY/2)
    const node = baseValue + exploration + pureNovelty, boundedNode = utils.clamp(node, NODES.MIN, NODES.MAX)
    this.currentNodes.push(boundedNode)
    this.totalMoves++
    if (Math.random() > (1 - nodeConfig.DECAY_AFTER_NODE)) this._setDecay()
    return {
      type: 'node',
      player: this.id,
      value: boundedNode,
      state: this.state,
      threshold: this.inferencingThreshold,
      noiseType: this.state
    }
  }

  generateConstruct() {
    const { SPACE, LEVY } = CONFIG
    let current = this.currentBranches.get('current')
    if (!this._isValidCoordinate(current)) {
      current = {
        x: utils.randomInRange(SPACE.MIN, SPACE.MAX),
        y: utils.randomInRange(SPACE.MIN, SPACE.MAX),
        z: utils.randomInRange(SPACE.MIN, SPACE.MAX),
        w: utils.randomInRange(SPACE.MIN, SPACE.MAX)
      }
      this.currentBranches.set('current', current)
    }
    const stepScale = LEVY.STEP_SCALES[this.state.toUpperCase()]
    let construct = {
      x: utils.clamp(current.x + (this._getLevyStep() * stepScale), SPACE.MIN, SPACE.MAX),
      y: utils.clamp(current.y + (this._getLevyStep() * stepScale), SPACE.MIN, SPACE.MAX),
      z: utils.clamp(current.z + (this._getLevyStep() * stepScale), SPACE.MIN, SPACE.MAX),
      w: utils.clamp(current.w + (this._getLevyStep() * stepScale), SPACE.MIN, SPACE.MAX)
    }
    this.currentBranches.set('previous', current)
    this.currentBranches.set('current', construct)
    this.totalBranches++
    const stepThreshold = LEVY.STEP_THRESHOLD
    const decayProbability = stepScale > stepThreshold ? LEVY.DECAY_BY_STEP.LARGE : LEVY.DECAY_BY_STEP.SMALL
    if (Math.random() > (1 - decayProbability)) this._setDecay()
    return {
      type: 'construct',
      player: this.id,
      coordinates: construct,
      state: this.state,
      branches: this.totalBranches,
      stepScale: stepScale
    }
  }

  _isValidCoordinate(coords) {
    if (!coords || typeof coords !== 'object') return false
    const dims = ['x', 'y', 'z', 'w']
    return dims.every(dim => typeof coords[dim] === 'number' && !isNaN(coords[dim]) && isFinite(coords[dim]))
  }

  observe(nodeOrConstruct) {
    const { OBSERVATION, NODES, SPACE } = CONFIG
    if (nodeOrConstruct.type === 'node') {
      this.observedNodes.push(nodeOrConstruct.value)
      if (this.observedNodes.length > OBSERVATION.MAX_OBSERVED_NODES) this.observedNodes.shift()
      const similarity = 1 - Math.abs(this._getAverage() - nodeOrConstruct.value) / NODES.MAX
      if (similarity > OBSERVATION.SIMILARITY.INSTIGATE) {
        this.totalInferencing++
        this.state = 'instigate'
      } else if (similarity < OBSERVATION.SIMILARITY.RECEIVE) {
        this.state = 'receive'
        this.currentNodes.push(nodeOrConstruct.value * OBSERVATION.LEARNING.DISSIMILAR_NODE)
      } else {
        this.state = 'observe'
      }
    } else if (nodeOrConstruct.type === 'construct') {
      this.observedBranches.push(nodeOrConstruct.coordinates)
      if (this.observedBranches.length > OBSERVATION.MAX_OBSERVED_BRANCHES) this.observedBranches.shift()
      let theirCoords = nodeOrConstruct.coordinates
      let myCoords = this.currentBranches.get('current'), distance = Infinity
      if (!this._isValidCoordinate(myCoords)) {
        myCoords = {
          x: utils.randomInRange(SPACE.MIN, SPACE.MAX),
          y: utils.randomInRange(SPACE.MIN, SPACE.MAX),
          z: utils.randomInRange(SPACE.MIN, SPACE.MAX),
          w: utils.randomInRange(SPACE.MIN, SPACE.MAX)
        }
        this.currentBranches.set('current', myCoords)
      }
      if (!this._isValidCoordinate(theirCoords)) {
        theirCoords = {
          x: utils.randomInRange(SPACE.MIN, SPACE.MAX),
          y: utils.randomInRange(SPACE.MIN, SPACE.MAX),
          z: utils.randomInRange(SPACE.MIN, SPACE.MAX),
          w: utils.randomInRange(SPACE.MIN, SPACE.MAX)
        }
      }
      if (this._isValidCoordinate(theirCoords) && this._isValidCoordinate(myCoords)) {
        const dx = theirCoords.x - myCoords.x, dy = theirCoords.y - myCoords.y
        const dz = theirCoords.z - myCoords.z, dw = theirCoords.w - myCoords.w
        distance = Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw)
      }
      if (distance < OBSERVATION.DISTANCE.INSTIGATE) {
        this.totalMotifs++
        this.state = 'instigate'
      } else if (distance > OBSERVATION.DISTANCE.RECEIVE) {
        this.state = 'receive'
      } else {
        this.state = 'observe'
      }
    }
    const totalObservations = this.observedNodes.length + this.observedBranches.length
    if (totalObservations > OBSERVATION.DECAY_TRIGGER.MIN_OBSERVATIONS) if (Math.random() > (1 - OBSERVATION.DECAY_TRIGGER.PROBABILITY)) this._setDecay()
    return this.state
  }
}

export class Game {
  constructor() {
    this.players = new Map()
    this.history = []
    this.motifs = new Set()
    this.round = 0
  }

  addPlayer(id) {
    const p = new Player(id)
    this.players.set(id, p)
    return p
  }

  playRound() {
    const { GAME } = CONFIG, events = []
    this.round++
    for (const [id, player] of this.players) {
      const action = Math.random()
      if (action < GAME.ACTION_PROBABILITIES.NODE) {
        const node = player.generateNode()
        events.push({ ...node, round: this.round })
        for (const [otherId, other] of this.players) { if (otherId !== id) other.observe(node) }
      } else if (action < GAME.ACTION_PROBABILITIES.NODE + GAME.ACTION_PROBABILITIES.CONSTRUCT) {
        const construct = player.generateConstruct()
        events.push({ ...construct, round: this.round })
        for (const [otherId, other] of this.players) { if (otherId !== id) other.observe(construct) }
      } else {
        player._setDecay()
        events.push({
          type: 'decay',
          player: id,
          round: this.round,
          state: player.state,
          threshold: player.inferencingThreshold
        })
      }
    }  
    this.history.push(...events)
    const nodes = events.filter(e => e.type === 'node').map(e => e.value)
    if (nodes.length >= 2) {
      const pattern = nodes.slice(-2).map(n => n > GAME.MOTIFS.NODE_THRESHOLDS.HIGH ? 'H' : n > GAME.MOTIFS.NODE_THRESHOLDS.MEDIUM ? 'M' : 'L').join('')
      this.motifs.add(pattern)
    }
    const constructs = events.filter(e => e.type === 'construct')
    if (constructs.length >= 2) {
      const lastTwo = constructs.slice(-2)
      const quadrants = lastTwo.map(c => {
        const coord = c.coordinates
        return [
          coord.x > 0 ? GAME.MOTIFS.QUADRANTS.POSITIVE[0] : GAME.MOTIFS.QUADRANTS.NEGATIVE[0],
          coord.y > 0 ? GAME.MOTIFS.QUADRANTS.POSITIVE[1] : GAME.MOTIFS.QUADRANTS.NEGATIVE[1],
          coord.z > 0 ? GAME.MOTIFS.QUADRANTS.POSITIVE[2] : GAME.MOTIFS.QUADRANTS.NEGATIVE[2],
          coord.w > 0 ? GAME.MOTIFS.QUADRANTS.POSITIVE[3] : GAME.MOTIFS.QUADRANTS.NEGATIVE[3]
        ].join('')
      })
      this.motifs.add(quadrants.join('→'))
    }
    return events
  }

  getMetrics() {
    const metrics = {
      round: this.round,
      players: this.players.size,
      totalEvents: this.history.length,
      uniqueMotifs: this.motifs.size,
      stateDistribution: { instigate: 0, observe: 0, receive: 0 },
      playerStates: {}
    }
    for (const [id, player] of this.players) {
      metrics.stateDistribution[player.state]++
      metrics.playerStates[id] = {
        state: player.state,
        nodes: player.currentNodes.length,
        branches: player.totalBranches,
        motifs: player.totalMotifs,
        inferencing: player.totalInferencing,
        threshold: player.inferencingThreshold,
        avgDelta: player.averageDelta,
        medDelta: player.medianDelta,
        observed: player.observedNodes.length + player.observedBranches.length
      }
    }
    return metrics
  }

  run(rounds = CONFIG.GAME.DEFAULT_ROUNDS) {
    for (let i = 0; i < rounds; i++) { this.playRound() }
    return this.getMetrics()
  }
}
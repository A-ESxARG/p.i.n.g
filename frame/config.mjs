export const CONFIG = {
  THRESHOLD: {
    INITIAL_MIN: 0.5,
    INITIAL_RANGE: 0.3,
    MIN: 0.1,
    MAX: 0.95,
    INSTIGATE_MULTIPLIER: 1.03,
    RECEIVE_MULTIPLIER: 0.98,
    OBSERVE_VARIANCE: { LOW: 0.99, HIGH: 1.01 }
  },
  DECAY_PROBABILITIES: {
    INSTIGATE: 0.33,
    OBSERVE: 0.33,
    RECEIVE: 0.34
  },
  NOISE: {
    STATE_NOISE: {
      INSTIGATE: { type: 'powerLaw', exponent: 2.0, multiplier: 25 },
      OBSERVE: { type: 'gaussian', mean: 0, stdDev: 15 },
      RECEIVE: { type: 'gaussian', mean: 0, stdDev: 5 },
      DEFAULT: { type: 'uniform', range: 50 }
    },
    NODE: {
      BASE_RANGE: 20,
      PURE_NOVELTY: 10,
      DECAY_AFTER_NODE: 0.3
    }
  },
  LEVY: {
    SMALL_STEP_PROBABILITY: 0.7,
    SMALL_STEP_RANGE: 10,
    LARGE_STEP_RANGE: 70,
    STEP_SCALES: {
      INSTIGATE: 1.5,
      OBSERVE: 1.0,
      RECEIVE: 0.5
    },
    STEP_THRESHOLD: 1.0,
    DECAY_BY_STEP: {
      SMALL: 0.3,
      LARGE: 0.4
    }
  },
  MEMORY: {
    MAX_OBSERVED_NODES: 8,
    MAX_OBSERVED_BRANCHES: 4,
    PRUNE: {
      MIN_NODES: 3,
      PROBABILITY: 0.7,
      AMOUNT: 1
    }
  },
  OBSERVATION: {
    SIMILARITY: {
      INSTIGATE: 0.6,
      RECEIVE: 0.4
    },
    DISTANCE: {
      INSTIGATE: 30,
      RECEIVE: 60
    },
    LEARNING: {
      SIMILAR_NODE: 0.3,
      DISSIMILAR_NODE: 0.3
    },
    DECAY_TRIGGER: {
      MIN_OBSERVATIONS: 6,
      PROBABILITY: 0.5
    }
  },
  GAME: {
    ACTION_PROBABILITIES: {
      NODE: 0.35,
      CONSTRUCT: 0.35,
      DECAY: 0.30
    },
    MOTIFS: {
      NODE_THRESHOLDS: {
        HIGH: 66,
        MEDIUM: 33
      },
      QUADRANTS: {
        POSITIVE: ['E', 'N', 'U', 'T'],
        NEGATIVE: ['W', 'S', 'D', 'B']
      }
    },
    DEFAULT_ROUNDS: 10
  },
  SPACE: {
    MIN: 0,
    MAX: 100
  },
  NODES: {
    MIN: 0.0,
    MAX: 100.0
  }
}

export const RENDER_CONFIG = {
  BOUNDARY_PADDING: 20,
  BOUNCE_DAMPING: 0.8,
  ANIMATION_SPEED: 0.02,
  TRAIL_MAX_POINTS: 20,
  TRAIL_MAX_AGE: 200,
  NODE_MAX_AGE: 200,
  NODE_MIN_RADIUS: 10,
  INFLUENCE_RANGE: 120,
  CONNECTION_RANGE: 200,
  PLAYER_RADIUS: 18,
  GRID_SIZE: 20,
  BURST_PARTICLES: 10,
  MOVEMENT_PARTICLES: 3,
  EASING: 0.006,
  TRAIL_FREQUENCY: 10,
  PARTICLE_ALPHA: 0.02,
  PLAYER_ALPHA: 0.8,
  PLAYER_TRAIL_ALPHA: 0.8
}

export const utils = {
  randomInRange: (min, max) => Math.random() * (max - min) + min,
  randomGaussian: (mean = 0, stdDev = 1) => {
    const u1 = Math.random()
    const u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return mean + z * stdDev
  },
  randomPowerLaw: (exponent = 2.5) => { return Math.pow(Math.random(), exponent) * (Math.random() > 0.5 ? 1 : -1) },
  clamp: (value, min, max) => Math.max(min, Math.min(max, value))
}
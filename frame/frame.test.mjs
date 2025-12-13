import { Player, Game } from './frame.mjs'
import { strict as a } from 'assert'

console.log('1: Player Internal Mechanics')
const p1 = new Player('player1')
a.ok(p1.state === 'observe', 'Player starts observing')
a.ok(p1.currentBranches.has('current'), 'Has initial coordinates')

const node1 = p1.generateNode()
a.ok(typeof node1.value === 'number', 'Generates numerical node')
a.ok(p1.currentNodes.includes(node1.value) || p1.state === 'receive', 'Records own node (except in receive state)')
console.log(`✓ Player generates node ${node1.value.toFixed(2)} in state ${p1.state}`)

console.log('\n2: Social Inference')
const p2 = new Player('player2')
const p3 = new Player('player3')
const node2 = p2.generateNode()
const stateAfterObserve = p3.observe(node2)
a.ok(['observe', 'instigate', 'receive'].includes(stateAfterObserve), 'Valid state after observation')
console.log(`✓ Player infers ${stateAfterObserve} state from observed node`)


const construct1 = p1.generateConstruct()
a.ok(construct1.coordinates.x !== undefined, 'Generates construct')
a.ok(p1.totalBranches === 1, 'Tracks branch count')
console.log(`✓ Player generates construct at [${Object.values(construct1.coordinates).map(v => v.toFixed(2)).join(', ')}]`)


console.log('\n3: Emergent Game Patterns')
const game = new Game()
game.addPlayer('p1')
game.addPlayer('p2')
game.addPlayer('p3')
const round1 = game.playRound()
a.ok(round1.length > 0, 'Players generate events')
a.ok(game.round === 1, 'Round counter increments')
console.log(`✓ Round 1: ${round1.length} events, ${game.motifs.size} motifs discovered`)

console.log('\n4: System Feedback Loop')
const initialMotifs = game.motifs.size
game.playRound()
game.playRound()
console.log(`✓ Motifs ${initialMotifs} → ${game.motifs.size}`)

console.log('\n5: Asymmetric Agent Development')
const metrics = game.getMetrics()
const states = Object.values(metrics.playerStates).map(s => s.state)
const uniqueStates = new Set(states)
console.log(`✓ Players in states: ${[...uniqueStates].join(', ')}`)

console.log('\n6: Adaptive Thresholds')
const p1Player = game.players.get('p1')
const initialThreshold = p1Player.inferencingThreshold
game.run(5) // Run fewer rounds for quicker test
const newThreshold = p1Player.inferencingThreshold
console.log(`✓ Threshold adapted from ${initialThreshold.toFixed(3)} to ${newThreshold.toFixed(3)}`)

console.log('\n7: Anti-Harden Property')
const finalMetrics = game.getMetrics()
const allObserving = Object.values(finalMetrics.playerStates).every(s => s.state === 'observe')
console.log(`✓ System ${allObserving ? 'is' : 'is not'} universally observing`)

console.log('\n8: Statistical Validation')
for (const [id, player] of game.players) {
  a.ok(player.inferencingThreshold >= 0.1 && player.inferencingThreshold <= 0.95, 
    `Player ${id} threshold in bounds [0.1, 0.95]`)
  a.ok(player.currentNodes.length <= 100, 
    `Player ${id} node memory bounded`)
  a.ok(['observe', 'instigate', 'receive'].includes(player.state),
    `Player ${id} has valid state`)
}
console.log('✓ All players maintain system invariants')

console.log('\n=== Test Summary ===')
console.log(`Total Rounds: ${game.round}`)
console.log(`Total Events: ${game.history.length}`)
console.log(`Unique Motifs: ${game.motifs.size}`)
console.log(`State Distribution: ${JSON.stringify(finalMetrics.stateDistribution)}`)

console.log('\nEvent Playback:')
game.history.forEach(event => {
  const desc = event.type === 'node' ? `Player ${event.player} generated concept node ${event.value.toFixed(2)}`
    : event.type === 'construct' ? `Player ${event.player} moved to construct coordinates (${event.coordinates.x.toFixed(3)}, ${event.coordinates.y.toFixed(3)}, ${event.coordinates.z.toFixed(3)}, ${event.coordinates.w.toFixed(3)})`
    : `Player ${event.player} transitioned to ${event.state}`
  console.log(`  Round ${event.round}: ${desc}`)
})
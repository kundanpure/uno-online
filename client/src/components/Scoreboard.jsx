import './Scoreboard.css'

function Scoreboard({ data, playerId, onRematch, onHome }) {
    const { winnerId, scores, players } = data
    const winner = players.find(p => p.id === winnerId)
    const isWinner = winnerId === playerId

    const sortedPlayers = [...players].sort((a, b) => {
        if (a.id === winnerId) return -1
        if (b.id === winnerId) return 1
        return (scores[a.id] || 0) - (scores[b.id] || 0)
    })

    return (
        <div className="scoreboard-overlay">
            <div className="scoreboard-modal">
                {/* Trophy */}
                <div className="trophy-section">
                    <span className="trophy-emoji">{isWinner ? '🏆' : '😢'}</span>
                    <h2 className="trophy-title">
                        {isWinner ? 'You Win!' : `${winner?.name || 'Someone'} Wins!`}
                    </h2>
                </div>

                {/* Standings */}
                <div className="standings">
                    {sortedPlayers.map((player, index) => (
                        <div
                            key={player.id}
                            className={`standing-row ${player.id === winnerId ? 'winner' : ''} ${player.id === playerId ? 'is-me' : ''}`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <span className="standing-rank">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                            </span>
                            <span className="standing-name">
                                {player.name}
                                {player.id === playerId && <span className="you-tag"> (You)</span>}
                            </span>
                            <span className="standing-score">
                                {player.id === winnerId ? '🎯 0' : `${scores[player.id] || 0} pts`}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="scoreboard-actions">
                    <button className="btn btn-primary btn-lg" onClick={onRematch}>
                        🔄 Rematch
                    </button>
                    <button className="btn btn-secondary" onClick={onHome}>
                        🏠 Home
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Scoreboard

import './ColorPicker.css'

const COLORS = [
    { name: 'red', hex: '#ef4444', emoji: '🔴' },
    { name: 'blue', hex: '#3b82f6', emoji: '🔵' },
    { name: 'green', hex: '#22c55e', emoji: '🟢' },
    { name: 'yellow', hex: '#eab308', emoji: '🟡' }
]

function ColorPicker({ onSelect, onClose }) {
    return (
        <div className="color-picker-overlay" onClick={onClose}>
            <div className="color-picker-modal" onClick={e => e.stopPropagation()}>
                <h3>Choose a Color</h3>
                <div className="color-options">
                    {COLORS.map(color => (
                        <button
                            key={color.name}
                            className="color-option"
                            style={{ background: color.hex }}
                            onClick={() => onSelect(color.name)}
                            title={color.name}
                        >
                            <span className="color-option-name">{color.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ColorPicker

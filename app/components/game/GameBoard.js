export default function GameBoard({ gameState, onAction }) {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-100 rounded-lg">
      {gameState.board.map((cell, index) => (
        <button
          key={index}
          className="aspect-square bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          onClick={() => onAction(index)}
        >
          {cell}
        </button>
      ))}
    </div>
  );
} 
import Card from '../ui/Card';

export default function CharacterCard({ character }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <h3 className="text-xl font-bold">{character.name}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Level</p>
            <p className="font-medium">{character.level}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Class</p>
            <p className="font-medium">{character.class}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Health</p>
            <p className="font-medium">{character.health}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Experience</p>
            <p className="font-medium">{character.experience}</p>
          </div>
        </div>
      </div>
    </Card>
  );
} 
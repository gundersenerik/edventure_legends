import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Edventure Legends
          </Link>
          <div className="space-x-4">
            <Link href="/create-game" className="text-gray-600 hover:text-gray-900">
              Create Game
            </Link>
            <Link href="/game/load" className="text-gray-600 hover:text-gray-900">
              Load Game
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
} 
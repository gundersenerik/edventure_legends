export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-gray-600">
          <p>© {new Date().getFullYear()} Edventure Legends. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 
// app/layout.js
import './globals.css';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

export const metadata = {
  title: 'RP Learning Adventures',
  description: 'Educational roleplaying for kids that makes learning fun!',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body id="root" className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
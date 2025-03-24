// app/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Home.module.css';
import { FaPlus, FaGamepad, FaBrain, FaBookOpen } from 'react-icons/fa';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [games, setGames] = useState([]);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    async function checkAuth() {
      try {
        // Check if user is authenticated via Supabase
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        
        setIsAuthenticated(!!data.session);
        
        // If authenticated, fetch their games
        if (data.session) {
          await fetchGames();
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
        setIsLoading(false);
      }
    }
    
    async function fetchGames() {
      try {
        const response = await fetch('/api/games');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch games');
        }
        
        const data = await response.json();
        setGames(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuth();
  }, []);
  
  return (
    <div className="container mx-auto p-4">
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>RP Learning Adventures</h1>
          <p className={styles.subtitle}>Educational roleplaying for kids that makes learning fun!</p>
          
          {!isAuthenticated && (
            <div className={styles.authButtons}>
              <Link href="/login" className={styles.loginButton}>Log In</Link>
              <Link href="/register" className={styles.registerButton}>Sign Up</Link>
            </div>
          )}
        </div>
      </header>
      
      {!isAuthenticated ? (
        <section className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>Why Choose Our Platform?</h2>
          
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconContainer}>
                <FaGamepad className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>Learn Through Play</h3>
              <p className={styles.featureDescription}>
                Engage children in interactive storytelling adventures that make educational concepts stick.
              </p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIconContainer}>
                <FaBrain className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>AI-Powered Education</h3>
              <p className={styles.featureDescription}>
                Our advanced AI creates custom learning scenarios tailored to each child's educational needs.
              </p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIconContainer}>
                <FaBookOpen className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>Curriculum Alignment</h3>
              <p className={styles.featureDescription}>
                Adventures can be designed to reinforce specific learning objectives across multiple subjects.
              </p>
            </div>
          </div>
          
          <div className={styles.ctaContainer}>
            <Link href="/register" className={styles.ctaButton}>
              Get Started Today
            </Link>
          </div>
        </section>
      ) : (
        <section className={styles.gamesSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Adventures</h2>
            <Link href="/create-game" className={styles.createButton}>
              <FaPlus className={styles.createButtonIcon} />
              Create New Adventure
            </Link>
          </div>
          
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>Loading your adventures...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p className={styles.errorText}>{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className={styles.retryButton}
              >
                Try Again
              </button>
            </div>
          ) : games.length === 0 ? (
            <div className={styles.emptyState}>
              <h3 className={styles.emptyStateTitle}>No Adventures Yet</h3>
              <p className={styles.emptyStateText}>
                Create your first educational roleplaying adventure to get started!
              </p>
              <Link href="/create-game" className={styles.emptyStateButton}>
                <FaPlus className={styles.buttonIcon} />
                Create First Adventure
              </Link>
            </div>
          ) : (
            <div className={styles.gamesGrid}>
              {games.map(game => (
                <div key={game.id} className={styles.gameCard} onClick={() => router.push(`/game/${game.id}/dashboard`)}>
                  <div className={styles.gameCardContent}>
                    <h3 className={styles.gameCardTitle}>{game.title}</h3>
                    <p className={styles.gameCardMeta}>{game.theme} • {game.age_group} years</p>
                    <p className={styles.gameCardObjective}>{game.learning_objective}</p>
                    
                    <div className={styles.gameCardFooter}>
                      <span className={styles.gameCardDate}>
                        Created: {new Date(game.created_at).toLocaleDateString()}
                      </span>
                      <span className={`${styles.gameCardDifficulty} ${styles[game.difficulty_level]}`}>
                        {game.difficulty_level}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} RP Learning Adventures. All rights reserved.</p>
      </footer>
    </div>
  );
}
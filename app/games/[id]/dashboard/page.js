// app/game/[id]/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Dashboard.module.css';
import Modal from 'react-modal';
import { FaUsers, FaScroll, FaMapMarkedAlt, FaDragon, FaPlay, FaTrash } from 'react-icons/fa';

// Set the app element for accessibility
if (typeof window !== 'undefined') {
  Modal.setAppElement('#root');
}

export default function GameDashboard({ params }) {
  const router = useRouter();
  const { id } = params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  useEffect(() => {
    if (!id) return;
    
    async function fetchGameData() {
      try {
        const response = await fetch(`/api/games/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch game data');
        }
        
        const data = await response.json();
        setGameData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchGameData();
  }, [id]);
  
  const handleDeleteGame = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/games/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete game');
      }
      
      // Redirect to home after successful deletion
      router.push('/');
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading adventure...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className={styles.errorContainer}>
          <h2 className={styles.errorTitle}>Error</h2>
          <p className={styles.errorText}>{error}</p>
          <button 
            onClick={() => router.push('/')}
            className={styles.button}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  if (!gameData) {
    return (
      <div className="container mx-auto p-4">
        <div className={styles.errorContainer}>
          <h2 className={styles.errorTitle}>Game Not Found</h2>
          <p className={styles.errorText}>The requested adventure could not be found.</p>
          <button 
            onClick={() => router.push('/')}
            className={styles.button}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  const { game, gameWorld, gameRules, characters, quests } = gameData;
  
  return (
    <div className="container mx-auto p-4">
      <div className={styles.dashboardHeader}>
        <h1 className={styles.gameTitle}>{game.title}</h1>
        <p className={styles.gameSubtitle}>{game.theme} • {game.age_group} years • {game.difficulty_level}</p>
        <p className={styles.learningObjective}><strong>Learning Objective:</strong> {game.learning_objective}</p>
      </div>
      
      <div className={styles.dashboardGrid}>
        {/* World Overview Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FaMapMarkedAlt className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>World Overview</h2>
          </div>
          {gameWorld ? (
            <div className={styles.cardContent}>
              <p className={styles.worldDescription}>
                {gameWorld.description.substring(0, 250)}...
              </p>
              <div className={styles.worldDetails}>
                <p><strong>{gameWorld.locations?.length || 0}</strong> Locations</p>
                <p><strong>{gameWorld.npcs?.length || 0}</strong> Characters</p>
                <p><strong>{gameWorld.challenges?.length || 0}</strong> Challenges</p>
              </div>
              <button className={styles.cardButton}>
                View Full World
              </button>
            </div>
          ) : (
            <div className={styles.cardPlaceholder}>
              <p>World details not generated yet</p>
              <button className={styles.cardButton}>
                Generate World
              </button>
            </div>
          )}
        </div>
        
        {/* Characters Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FaUsers className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>Characters</h2>
          </div>
          <div className={styles.cardContent}>
            {characters && characters.length > 0 ? (
              <div className={styles.charactersList}>
                {characters.map(character => (
                  <div key={character.id} className={styles.characterItem}>
                    <div className={styles.characterAvatar}>
                      {character.name.charAt(0)}
                    </div>
                    <div className={styles.characterInfo}>
                      <h3>{character.name}</h3>
                      <p>{character.archetype}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>No characters created yet</p>
            )}
            <Link href={`/game/${id}/characters/create`} className={styles.cardButton}>
              Create New Character
            </Link>
          </div>
        </div>
        
        {/* Quests Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FaScroll className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>Quests</h2>
          </div>
          <div className={styles.cardContent}>
            {quests && quests.length > 0 ? (
              <div className={styles.questsList}>
                {quests.map(quest => (
                  <div key={quest.id} className={styles.questItem}>
                    <h3 className={styles.questTitle}>{quest.title}</h3>
                    <div className={styles.questMeta}>
                      <span className={`${styles.questDifficulty} ${styles[quest.difficulty]}`}>
                        {quest.difficulty}
                      </span>
                      <span className={styles.questStatus}>{quest.status}</span>
                    </div>
                    <p className={styles.questDescription}>{quest.description.substring(0, 100)}...</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>No quests available yet</p>
            )}
            <button className={styles.cardButton}>
              View All Quests
            </button>
          </div>
        </div>
        
        {/* Game Rules Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FaDragon className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>Game Rules</h2>
          </div>
          {gameRules ? (
            <div className={styles.cardContent}>
              <h3 className={styles.sectionTitle}>Core Mechanics</h3>
              <ul className={styles.rulesList}>
                {gameRules.core_mechanics?.slice(0, 3).map((mechanic, index) => (
                  <li key={index} className={styles.ruleItem}>
                    <strong>{mechanic.name}</strong> - {mechanic.description.substring(0, 80)}...
                  </li>
                ))}
              </ul>
              
              <h3 className={styles.sectionTitle}>Character Attributes</h3>
              <div className={styles.attributeList}>
                {gameRules.character_attributes?.slice(0, 4).map((attr, index) => (
                  <div key={index} className={styles.attributeItem}>
                    <strong>{attr.name}</strong>
                    <span>({attr.range})</span>
                  </div>
                ))}
              </div>
              
              <button className={styles.cardButton}>
                View Full Rules
              </button>
            </div>
          ) : (
            <div className={styles.cardPlaceholder}>
              <p>Game rules not generated yet</p>
              <button className={styles.cardButton}>
                Generate Rules
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.actionsContainer}>
        <Link href={`/game/${id}/session`} className={styles.playButton}>
          <FaPlay className={styles.buttonIcon} />
          Start Game Session
        </Link>
        
        <button 
          onClick={() => setShowDeleteModal(true)} 
          className={styles.deleteButton}
        >
          <FaTrash className={styles.buttonIcon} />
          Delete Adventure
        </button>
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
        contentLabel="Confirm Deletion"
        className={styles.modal}
        overlayClassName={styles.modalOverlay}
      >
        <h2 className={styles.modalTitle}>Delete Adventure?</h2>
        <p className={styles.modalText}>
          Are you sure you want to delete "{game.title}"? This action cannot be undone.
        </p>
        <div className={styles.modalButtons}>
          <button 
            onClick={() => setShowDeleteModal(false)} 
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button 
            onClick={handleDeleteGame} 
            className={styles.confirmDeleteButton}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Adventure'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
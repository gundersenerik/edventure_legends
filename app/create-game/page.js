// app/create-game/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CreateGame.module.css';
import Modal from 'react-modal';

// Set the app element for accessibility
if (typeof window !== 'undefined') {
  Modal.setAppElement('#root');
}

export default function CreateGamePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('gameInfo');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    isError: false,
  });
  
  // Form state
  const [gameData, setGameData] = useState({
    title: '',
    learningObjective: '',
    ageGroup: '7-9',
    theme: '',
    numberOfPlayers: 1,
    difficultyLevel: 'beginner'
  });
  
  // Generated content state
  const [gameId, setGameId] = useState(null);
  const [gameWorld, setGameWorld] = useState(null);
  const [gameRules, setGameRules] = useState(null);
  const [quests, setQuests] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGameData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCreateGame = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Create the base game
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create game');
      }
      
      const game = await response.json();
      setGameId(game.id);
      
      // Move to the next step
      setCurrentStep('generatingWorld');
      
      // Generate the game world
      await generateGameWorld(game.id);
    } catch (error) {
      showErrorModal('Error Creating Game', error.message);
      setIsLoading(false);
    }
  };
  
  const generateGameWorld = async (id) => {
    try {
      const response = await fetch('/api/ai/generate-world', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: id,
          gameSettings: gameData,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate game world');
      }
      
      const worldData = await response.json();
      setGameWorld(worldData);
      
      // Move to generating rules
      setCurrentStep('generatingRules');
      await generateGameRules(id);
    } catch (error) {
      showErrorModal('Error Generating Game World', error.message);
      setIsLoading(false);
    }
  };
  
  const generateGameRules = async (id) => {
    try {
      const response = await fetch('/api/ai/generate-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: id,
          gameSettings: gameData,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate game rules');
      }
      
      const rulesData = await response.json();
      setGameRules(rulesData);
      
      // Move to generating quests
      setCurrentStep('generatingQuests');
      await generateQuests(id);
    } catch (error) {
      showErrorModal('Error Generating Game Rules', error.message);
      setIsLoading(false);
    }
  };
  
  const generateQuests = async (id) => {
    try {
      const response = await fetch('/api/ai/generate-quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: id,
          gameSettings: gameData,
          gameWorld,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate quests');
      }
      
      const questsData = await response.json();
      setQuests(questsData);
      
      // All generation is complete
      setCurrentStep('complete');
      setIsLoading(false);
      
      // Show success modal
      showSuccessModal('Game Created!', 'Your game has been created successfully. You can now start playing!');
    } catch (error) {
      showErrorModal('Error Generating Quests', error.message);
      setIsLoading(false);
    }
  };
  
  const handleGoToDashboard = () => {
    router.push(`/game/${gameId}/dashboard`);
  };
  
  const showErrorModal = (title, message) => {
    setModalContent({
      title,
      message,
      isError: true,
    });
    setShowModal(true);
  };
  
  const showSuccessModal = (title, message) => {
    setModalContent({
      title,
      message,
      isError: false,
    });
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
    if (currentStep === 'complete' && !modalContent.isError) {
      handleGoToDashboard();
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className={styles.pageTitle}>Create New Adventure</h1>
      
      {currentStep === 'gameInfo' && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Adventure Details</h2>
          <form onSubmit={handleCreateGame} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Adventure Title
                <input
                  type="text"
                  name="title"
                  value={gameData.title}
                  onChange={handleChange}
                  className={styles.formInput}
                  required
                  placeholder="e.g., The Math Kingdom"
                />
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Learning Objective
                <textarea
                  name="learningObjective"
                  value={gameData.learningObjective}
                  onChange={handleChange}
                  className={styles.formTextarea}
                  rows="3"
                  required
                  placeholder="e.g., Basic multiplication and division"
                />
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Age Group
                <select
                  name="ageGroup"
                  value={gameData.ageGroup}
                  onChange={handleChange}
                  className={styles.formSelect}
                >
                  <option value="5-6">5-6 years</option>
                  <option value="7-9">7-9 years</option>
                  <option value="10-12">10-12 years</option>
                  <option value="13+">13+ years</option>
                </select>
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Theme/Setting
                <input
                  type="text"
                  name="theme"
                  value={gameData.theme}
                  onChange={handleChange}
                  className={styles.formInput}
                  required
                  placeholder="e.g., Space Exploration, Magical Forest"
                />
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Number of Players
                <input
                  type="number"
                  name="numberOfPlayers"
                  value={gameData.numberOfPlayers}
                  onChange={handleChange}
                  min="1"
                  max="6"
                  className={styles.formInput}
                />
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Difficulty Level
                <select
                  name="difficultyLevel"
                  value={gameData.difficultyLevel}
                  onChange={handleChange}
                  className={styles.formSelect}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
            </div>
            
            <button 
              type="submit" 
              className={styles.button}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Adventure'}
            </button>
          </form>
        </div>
      )}
      
      {currentStep === 'generatingWorld' && (
        <div className={styles.loadingContainer}>
          <h2 className={styles.loadingTitle}>Creating Your Adventure World</h2>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>
            Building an amazing world based on your theme: <strong>{gameData.theme}</strong>
          </p>
        </div>
      )}
      
      {currentStep === 'generatingRules' && (
        <div className={styles.loadingContainer}>
          <h2 className={styles.loadingTitle}>Designing Game Rules</h2>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>
            Creating age-appropriate rules for <strong>{gameData.ageGroup} year olds</strong>
          </p>
        </div>
      )}
      
      {currentStep === 'generatingQuests' && (
        <div className={styles.loadingContainer}>
          <h2 className={styles.loadingTitle}>Crafting Educational Quests</h2>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>
            Designing quests to teach: <strong>{gameData.learningObjective}</strong>
          </p>
        </div>
      )}
      
      {currentStep === 'complete' && (
        <div className={styles.completeContainer}>
          <h2 className={styles.completeTitle}>Adventure Created!</h2>
          <p className={styles.completeText}>
            Your adventure "{gameData.title}" is ready to play.
          </p>
          <button 
            onClick={handleGoToDashboard} 
            className={styles.button}
          >
            Go to Game Dashboard
          </button>
        </div>
      )}
      
      <Modal
        isOpen={showModal}
        onRequestClose={closeModal}
        contentLabel="Game Creation Status"
        className={styles.modal}
        overlayClassName={styles.modalOverlay}
      >
        <h2 className={modalContent.isError ? styles.modalTitleError : styles.modalTitleSuccess}>
          {modalContent.title}
        </h2>
        <p className={styles.modalText}>{modalContent.message}</p>
        <button onClick={closeModal} className={styles.modalButton}>
          {currentStep === 'complete' && !modalContent.isError ? 'Go to Dashboard' : 'Close'}
        </button>
      </Modal>
    </div>
  );
}
// app/game/[id]/session/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './GameSession.module.css';
import { FaArrowLeft, FaPaperPlane, FaDice, FaBookOpen, FaInfoCircle } from 'react-icons/fa';

export default function GameSessionPage({ params }) {
  const router = useRouter();
  const { id: gameId } = params;
  const chatEndRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [activeCharacter, setActiveCharacter] = useState(null);
  const [currentScene, setCurrentScene] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [playerAction, setPlayerAction] = useState('');
  const [actionSuggestions, setActionSuggestions] = useState([]);
  
  useEffect(() => {
    if (!gameId) return;
    
    async function fetchGameData() {
      try {
        const response = await fetch(`/api/games/${gameId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch game data');
        }
        
        const data = await response.json();
        setGameData(data);
        
        // Set active character (in a real app, you might prompt the user to choose)
        if (data.characters && data.characters.length > 0) {
          setActiveCharacter(data.characters[0]);
        }
        
        // Set current scene if it exists in the session
        if (data.gameSession && data.gameSession.current_scene) {
          setCurrentScene(data.gameSession.current_scene);
          setGameHistory(data.gameSession.game_history || []);
        } else {
          // Generate the initial scene
          await generateInitialScene(data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchGameData();
  }, [gameId]);
  
  useEffect(() => {
    // Scroll to bottom of chat when new messages arrive
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameHistory]);
  
  const generateInitialScene = async (data) => {
    if (!data.gameWorld || !data.characters || data.characters.length === 0) {
      setError('Game setup is incomplete. Please create a character first.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/ai/generate-scene', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          gameWorld: data.gameWorld,
          characters: data.characters,
          quests: data.quests,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate initial scene');
      }
      
      const sceneData = await response.json();
      setCurrentScene(sceneData);
      setGameHistory([sceneData]);
      
      // Set action suggestions based on available actions
      if (sceneData.availableActions && sceneData.availableActions.length > 0) {
        setActionSuggestions(sceneData.availableActions);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleActionSubmit = async (e) => {
    e.preventDefault();
    
    if (!playerAction.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // First, evaluate the player's action
      const evalResponse = await fetch('/api/ai/evaluate-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          character: activeCharacter,
          action: playerAction,
          currentScene,
          gameRules: gameData.gameRules,
        }),
      });
      
      if (!evalResponse.ok) {
        const errorData = await evalResponse.json();
        throw new Error(errorData.error || 'Failed to evaluate action');
      }
      
      const actionResult = await evalResponse.json();
      
      // Then, generate the next scene based on the action and its result
      const nextSceneResponse = await fetch('/api/ai/generate-scene', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          gameWorld: gameData.gameWorld,
          characters: gameData.characters,
          previousScene: currentScene,
          playerAction,
          actionResult,
          quests: gameData.quests,
        }),
      });
      
      if (!nextSceneResponse.ok) {
        const errorData = await nextSceneResponse.json();
        throw new Error(errorData.error || 'Failed to generate next scene');
      }
      
      const nextScene = await nextSceneResponse.json();
      
      // Update local state
      setCurrentScene(nextScene);
      setGameHistory(prev => [...prev, nextScene]);
      setPlayerAction('');
      
      // Update action suggestions
      if (nextScene.availableActions && nextScene.availableActions.length > 0) {
        setActionSuggestions(nextScene.availableActions);
      }
      
      // If character stats were updated, refresh the character data
      if (actionResult.characterUpdates && Object.keys(actionResult.characterUpdates).length > 0) {
        const updatedCharacter = {
          ...activeCharacter,
          attributes: {
            ...activeCharacter.attributes,
            ...actionResult.characterUpdates,
          },
        };
        setActiveCharacter(updatedCharacter);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleActionSuggestion = (suggestion) => {
    setPlayerAction(suggestion);
  };
  
  const renderEducationalContent = () => {
    if (!currentScene || !currentScene.educationalContent) return null;
    
    return (
      <div className={styles.educationalContent}>
        <h3>
          <FaInfoCircle className={styles.contentIcon} />
          Learning Moment: {currentScene.educationalContent.topic}
        </h3>
        <p>{currentScene.educationalContent.presentation}</p>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading your adventure...</p>
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
          <Link href={`/game/${gameId}/dashboard`} className={styles.button}>
            Return to Dashboard
          </Link>
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
          <Link href="/" className={styles.button}>
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
  
  if (!activeCharacter) {
    return (
      <div className="container mx-auto p-4">
        <div className={styles.errorContainer}>
          <h2 className={styles.errorTitle}>No Character Available</h2>
          <p className={styles.errorText}>You need to create a character before starting the game.</p>
          <Link href={`/game/${gameId}/characters/create`} className={styles.button}>
            Create a Character
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.gameContainer}>
      <div className={styles.sidebar}>
        <Link href={`/game/${gameId}/dashboard`} className={styles.backLink}>
          <FaArrowLeft /> Back to Dashboard
        </Link>
        
        <div className={styles.characterCard}>
          <h2 className={styles.characterName}>{activeCharacter.name}</h2>
          <p className={styles.characterArchetype}>{activeCharacter.archetype}</p>
          
          <div className={styles.attributesContainer}>
            <h3 className={styles.attributesTitle}>Attributes</h3>
            <div className={styles.attributesList}>
              {Object.entries(activeCharacter.attributes).map(([attr, value]) => (
                <div key={attr} className={styles.attributeItem}>
                  <span className={styles.attributeName}>{attr}</span>
                  <div className={styles.attributeBar}>
                    <div 
                      className={styles.attributeFill} 
                      style={{ width: `${(value / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className={styles.attributeValue}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          
          <button className={styles.characterDetailsButton}>
            <FaBookOpen className={styles.buttonIcon} />
            Character Details
          </button>
        </div>
        
        <div className={styles.questsCard}>
          <h3 className={styles.questsTitle}>Active Quests</h3>
          {gameData.quests && gameData.quests.length > 0 ? (
            <div className={styles.questsList}>
              {gameData.quests.filter(q => q.status === 'active').map(quest => (
                <div key={quest.id} className={styles.questItem}>
                  <h4 className={styles.questTitle}>{quest.title}</h4>
                  <p className={styles.questDescription}>
                    {quest.description.substring(0, 60)}...
                  </p>
                  <div className={styles.questProgress}>
                    <div className={styles.progressLabel}>Progress</div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{ 
                          width: `${(quest.steps.filter(s => s.completed).length / quest.steps.length) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyQuests}>No active quests</p>
          )}
        </div>
      </div>
      
      <div className={styles.mainContent}>
        <div className={styles.gameHeader}>
          <h1 className={styles.gameTitle}>{gameData.game.title}</h1>
          <p className={styles.learningObjective}>{gameData.game.learning_objective}</p>
        </div>
        
        <div className={styles.sceneContainer}>
          {currentScene && (
            <>
              <h2 className={styles.sceneTitle}>{currentScene.title}</h2>
              <div className={styles.sceneDescription}>{currentScene.description}</div>
              
              {currentScene.npcsPresent && currentScene.npcsPresent.length > 0 && (
                <div className={styles.npcsContainer}>
                  {currentScene.npcsPresent.map((npc, index) => (
                    <div key={index} className={styles.npcDialogue}>
                      <div className={styles.npcName}>{npc.name}</div>
                      <div className={styles.dialogueContent}>"{npc.dialogue}"</div>
                    </div>
                  ))}
                </div>
              )}
              
              {renderEducationalContent()}
            </>
          )}
        </div>
        
        <div className={styles.chatContainer}>
          <div className={styles.gameHistory}>
            {gameHistory.map((scene, index) => (
              <div key={index} className={styles.historyEntry}>
                <div className={styles.narratorMessage}>
                  <div className={styles.narratorIcon}>GM</div>
                  <div className={styles.messageContent}>
                    <div className={styles.messageSender}>Game Master</div>
                    <div className={styles.messageText}>{scene.narration}</div>
                  </div>
                </div>
                
                {index < gameHistory.length - 1 && (
                  <div className={styles.playerMessage}>
                    <div className={styles.playerIcon}>
                      {activeCharacter.name.charAt(0)}
                    </div>
                    <div className={styles.messageContent}>
                      <div className={styles.messageSender}>{activeCharacter.name}</div>
                      <div className={styles.messageText}>
                        {index === 0 
                          ? "I begin my adventure..." 
                          : gameHistory[index + 1].playerAction || "I continue exploring..."}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          
          <div className={styles.actionContainer}>
            {actionSuggestions.length > 0 && (
              <div className={styles.suggestionContainer}>
                <div className={styles.suggestionLabel}>Suggested Actions:</div>
                <div className={styles.suggestionButtons}>
                  {actionSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className={styles.suggestionButton}
                      onClick={() => handleActionSuggestion(suggestion)}
                      disabled={isProcessing}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <form onSubmit={handleActionSubmit} className={styles.actionForm}>
              <div className={styles.diceButton} title="Roll dice (coming soon)">
                <FaDice />
              </div>
              <input
                type="text"
                value={playerAction}
                onChange={(e) => setPlayerAction(e.target.value)}
                placeholder="What do you want to do?"
                className={styles.actionInput}
                disabled={isProcessing}
              />
              <button
                type="submit"
                className={styles.actionButton}
                disabled={!playerAction.trim() || isProcessing}
              >
                <FaPaperPlane />
              </button>
            </form>
            
            {isProcessing && (
              <div className={styles.processingIndicator}>
                <div className={styles.typingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className={styles.processingText}>Game Master is responding...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
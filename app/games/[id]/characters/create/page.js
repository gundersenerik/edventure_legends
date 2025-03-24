// app/game/[id]/characters/create/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './CharacterCreation.module.css';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

export default function CharacterCreationPage({ params }) {
  const router = useRouter();
  const { id: gameId } = params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [characterTemplates, setCharacterTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [characterData, setCharacterData] = useState({
    name: '',
    archetype: '',
    background: '',
    attributes: {},
  });
  
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
        
        // Generate character templates based on the game world and rules
        await generateCharacterTemplates(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchGameData();
  }, [gameId]);
  
  const generateCharacterTemplates = async (data) => {
    try {
      const response = await fetch('/api/ai/generate-characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          gameSettings: {
            title: data.game.title,
            learningObjective: data.game.learning_objective,
            ageGroup: data.game.age_group,
            theme: data.game.theme,
            difficultyLevel: data.game.difficulty_level,
          },
          gameWorld: data.gameWorld,
          gameRules: data.gameRules,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate character templates');
      }
      
      const templates = await response.json();
      setCharacterTemplates(templates);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    
    // Initialize character data with template values
    setCharacterData({
      name: '',
      archetype: template.name,
      background: template.backgroundOptions[0].name,
      attributes: template.startingAttributes,
    });
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCharacterData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAttributeChange = (attribute, value) => {
    setCharacterData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attribute]: parseInt(value, 10),
      },
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          name: characterData.name,
          archetype: characterData.archetype,
          background: characterData.background,
          attributes: characterData.attributes,
          // If we want to generate an image, we'd include the template's imagePrompt here
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create character');
      }
      
      // Redirect to game dashboard on success
      router.push(`/game/${gameId}/dashboard`);
    } catch (err) {
      setError(err.message);
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Preparing character options...</p>
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
  
  return (
    <div className="container mx-auto p-4">
      <Link href={`/game/${gameId}/dashboard`} className={styles.backLink}>
        <FaArrowLeft /> Back to Dashboard
      </Link>
      
      <h1 className={styles.pageTitle}>Create a Character</h1>
      <p className={styles.pageSubtitle}>
        For adventure: <span className={styles.adventureTitle}>{gameData.game.title}</span>
      </p>
      
      {!selectedTemplate ? (
        <div className={styles.templateSelection}>
          <h2 className={styles.sectionTitle}>Choose a Character Type</h2>
          
          <div className={styles.templatesGrid}>
            {characterTemplates.map((template, index) => (
              <div 
                key={index} 
                className={styles.templateCard}
                onClick={() => handleSelectTemplate(template)}
              >
                <h3 className={styles.templateTitle}>{template.name}</h3>
                <p className={styles.templateDescription}>{template.description}</p>
                
                <div className={styles.templateDetails}>
                  <div className={styles.templateStrengths}>
                    <h4>Strengths</h4>
                    <ul>
                      {template.strengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className={styles.templateChallenges}>
                    <h4>Challenges</h4>
                    <ul>
                      {template.challenges.map((challenge, i) => (
                        <li key={i}>{challenge}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className={styles.templateAbility}>
                  <h4>Special Ability</h4>
                  <p><strong>{template.specialAbility.name}:</strong> {template.specialAbility.description}</p>
                </div>
                
                <button className={styles.selectButton}>
                  Select This Character
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.characterCreation}>
          <h2 className={styles.sectionTitle}>Customize Your {selectedTemplate.name}</h2>
          
          {error && (
            <div className={styles.errorMessage}>
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={styles.characterForm}>
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Basic Information</h3>
              
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.formLabel}>
                  Character Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={characterData.name}
                  onChange={handleChange}
                  className={styles.formInput}
                  placeholder="Enter a name for your character"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="background" className={styles.formLabel}>
                  Background
                </label>
                <select
                  id="background"
                  name="background"
                  value={characterData.background}
                  onChange={handleChange}
                  className={styles.formSelect}
                  required
                >
                  {selectedTemplate.backgroundOptions.map((bg, index) => (
                    <option key={index} value={bg.name}>
                      {bg.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.backgroundDescription}>
                {selectedTemplate.backgroundOptions.find(bg => bg.name === characterData.background)?.description}
              </div>
            </div>
            
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Attributes</h3>
              <p className={styles.attributesInfo}>
                These are your character's starting attributes. You'll be able to improve them as you play!
              </p>
              
              <div className={styles.attributesGrid}>
                {Object.entries(characterData.attributes).map(([attr, value]) => (
                  <div key={attr} className={styles.attributeItem}>
                    <label htmlFor={`attr-${attr}`} className={styles.attributeLabel}>
                      {attr}
                    </label>
                    <input
                      id={`attr-${attr}`}
                      type="range"
                      min="1"
                      max="10"
                      value={value}
                      onChange={(e) => handleAttributeChange(attr, e.target.value)}
                      className={styles.attributeSlider}
                    />
                    <span className={styles.attributeValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Special Ability</h3>
              <div className={styles.abilityCard}>
                <h4 className={styles.abilityName}>{selectedTemplate.specialAbility.name}</h4>
                <p className={styles.abilityDescription}>{selectedTemplate.specialAbility.description}</p>
                <div className={styles.abilityEducational}>
                  <strong>Educational Value:</strong> {selectedTemplate.specialAbility.educationalAspect}
                </div>
              </div>
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.backButton}
                onClick={() => setSelectedTemplate(null)}
              >
                Choose Different Character
              </button>
              
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={isSaving || !characterData.name}
              >
                <FaSave className={styles.buttonIcon} />
                {isSaving ? 'Creating Character...' : 'Create Character'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
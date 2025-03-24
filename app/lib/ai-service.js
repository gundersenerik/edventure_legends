// app/lib/ai-service.js

// Helper function to make API calls to OpenAI
async function callOpenAI(prompt, model = 'gpt-4o') {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a creative assistant that generates content for an educational roleplaying game for children. Provide your response as valid JSON without any additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  try {
    // Parse the content as JSON
    return JSON.parse(data.choices[0].message.content.trim());
  } catch (error) {
    console.error("Failed to parse OpenAI response as JSON:", data.choices[0].message.content);
    throw new Error("Invalid JSON response from AI");
  }
}

// Generate the game world based on game settings
export async function generateGameWorld(gameSettings) {
  const { title, learningObjective, ageGroup, theme, difficultyLevel } = gameSettings;
  
  const prompt = `
    Create an engaging and educational game world for a roleplaying game with the following parameters:
    
    Title: ${title}
    Learning Objective: ${learningObjective}
    Age Group: ${ageGroup}
    Theme/Setting: ${theme}
    Difficulty Level: ${difficultyLevel}
    
    Please provide:
    1. A rich description of the world (3-4 paragraphs)
    2. 5-7 key locations in this world
    3. 3-5 main NPCs that inhabit this world
    4. A brief history of the world
    5. Current challenges or conflicts in the world that relate to the learning objective
    
    Format the response as a JSON object with the following structure:
    {
      "description": "string",
      "locations": [
        {
          "name": "string",
          "description": "string"
        }
      ],
      "npcs": [
        {
          "name": "string",
          "role": "string",
          "description": "string",
          "motivation": "string"
        }
      ],
      "history": "string",
      "challenges": [
        {
          "name": "string",
          "description": "string",
          "learningConnection": "string"
        }
      ],
      "imagePrompt": "string that describes what the world looks like for image generation"
    }
  `;
  
  try {
    return await callOpenAI(prompt);
  } catch (error) {
    console.error("Error generating game world:", error);
    throw error;
  }
}

// Generate game rules adapted to the age group
export async function generateGameRules(gameSettings) {
  const { ageGroup, difficultyLevel, learningObjective } = gameSettings;
  
  const prompt = `
    Create simple and engaging game rules for a roleplaying game designed for children in the ${ageGroup} age range.
    The game should have a ${difficultyLevel} difficulty level and focus on teaching: ${learningObjective}.
    
    Please provide:
    1. Core mechanics (adapted to be age-appropriate)
    2. Character attributes and skills relevant to the learning objective
    3. Simple rules for challenges and conflict resolution
    4. Rules for progression and rewards
    5. Special mechanics that reinforce the learning objective
    
    Format the response as a JSON object with the following structure:
    {
      "coreMechanics": [
        {
          "name": "string",
          "description": "string",
          "howToUse": "string"
        }
      ],
      "characterAttributes": [
        {
          "name": "string",
          "description": "string",
          "range": "string (e.g., '1-10')"
        }
      ],
      "challengeRules": "string",
      "progressionSystem": "string",
      "learningMechanics": [
        {
          "name": "string",
          "description": "string",
          "educationalBenefit": "string"
        }
      ]
    }
  `;
  
  try {
    return await callOpenAI(prompt);
  } catch (error) {
    console.error("Error generating game rules:", error);
    throw error;
  }
}

// Generate character options based on the game world and rules
export async function generateCharacterOptions(gameSettings, gameWorld, gameRules) {
  const { ageGroup, learningObjective } = gameSettings;
  
  const prompt = `
    Create engaging character options for a children's educational roleplaying game.
    
    Game World Description: ${gameWorld.description}
    Learning Objective: ${learningObjective}
    Age Group: ${ageGroup}
    
    Character Attributes from Game Rules: ${JSON.stringify(gameRules.characterAttributes)}
    
    Please generate 4 different character archetypes that would be appealing to children and relevant to both the game world and learning objectives.
    
    Format the response as a JSON array with the following structure:
    [
      {
        "name": "string (archetype name)",
        "description": "string",
        "strengths": ["string"],
        "challenges": ["string"],
        "startingAttributes": {
          "attributeName1": number,
          "attributeName2": number
        },
        "specialAbility": {
          "name": "string",
          "description": "string",
          "educationalAspect": "string"
        },
        "backgroundOptions": [
          {
            "name": "string",
            "description": "string"
          }
        ],
        "imagePrompt": "string describing what this character type looks like for image generation"
      }
    ]
  `;
  
  try {
    return await callOpenAI(prompt);
  } catch (error) {
    console.error("Error generating character options:", error);
    throw error;
  }
}

// Generate initial quests for the game
export async function generateQuests(gameSettings, gameWorld) {
  const { learningObjective } = gameSettings;
  
  const prompt = `
    Create educational and engaging quests for a children's roleplaying game.
    
    Game World: ${JSON.stringify({
      description: gameWorld.description,
      locations: gameWorld.locations.map(l => l.name),
      npcs: gameWorld.npcs.map(n => n.name)
    })}
    Learning Objective: ${learningObjective}
    
    Please generate 3 quests that will teach aspects of the learning objective while being fun and engaging.
    Each quest should have clear goals, challenges that require both problem-solving and application of 
    the educational content, and meaningful rewards.
    
    Format the response as a JSON array with the following structure:
    [
      {
        "id": "quest1",
        "title": "string",
        "description": "string",
        "learningGoals": ["string"],
        "steps": [
          {
            "order": number,
            "description": "string",
            "challenge": "string",
            "hint": "string",
            "educationalContent": "string (what they'll learn from this step)"
          }
        ],
        "npcsInvolved": ["string (names from the game world)"],
        "locationsInvolved": ["string (locations from the game world)"],
        "rewards": {
          "knowledge": "string (what they learn)",
          "inGameRewards": ["string"]
        },
        "difficulty": "string (easy, medium, hard)"
      }
    ]
  `;
  
  try {
    return await callOpenAI(prompt);
  } catch (error) {
    console.error("Error generating quests:", error);
    throw error;
  }
}

// Generate a new scene based on the current game state
export async function generateNextScene(params) {
  const { 
    gameWorld, 
    characters, 
    previousScene, 
    playerAction, 
    actionResult,
    quests 
  } = params;
  
  // For the initial scene
  if (!previousScene) {
    const prompt = `
      Create an engaging opening scene for a children's educational roleplaying game.
      
      Game World: ${JSON.stringify({
        description: gameWorld.description,
        locations: gameWorld.locations.slice(0, 2).map(l => l.name) // Just use a couple locations
      })}
      
      Characters: ${JSON.stringify(characters.map(c => ({
        name: c.name,
        archetype: c.archetype
      })))}
      
      Active Quests: ${JSON.stringify(quests.map(q => ({
        title: q.title,
        description: q.description
      })))}
      
      This is the very first scene of the adventure. Please create an engaging introduction that:
      1. Sets the scene in a descriptive and age-appropriate way
      2. Introduces a hook related to the first quest
      3. Gives players clear options for what they can do next
      
      Format the response as a JSON object with the following structure:
      {
        "id": "scene1",
        "title": "string",
        "description": "string (vivid description of the scene)",
        "narration": "string (what the game master would say to the players)",
        "npcsPresent": [
          {
            "name": "string",
            "dialogue": "string",
            "attitude": "string"
          }
        ],
        "challenges": [
          {
            "description": "string",
            "difficulty": "string",
            "skillsNeeded": ["string"]
          }
        ],
        "availableActions": ["string"],
        "educationalContent": {
          "topic": "string",
          "presentation": "string (how it's incorporated into the scene)"
        },
        "imagePrompt": "string describing this scene for image generation"
      }
    `;
    
    try {
      return await callOpenAI(prompt);
    } catch (error) {
      console.error("Error generating initial scene:", error);
      throw error;
    }
  }
  
  // For subsequent scenes, based on player action
  const prompt = `
    Create the next scene for a children's educational roleplaying game based on the player's action.
    
    Game World Summary: ${gameWorld.description.substring(0, 200)}...
    
    Previous Scene Title: ${previousScene.title}
    Previous Scene Description: ${previousScene.description}
    
    Player Action: "${playerAction}"
    Action Result: ${JSON.stringify(actionResult || { success: true })}
    
    Please create the next scene that:
    1. Responds directly to the player's action
    2. Moves the story forward
    3. Incorporates educational content related to the learning objectives
    4. Provides new challenges or opportunities
    5. Gives players clear options for what they can do next
    
    Format the response as a JSON object with the following structure:
      {
        "id": "scene${Date.now()}",
        "title": "string",
        "description": "string (vivid description of the scene)",
        "narration": "string (what the game master would say to the players)",
        "npcsPresent": [
          {
            "name": "string",
            "dialogue": "string",
            "attitude": "string"
          }
        ],
        "challenges": [
          {
            "description": "string",
            "difficulty": "string",
            "skillsNeeded": ["string"]
          }
        ],
        "availableActions": ["string"],
        "educationalContent": {
          "topic": "string",
          "presentation": "string (how it's incorporated into the scene)"
        },
        "imagePrompt": "string describing this scene for image generation"
      }
  `;
  
  try {
    return await callOpenAI(prompt);
  } catch (error) {
    console.error("Error generating next scene:", error);
    throw error;
  }
}

// Evaluate a player's action and determine the outcome
export async function evaluatePlayerAction(params) {
  const { character, action, currentScene, gameRules } = params;
  
  const prompt = `
    Evaluate a player's action in a children's educational roleplaying game.
    
    Character: ${JSON.stringify({
      name: character.name,
      archetype: character.archetype,
      attributes: character.attributes
    })}
    
    Current Scene: ${JSON.stringify({
      title: currentScene.title,
      description: currentScene.description, 
      challenges: currentScene.challenges
    })}
    
    Game Rules Summary: ${JSON.stringify({
      attributes: gameRules.characterAttributes.map(a => a.name),
      challengeRules: gameRules.challengeRules.substring(0, 100) + '...'
    })}
    
    Player's Action: "${action}"
    
    Please evaluate this action and determine the outcome. Consider:
    1. Whether the action is possible in the current scene
    2. What skills or attributes from the character would be used
    3. The difficulty level of the action
    4. The educational value of the action
    5. The narrative impact of the action
    
    Format the response as a JSON object with the following structure:
    {
      "success": boolean,
      "description": "string (detailed description of what happens)",
      "educationalValue": {
        "topic": "string",
        "learningPoints": ["string"]
      },
      "characterUpdates": {
        "attributeName1": number (new value),
        "attributeName2": number (new value)
      },
      "questUpdates": [
        {
          "questId": "string",
          "stepCompleted": number,
          "newStatus": "string"
        }
      ],
      "feedback": "string (educational feedback for the player)"
    }
  `;
  
  try {
    return await callOpenAI(prompt);
  } catch (error) {
    console.error("Error evaluating player action:", error);
    throw error;
  }
}

// Generate images for the game world, characters, and scenes using DALL-E
export async function generateImage(prompt) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: `For a children's educational game, create a safe, age-appropriate image: ${prompt}`,
      n: 1,
      size: "1024x1024"
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`DALL-E API error: ${errorData.error?.message || 'Unknown error'}`);
  }
  
  const data = await response.json();
  return data.data[0].url;
}
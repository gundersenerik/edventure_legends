// app/api/games/route.js
import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';

// Create a new game
export async function POST(request) {
  try {
    const gameData = await request.json();
    
    // Get user ID from session (assuming authenticated)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Insert the game data
    const { data, error } = await supabase
      .from('games')
      .insert({
        user_id: userId,
        title: gameData.title,
        learning_objective: gameData.learningObjective,
        age_group: gameData.ageGroup,
        theme: gameData.theme,
        difficulty_level: gameData.difficultyLevel
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get all games for the current user
export async function GET() {
  try {
    // Get user ID from session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Query games for this user
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// app/api/games/[id]/route.js
import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';

// Get a specific game by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Get user ID from session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the game data
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();
    
    if (gameError) {
      return NextResponse.json({ error: gameError.message }, { status: 500 });
    }
    
    // Check if the user has permission to access this game
    if (game.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get the game world data
    const { data: gameWorld, error: worldError } = await supabase
      .from('game_worlds')
      .select('*')
      .eq('game_id', id)
      .single();
    
    // Get the game rules
    const { data: gameRules, error: rulesError } = await supabase
      .from('game_rules')
      .select('*')
      .eq('game_id', id)
      .single();
    
    // Get the characters
    const { data: characters, error: charactersError } = await supabase
      .from('characters')
      .select('*')
      .eq('game_id', id);
    
    // Get the quests
    const { data: quests, error: questsError } = await supabase
      .from('quests')
      .select('*')
      .eq('game_id', id);
    
    // Get the game session
    const { data: gameSession, error: sessionError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('game_id', id)
      .single();
    
    // Compile all the data
    const fullGameData = {
      game,
      gameWorld: gameWorld || null,
      gameRules: gameRules || null,
      characters: characters || [],
      quests: quests || [],
      gameSession: gameSession || null
    };
    
    return NextResponse.json(fullGameData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete a game
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Get user ID from session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the user owns this game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (gameError) {
      return NextResponse.json({ error: gameError.message }, { status: 500 });
    }
    
    if (game.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Delete the game (cascade should handle related records)
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// app/api/ai/generate-world/route.js
import { NextResponse } from 'next/server';
import { generateGameWorld } from '@/app/lib/ai-service';
import supabase from '@/app/lib/supabase';

export async function POST(request) {
  try {
    const { gameId, gameSettings } = await request.json();
    
    // Get user ID from session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the user owns this game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('user_id')
      .eq('id', gameId)
      .single();
    
    if (gameError) {
      return NextResponse.json({ error: gameError.message }, { status: 500 });
    }
    
    if (game.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Generate the game world using AI
    const gameWorld = await generateGameWorld(gameSettings);
    
    // Store the game world in the database
    const { data, error } = await supabase
      .from('game_worlds')
      .insert({
        game_id: gameId,
        description: gameWorld.description,
        locations: gameWorld.locations,
        npcs: gameWorld.npcs,
        history: gameWorld.history,
        challenges: gameWorld.challenges
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // If there's an image prompt, generate an image
    if (gameWorld.imagePrompt) {
      // This would be implemented separately
      // const imageUrl = await generateImage(gameWorld.imagePrompt);
      
      // Update the record with the image URL
      // await supabase
      //   .from('game_worlds')
      //   .update({ image_url: imageUrl })
      //   .eq('id', data.id);
      
      // data.image_url = imageUrl;
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// app/api/ai/generate-rules/route.js
import { NextResponse } from 'next/server';
import { generateGameRules } from '@/app/lib/ai-service';
import supabase from '@/app/lib/supabase';

export async function POST(request) {
  try {
    const { gameId, gameSettings } = await request.json();
    
    // Get user ID from session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the user owns this game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('user_id')
      .eq('id', gameId)
      .single();
    
    if (gameError) {
      return NextResponse.json({ error: gameError.message }, { status: 500 });
    }
    
    if (game.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Generate the game rules using AI
    const gameRules = await generateGameRules(gameSettings);
    
    // Store the game rules in the database
    const { data, error } = await supabase
      .from('game_rules')
      .insert({
        game_id: gameId,
        core_mechanics: gameRules.coreMechanics,
        character_attributes: gameRules.characterAttributes,
        challenge_rules: gameRules.challengeRules,
        progression_system: gameRules.progressionSystem,
        learning_mechanics: gameRules.learningMechanics
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// app/api/ai/generate-quests/route.js
import { NextResponse } from 'next/server';
import { generateQuests } from '@/app/lib/ai-service';
import supabase from '@/app/lib/supabase';

export async function POST(request) {
  try {
    const { gameId, gameSettings, gameWorld } = await request.json();
    
    // Get user ID from session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Generate the quests using AI
    const quests = await generateQuests(gameSettings, gameWorld);
    
    // Store the quests in the database
    const questPromises = quests.map(quest => {
      return supabase
        .from('quests')
        .insert({
          game_id: gameId,
          title: quest.title,
          description: quest.description,
          learning_goals: quest.learningGoals,
          steps: quest.steps,
          npcs_involved: quest.npcsInvolved,
          locations_involved: quest.locationsInvolved,
          rewards: quest.rewards,
          difficulty: quest.difficulty,
          status: 'active'
        });
    });
    
    await Promise.all(questPromises);
    
    // Get all the quests for this game
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('game_id', gameId);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// app/api/ai/generate-scene/route.js
import { NextResponse } from 'next/server';
import { generateNextScene } from '@/app/lib/ai-service';
import supabase from '@/app/lib/supabase';

export async function POST(request) {
  try {
    const { 
      gameId, 
      gameWorld, 
      characters, 
      previousScene, 
      playerAction,
      actionResult,
      quests 
    } = await request.json();
    
    // Generate the next scene using AI
    const scene = await generateNextScene({
      gameWorld,
      characters,
      previousScene,
      playerAction,
      actionResult,
      quests
    });
    
    // If this is the first scene, initialize a game session
    if (!previousScene) {
      // Check if a session already exists
      const { data: existingSession } = await supabase
        .from('game_sessions')
        .select('id')
        .eq('game_id', gameId)
        .single();
      
      if (!existingSession) {
        // Create a new session
        await supabase
          .from('game_sessions')
          .insert({
            game_id: gameId,
            current_scene: scene,
            game_history: [scene],
            active_quests: quests.map(q => q.id)
          });
      } else {
        // Update the existing session
        await supabase
          .from('game_sessions')
          .update({
            current_scene: scene,
            game_history: supabase.sql`array_append(game_history, ${scene}::jsonb)`,
          })
          .eq('game_id', gameId);
      }
    } else {
      // Update the existing session with the new scene
      await supabase
        .from('game_sessions')
        .update({
          current_scene: scene,
          game_history: supabase.sql`array_append(game_history, ${scene}::jsonb)`,
          updated_at: new Date().toISOString()
        })
        .eq('game_id', gameId);
    }
    
    // If there's an image prompt, we would generate an image here
    // if (scene.imagePrompt) {
    //   const imageUrl = await generateImage(scene.imagePrompt);
    //   scene.imageUrl = imageUrl;
    // }
    
    return NextResponse.json(scene);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// app/api/ai/evaluate-action/route.js
import { NextResponse } from 'next/server';
import { evaluatePlayerAction } from '@/app/lib/ai-service';
import supabase from '@/app/lib/supabase';

export async function POST(request) {
  try {
    const { gameId, character, action, currentScene, gameRules } = await request.json();
    
    // Evaluate the player's action using AI
    const result = await evaluatePlayerAction({
      character,
      action,
      currentScene,
      gameRules
    });
    
    // Update character if needed
    if (result.characterUpdates && Object.keys(result.characterUpdates).length > 0) {
      const { error: charError } = await supabase
        .from('characters')
        .update({
          attributes: { ...character.attributes, ...result.characterUpdates },
          updated_at: new Date().toISOString()
        })
        .eq('id', character.id);
      
      if (charError) {
        console.error('Error updating character:', charError);
      }
    }
    
    // Update quests if needed
    if (result.questUpdates && result.questUpdates.length > 0) {
      for (const update of result.questUpdates) {
        const { questId, stepCompleted, newStatus } = update;
        
        const { data: quest, error: questError } = await supabase
          .from('quests')
          .select('*')
          .eq('id', questId)
          .single();
        
        if (questError) {
          console.error('Error retrieving quest:', questError);
          continue;
        }
        
        // Update the quest steps and status
        const updatedSteps = quest.steps.map(step => {
          if (step.order === stepCompleted) {
            return { ...step, completed: true };
          }
          return step;
        });
        
        const { error: updateError } = await supabase
          .from('quests')
          .update({
            steps: updatedSteps,
            status: newStatus || quest.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', questId);
        
        if (updateError) {
          console.error('Error updating quest:', updateError);
        }
      }
    }
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// app/api/ai/generate-image/route.js
import { NextResponse } from 'next/server';
import { generateImage } from '@/app/lib/ai-service';

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    
    // Generate image using AI
    const imageUrl = await generateImage(prompt);
    
    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
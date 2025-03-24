// app/api/ai/generate-characters/route.js
import { NextResponse } from 'next/server';
import { generateCharacterOptions } from '@/app/lib/ai-service';
import supabase from '@/app/lib/supabase';

export async function POST(request) {
  try {
    const { gameId, gameSettings, gameWorld, gameRules } = await request.json();
    
    // Validate required parameters
    if (!gameId || !gameSettings || !gameWorld || !gameRules) {
      return NextResponse.json({ 
        error: 'Missing required parameters: gameId, gameSettings, gameWorld, gameRules' 
      }, { status: 400 });
    }
    
    // Get user ID from session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Check if the user has access to this game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('user_id')
      .eq('id', gameId)
      .single();
    
    if (gameError) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    if (game.user_id !== userId) {
      return NextResponse.json({ error: 'You do not have access to this game' }, { status: 403 });
    }
    
    // Generate character options using AI
    const characterOptions = await generateCharacterOptions(gameSettings, gameWorld, gameRules);
    
    // Enhance the character templates with additional data for improved UI presentation
    const enhancedCharacterOptions = characterOptions.map(character => {
      // Convert attributes to proper format if needed
      const attributes = {};
      
      // Ensure all required game rule attributes exist in character
      if (gameRules.characterAttributes) {
        gameRules.characterAttributes.forEach(attr => {
          // Use the character's starting attribute if available, otherwise default to middle value
          const attrName = attr.name.toLowerCase();
          
          // Parse the range (e.g., "1-10") to get min and max values
          let min = 1;
          let max = 10;
          
          if (attr.range && typeof attr.range === 'string') {
            const rangeParts = attr.range.split('-');
            if (rangeParts.length === 2) {
              min = parseInt(rangeParts[0], 10);
              max = parseInt(rangeParts[1], 10);
            }
          }
          
          // Use the character's attribute value or default to middle of range
          const defaultValue = Math.floor((min + max) / 2);
          attributes[attr.name] = character.startingAttributes?.[attr.name] || 
                                 character.startingAttributes?.[attrName] || 
                                 defaultValue;
        });
      }
      
      return {
        ...character,
        startingAttributes: attributes,
      };
    });
    
    return NextResponse.json(enhancedCharacterOptions);
  } catch (error) {
    console.error('Error generating character options:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
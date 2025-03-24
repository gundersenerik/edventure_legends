// app/api/characters/route.js
import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';

// Create a new character
export async function POST(request) {
  try {
    const { gameId, name, archetype, background, attributes } = await request.json();
    
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
    
    // Create the character
    const { data, error } = await supabase
      .from('characters')
      .insert({
        game_id: gameId,
        user_id: userId,
        name,
        archetype,
        background,
        attributes,
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

// Get all characters for the current user
export async function GET(request) {
  try {
    // Get user ID from session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get game ID from query params
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    
    let query = supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId);
    
    // Filter by game ID if provided
    if (gameId) {
      query = query.eq('game_id', gameId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// app/api/characters/[id]/route.js
import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';

// Get a specific character
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Get user ID from session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get the character
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }
    
    // Check if the user has access to this character
    if (data.user_id !== userId) {
      return NextResponse.json({ error: 'You do not have access to this character' }, { status: 403 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update a character
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { name, attributes } = await request.json();
    
    // Get user ID from session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Check if the character exists and belongs to the user
    const { data: character, error: fetchError } = await supabase
      .from('characters')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }
    
    if (character.user_id !== userId) {
      return NextResponse.json({ error: 'You do not have access to this character' }, { status: 403 });
    }
    
    // Update the character
    const updateData = {};
    if (name) updateData.name = name;
    if (attributes) updateData.attributes = attributes;
    
    const { data, error } = await supabase
      .from('characters')
      .update(updateData)
      .eq('id', id)
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

// Delete a character
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Get user ID from session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Check if the character exists and belongs to the user
    const { data: character, error: fetchError } = await supabase
      .from('characters')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }
    
    if (character.user_id !== userId) {
      return NextResponse.json({ error: 'You do not have access to this character' }, { status: 403 });
    }
    
    // Delete the character
    const { error } = await supabase
      .from('characters')
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
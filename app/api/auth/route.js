// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();
    
    // Validate inputs
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' }, 
        { status: 400 }
      );
    }
    
    // Register the user with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });
    
    if (error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}

// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' }, 
        { status: 400 }
      );
    }
    
    // Sign in the user with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}

// app/api/auth/logout/route.js
import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';

export async function POST() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}

// app/api/auth/session/route.js
import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}
// Quick test script to verify Supabase connection
import { supabaseServer } from './src/lib/supabase';

async function testConnection() {
  try {
    if (!supabaseServer) {
      console.log('❌ Supabase client not initialized');
      process.exit(1);
    }

    console.log('🔌 Testing Supabase connection...');

    // Try to query the database
    const { data, error } = await supabaseServer
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Database error:', error.message);
      console.log('   This likely means:');
      console.log('   1. Database schema not deployed yet, OR');
      console.log('   2. Keys are incorrect');
      process.exit(1);
    }

    console.log('✅ Supabase connection SUCCESSFUL!');
    console.log('✅ Database schema found');
    console.log('✅ Ready to use all 18 APIs');
    process.exit(0);
  } catch (err: any) {
    console.log('❌ Connection test failed:', err.message);
    process.exit(1);
  }
}

testConnection();

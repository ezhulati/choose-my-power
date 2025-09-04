#!/usr/bin/env node

/**
 * Quick test to verify Anthropic API connection
 */

import { ChatAnthropic } from "@langchain/anthropic";

async function testConnection() {
  console.log('🤖 Testing Anthropic API Connection...\n');

  try {
    // Check environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.log('❌ ANTHROPIC_API_KEY not found in environment variables');
      console.log('💡 Make sure to run: export ANTHROPIC_API_KEY=your_key_here');
      process.exit(1);
    }

    console.log('🔑 API Key found (length:', apiKey.length, ')');

    // Initialize Claude client
    const llm = new ChatAnthropic({
      model: "claude-3-5-sonnet-20241022",
      apiKey: apiKey,
      maxTokens: 100,
      temperature: 0.1,
    });

    console.log('🔄 Testing connection to Claude...');

    // Simple test message
    const response = await llm.invoke("Say 'Hello from ChooseMyPower!' in exactly 5 words.");
    
    console.log('✅ Connection successful!');
    console.log('🤖 Claude response:', response.content);
    console.log('\n🎉 Your LangGraph agents are ready to use!');
    
    return true;
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    
    if (error.message.includes('401')) {
      console.log('💡 API key may be invalid. Please check your Anthropic API key.');
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      console.log('💡 Network error. Check your internet connection.');
    }
    
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
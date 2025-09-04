// Quick test to verify the generated ComparePower URL works
import fetch from 'node-fetch';

const testUrl = 'https://orders.comparepower.com/order/service_location?esiid=10443720007962125&plan_id=68b84e0e206770f7c563793b&usage=1000&zip_code=75001';

console.log('🌐 Testing ComparePower URL...');
console.log(`URL: ${testUrl}`);

async function testComparePowerURL() {
  try {
    const response = await fetch(testUrl, {
      method: 'HEAD', // Just check if URL exists without downloading
      redirect: 'manual' // Don't follow redirects
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    
    if (response.status === 200) {
      console.log('✅ URL is working - should not show blank page');
    } else if (response.status >= 300 && response.status < 400) {
      console.log('↪️ URL redirects (normal for ComparePower) - should work');
    } else if (response.status === 404) {
      console.log('❌ URL returns 404 - this would show blank page');
    } else {
      console.log(`⚠️ Unexpected status: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Error testing URL: ${error.message}`);
    console.log('This might be due to CORS or network issues, not necessarily the URL');
  }
}

testComparePowerURL();
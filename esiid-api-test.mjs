import { chromium } from 'playwright';
import fs from 'fs';

async function testESIIDAPI() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Create artifacts directory
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const artifactsDir = `./artifacts/${timestamp}`;
  fs.mkdirSync(artifactsDir, { recursive: true });
  
  try {
    console.log('🧪 Testing ESIID API functionality directly...');
    
    // Test the ESIID search API endpoint
    console.log('🔍 Testing ESIID search API...');
    
    const searchResponse = await page.request.post('http://localhost:4324/api/ercot/search', {
      data: {
        address: '123 Main St',
        zipCode: '75001'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Search API Response Status: ${searchResponse.status()}`);
    
    let searchResults = null;
    if (searchResponse.ok()) {
      searchResults = await searchResponse.json();
      console.log('✅ Search API successful');
      console.log(`📊 Found ${searchResults.length} location(s)`);
      
      if (searchResults.length > 0) {
        console.log('\n🎯 ESIID SEARCH RESULTS:');
        searchResults.forEach((location, index) => {
          console.log(`\n📍 Location ${index + 1}:`);
          console.log(`   - Address: ${location.address}`);
          console.log(`   - ESIID: ${location.esiid || 'Not found'}`);
          console.log(`   - TDSP: ${location.tdsp || 'Not found'}`);
          console.log(`   - Meter Type: ${location.meter_type || 'Not found'}`);
          console.log(`   - City: ${location.city || 'Not found'}`);
          console.log(`   - ZIP: ${location.zip || 'Not found'}`);
        });
        
        // Test validation API for the first result
        if (searchResults[0] && searchResults[0].esiid) {
          console.log('\n🔬 Testing ESIID validation API...');
          
          const validationResponse = await page.request.post('http://localhost:4324/api/ercot/validate', {
            data: {
              esiid: searchResults[0].esiid
            },
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`📡 Validation API Response Status: ${validationResponse.status()}`);
          
          if (validationResponse.ok()) {
            const validationData = await validationResponse.json();
            console.log('✅ Validation API successful');
            console.log('\n🔍 ESIID VALIDATION DETAILS:');
            console.log(`   - ESIID: ${validationData.esiid || 'Not found'}`);
            console.log(`   - Status: ${validationData.status || 'Not found'}`);
            console.log(`   - TDSP: ${validationData.tdsp || 'Not found'}`);
            console.log(`   - Service Type: ${validationData.serviceType || 'Not found'}`);
            console.log(`   - Valid: ${validationData.valid !== undefined ? validationData.valid : 'Not specified'}`);
          } else {
            const errorText = await validationResponse.text();
            console.log('❌ Validation API failed:', errorText);
          }
        }
      }
    } else {
      const errorText = await searchResponse.text();
      console.log('❌ Search API failed:', errorText);
    }
    
    // Create comprehensive test report
    const report = {
      timestamp: new Date().toISOString(),
      testType: 'API Direct Test',
      testAddress: '123 Main St, 75001',
      searchAPI: {
        status: searchResponse.status(),
        success: searchResponse.ok(),
        resultsCount: searchResults ? searchResults.length : 0,
        results: searchResults || []
      },
      esiidVerification: {
        esiidFound: searchResults && searchResults.length > 0 && searchResults[0].esiid,
        esiidCount: searchResults ? searchResults.filter(r => r.esiid).length : 0,
        tdspFound: searchResults && searchResults.length > 0 && searchResults[0].tdsp,
        meterTypeFound: searchResults && searchResults.length > 0 && searchResults[0].meter_type
      },
      testPassed: searchResults && searchResults.length > 0 && searchResults.some(r => r.esiid)
    };
    
    fs.writeFileSync(`${artifactsDir}/api-test-report.json`, JSON.stringify(report, null, 2));
    console.log('\n📝 API test report saved');
    
    console.log('\n📋 API TEST SUMMARY:');
    console.log(`- Search API Status: ${searchResponse.status()}`);
    console.log(`- Locations Found: ${report.searchAPI.resultsCount}`);
    console.log(`- ESIIDs Found: ${report.esiidVerification.esiidCount}`);
    console.log(`- TDSP Data: ${report.esiidVerification.tdspFound ? 'YES' : 'NO'}`);
    console.log(`- Meter Type Data: ${report.esiidVerification.meterTypeFound ? 'YES' : 'NO'}`);
    console.log(`- Test Result: ${report.testPassed ? 'PASSED' : 'FAILED'}`);
    console.log(`- Report: ${artifactsDir}/api-test-report.json`);
    
    // If API works, let's create a simple HTML test page
    if (report.testPassed) {
      console.log('\n🎨 Creating HTML test page to verify ESIID display...');
      
      const htmlTestPage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESIID Display Test</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
    <div class="max-w-2xl mx-auto">
        <h1 class="text-3xl font-bold text-texas-navy mb-6">ESIID Display Test</h1>
        
        <div class="bg-white p-6 rounded-lg shadow-lg">
            <h2 class="text-xl font-semibold mb-4">Test Address Search</h2>
            
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">Address:</label>
                <input id="address" type="text" value="123 Main St" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
            
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">ZIP Code:</label>
                <input id="zipCode" type="text" value="75001" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
            
            <button onclick="searchAddress()" class="bg-texas-red text-white px-6 py-2 rounded-md hover:bg-texas-red-600">
                Search Address
            </button>
            
            <div id="results" class="mt-6"></div>
        </div>
    </div>

    <script>
        async function searchAddress() {
            const address = document.getElementById('address').value;
            const zipCode = document.getElementById('zipCode').value;
            const resultsDiv = document.getElementById('results');
            
            resultsDiv.innerHTML = '<p class="text-gray-600">Searching...</p>';
            
            try {
                const response = await fetch('/api/ercot/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ address, zipCode })
                });
                
                if (response.ok) {
                    const locations = await response.json();
                    displayResults(locations);
                } else {
                    resultsDiv.innerHTML = '<p class="text-red-600">Error: API request failed</p>';
                }
            } catch (error) {
                resultsDiv.innerHTML = '<p class="text-red-600">Error: ' + error.message + '</p>';
            }
        }
        
        function displayResults(locations) {
            const resultsDiv = document.getElementById('results');
            
            if (locations.length === 0) {
                resultsDiv.innerHTML = '<p class="text-gray-600">No locations found.</p>';
                return;
            }
            
            let html = '<h3 class="text-lg font-semibold mb-3">Search Results:</h3>';
            
            locations.forEach((location, index) => {
                html += \`
                    <div class="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
                        <h4 class="font-medium text-gray-900 mb-2">\${location.address}</h4>
                        <div class="flex flex-wrap gap-2">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                \${location.tdsp || 'Unknown TDSP'}
                            </span>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                \${location.meter_type || 'Unknown Type'}
                            </span>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 font-mono">
                                ESIID: \${location.esiid || 'Not Available'}
                            </span>
                        </div>
                    </div>
                \`;
            });
            
            resultsDiv.innerHTML = html;
        }
    </script>
    
    <style>
        .text-texas-navy { color: #002868; }
        .bg-texas-red { background-color: #dc2626; }
        .bg-texas-red:hover { background-color: #b91c1c; }
    </style>
</body>
</html>`;
      
      fs.writeFileSync(`${artifactsDir}/esiid-test.html`, htmlTestPage);
      console.log(`✅ HTML test page created: ${artifactsDir}/esiid-test.html`);
      
      // Test the HTML page
      console.log('\n🌐 Testing HTML page with ESIID display...');
      await page.goto(`file://${process.cwd()}/${artifactsDir}/esiid-test.html`);
      
      // Click the search button
      await page.click('button');
      await page.waitForTimeout(2000);
      
      // Capture screenshot
      await page.screenshot({ path: `${artifactsDir}/html-test-results.png`, fullPage: true });
      console.log('📸 HTML test screenshot captured');
      
      // Check if ESIID is displayed
      const pageContent = await page.textContent('body');
      const hasESIID = pageContent.includes('ESIID:');
      console.log(`🎯 ESIID displayed in HTML test: ${hasESIID ? 'YES' : 'NO'}`);
      
      if (hasESIID) {
        const esiidMatches = pageContent.match(/ESIID:\s*([0-9]+)/g) || [];
        console.log(`📝 ESIID badges found: ${esiidMatches.length}`);
        esiidMatches.forEach((match, i) => {
          console.log(`   ${i + 1}. ${match}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testESIIDAPI().catch(console.error);
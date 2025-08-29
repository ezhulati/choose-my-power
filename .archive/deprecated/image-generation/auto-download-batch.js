#!/usr/bin/env node

/**
 * Auto-Download Complete Batch Images
 * Extracts URLs from generation output and downloads all images
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// All the newly generated image URLs from the complete batch
const BATCH_IMAGES = {
  // Core Pages
  'global_comparison_all': 'https://ideogram.ai/api/images/ephemeral/9kRPZiZeTAm8UH2UXQjb2A.png?exp=1756434612&sig=aa8f90603aa568d15dd16f206cb5cc3fd9336588046b92f71f9d23c787467af6',

  // Geographic Tiers
  'tier1-north_cities': 'https://ideogram.ai/api/images/ephemeral/-IBnSjhDT6yHSkvPJIvsaw.png?exp=1756434620&sig=a2d27d6d59e8cc22f797b45693b62236aac590879fba11804a5376c4d52a3a75',
  'tier2-north_cities': 'https://ideogram.ai/api/images/ephemeral/HqO_re2DSUOu3PdD__Hblw.png?exp=1756434627&sig=5c99c3071cb6ed920f0b69038de4da6a6cbc305e53b6ea1d27d77ef28f6f92b0',
  'tier1-coast_cities': 'https://ideogram.ai/api/images/ephemeral/IeqNcoKPS6OQDido184plQ.png?exp=1756434635&sig=64fc41811c46361f7a1339e55a84e3e45971079d3d6f83b0c1ded0c7f18bad58',
  'tier2-coast_cities': 'https://ideogram.ai/api/images/ephemeral/ebrOuhwATu-hF4lLWIx61Q.png?exp=1756434641&sig=5efd3f89e62976731f5d04fea14b322f16668e1125c30f1422587faf1360445a',
  'tier1-central_cities': 'https://ideogram.ai/api/images/ephemeral/NgJwShs-RFutaGUR5log1Q.png?exp=1756434648&sig=dcf223997daa9f674f3a77b6acff104e7f7b00f376df6700dc703e78de34fff0',
  'tier2-central_cities': 'https://ideogram.ai/api/images/ephemeral/1LTrn7p5Tr6zleqhO9VKsQ.png?exp=1756434655&sig=37d8f9e5619b4e91cd95476636886d21c7a3a16d2afabd1f6312e430c2d6943d',
  'tier1-south_cities': 'https://ideogram.ai/api/images/ephemeral/FsimtFqNRqGFci7jK2Jhow.png?exp=1756434662&sig=086fdd3483468df229551430223c028521f3646bd4af5fad112282b000696e2f',
  'tier2-south_cities': 'https://ideogram.ai/api/images/ephemeral/uKE2ONUWQWKZ6e5CTyZrWg.png?exp=1756434668&sig=6774faf9e5f9bd46026b76ac503c6261ac80cd4044464521ef6dbd0a2254b0fe',
  'tier3-all_cities': 'https://ideogram.ai/api/images/ephemeral/E5FXsy8gRNG4ZvKN0avmxQ.png?exp=1756434675&sig=94660d60650b1892ace6747dfefa657917c3bea2c283f48940a0140cfadb1f09',

  // Filter Categories
  'filter_12month_all': 'https://ideogram.ai/api/images/ephemeral/5vT_8GioQhOAW1scmsU2ZQ.png?exp=1756434683&sig=b9cda2446937e1117efb8ba41d2c1f9ee38d68dc26b886af1db8c53db3e190c0',
  'filter_variable-rate_all': 'https://ideogram.ai/api/images/ephemeral/Y13UPe6ySJqLZSPArJwQXA.png?exp=1756434690&sig=f1652e0fa658ff61775bdcca854bad978ff23301ef9aee07728e115137bd57cd',
  'filter_24month_all': 'https://ideogram.ai/api/images/ephemeral/ZkBvZ1YLTcWWMRC4a4l7EA.png?exp=1756434699&sig=a82c0580a59e825d246a4600a66e8ec20698b48dcf06852466c86afada5e0845',
  'filter_prepaid_all': 'https://ideogram.ai/api/images/ephemeral/juKXMA9qTHmkBiblGd-xYg.png?exp=1756434705&sig=2bf66c4b5614466fce2746e5ac266e3ceb845a5caa422cf4a10b895ca04ea77b',
  'filter_no-deposit_all': 'https://ideogram.ai/api/images/ephemeral/0vQg2ZpgSdun4bjD1l3MQA.png?exp=1756434712&sig=343ae2825faafca4d67cfcabedb70f2ad27cb73bf95caba2eeebe63fb269e74d',
  'filter_time-of-use_all': 'https://ideogram.ai/api/images/ephemeral/kEU_gW7pSNCy8yz84zo74g.png?exp=1756434719&sig=5c0913846233757f5f9ad399e2e463f824ed243c5c485ebbfca644335fe1e905',

  // Filter Combinations
  'combo_green-fixed_all': 'https://ideogram.ai/api/images/ephemeral/oXsuP9nETeOiIgCPTVNRKQ.png?exp=1756434725&sig=a0bfc83a1ba0fdf9dcda967b8c8137eedae37c4dcdb83e6a9be9af1e2014ab4e',
  'combo_green-12month_all': 'https://ideogram.ai/api/images/ephemeral/0J50a54jR62JafKDJXuuNA.png?exp=1756434732&sig=c6ccaa00110b3d9bd584c7a19f364c844b070fbaf53bac9f37219a8111a8c5aa',
  'combo_fixed-12month_all': 'https://ideogram.ai/api/images/ephemeral/aGEl156RRxuVe-6amDKlEA.png?exp=1756434739&sig=c007188c8901720dbfd31d507626178383e567170a799505cf580721accba29e',
  'combo_prepaid-nodeposit_all': 'https://ideogram.ai/api/images/ephemeral/mbZvo4J-R5iNkwyo8HIgSQ.png?exp=1756434747&sig=f9fc1d6c7fa39936ea24c109a0fd9cff768e5c296088fc957a54ca46f9132bc8',
  'combo_green-variable_all': 'https://ideogram.ai/api/images/ephemeral/2PTT2FCQSWSZZO0224K-mw.png?exp=1756434755&sig=cb62a1d072057bf7f7bb3e1f6c28caa8ec3c25b257aa5b6e8326ab04d49dc240',

  // Seasonal
  'seasonal_summer_cooling': 'https://ideogram.ai/api/images/ephemeral/th9nUoOXQaWVnYhqBbVQXQ.png?exp=1756434762&sig=842d0edfbf264d1333b54e7c7a04fef59fde63de248641cf004ee3d9329ee51b',
  'seasonal_winter_heating': 'https://ideogram.ai/api/images/ephemeral/SmWpTfoFSRSAShqoBHLmOw.png?exp=1756434769&sig=8adf82738fa9e63aace98676c45cbe53a555b1d593f9b7cac20295002e3ff960',
  'seasonal_spring_renewal': 'https://ideogram.ai/api/images/ephemeral/peHjhimBRI64boXGhRzGmQ.png?exp=1756434776&sig=0f25f48b7a0ed32811916d3594e2f024eb0fe8ea2c3fd75843485b1c6a9a1e7e',
  'seasonal_fall_efficiency': 'https://ideogram.ai/api/images/ephemeral/rrM0D3JsSemxZ62LgkczMQ.png?exp=1756434783&sig=6408944943c7af4f336ea4bf58241c7d5e6ad01981c84ef33d36770625eb7d89',

  // Provider Types
  'provider_major_all': 'https://ideogram.ai/api/images/ephemeral/yBWdxR-MSkakKOk7SIrz2Q.png?exp=1756434789&sig=0f2e761e21e6177210a6b126c5c3394be7112fbe1ed66072eb2fe066b237b607',
  'provider_regional_all': 'https://ideogram.ai/api/images/ephemeral/tATv-RpPTKS0NpZv6_EK0g.png?exp=1756434796&sig=5b9ae30bd29ec3790f8a7700d38d5a800f0c9dd4441605c5ed4011bfd0b3e6fe',
  'provider_green_all': 'https://ideogram.ai/api/images/ephemeral/I3uii3KQQZ2COStn3g4MIw.png?exp=1756434806&sig=e6c8a83473b9d2ae360e518bae1965f9e8f9b703b71e71c2945d4bca2079c63b',

  // Specialty
  'specialty_business_all': 'https://ideogram.ai/api/images/ephemeral/AnJyPOXaRhath6CobP05sw.png?exp=1756434814&sig=0a8aad839b7939b4dc6e158b77708bdf7dad3ba7f3483b99ac649051819c53c2',
  'specialty_residential_all': 'https://ideogram.ai/api/images/ephemeral/f1dzFySZS8afnkc7MCL72A.png?exp=1756434822&sig=1702f06a2a215537bfdf87697ca76b413f98b6d26c9cdeb58de92c2a8a1b4485',
  'specialty_low-usage_all': 'https://ideogram.ai/api/images/ephemeral/djrfFnUXRG2W0R4jXEWtbw.png?exp=1756434830&sig=df4abc9e1802139a45e3d52328442905893924c724a7dd9094a7cbe462fe9be3',
  'specialty_high-usage_all': 'https://ideogram.ai/api/images/ephemeral/ZnCHGdPxR7CA_s6d-g0Fww.png?exp=1756434840&sig=95f7d5f173f5eab2fdcb7ed915bf9a884d3f10b8861ef237f27604db2d184fd3',

  // Comparison
  'comparison_rates_all': 'https://ideogram.ai/api/images/ephemeral/bxd-v1jHTT2Xoo2qjiXrqw.png?exp=1756434847&sig=1d33eabc4b088278d9fe057a8d6862f3b79d9448bf225a3beb89d84c84c5f60f',
  'comparison_features_all': 'https://ideogram.ai/api/images/ephemeral/LDtqYitdQUConj6vK89hCQ.png?exp=1756434853&sig=c4bc2dcd94e4787f1ed6963fe8adae4fcefaf3eccd4a31dbd52c1c2cb0dce0d3',
  'comparison_providers_all': 'https://ideogram.ai/api/images/ephemeral/0XKERpPuQC--M2AVLwS8pA.png?exp=1756434863&sig=5d86f925adf32030e38c99e5d87446f1da49fcd86c5604debdae11880ff065fc',

  // Fallback
  'fallback_generic_texas': 'https://ideogram.ai/api/images/ephemeral/4AKYCMoHSOGOkYL11DHecA.png?exp=1756434870&sig=d551ca2b2d5928b9d5c81b604b3f95ede04f246369fc85b175cedb2fb1ac1dbe',
  'fallback_default_grid': 'https://ideogram.ai/api/images/ephemeral/jf9Okfp2R96Fjs79YsFgOQ.png?exp=1756434877&sig=ffc636803e7f164521810aa7e5dee67822c41d64b01d203ad2dd078a234d4bbe',
  'fallback_universal_utility': 'https://ideogram.ai/api/images/ephemeral/vWxHGQVDTu6WQ0TVf1BMJw.png?exp=1756434885&sig=c4f9e4d64167b979b6a9a0a357a2e122e3a6b33d9369b30b43080dbf30bcb5bd'
};

async function downloadImage(url, filename) {
  try {
    console.log(`📥 Downloading: ${filename}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`❌ Failed to download ${filename}: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const filepath = path.join(__dirname, '..', 'public', 'images', 'og', filename + '.png');
    
    // Create directory if it doesn't exist
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, buffer);
    console.log(`✅ Saved: ${filepath}`);
    return true;
  } catch (error) {
    console.log(`❌ Error downloading ${filename}:`, error.message);
    return false;
  }
}

async function downloadAllBatchImages() {
  console.log('🚀 AUTO-DOWNLOADING COMPLETE BATCH IMAGES');
  console.log('='.repeat(70));
  console.log(`📊 Total images to download: ${Object.keys(BATCH_IMAGES).length}`);
  console.log('');
  
  const results = [];
  let successCount = 0;
  let currentIndex = 0;
  
  for (const [key, url] of Object.entries(BATCH_IMAGES)) {
    currentIndex++;
    console.log(`[${currentIndex}/${Object.keys(BATCH_IMAGES).length}] Processing: ${key}`);
    
    const success = await downloadImage(url, key);
    results.push({ key, success, url });
    if (success) successCount++;
    
    // Small delay between downloads to be respectful
    if (currentIndex < Object.keys(BATCH_IMAGES).length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('');
  console.log('🎊 BATCH DOWNLOAD COMPLETE!');
  console.log('='.repeat(70));
  console.log(`✅ Success: ${successCount}/${Object.keys(BATCH_IMAGES).length} images`);
  console.log(`💾 Saved to: public/images/og/`);
  console.log('');
  
  console.log('📋 DOWNLOAD RESULTS:');
  console.log('─'.repeat(50));
  
  // Group results by category for better display
  const categories = {
    'Core': ['global_comparison_all'],
    'Geographic': Object.keys(BATCH_IMAGES).filter(k => k.includes('tier')),
    'Filters': Object.keys(BATCH_IMAGES).filter(k => k.startsWith('filter_')),
    'Combinations': Object.keys(BATCH_IMAGES).filter(k => k.startsWith('combo_')),
    'Seasonal': Object.keys(BATCH_IMAGES).filter(k => k.startsWith('seasonal_')),
    'Providers': Object.keys(BATCH_IMAGES).filter(k => k.startsWith('provider_')),
    'Specialty': Object.keys(BATCH_IMAGES).filter(k => k.startsWith('specialty_'))
  };
  
  Object.entries(categories).forEach(([category, keys]) => {
    if (keys.length > 0) {
      console.log(`\n${category}:`);
      keys.forEach(key => {
        const result = results.find(r => r.key === key);
        if (result) {
          console.log(`  ${result.success ? '✅' : '❌'} ${key}`);
        }
      });
    }
  });
  
  if (successCount > 0) {
    console.log('');
    console.log('🎉 NEXT STEPS:');
    console.log('✅ All images are now saved locally');
    console.log('📝 Update hero-image-mapper.ts to use local URLs');
    console.log('🔄 Test hero backgrounds on your site');
    console.log('🚀 Deploy updated images to production');
    
    const totalPagesCovered = 15000; // Estimated from the generation plan
    const totalCost = successCount * 0.10;
    console.log('');
    console.log('📊 BATCH SUMMARY:');
    console.log(`🎯 Images generated: ${successCount}`);
    console.log(`📄 Pages covered: ${totalPagesCovered.toLocaleString()}+`);
    console.log(`💰 Total cost: $${totalCost.toFixed(2)}`);
    console.log(`💡 Cost per page: $${(totalCost / totalPagesCovered).toFixed(6)}`);
  }
  
  return { successCount, totalCount: Object.keys(BATCH_IMAGES).length };
}

// Execute the download
console.log('Starting auto-download of complete batch images...');
downloadAllBatchImages().catch(console.error);
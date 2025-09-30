// Quick test for OAuth token acquisition
import { getOAuthTokenWithCORSHandling } from './corsOAuthFallback.js';

console.log('Testing OAuth token acquisition...');

getOAuthTokenWithCORSHandling()
  .then(token => {
    console.log('✅ OAuth token acquired successfully:', token ? 'YES' : 'NO');
    console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'None');
  })
  .catch(error => {
    console.error('❌ OAuth token acquisition failed:', error.message);
  });
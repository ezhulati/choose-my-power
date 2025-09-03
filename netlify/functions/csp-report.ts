/**
 * CSP Report Handler for ChooseMyPower.org
 * Collects and logs Content Security Policy violations
 */


interface CSPReport {
  "csp-report": {
    "blocked-uri": string;
    "document-uri": string;
    "original-policy": string;
    "referrer": string;
    "violated-directive": string;
    "effective-directive": string;
    "disposition": string;
    "status-code": number;
    "line-number": number;
    "column-number": number;
    "source-file": string;
  };
}

export default async function handler(request: Request) {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  });

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Only accept POST requests for CSP reports
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    const report: CSPReport = await request.json();
    const cspData = report["csp-report"];

    if (!cspData) {
      console.warn('Invalid CSP report format received');
      return new Response(
        JSON.stringify({ error: 'Invalid report format' }),
        { status: 400, headers }
      );
    }

    // Log the CSP violation for monitoring
    console.log('🔒 CSP Violation Report:', {
      blockedUri: cspData["blocked-uri"],
      documentUri: cspData["document-uri"],
      violatedDirective: cspData["violated-directive"],
      effectiveDirective: cspData["effective-directive"],
      sourceFile: cspData["source-file"],
      lineNumber: cspData["line-number"],
      timestamp: new Date().toISOString()
    });

    // Check for common violation patterns that might need attention
    const commonIssues = [
      { pattern: /unsafe-inline/, message: 'Unsafe inline content detected' },
      { pattern: /unpkg\.com/, message: 'External CDN resource blocked' },
      { pattern: /eval/, message: 'Eval usage detected' },
      { pattern: /data:/, message: 'Data URI blocked' }
    ];

    const matchedIssue = commonIssues.find(issue => 
      issue.pattern.test(cspData["blocked-uri"]) ||
      issue.pattern.test(cspData["violated-directive"])
    );

    if (matchedIssue) {
      console.warn(`🚨 CSP Security Alert: ${matchedIssue.message}`, {
        blockedUri: cspData["blocked-uri"],
        violatedDirective: cspData["violated-directive"]
      });
    }

    // Return success response
    return new Response(
      JSON.stringify({
        status: 'received',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: {
          ...headers,
          'X-CSP-Report': 'processed'
        }
      }
    );

  } catch (error) {
    console.error('CSP report processing error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Report processing failed',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: {
          ...headers,
          'X-CSP-Report': 'error'
        }
      }
    );
  }
}
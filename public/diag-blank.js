window.addEventListener('load', function () {
  setTimeout(function () {
    var root = document.getElementById('root') || document.getElementById('app');
    if (!root || !root.innerHTML || root.innerHTML.trim().length === 0) {
      console.error('[BlankScreenDiag] No app content. Check Network for /static/js/* 404 and CSP script-src.');
      console.error('[BlankScreenDiag] Root element:', root);
      console.error('[BlankScreenDiag] Root innerHTML length:', root ? root.innerHTML.length : 'no root');
      
      // Check for script loading errors
      var scripts = document.querySelectorAll('script[src]');
      console.log('[BlankScreenDiag] Script tags found:', scripts.length);
      scripts.forEach(function(script, i) {
        console.log('[BlankScreenDiag] Script', i, ':', script.src);
      });
      
      // Check for CSP violations
      if (window.chrome && window.chrome.runtime) {
        console.log('[BlankScreenDiag] Chrome extension context detected');
      }
    } else {
      console.log('[BlankScreenDiag] App content detected successfully');
    }
  }, 1500);
});
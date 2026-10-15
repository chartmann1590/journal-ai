import React, { useEffect, useState } from 'react';

export default function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const isInstalled = () => {
    const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(display-mode: standalone)') : null;
    const standalone = typeof navigator !== 'undefined' && (navigator.standalone === true);
    return (mq && mq.matches) || standalone;
  };

  useEffect(() => {
    const bipHandler = (e) => {
      if (isInstalled()) return; // don't prompt if already installed
      e.preventDefault();
      setDeferred(e);
      // Do not auto-show; wait for menu button or custom event
    };
    const appInstalledHandler = () => {
      setVisible(false);
      setDeferred(null);
    };
    const showPromptHandler = () => {
      if (isInstalled()) {
        // Already installed; do nothing
        setVisible(false);
        setShowFallback(false);
        return;
      }
      if (deferred) {
        setVisible(true);
        setShowFallback(false);
      } else {
        // No deferred event (e.g., iOS Safari). Show fallback instructions.
        setVisible(true);
        setShowFallback(true);
      }
    };

    window.addEventListener('beforeinstallprompt', bipHandler);
    window.addEventListener('appinstalled', appInstalledHandler);
    window.addEventListener('pwa:show-prompt', showPromptHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', bipHandler);
      window.removeEventListener('appinstalled', appInstalledHandler);
      window.removeEventListener('pwa:show-prompt', showPromptHandler);
    };
  }, [deferred]);

  if (!visible) return null;

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div style={{position:'fixed',bottom:16,left:16,right:16,background:'#111318',color:'#fff',padding:12,borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 4px 16px rgba(0,0,0,0.3)',zIndex:1000}}>
      <div>
        <div style={{fontWeight:'bold'}}>Install Journal AI</div>
        {!showFallback && <div style={{opacity:0.8,fontSize:12}}>Add to your home screen for quick access</div>}
        {showFallback && (
          <div style={{opacity:0.85,fontSize:12,marginTop:2}}>
            {isIOS
              ? 'Open the Share menu and tap "Add to Home Screen".'
              : 'Use your browser menu and choose "Install app" or "Add to Home screen".'}
          </div>
        )}
      </div>
      <div>
        <button onClick={() => setVisible(false)} style={{marginRight:8,background:'transparent',color:'#9AA0A6',border:'1px solid #2a2d31',padding:'6px 10px',borderRadius:6}}>Not now</button>
        {!showFallback && deferred && (
          <button
            onClick={async () => {
              deferred.prompt();
              await deferred.userChoice;
              setVisible(false);
              setDeferred(null);
            }}
            style={{background:'#2962FF',color:'#fff',border:'none',padding:'6px 12px',borderRadius:6}}
          >
            Install
          </button>
        )}
      </div>
    </div>
  );
}

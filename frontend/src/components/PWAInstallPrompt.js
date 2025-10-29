import React, { useEffect, useState } from 'react';

export default function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible || !deferred) return null;

  return (
    <div style={{position:'fixed',bottom:16,left:16,right:16,background:'#111318',color:'#fff',padding:12,borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 4px 16px rgba(0,0,0,0.3)',zIndex:1000}}>
      <div>
        <div style={{fontWeight:'bold'}}>Install Journal AI</div>
        <div style={{opacity:0.8,fontSize:12}}>Add to your home screen for quick access</div>
      </div>
      <div>
        <button onClick={() => setVisible(false)} style={{marginRight:8,background:'transparent',color:'#9AA0A6',border:'1px solid #2a2d31',padding:'6px 10px',borderRadius:6}}>Not now</button>
        <button onClick={async () => { deferred.prompt(); const res = await deferred.userChoice; setVisible(false); setDeferred(null); }} style={{background:'#2962FF',color:'#fff',border:'none',padding:'6px 12px',borderRadius:6}}>Install</button>
      </div>
    </div>
  );
}


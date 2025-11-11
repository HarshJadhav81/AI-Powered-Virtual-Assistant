import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingFromFramer() {
  const iframeRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

        // Intercept all anchor clicks within the iframe
        const handleClick = (e) => {
          const anchor = e.target.closest('a');
          if (!anchor) return;

          const href = anchor.getAttribute('href');
          
          // Map external signup links to internal React routes
          if (href === '/signup' || href?.includes('signup')) {
            e.preventDefault();
            navigate('/signup');
          } 
          // Map demo/404 links to home
          else if (href === './404' || href?.includes('demo')) {
            e.preventDefault();
            navigate('/home');
          }
          // Internal navigation stays internal
          else if (href === './' || href === 'F:\\AI-Powered-Virtual-Assistant\\frontend\\index.html') {
            e.preventDefault();
            navigate('/');
          }
          // Let external links (target="_blank") work normally
        };

        iframeDoc.addEventListener('click', handleClick);

        return () => {
          iframeDoc.removeEventListener('click', handleClick);
        };
      } catch (err) {
        // Cross-origin restrictions - ignore
        console.warn('Cannot access iframe content:', err);
      }
    };

    iframe.addEventListener('load', handleLoad);

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [navigate]);

  return (
    <iframe
      ref={iframeRef}
      src="/HTML/index.html"
      title="Landing Page"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        display: 'block',
        overflow: 'auto'
      }}
    />
  );
}
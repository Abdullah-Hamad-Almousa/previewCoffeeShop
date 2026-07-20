import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useTranslation } from 'react-i18next';

// Turnstile site key — set in .env as EXPO_PUBLIC_TURNSTILE_SITE_KEY
const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA';

interface TurnstileProps {
  onToken: (token: string) => void;
}

const TURNSTILE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <style>
    * { margin: 0; padding: 0; }
    body { display: flex; justify-content: center; align-items: center; min-height: 65px; background: transparent; }
    #cf-turnstile { transform-origin: center; }
  </style>
</head>
<body>
  <div id="cf-turnstile"></div>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <script>
    window.addEventListener('load', function() {
      // Wait for turnstile to be available
      var attempts = 0;
      function tryRender() {
        if (typeof turnstile !== 'undefined') {
          turnstile.render('#cf-turnstile', {
            sitekey: '${SITE_KEY}',
            callback: function(token) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'verified', token }));
            },
            'error-callback': function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'error' }));
            },
            'expired-callback': function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'expired' }));
            }
          });
        } else if (attempts < 20) {
          attempts++;
          setTimeout(tryRender, 200);
        } else {
          window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'error' }));
        }
      }
      tryRender();
    });
  </script>
</body>
</html>
`;

export function Turnstile({ onToken }: TurnstileProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'verified' | 'error'>('loading');
  // Timeout: if Turnstile doesn't respond in 15s, mark as error
  useEffect(() => {
    if (status !== 'loading') return;
    const timer = setTimeout(() => {
      setStatus('error');
      onToken('');
    }, 15000);
    return () => clearTimeout(timer);
  }, [status, onToken]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.event === 'verified' && data.token) {
          setStatus('verified');
          onToken(data.token);
        } else if (data.event === 'error' || data.event === 'expired') {
          setStatus('error');
          onToken('');
        }
      } catch {
        // ignore parse errors
      }
    },
    [onToken]
  );

  // On web platform, use the Turnstile script directly via a WebView as well
  // (react-native-webview works on web with the community adapter, but if not
  // available, we fall back to a simple script injection approach)
  return (
    <View style={styles.container}>
      <WebView
        source={{ html: TURNSTILE_HTML }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        originWhitelist={['*']}
      />
      <View style={styles.statusRow}>
        {status === 'loading' && <Text style={styles.statusText}>{t('auth.captcha.verifying')}</Text>}
        {status === 'verified' && <Text style={[styles.statusText, { color: '#34C759' }]}>{t('auth.captcha.verified')}</Text>}
        {status === 'error' && <Text style={[styles.statusText, { color: '#FF3B30' }]}>{t('auth.captcha.failed')}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 100,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webview: {
    height: 70,
    width: 320,
    backgroundColor: 'transparent',
  },
  statusRow: {
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#999',
  },
});
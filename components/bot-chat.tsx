import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

type Props = {
  botpressUrl: string; // e.g. https://your-botpress-server.com
  botId: string; // bot id configured in Botpress
  onClose?: () => void;
};

const BotChat = forwardRef(function BotChat(
  { botpressUrl, botId, onClose }: Props,
  ref: React.Ref<any>,
) {
  const [error, setError] = useState<string | null>(null);
  const webviewRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    // clears common browser storage and reloads the WebView
    clearHistory: () => {
      try {
        const js = `try{localStorage.clear(); sessionStorage.clear();}catch(e){};true;`;
        if (webviewRef.current && webviewRef.current.injectJavaScript) {
          webviewRef.current.injectJavaScript(js);
        }
        if (webviewRef.current && webviewRef.current.reload) {
          webviewRef.current.reload();
        }
      } catch (e) {
        // ignore
      }
    },
  }));
  // If the provided URL is a full shareable page (includes shareable.html or a configUrl),
  // load it directly in the WebView using uri. Otherwise build an HTML snippet that
  // injects the botpress webchat script from the host.
  const isFullPage = !!botpressUrl && (botpressUrl.includes('shareable.html') || botpressUrl.includes('configUrl='));

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>html,body,#bp-web-widget{height:100%;margin:0;padding:0}</style>
      </head>
      <body>
        <div id="bp-web-widget"></div>
        <script>
          window.botpressWebChat = { botId: '${botId}', host: '${botpressUrl}' };
        </script>
        <script src="${botpressUrl}/assets/modules/channel-web/messages/inject.js"></script>
      </body>
    </html>`;

  // Keep only console forwarding / error forwarding. Removed injected in-page close button (opaque native close is used now).
  const injectedJS = `(function(){function post(prefix,msg){try{window.ReactNativeWebView.postMessage(prefix+msg);}catch(e){} } var _log=console.log; var _err=console.error; console.log=function(){ post('LOG:', Array.prototype.slice.call(arguments).join(' ')); try{_log.apply(console, arguments)}catch(e){} }; console.error=function(){ post('ERR:', Array.prototype.slice.call(arguments).join(' ')); try{_err.apply(console, arguments)}catch(e){} }; window.onerror=function(msg,url,line,col,error){ post('ERR:', msg+' at '+url+':'+line+':'+col); }; setTimeout(function(){},2000); setTimeout(function(){},5000); setTimeout(function(){},8000); true; })();`;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        source={isFullPage ? { uri: botpressUrl } : { html }}
        ref={webviewRef}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        userAgent={"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"}
        mixedContentMode="always"
        startInLoadingState
        onError={(e) => setError(e.nativeEvent.description || 'WebView error')}
        onHttpError={(e) => setError(`HTTP error ${e.nativeEvent.statusCode}`)}
        onMessage={(e) => {
          try {
            const data = e.nativeEvent.data || '';
            if (data.startsWith('LOG:') || data.startsWith('ERR:')) setError((prev) => (prev ? prev + '\n' + data : data));
          } catch (err) {
            // ignore
          }
        }}
        injectedJavaScript={injectedJS}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" />
          </View>
        )}
        style={styles.webview}
      />

      {error ? (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>WebView error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
  });


const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorOverlay: { position: 'absolute', top: 20, left: 12, right: 12, backgroundColor: 'rgba(255,0,0,0.9)', padding: 10, borderRadius: 6 },
  errorTitle: { color: '#fff', fontWeight: '700', marginBottom: 6 },
  errorText: { color: '#fff' },
});

export default BotChat;

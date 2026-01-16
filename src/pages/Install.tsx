import { useState, useEffect } from 'react';
import { Download, Smartphone, Check, Share, MoreVertical, Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Detect Android
    const isAndroidDevice = /Android/.test(navigator.userAgent);
    setIsAndroid(isAndroidDevice);

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b safe-top">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/eidikos-logo.jpeg" 
                alt="Eidikos Kouzina" 
                className="w-12 h-12 rounded-xl shadow-lg object-cover"
              />
              <div>
                <h1 className="text-xl font-display font-bold text-gradient">Eidikos Kouzina</h1>
                <p className="text-xs text-muted-foreground">Install App</p>
              </div>
            </div>
            <Link to="/order">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-lg">
        {isInstalled ? (
          <Card className="border-2 border-green-500/50 bg-green-500/5">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-display">App Installed!</CardTitle>
              <CardDescription>
                Eidikos Kouzina is installed on your device. You can access it from your home screen.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/order">
                <Button className="gradient-gold text-white">
                  Start Ordering
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Install Card */}
            <Card className="border-2">
              <CardHeader className="text-center">
                <div className="w-20 h-20 mx-auto mb-4">
                  <img 
                    src="/eidikos-logo.jpeg" 
                    alt="Eidikos Kouzina" 
                    className="w-full h-full rounded-2xl shadow-lg object-cover"
                  />
                </div>
                <CardTitle className="text-2xl font-display">Install Eidikos Kouzina</CardTitle>
                <CardDescription>
                  Add our app to your home screen for the best experience - quick access, offline support, and faster loading.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Android/Chrome install button */}
                {deferredPrompt && (
                  <Button 
                    onClick={handleInstall} 
                    className="w-full gradient-gold text-white h-12 text-lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Install App
                  </Button>
                )}

                {/* iOS Instructions */}
                {isIOS && !deferredPrompt && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      To install on iPhone/iPad:
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Share className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Step 1</p>
                          <p className="text-xs text-muted-foreground">Tap the Share button in Safari</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Plus className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Step 2</p>
                          <p className="text-xs text-muted-foreground">Scroll down and tap "Add to Home Screen"</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Check className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Step 3</p>
                          <p className="text-xs text-muted-foreground">Tap "Add" to confirm</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Android fallback instructions */}
                {isAndroid && !deferredPrompt && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      To install on Android:
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <MoreVertical className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Step 1</p>
                          <p className="text-xs text-muted-foreground">Tap the menu (⋮) in Chrome</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Smartphone className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Step 2</p>
                          <p className="text-xs text-muted-foreground">Tap "Add to Home screen" or "Install app"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Desktop instructions */}
                {!isIOS && !isAndroid && !deferredPrompt && (
                  <div className="text-center text-sm text-muted-foreground">
                    <p>Open this page on your mobile device to install the app, or look for the install icon in your browser's address bar.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Why Install?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Quick Access</p>
                    <p className="text-xs text-muted-foreground">Launch instantly from your home screen</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Works Offline</p>
                    <p className="text-xs text-muted-foreground">Browse the menu even without internet</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Faster Loading</p>
                    <p className="text-xs text-muted-foreground">App assets are cached for speed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

# Expo Expert Scaffold (Mobile Expert)

Padrão profissional para aplicativos móveis cross-platform usando Expo e NativeWind v4+.

## 📁 Estrutura de Pastas

```text
/app               # Expo Router (Filesystem-based Routing)
  /(auth)          # Grupo de rotas de autenticação
  /(tabs)          # Grupo de rotas principais com Tabs
  _layout.tsx      # Root Layout (Providers e Fontes)
  index.tsx        # Primeira tela do App
/components        # Componentes UI (Shared)
/hooks             # React Hooks específicos para Mobile
/constants         # Cores, espaçamentos e temas
/services          # Integrações com API
/assets            # Imagens e ícones
tailwind.config.js # Configuração do NativeWind
```

## 🛠️ Comandos de Inicialização

1. **Criação**: `npx create-expo-app@latest ./ --template tabs`
2. **NativeWind (Tailwind)**: `npm install nativewind@latest tailwindcss@latest react-native-reanimated react-native-safe-area-context`
3. **Icons/Animation**: `npm install lucide-react-native moti`

## 📄 Boilerplate: app/(tabs)/index.tsx

```tsx
import { View, Text } from 'react-native';
import { MotiView } from 'moti';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-slate-950 items-center justify-center p-6">
      <MotiView 
        from={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring' }}
      >
        <Text className="text-4xl font-black text-white text-center">
          wOs Mobile Expert
        </Text>
        <Text className="text-blue-400 text-lg font-bold text-center mt-2">
          Built with Expo & AI
        </Text>
      </MotiView>
    </View>
  );
}
```

## 📄 Boilerplate: app/_layout.tsx

```tsx
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
```

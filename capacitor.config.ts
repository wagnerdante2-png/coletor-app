import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.operacao.coletor',
  appName: 'Coletor Operacional',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;

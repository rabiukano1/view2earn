import { Paths, File } from 'expo-file-system';
import { AdConfig } from '@/context/MockDataContext';

function getConfigFile(): File {
  return new File(Paths.document, 'adConfig.json');
}

export async function loadAdConfig(): Promise<AdConfig | null> {
  try {
    const file = getConfigFile();
    if (!file.exists) return null;
    const data = await file.text();
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveAdConfig(config: AdConfig): Promise<void> {
  try {
    const file = getConfigFile();
    file.write(JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save ad config:', e);
  }
}

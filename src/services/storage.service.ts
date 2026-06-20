import { supabase } from '../lib/supabase';

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

export const storageService = {
  async uploadAvatar(userId: string, base64Uri: string) {
    const base64 = base64Uri.includes('base64,')
      ? base64Uri.split('base64,')[1]
      : base64Uri;
    const filePath = `avatars/${userId}.png`;
    const fileBytes = base64ToUint8Array(base64);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, fileBytes, {
        contentType: 'image/png',
        upsert: true,
      });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  },

  async deleteAvatar(userId: string) {
    const filePath = `avatars/${userId}.png`;
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);
    if (error) throw error;
  },
};

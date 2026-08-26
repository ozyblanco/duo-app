import { supabase } from '@/lib/supabase';

export async function uploadReceipt(file: File, coupleId?: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = coupleId ? `${coupleId}/${cleanFileName}` : cleanFileName;

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl || null;
  } catch (err) {
    console.error('Error al subir comprobante a Supabase Storage:', err);
    return null;
  }
}
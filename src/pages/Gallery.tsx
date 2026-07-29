import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClient } from '../contexts/ClientContext';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { applyWatermark } from '../lib/watermark';

export function Gallery() {
  const { role } = useAuth();
  const { activeBusiness } = useClient();
  const canUpload = role === 'master' || role === 'manager' || role === 'staff';
  
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadPhotos() {
       if (!activeBusiness) return;
       const { data } = await supabase
         .from('manifest_gallery')
         .select('*')
         .eq('client_id', activeBusiness.slug)
         .order('created_at', { ascending: false });
       if (data) setPhotos(data);
    }
    loadPhotos();
  }, [activeBusiness]);

  
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBusiness) return;
    
    setUploading(true);
    setUploadStatus(null);
    
    try {
      const settings = activeBusiness.theme?.watermark;
      
      // Process images
      const [fullBlob, thumbBlob] = await Promise.all([
        applyWatermark(file, settings, false),
        applyWatermark(file, settings, true)
      ]);

      // Using a local object URL for preview instead of actual Storage upload
      // because we don't have a Storage bucket explicitly defined/configured in instructions.
      // But we will insert into DB so it persists for this session/mock.
      const fullUrl = await blobToBase64(fullBlob);
      const thumbUrl = await blobToBase64(thumbBlob);

      const { data, error } = await supabase
        .from('manifest_gallery')
        .insert({
          client_id: activeBusiness.slug,
          photo_url: fullUrl,
          thumbnail_url: thumbUrl,
          caption: 'Uploaded Photo'
        })
        .select('*')
        .single();
        
      if (error) throw new Error(error.message);
      
      if (data) {
         setPhotos(prev => [data, ...prev]);
         setUploadStatus({ type: 'success', message: 'Photo uploaded ✓' });
      }
    } catch (err: any) {
      setUploadStatus({ type: 'error', message: err.message || 'Upload failed' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              🖼️ Gallery
              <span className="text-sm font-normal text-[#8892a8] ml-2">Watermarked product photos</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {uploadStatus && (
              <span className={`text-sm font-medium ${uploadStatus.type === 'success' ? 'text-[#7ddfb0]' : 'text-[#df8f7d]'}`}>
                {uploadStatus.message}
              </span>
            )}
            
            {canUpload && (
              <>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*"
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-[#0f2a3b] hover:bg-[#1a3a5c] text-[#7db8df] border border-[#1a3a4b] px-4 py-2 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <span>{uploading ? '⏳' : '📤'}</span> {uploading ? 'Processing...' : 'Upload Photo'}
                </button>
              </>
            )}
          </div>
        </div>

        {canUpload && (
          <div className="bg-[#0f2a1a] border border-[#1a3a2a] rounded-xl p-4 flex items-center gap-3 text-sm text-[#7ddfb0]">
            <span className="text-lg">ℹ️</span>
            <div>
              <strong>Upload contract:</strong> Auto-saves on complete, applies watermark instantly. <em>No store/entrance shots.</em>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-8 mt-6">
          {canUpload && (
            <div 
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`w-full max-w-[800px] ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#7db8df] hover:bg-[#0f2a3b]'} py-16 bg-[#0e1520] border-2 border-dashed border-[#2a3a4a] rounded-2xl text-center transition-colors shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center`}
            >
              <div className="text-4xl mb-3">{uploading ? '⏳' : '📸'}</div>
              <h3 className="text-lg font-semibold text-[#e6edf5]">{uploading ? 'Processing Image...' : 'Upload New Photo Card'}</h3>
              <p className="text-sm text-[#5a6a7a] mt-2 max-w-md px-4">
                Tap here to open your device's gallery or camera. The image will be watermarked and added to your feed.
              </p>
            </div>
          )}

          {photos.length === 0 && !canUpload ? (
            <div className="w-full max-w-[800px] py-20 bg-[#111a24] border border-[#1e2a36] rounded-2xl text-center text-[#5a6a7a]">
              <div className="text-4xl mb-4">🖼️</div>
              <p>No photos found in this gallery.</p>
            </div>
          ) : (
            photos.map((photo) => (
              <div key={photo.id} className="w-full max-w-[800px] bg-[#111a24] border border-[#1e2a36] rounded-2xl overflow-hidden flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
                <div className="w-full bg-[#0a0f14] flex items-center justify-center p-4">
                   <img src={photo.photo_url || photo.thumbnail_url} alt="Gallery item" className="max-w-full h-auto max-h-[600px] object-contain rounded-lg" />
                </div>
                <div className="p-6 bg-[#111a24] border-t border-[#1e2a36] flex items-center justify-between">
                   <div>
                     <h3 className="text-lg font-semibold text-white">{photo.caption || 'Uploaded Photo'}</h3>
                     <p className="text-sm text-[#5a6a7a] mt-1">Uploaded {new Date(photo.created_at).toLocaleDateString()}</p>
                   </div>
                   <button className="bg-[#0f2a3b] hover:bg-[#1a3a5c] text-[#7db8df] border border-[#1a3a4b] px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                     Feature on Display Floor
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}

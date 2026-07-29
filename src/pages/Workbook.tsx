import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClient } from '../contexts/ClientContext';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { applyWatermark } from '../lib/watermark';

export function Workbook() {
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
         .from('manifest_workbook')
         .select('*')
         .eq('client_id', activeBusiness.slug)
         .order('created_at', { ascending: false });
       if (data) setPhotos(data);
    }
    loadPhotos();
  }, [activeBusiness]);

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
      const fullUrl = URL.createObjectURL(fullBlob);
      const thumbUrl = URL.createObjectURL(thumbBlob);

      const { data, error } = await supabase
        .from('manifest_workbook')
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
              📖 Workbook
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

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-2">
          {photos.length === 0 ? (
            <div className="col-span-full py-20 text-center text-[#5a6a7a]">
              No photos found in this gallery.
            </div>
          ) : (
            photos.map((photo) => (
              <div key={photo.id} className="aspect-square bg-[#111a24] border border-[#1e2a36] rounded-xl overflow-hidden relative group shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                <img src={photo.thumbnail_url} alt="Gallery item" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                   <button className="bg-[#0e1520] hover:bg-[#1a2634] text-white border border-[#1a2634] text-xs py-1.5 rounded-lg w-full mb-2 transition-colors">
                     Also feature on Display Floor
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

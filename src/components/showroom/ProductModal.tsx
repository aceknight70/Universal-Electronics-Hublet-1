import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Upload, Save, Edit3, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useClient } from '../../contexts/ClientContext';
import { supabase } from '../../lib/supabase';
import { resizeImage } from '../../lib/image';

type PhotoKeys = 'manual_view' | 'front' | 'left_side' | 'right_side' | 'back';
const PHOTO_LABELS: Record<PhotoKeys, string> = {
  manual_view: 'Manual View',
  front: 'Front',
  left_side: 'Left Side',
  right_side: 'Right Side',
  back: 'Back'
};
const PHOTO_KEYS = Object.keys(PHOTO_LABELS) as PhotoKeys[];

export function ProductModal({ product, isOpen, onClose }: { product: any, isOpen: boolean, onClose: () => void }) {
  const { role } = useAuth();
  const { activeBusiness } = useClient();
  const isStaffTier = ['staff', 'manager', 'master'].includes(role);

  const [editMode, setEditMode] = useState(false);
  
  // Local state for mock photos
  const [photos, setPhotos] = useState<Record<PhotoKeys, string | null>>({
    manual_view: null,
    front: null,
    left_side: null,
    right_side: null,
    back: null
  });

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingKey, setUploadingKey] = useState<PhotoKeys | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setPhotos({
        manual_view: product.custom_photos?.manual_view || null,
        front: product.custom_photos?.front || null,
        left_side: product.custom_photos?.left_side || null,
        right_side: product.custom_photos?.right_side || null,
        back: product.custom_photos?.back || null
      });
    }
  }, [product]);

  // Close handler to reset state
  const handleClose = () => {
    setEditMode(false);
    setCurrentPhotoIndex(0);
    onClose();
  };

  if (!isOpen || !product) return null;

  const currentPhotoKey = PHOTO_KEYS[currentPhotoIndex];
  const hasCurrentPhoto = !!photos[currentPhotoKey];

  const handleUploadClick = (key: PhotoKeys) => {
    setUploadingKey(key);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingKey) return;
    
    try {
      const base64Str = await resizeImage(file, 800, 800);
      setPhotos(prev => ({ ...prev, [uploadingKey]: base64Str }));
    } catch (err) {
      alert("Failed to process image.");
    } finally {
      setUploadingKey(null);
      if (fileInputRef.current) {
         fileInputRef.current.value = '';
      }
    }
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      if (product.id) {
         const { error } = await supabase.from('manifest_inventory').update({ custom_photos: photos }).eq('id', product.id);
         if (error) throw error;
         
         // mutate local product obj so UI updates without reload
         product.custom_photos = photos;
         
         window.dispatchEvent(new CustomEvent('catalog_updated'));
      }
      setEditMode(false);
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-[#111] border border-[#333] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10 max-h-[90vh]"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
          {/* Close Button */}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 p-2 bg-black/50 text-white hover:bg-black/80 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {!editMode ? (
            /* CARD 2: CUSTOMER VIEW */
            <>
              {/* Photo Carousel Area */}
              <div className="w-full md:w-3/5 bg-black relative flex flex-col items-center justify-center min-h-[300px] border-b md:border-b-0 md:border-r border-[#333]">
                {hasCurrentPhoto ? (
                  <img src={photos[currentPhotoKey]!} alt={`${product.name} ${PHOTO_LABELS[currentPhotoKey]}`} className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#555] p-8 text-center">
                    <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                    {isStaffTier ? (
                      <>
                        <p className="mb-4 text-white">No photo yet for {PHOTO_LABELS[currentPhotoKey]}</p>
                        <button 
                          onClick={() => setEditMode(true)}
                          className="bg-[#222] hover:bg-[#333] text-white px-4 py-2 rounded font-medium transition-colors border border-[#444]"
                        >
                          Upload Now
                        </button>
                      </>
                    ) : (
                      <p>Image coming soon</p>
                    )}
                  </div>
                )}

                {/* Carousel Controls */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none">
                  <button 
                    className="pointer-events-auto p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                    onClick={() => setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : PHOTO_KEYS.length - 1))}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    className="pointer-events-auto p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                    onClick={() => setCurrentPhotoIndex(prev => (prev < PHOTO_KEYS.length - 1 ? prev + 1 : 0))}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                {/* Indicators & Label */}
                <div className="absolute bottom-4 inset-x-0 flex flex-col items-center">
                  <div className="bg-black/70 px-3 py-1 rounded-full text-xs text-white mb-2 font-medium tracking-wide">
                    {PHOTO_LABELS[currentPhotoKey]}
                  </div>
                  <div className="flex gap-1.5">
                    {PHOTO_KEYS.map((key, idx) => (
                      <div 
                        key={key} 
                        className={`w-2 h-2 rounded-full ${idx === currentPhotoIndex ? 'bg-white' : 'bg-white/30'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Details Area */}
              <div className="w-full md:w-2/5 p-6 md:p-8 flex flex-col">
                <div className="text-xs font-bold uppercase tracking-wider text-[#7db8df] mb-2">{product.category}</div>
                <h2 className="text-2xl font-bold text-white mb-1">{product.name}</h2>
                <div className="text-[#888] mb-6">{product.brand}</div>
                
                <div className="space-y-4 flex-grow text-sm text-[#ccc]">
                  <p><strong>Specifications:</strong> Detailed specs would appear here, pulled from the shared catalog or overridden locally.</p>
                  <p><strong>SKU:</strong> MOCK-SKU-1234</p>
                  <p><strong>Availability:</strong> In Stock</p>
                </div>

                <div className="mt-8 pt-6 border-t border-[#333] flex items-end justify-between">
                  <div>
                    <div className="text-xs text-[#888] mb-1">Price</div>
                    <div className="text-3xl font-bold text-white">{product.price}</div>
                  </div>
                  {isStaffTier && (
                    <button 
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-2 bg-[#2a2a2a] hover:bg-[#333] text-white px-4 py-2 rounded font-medium transition-colors border border-[#444]"
                    >
                      <Edit3 className="w-4 h-4" /> Edit
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* CARD 3: STAFF DETAIL/UPLOAD VIEW */
            <div className="w-full p-6 md:p-8 flex flex-col md:flex-row gap-8 overflow-y-auto max-h-full">
              <div className="w-full md:w-1/2 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 border-b border-[#333] pb-2">Product Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-[#888] mb-1">Product Name</label>
                      <input type="text" defaultValue={product.name} className="w-full bg-[#222] border border-[#444] rounded p-2 text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#888] mb-1">Price</label>
                      <input type="text" defaultValue={product.price} className="w-full bg-[#222] border border-[#444] rounded p-2 text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#888] mb-1">Specifications</label>
                      <textarea rows={4} className="w-full bg-[#222] border border-[#444] rounded p-2 text-white text-sm" defaultValue="Mock specifications..."></textarea>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-[#333] pb-2">Custom Photos (Local)</h3>
                <p className="text-xs text-[#888] mb-4">These photos are stored locally for your business ({activeBusiness?.name}) and will not affect the shared catalog.</p>
                <div className="grid grid-cols-2 gap-3">
                  {PHOTO_KEYS.map((key) => (
                    <div key={key} className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 flex flex-col items-center text-center">
                      <div className="text-xs font-semibold text-[#ccc] mb-2">{PHOTO_LABELS[key]}</div>
                      {photos[key] ? (
                        <div className="relative w-full aspect-square mb-2 group">
                          <img src={photos[key]!} alt={key} className="w-full h-full object-cover rounded border border-[#444]" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                            <button onClick={() => handleUploadClick(key)} className="bg-white text-black text-xs px-2 py-1 rounded font-bold">Replace</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => handleUploadClick(key)} className="w-full aspect-square bg-[#222] hover:bg-[#333] border border-dashed border-[#555] rounded flex flex-col items-center justify-center text-[#888] transition-colors mb-2">
                          <Upload className="w-5 h-5 mb-1" />
                          <span className="text-[0.65rem]">Upload</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-[#151515] border-t border-[#333] p-4 flex justify-end gap-3 rounded-b-2xl">
                <button onClick={() => setEditMode(false)} className="px-4 py-2 text-sm text-[#ccc] hover:text-white transition-colors">Cancel</button>
                <button onClick={saveChanges} disabled={isSaving} className="flex items-center gap-2 bg-[#7db8df] hover:bg-[#6aa4c8] text-[#0a1929] px-6 py-2 rounded font-bold transition-colors disabled:opacity-50">
                  <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

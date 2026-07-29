const fs = require('fs');

let content = fs.readFileSync('src/components/showroom/ProductModal.tsx', 'utf8');

content = content.replace("import React, { useState } from 'react';", "import React, { useState, useEffect, useRef } from 'react';");
content = content.replace("import { useClient } from '../../contexts/ClientContext';", "import { useClient } from '../../contexts/ClientContext';\nimport { supabase } from '../../lib/supabase';\nimport { resizeImage } from '../../lib/image';");

const fileInputHTML = `          <input 
            type="file" 
            ref={fileInputRef} 
            hidden 
            accept="image/*" 
            onChange={handleFileChange} 
          />`;

content = content.replace("          {/* Close Button */}", `${fileInputHTML}\n          {/* Close Button */}`);

const uploadHandlerLogic = `  const fileInputRef = useRef<HTMLInputElement>(null);
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
  };`;

content = content.replace(/  const handleUploadClick = \(key: PhotoKeys\) => {[\s\S]*?  const saveChanges = \(\) => {[\s\S]*?  };/m, uploadHandlerLogic);

fs.writeFileSync('src/components/showroom/ProductModal.tsx', content);

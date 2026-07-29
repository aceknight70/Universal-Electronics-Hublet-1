import fs from 'fs';
let content = fs.readFileSync('src/pages/Gallery.tsx', 'utf8');

// 1. Add blobToBase64 helper
const blobHelper = `
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
`;

content = content.replace(/const handleFileChange = async/, blobHelper + '\n  const handleFileChange = async');

// 2. Change fullUrl and thumbUrl generation
const oldUrlGeneration = `      const fullUrl = URL.createObjectURL(fullBlob);
      const thumbUrl = URL.createObjectURL(thumbBlob);`;
const newUrlGeneration = `      const fullUrl = await blobToBase64(fullBlob);
      const thumbUrl = await blobToBase64(thumbBlob);`;

content = content.replace(oldUrlGeneration, newUrlGeneration);

// 3. Change rendering layout
const oldRendering = `<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-2">
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
        </div>`;

const newRendering = `<div className="flex flex-col items-center gap-8 mt-6">
          {photos.length === 0 ? (
            <div className="w-full max-w-[800px] py-20 bg-[#111a24] border border-[#1e2a36] rounded-2xl text-center text-[#5a6a7a]">
              <div className="text-4xl mb-4">🖼️</div>
              <p>No photos found in this gallery.</p>
              <p className="text-sm mt-2">Click "Upload Photo" above to add your first gallery card.</p>
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
        </div>`;

content = content.replace(oldRendering, newRendering);

fs.writeFileSync('src/pages/Gallery.tsx', content);

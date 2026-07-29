import fs from 'fs';
let content = fs.readFileSync('src/pages/Gallery.tsx', 'utf8');

const oldRendering = `<div className="flex flex-col items-center gap-8 mt-6">
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

const newRendering = `<div className="flex flex-col items-center gap-8 mt-6">
          {canUpload && (
            <div 
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={\`w-full max-w-[800px] \${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#7db8df] hover:bg-[#0f2a3b]'} py-16 bg-[#0e1520] border-2 border-dashed border-[#2a3a4a] rounded-2xl text-center transition-colors shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center\`}
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
        </div>`;

content = content.replace(oldRendering, newRendering);
fs.writeFileSync('src/pages/Gallery.tsx', content);
